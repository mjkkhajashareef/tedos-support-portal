/**
 * @fileoverview API Key Manager.
 * Handles secure validation, rotation and status tracking of client API keys.
 * @license Apache-2.0
 */

var ApiKeyManager = {
  /**
   * Validates the provided API key against configured script properties or memory.
   * 
   * @param {string} apiKey - Incoming API key from client headers
   * @return {boolean} True if the API key is active and matches
   */
  validate: function(apiKey) {
    if (!apiKey) return false;

    // Retrieve active key
    var activeKey = this.getActiveKey();
    if (!activeKey) {
      LoggerService.error("API Key database configuration is missing on the server.");
      return false;
    }

    // Check if key is disabled
    if (this.isKeyDisabled(apiKey)) {
      LoggerService.warn("Attempt to access with a disabled API key: " + apiKey.substring(0, 5) + "...");
      return false;
    }

    return apiKey === activeKey;
  },

  /**
   * Retrieves the active API key from PropertiesService or CONFIG fallback.
   * 
   * @return {string}
   */
  getActiveKey: function() {
    try {
      var key = PropertiesService.getScriptProperties().getProperty("API_KEY");
      if (key) return key;
    } catch (e) {
      LoggerService.error("PropertiesService unavailable while retrieving API_KEY", e);
    }
    return CONFIG.API_KEY;
  },

  /**
   * Disables an API Key by adding it to a revocation blacklist in Script Properties.
   * 
   * @param {string} apiKey - Key to blacklist
   */
  disableKey: function(apiKey) {
    if (!apiKey) return;
    try {
      var properties = PropertiesService.getScriptProperties();
      properties.setProperty("DISABLED_KEY_" + apiKey, "true");
      LoggerService.warn("API Key has been blacklisted/disabled on the server.");
    } catch (e) {
      LoggerService.error("Failed to write blacklisted API key to PropertiesService", e);
    }
  },

  /**
   * Rotates the current active API Key.
   * 
   * @param {string} newKey - The fresh secure key
   */
  rotateKey: function(newKey) {
    if (!newKey || newKey.length < 16) {
      throw new Error("Invalid new API key length. Must be at least 16 characters.");
    }
    try {
      var properties = PropertiesService.getScriptProperties();
      var oldKey = this.getActiveKey();
      
      // Blacklist old key
      if (oldKey) {
        properties.setProperty("DISABLED_KEY_" + oldKey, "true");
      }
      
      // Save new key
      properties.setProperty("API_KEY", newKey);
      LoggerService.info("API Key rotated successfully.");
    } catch (e) {
      LoggerService.error("Error writing rotated API Key to properties", e);
      throw e;
    }
  },

  /**
   * Checks if an API key is revoked.
   * 
   * @param {string} apiKey - API Key to check
   * @return {boolean} True if the key is blacklisted
   */
  isKeyDisabled: function(apiKey) {
    try {
      var disabled = PropertiesService.getScriptProperties().getProperty("DISABLED_KEY_" + apiKey);
      return disabled === "true";
    } catch (e) {
      return false;
    }
  }
};
