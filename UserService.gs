/**
 * @fileoverview User Profile and Security Governance Service.
 * Manages administrative users, roles, security bans, and cache-backed profile retrievals.
 * @license Apache-2.0
 */

var UserService = {
  serviceName: "UserService",

  /**
   * Helper to execute service operations with timing, validation, retry, logging, and safety.
   * 
   * @private
   */
  _execute: function(actionName, callback, context) {
    var startTime = new Date().getTime();
    var maxRetries = 3;
    var attempt = 0;
    var lastError = null;

    LoggerService.info("[" + this.serviceName + "] Starting action '" + actionName + "'");

    while (attempt < maxRetries) {
      try {
        var result = callback();
        var duration = new Date().getTime() - startTime;
        LoggerService.info("[" + this.serviceName + "] Action '" + actionName + "' completed in " + duration + "ms (Attempt " + (attempt + 1) + ")");
        return result;
      } catch (e) {
        attempt++;
        lastError = e;
        LoggerService.warn("[" + this.serviceName + "] Action '" + actionName + "' failed on attempt " + attempt + "/" + maxRetries + ". Error: " + e.message);
        if (attempt < maxRetries) {
          Utilities.sleep(100 * attempt);
        }
      }
    }

    var totalDuration = new Date().getTime() - startTime;
    LoggerService.error("[" + this.serviceName + "] Action '" + actionName + "' permanently failed after " + maxRetries + " attempts (" + totalDuration + "ms).", lastError);
    throw lastError;
  },

  /**
   * Registers a new system user.
   * 
   * @param {Object} payload - User details (email, role, name, avatarUrl)
   * @param {Object} userContext - Context credentials of performing user
   * @return {Object} Registered user record
   */
  createUser: function(payload, userContext) {
    var self = this;
    return this._execute("createUser", function() {
      if (!payload.email) throw new Error("User email is required.");
      if (!payload.name) throw new Error("User name is required.");
      if (!payload.role) throw new Error("User role is required.");

      var cleanEmail = String(payload.email).trim().toLowerCase();
      
      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000);

        // Check uniqueness of email
        var existing = UserRepository.findByEmail(cleanEmail);
        if (existing) {
          throw new Error("A user account with email '" + cleanEmail + "' already exists.");
        }

        // Check role validity
        var validRoles = [
          CONSTANTS.ROLES.CEO,
          CONSTANTS.ROLES.SUPPORT_MANAGER,
          CONSTANTS.ROLES.TECHNICAL_EXECUTIVE,
          CONSTANTS.ROLES.AI_ADMINISTRATOR
        ];
        if (validRoles.indexOf(payload.role) === -1) {
          throw new Error("Invalid role designation: " + payload.role);
        }

        var userId = IdGenerator.generateUuid("USR");
        var userRecord = {
          id: userId,
          email: cleanEmail,
          passwordHash: payload.passwordHash || "NO-HASH", // Default PIN or token
          role: payload.role,
          name: payload.name,
          avatarUrl: payload.avatarUrl || "",
          banned: false
        };

        // Atomic insertion
        var inserted = UserRepository.insert(userRecord);

        AuditManager.logEvent("USER_CREATION", "SUCCESS", userContext, "Created user account: " + payload.name + " (" + cleanEmail + ") with role: " + payload.role);

        // Invalidate caches
        CacheManager.remove("DB_CACHE_" + CONFIG.SHEET_NAMES.USERS);

        return inserted;
      } finally {
        lock.releaseLock();
      }
    }, userContext);
  },

  /**
   * Updates a user's security role assignment.
   * 
   * @param {string} userId - User ID to update
   * @param {string} newRole - Target role designation
   * @param {Object} userContext - Performer credentials
   * @return {Object} Updated user record
   */
  updateUserRole: function(userId, newRole, userContext) {
    var self = this;
    return this._execute("updateUserRole", function() {
      if (!userId) throw new Error("User ID is required.");
      if (!newRole) throw new Error("New role selection is required.");

      var user = UserRepository.find(userId);
      if (!user) throw new Error("User with ID " + userId + " not found.");

      var validRoles = [
        CONSTANTS.ROLES.CEO,
        CONSTANTS.ROLES.SUPPORT_MANAGER,
        CONSTANTS.ROLES.TECHNICAL_EXECUTIVE,
        CONSTANTS.ROLES.AI_ADMINISTRATOR
      ];
      if (validRoles.indexOf(newRole) === -1) {
        throw new Error("Invalid role designation: " + newRole);
      }

      var oldRole = user.role;
      try {
        var updated = UserRepository.update(userId, { role: newRole });

        AuditManager.logEvent("USER_ROLE_CHANGE", "SUCCESS", userContext, "Modified role of user " + user.name + " (" + userId + ") from '" + oldRole + "' to '" + newRole + "'");

        // Force reload caches
        CacheManager.remove("DB_CACHE_" + CONFIG.SHEET_NAMES.USERS);
        CacheManager.remove("USER_PROFILE_CACHE_" + userId);

        return updated;
      } catch (err) {
        LoggerService.error("Failed updating role of user: " + userId + ". Restoring old role: " + oldRole);
        try {
          UserRepository.update(userId, { role: oldRole });
        } catch (rErr) {
          LoggerService.error("CRITICAL: Reverting user role update failed: " + userId, rErr);
        }
        throw err;
      }
    }, userContext);
  },

  /**
   * Places an administrative ban on a user account.
   * 
   * @param {string} userId - Target user ID
   * @param {Object} userContext - Executing administrative user context
   * @return {Object} Updated user record
   */
  banUser: function(userId, userContext) {
    var self = this;
    return this._execute("banUser", function() {
      if (!userId) throw new Error("User ID is required.");

      var user = UserRepository.find(userId);
      if (!user) throw new Error("User with ID " + userId + " not found.");

      if (user.banned) return user; // Idempotent

      try {
        var updated = UserRepository.update(userId, { banned: true });

        AuditManager.logEvent("USER_SUSPENSION", "SUCCESS", userContext, "Banned/Suspended user: " + user.name + " (" + userId + ")");

        // Terminate active sessions immediately to log them out
        try {
          SessionManager.destroyUserSessions(userId);
        } catch (sessErr) {
          LoggerService.warn("Failed force terminating sessions of banned user: " + userId, sessErr);
        }

        // Clear caching
        CacheManager.remove("DB_CACHE_" + CONFIG.SHEET_NAMES.USERS);
        CacheManager.remove("USER_PROFILE_CACHE_" + userId);

        return updated;
      } catch (err) {
        LoggerService.error("Banning user " + userId + " failed, rolling back.");
        try {
          UserRepository.update(userId, { banned: false });
        } catch (rErr) {
          LoggerService.error("CRITICAL: Reversing ban status failed for user " + userId, rErr);
        }
        throw err;
      }
    }, userContext);
  },

  /**
   * Lifts a user account ban.
   * 
   * @param {string} userId - Target user ID
   * @param {Object} userContext - Performing administrative context
   * @return {Object} Updated user record
   */
  unbanUser: function(userId, userContext) {
    var self = this;
    return this._execute("unbanUser", function() {
      if (!userId) throw new Error("User ID is required.");

      var user = UserRepository.find(userId);
      if (!user) throw new Error("User with ID " + userId + " not found.");

      if (!user.banned) return user; // Already active

      try {
        var updated = UserRepository.update(userId, { banned: false });

        AuditManager.logEvent("USER_UNSUSPENSION", "SUCCESS", userContext, "Unbanned/Re-activated user account: " + user.name + " (" + userId + ")");

        // Clear caching
        CacheManager.remove("DB_CACHE_" + CONFIG.SHEET_NAMES.USERS);
        CacheManager.remove("USER_PROFILE_CACHE_" + userId);

        return updated;
      } catch (err) {
        LoggerService.error("Failed unbanning user " + userId + ", rolling back.");
        try {
          UserRepository.update(userId, { banned: true });
        } catch (rErr) {
          LoggerService.error("CRITICAL: Reversing unban status failed for user " + userId, rErr);
        }
        throw err;
      }
    }, userContext);
  },

  /**
   * Fetches user profile data, optimized with CacheService wrapper.
   * 
   * @param {string} userId - Target user ID
   * @return {Object} User profile object
   */
  getUserProfile: function(userId) {
    var self = this;
    return this._execute("getUserProfile", function() {
      if (!userId) throw new Error("User ID is required.");

      var cacheKey = "USER_PROFILE_CACHE_" + userId;
      var cached = CacheManager.getJson(cacheKey);
      if (cached) return cached;

      var user = UserRepository.find(userId);
      if (!user) throw new Error("User ID " + userId + " not found.");

      CacheManager.putJson(cacheKey, user, 1800); // 30 minutes cache

      return user;
    });
  },

  /**
   * Retrieves all registered users.
   */
  getUsers: function() {
    return this._execute("getUsers", function() {
      return UserRepository.findAll(true);
    });
  },

  /**
   * Updates an existing user record.
   */
  updateUser: function(userId, updates, userContext) {
    return this._execute("updateUser", function() {
      if (!userId) throw new Error("User ID is required.");
      var existing = UserRepository.find(userId);
      if (!existing) {
        throw new Error("User ID " + userId + " not found.");
      }

      var updated = UserRepository.update(userId, updates);
      AuditManager.logEvent("USER_UPDATE", "SUCCESS", userContext, "Updated user account settings: " + existing.name);
      
      CacheManager.remove("DB_CACHE_" + CONFIG.SHEET_NAMES.USERS);
      CacheManager.remove("USER_PROFILE_CACHE_" + userId);
      return updated;
    }, userContext);
  },

  /**
   * Permanently purges a user account.
   */
  deleteUser: function(userId, userContext) {
    return this._execute("deleteUser", function() {
      if (!userId) throw new Error("User ID is required.");
      var existing = UserRepository.find(userId);
      if (!existing) {
        throw new Error("User ID " + userId + " not found.");
      }

      var deleted = UserRepository.delete(userId);
      AuditManager.logEvent("USER_DELETION", "SUCCESS", userContext, "Deleted user account: " + existing.name);

      CacheManager.remove("DB_CACHE_" + CONFIG.SHEET_NAMES.USERS);
      CacheManager.remove("USER_PROFILE_CACHE_" + userId);
      return { id: userId, success: deleted };
    }, userContext);
  }
};
