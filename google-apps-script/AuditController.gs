/**
 * @fileoverview System Compliance Audit Trail Controller.
 * Coordinates HTTP/REST requests for query filters, staging buffers, and purges.
 * @license Apache-2.0
 */

var AuditController = {
  /**
   * Searches and filters the central compliance audit trail.
   */
  query: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET", "POST"],
      successMessage: "Compliance audit trail queried."
    }, function(body, userContext) {
      var filters = body || {};
      if (request.query) {
        for (var k in request.query) {
          if (request.query.hasOwnProperty(k)) {
            filters[k] = request.query[k];
          }
        }
      }
      return AuditService.queryAuditLogs(filters);
    });
  },

  /**
   * Commits all staged in-memory transactional audit logs to persistent storage.
   */
  flush: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Staged compliance logs flushed to database."
    }, function(body, userContext) {
      var count = AuditService.flushStagedLogs(userContext);
      return { count: count };
    });
  },

  /**
   * Purges old audit logs to reclaim space.
   */
  purge: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST", "DELETE"],
      successMessage: "Older audit logs purged."
    }, function(body, userContext) {
      var retentionDays = body ? body.retentionDays : (request.query ? request.query.retentionDays : null);
      if (!retentionDays) throw new Error("Parameter 'retentionDays' is required.");
      var count = AuditService.purgeOldLogs(Number(retentionDays), userContext);
      return { purgedCount: count, retentionDays: retentionDays };
    });
  }
};
