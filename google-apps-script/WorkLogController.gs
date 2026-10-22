/**
 * @fileoverview Support Executive Work Log Controller.
 * Coordinates HTTP/REST requests for work logs to the WorkLogService.
 * @license Apache-2.0
 */

var WorkLogController = {
  /**
   * Records a support work log activity.
   */
  logWork: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Work log recorded successfully."
    }, function(body, userContext) {
      return WorkLogService.logWork(body, userContext);
    });
  },

  /**
   * Batch logs multiple support activities.
   */
  batchLogWork: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Batch work logging completed."
    }, function(body, userContext) {
      if (!body || !Array.isArray(body)) {
        throw new Error("Payload body must be a JSON array of work logs.");
      }
      var results = [];
      for (var i = 0; i < body.length; i++) {
        try {
          var log = WorkLogService.logWork(body[i], userContext);
          results.push({ index: i, success: true, workLog: log });
        } catch (err) {
          results.push({ index: i, success: false, message: err.message });
        }
      }
      return results;
    });
  },

  /**
   * Retrieves all logged activities.
   */
  getWorkLogs: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET"],
      successMessage: "Work logs list retrieved successfully."
    }, function(body, userContext) {
      return WorkLogService.getWorkLogs();
    });
  },

  /**
   * Retrieves a single work log.
   */
  getWorkLog: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET"],
      successMessage: "Work log details retrieved."
    }, function(body, userContext) {
      var id = request.query ? request.query.id : null;
      return WorkLogService.getWorkLog(id);
    });
  },

  /**
   * Updates an existing work log entry.
   */
  updateWorkLog: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["PUT", "PATCH"],
      successMessage: "Work log updated successfully."
    }, function(body, userContext) {
      var id = request.query ? request.query.id : null;
      if (!id && body) id = body.id;
      return WorkLogService.updateWorkLog(id, body, userContext);
    });
  },

  /**
   * Deletes a work log entry.
   */
  deleteWorkLog: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["DELETE"],
      successMessage: "Work log deleted successfully."
    }, function(body, userContext) {
      var id = request.query ? request.query.id : null;
      return WorkLogService.deleteWorkLog(id, userContext);
    });
  },

  /**
   * Calculates operational KPIs for a specified support executive.
   */
  getExecutiveKpis: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET", "POST"],
      successMessage: "Executive KPIs compiled."
    }, function(body, userContext) {
      var teId = request.query ? request.query.teId : (body ? body.teId : null);
      if (!teId) throw new Error("Technical Executive ID (teId) is required.");
      var startDate = request.query ? request.query.startDate : (body ? body.startDate : null);
      var endDate = request.query ? request.query.endDate : (body ? body.endDate : null);
      return WorkLogService.calculateExecutiveKpis(teId, startDate, endDate);
    });
  },

  /**
   * Retrieves performance leaderboard across all executives.
   */
  getLeaderboard: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET", "POST"],
      successMessage: "Performance leaderboard compiled successfully."
    }, function(body, userContext) {
      var startDate = request.query ? request.query.startDate : (body ? body.startDate : null);
      var endDate = request.query ? request.query.endDate : (body ? body.endDate : null);
      return WorkLogService.getPerformanceLeaderboard(startDate, endDate);
    });
  }
};
