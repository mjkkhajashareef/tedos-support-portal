/**
 * @fileoverview Database Record Synchronization and Conflict Resolution Service.
 * Coordinates syncing records from offline local storage caches and executing optimistic concurrent merges.
 * @license Apache-2.0
 */

var SyncService = {
  serviceName: "SyncService",

  /**
   * Helper to execute service operations with timing, validation, retry, logging, and transactional safety.
   * 
   * @private
   */
  _execute: function(actionName, callback, context) {
    var startTime = new Date().getTime();
    var maxRetries = 3;
    var attempt = 0;
    var lastError = null;

    LoggerService.info("[" + this.serviceName + "] Starting action '" + actionName + "'");

    while (attempt < maxRetries) {
      try {
        var result = callback();
        var duration = new Date().getTime() - startTime;
        LoggerService.info("[" + this.serviceName + "] Action '" + actionName + "' completed in " + duration + "ms (Attempt " + (attempt + 1) + ")");
        return result;
      } catch (e) {
        attempt++;
        lastError = e;
        LoggerService.warn("[" + this.serviceName + "] Action '" + actionName + "' failed on attempt " + attempt + "/" + maxRetries + ". Error: " + e.message);
        if (attempt < maxRetries) {
          Utilities.sleep(150 * attempt);
        }
      }
    }

    var totalDuration = new Date().getTime() - startTime;
    LoggerService.error("[" + this.serviceName + "] Action '" + actionName + "' permanently failed after " + maxRetries + " attempts (" + totalDuration + "ms).", lastError);
    throw lastError;
  },

  /**
   * Resolves repository identifier based on entity standard types.
   * 
   * @private
   */
  _getRepository: function(entityType) {
    var cleanType = String(entityType).toUpperCase().trim();
    if (cleanType === "CLIENT") return ClientRepository;
    if (cleanType === "TICKET") return TicketRepository;
    if (cleanType === "WORK_LOG") return WorkLogRepository;
    if (cleanType === "FOLLOW_UP") return FollowUpRepository;
    if (cleanType === "TRAINING") return TrainingRepository;
    if (cleanType === "SETTINGS") return SettingsRepository;
    if (cleanType === "USER") return UserRepository;
    throw new Error("Invalid entity sync type: '" + entityType + "'");
  },

  /**
   * Orchestrates synchronization of a client record.
   * Leverages optimistic version checks to identify and tag record conflicts.
   * 
   * @param {string} entityType - Entity standard key (CLIENT, TICKET, WORK_LOG, etc.)
   * @param {Object} record - The client's modified copy of the record
   * @param {number} clientVersion - Version number of client offline cache
   * @param {Object} userContext - Context object of performing user
   * @return {Object} Sync resolution output payload
   */
  syncRecord: function(entityType, record, clientVersion, userContext) {
    var self = this;
    return this._execute("syncRecord", function() {
      if (!entityType) throw new Error("Entity Type is required.");
      if (!record || !record.id) throw new Error("A valid record with an identifier ID is required.");

      var repository = self._getRepository(entityType);
      var serverRecord = repository.find(record.id);

      // 1. Insert New Record if non-existent in the database
      if (!serverRecord) {
        LoggerService.info("Sync: Record ID '" + record.id + "' is missing on server. Ingesting as new record.");
        record.version = 1;
        record.syncStatus = CONSTANTS.RECORD_STATES.SYNCED;
        record.lastSyncedAt = new Date().toISOString();
        
        var inserted = repository.insert(record);
        
        AuditManager.logEvent("SYNC_INGEST", "SUCCESS", userContext, "Ingested new " + entityType + " ID " + record.id + " via sync.");
        
        // Invalidate caching
        CacheManager.remove("DB_CACHE_" + repository.sheetName);
        DashboardService.invalidateCache();

        return {
          id: record.id,
          entityType: entityType,
          status: "SUCCESS",
          action: "INSERT",
          record: inserted
        };
      }

      // 2. Resolve Concurrency check if record exists
      var serverVersion = Number(serverRecord.version || 1);
      var incomingVersion = Number(record.version || 1);

      if (incomingVersion !== serverVersion) {
        // CONFLICT: Server updated in between!
        LoggerService.warn("Sync CONFLICT detected on " + entityType + " ID " + record.id + ". Server version: " + serverVersion + ", Client version: " + incomingVersion);
        
        AuditManager.logEvent("SYNC_CONFLICT", "SUCCESS", userContext, "Concurrency conflict registered on " + entityType + " ID " + record.id);

        // Mark local conflict details on return object
        return {
          id: record.id,
          entityType: entityType,
          status: "CONFLICT",
          action: "NONE",
          serverRecord: serverRecord,
          clientRecord: record,
          message: "Optimistic lock verification failed. Server has a more recent version."
        };
      }

      // 3. Perfect match, process normal merged update
      LoggerService.info("Sync: Merging changes for " + entityType + " ID " + record.id);
      
      // Filter out meta properties to prevent overwriting keys
      var updates = {};
      for (var key in record) {
        if (record.hasOwnProperty(key) && key !== "id" && key !== "version") {
          updates[key] = record[key];
        }
      }

      // Increment record version
      updates.version = serverVersion; // Let repository update increment it automatically or set manually
      updates.syncStatus = CONSTANTS.RECORD_STATES.SYNCED;
      updates.lastSyncedAt = new Date().toISOString();

      var updated = repository.update(record.id, updates);

      AuditManager.logEvent("SYNC_UPDATE", "SUCCESS", userContext, "Synchronized modifications on " + entityType + " ID " + record.id);

      // Invalidate caches
      CacheManager.remove("DB_CACHE_" + repository.sheetName);
      DashboardService.invalidateCache();

      return {
        id: record.id,
        entityType: entityType,
        status: "SUCCESS",
        action: "UPDATE",
        record: updated
      };
    }, userContext);
  },

  /**
   * Resolves a flagged conflict by overwriting or merging field-level states.
   * 
   * @param {string} entityType - Entity identifier key
   * @param {string} recordId - Unique record ID
   * @param {Object} resolvedFields - Final key-value properties to write
   * @param {Object} userContext - Performer credentials
   * @return {Object} The resolved and updated record
   */
  resolveConflict: function(entityType, recordId, resolvedFields, userContext) {
    var self = this;
    return this._execute("resolveConflict", function() {
      if (!entityType || !recordId || !resolvedFields) {
        throw new Error("Entity, record ID, and resolved properties are required.");
      }

      var repository = self._getRepository(entityType);
      var serverRecord = repository.find(recordId);

      if (!serverRecord) {
        throw new Error("Cannot resolve conflict. Record " + recordId + " not found on server.");
      }

      LoggerService.info("Sync: Resolving conflict manually for " + entityType + " ID " + recordId);

      resolvedFields.version = Number(serverRecord.version); // align version with server to bypass repository locks
      resolvedFields.syncStatus = CONSTANTS.RECORD_STATES.SYNCED;
      resolvedFields.lastSyncedAt = new Date().toISOString();

      var resolvedRecord = repository.update(recordId, resolvedFields);

      AuditManager.logEvent("SYNC_CONFLICT_RESOLVED", "SUCCESS", userContext, "Resolved concurrency conflict for " + entityType + " ID " + recordId);

      // Clear caches
      CacheManager.remove("DB_CACHE_" + repository.sheetName);
      DashboardService.invalidateCache();

      return resolvedRecord;
    }, userContext);
  }
};
