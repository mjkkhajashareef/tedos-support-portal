/**
 * @fileoverview Work Log Repository Layer.
 * Governs database operations for Executive Work Logs.
 * @license Apache-2.0
 */

var WorkLogRepository = new SystemRepository(
  "WORK_LOG",
  CONFIG.SHEET_NAMES.WORK_LOGS,
  "id",
  [
    { field: 'id', headerName: 'Log ID', columnIndex: 0, dataType: 'string' },
    { field: 'ticketId', headerName: 'Ticket ID Link', columnIndex: 1, dataType: 'string' },
    { field: 'clientId', headerName: 'Client ID', columnIndex: 2, dataType: 'string' },
    { field: 'clientName', headerName: 'Client Name', columnIndex: 3, dataType: 'string' },
    { field: 'timestamp', headerName: 'Timestamp (ISO)', columnIndex: 4, dataType: 'string' },
    { field: 'date', headerName: 'Date Logged', columnIndex: 5, dataType: 'string' },
    { field: 'time', headerName: 'Time Logged', columnIndex: 6, dataType: 'string' },
    { field: 'executiveName', headerName: 'Executive Name', columnIndex: 7, dataType: 'string' },
    { field: 'teId', headerName: 'TE Code', columnIndex: 8, dataType: 'string' },
    { field: 'category', headerName: 'Work Type', columnIndex: 9, dataType: 'string' },
    { field: 'details', headerName: 'Summary Notes', columnIndex: 10, dataType: 'string' },
    { field: 'status', headerName: 'Action Status', columnIndex: 11, dataType: 'string' },
    { field: 'nextFollowUpDate', headerName: 'Next Callback Date', columnIndex: 12, dataType: 'string' },
    { field: 'priority', headerName: 'Task Priority', columnIndex: 13, dataType: 'string' },
    { field: 'durationMinutes', headerName: 'Duration in Mins', columnIndex: 14, dataType: 'number' },
    { field: 'remarks', headerName: 'Internal Remarks', columnIndex: 15, dataType: 'string' }
  ],
  "WORK_LOG"
);

/**
 * Finds work logs associated with a specific client.
 * 
 * @param {string} clientId
 * @return {Array<Object>} Matches list
 */
WorkLogRepository.findByClient = function(clientId) {
  return this.findWhere({ clientId: clientId });
};

/**
 * Finds work logs linked to a specific support ticket.
 * 
 * @param {string} ticketId
 * @return {Array<Object>} Matches list
 */
WorkLogRepository.findByTicket = function(ticketId) {
  return this.findWhere({ ticketId: ticketId });
};

/**
 * Finds work logs created by a specific technical executive ID.
 * 
 * @param {string} teId
 * @return {Array<Object>} Matches list
 */
WorkLogRepository.findByExecutive = function(teId) {
  return this.findWhere({ teId: teId });
};

/**
 * Retrieves work logs submitted within a given date range.
 * 
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @return {Array<Object>} Matching logs
 */
WorkLogRepository.findByDateRange = function(startDate, endDate) {
  var records = this.findAll(false);
  var start = new Date(startDate).getTime();
  var end = new Date(endDate).getTime();

  return records.filter(function(log) {
    if (!log.date) return false;
    var logTime = new Date(log.date).getTime();
    return logTime >= start && logTime <= end;
  });
};

/**
 * Global search over work logs notes and details.
 * 
 * @param {string} queryText
 * @return {Array<Object>} Search results
 */
WorkLogRepository.search = function(queryText) {
  return this.searchText(queryText, ["id", "clientName", "details", "remarks", "executiveName"]);
};
