/**
 * @fileoverview Session Manager.
 * Operates active session states, tokens, lifecycle management and auto-expiration using CacheService.
 * @license Apache-2.0
 */

var SessionManager = {
  // Session duration configuration: 2 hours standard duration
  DEFAULT_SESSION_DURATION_SEC: 7200,

  /**
   * Generates and stores a new user session.
   * 
   * @param {string} userId - Authentic user record key (e.g. TE-001)
   * @param {string} role - Standard UserRole enum
   * @param {string} deviceId - Client active device identifier
   * @return {Object} Session details containing token and expiry
   */
  create: function(userId, role, deviceId) {
    if (!userId || !role) {
      throw new Error("Cannot create session: User ID and Role are required.");
    }

    var sessionId = IdGenerator.generateUuid("SES");
    var authToken = IdGenerator.generateUuid("TOK");
    var now = new Date();
    var expiresAt = new Date(now.getTime() + this.DEFAULT_SESSION_DURATION_SEC * 1000);

    var sessionData = {
      sessionId: sessionId,
      authToken: authToken,
      userId: userId,
      role: role,
      deviceId: deviceId || "UNKNOWN",
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      lastAccessedAt: now.toISOString()
    };

    // Store in global CacheService partition for instant validated retrievals
    CacheManager.putJson("SESSION_ID_" + sessionId, sessionData, this.DEFAULT_SESSION_DURATION_SEC);
    CacheManager.put("TOKEN_MAP_" + authToken, sessionId, this.DEFAULT_SESSION_DURATION_SEC);

    LoggerService.info("Session created successfully. User: " + userId + " SessionId: " + sessionId);
    return sessionData;
  },

  /**
   * Validates if a session is currently active and authentic.
   * 
   * @param {string} sessionId - Active session tracking ID
   * @return {Object|null} Active Session data or null if invalid/expired
   */
  validate: function(sessionId) {
    if (!sessionId) return null;

    var session = CacheManager.getJson("SESSION_ID_" + sessionId);
    if (!session) {
      LoggerService.warn("Session not found or expired: " + sessionId);
      return null;
    }

    // Check clock expiry
    var now = new Date();
    var expires = new Date(session.expiresAt);
    if (now > expires) {
      LoggerService.info("Session expired on clock validation: " + sessionId);
      this.destroy(sessionId);
      return null;
    }

    // Slide/refresh access time to extend sessions automatically on activity (Remember Session)
    return this.refresh(sessionId);
  },

  /**
   * Refreshes the lastAccessedAt time and extends the session lease in the Cache partition.
   * 
   * @param {string} sessionId - Active session tracking ID
   * @return {Object} The updated session object
   */
  refresh: function(sessionId) {
    var session = CacheManager.getJson("SESSION_ID_" + sessionId);
    if (!session) return null;

    var now = new Date();
    var expiresAt = new Date(now.getTime() + this.DEFAULT_SESSION_DURATION_SEC * 1000);

    session.lastAccessedAt = now.toISOString();
    session.expiresAt = expiresAt.toISOString();

    CacheManager.putJson("SESSION_ID_" + sessionId, session, this.DEFAULT_SESSION_DURATION_SEC);
    CacheManager.put("TOKEN_MAP_" + session.authToken, sessionId, this.DEFAULT_SESSION_DURATION_SEC);

    return session;
  },

  /**
   * Destroys/removes a session from the active cache storage.
   * 
   * @param {string} sessionId - Session to terminate
   */
  destroy: function(sessionId) {
    if (!sessionId) return;
    
    var session = CacheManager.getJson("SESSION_ID_" + sessionId);
    if (session) {
      CacheManager.remove("TOKEN_MAP_" + session.authToken);
    }
    
    CacheManager.remove("SESSION_ID_" + sessionId);
    LoggerService.info("Session destroyed: " + sessionId);
  },

  /**
   * Translates a Bearer Auth token back into its corresponding active Session ID.
   * 
   * @param {string} authToken - Header authentication token
   * @return {string|null} Resolved Session ID or null
   */
  getSessionIdByToken: function(authToken) {
    if (!authToken) return null;
    return CacheManager.get("TOKEN_MAP_" + authToken);
  },

  /**
   * Restores a persistent session back into active Cache if present.
   * (Placeholder ready for long-lived properties storage lookup if needed)
   */
  restore: function(sessionId) {
    return this.validate(sessionId);
  }
};
