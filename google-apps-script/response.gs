/**
 * @fileoverview Centralized Response Builder Layer for Google Apps Script REST interface.
 * @license Apache-2.0
 */

/**
 * Builds a standardized API success response payload.
 * 
 * @param {Object} data - The core payload to return
 * @param {string} [message="Request completed successfully."] - Standard status message
 * @return {Object} Response object ready for JSON stringification
 */
function buildSuccessResponse(data, message) {
  return {
    success: true,
    message: message || "Request completed successfully.",
    data: data,
    version: CONFIG.API_VERSION,
    timestamp: new Date().toISOString()
  };
}

/**
 * Builds a standardized API error response payload.
 * 
 * @param {string} message - Human readable error reason
 * @param {string} errorCode - Machine-readable error constant from CONSTANTS.ERROR_CODES
 * @param {Array<string>} [validationErrors] - Detail arrays for schema-level failures
 * @return {Object} Response object ready for JSON stringification
 */
function buildErrorResponse(message, errorCode, validationErrors) {
  return {
    success: false,
    message: message,
    errorCode: errorCode || CONSTANTS.ERROR_CODES.SRV_INTERNAL_FAILURE,
    validationErrors: validationErrors || [],
    version: CONFIG.API_VERSION,
    timestamp: new Date().toISOString()
  };
}

/**
 * Formats a payload object into a Google Apps Script ContentOutput set to application/json.
 * 
 * @param {Object} rawPayload - The response object
 * @param {number} [statusCode=200] - Optional HTTP status indicator for logging context
 * @return {GoogleAppsScript.Content.TextOutput} JSON content response
 */
function outputJsonResponse(rawPayload, statusCode) {
  var JSON_STRING = JSON.stringify(rawPayload);
  return ContentService.createTextOutput(JSON_STRING)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Global Controller Request Handler and Coordinator.
 * Handles validation of protocol requirements, correlation IDs, error mapping, and localization.
 */
var ControllerHelper = {
  /**
   * Safe execution wrapper for controller actions.
   * 
   * @param {Object} request - Standard request payload
   * @param {Object} options - Action requirements and options
   * @param {Function} callback - Business operational delegate
   * @return {Object} Standardized ApiResponse object
   */
  run: function(request, options, callback) {
    var startTime = new Date().getTime();
    var requestId = IdGenerator.generateUuid("REQ");
    var correlationId = "";
    var method = "GET";
    var headers = {};
    var userContext = { userId: "GUEST", role: "GUEST", requestId: requestId };

    if (request) {
      method = String(request.method || "GET").toUpperCase();
      headers = request.headers || {};
      correlationId = headers["x-correlation-id"] || headers["X-Correlation-ID"] || "";
      if (request.userContext) {
        userContext = request.userContext;
      }
      userContext.requestId = requestId;
      if (correlationId) {
        userContext.correlationId = correlationId;
      }
    }

    var expectedMethods = options.expectedMethods || ["GET"];
    var apiVersion = headers["x-api-version"] || headers["X-API-Version"] || CONFIG.API_VERSION;
    var contentType = headers["content-type"] || headers["Content-Type"] || "";
    var acceptLanguage = headers["accept-language"] || headers["Accept-Language"] || "en";

    try {
      // 1. Validate HTTP Method
      if (expectedMethods.indexOf(method) === -1) {
        throw {
          status: CONFIG.HTTP_STATUS.BAD_REQUEST,
          errorCode: CONSTANTS.ERROR_CODES.REQ_BAD_JSON,
          message: "HTTP Method '" + method + "' not supported for this endpoint. Permitted: " + expectedMethods.join(", ")
        };
      }

      // 2. Validate API Version for future proofing
      if (apiVersion !== CONFIG.API_VERSION) {
        throw {
          status: CONFIG.HTTP_STATUS.BAD_REQUEST,
          errorCode: CONSTANTS.ERROR_CODES.REQ_BAD_VERSION,
          message: "API version '" + apiVersion + "' is not supported. Supported: " + CONFIG.API_VERSION
        };
      }

      // 3. Validate Content-Type for writes
      if (["POST", "PUT", "PATCH"].indexOf(method) !== -1) {
        if (!contentType || contentType.toLowerCase().indexOf("application/json") === -1) {
          throw {
            status: CONFIG.HTTP_STATUS.BAD_REQUEST,
            errorCode: CONSTANTS.ERROR_CODES.REQ_BAD_JSON,
            message: "Content-Type must be 'application/json' for request modifications."
          };
        }
      }

      // 4. Parse request payload body safely
      var parsedBody = null;
      if (request && request.body) {
        if (typeof request.body === "string") {
          try {
            parsedBody = JSON.parse(request.body);
          } catch (jsonErr) {
            throw {
              status: CONFIG.HTTP_STATUS.BAD_REQUEST,
              errorCode: CONSTANTS.ERROR_CODES.REQ_BAD_JSON,
              message: "Failed parsing request JSON body payload."
            };
          }
        } else {
          parsedBody = request.body;
        }
      }

      // 5. Invoke service logic via delegate
      var result = callback(parsedBody, userContext);

      var duration = new Date().getTime() - startTime;
      var response = buildSuccessResponse(result, options.successMessage || "Request processed successfully.");
      response.correlationId = correlationId;
      response.requestId = requestId;
      response.durationMs = duration;

      return response;

    } catch (err) {
      var duration = new Date().getTime() - startTime;
      var status = CONFIG.HTTP_STATUS.INTERNAL_SERVER_ERROR;
      var errorCode = CONSTANTS.ERROR_CODES.SRV_INTERNAL_FAILURE;
      var message = err.message || "An unexpected error occurred.";
      var validationErrors = err.validationErrors || [];

      // Determine mapped status and errorCode
      if (err.status) {
        status = err.status;
        if (err.errorCode) errorCode = err.errorCode;
      } else {
        var lowerMsg = message.toLowerCase();
        if (lowerMsg.indexOf("not found") !== -1 || lowerMsg.indexOf("missing") !== -1) {
          status = CONFIG.HTTP_STATUS.NOT_FOUND;
          errorCode = CONSTANTS.ERROR_CODES.REQ_RESOURCE_NOT_FOUND;
        } else if (lowerMsg.indexOf("unauthorized") !== -1 || lowerMsg.indexOf("expired") !== -1) {
          status = CONFIG.HTTP_STATUS.UNAUTHORIZED;
          errorCode = CONSTANTS.ERROR_CODES.AUTH_EXPIRED_SESSION;
        } else if (lowerMsg.indexOf("forbidden") !== -1 || lowerMsg.indexOf("role") !== -1) {
          status = CONFIG.HTTP_STATUS.FORBIDDEN;
          errorCode = CONSTANTS.ERROR_CODES.AUTH_FORBIDDEN_ROLE;
        } else if (lowerMsg.indexOf("validation") !== -1 || lowerMsg.indexOf("required") !== -1 || lowerMsg.indexOf("violates") !== -1) {
          status = CONFIG.HTTP_STATUS.BAD_REQUEST;
          errorCode = CONSTANTS.ERROR_CODES.REQ_VALIDATION_FAILED;
        } else if (lowerMsg.indexOf("conflict") !== -1 || lowerMsg.indexOf("concurrency") !== -1 || lowerMsg.indexOf("lock") !== -1) {
          status = CONFIG.HTTP_STATUS.CONFLICT;
          errorCode = CONSTANTS.ERROR_CODES.SRV_CONCURRENT_CONFLICT;
        } else if (lowerMsg.indexOf("rate limit") !== -1) {
          status = CONFIG.HTTP_STATUS.TOO_MANY_REQUESTS;
          errorCode = CONSTANTS.ERROR_CODES.SRV_RATE_LIMIT_EXCEEDED;
        }
      }

      // Log in Audit trail
      AuditManager.logApiError(requestId, errorCode, message, userContext);

      // Localization maps
      var localizations = {
        "en": {
          "AUTH_001": "Authentication key is missing.",
          "AUTH_007": "Access Denied: unauthorized user role.",
          "REQ_104": "Input validation constraints failed.",
          "REQ_105": "Requested record not found.",
          "SRV_503": "Concurrency conflict: record has been updated on server.",
          "SRV_500": "Critical server execution fault."
        },
        "es": {
          "AUTH_001": "Falta la clave de autenticación.",
          "AUTH_007": "Acceso denegado: rol de usuario no autorizado.",
          "REQ_104": "Fallaron las restricciones de validación de entrada.",
          "REQ_105": "Registro solicitado no encontrado.",
          "SRV_503": "Conflicto de concurrencia: el registro ha sido actualizado en el servidor.",
          "SRV_500": "Fallo crítico de ejecución del servidor."
        }
      };

      var activeLocale = localizations[acceptLanguage.split("-")[0].toLowerCase()] || localizations["en"];
      var localizedMsg = activeLocale[errorCode] || message;

      var response = buildErrorResponse(localizedMsg, errorCode, validationErrors);
      response.correlationId = correlationId;
      response.requestId = requestId;
      response.durationMs = duration;
      response.status = status; // Map HTTP Status in payload metadata for easier routing

      return response;
    }
  }
};
