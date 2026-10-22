/**
 * @fileoverview Client Business Service Layer.
 * Manages the complete client lifecycle, health score calculations, activations, renewals, and usage analysis.
 * Adheres to enterprise business rules: only services contain business logic; data accesses are delegated to repositories.
 * @license Apache-2.0
 */

var ClientService = {
  serviceName: "ClientService",

  /**
   * Helper to execute service operations with timing, validation, retry, logging, and transactional safety.
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
          Utilities.sleep(150 * attempt); // Exponential backoff
        }
      }
    }

    var totalDuration = new Date().getTime() - startTime;
    LoggerService.error("[" + this.serviceName + "] Action '" + actionName + "' permanently failed after " + maxRetries + " attempts (" + totalDuration + "ms).", lastError);
    throw lastError;
  },

  /**
   * Activates a client.
   * 
   * @param {string} clientId - The ID of the client to activate
   * @param {Object} userContext - Context object of the user performing the action
   * @return {Object} The updated client record
   */
  activate: function(clientId, userContext) {
    var self = this;
    return this._execute("activate", function() {
      if (!clientId) {
        throw new Error("Client ID is required for activation.");
      }

      var client = ClientRepository.find(clientId);
      if (!client) {
        var err = new Error("Client with ID " + clientId + " not found.");
        err.code = CONSTANTS.ERROR_CODES.REQ_RESOURCE_NOT_FOUND;
        throw err;
      }

      if (client.status === "Active") {
        return client; // Already active, idempotent return
      }

      // Rollback backup point
      var previousStatus = client.status;

      try {
        var updatedClient = ClientRepository.update(clientId, {
          status: "Active",
          recentActivityTimestamp: new Date().toISOString()
        });

        // Log compliance audit event
        AuditManager.logEvent("CLIENT_ACTIVATION", "SUCCESS", userContext, "Activated client ID " + clientId + " (" + client.name + "). Previous status: " + previousStatus);
        
        // Push notification alerts
        NotificationService.createSystemAlert(
          "Client Activated",
          "Client '" + client.name + "' has been successfully activated.",
          CONSTANTS.NOTIFICATION_TYPES.SUCCESS
        );

        return updatedClient;
      } catch (e) {
        // Rollback status update on failure
        LoggerService.error("Activation failed, rolling back status of Client: " + clientId);
        try {
          ClientRepository.update(clientId, { status: previousStatus });
        } catch (rErr) {
          LoggerService.error("CRITICAL: Failed to rollback activation status for client " + clientId, rErr);
        }
        throw e;
      }
    }, userContext);
  },

  /**
   * Suspends a client with a documented audit reason.
   * 
   * @param {string} clientId - Client unique ID
   * @param {string} reason - Suspension trigger reason
   * @param {Object} userContext - Context object of user performing action
   * @return {Object} The updated client record
   */
  suspend: function(clientId, reason, userContext) {
    var self = this;
    return this._execute("suspend", function() {
      if (!clientId) throw new Error("Client ID is required for suspension.");
      if (!reason) throw new Error("Suspension reason is required.");

      var client = ClientRepository.find(clientId);
      if (!client) {
        var err = new Error("Client with ID " + clientId + " not found.");
        err.code = CONSTANTS.ERROR_CODES.REQ_RESOURCE_NOT_FOUND;
        throw err;
      }

      var previousStatus = client.status;
      try {
        var updatedClient = ClientRepository.update(clientId, {
          status: "Suspended",
          recentActivityTimestamp: new Date().toISOString()
        });

        AuditManager.logEvent("CLIENT_SUSPENSION", "SUCCESS", userContext, "Suspended client ID " + clientId + " (" + client.name + "). Reason: " + reason);

        NotificationService.createSystemAlert(
          "Client Suspended",
          "Client '" + client.name + "' has been suspended. Reason: " + reason,
          CONSTANTS.NOTIFICATION_TYPES.WARNING
        );

        return updatedClient;
      } catch (e) {
        LoggerService.error("Suspension failed, rolling back status of Client: " + clientId);
        try {
          ClientRepository.update(clientId, { status: previousStatus });
        } catch (rErr) {
          LoggerService.error("CRITICAL: Failed to rollback suspension status for client " + clientId, rErr);
        }
        throw e;
      }
    }, userContext);
  },

  /**
   * Renews a client's support license.
   * 
   * @param {string} clientId - Client unique ID
   * @param {string} newExpiryDate - YYYY-MM-DD Date
   * @param {string} licenseType - License tier designation
   * @param {Object} userContext - Context object of user performing action
   * @return {Object} The updated client record
   */
  renewLicense: function(clientId, newExpiryDate, licenseType, userContext) {
    var self = this;
    return this._execute("renewLicense", function() {
      if (!clientId) throw new Error("Client ID is required for license renewal.");
      if (!newExpiryDate) throw new Error("New expiry date is required.");
      if (!licenseType) throw new Error("License type is required.");

      // Custom date validation
      if (!/^\d{4}-\d{2}-\d{2}$/.test(newExpiryDate)) {
        throw new Error("Invalid expiry date format. Expected YYYY-MM-DD.");
      }

      var client = ClientRepository.find(clientId);
      if (!client) {
        var err = new Error("Client with ID " + clientId + " not found.");
        err.code = CONSTANTS.ERROR_CODES.REQ_RESOURCE_NOT_FOUND;
        throw err;
      }

      var oldExpiry = client.expiryDate;
      var oldLicense = client.licenseType;

      try {
        var updatedClient = ClientRepository.update(clientId, {
          expiryDate: newExpiryDate,
          licenseType: licenseType,
          status: "Active", // Auto-activate on renewal
          recentActivityTimestamp: new Date().toISOString()
        });

        AuditManager.logEvent("CLIENT_RENEWAL", "SUCCESS", userContext, "Renewed license for client ID " + clientId + ". Tier: " + licenseType + ". Expiry changed from " + oldExpiry + " to " + newExpiryDate);

        NotificationService.createSystemAlert(
          "License Renewed",
          "Client '" + client.name + "' support license renewed successfully until " + newExpiryDate,
          CONSTANTS.NOTIFICATION_TYPES.SUCCESS
        );

        // Recalculate health score immediately based on new parameters
        self.recalculateHealthScore(clientId);

        return ClientRepository.find(clientId);
      } catch (e) {
        LoggerService.error("License renewal crashed, rolling back expiry/license configurations of Client: " + clientId);
        try {
          ClientRepository.update(clientId, {
            expiryDate: oldExpiry,
            licenseType: oldLicense,
            status: client.status
          });
        } catch (rErr) {
          LoggerService.error("CRITICAL: Failed to rollback renewal changes for client " + clientId, rErr);
        }
        throw e;
      }
    }, userContext);
  },

  /**
   * Recalculates and updates the client health score.
   * Health Score is a percentage score (0-100) based on:
   *  - Pending/unresolved support tickets: Max -35 points (Critical: -15 each, High: -10 each, Med: -5, Low: -2)
   *  - Last Backup date: Max -25 points if older than 7 days, -10 points if 3 to 7 days, 0 if < 3 days.
   *  - License Expiry Date: Max -20 points if expired, -10 if expiring in 15 days, -5 if in 30 days.
   *  - Software Version outdatedness: Max -20 points if severely behind major versions, -10 points if minor version behind.
   * 
   * @param {string} clientId - Client unique ID
   * @return {number} Calculated health score (0-100)
   */
  recalculateHealthScore: function(clientId) {
    var self = this;
    return this._execute("recalculateHealthScore", function() {
      var client = ClientRepository.find(clientId);
      if (!client) throw new Error("Client ID " + clientId + " not found.");

      var score = 100;

      // 1. Unresolved support tickets analysis (Max reduction: 35)
      var tickets = TicketRepository.findByClient(clientId);
      var openTickets = tickets.filter(function(t) {
        return t.status !== CONSTANTS.TICKET_STATUS.RESOLVED && t.status !== CONSTANTS.TICKET_STATUS.CLOSED;
      });

      var ticketPenalty = 0;
      openTickets.forEach(function(t) {
        if (t.priority === CONSTANTS.PRIORITY.CRITICAL) ticketPenalty += 15;
        else if (t.priority === CONSTANTS.PRIORITY.HIGH) ticketPenalty += 10;
        else if (t.priority === CONSTANTS.PRIORITY.MEDIUM) ticketPenalty += 5;
        else if (t.priority === CONSTANTS.PRIORITY.LOW) ticketPenalty += 2;
      });
      score -= Math.min(35, ticketPenalty);

      // 2. Last Backup recency check (Max reduction: 25)
      if (client.lastBackupDate) {
        var lastBackup = new Date(client.lastBackupDate).getTime();
        var today = new Date().getTime();
        var daysSinceBackup = (today - lastBackup) / (1000 * 60 * 60 * 24);
        
        if (daysSinceBackup > 7) {
          score -= 25;
        } else if (daysSinceBackup >= 3) {
          score -= 10;
        }
      } else {
        score -= 25; // No backup is critical
      }

      // 3. License Expiry Check (Max reduction: 20)
      if (client.expiryDate) {
        var expiry = new Date(client.expiryDate).getTime();
        var today = new Date().getTime();
        var daysUntilExpiry = (expiry - today) / (1000 * 60 * 60 * 24);

        if (daysUntilExpiry < 0) {
          score -= 20; // Expired
        } else if (daysUntilExpiry <= 15) {
          score -= 10;
        } else if (daysUntilExpiry <= 30) {
          score -= 5;
        }
      } else {
        score -= 20;
      }

      // 4. Software Version Check (Max reduction: 20)
      // Standard recommended version can be fetched from global settings
      var standardVersion = SettingsRepository.getSettingValue("STANDARD_SOFTWARE_VERSION", "2.5.0");
      if (client.softwareVersion && standardVersion) {
        var currentParts = client.softwareVersion.split(".").map(Number);
        var targetParts = standardVersion.split(".").map(Number);

        if (currentParts[0] < targetParts[0]) {
          score -= 20; // major version behind
        } else if (currentParts[1] < targetParts[1]) {
          score -= 10; // minor version behind
        } else if (currentParts[2] < targetParts[2]) {
          score -= 3;  // patch behind
        }
      }

      // Ensure floor of 0 and ceiling of 100
      var finalScore = Math.max(0, Math.min(100, score));

      // Update record via repository
      ClientRepository.update(clientId, { healthStatus: finalScore });

      LoggerService.info("Recalculated health score for Client " + clientId + " (" + client.name + "): " + finalScore);
      return finalScore;
    });
  },

  /**
   * Analyzes software usage trends, audits activity, and updates telemetry indicators.
   * 
   * @param {string} clientId - Client unique ID
   * @return {Object} Usage analysis report payload
   */
  analyzeSoftwareUsage: function(clientId) {
    var self = this;
    return this._execute("analyzeSoftwareUsage", function() {
      var client = ClientRepository.find(clientId);
      if (!client) throw new Error("Client " + clientId + " not found.");

      var standardVersion = SettingsRepository.getSettingValue("STANDARD_SOFTWARE_VERSION", "2.5.0");
      var isOutdated = false;
      var majorOutdated = false;

      if (client.softwareVersion && standardVersion) {
        var currentMajor = parseInt(client.softwareVersion.split(".")[0], 10);
        var targetMajor = parseInt(standardVersion.split(".")[0], 10);
        isOutdated = client.softwareVersion !== standardVersion;
        majorOutdated = currentMajor < targetMajor;
      }

      // Activity recency check
      var lastActiveStr = client.recentActivityTimestamp;
      var staleActivity = false;
      var daysIdle = 0;

      if (lastActiveStr) {
        var lastActiveTime = new Date(lastActiveStr).getTime();
        daysIdle = (new Date().getTime() - lastActiveTime) / (1000 * 60 * 60 * 24);
        if (daysIdle > 14) {
          staleActivity = true;
        }
      } else {
        staleActivity = true;
        daysIdle = 999;
      }

      var alertRequired = majorOutdated || staleActivity;
      if (alertRequired) {
        var warningMsg = "Client '" + client.name + "' is idle for " + Math.round(daysIdle) + " days or using a deprecated major software version (" + client.softwareVersion + ").";
        NotificationService.createSystemAlert("Client Usage Warning", warningMsg, CONSTANTS.NOTIFICATION_TYPES.WARNING);
      }

      return {
        clientId: clientId,
        clientName: client.name,
        currentVersion: client.softwareVersion,
        targetVersion: standardVersion,
        isOutdated: isOutdated,
        majorOutdated: majorOutdated,
        daysIdle: daysIdle,
        staleActivity: staleActivity,
        alertDispatched: alertRequired
      };
    });
  },

  /**
   * Fetches a single client by ID.
   */
  getClient: function(clientId) {
    return this._execute("getClient", function() {
      if (!clientId) throw new Error("Client ID is required.");
      var client = ClientRepository.find(clientId);
      if (!client) {
        throw new Error("Client with ID " + clientId + " not found.");
      }
      return client;
    });
  },

  /**
   * Retrieves all client records.
   */
  getClients: function() {
    return this._execute("getClients", function() {
      return ClientRepository.findAll(true);
    });
  },

  /**
   * Registers a new client.
   */
  createClient: function(payload, userContext) {
    var self = this;
    return this._execute("createClient", function() {
      Logger.log("createClient: " + JSON.stringify(payload));
      // Basic validation
      if (!payload.name) throw new Error("Client Name is required.");
      if (!payload.company) throw new Error("Client Company is required.");
      
      // Duplicate Request Protection
      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000); // Wait up to 10 seconds for the lock
        
        var cache = CacheService.getScriptCache();
        var jsonPayload = JSON.stringify(payload);
        var hash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, jsonPayload));
        var cacheKey = "dup_create_clt_" + hash;
        
        Logger.log("DEBUG: createClient payload: " + jsonPayload);
        Logger.log("DEBUG: createClient cacheKey: " + cacheKey);
        
        if (cache.get(cacheKey)) {
          Logger.log("DEBUG: Duplicate request detected for cacheKey: " + cacheKey);
          throw new Error("Duplicate request detected. Please wait a few seconds.");
        }
        
        // Database level check
        var allClients = ClientRepository.findAll(true);
        var duplicate = allClients.find(function(c) {
          return c.name === payload.name && c.company === payload.company;
        });
        if (duplicate) {
          Logger.log("DEBUG: Duplicate client detected in database: " + payload.name + ", " + payload.company);
          throw new Error("Client with this name and company already exists.");
        }
        
        cache.put(cacheKey, "true", 30); // 30 seconds
        Logger.log("DEBUG: Cached request: " + cacheKey);
        
        var clientId = IdGenerator.generateUuid("CLT"); // Generate Client ID
        var newClient = {
          id: clientId,
          name: payload.name,
          company: payload.company,
          phone: (payload.basicInfo && payload.basicInfo.phone) || payload.phone || "",
          email: (payload.basicInfo && payload.basicInfo.email) || payload.email || "",
          address: (payload.basicInfo && payload.basicInfo.address) || payload.address || "",
          status: payload.status || "Active",
          healthStatus: payload.healthStatus !== undefined ? Number(payload.healthStatus) : 100,
          expiryDate: payload.expiryDate || "",
          licenseType: payload.licenseType || "Standard",
          softwareVersion: payload.softwareVersion || "1.0.0",
          lastBackupDate: payload.lastBackupDate || "",
          recentActivityTimestamp: new Date().toISOString()
        };

        // Validate against the schema
        var validation = Validator.validate("CLIENT", newClient);
        if (!validation.isValid) {
          var err = new Error("Client payload validation failed: " + validation.errors.join("; "));
          err.status = CONFIG.HTTP_STATUS.BAD_REQUEST;
          err.errorCode = CONSTANTS.ERROR_CODES.REQ_VALIDATION_FAILED;
          err.validationErrors = validation.errors;
          throw err;
        }

        var inserted = ClientRepository.insert(newClient);
        AuditManager.logEvent("CLIENT_CREATION", "SUCCESS", userContext, "Created new client ID " + clientId + " (" + payload.name + ")");
        return inserted;
      } finally {
        lock.releaseLock();
      }
    }, userContext);
  },

  /**
   * Updates an existing client profile.
   */
  updateClient: function(clientId, updates, userContext) {
    var self = this;
    return this._execute("updateClient", function() {
      if (!clientId) throw new Error("Client ID is required.");
      var existing = ClientRepository.find(clientId);
      if (!existing) {
        throw new Error("Client with ID " + clientId + " not found.");
      }

      var updated = ClientRepository.update(clientId, updates);
      AuditManager.logEvent("CLIENT_UPDATE", "SUCCESS", userContext, "Updated client ID " + clientId);
      
      // Recalculate health automatically in case version or backup date updated
      self.recalculateHealthScore(clientId);

      return ClientRepository.find(clientId);
    }, userContext);
  },

  /**
   * Permanently purges a client profile.
   */
  deleteClient: function(clientId, userContext) {
    var self = this;
    return this._execute("deleteClient", function() {
      if (!clientId) throw new Error("Client ID is required.");
      var existing = ClientRepository.find(clientId);
      if (!existing) {
        throw new Error("Client with ID " + clientId + " not found.");
      }

      var deleted = ClientRepository.delete(clientId);
      AuditManager.logEvent("CLIENT_DELETION", "SUCCESS", userContext, "Deleted client ID " + clientId + " (" + existing.name + ")");
      return { id: clientId, success: deleted };
    }, userContext);
  }
};
