/**
 * @fileoverview Caching Layer wrapper over Google Apps Script CacheService.
 * Minimizes active spreadsheet reads to maintain fast API response times.
 * @license Apache-2.0
 */

var CacheManager = {
  /**
   * Retrieves the designated Cache partition.
   * Uses scriptCache to share cache state across user sessions safely.
   * 
   * @private
   */
  getCache: function() {
    try {
      return CacheService.getScriptCache();
    } catch (e) {
      LoggerService.error("CacheService is unavailable in the current context.", e);
      return null;
    }
  },

  /**
   * Fetches cached text item by its key.
   * 
   * @param {string} key - Cache lookup key
   * @return {string|null} Cached string or null if expired/missing
   */
  get: function(key) {
    var cache = this.getCache();
    if (!cache) return null;

    try {
      var val = cache.get(key);
      if (val) {
        LoggerService.info("Cache HIT for key: " + key);
        return val;
      }
      LoggerService.info("Cache MISS for key: " + key);
    } catch (e) {
      LoggerService.error("Failed to read from Cache for key: " + key, e);
    }
    return null;
  },

  /**
   * Fetches cached JSON object.
   * 
   * @param {string} key - Cache lookup key
   * @return {Object|null} Decoded JSON object or null
   */
  getJson: function(key) {
    var str = this.get(key);
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch (e) {
      LoggerService.error("Failed to parse cached JSON for key: " + key, e);
      return null;
    }
  },

  /**
   * Caches a text value with a set expiration.
   * 
   * @param {string} key - Cache destination key
   * @param {string} value - String data to store
   * @param {number} [expirationSeconds] - Optional expiry ceiling (Default is CONFIG.CACHE_EXPIRATION_SECONDS)
   */
  put: function(key, value, expirationSeconds) {
    var cache = this.getCache();
    if (!cache) return;

    var expiry = expirationSeconds || CONFIG.CACHE_EXPIRATION_SECONDS;
    // Cache limit is 21600 seconds (6 hours)
    expiry = Math.min(expiry, 21600);

    try {
      cache.put(key, value, expiry);
      LoggerService.info("Cache WRITE for key: " + key + " expiry: " + expiry + "s");
    } catch (e) {
      LoggerService.error("Failed to write to Cache for key: " + key, e);
    }
  },

  /**
   * Caches a JSON object value.
   * 
   * @param {string} key - Cache destination key
   * @param {Object} value - Payload object to store
   * @param {number} [expirationSeconds] - Optional expiry ceiling
   */
  putJson: function(key, value, expirationSeconds) {
    try {
      this.put(key, JSON.stringify(value), expirationSeconds);
    } catch (e) {
      LoggerService.error("Failed to stringify JSON payload before caching for key: " + key, e);
    }
  },

  /**
   * Invalidates and clears a cached item.
   * 
   * @param {string} key - Cache key to remove
   */
  remove: function(key) {
    var cache = this.getCache();
    if (!cache) return;

    try {
      cache.remove(key);
      LoggerService.info("Cache REMOVE for key: " + key);
    } catch (e) {
      LoggerService.error("Failed to remove key from cache: " + key, e);
    }
  }
};
