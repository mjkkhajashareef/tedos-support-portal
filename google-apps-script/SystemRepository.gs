/**
 * @fileoverview SystemRepository Base Class.
 * Base repository layer to encapsulate spreadsheet actions, atomic updates, and database actions.
 * Guarantees that business services/controllers never interact with sheets directly.
 * @license Apache-2.0
 */

class SystemRepository {
  /**
   * @param {string} entityKey - The key from SHEETS_CONTRACT (e.g. 'CLIENT', 'TICKET')
   * @param {string} sheetName - Target Google Sheets sheet name
   * @param {string} primaryKey - Unique ID field name (e.g. 'id' or 'key')
   * @param {Array<Object>} fieldMappings - Column mappings from sheetsContract.ts
   * @param {string} validationSchemaKey - Schema key name from Validator SCHEMAS
   */
  constructor(entityKey, sheetName, primaryKey, fieldMappings, validationSchemaKey) {
    this.entityKey = entityKey;
    this.sheetName = sheetName;
    this.primaryKey = primaryKey;
    this.fieldMappings = fieldMappings;
    this.validationSchemaKey = validationSchemaKey;
  }

  /**
   * Obtains the target Google Sheet instance safely.
   * Throws detailed database offline exceptions if spreadsheet is unresolvable.
   * 
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  getSheet() {
    var ss = getSpreadsheetDatabase();
    if (!ss) {
      var dbErr = new Error("Database offline: Spreadsheet is unreachable.");
      dbErr.code = CONSTANTS.ERROR_CODES.SRV_DATABASE_OFFLINE;
      throw dbErr;
    }
    var sheet = ss.getSheetByName(this.sheetName);
    if (!sheet && this.entityKey === "CLIENT") {
      sheet = ss.getSheetByName("ultimate support control") ||
              ss.getSheetByName("Support Clients") ||
              ss.getSheetByName("Clients") ||
              ss.getSheets()[0];
    }
    if (!sheet) {
      var notFoundErr = new Error("Table '" + this.sheetName + "' was not found in the database.");
      notFoundErr.code = CONSTANTS.ERROR_CODES.SRV_DATABASE_OFFLINE;
      throw notFoundErr;
    }
    return sheet;
  }

  /**
   * Retrieves all records for this entity, checking cache first to prevent slow I/O.
   * 
   * @param {boolean} [includeArchived=false] - If true, returns soft-deleted/archived records
   * @return {Array<Object>} Array of entity objects
   */
  findAll(includeArchived) {
    var cacheKey = "DB_CACHE_" + this.sheetName;
    var cachedData = CacheManager.getJson(cacheKey);
    if (cachedData) {
      if (includeArchived) {
        return cachedData;
      }
      return cachedData.filter(function(r) {
        return r.status !== "Archived" && r.status !== "Deleted";
      });
    }

    var sheet = this.getSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return [];
    }

    var lastCol = sheet.getLastColumn();
    var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    var headerMap = SheetMapper.getHeaderMap(sheet);

    var records = [];
    for (var i = 0; i < values.length; i++) {
      try {
        var record = SheetMapper.rowToEntity(values[i], headerMap, this.fieldMappings);
        records.push(record);
      } catch (e) {
        LoggerService.error("SystemRepository findAll mapping error in sheet " + this.sheetName + " at row " + (i + 2), e);
        throw e;
      }
    }

    // Store raw unfiltered set in cache
    CacheManager.putJson(cacheKey, records, CONFIG.CACHE_EXPIRATION_SECONDS);

    if (includeArchived) {
      return records;
    }

    return records.filter(function(r) {
      return r.status !== "Archived" && r.status !== "Deleted";
    });
  }

  /**
   * Finds a single record by its primary key ID.
   * 
   * @param {string|number} id - Target identifier
   * @return {Object|null} The record or null if not found
   */
  find(id) {
    var records = this.findAll(true);
    var pk = this.primaryKey;
    for (var i = 0; i < records.length; i++) {
      if (String(records[i][pk]) === String(id)) {
        return records[i];
      }
    }
    return null;
  }

  /**
   * Dynamic search by field equality criteria.
   * 
   * @param {Object} query - Key-value search criteria (e.g., { clientId: "CLT-1001" })
   * @return {Array<Object>} Matches list
   */
  findWhere(query) {
    var records = this.findAll(false);
    return records.filter(function(record) {
      for (var key in query) {
        if (query.hasOwnProperty(key)) {
          if (String(record[key]) !== String(query[key])) {
            return false;
          }
        }
      }
      return true;
    });
  }

  /**
   * Text search matching multiple fields.
   * 
   * @param {string} queryText - Substring to search
   * @param {Array<string>} fields - Specific properties to scan
   * @return {Array<Object>} List of matches
   */
  searchText(queryText, fields) {
    if (!queryText) return this.findAll(false);
    var cleanQuery = queryText.toLowerCase().trim();
    var records = this.findAll(false);

    return records.filter(function(record) {
      for (var i = 0; i < fields.length; i++) {
        var val = record[fields[i]];
        if (val && String(val).toLowerCase().indexOf(cleanQuery) !== -1) {
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Retrieves records paginated, sorted, and filtered with high precision.
   * 
   * @param {number} page - Current page (1-indexed)
   * @param {number} pageSize - Record count per page
   * @param {function} [filterFn] - Optional javascript filter function
   * @param {function} [sortFn] - Optional javascript sorting comparison function
   * @return {{records: Array<Object>, totalCount: number, page: number, totalPages: number}} Paginated structure
   */
  findAllPaginated(page, pageSize, filterFn, sortFn) {
    var records = this.findAll(false);

    if (filterFn) {
      records = records.filter(filterFn);
    }

    if (sortFn) {
      records.sort(sortFn);
    }

    var totalCount = records.length;
    var startIdx = (page - 1) * pageSize;
    var paginatedRecords = records.slice(startIdx, startIdx + pageSize);

    return {
      records: paginatedRecords,
      totalCount: totalCount,
      page: page,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  }

  /**
   * Inserts a record atomically, performing schema validation.
   * 
   * @param {Object} record - Complete record to insert
   * @return {Object} Inserted record
   */
  insert(record) {
    if (this.validationSchemaKey) {
      var validationResult = Validator.validate(this.validationSchemaKey, record);
      if (!validationResult.isValid) {
        var valErr = new Error("Validation failed for " + this.entityKey + " insertion.");
        valErr.code = CONSTANTS.ERROR_CODES.REQ_VALIDATION_FAILED;
        valErr.validationErrors = validationResult.errors;
        throw valErr;
      }
    }

    var self = this;
    return LockManager.executeAtomic(function() {
      var sheet = self.getSheet();
      var headerMap = SheetMapper.getHeaderMap(sheet);
      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();

      // Initialize versioning
      var hasVersion = self.fieldMappings.some(function(m) { return m.field === "version"; });
      if (hasVersion) {
        record.version = 1;
      }

      var rowValues = SheetMapper.entityToRow(record, headerMap, self.fieldMappings, lastCol);
      sheet.appendRow(rowValues);

      // Invalidate cache
      CacheManager.remove("DB_CACHE_" + self.sheetName);

      LoggerService.info("Inserted record into '" + self.sheetName + "' with primary key value: " + record[self.primaryKey]);
      return record;
    });
  }

  /**
   * Updates a record atomically supporting optimistic locking, schema validation and rollback.
   * 
   * @param {string|number} id - Target unique ID to update
   * @param {Object} updates - Segment updates map
   * @return {Object} The complete merged and updated record
   */
  update(id, updates) {
    var self = this;
    return LockManager.executeAtomic(function() {
      var sheet = self.getSheet();
      var headerMap = SheetMapper.getHeaderMap(sheet);
      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        var notFoundErr = new Error("Table is empty. Cannot update record with ID '" + id + "'.");
        notFoundErr.code = CONSTANTS.ERROR_CODES.REQ_RESOURCE_NOT_FOUND;
        throw notFoundErr;
      }

      var lastCol = sheet.getLastColumn();
      var range = sheet.getRange(2, 1, lastRow - 1, lastCol);
      var values = range.getValues();

      var primaryKeyMapping = self.fieldMappings.find(function(m) { return m.field === self.primaryKey; });
      var primaryKeyHeaderName = primaryKeyMapping ? primaryKeyMapping.headerName : "ID";
      var pkColIdx = headerMap[primaryKeyHeaderName];

      if (pkColIdx === undefined) {
        throw new Error("Primary key column '" + primaryKeyHeaderName + "' is missing in sheet headers.");
      }

      var rowIndex = -1;
      for (var i = 0; i < values.length; i++) {
        if (String(values[i][pkColIdx]) === String(id)) {
          rowIndex = i + 2; // Data starts at Row 2 (Row 1 = headers)
          break;
        }
      }

      if (rowIndex === -1) {
        var notFoundErr = new Error("Record with ID '" + id + "' was not found in '" + self.sheetName + "'.");
        notFoundErr.code = CONSTANTS.ERROR_CODES.REQ_RESOURCE_NOT_FOUND;
        throw notFoundErr;
      }

      // Backup old state for rollback safety
      var oldRowValues = sheet.getRange(rowIndex, 1, 1, lastCol).getValues()[0];
      var existingRecord = SheetMapper.rowToEntity(oldRowValues, headerMap, self.fieldMappings);

      // Optimistic Locking validation check
      if (existingRecord.version !== undefined && updates.version !== undefined) {
        if (Number(existingRecord.version) !== Number(updates.version)) {
          var lockErr = new Error("Optimistic locking failure. Record has been updated since last retrieve.");
          lockErr.code = CONSTANTS.ERROR_CODES.SRV_CONCURRENT_CONFLICT;
          throw lockErr;
        }
        // Increment version
        updates.version = Number(existingRecord.version) + 1;
      } else if (existingRecord.version !== undefined) {
        updates.version = Number(existingRecord.version) + 1;
      }

      // Merge old row with new changes
      var mergedRecord = {};
      for (var k in existingRecord) {
        mergedRecord[k] = existingRecord[k];
      }
      for (var k in updates) {
        mergedRecord[k] = updates[k];
      }

      // Validate merged schemas
      if (self.validationSchemaKey) {
        var validationResult = Validator.validate(self.validationSchemaKey, mergedRecord);
        if (!validationResult.isValid) {
          var valErr = new Error("Validation failed for updating " + self.entityKey + " record.");
          valErr.code = CONSTANTS.ERROR_CODES.REQ_VALIDATION_FAILED;
          valErr.validationErrors = validationResult.errors;
          throw valErr;
        }
      }

      // Perform transaction write
      try {
        var updatedRowValues = SheetMapper.entityToRow(mergedRecord, headerMap, self.fieldMappings, lastCol);
        sheet.getRange(rowIndex, 1, 1, lastCol).setValues([updatedRowValues]);

        // Invalidate cache
        CacheManager.remove("DB_CACHE_" + self.sheetName);

        LoggerService.info("Updated record in " + self.sheetName + " row " + rowIndex + " with ID: " + id);
        return mergedRecord;
      } catch (e) {
        // Rollback Transaction State
        LoggerService.error("Write transaction crashed in repository, executing database rollback state...", e);
        try {
          sheet.getRange(rowIndex, 1, 1, lastCol).setValues([oldRowValues]);
          LoggerService.info("Database transaction rollback successful. Stored row data restored.");
        } catch (rollbackErr) {
          LoggerService.error("CRITICAL FATAL: Database rollback state failure in sheet: " + self.sheetName, rollbackErr);
        }
        throw e;
      }
    });
  }

  /**
   * Deletes a record from the database. Soft-deletes if record contains status, hard-deletes otherwise.
   * 
   * @param {string|number} id - Target primary key to clear
   * @param {boolean} [forceHardDelete=false] - If true, skips soft deletion checks and removes the row
   * @return {boolean} True if successfully deleted
   */
  delete(id, forceHardDelete) {
    var self = this;
    return LockManager.executeAtomic(function() {
      var sheet = self.getSheet();
      var headerMap = SheetMapper.getHeaderMap(sheet);
      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) return false;

      var lastCol = sheet.getLastColumn();
      var range = sheet.getRange(2, 1, lastRow - 1, lastCol);
      var values = range.getValues();

      var primaryKeyMapping = self.fieldMappings.find(function(m) { return m.field === self.primaryKey; });
      var primaryKeyHeaderName = primaryKeyMapping ? primaryKeyMapping.headerName : "ID";
      var pkColIdx = headerMap[primaryKeyHeaderName];

      var rowIndex = -1;
      for (var i = 0; i < values.length; i++) {
        if (String(values[i][pkColIdx]) === String(id)) {
          rowIndex = i + 2;
          break;
        }
      }

      if (rowIndex === -1) {
        return false;
      }

      // Soft delete check
      if (!forceHardDelete) {
        var hasStatus = self.fieldMappings.some(function(m) { return m.field === "status"; });
        if (hasStatus) {
          self.update(id, { status: "Archived" });
          LoggerService.info("Soft deleted record from '" + self.sheetName + "' with ID: " + id);
          return true;
        }
      }

      // Hard delete
      sheet.deleteRow(rowIndex);
      CacheManager.remove("DB_CACHE_" + self.sheetName);
      LoggerService.warn("Hard deleted row " + rowIndex + " from '" + self.sheetName + "' with ID: " + id);
      return true;
    });
  }

  /**
   * Performs batch inserts/writes inside a single atomic transaction wrapper.
   * 
   * @param {Array<Object>} records - Array of records to append
   */
  batchWrite(records) {
    if (!records || records.length === 0) return;

    var self = this;
    return LockManager.executeAtomic(function() {
      var sheet = self.getSheet();
      var headerMap = SheetMapper.getHeaderMap(sheet);
      var lastCol = sheet.getLastColumn();

      var rowsToWrite = [];
      records.forEach(function(record) {
        // Validation check
        if (self.validationSchemaKey) {
          var validationResult = Validator.validate(self.validationSchemaKey, record);
          if (!validationResult.isValid) {
            throw new Error("Validation failed in batch record ID: " + record[self.primaryKey]);
          }
        }

        // Increment version
        var hasVersion = self.fieldMappings.some(function(m) { return m.field === "version"; });
        if (hasVersion) {
          record.version = 1;
        }

        var rowValues = SheetMapper.entityToRow(record, headerMap, self.fieldMappings, lastCol);
        rowsToWrite.push(rowValues);
      });

      // Append bulk cells
      var lastRow = sheet.getLastRow();
      var writeRange = sheet.getRange(lastRow + 1, 1, rowsToWrite.length, lastCol);
      writeRange.setValues(rowsToWrite);

      // Invalidate cache
      CacheManager.remove("DB_CACHE_" + self.sheetName);
      LoggerService.info("Batch write completed successfully. Ingested " + records.length + " records into " + self.sheetName);
    });
  }
}
