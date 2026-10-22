/**
 * @fileoverview Request Rate Limiter.
 * Prevents DDoS and API abuse using rolling-window thresholds tracked in the Cache partition.
 * @license Apache-2.0
 */

var RateLimiter = {
  // Rolling Window Size in Seconds (1 minute)
  WINDOW_SIZE_SEC: 60,

  /**
   * Verifies if the request violates rate-limiting thresholds.
   * Checks API Key limits, Device ID limits, and User session limits.
   * 
   * @param {Object} headers - Incoming HTTP headers
   * @param {string|null} userId - Resolved active User ID (if logged in)
   * @param {string|null} clientIp - Client IP placeholder (if provided)
   * @return {{isAllowed: boolean, currentCount: number, limit: number}} Limits verification status
   */
  checkLimit: function(headers, userId, clientIp) {
    var apiKey = headers["X-API-Key"] || headers["x-api-key"];
    var deviceId = headers["X-Device-ID"] || headers["x-device-id"];
    
    var maxRequests = getConfigValue("RATE_LIMIT_REQUESTS_PER_MIN") || CONFIG.RATE_LIMIT_REQUESTS_PER_MIN;

    // Compile limit scopes
    var checks = [];

    if (apiKey) {
      checks.push({ key: "RL_APIKEY_" + apiKey, limit: maxRequests });
    }
    if (deviceId) {
      checks.push({ key: "RL_DEV_" + deviceId, limit: maxRequests });
    }
    if (userId) {
      checks.push({ key: "RL_USER_" + userId, limit: maxRequests });
    }
    if (clientIp) {
      checks.push({ key: "RL_IP_" + clientIp, limit: maxRequests });
    }

    var worstCaseCount = 0;
    var worstCaseLimit = maxRequests;
    var isAllowed = true;

    // Validate all scopes
    for (var i = 0; i < checks.length; i++) {
      var check = checks[i];
      var count = this.incrementWindowCount(check.key);
      
      if (count > worstCaseCount) {
        worstCaseCount = count;
        worstCaseLimit = check.limit;
      }

      if (count > check.limit) {
        isAllowed = false;
        LoggerService.warn("Rate limit breached for key scope: " + check.key + " (Count: " + count + " limit: " + check.limit + ")");
      }
    }

    return {
      isAllowed: isAllowed,
      currentCount: worstCaseCount,
      limit: worstCaseLimit
    };
  },

  /**
   * Increments the request counter in Cache for the current rolling window.
   * 
   * @param {string} cacheKey - Specific scope identity key
   * @return {number} Current transaction count in window
   */
  incrementWindowCount: function(cacheKey) {
    try {
      var countStr = CacheManager.get(cacheKey);
      var currentCount = 0;

      if (countStr) {
        currentCount = parseInt(countStr, 10);
      }

      currentCount++;

      // Write count back with window expiry
      CacheManager.put(cacheKey, String(currentCount), this.WINDOW_SIZE_SEC);
      return currentCount;
    } catch (e) {
      LoggerService.error("Failed executing RateLimiter window checks, failing open to prevent locking users out.", e);
      return 1;
    }
  },

  /**
   * Resets rate limiter stats for a given target entity.
   * 
   * @param {string} targetKey - Specific key (e.g. user ID, device ID)
   */
  resetLimit: function(targetKey) {
    CacheManager.remove("RL_APIKEY_" + targetKey);
    CacheManager.remove("RL_DEV_" + targetKey);
    CacheManager.remove("RL_USER_" + targetKey);
    CacheManager.remove("RL_IP_" + targetKey);
    LoggerService.info("Rate limiter counts reset for: " + targetKey);
  }
};
