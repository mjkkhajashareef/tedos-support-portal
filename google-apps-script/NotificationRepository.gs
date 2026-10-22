/**
 * @fileoverview Notification Repository Layer.
 * Governs database operations for system alerts and broadcast notifications.
 * @license Apache-2.0
 */

var NotificationRepository = new SystemRepository(
  "NOTIFICATION",
  CONFIG.SHEET_NAMES.NOTIFICATIONS,
  "id",
  [
    { field: 'id', headerName: 'Notification ID', columnIndex: 0, dataType: 'string' },
    { field: 'title', headerName: 'Title', columnIndex: 1, dataType: 'string' },
    { field: 'message', headerName: 'Notification Message', columnIndex: 2, dataType: 'string' },
    { field: 'timestamp', headerName: 'Timestamp (ISO)', columnIndex: 3, dataType: 'string' },
    { field: 'read', headerName: 'Is Read', columnIndex: 4, dataType: 'boolean' },
    { field: 'type', headerName: 'Notification Type', columnIndex: 5, dataType: 'string' }
  ],
  "NOTIFICATION"
);

/**
 * Finds all unread notifications.
 * 
 * @return {Array<Object>} List of unread items
 */
NotificationRepository.findUnread = function() {
  return this.findWhere({ read: false });
};

/**
 * Marks all active unread notifications as read.
 */
NotificationRepository.markAllAsRead = function() {
  var unread = this.findUnread();
  if (unread.length === 0) return;

  var self = this;
  unread.forEach(function(item) {
    self.update(item.id, { read: true });
  });

  LoggerService.info("Marked " + unread.length + " notifications as read.");
};

/**
 * Retrieves the most recent N notifications.
 * 
 * @param {number} limitCount - Number of items to retrieve
 * @return {Array<Object>} List of recent notifications sorted by timestamp DESC
 */
NotificationRepository.findRecent = function(limitCount) {
  var records = this.findAll(true); // Include read/unread

  records.sort(function(a, b) {
    var timeA = new Date(a.timestamp || 0).getTime();
    var timeB = new Date(b.timestamp || 0).getTime();
    return timeB - timeA; // Descending
  });

  return records.slice(0, limitCount || 10);
};
