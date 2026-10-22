/**
 * @fileoverview Support Follow Up & Reminder Business Service.
 * Governs scheduling of client calls, processing follow-up compliance, and triggering automatic overdue reminders.
 * @license Apache-2.0
 */

var FollowUpService = {
  serviceName: "FollowUpService",

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
   * Registers a scheduled follow-up with a client.
   * 
   * @param {Object} payload - Task settings (clientId, ticketId, teId, scheduledDate, scheduledTime, priority, reason)
   * @param {Object} userContext - Context object of performing user
   * @return {Object} The registered FollowUp record
   */
  createScheduledFollowUp: function(payload, userContext) {
    var self = this;
    return this._execute("createScheduledFollowUp", function() {
      if (!payload.clientId) throw new Error("Client ID is required to schedule follow-up.");
      if (!payload.scheduledDate) throw new Error("Scheduled execution date is required.");

      var client = ClientRepository.find(payload.clientId);
      if (!client) throw new Error("Client " + payload.clientId + " was not found.");

      var teId = payload.teId || (userContext ? userContext.userId : "SYSTEM");
      var execUser = UserRepository.find(teId);
      var execName = execUser ? execUser.name : "System Agent";

      // Date format check
      if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.scheduledDate)) {
        throw new Error("Invalid scheduled date format. Expected YYYY-MM-DD.");
      }

      var followUpId = IdGenerator.generateUuid("FLW");
      var followUpRecord = {
        id: followUpId,
        ticketId: payload.ticketId || "",
        clientId: payload.clientId,
        clientName: client.name,
        teId: teId,
        executiveName: execName,
        scheduledDate: payload.scheduledDate,
        scheduledTime: payload.scheduledTime || "12:00",
        priority: payload.priority || CONSTANTS.PRIORITY.MEDIUM,
        lastContactDate: "",
        status: "Pending",
        reason: payload.reason || "Periodic service check.",
        remarks: "",
        nextAction: "",
        version: 1
      };

      // Atomic insertion
      var insertedRecord = FollowUpRepository.insert(followUpRecord);

      AuditManager.logEvent("FOLLOW_UP_SCHEDULE", "SUCCESS", userContext, "Scheduled follow-up " + followUpId + " with client " + client.name + " for " + payload.scheduledDate);

      // Refresh cache
      CacheManager.remove("DB_CACHE_" + CONFIG.SHEET_NAMES.FOLLOW_UPS);

      return insertedRecord;
    }, userContext);
  },

  /**
   * Completes a scheduled follow-up task.
   * 
   * @param {string} followUpId - Unique task ID
   * @param {string} remarks - Technical summary details of resolution
   * @param {string} nextAction - Recommended future operational steps
   * @param {Object} userContext - Context object of completing user
   * @return {Object} The updated FollowUp record
   */
  completeFollowUp: function(followUpId, remarks, nextAction, userContext) {
    var self = this;
    return this._execute("completeFollowUp", function() {
      if (!followUpId) throw new Error("FollowUp ID is required.");
      if (!remarks) throw new Error("Completion notes/remarks are required.");

      var task = FollowUpRepository.find(followUpId);
      if (!task) throw new Error("Follow-up task with ID " + followUpId + " not found.");

      if (task.status === "Completed") {
        return task; // Idempotency
      }

      var previousStatus = task.status;

      try {
        var updatedRecord = FollowUpRepository.update(followUpId, {
          status: "Completed",
          lastContactDate: DateUtils.formatDateOnly(new Date()),
          remarks: remarks,
          nextAction: nextAction || "No further action required.",
          updatedDate: new Date().toISOString()
        });

        AuditManager.logEvent("FOLLOW_UP_COMPLETION", "SUCCESS", userContext, "Completed follow-up task " + followUpId + ". Notes: " + remarks);

        // Invalidate caching
        CacheManager.remove("DB_CACHE_" + CONFIG.SHEET_NAMES.FOLLOW_UPS);

        return updatedRecord;
      } catch (e) {
        LoggerService.error("Failed to complete follow-up task, rolling back status of task: " + followUpId);
        try {
          FollowUpRepository.update(followUpId, {
            status: previousStatus,
            lastContactDate: task.lastContactDate,
            remarks: task.remarks,
            nextAction: task.nextAction
          });
        } catch (rErr) {
          LoggerService.error("CRITICAL: Failed to rollback completion status of follow-up " + followUpId, rErr);
        }
        throw e;
      }
    }, userContext);
  },

  /**
   * Scans and triggers automated alerts for overdue or upcoming follow-up schedules.
   * Automatically escalates priority level of overdue pending actions.
   * 
   * @return {Array<Object>} Processing summary list of processed items
   */
  triggerAutomaticReminderEngine: function() {
    var self = this;
    return this._execute("triggerAutomaticReminderEngine", function() {
      var pending = FollowUpRepository.findPending();
      var todayStr = DateUtils.formatDateOnly(new Date());
      var reminderCount = 0;
      var escalationCount = 0;

      var results = [];

      pending.forEach(function(task) {
        var isOverdue = task.scheduledDate < todayStr;
        var isToday = task.scheduledDate === todayStr;

        if (isOverdue || isToday) {
          reminderCount++;
          var details = "Action needed: Scheduled contact with client '" + task.clientName + "' (Planned: " + task.scheduledDate + ") is " + (isOverdue ? "OVERDUE" : "TODAY") + ".";
          
          var alertType = isOverdue ? CONSTANTS.NOTIFICATION_TYPES.ERROR : CONSTANTS.NOTIFICATION_TYPES.WARNING;
          
          NotificationService.createSystemAlert(
            isOverdue ? "Overdue Client Call" : "Today's Client Follow-up",
            details,
            alertType
          );

          // Escalate Priority of overdue calls
          if (isOverdue && task.priority !== CONSTANTS.PRIORITY.CRITICAL) {
            escalationCount++;
            var previousPriority = task.priority;
            var escalatedPriority = CONSTANTS.PRIORITY.CRITICAL;

            if (previousPriority === CONSTANTS.PRIORITY.LOW) escalatedPriority = CONSTANTS.PRIORITY.MEDIUM;
            else if (previousPriority === CONSTANTS.PRIORITY.MEDIUM) escalatedPriority = CONSTANTS.PRIORITY.HIGH;

            try {
              FollowUpRepository.update(task.id, { priority: escalatedPriority });
              LoggerService.info("Escalated overdue follow-up task " + task.id + " from " + previousPriority + " to " + escalatedPriority);
            } catch (err) {
              LoggerService.error("Failed to escalate overdue follow-up priority: " + task.id, err);
            }
          }

          results.push({
            followUpId: task.id,
            clientName: task.clientName,
            scheduledDate: task.scheduledDate,
            state: isOverdue ? "OVERDUE" : "TODAY",
            escalated: isOverdue
          });
        }
      });

      LoggerService.info("Reminder Engine check complete. Processed " + reminderCount + " alerts. Escaled " + escalationCount + " overdue calls.");
      return results;
    });
  },

  /**
   * Retrieves all scheduled follow-up tasks.
   */
  getFollowUps: function() {
    return this._execute("getFollowUps", function() {
      return FollowUpRepository.findAll(true);
    });
  },

  /**
   * Retrieves a single follow-up task.
   */
  getFollowUp: function(id) {
    return this._execute("getFollowUp", function() {
      if (!id) throw new Error("FollowUp ID is required.");
      var task = FollowUpRepository.find(id);
      if (!task) {
        throw new Error("Follow-up task with ID " + id + " not found.");
      }
      return task;
    });
  },

  /**
   * Updates an existing follow-up task.
   */
  updateFollowUp: function(id, updates, userContext) {
    return this._execute("updateFollowUp", function() {
      if (!id) throw new Error("FollowUp ID is required.");
      var existing = FollowUpRepository.find(id);
      if (!existing) {
        throw new Error("Follow-up task with ID " + id + " not found.");
      }

      var updated = FollowUpRepository.update(id, updates);
      AuditManager.logEvent("FOLLOW_UP_UPDATE", "SUCCESS", userContext, "Updated follow-up ID " + id);
      return updated;
    }, userContext);
  },

  /**
   * Permanently deletes a follow-up task.
   */
  deleteFollowUp: function(id, userContext) {
    return this._execute("deleteFollowUp", function() {
      if (!id) throw new Error("FollowUp ID is required.");
      var existing = FollowUpRepository.find(id);
      if (!existing) {
        throw new Error("Follow-up task with ID " + id + " not found.");
      }

      var deleted = FollowUpRepository.delete(id);
      AuditManager.logEvent("FOLLOW_UP_DELETION", "SUCCESS", userContext, "Deleted follow-up task ID " + id);
      return { id: id, success: deleted };
    }, userContext);
  }
};
