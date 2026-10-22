/**
 * @fileoverview Audit Log Repository Layer.
 * Governs database operations for transaction audits and security ledgers.
 * @license Apache-2.0
 */

var AuditRepository = new SystemRepository(
  "AUDIT_LOG",
  CONFIG.SHEET_NAMES.AUDIT_LOGS,
  "id",
  [
    { field: 'id', headerName: 'Event ID', columnIndex: 0, dataType: 'string' },
    { field: 'type', headerName: 'Event Type', columnIndex: 1, dataType: 'string' },
    { field: 'timestamp', headerName: 'Occurred At (ISO)', columnIndex: 2, dataType: 'string' },
    { field: 'performedBy', headerName: 'Action Performed By', columnIndex: 3, dataType: 'string' },
    { field: 'notes', headerName: 'Audit Description', columnIndex: 4, dataType: 'string' },
    { field: 'ticketId', headerName: 'Connected Ticket ID', columnIndex: 5, dataType: 'string' },
    { field: 'clientId', headerName: 'Connected Client ID', columnIndex: 6, dataType: 'string' }
  ],
  null // Append-only ledger; validator not required to avoid recursive failure loops
);

/**
 * Flush all logs staged during the active transaction into the spreadsheet.
 */
AuditRepository.saveStagedLogs = function() {
  var staged = AuditManager.getStagedLogs();
  if (!staged || staged.length === 0) return;

  var mappedRecords = staged.map(function(log) {
    // Attempt parsing details to extract potential connected ticket or client references
    var parsedTicketId = "";
    var parsedClientId = "";

    if (log.details) {
      var ticketMatch = log.details.match(/TKT-\d{4}-\d{5}/);
      if (ticketMatch) parsedTicketId = ticketMatch[0];

      var clientMatch = log.details.match(/CLT-\d{4}/);
      if (clientMatch) parsedClientId = clientMatch[0];
    }

    return {
      id: log.id,
      type: log.action || "SYSTEM_EVENT",
      timestamp: log.timestamp || new Date().toISOString(),
      performedBy: log.user + " (Device: " + log.device + ", Session: " + log.session + ")",
      notes: "[" + (log.status || "INFO") + "] " + (log.details || "") + " | ReqID: " + (log.requestId || "none"),
      ticketId: parsedTicketId,
      clientId: parsedClientId
    };
  });

  try {
    this.batchWrite(mappedRecords);
    AuditManager.clearStagedLogs();
    LoggerService.info("Flushed " + mappedRecords.length + " transactional audit logs to spreadsheet storage.");
  } catch (e) {
    // Fail-safe print to prevent complete backend deadlock on audit-writing failure
    LoggerService.error("CRITICAL SECURITY RISK: Failed to write transaction audit trail to Google Sheets database.", e);
  }
};

/**
 * Finds audit logs filtered by target user identity.
 * 
 * @param {string} user
 * @return {Array<Object>} List of matches
 */
AuditRepository.findByUser = function(user) {
  var records = this.findAll(true);
  return records.filter(function(log) {
    return log.performedBy && log.performedBy.indexOf(user) !== -1;
  });
};
