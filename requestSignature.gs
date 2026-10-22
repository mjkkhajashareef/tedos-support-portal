/**
 * @fileoverview Request Signature & Integrity Validator.
 * Implements strict request signature checking and replay attack defenses.
 * @license Apache-2.0
 */

var RequestSignature = {
  // Replay Attack protection: reject requests older than 5 minutes (300 seconds)
  MAX_ALLOWED_CLOCK_SKEW_SEC: 300,

  /**
   * Validates full request integrity including signatures, API keys, device validation, and freshness.
   * 
   * @param {Object} headers - Incoming HTTP headers
   * @param {string} payload - Raw string request body (necessary to construct signature hash)
   * @param {string} method - HTTP Verb
   * @return {{isValid: boolean, errorCode: string|null, message: string|null}} Results structure
   */
  validateRequest: function(headers, payload, method) {
    // 1. Verify Api-Key header existence and match
    var apiKey = headers["X-API-Key"] || headers["x-api-key"] || headers["X-Api-Key"];
    if (!ApiKeyManager.validate(apiKey)) {
      return {
        isValid: false,
        errorCode: CONSTANTS.ERROR_CODES.AUTH_INVALID_API_KEY,
        message: "Invalid or missing server API key."
      };
    }

    // 2. Validate API Version matches configuration lock
    var apiVersion = headers["X-API-Version"] || headers["x-api-version"] || headers["X-Api-Version"];
    if (apiVersion !== CONFIG.API_VERSION) {
      return {
        isValid: false,
        errorCode: CONSTANTS.ERROR_CODES.REQ_BAD_VERSION,
        message: "Unsupported API version requested: " + apiVersion
      };
    }

    // 3. Validate Device ID
    var deviceId = headers["X-Device-ID"] || headers["x-device-id"] || headers["X-Device-Id"];
    if (!deviceId) {
      return {
        isValid: false,
        errorCode: CONSTANTS.ERROR_CODES.REQ_VALIDATION_FAILED,
        message: "X-Device-ID is required for all security requests."
      };
    }
    if (DeviceManager.isDeviceBanned(deviceId)) {
      return {
        isValid: false,
        errorCode: CONSTANTS.ERROR_CODES.AUTH_FORBIDDEN_ROLE,
        message: "Device registration has been suspended or banned."
      };
    }

    // 4. Validate timestamp freshness to prevent replay attacks
    var timestampStr = headers["X-Timestamp"] || headers["x-timestamp"] || headers["X-Timestamp"];
    if (!timestampStr) {
      return {
        isValid: false,
        errorCode: CONSTANTS.ERROR_CODES.REQ_VALIDATION_FAILED,
        message: "Request timestamp header (X-Timestamp) is missing."
      };
    }

    var requestTime = new Date(timestampStr).getTime();
    var currentTime = new Date().getTime();
    if (isNaN(requestTime)) {
      return {
        isValid: false,
        errorCode: CONSTANTS.ERROR_CODES.REQ_VALIDATION_FAILED,
        message: "Malformed request timestamp format."
      };
    }

    var skewSeconds = Math.abs(currentTime - requestTime) / 1000;
    if (skewSeconds > this.MAX_ALLOWED_CLOCK_SKEW_SEC) {
      return {
        isValid: false,
        errorCode: CONSTANTS.ERROR_CODES.AUTH_INVALID_SIGNATURE,
        message: "Request timestamp rejected (Clock skew " + Math.round(skewSeconds) + "s exceeds limit)."
      };
    }

    // 5. Verify Nonce uniqueness to prevent immediate replay
    var nonce = headers["X-Nonce"] || headers["x-nonce"] || headers["X-Nonce"];
    if (!nonce) {
      return {
        isValid: false,
        errorCode: CONSTANTS.ERROR_CODES.REQ_VALIDATION_FAILED,
        message: "Unique nonce (X-Nonce) header is missing."
      };
    }
    if (this.isNonceSpent(nonce)) {
      return {
        isValid: false,
        errorCode: CONSTANTS.ERROR_CODES.AUTH_INVALID_SIGNATURE,
        message: "Duplicate request signature. Nonce already consumed."
      };
    }

    // 6. Validate Signature matching HMAC-SHA256
    var signature = headers["X-Signature"] || headers["x-signature"] || headers["X-Signature"];
    if (method !== "GET" && !signature) {
      return {
        isValid: false,
        errorCode: CONSTANTS.ERROR_CODES.AUTH_MISSING_SIGNATURE,
        message: "Digital payload signature (X-Signature) is missing."
      };
    }

    if (signature) {
      var expectedSignature = this.calculateHmacSignature(method, timestampStr, nonce, payload || "");
      if (signature !== expectedSignature) {
        LoggerService.warn("HMAC Signature mismatch! Received: " + signature + " Expected: " + expectedSignature);
        return {
          isValid: false,
          errorCode: CONSTANTS.ERROR_CODES.AUTH_INVALID_SIGNATURE,
          message: "Cryptographic signature validation failed."
        };
      }
    }

    // Mark nonce as spent after validation
    this.markNonceSpent(nonce);

    return {
      isValid: true,
      errorCode: null,
      message: null
    };
  },

  /**
   * Generates HMAC-SHA256 signature matching client-side generator.
   * Signature String = method + "|" + timestamp + "|" + nonce + "|" + payload
   * 
   * @param {string} method - HTTP Verb
   * @param {string} timestamp - Header ISO timestamp
   * @param {string} nonce - Unique random value
   * @param {string} payload - Request body string
   * @return {string} Hex-encoded HMAC signature
   */
  calculateHmacSignature: function(method, timestamp, nonce, payload) {
    var signingSecret = getConfigValue("SIGNATURE_SECRET") || CONFIG.SIGNATURE_SECRET;
    var signatureBase = [
      method.toUpperCase(),
      timestamp,
      nonce,
      payload
    ].join("|");

    var signatureBytes = Utilities.computeHmacSignature(
      Utilities.MacAlgorithm.HMAC_SHA_256,
      signatureBase,
      signingSecret,
      Utilities.Charset.UTF_8
    );

    // Convert bytes to hex string representation
    return signatureBytes.map(function(byte) {
      var unsignedByte = byte < 0 ? byte + 256 : byte;
      var hex = unsignedByte.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  },

  /**
   * Verifies if a given nonce has already been registered in the system.
   * 
   * @param {string} nonce - Incoming nonce value
   * @return {boolean} True if the nonce was already used
   */
  isNonceSpent: function(nonce) {
    try {
      var spent = CacheManager.get("NONCE_" + nonce);
      return spent === "true";
    } catch (e) {
      return false;
    }
  },

  /**
   * Registers a nonce in Cache to prevent reuse.
   * Expired duration matches clock skew limit safely.
   * 
   * @param {string} nonce - Nonce to blacklist
   */
  markNonceSpent: function(nonce) {
    try {
      CacheManager.put("NONCE_" + nonce, "true", this.MAX_ALLOWED_CLOCK_SKEW_SEC);
    } catch (e) {
      LoggerService.error("Failed storing spent nonce in Cache", e);
    }
  }
};
