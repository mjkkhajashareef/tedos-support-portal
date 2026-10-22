/**
 * @fileoverview Database Synchronization & Conflict Resolution Controller.
 * Coordinates requests for client-offline cache merges and concurrent edits.
 * @license Apache-2.0
 */

var SyncController = {
  /**
   * Synchronizes a single offline data record with optimistic concurrency.
   */
  sync: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Record synchronization completed."
    }, function(body, userContext) {
      if (!body) throw new Error("Body payload is required.");
      var entityType = body.entityType;
      var record = body.record;
      var clientVersion = body.clientVersion || 1;
      return SyncService.syncRecord(entityType, record, clientVersion, userContext);
    });
  },

  /**
   * Resolves a concurrent conflict by overwriting or merging field-level properties.
   */
  resolveConflict: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Record concurrency conflict resolved."
    }, function(body, userContext) {
      if (!body) throw new Error("Body payload is required.");
      var entityType = body.entityType;
      var recordId = body.recordId;
      var resolvedFields = body.resolvedFields;
      return SyncService.resolveConflict(entityType, recordId, resolvedFields, userContext);
    });
  },

  /**
   * Batch synchronizes an array of offline records.
   */
  batchSync: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Batch records synchronization completed."
    }, function(body, userContext) {
      if (!body || !Array.isArray(body)) {
        throw new Error("Payload body must be a JSON array of sync requests.");
      }
      var results = [];
      for (var i = 0; i < body.length; i++) {
        try {
          var item = body[i];
          var syncRes = SyncService.syncRecord(item.entityType, item.record, item.clientVersion || 1, userContext);
          results.push({ index: i, success: true, result: syncRes });
        } catch (err) {
          results.push({ index: i, success: false, message: err.message });
        }
      }
      return results;
    });
  }
};
