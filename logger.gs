/**
 * @fileoverview System Logging Utility for tracking requests and server-side operations.
 * @license Apache-2.0
 */

var LoggerService = {
  /**
   * Logs an informational message with context.
   * 
   * @param {string} message - Human readable log message
   * @param {Object} [context] - Key-value pair metadata for correlation
   */
  info: function(message, context) {
    this.log("INFO", message, context);
  },

  /**
   * Logs a warning message with context.
   * 
   * @param {string} message - Warning explanation
   * @param {Object} [context] - Key-value pair metadata
   */
  warn: function(message, context) {
    this.log("WARN", message, context);
  },

  /**
   * Logs an error message or exception details.
   * 
   * @param {string} message - Error description
   * @param {Error|Object} [error] - Exception or details
   */
  error: function(message, error) {
    var errorDetails = {};
    if (error) {
      if (error instanceof Error) {
        errorDetails = {
          name: error.name,
          message: error.message,
          stack: error.stack
        };
      } else {
        errorDetails = error;
      }
    }
    this.log("ERROR", message, errorDetails);
  },

  /**
   * Logs a trace for incoming HTTP requests.
   * 
   * @param {string} requestId - Unique tracing UUID
   * @param {string} method - HTTP Verb (GET, POST, etc.)
   * @param {string} path - Target path or query endpoint
   * @param {Object} securitySummary - Sanitized security context (no secrets)
   */
  logRequest: function(requestId, method, path, securitySummary) {
    this.info("INCOMING_REQUEST: " + method + " " + path, {
      requestId: requestId,
      method: method,
      path: path,
      security: securitySummary
    });
  },

  /**
   * Logs a trace for outgoing HTTP responses.
   * 
   * @param {string} requestId - Unique tracing UUID
   * @param {number} statusCode - HTTP response code
   * @param {number} latencyMs - Duration in milliseconds
   * @param {boolean} success - Success state of transaction
   */
  logResponse: function(requestId, statusCode, latencyMs, success) {
    this.info("OUTGOING_RESPONSE: status=" + statusCode + " latency=" + latencyMs + "ms success=" + success, {
      requestId: requestId,
      statusCode: statusCode,
      latencyMs: latencyMs,
      success: success
    });
  },

  /**
   * Internal logging director. Dispatches to Cloud Logging / Stackdriver logs.
   * 
   * @param {string} level - Log level (INFO, WARN, ERROR)
   * @param {string} message - Primary log line
   * @param {Object} [context] - Optional metadata
   */
  log: function(level, message, context) {
    var logPayload = {
      timestamp: new Date().toISOString(),
      level: level,
      message: message,
      environment: getEnvironment(),
      context: context || {}
    };

    var formattedString = "[" + level + "] " + message + " | Context: " + JSON.stringify(logPayload.context);

    if (level === "ERROR") {
      console.error(formattedString);
    } else if (level === "WARN") {
      console.warn(formattedString);
    } else {
      console.log(formattedString);
    }
  }
};
