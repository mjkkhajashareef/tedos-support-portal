/**
 * @fileoverview System Notification Business Service.
 * Governs creating notifications, tracking unread counts, marking alerts as read, and cleaning old logs.
 * @license Apache-2.0
 */

var NotificationService = {
  serviceName: "NotificationService",

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
   * Dispatches a new system notification.
   * 
   * @param {string} title - Alert title
   * @param {string} message - Primary alert body text
   * @param {string} type - Notification alert severity (info, success, warning, error)
   * @return {Object} Generated notification payload record
   */
  createSystemAlert: function(title, message, type) {
    var self = this;
    return this._execute("createSystemAlert", function() {
      if (!title) throw new Error("Notification title is required.");
      if (!message) throw new Error("Notification message is required.");

      var cleanType = type || CONSTANTS.NOTIFICATION_TYPES.INFO;
      
      // Ensure type conforms to acceptable list
      var validTypes = [
        CONSTANTS.NOTIFICATION_TYPES.INFO,
        CONSTANTS.NOTIFICATION_TYPES.SUCCESS,
        CONSTANTS.NOTIFICATION_TYPES.WARNING,
        CONSTANTS.NOTIFICATION_TYPES.ERROR
      ];
      if (validTypes.indexOf(cleanType) === -1) {
        cleanType = CONSTANTS.NOTIFICATION_TYPES.INFO;
      }

      var alertId = IdGenerator.generateUuid("NOT");
      var alertRecord = {
        id: alertId,
        title: title,
        message: message,
        timestamp: new Date().toISOString(),
        read: false,
        type: cleanType
      };

      // Atomic write via repository
      var insertedRecord = NotificationRepository.insert(alertRecord);

      LoggerService.info("Notification alert dispatched: [" + cleanType.toUpperCase() + "] " + title);

      // Invalidate notification caches
      CacheManager.remove("DB_CACHE_" + CONFIG.SHEET_NAMES.NOTIFICATIONS);

      return insertedRecord;
    });
  },

  /**
   * Marks a specific notification as read.
   * 
   * @param {string} id - Target notification ID
   * @param {Object} userContext - Current user context
   * @return {Object} The updated alert record
   */
  markRead: function(id, userContext) {
    var self = this;
    return this._execute("markRead", function() {
      if (!id) throw new Error("Notification ID is required.");

      var alert = NotificationRepository.find(id);
      if (!alert) throw new Error("Notification with ID " + id + " not found.");

      if (alert.read) return alert; // Idempotent check

      var updated = NotificationRepository.update(id, { read: true });

      // Refresh cache
      CacheManager.remove("DB_CACHE_" + CONFIG.SHEET_NAMES.NOTIFICATIONS);

      return updated;
    }, userContext);
  },

  /**
   * Marks all system notifications as read.
   * 
   * @param {Object} userContext - Current user context
   * @return {number} Count of alerts updated
   */
  markAllRead: function(userContext) {
    var self = this;
    return this._execute("markAllRead", function() {
      var unread = NotificationRepository.findUnread();
      var count = unread.length;

      if (count === 0) return 0;

      NotificationRepository.markAllAsRead();

      // Refresh cache
      CacheManager.remove("DB_CACHE_" + CONFIG.SHEET_NAMES.NOTIFICATIONS);

      return count;
    }, userContext);
  },

  /**
   * Fetches the current list of unread system alerts.
   * 
   * @return {Array<Object>} List of unread notification payloads
   */
  getUnreadAlerts: function() {
    var self = this;
    return this._execute("getUnreadAlerts", function() {
      return NotificationRepository.findUnread();
    });
  },

  /**
   * Fetches recent notifications (read and unread) up to a threshold count.
   * 
   * @param {number} [limit=10] - Max elements to return
   * @return {Array<Object>} Truncated notifications list
   */
  getRecentNotifications: function(limit) {
    var self = this;
    return this._execute("getRecentNotifications", function() {
      var num = limit || 15;
      return NotificationRepository.findRecent(num);
    });
  },

  /**
   * Retrieves all notifications.
   */
  getNotifications: function() {
    var self = this;
    return this._execute("getNotifications", function() {
      return NotificationRepository.findAll(true);
    });
  },

  /**
   * Deletes a notification by ID.
   */
  deleteNotification: function(id, userContext) {
    var self = this;
    return this._execute("deleteNotification", function() {
      if (!id) throw new Error("Notification ID is required.");
      var existing = NotificationRepository.find(id);
      if (!existing) {
        throw new Error("Notification with ID " + id + " not found.");
      }

      var deleted = NotificationRepository.delete(id);
      LoggerService.info("Notification deleted: ID " + id);
      CacheManager.remove("DB_CACHE_" + CONFIG.SHEET_NAMES.NOTIFICATIONS);
      return { id: id, success: deleted };
    }, userContext);
  }
};
