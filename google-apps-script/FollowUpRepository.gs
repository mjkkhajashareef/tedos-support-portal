/**
 * @fileoverview Follow Up Tracker Repository Layer.
 * Governs database operations for Follow-up tasks.
 * @license Apache-2.0
 */

var FollowUpRepository = new SystemRepository(
  "FOLLOW_UP",
  CONFIG.SHEET_NAMES.FOLLOW_UPS,
  "id",
  [
    { field: 'id', headerName: 'FollowUp ID', columnIndex: 0, dataType: 'string' },
    { field: 'ticketId', headerName: 'Ticket ID Link', columnIndex: 1, dataType: 'string' },
    { field: 'clientId', headerName: 'Client ID', columnIndex: 2, dataType: 'string' },
    { field: 'clientName', headerName: 'Client Name', columnIndex: 3, dataType: 'string' },
    { field: 'teId', headerName: 'TE Code', columnIndex: 4, dataType: 'string' },
    { field: 'executiveName', headerName: 'Executive', columnIndex: 5, dataType: 'string' },
    { field: 'scheduledDate', headerName: 'Scheduled Date', columnIndex: 6, dataType: 'string' },
    { field: 'scheduledTime', headerName: 'Scheduled Time', columnIndex: 7, dataType: 'string' },
    { field: 'priority', headerName: 'Priority', columnIndex: 8, dataType: 'string' },
    { field: 'lastContactDate', headerName: 'Last Contact Date', columnIndex: 9, dataType: 'string' },
    { field: 'status', headerName: 'Status', columnIndex: 10, dataType: 'string' },
    { field: 'reason', headerName: 'Follow-up Purpose', columnIndex: 11, dataType: 'string' },
    { field: 'remarks', headerName: 'Resolution Remarks', columnIndex: 12, dataType: 'string' },
    { field: 'nextAction', headerName: 'Recommended Action', columnIndex: 13, dataType: 'string' },
    { field: 'version', headerName: 'Record Version', columnIndex: 14, dataType: 'number' }
  ],
  "FOLLOW_UP"
);

/**
 * Finds follow-ups associated with a specific client.
 * 
 * @param {string} clientId
 * @return {Array<Object>} Matches list
 */
FollowUpRepository.findByClient = function(clientId) {
  return this.findWhere({ clientId: clientId });
};

/**
 * Finds follow-ups assigned to a specific technical executive.
 * 
 * @param {string} teId
 * @return {Array<Object>} Matches list
 */
FollowUpRepository.findByExecutive = function(teId) {
  return this.findWhere({ teId: teId });
};

/**
 * Finds all active / pending follow-up schedules.
 * 
 * @return {Array<Object>} Pending list
 */
FollowUpRepository.findPending = function() {
  return this.findWhere({ status: "Pending" });
};

/**
 * Finds follow-ups that have passed their scheduled execution date.
 * 
 * @return {Array<Object>} Overdue items list
 */
FollowUpRepository.findOverdue = function() {
  var pending = this.findPending();
  var todayStr = DateUtils.formatDateOnly(new Date());

  return pending.filter(function(item) {
    return item.scheduledDate < todayStr;
  });
};

/**
 * Performs key search across follow-up logs.
 * 
 * @param {string} queryText
 * @return {Array<Object>} Result list
 */
FollowUpRepository.search = function(queryText) {
  return this.searchText(queryText, ["id", "clientName", "reason", "remarks", "nextAction"]);
};
