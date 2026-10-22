/**
 * @fileoverview Environment & Runtime Layer for TEDOS Google Apps Script Backend.
 * @license Apache-2.0
 */

/**
 * Gets the current execution environment.
 * @return {string} 'Development', 'Testing', or 'Production'
 */
function getEnvironment() {
  return getConfigValue("ENVIRONMENT") || "Production";
}

/**
 * Validates if the spreadsheet database is reachable and initialized.
 * @return {boolean} True if the system is ready
 */
function checkEnvironmentHealth() {
  try {
    var ss = getSpreadsheetDatabase();
    if (!ss) return false;
    
    // Check if critical sheets exist
    var sheetNames = CONFIG.SHEET_NAMES;
    for (var key in sheetNames) {
      if (sheetNames.hasOwnProperty(key)) {
        var sheetName = sheetNames[key];
        if (!ss.getSheetByName(sheetName)) {
          return false;
        }
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Direct Database Accessor layer.
 * Obtains the active Spreadsheet or references the hardcoded ID.
 * No business controller should call SpreadsheetApp directly.
 * 
 * @return {GoogleAppsScript.Spreadsheet.Spreadsheet} The Spreadsheet database instance
 */
function getSpreadsheetDatabase() {
  var spreadsheetId = getConfigValue("SPREADSHEET_ID");
  if (spreadsheetId && spreadsheetId.trim() !== "") {
    return SpreadsheetApp.openById(spreadsheetId);
  }
  // Fallback to active container sheet
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Checks if the current execution context is in production.
 * @return {boolean}
 */
function isProduction() {
  return getEnvironment() === "Production";
}

/**
 * Checks if the current execution context is in development.
 * @return {boolean}
 */
function isDevelopment() {
  return getEnvironment() === "Development";
}
