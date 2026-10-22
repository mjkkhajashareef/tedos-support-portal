/**
 * @fileoverview System Health and Performance Monitoring Service.
 * Evaluates active sheets cell/row counts, Cache Service accessibility, and execution speeds.
 * Includes a safe write-and-rollback throughput diagnostic probe.
 * @license Apache-2.0
 */

var HealthService = {
  serviceName: "HealthService",

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
   * Compiles a comprehensive technical health and capacity report of the system.
   * 
   * @return {Object} System health metrics payload
   */
  getSystemHealthReport: function() {
    var self = this;
    return this._execute("getSystemHealthReport", function() {
      var cacheKey = "SYSTEM_HEALTH_METRICS_REPORT";
      var cached = CacheManager.getJson(cacheKey);
      if (cached) return cached;

      var startTime = new Date().getTime();
      var sheetsInfo = {};
      var totalRowsCount = 0;
      var status = "Healthy";
      var warningsList = [];

      try {
        var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID || SpreadsheetApp.getActiveSpreadsheet().getId());
        var sheets = ss.getSheets();

        sheets.forEach(function(sheet) {
          var name = sheet.getName();
          var rows = sheet.getLastRow();
          var cols = sheet.getLastColumn();
          var cellsCount = rows * cols;

          sheetsInfo[name] = {
            rows: rows,
            columns: cols,
            estimatedCellsCount: cellsCount
          };

          totalRowsCount += rows;

          // Flag sheet size warning if any single table is approaching 50,000 rows
          if (rows > 40000) {
            status = "Warning";
            warningsList.push("Table '" + name + "' size is extremely large (" + rows + " rows). Archival recommended.");
          }
        });
      } catch (dbErr) {
        LoggerService.error("Database health query failed.", dbErr);
        status = "Degraded";
        warningsList.push("Database connection failed or spreadsheet ID is misconfigured.");
      }

      // Check Cache service
      var cacheActive = false;
      try {
        var testCache = CacheService.getScriptCache();
        if (testCache) cacheActive = true;
      } catch (cErr) {
        warningsList.push("CacheService is unavailable in this environment execution.");
      }

      var pingTime = self.pingDatabase();

      var report = {
        status: status,
        environment: getEnvironment(),
        timestamp: new Date().toISOString(),
        databaseLatencyMs: pingTime,
        databaseConnectivity: status !== "Degraded",
        cacheServiceActive: cacheActive,
        totalRowsAcrossTables: totalRowsCount,
        tablesCapacitySummary: sheetsInfo,
        healthAlerts: warningsList,
        compilationDurationMs: new Date().getTime() - startTime
      };

      // Cache health report for 2 minutes to prevent heavy load
      CacheManager.putJson(cacheKey, report, 120);

      return report;
    });
  },

  /**
   * Safely conducts a live transaction throughput diagnostic probe against settings and rolls back immediately.
   * 
   * @return {number} Response time in milliseconds
   */
  pingDatabase: function() {
    var startTime = new Date().getTime();
    try {
      // Direct fast read test on settings
      var testVal = SettingsRepository.getSettingValue("SYSTEM_HEALTH_PING_KEY", "OFFLINE");
      
      // Perform atomic diagnostic write-and-rollback
      LockManager.executeAtomic(function() {
        var sheet = SettingsRepository.getSheet();
        if (sheet) {
          // Safe fast diagnostic write to first empty row (using high bounds to prevent collision)
          var row = sheet.getLastRow() + 1;
          sheet.getRange(row, 1, 1, 3).setValues([["DIAGNOSTIC_PING", new Date().toISOString(), "1"]]);
          
          // ROLLBACK immediately - delete the diagnostic row we just appended
          sheet.deleteRow(row);
        }
      }, CONFIG.LOCK_TIMEOUT_MS);

      return new Date().getTime() - startTime;
    } catch (e) {
      LoggerService.error("Diagnostic Ping Probe failed.", e);
      return -1;
    }
  }
};
