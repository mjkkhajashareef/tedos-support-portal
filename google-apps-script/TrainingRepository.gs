/**
 * @fileoverview Training Repository Layer.
 * Governs database operations for Training logs and sessions.
 * @license Apache-2.0
 */

var TrainingRepository = new SystemRepository(
  "TRAINING",
  CONFIG.SHEET_NAMES.TRAINING_LOGS,
  "id",
  [
    { field: 'id', headerName: 'Training ID', columnIndex: 0, dataType: 'string' },
    { field: 'topic', headerName: 'Training Topic', columnIndex: 1, dataType: 'string' },
    { field: 'date', headerName: 'Session Date', columnIndex: 2, dataType: 'string' },
    { field: 'durationMinutes', headerName: 'Duration in Minutes', columnIndex: 3, dataType: 'number' },
    { field: 'attendeesCount', headerName: 'Number of Attendees', columnIndex: 4, dataType: 'number' },
    { field: 'notes', headerName: 'Curriculum & Notes', columnIndex: 5, dataType: 'string' },
    { field: 'conductedBy', headerName: 'Conductor Name', columnIndex: 6, dataType: 'string' },
    { field: 'ticketId', headerName: 'Ticket ID Link', columnIndex: 7, dataType: 'string' }
  ],
  "TRAINING"
);

/**
 * Finds training logs by conductor name.
 * 
 * @param {string} conductorName
 * @return {Array<Object>} Matches list
 */
TrainingRepository.findByConductor = function(conductorName) {
  return this.findWhere({ conductedBy: conductorName });
};

/**
 * Finds training sessions linked to a specific ticket.
 * 
 * @param {string} ticketId
 * @return {Array<Object>} Matches list
 */
TrainingRepository.findByTicket = function(ticketId) {
  return this.findWhere({ ticketId: ticketId });
};

/**
 * Search on training fields.
 * 
 * @param {string} queryText
 * @return {Array<Object>} Result list
 */
TrainingRepository.search = function(queryText) {
  return this.searchText(queryText, ["id", "topic", "notes", "conductedBy"]);
};
