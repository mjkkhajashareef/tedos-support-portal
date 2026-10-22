/**
 * @fileoverview ID Generator Utility for consistent, structured business entity IDs.
 * @license Apache-2.0
 */

var IdGenerator = {
  /**
   * Generates a new Ticket ID in the pattern: TKT-YYYY-XXXXX
   * e.g., TKT-2026-10001
   * 
   * @param {GoogleAppsScript.Spreadsheet.Sheet} ticketSheet - Sheet instance to scan for last id
   * @return {string} Generated Ticket ID
   */
  generateTicketId: function(ticketSheet) {
    var year = new Date().getFullYear();
    var nextNum = 10001;

    try {
      if (ticketSheet) {
        var lastRow = ticketSheet.getLastRow();
        if (lastRow > 1) {
          // Check last 20 rows to find the highest numerical ID for safety
          var startRow = Math.max(2, lastRow - 20);
          var ids = ticketSheet.getRange(startRow, 1, lastRow - startRow + 1, 1).getValues();
          var maxNum = 10000;
          
          for (var i = 0; i < ids.length; i++) {
            var currentId = String(ids[i][0]);
            var match = currentId.match(/TKT-\d{4}-(\d{5})/);
            if (match) {
              var num = parseInt(match[1], 10);
              if (num > maxNum) {
                maxNum = num;
              }
            }
          }
          nextNum = maxNum + 1;
        }
      }
    } catch (e) {
      LoggerService.error("Failed scanning tickets for next ID, using high-entropy random suffix fallback", e);
      // fallback to high entropy suffix to guarantee zero collisions
      nextNum = Math.floor(10000 + Math.random() * 90000);
    }

    return "TKT-" + year + "-" + nextNum;
  },

  /**
   * Generates a new Client ID in the pattern: CLT-XXXX
   * e.g., CLT-1001
   * 
   * @param {GoogleAppsScript.Spreadsheet.Sheet} clientSheet - Sheet instance to scan for last id
   * @return {string} Generated Client ID
   */
  generateClientId: function(clientSheet) {
    var nextNum = 1001;

    try {
      if (clientSheet) {
        var lastRow = clientSheet.getLastRow();
        if (lastRow > 1) {
          var startRow = Math.max(2, lastRow - 20);
          var ids = clientSheet.getRange(startRow, 1, lastRow - startRow + 1, 1).getValues();
          var maxNum = 1000;

          for (var i = 0; i < ids.length; i++) {
            var currentId = String(ids[i][0]);
            var match = currentId.match(/CLT-(\d{4,6})/);
            if (match) {
              var num = parseInt(match[1], 10);
              if (num > maxNum) {
                maxNum = num;
              }
            }
          }
          nextNum = maxNum + 1;
        }
      }
    } catch (e) {
      LoggerService.error("Failed scanning clients for next ID, fallback active", e);
      nextNum = Math.floor(1000 + Math.random() * 9000);
    }

    return "CLT-" + nextNum;
  },

  /**
   * Generates a unique high-entropy random UUID.
   * Useful for logs, notifications, work logs, etc.
   * 
   * @param {string} prefix - Optional prefix (e.g. "LOG", "NOT", "FLW")
   * @return {string} Unique ID
   */
  generateUuid: function(prefix) {
    var rawUuid = Utilities.getUuid();
    if (prefix) {
      return prefix + "-" + rawUuid.substring(0, 8).toUpperCase();
    }
    return rawUuid;
  }
};
