/**
 * @fileoverview Authentication Engine.
 * Handles the logic of credential verification, token exchange and session validation.
 * @license Apache-2.0
 */

var AuthenticationEngine = {
  /**
   * Executes user login validation and returns session details.
   * Leverages direct script configuration matching "no-repository" guidelines.
   * 
   * @param {string} email - Logging user email Address
   * @param {string} teCode - Unique authorization security PIN/code
   * @param {string} deviceId - Client active device identifier
   * @param {string} requestId - Tracking UUID
   * @return {Object} Credentials login confirmation or throws if unauthorized
   */
  authenticateUser: function(email, teCode, deviceId, requestId) {
    if (!email || !teCode) {
      AuditManager.logLogin("UNKNOWN", deviceId, "NONE", false, "Missing credentials email or code", requestId);
      throw new Error("Email and Technical Executive Code are required.");
    }

    // Direct configuration validation bypasses sheet repositories for this tier
    var validUser = this.verifyLocalCredentials(email, teCode);
    if (!validUser) {
      AuditManager.logLogin(email, deviceId, "NONE", false, "Credentials mismatched", requestId);
      var err = new Error("Invalid Technical Executive credentials supplied.");
      err.code = CONSTANTS.ERROR_CODES.AUTH_INVALID_API_KEY;
      throw err;
    }

    // Establish session
    var session = SessionManager.create(validUser.userId, validUser.role, deviceId);
    
    // Register device to user context automatically
    DeviceManager.registerDeviceToUser(deviceId, validUser.userId);

    // Track audit success
    AuditManager.logLogin(validUser.userId, deviceId, session.sessionId, true, null, requestId);

    return {
      authToken: session.authToken,
      sessionId: session.sessionId,
      userId: validUser.userId,
      name: validUser.name,
      role: validUser.role,
      expiresAt: session.expiresAt
    };
  },

  /**
   * Validates if a Bearer Token resolves to an active session, checking limits and states.
   * 
   * @param {string} authToken - Header auth bearer token
   * @param {string} deviceId - Target checking device
   * @return {Object} Session details object
   */
  validateAuthToken: function(authToken, deviceId) {
    if (!authToken) {
      var err = new Error("Authentication token is required.");
      err.code = CONSTANTS.ERROR_CODES.AUTH_MISSING_SESSION;
      throw err;
    }

    var sessionId = SessionManager.getSessionIdByToken(authToken);
    if (!sessionId) {
      var err2 = new Error("Session invalid or expired token.");
      err2.code = CONSTANTS.ERROR_CODES.AUTH_EXPIRED_SESSION;
      throw err2;
    }

    var session = SessionManager.validate(sessionId);
    if (!session) {
      var err3 = new Error("Active session expired or cleared.");
      err3.code = CONSTANTS.ERROR_CODES.AUTH_EXPIRED_SESSION;
      throw err3;
    }

    // Match Device IDs to block hijacking
    if (session.deviceId !== "UNKNOWN" && session.deviceId !== deviceId) {
      LoggerService.warn("Hijack warning: session device mismatch. Registered: " + session.deviceId + " Checking: " + deviceId);
      var err4 = new Error("Session device binding validation failed.");
      err4.code = CONSTANTS.ERROR_CODES.AUTH_FORBIDDEN_ROLE;
      throw err4;
    }

    return session;
  },

  /**
   * Destroys an active session securely.
   * 
   * @param {string} authToken - Header token to invalidate
   * @param {string} requestId - Tracking UUID
   */
  terminateSession: function(authToken, requestId) {
    if (!authToken) return;

    var sessionId = SessionManager.getSessionIdByToken(authToken);
    if (sessionId) {
      var session = SessionManager.validate(sessionId);
      if (session) {
        SessionManager.destroy(sessionId);
        AuditManager.logLogout(session.userId, session.deviceId, sessionId, requestId);
        return;
      }
    }
  },

  /**
   * Hardcoded user validations fallback when spreadsheets database repositories aren't active.
   * Matches core roles requested in security specifications.
   * 
   * @private
   */
  verifyLocalCredentials: function(email, teCode) {
    // Sanitization
    var cleanEmail = String(email).trim().toLowerCase();
    var cleanCode = String(teCode).trim();

    // Default users lists covering RBAC criteria
    var DEFAULT_USERS = [
      { userId: "TE-101", name: "Executive Chief Officer", email: "ceo@philsof.com", code: "CEO99", role: CONSTANTS.ROLES.CEO },
      { userId: "TE-102", name: "Support Director", email: "manager@philsof.com", code: "MGR77", role: CONSTANTS.ROLES.SUPPORT_MANAGER },
      { userId: "TE-103", name: "Lead Field Executive", email: "support@philsof.com", code: "EXEC12", role: CONSTANTS.ROLES.TECHNICAL_EXECUTIVE },
      { userId: "TE-104", name: "AI Admin Pilot", email: "ai@philsof.com", code: "AI888", role: CONSTANTS.ROLES.AI_ADMINISTRATOR }
    ];

    for (var i = 0; i < DEFAULT_USERS.length; i++) {
      var u = DEFAULT_USERS[i];
      if (u.email === cleanEmail && u.code === cleanCode) {
        return u;
      }
    }

    return null;
  }
};
