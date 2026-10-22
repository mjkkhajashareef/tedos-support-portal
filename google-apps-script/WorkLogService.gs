/**
 * @fileoverview Support Executive Work Log Business Service.
 * Governs recording and processing support logs, auto-triggering follow-ups, and calculating operational KPIs and performance leaderboards.
 * @license Apache-2.0
 */

var WorkLogService = {
  serviceName: "WorkLogService",

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
   * Logs a work activity, linking to client and ticket, and updating associated ticket state dynamically.
   * 
   * @param {Object} payload - Work log details
   * @param {Object} userContext - Current logged-in user context
   * @return {Object} The registered work log record
   */
  logWork: function(payload, userContext) {
    var self = this;
    return this._execute("logWork", function() {
      if (!payload.clientId) throw new Error("Client ID Link is required.");
      if (!payload.durationMinutes || isNaN(payload.durationMinutes)) {
        throw new Error("A valid log duration in minutes is required.");
      }

      var client = ClientRepository.find(payload.clientId);
      if (!client) throw new Error("Client with ID " + payload.clientId + " not found.");

      var teId = payload.teId || (userContext ? userContext.userId : "SYSTEM");
      var execUser = UserRepository.find(teId);
      var execName = execUser ? execUser.name : "System Agent";

      // If linked to a ticket, validate the ticket exists
      if (payload.ticketId) {
        var ticket = TicketRepository.find(payload.ticketId);
        if (!ticket) throw new Error("Linked support ticket " + payload.ticketId + " not found.");
      }

      var logId = IdGenerator.generateUuid("LOG");
      var workLogRecord = {
        id: logId,
        ticketId: payload.ticketId || "",
        clientId: payload.clientId,
        clientName: client.name,
        timestamp: new Date().toISOString(),
        date: payload.date || DateUtils.formatDateOnly(new Date()),
        time: payload.time || new Date().toTimeString().split(" ")[0].substring(0, 5),
        executiveName: execName,
        teId: teId,
        category: payload.category || "Consultation",
        details: payload.details || "Support work executed.",
        status: payload.status || "Completed",
        nextFollowUpDate: payload.nextFollowUpDate || "",
        priority: payload.priority || CONSTANTS.PRIORITY.MEDIUM,
        durationMinutes: Number(payload.durationMinutes),
        remarks: payload.remarks || ""
      };

      // Atomic write via repository
      var insertedLog = WorkLogRepository.insert(workLogRecord);

      AuditManager.logEvent("WORK_LOG_SUBMISSION", "SUCCESS", userContext, "Submitted work log " + logId + " linked to client ID " + payload.clientId + ". Duration: " + payload.durationMinutes + " mins.");

      // Check if ticket status needs update
      if (payload.ticketId && payload.ticketStatus) {
        if (payload.ticketStatus === CONSTANTS.TICKET_STATUS.RESOLVED) {
          TicketService.resolveTicket(payload.ticketId, payload.details, userContext);
        } else {
          TicketRepository.update(payload.ticketId, { status: payload.ticketStatus, updatedDate: new Date().toISOString() });
        }
      }

      // Check if an automatic follow-up schedule is triggered
      if (payload.nextFollowUpDate) {
        FollowUpService.createScheduledFollowUp({
          ticketId: payload.ticketId || "",
          clientId: payload.clientId,
          teId: teId,
          scheduledDate: payload.nextFollowUpDate,
          scheduledTime: "10:00", // Default morning call
          priority: payload.priority || CONSTANTS.PRIORITY.MEDIUM,
          reason: "Auto follow-up triggered from work log: " + payload.category
        }, userContext);
      }

      // Refresh cache
      CacheManager.remove("DB_CACHE_" + CONFIG.SHEET_NAMES.WORK_LOGS);

      return insertedLog;
    }, userContext);
  },

  /**
   * Evaluates key performance indicators (KPIs) for an assigned executive.
   * 
   * @param {string} teId - Technical Executive user ID
   * @param {string} [startDate] - YYYY-MM-DD filter starting date
   * @param {string} [endDate] - YYYY-MM-DD filter ending date
   * @return {Object} Executive KPI report structure
   */
  calculateExecutiveKpis: function(teId, startDate, endDate) {
    var self = this;
    return this._execute("calculateExecutiveKpis", function() {
      var exec = UserRepository.find(teId);
      if (!exec) throw new Error("Executive with ID " + teId + " not found.");

      var allLogs = WorkLogRepository.findByExecutive(teId);
      var allTickets = TicketRepository.findByAssignedExecutive(exec.name);

      // Date filtering
      if (startDate && endDate) {
        var start = new Date(startDate).getTime();
        var end = new Date(endDate).getTime();

        allLogs = allLogs.filter(function(log) {
          var logTime = new Date(log.date).getTime();
          return logTime >= start && logTime <= end;
        });

        allTickets = allTickets.filter(function(t) {
          var createdTime = new Date(t.createdDate).getTime();
          return createdTime >= start && createdTime <= end;
        });
      }

      // 1. Calculate hours logged
      var totalMinutes = 0;
      allLogs.forEach(function(log) {
        totalMinutes += Number(log.durationMinutes || 0);
      });
      var totalHours = Number((totalMinutes / 60).toFixed(2));

      // 2. Ticket breakdown
      var totalAssigned = allTickets.length;
      var resolvedTickets = allTickets.filter(function(t) { return t.status === CONSTANTS.TICKET_STATUS.RESOLVED || t.status === CONSTANTS.TICKET_STATUS.CLOSED; });
      var totalResolved = resolvedTickets.length;
      var openTickets = allTickets.filter(function(t) { return t.status !== CONSTANTS.TICKET_STATUS.RESOLVED && t.status !== CONSTANTS.TICKET_STATUS.CLOSED; });
      var totalOpen = openTickets.length;

      var resolutionRate = totalAssigned > 0 ? Number(((totalResolved / totalAssigned) * 100).toFixed(1)) : 100;

      // 3. Average Resolution Duration in Hours
      var resolutionDurationSum = 0;
      resolvedTickets.forEach(function(t) {
        var created = new Date(t.createdDate).getTime();
        var closed = new Date(t.closedDate || t.updatedDate).getTime();
        resolutionDurationSum += (closed - created) / (1000 * 60 * 60);
      });
      var avgResolutionHours = totalResolved > 0 ? Number((resolutionDurationSum / totalResolved).toFixed(1)) : 0;

      // 4. SLA Adherence Rate
      var slaChecked = 0;
      var slaBreaches = 0;
      allTickets.forEach(function(t) {
        var report = TicketService.checkSlaBreach(t.id);
        slaChecked++;
        if (report.isBreached) slaBreaches++;
      });
      var slaComplianceRate = slaChecked > 0 ? Number((((slaChecked - slaBreaches) / slaChecked) * 100).toFixed(1)) : 100;

      return {
        executiveId: teId,
        executiveName: exec.name,
        hoursLogged: totalHours,
        ticketsAssignedCount: totalAssigned,
        ticketsResolvedCount: totalResolved,
        ticketsOpenCount: totalOpen,
        ticketResolutionRate: resolutionRate,
        averageResolutionHours: avgResolutionHours,
        slaCompliancePercentage: slaComplianceRate,
        workLogsSubmittedCount: allLogs.length
      };
    });
  },

  /**
   * Generates a performance leaderboard of all Technical Support Executives.
   * 
   * @param {string} [startDate] - Start date window
   * @param {string} [endDate] - End date window
   * @return {Array<Object>} Sorted executive KPI profiles
   */
  getPerformanceLeaderboard: function(startDate, endDate) {
    var self = this;
    return this._execute("getPerformanceLeaderboard", function() {
      var executives = UserRepository.findByRole(CONSTANTS.ROLES.TECHNICAL_EXECUTIVE);
      var profiles = [];

      executives.forEach(function(exec) {
        try {
          var kpi = self.calculateExecutiveKpis(exec.id, startDate, endDate);
          profiles.push(kpi);
        } catch (e) {
          LoggerService.error("Failed compiling KPIs for executive ID " + exec.id, e);
        }
      });

      // Sort leaderboard: priority to high resolution rate, then hours logged
      profiles.sort(function(a, b) {
        if (b.ticketResolutionRate !== a.ticketResolutionRate) {
          return b.ticketResolutionRate - a.ticketResolutionRate;
        }
        return b.hoursLogged - a.hoursLogged;
      });

      return profiles;
    });
  },

  /**
   * Retrieves all work logs.
   */
  getWorkLogs: function() {
    return this._execute("getWorkLogs", function() {
      return WorkLogRepository.findAll(true);
    });
  },

  /**
   * Retrieves a single work log.
   */
  getWorkLog: function(logId) {
    return this._execute("getWorkLog", function() {
      if (!logId) throw new Error("Work Log ID is required.");
      var log = WorkLogRepository.find(logId);
      if (!log) {
        throw new Error("Work log with ID " + logId + " not found.");
      }
      return log;
    });
  },

  /**
   * Updates an existing work log.
   */
  updateWorkLog: function(logId, updates, userContext) {
    return this._execute("updateWorkLog", function() {
      if (!logId) throw new Error("Work Log ID is required.");
      var existing = WorkLogRepository.find(logId);
      if (!existing) {
        throw new Error("Work log with ID " + logId + " not found.");
      }

      var updated = WorkLogRepository.update(logId, updates);
      AuditManager.logEvent("WORK_LOG_UPDATE", "SUCCESS", userContext, "Updated work log ID " + logId);
      return updated;
    }, userContext);
  },

  /**
   * Permanently deletes a work log.
   */
  deleteWorkLog: function(logId, userContext) {
    return this._execute("deleteWorkLog", function() {
      if (!logId) throw new Error("Work Log ID is required.");
      var existing = WorkLogRepository.find(logId);
      if (!existing) {
        throw new Error("Work log with ID " + logId + " not found.");
      }

      var deleted = WorkLogRepository.delete(logId);
      AuditManager.logEvent("WORK_LOG_DELETION", "SUCCESS", userContext, "Deleted work log ID " + logId);
      return { id: logId, success: deleted };
    }, userContext);
  }
};
