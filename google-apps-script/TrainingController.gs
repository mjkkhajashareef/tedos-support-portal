/**
 * @fileoverview Client Training Controller Layer.
 * Coordinates HTTP/REST requests for training logs to the TrainingService.
 * @license Apache-2.0
 */

var TrainingController = {
  /**
   * Registers a client training session.
   */
  logTrainingSession: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Training session logged successfully."
    }, function(body, userContext) {
      return TrainingService.logTrainingSession(body, userContext);
    });
  },

  /**
   * Batch logs multiple training sessions.
   */
  batchLogTrainingSessions: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Batch training registration completed."
    }, function(body, userContext) {
      if (!body || !Array.isArray(body)) {
        throw new Error("Payload body must be a JSON array of training sessions.");
      }
      var results = [];
      for (var i = 0; i < body.length; i++) {
        try {
          var trn = TrainingService.logTrainingSession(body[i], userContext);
          results.push({ index: i, success: true, trainingSession: trn });
        } catch (err) {
          results.push({ index: i, success: false, message: err.message });
        }
      }
      return results;
    });
  },

  /**
   * Retrieves all training sessions.
   */
  getTrainingSessions: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET"],
      successMessage: "Training sessions retrieved successfully."
    }, function(body, userContext) {
      return TrainingService.getTrainingSessions();
    });
  },

  /**
   * Retrieves a single training session.
   */
  getTrainingSession: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET"],
      successMessage: "Training session details retrieved."
    }, function(body, userContext) {
      var id = request.query ? request.query.id : null;
      return TrainingService.getTrainingSession(id);
    });
  },

  /**
   * Updates an existing training session.
   */
  updateTrainingSession: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["PUT", "PATCH"],
      successMessage: "Training session updated successfully."
    }, function(body, userContext) {
      var id = request.query ? request.query.id : null;
      if (!id && body) id = body.id;
      return TrainingService.updateTrainingSession(id, body, userContext);
    });
  },

  /**
   * Deletes a training session.
   */
  deleteTrainingSession: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["DELETE"],
      successMessage: "Training session deleted successfully."
    }, function(body, userContext) {
      var id = request.query ? request.query.id : null;
      return TrainingService.deleteTrainingSession(id, userContext);
    });
  },

  /**
   * Queries training sessions conducted by a specific instructor.
   */
  getTrainingByConductor: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET", "POST"],
      successMessage: "Training sessions by instructor retrieved."
    }, function(body, userContext) {
      var instructorName = request.query ? request.query.instructorName : (body ? body.instructorName : null);
      return TrainingService.getTrainingByConductor(instructorName);
    });
  },

  /**
   * Queries training sessions linked to a specific support ticket.
   */
  getTrainingByTicket: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET", "POST"],
      successMessage: "Training sessions by ticket retrieved."
    }, function(body, userContext) {
      var ticketId = request.query ? request.query.ticketId : (body ? body.ticketId : null);
      return TrainingService.getTrainingByTicket(ticketId);
    });
  }
};
