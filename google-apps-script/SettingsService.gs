/**
 * @fileoverview System Settings and Configurations Business Service.
 * Coordinates system configuration properties, feature flags, and updates.
 * Leverages aggressive cache-aside patterns to prevent slow database reads.
 * @license Apache-2.0
 */

var SettingsService = {
  serviceName: "SettingsService",

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
   * Fetches a configuration property by key. Checks cache-aside first.
   * 
   * @param {string} key - Configuration settings key
   * @param {*} [defaultValue] - Fallback value if setting is missing
   * @return {*} Cast value
   */
  getSetting: function(key, defaultValue) {
    var self = this;
    return this._execute("getSetting", function() {
      if (!key) throw new Error("Settings key is required.");

      var cacheKey = "SETTINGS_ITEM_VAL_" + key;
      var cached = CacheManager.get(cacheKey);

      if (cached !== null) {
        // Cast boolean or numbers strings
        if (cached === "true") return true;
        if (cached === "false") return false;
        if (!isNaN(cached) && cached.trim() !== "") return Number(cached);
        return cached;
      }

      var val = SettingsRepository.getSettingValue(key, defaultValue);
      
      // Store value in cache as text for 30 minutes
      if (val !== undefined && val !== null) {
        CacheManager.put(cacheKey, String(val), 1800);
      }

      return val;
    });
  },

  /**
   * Updates or registers a system setting.
   * 
   * @param {string} key - Settings unique key
   * @param {*} value - Value to write
   * @param {Object} userContext - Context credentials
   * @return {Object} The registered setting row
   */
  updateSetting: function(key, value, userContext) {
    var self = this;
    return this._execute("updateSetting", function() {
      if (!key) throw new Error("Settings key is required.");
      if (value === undefined) throw new Error("Settings value is required.");

      // Store backup value in case of failures/rollbacks
      var oldVal = null;
      try {
        oldVal = SettingsRepository.getSettingValue(key, null);
      } catch (e) {}

      try {
        var updated = SettingsRepository.setSettingValue(key, String(value));

        // Audit trace compliance
        AuditManager.logEvent("SETTING_UPDATE", "SUCCESS", userContext, "Updated config setting '" + key + "'. Value changed from '" + oldVal + "' to '" + value + "'");

        // Invalidate key cache and overall dictionary cache
        CacheManager.remove("SETTINGS_ITEM_VAL_" + key);
        CacheManager.remove("SETTINGS_DICTIONARY_PAYLOAD");

        return { key: key, value: value };
      } catch (err) {
        LoggerService.error("Failed updating setting: " + key + ". Reverting to backup: " + oldVal);
        try {
          if (oldVal !== null) {
            SettingsRepository.setSettingValue(key, String(oldVal));
          }
        } catch (rErr) {
          LoggerService.error("CRITICAL: Reversal of setting write failed: " + key, rErr);
        }
        throw err;
      }
    }, userContext);
  },

  /**
   * Retrieves all configuration keys grouped into a dictionary object.
   * 
   * @return {Object} Dictionary key-value map
   */
  getAllSettings: function() {
    var self = this;
    return this._execute("getAllSettings", function() {
      var cacheKey = "SETTINGS_DICTIONARY_PAYLOAD";
      var cached = CacheManager.getJson(cacheKey);
      if (cached) return cached;

      var allItems = SettingsRepository.findAll(true);
      var dict = {};

      allItems.forEach(function(item) {
        var val = item.value;
        // Cast types
        if (val === "true") val = true;
        else if (val === "false") val = false;
        else if (!isNaN(val) && val.trim() !== "") val = Number(val);

        dict[item.key] = val;
      });

      CacheManager.putJson(cacheKey, dict, 1800); // 30 minutes caching

      return dict;
    });
  }
};
