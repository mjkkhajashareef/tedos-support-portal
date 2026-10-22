/**
 * @fileoverview Client Follow-Up Controller Layer.
 * Coordinates HTTP/REST requests for follow-ups to the FollowUpService.
 * @license Apache-2.0
 */

var FollowUpController = {
  /**
   * Schedules a new follow-up contact task.
   */
  scheduleFollowUp: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Follow-up scheduled successfully."
    }, function(body, userContext) {
      return FollowUpService.createScheduledFollowUp(body, userContext);
    });
  },

  /**
   * Batch schedules multiple client contact tasks.
   */
  batchScheduleFollowUps: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Batch scheduling completed."
    }, function(body, userContext) {
      if (!body || !Array.isArray(body)) {
        throw new Error("Payload body must be a JSON array of follow-ups.");
      }
      var results = [];
      for (var i = 0; i < body.length; i++) {
        try {
          var flw = FollowUpService.createScheduledFollowUp(body[i], userContext);
          results.push({ index: i, success: true, followUp: flw });
        } catch (err) {
          results.push({ index: i, success: false, message: err.message });
        }
      }
      return results;
    });
  },

  /**
   * Retrieves all scheduled tasks.
   */
  getFollowUps: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET"],
      successMessage: "Follow-ups retrieved successfully."
    }, function(body, userContext) {
      return FollowUpService.getFollowUps();
    });
  },

  /**
   * Retrieves a single follow-up task.
   */
  getFollowUp: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET"],
      successMessage: "Follow-up details retrieved."
    }, function(body, userContext) {
      var id = request.query ? request.query.id : null;
      return FollowUpService.getFollowUp(id);
    });
  },

  /**
   * Updates an existing follow-up task setting.
   */
  updateFollowUp: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["PUT", "PATCH"],
      successMessage: "Follow-up updated successfully."
    }, function(body, userContext) {
      var id = request.query ? request.query.id : null;
      if (!id && body) id = body.id;
      return FollowUpService.updateFollowUp(id, body, userContext);
    });
  },

  /**
   * Deletes a follow-up task.
   */
  deleteFollowUp: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["DELETE"],
      successMessage: "Follow-up deleted successfully."
    }, function(body, userContext) {
      var id = request.query ? request.query.id : null;
      return FollowUpService.deleteFollowUp(id, userContext);
    });
  },

  /**
   * Marks a scheduled task as Completed.
   */
  completeFollowUp: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Follow-up task marked as Completed."
    }, function(body, userContext) {
      if (!body) throw new Error("Body payload is required.");
      var id = body.followUpId;
      var remarks = body.remarks;
      var nextAction = body.nextAction || "";
      return FollowUpService.completeFollowUp(id, remarks, nextAction, userContext);
    });
  },

  /**
   * Triggers the reminder scanner and automatic overdue call escalations.
   */
  runReminderEngine: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST", "GET"],
      successMessage: "Reminder engine run completed."
    }, function(body, userContext) {
      return FollowUpService.triggerAutomaticReminderEngine();
    });
  }
};
