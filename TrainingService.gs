/**
 * @fileoverview Client Training Management Service.
 * Governs recording and monitoring client/staff training courses, connecting sessions with support tickets, and compiling learning logs.
 * @license Apache-2.0
 */

var TrainingService = {
  serviceName: "TrainingService",

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
          Utilities.sleep(150 * attempt); // Exponential backoff
        }
      }
    }

    var totalDuration = new Date().getTime() - startTime;
    LoggerService.error("[" + this.serviceName + "] Action '" + actionName + "' permanently failed after " + maxRetries + " attempts (" + totalDuration + "ms).", lastError);
    throw lastError;
  },

  /**
   * Registers a client training session.
   * 
   * @param {Object} payload - Session configuration (topic, date, durationMinutes, attendeesCount, notes, conductedBy, ticketId)
   * @param {Object} userContext - Current user context
   * @return {Object} Registered training session payload
   */
  logTrainingSession: function(payload, userContext) {
    var self = this;
    return this._execute("logTrainingSession", function() {
      if (!payload.topic) throw new Error("Training topic is required.");
      if (!payload.date) throw new Error("Training session date is required.");
      if (!payload.durationMinutes || isNaN(payload.durationMinutes)) {
        throw new Error("A valid session duration in minutes is required.");
      }
      if (payload.attendeesCount === undefined || isNaN(payload.attendeesCount)) {
        throw new Error("Number of attendees is required.");
      }

      // Date format check
      if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
        throw new Error("Invalid session date format. Expected YYYY-MM-DD.");
      }

      // Ticket validation
      if (payload.ticketId) {
        var ticket = TicketRepository.find(payload.ticketId);
        if (!ticket) throw new Error("Linked support ticket " + payload.ticketId + " not found.");
      }

      var instructorId = payload.conductedBy || (userContext ? userContext.userId : "SYSTEM");
      var instructorUser = UserRepository.find(instructorId);
      var instructorName = instructorUser ? instructorUser.name : instructorId;

      var trainingId = IdGenerator.generateUuid("TRN");
      var trainingRecord = {
        id: trainingId,
        topic: payload.topic,
        date: payload.date,
        durationMinutes: Number(payload.durationMinutes),
        attendeesCount: Number(payload.attendeesCount),
        notes: payload.notes || "No curriculum notes provided.",
        conductedBy: instructorName,
        ticketId: payload.ticketId || ""
      };

      // Atomic write via repository
      var insertedRecord = TrainingRepository.insert(trainingRecord);

      AuditManager.logEvent("TRAINING_REGISTRATION", "SUCCESS", userContext, "Logged training session " + trainingId + " on '" + payload.topic + "'. Attendees: " + payload.attendeesCount);

      // Invalidate caches
      CacheManager.remove("DB_CACHE_" + CONFIG.SHEET_NAMES.TRAINING_LOGS);

      return insertedRecord;
    }, userContext);
  },

  /**
   * Fetches training sessions conducted by a specific instructor.
   * 
   * @param {string} instructorName - Full name of session instructor
   * @return {Array<Object>} Sessions array
   */
  getTrainingByConductor: function(instructorName) {
    var self = this;
    return this._execute("getTrainingByConductor", function() {
      if (!instructorName) throw new Error("Instructor name is required.");
      return TrainingRepository.findByConductor(instructorName);
    });
  },

  /**
   * Fetches training sessions linked to a specific support ticket.
   * 
   * @param {string} ticketId - Link ticket ID
   * @return {Array<Object>} Sessions array
   */
  getTrainingByTicket: function(ticketId) {
    var self = this;
    return this._execute("getTrainingByTicket", function() {
      if (!ticketId) throw new Error("Ticket ID is required.");
      return TrainingRepository.findByTicket(ticketId);
    });
  },

  /**
   * Retrieves all training sessions.
   */
  getTrainingSessions: function() {
    return this._execute("getTrainingSessions", function() {
      return TrainingRepository.findAll(true);
    });
  },

  /**
   * Retrieves a single training session.
   */
  getTrainingSession: function(id) {
    return this._execute("getTrainingSession", function() {
      if (!id) throw new Error("Training Session ID is required.");
      var session = TrainingRepository.find(id);
      if (!session) {
        throw new Error("Training Session with ID " + id + " not found.");
      }
      return session;
    });
  },

  /**
   * Updates an existing training session.
   */
  updateTrainingSession: function(id, updates, userContext) {
    return this._execute("updateTrainingSession", function() {
      if (!id) throw new Error("Training Session ID is required.");
      var existing = TrainingRepository.find(id);
      if (!existing) {
        throw new Error("Training Session with ID " + id + " not found.");
      }

      var updated = TrainingRepository.update(id, updates);
      AuditManager.logEvent("TRAINING_UPDATE", "SUCCESS", userContext, "Updated training session ID " + id);
      return updated;
    }, userContext);
  },

  /**
   * Permanently deletes a training session.
   */
  deleteTrainingSession: function(id, userContext) {
    return this._execute("deleteTrainingSession", function() {
      if (!id) throw new Error("Training Session ID is required.");
      var existing = TrainingRepository.find(id);
      if (!existing) {
        throw new Error("Training Session with ID " + id + " not found.");
      }

      var deleted = TrainingRepository.delete(id);
      AuditManager.logEvent("TRAINING_DELETION", "SUCCESS", userContext, "Deleted training session ID " + id);
      return { id: id, success: deleted };
    }, userContext);
  }
};
