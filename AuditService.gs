/**
 * @fileoverview Compliance Audit Trail Processing Service.
 * Governs flushing staged in-memory audit logs atomically to the spreadsheet audit tables,
 * performing structured searches across audit history logs, and maintaining logs integrity.
 * @license Apache-2.0
 */

var AuditService = {
  serviceName: "AuditService",

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
          Utilities.sleep(150 * attempt);
        }
      }
    }

    var totalDuration = new Date().getTime() - startTime;
    LoggerService.error("[" + this.serviceName + "] Action '" + actionName + "' permanently failed after " + maxRetries + " attempts (" + totalDuration + "ms).", lastError);
    throw lastError;
  },

  /**
   * Commits all staged in-memory transactional audit logs to the persistent spreadsheet table.
   * Includes automated rollbacks: if sheet ingestion fails, the memory buffer remains intact for subsequent attempts.
   * 
   * @param {Object} [userContext] - Context of the caller
   * @return {number} Count of successfully persistent logs
   */
  flushStagedLogs: function(userContext) {
    var self = this;
    return this._execute("flushStagedLogs", function() {
      var logs = AuditManager.getStagedLogs();
      if (!logs || logs.length === 0) {
        return 0;
      }

      var count = logs.length;
      LoggerService.info("Audit: Committing " + count + " staged compliance logs atomically.");

      // Run transactional insert inside atomic LockManager
      LockManager.executeAtomic(function() {
        for (var i = 0; i < logs.length; i++) {
          AuditRepository.insert(logs[i]);
        }
      }, CONFIG.LOCK_TIMEOUT_MS);

      // Successfully committed, clear in-memory stage
      AuditManager.clearStagedLogs();
      LoggerService.info("Audit: Successfully committed " + count + " compliance audit logs to database. Staging buffer cleared.");

      // Clear search caches
      CacheManager.remove("DB_CACHE_" + CONFIG.SHEET_NAMES.AUDIT_LOGS);

      return count;
    }, userContext);
  },

  /**
   * Searches and filters the central compliance audit trail.
   * 
   * @param {Object} filters - Search attributes (userId, action, status, startDate, endDate, limit)
   * @return {Array<Object>} List of matched audit entries
   */
  queryAuditLogs: function(filters) {
    var self = this;
    return this._execute("queryAuditLogs", function() {
      var f = filters || {};
      
      // Attempt cache query if filter matches standard query
      var cacheKey = "AUDIT_QUERY_" + Utilities.base64Encode(JSON.stringify(f));
      var cached = CacheManager.getJson(cacheKey);
      if (cached) return cached;

      var allLogs = AuditRepository.findAll(true);
      var results = allLogs;

      // Filter by User Name / ID
      if (f.userId) {
        var cleanUser = String(f.userId).toLowerCase();
        results = results.filter(function(log) {
          return String(log.user).toLowerCase().indexOf(cleanUser) !== -1;
        });
      }

      // Filter by Action code
      if (f.action) {
        var cleanAction = String(f.action).toUpperCase();
        results = results.filter(function(log) {
          return log.action === cleanAction;
        });
      }

      // Filter by result status
      if (f.status) {
        var cleanStatus = String(f.status).toUpperCase();
        results = results.filter(function(log) {
          return log.status === cleanStatus;
        });
      }

      // Filter by date range
      if (f.startDate && f.endDate) {
        var start = new Date(f.startDate).getTime();
        var end = new Date(f.endDate).getTime();

        results = results.filter(function(log) {
          var t = new Date(log.timestamp).getTime();
          return t >= start && t <= end;
        });
      }

      // Sort logs descending (newest first)
      results.sort(function(a, b) {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      // Limit results
      if (f.limit && !isNaN(f.limit)) {
        results = results.slice(0, Number(f.limit));
      } else {
        results = results.slice(0, 100); // Default safety ceiling
      }

      // Cache search results for 1 minute
      CacheManager.putJson(cacheKey, results, 60);

      return results;
    });
  },

  /**
   * Purges audit logs older than a specified number of days to reclaim spreadsheet cell limits.
   * 
   * @param {number} retentionDays - Count of days to retain logs
   * @param {Object} userContext - Context profile of caller
   * @return {number} Count of purged logs rows
   */
  purgeOldLogs: function(retentionDays, userContext) {
    var self = this;
    return this._execute("purgeOldLogs", function() {
      if (!retentionDays || isNaN(retentionDays)) {
        throw new Error("A valid retention period in days is required.");
      }

      var thresholdTime = new Date().getTime() - (retentionDays * 1000 * 60 * 60 * 24);
      var allLogs = AuditRepository.findAll(true);
      var logsToKeep = [];
      var purgeCount = 0;

      allLogs.forEach(function(log) {
        var logTime = new Date(log.timestamp).getTime();
        if (logTime >= thresholdTime) {
          logsToKeep.push(log);
        } else {
          purgeCount++;
        }
      });

      if (purgeCount > 0) {
        LoggerService.warn("Audit: Purging " + purgeCount + " audit logs rows older than " + retentionDays + " days.");

        // Transactional clear and batch writeback
        LockManager.executeAtomic(function() {
          var sheet = AuditRepository.getSheet();
          if (sheet) {
            // Overwrite rows
            var lastRow = sheet.getLastRow();
            if (lastRow > 1) {
              sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
            }
            // Ingest back kept items
            logsToKeep.forEach(function(log) {
              AuditRepository.insert(log);
            });
          }
        }, CONFIG.LOCK_TIMEOUT_MS);

        AuditManager.logEvent("AUDIT_PURGE", "SUCCESS", userContext, "Purged " + purgeCount + " compliance audit log entries older than " + retentionDays + " days.");
        
        CacheManager.remove("DB_CACHE_" + CONFIG.SHEET_NAMES.AUDIT_LOGS);
      }

      return purgeCount;
    }, userContext);
  }
};
