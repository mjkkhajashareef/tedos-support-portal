/**
 * @fileoverview Ticket Repository Layer.
 * Governs database operations for Support Tickets.
 * @license Apache-2.0
 */

var TicketRepository = new SystemRepository(
  "TICKET",
  CONFIG.SHEET_NAMES.TICKETS,
  "id",
  [
    { field: 'id', headerName: 'Ticket ID', columnIndex: 0, dataType: 'string' },
    { field: 'teId', headerName: 'Technical Exec ID', columnIndex: 1, dataType: 'string' },
    { field: 'clientId', headerName: 'Client ID', columnIndex: 2, dataType: 'string' },
    { field: 'clientName', headerName: 'Client Name', columnIndex: 3, dataType: 'string' },
    { field: 'issueCategory', headerName: 'Category', columnIndex: 4, dataType: 'string' },
    { field: 'issueDescription', headerName: 'Description', columnIndex: 5, dataType: 'string' },
    { field: 'priority', headerName: 'Priority', columnIndex: 6, dataType: 'string' },
    { field: 'status', headerName: 'Status', columnIndex: 7, dataType: 'string' },
    { field: 'assignedExecutive', headerName: 'Assigned Executive', columnIndex: 8, dataType: 'string' },
    { field: 'createdBy', headerName: 'Created By', columnIndex: 9, dataType: 'string' },
    { field: 'createdDate', headerName: 'Creation Date', columnIndex: 10, dataType: 'string' },
    { field: 'updatedDate', headerName: 'Last Updated Date', columnIndex: 11, dataType: 'string' },
    { field: 'resolutionSummary', headerName: 'Resolution Details', columnIndex: 12, dataType: 'string' },
    { field: 'closedDate', headerName: 'Close Date', columnIndex: 13, dataType: 'string' },
    { field: 'version', headerName: 'Record Version', columnIndex: 14, dataType: 'number' }
  ],
  "TICKET"
);

/**
 * Finds tickets associated with a specific client.
 * 
 * @param {string} clientId
 * @return {Array<Object>} List of matches
 */
TicketRepository.findByClient = function(clientId) {
  return this.findWhere({ clientId: clientId });
};

/**
 * Finds tickets with a specific status.
 * 
 * @param {string} status
 * @return {Array<Object>} List of matches
 */
TicketRepository.findByStatus = function(status) {
  return this.findWhere({ status: status });
};

/**
 * Finds tickets assigned to a specific executive.
 * 
 * @param {string} executiveName
 * @return {Array<Object>} List of matches
 */
TicketRepository.findByAssignedExecutive = function(executiveName) {
  return this.findWhere({ assignedExecutive: executiveName });
};

/**
 * Returns all unresolved/open support tickets.
 * 
 * @return {Array<Object>} List of open tickets
 */
TicketRepository.findOpenTickets = function() {
  var records = this.findAll(false);
  return records.filter(function(ticket) {
    return ticket.status !== "Resolved" && ticket.status !== "Closed";
  });
};

/**
 * Search on ticket attributes.
 * 
 * @param {string} queryText
 * @return {Array<Object>} Match results
 */
TicketRepository.search = function(queryText) {
  return this.searchText(queryText, ["id", "clientName", "issueCategory", "issueDescription", "assignedExecutive"]);
};
