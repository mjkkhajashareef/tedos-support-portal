/**
 * @fileoverview API Request Dispatcher and Middleware Layer.
 * Coordinates pre-routing operations including security checks, rate limiting, and CORS.
 * @license Apache-2.0
 */

var Dispatcher = {
  /**
   * Main dispatch entry point for processing all REST requests.
   * 
   * @param {Object} requestPayload - The standardized request object
   * @return {Object} ApiResponse
   */
  dispatch: function(requestPayload) {
    var method = (requestPayload.method || "GET").toUpperCase();
    var path = requestPayload.path || "/";
    var headers = requestPayload.headers || {};
    var rawBody = requestPayload.rawBody || "";
    var query = requestPayload.query || {};

    // 1. CORS Preflight & OPTIONS handling
    if (method === "OPTIONS") {
      return {
        status: CONFIG.HTTP_STATUS.OK,
        success: true,
        message: "CORS preflight request successful.",
        data: null
      };
    }

    // 2. Map standard headers (case-insensitive fallback)
    var apiKey = headers["X-API-Key"] || headers["x-api-key"] || headers["X-Api-Key"] || query["apiKey"] || query["apikey"];
    var apiVersion = headers["X-API-Version"] || headers["x-api-version"] || headers["X-Api-Version"] || CONFIG.API_VERSION;
    var deviceId = headers["X-Device-ID"] || headers["x-device-id"] || headers["X-Device-Id"] || query["deviceId"] || "UNKNOWN";
    var token = headers["Authorization"] || headers["authorization"] || query["token"] || query["authToken"];
    if (token && token.indexOf("Bearer ") === 0) {
      token = token.substring(7);
    }

    // Rewrite headers for consistency in downstream checks
    var normalizedHeaders = {
      "X-API-Key": apiKey,
      "X-API-Version": apiVersion,
      "X-Device-ID": deviceId,
      "X-Timestamp": headers["X-Timestamp"] || headers["x-timestamp"] || query["timestamp"],
      "X-Nonce": headers["X-Nonce"] || headers["x-nonce"] || query["nonce"],
      "X-Signature": headers["X-Signature"] || headers["x-signature"] || query["signature"],
      "Content-Type": headers["Content-Type"] || headers["content-type"] || "application/json"
    };

    // 3. Health/Ping Endpoint Fast-Paths (Bypasses session validation, but can check API Key)
    if (path === "/health" || path === "/ping") {
      if (path === "/health") {
        return HealthController.getHealth({ method: method, headers: normalizedHeaders, query: query });
      } else {
        return HealthController.ping({ method: method, headers: normalizedHeaders, query: query });
      }
    }

    // 4. Request Security Validation (API Key, Signature, Nonce, Timestamp, Clock Skew, Replay)
    var securityCheck = RequestSignature.validateRequest(normalizedHeaders, rawBody, method);
    if (!securityCheck.isValid) {
      return buildErrorResponse(
        securityCheck.message || "Security validation failed.",
        securityCheck.errorCode || CONSTANTS.ERROR_CODES.AUTH_UNAUTHORIZED_ACCESS
      );
    }

    // 5. Session and User Authentication Validation
    var userContext = { userId: "GUEST", role: "GUEST", deviceId: deviceId };
    var isAuthRoute = path === "/auth/login" || path === "/auth/logout";

    if (token) {
      var sessionId = SessionManager.getSessionIdByToken(token);
      if (sessionId) {
        var session = SessionManager.validate(sessionId);
        if (session) {
          userContext.userId = session.userId;
          userContext.role = session.role;
          userContext.sessionId = sessionId;
        } else if (!isAuthRoute) {
          return buildErrorResponse(
            "Session has expired or is invalid.",
            CONSTANTS.ERROR_CODES.AUTH_EXPIRED_SESSION
          );
        }
      } else if (!isAuthRoute) {
        return buildErrorResponse(
          "Invalid authentication token.",
          CONSTANTS.ERROR_CODES.AUTH_EXPIRED_SESSION
        );
      }
    } else if (!isAuthRoute) {
      // All operational routes except /auth/login require session
      return buildErrorResponse(
        "Bearer authentication token is required.",
        CONSTANTS.ERROR_CODES.AUTH_EXPIRED_SESSION
      );
    }

    // 6. Rate Limiter Checks
    var limitCheck = RateLimiter.checkLimit(normalizedHeaders, userContext.userId);
    if (!limitCheck.isAllowed) {
      return buildErrorResponse(
        "Rate limit exceeded. Please wait before making more requests.",
        CONSTANTS.ERROR_CODES.SRV_RATE_LIMIT_EXCEEDED
      );
    }

    // Prepare complete unified request block for controller
    var controllerRequest = {
      method: method,
      path: path,
      headers: normalizedHeaders,
      body: rawBody,
      query: query,
      userContext: userContext
    };
    Logger.log("ControllerRequest: " + JSON.stringify(controllerRequest));

    // 7. Hand off request to the router
    try {
      var result = Router.route(controllerRequest);
      try {
        Logger.log("Router result stringified");
      } catch (e) {
        LoggerService.error("Dispatcher failed to stringify result", e);
      }
      return result;
    } catch (err) {
      LoggerService.error("Routing execution failed.", err);
      Logger.log("Routing error: " + err.message);
      Logger.log("Routing stack: " + err.stack);
      return buildErrorResponse(
        err.message || "Routing execution failed.",
        CONSTANTS.ERROR_CODES.SRV_INTERNAL_FAILURE
      );
    }
  }
};
