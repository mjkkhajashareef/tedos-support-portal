/**
 * @fileoverview Dynamic Sheet-to-Entity Mapper.
 * Maps spreadsheet columns to strongly-typed JS objects using headers instead of hardcoded letter indices.
 * @license Apache-2.0
 */

var SheetMapper = {
  /**
   * Scans sheet headers (Row 1) and builds a map of header name to column index (0-based).
   * 
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Target spreadsheet sheet
   * @return {Object<string, number>} Map of header text to 0-based index
   */
  getHeaderMap: function(sheet) {
    var headerMap = {};
    try {
      var lastColumn = sheet.getLastColumn();
      if (lastColumn > 0) {
        var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
        for (var colIndex = 0; colIndex < headers.length; colIndex++) {
          var headerText = String(headers[colIndex]).trim();
          if (headerText !== "") {
            headerMap[headerText] = colIndex;
          }
        }
      }
    } catch (e) {
      LoggerService.error("Failed to compile header maps from sheet: " + (sheet ? sheet.getName() : "Null"), e);
    }
    return headerMap;
  },

  /**
   * Maps a raw spreadsheet row into a strongly typed Javascript object using contract configuration.
   * 
   * @param {Array<*>} rowValues - Array of cell values from a single row
   * @param {Object<string, number>} headerMap - Scanned header positions
   * @param {Array<Object>} fieldMappings - Field configurations matching sheetsContract.ts
   * @return {Object} Strongly typed entity object
   */
  rowToEntity: function(rowValues, headerMap, fieldMappings) {
    var entity = {};

    fieldMappings.forEach(function(mapping) {
      // Find dynamic column index using header mapping, default to static columnIndex if header not found
      var colIdx = (headerMap[mapping.headerName] !== undefined) ? headerMap[mapping.headerName] : mapping.columnIndex;
      var cellValue = rowValues[colIdx];

      if (cellValue === undefined || cellValue === null || cellValue === "") {
        entity[mapping.field] = null;
        return;
      }

      // Format based on dataType specified in sheetsContract mapping contract
      switch (mapping.dataType) {
        case "number":
          var num = Number(cellValue);
          entity[mapping.field] = isNaN(num) ? 0 : num;
          break;
        case "boolean":
          entity[mapping.field] = (String(cellValue).toLowerCase() === "true" || cellValue === true);
          break;
        case "json":
          try {
            entity[mapping.field] = JSON.parse(String(cellValue));
          } catch (e) {
            entity[mapping.field] = cellValue;
          }
          break;
        case "date":
          if (cellValue instanceof Date) {
            entity[mapping.field] = cellValue.toISOString().split("T")[0]; // YYYY-MM-DD
          } else {
            entity[mapping.field] = String(cellValue);
          }
          break;
        default:
          entity[mapping.field] = String(cellValue);
      }
    });

    return entity;
  },

  /**
   * Formats a JS object entity back into an ordered array ready to write as a sheet row.
   * 
   * @param {Object} entity - The business data record
   * @param {Object<string, number>} headerMap - Header locations
   * @param {Array<Object>} fieldMappings - Field configuration mappings
   * @param {number} totalColumns - Total size of the sheet row
   * @return {Array<*>} Sorted cell array
   */
  entityToRow: function(entity, headerMap, fieldMappings, totalColumns) {
    // Allocate space for all columns, default to empty string
    var rowSize = Math.max(totalColumns, fieldMappings.length);
    var rowData = new Array(rowSize).fill("");

    fieldMappings.forEach(function(mapping) {
      // Prioritize header mapped column index
      var colIdx = (headerMap[mapping.headerName] !== undefined) ? headerMap[mapping.headerName] : mapping.columnIndex;
      var value = entity[mapping.field];

      if (value !== undefined && value !== null) {
        if (mapping.dataType === "json") {
          rowData[colIdx] = JSON.stringify(value);
        } else if (mapping.dataType === "boolean") {
          rowData[colIdx] = value ? "TRUE" : "FALSE";
        } else {
          rowData[colIdx] = value;
        }
      }
    });

    return rowData;
  }
};
