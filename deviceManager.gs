/**
 * @fileoverview Device Registration & Validation Manager.
 * Governs active device IDs, client fingerprint validation, and multi-device policies.
 * @license Apache-2.0
 */

var DeviceManager = {
  /**
   * Generates a device fingerprint based on headers and user meta-information.
   * 
   * @param {Object} browserMeta - Client telemetry (user agent, language, platform)
   * @return {string} Standardized device fingerprint string
   */
  generateFingerprint: function(browserMeta) {
    if (!browserMeta) return IdGenerator.generateUuid("DEV");

    var rawString = [
      browserMeta.userAgent || "",
      browserMeta.language || "",
      browserMeta.platform || "",
      browserMeta.screenResolution || ""
    ].join("|");

    // Computes a secure hash of the metadata
    var signatureBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, rawString, Utilities.Charset.UTF_8);
    var hexString = signatureBytes.map(function(byte) {
      var unsignedByte = byte < 0 ? byte + 256 : byte;
      var hex = unsignedByte.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");

    return "DEV-" + hexString.substring(0, 16).toUpperCase();
  },

  /**
   * Validates if a device context is approved for a given user.
   * Leverages script properties cache for device listings to respect the "no-repository-yet" constraint.
   * 
   * @param {string} deviceId - Client device ID
   * @param {string} userId - Owner user ID
   * @return {boolean} True if the device matches security constraints
   */
  validateDevice: function(deviceId, userId) {
    if (!deviceId) return false;

    // Check if device is banned globally
    if (this.isDeviceBanned(deviceId)) {
      LoggerService.warn("Access attempt from banned device ID: " + deviceId);
      return false;
    }

    // Future Multi-Device policy verification
    var registeredOwner = this.getDeviceOwner(deviceId);
    if (registeredOwner && registeredOwner !== userId) {
      LoggerService.warn("Device validation failed. Device ID: " + deviceId + " is registered to another user.");
      return false;
    }

    return true;
  },

  /**
   * Banches a device identifier from server access.
   * 
   * @param {string} deviceId
   */
  banDevice: function(deviceId) {
    if (!deviceId) return;
    try {
      PropertiesService.getScriptProperties().setProperty("BANNED_DEV_" + deviceId, "true");
      LoggerService.warn("Device has been globally banned: " + deviceId);
    } catch (e) {
      LoggerService.error("Failed to ban device ID: " + deviceId, e);
    }
  },

  /**
   * Checks if device is banned.
   * 
   * @param {string} deviceId
   * @return {boolean}
   */
  isDeviceBanned: function(deviceId) {
    try {
      var status = PropertiesService.getScriptProperties().getProperty("BANNED_DEV_" + deviceId);
      return status === "true";
    } catch (e) {
      return false;
    }
  },

  /**
   * Associates a device with a user.
   * 
   * @param {string} deviceId
   * @param {string} userId
   */
  registerDeviceToUser: function(deviceId, userId) {
    if (!deviceId || !userId) return;
    try {
      PropertiesService.getScriptProperties().setProperty("DEV_OWNER_" + deviceId, userId);
      LoggerService.info("Device registered to User: " + userId);
    } catch (e) {
      LoggerService.error("Failed registering device to user in properties", e);
    }
  },

  /**
   * Retrieves the owner user of a registered device.
   * 
   * @param {string} deviceId
   * @return {string|null} User ID or null
   */
  getDeviceOwner: function(deviceId) {
    try {
      return PropertiesService.getScriptProperties().getProperty("DEV_OWNER_" + deviceId);
    } catch (e) {
      return null;
    }
  }
};
