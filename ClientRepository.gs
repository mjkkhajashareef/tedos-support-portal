/**
 * @fileoverview Client Repository Layer.
 * Governs all database transactions for Client records.
 * @license Apache-2.0
 */

var ClientRepository = new SystemRepository(
  "CLIENT",
  CONFIG.SHEET_NAMES.CLIENTS,
  "id",
  [
    { field: 'id', headerName: 'Client ID', columnIndex: 0, dataType: 'string' },
    { field: 'name', headerName: 'Client Name', columnIndex: 1, dataType: 'string' },
    { field: 'company', headerName: 'Company Name', columnIndex: 2, dataType: 'string' },
    { field: 'phone', headerName: 'Phone Number', columnIndex: 3, dataType: 'string' },
    { field: 'email', headerName: 'Email Address', columnIndex: 4, dataType: 'string' },
    { field: 'status', headerName: 'Client Status', columnIndex: 5, dataType: 'string' },
    { field: 'assignedExecutive', headerName: 'Assigned Executive', columnIndex: 6, dataType: 'string' },
    { field: 'softwareVersion', headerName: 'Software Version', columnIndex: 7, dataType: 'string' },
    { field: 'licenseType', headerName: 'License Type', columnIndex: 8, dataType: 'string' },
    { field: 'expiryDate', headerName: 'Expiry Date', columnIndex: 9, dataType: 'string' },
    { field: 'lastBackupDate', headerName: 'Last Backup Date', columnIndex: 10, dataType: 'string' },
    { field: 'healthStatus', headerName: 'Health Score', columnIndex: 11, dataType: 'number' },
    { field: 'recentActivityTimestamp', headerName: 'Last Activity Time', columnIndex: 12, dataType: 'string' },
    { field: 'version', headerName: 'Record Version', columnIndex: 13, dataType: 'number' },
    { field: 'url', headerName: 'Software URL', columnIndex: 14, dataType: 'string' },
    { field: 'softwareUrl', headerName: 'Software URL', columnIndex: 14, dataType: 'string' },
    { field: 'login', headerName: 'Software Login', columnIndex: 15, dataType: 'string' },
    { field: 'softwareLogin', headerName: 'Software Login', columnIndex: 15, dataType: 'string' },
    { field: 'specialManagerRemark', headerName: 'Special Manager Remark', columnIndex: 18, dataType: 'string' },
    { field: 'noteSaad', headerName: 'Remarks', columnIndex: 18, dataType: 'string' }
  ],
  "CLIENT"
);

/**
 * Custom search for clients by executive.
 * 
 * @param {string} executiveName - Name of assigned executive
 * @return {Array<Object>} List of matches
 */
ClientRepository.findByExecutive = function(executiveName) {
  return this.findWhere({ assignedExecutive: executiveName });
};

/**
 * Custom search for clients by status.
 * 
 * @param {string} status - e.g. Active, Critical
 * @return {Array<Object>} List of matches
 */
ClientRepository.findByStatus = function(status) {
  return this.findWhere({ status: status });
};

/**
 * Global search on text fields.
 * 
 * @param {string} queryText - Substring query
 * @return {Array<Object>} Matches list
 */
ClientRepository.search = function(queryText) {
  return this.searchText(queryText, ["id", "name", "company", "phone", "email"]);
};
