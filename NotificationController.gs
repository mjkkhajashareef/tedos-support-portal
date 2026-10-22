/**
 * @fileoverview System Notification Controller Layer.
 * Coordinates HTTP/REST requests for notifications to the NotificationService.
 * @license Apache-2.0
 */

var NotificationController = {
  /**
   * Retrieves all notifications.
   */
  getNotifications: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET"],
      successMessage: "All notifications retrieved."
    }, function(body, userContext) {
      return NotificationService.getNotifications();
    });
  },

  /**
   * Retrieves only unread notifications.
   */
  getUnreadAlerts: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET"],
      successMessage: "Unread system alerts retrieved."
    }, function(body, userContext) {
      return NotificationService.getUnreadAlerts();
    });
  },

  /**
   * Retrieves recent notifications with optional limit.
   */
  getRecentNotifications: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET"],
      successMessage: "Recent notifications retrieved."
    }, function(body, userContext) {
      var limit = request.query ? request.query.limit : null;
      return NotificationService.getRecentNotifications(limit);
    });
  },

  /**
   * Dispatches a manual system notification alert.
   */
  createAlert: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "System alert dispatched successfully."
    }, function(body, userContext) {
      if (!body) throw new Error("Body payload is required.");
      var title = body.title;
      var message = body.message;
      var type = body.type;
      return NotificationService.createSystemAlert(title, message, type);
    });
  },

  /**
   * Batch creates multiple notifications.
   */
  batchCreateAlerts: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Batch notifications creation completed."
    }, function(body, userContext) {
      if (!body || !Array.isArray(body)) {
        throw new Error("Payload body must be a JSON array of alerts.");
      }
      var results = [];
      for (var i = 0; i < body.length; i++) {
        try {
          var item = body[i];
          var alert = NotificationService.createSystemAlert(item.title, item.message, item.type);
          results.push({ index: i, success: true, notification: alert });
        } catch (err) {
          results.push({ index: i, success: false, message: err.message });
        }
      }
      return results;
    });
  },

  /**
   * Marks a specific notification alert as read.
   */
  markRead: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Notification marked as read."
    }, function(body, userContext) {
      var id = body ? body.id : (request.query ? request.query.id : null);
      return NotificationService.markRead(id, userContext);
    });
  },

  /**
   * Marks all system notifications as read.
   */
  markAllRead: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "All notifications marked as read."
    }, function(body, userContext) {
      var count = NotificationService.markAllRead(userContext);
      return { count: count };
    });
  },

  /**
   * Deletes a notification.
   */
  deleteNotification: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["DELETE"],
      successMessage: "Notification deleted successfully."
    }, function(body, userContext) {
      var id = request.query ? request.query.id : null;
      return NotificationService.deleteNotification(id, userContext);
    });
  }
};
