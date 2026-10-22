/**
 * @fileoverview Date formatting, difference calculation, and timezone utilities.
 * @license Apache-2.0
 */

var DateUtils = {
  /**
   * Formats a Javascript Date object to a clean ISO-8601 string.
   * 
   * @param {Date} date - Date to format
   * @return {string} ISO date string
   */
  formatIso: function(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    return date.toISOString();
  },

  /**
   * Formats a Date object specifically to 'YYYY-MM-DD' layout.
   * 
   * @param {Date|string} date - Target date input
   * @return {string} Formatted string
   */
  formatDateOnly: function(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    var yyyy = date.getFullYear();
    var mm = String(date.getMonth() + 1).padStart(2, "0");
    var dd = String(date.getDate()).padStart(2, "0");
    return yyyy + "-" + mm + "-" + dd;
  },

  /**
   * Calculates difference between two ISO timestamps in minutes.
   * 
   * @param {string} startIso - Start time ISO string
   * @param {string} endIso - End time ISO string
   * @return {number} Calculated duration in minutes
   */
  differenceInMinutes: function(startIso, endIso) {
    try {
      var start = new Date(startIso).getTime();
      var end = new Date(endIso).getTime();
      var diffMs = Math.abs(end - start);
      return Math.floor(diffMs / 60000);
    } catch (e) {
      LoggerService.error("Failed calculating date differences", e);
      return 0;
    }
  },

  /**
   * Generates a date string by offseting a base date.
   * 
   * @param {string} dateStr - Target baseline date 'YYYY-MM-DD'
   * @param {number} days - Positive or negative offset days
   * @return {string} Computed date string 'YYYY-MM-DD'
   */
  addDays: function(dateStr, days) {
    try {
      var d = new Date(dateStr);
      d.setDate(d.getDate() + days);
      return this.formatDateOnly(d);
    } catch (e) {
      LoggerService.error("Error offsetting days for date: " + dateStr, e);
      return dateStr;
    }
  }
};
