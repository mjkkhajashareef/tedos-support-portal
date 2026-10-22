/**
 * @fileoverview Authentication Enterprise Controller.
 * Coordinates user credential verification, session creation, and secure logout.
 * @license Apache-2.0
 */

var AuthController = {
  /**
   * Processes a user login request.
   * 
   * @param {Object} request - Standardized API Request wrapper
   * @return {Object} Standardized ApiResponse success or error payload
   */
  login: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "User logged in and session established successfully."
    }, function(body, userContext) {
      if (!body) throw new Error("Request body payload is missing.");
      var email = body.email;
      var teCode = body.teCode;
      var deviceId = body.deviceId || "UNKNOWN";

      var authResult = AuthenticationEngine.authenticateUser(email, teCode, deviceId, userContext.requestId);
      return authResult;
    });
  },

  /**
   * Processes a session termination / logout request.
   * 
   * @param {Object} request - Standardized API Request wrapper
   * @return {Object} Standardized ApiResponse success or error payload
   */
  logout: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Session terminated successfully."
    }, function(body, userContext) {
      var headers = request.headers || {};
      var authHeader = headers["authorization"] || headers["Authorization"] || "";
      var authToken = "";
      
      if (authHeader.indexOf("Bearer ") === 0) {
        authToken = authHeader.substring(7);
      } else {
        authToken = authHeader;
      }

      AuthenticationEngine.terminateSession(authToken, userContext.requestId);
      return { loggedOut: true };
    });
  },

  /**
   * Validates an active session token.
   * 
   * @param {Object} request - Standardized API Request wrapper
   * @return {Object} Standardized ApiResponse success or error payload
   */
  validateToken: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET", "POST"],
      successMessage: "Auth token validated successfully."
    }, function(body, userContext) {
      var headers = request.headers || {};
      var authHeader = headers["authorization"] || headers["Authorization"] || "";
      var deviceId = headers["x-device-id"] || headers["X-Device-Id"] || "UNKNOWN";
      var authToken = "";
      
      if (authHeader.indexOf("Bearer ") === 0) {
        authToken = authHeader.substring(7);
      } else {
        authToken = authHeader;
      }

      var session = AuthenticationEngine.validateAuthToken(authToken, deviceId);
      return {
        valid: true,
        session: {
          sessionId: session.sessionId,
          userId: session.userId,
          role: session.role,
          expiresAt: session.expiresAt
        }
      };
    });
  }
};
