/**
 * @fileoverview Support Ticket Business Service Layer.
 * Governs the entire ticket lifecycle, ticket assignments, escalation triggers, SLA audits, resolutions, and closures.
 * Ensures data mutations are executed atomically with rollback procedures and audit entries.
 * @license Apache-2.0
 */

var TicketService = {
  serviceName: "TicketService",

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
   * Creates a support ticket and links it to a client.
   * 
   * @param {Object} payload - Ticket details (clientId, issueCategory, issueDescription, priority, createdBy)
   * @param {Object} userContext - Context object of the user performing the action
   * @return {Object} The created ticket record
   */
  createTicket: function(payload, userContext) {
    var self = this;
    return this._execute("createTicket", function() {
      if (!payload.clientId) throw new Error("Client ID is required for ticket creation.");
      if (!payload.issueCategory) throw new Error("Issue Category is required.");
      if (!payload.issueDescription) throw new Error("Issue Description is required.");
      
      var client = ClientRepository.find(payload.clientId);
      if (!client) {
        throw new Error("Client with ID " + payload.clientId + " not found.");
      }

      var ticketId = IdGenerator.generateTicketId(TicketRepository.getSheet());
      var ticketRecord = {
        id: ticketId,
        teId: payload.teId || "",
        clientId: payload.clientId,
        clientName: client.name,
        issueCategory: payload.issueCategory,
        issueDescription: payload.issueDescription,
        priority: payload.priority || CONSTANTS.PRIORITY.MEDIUM,
        status: CONSTANTS.TICKET_STATUS.NEW,
        assignedExecutive: payload.assignedExecutive || "",
        createdBy: payload.createdBy || (userContext ? userContext.userId : "SYSTEM"),
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        resolutionSummary: "",
        closedDate: "",
        version: 1
      };

      // Perform transaction write via repository
      var insertedTicket = TicketRepository.insert(ticketRecord);

      AuditManager.logEvent("TICKET_CREATION", "SUCCESS", userContext, "Created ticket " + ticketId + " for client " + client.name + ". Priority: " + ticketRecord.priority);

      // Trigger automatic assignment check
      if (ticketRecord.assignedExecutive) {
        // If an executive is explicitly provided, update status to Assigned
        TicketRepository.update(ticketId, { status: CONSTANTS.TICKET_STATUS.ASSIGNED });
      } else {
        // Auto-assign based on executive workload
        self.autoAssignTicket(ticketId, userContext);
      }

      // Recalculate Client health score because a new ticket was created
      ClientService.recalculateHealthScore(payload.clientId);

      // Push alerts
      NotificationService.createSystemAlert(
        "New Ticket Created",
        "Ticket " + ticketId + " [" + ticketRecord.priority + "] created for " + client.name,
        ticketRecord.priority === CONSTANTS.PRIORITY.CRITICAL ? CONSTANTS.NOTIFICATION_TYPES.ERROR : CONSTANTS.NOTIFICATION_TYPES.INFO
      );

      return TicketRepository.find(ticketId);
    }, userContext);
  },

  /**
   * Assigns a ticket to a technical support executive.
   * 
   * @param {string} ticketId - Unique Ticket ID
   * @param {string} teId - Technical Executive organizational ID
   * @param {Object} userContext - Context object of the user performing the action
   * @return {Object} The updated ticket record
   */
  assignTicket: function(ticketId, teId, userContext) {
    var self = this;
    return this._execute("assignTicket", function() {
      if (!ticketId) throw new Error("Ticket ID is required.");
      if (!teId) throw new Error("Technical Executive ID is required.");

      var ticket = TicketRepository.find(ticketId);
      if (!ticket) throw new Error("Ticket " + ticketId + " not found.");

      var userExec = UserRepository.find(teId);
      if (!userExec) throw new Error("Executive User with ID " + teId + " not found.");

      var previousStatus = ticket.status;
      var previousExec = ticket.assignedExecutive;

      try {
        var updatedTicket = TicketRepository.update(ticketId, {
          teId: teId,
          assignedExecutive: userExec.name,
          status: CONSTANTS.TICKET_STATUS.ASSIGNED,
          updatedDate: new Date().toISOString()
        });

        AuditManager.logEvent("TICKET_ASSIGNMENT", "SUCCESS", userContext, "Assigned ticket " + ticketId + " to " + userExec.name + " (" + teId + "). Previous assigned: " + previousExec);

        NotificationService.createSystemAlert(
          "Ticket Assigned",
          "Ticket " + ticketId + " has been assigned to support executive: " + userExec.name,
          CONSTANTS.NOTIFICATION_TYPES.SUCCESS
        );

        return updatedTicket;
      } catch (e) {
        LoggerService.error("Ticket assignment failed, rolling back status of Ticket: " + ticketId);
        try {
          TicketRepository.update(ticketId, {
            teId: ticket.teId,
            assignedExecutive: previousExec,
            status: previousStatus
          });
        } catch (rErr) {
          LoggerService.error("CRITICAL: Failed to rollback ticket assignment for ticket " + ticketId, rErr);
        }
        throw e;
      }
    }, userContext);
  },

  /**
   * Escalates a support ticket's priority level.
   * 
   * @param {string} ticketId - Unique Ticket ID
   * @param {string} reason - Detailed escalation trigger reason
   * @param {Object} userContext - Context object of the user performing the action
   * @return {Object} The updated ticket record
   */
  escalateTicket: function(ticketId, reason, userContext) {
    var self = this;
    return this._execute("escalateTicket", function() {
      if (!ticketId) throw new Error("Ticket ID is required.");
      if (!reason) throw new Error("Escalation reason is required.");

      var ticket = TicketRepository.find(ticketId);
      if (!ticket) throw new Error("Ticket " + ticketId + " not found.");

      var oldPriority = ticket.priority;
      var newPriority = CONSTANTS.PRIORITY.CRITICAL;

      // Escalate priority level
      if (oldPriority === CONSTANTS.PRIORITY.LOW) newPriority = CONSTANTS.PRIORITY.MEDIUM;
      else if (oldPriority === CONSTANTS.PRIORITY.MEDIUM) newPriority = CONSTANTS.PRIORITY.HIGH;

      var previousStatus = ticket.status;

      try {
        var updatedTicket = TicketRepository.update(ticketId, {
          priority: newPriority,
          status: CONSTANTS.TICKET_STATUS.ESCALATED,
          updatedDate: new Date().toISOString()
        });

        AuditManager.logEvent("TICKET_ESCALATION", "SUCCESS", userContext, "Escalated ticket " + ticketId + " from " + oldPriority + " to " + newPriority + ". Reason: " + reason);

        NotificationService.createSystemAlert(
          "Ticket Escalated",
          "CRITICAL: Ticket " + ticketId + " has been escalated to " + newPriority + ". Reason: " + reason,
          CONSTANTS.NOTIFICATION_TYPES.ERROR
        );

        // Recalculate client health score since ticket criticality increased
        ClientService.recalculateHealthScore(ticket.clientId);

        return updatedTicket;
      } catch (e) {
        LoggerService.error("Ticket escalation failed, rolling back priority/status of Ticket: " + ticketId);
        try {
          TicketRepository.update(ticketId, {
            priority: oldPriority,
            status: previousStatus
          });
        } catch (rErr) {
          LoggerService.error("CRITICAL: Failed to rollback ticket escalation for ticket " + ticketId, rErr);
        }
        throw e;
      }
    }, userContext);
  },

  /**
   * Resolves a support ticket with a details summary notes.
   * 
   * @param {string} ticketId - Unique Ticket ID
   * @param {string} resolutionSummary - Complete technical diagnosis and solution description
   * @param {Object} userContext - Context object of the user performing the action
   * @return {Object} The updated ticket record
   */
  resolveTicket: function(ticketId, resolutionSummary, userContext) {
    var self = this;
    return this._execute("resolveTicket", function() {
      if (!ticketId) throw new Error("Ticket ID is required.");
      if (!resolutionSummary) throw new Error("Resolution details are required.");

      var ticket = TicketRepository.find(ticketId);
      if (!ticket) throw new Error("Ticket " + ticketId + " not found.");

      if (ticket.status === CONSTANTS.TICKET_STATUS.CLOSED) {
        throw new Error("Cannot resolve a ticket that is already closed.");
      }

      var oldResolution = ticket.resolutionSummary;
      var previousStatus = ticket.status;

      try {
        var updatedTicket = TicketRepository.update(ticketId, {
          resolutionSummary: resolutionSummary,
          status: CONSTANTS.TICKET_STATUS.RESOLVED,
          updatedDate: new Date().toISOString()
        });

        AuditManager.logEvent("TICKET_RESOLUTION", "SUCCESS", userContext, "Resolved ticket " + ticketId + " with summary: " + resolutionSummary);

        NotificationService.createSystemAlert(
          "Ticket Resolved",
          "Ticket " + ticketId + " has been marked as Resolved.",
          CONSTANTS.NOTIFICATION_TYPES.SUCCESS
        );

        // Recalculate health score (resolving tickets improves health score)
        ClientService.recalculateHealthScore(ticket.clientId);

        return updatedTicket;
      } catch (e) {
        LoggerService.error("Ticket resolution failed, rolling back status of Ticket: " + ticketId);
        try {
          TicketRepository.update(ticketId, {
            resolutionSummary: oldResolution,
            status: previousStatus
          });
        } catch (rErr) {
          LoggerService.error("CRITICAL: Failed to rollback ticket resolution for ticket " + ticketId, rErr);
        }
        throw e;
      }
    }, userContext);
  },

  /**
   * Closes a support ticket and marks completion.
   * 
   * @param {string} ticketId - Unique Ticket ID
   * @param {Object} userContext - Context object of the user performing the action
   * @return {Object} The updated ticket record
   */
  closeTicket: function(ticketId, userContext) {
    var self = this;
    return this._execute("closeTicket", function() {
      if (!ticketId) throw new Error("Ticket ID is required.");

      var ticket = TicketRepository.find(ticketId);
      if (!ticket) throw new Error("Ticket " + ticketId + " not found.");

      var previousStatus = ticket.status;

      try {
        var updatedTicket = TicketRepository.update(ticketId, {
          status: CONSTANTS.TICKET_STATUS.CLOSED,
          closedDate: new Date().toISOString(),
          updatedDate: new Date().toISOString()
        });

        AuditManager.logEvent("TICKET_CLOSURE", "SUCCESS", userContext, "Closed ticket " + ticketId);

        // Recalculate client health score (ticket closing removes the ticket penalty)
        ClientService.recalculateHealthScore(ticket.clientId);

        return updatedTicket;
      } catch (e) {
        LoggerService.error("Ticket closure failed, rolling back status of Ticket: " + ticketId);
        try {
          TicketRepository.update(ticketId, {
            status: previousStatus,
            closedDate: ticket.closedDate
          });
        } catch (rErr) {
          LoggerService.error("CRITICAL: Failed to rollback ticket closure for ticket " + ticketId, rErr);
        }
        throw e;
      }
    }, userContext);
  },

  /**
   * Scans and verifies if a support ticket has breached its SLA policy.
   * SLA Targets:
   *   - Critical: 4 Hours
   *   - High: 12 Hours
   *   - Medium: 24 Hours
   *   - Low: 48 Hours
   * 
   * @param {string} ticketId - Unique Ticket ID
   * @return {Object} SLA compliance report payload
   */
  checkSlaBreach: function(ticketId) {
    var self = this;
    return this._execute("checkSlaBreach", function() {
      var ticket = TicketRepository.find(ticketId);
      if (!ticket) throw new Error("Ticket " + ticketId + " not found.");

      // If ticket is resolved or closed, SLA calculation is frozen at resolved/closed date
      var isCompleted = ticket.status === CONSTANTS.TICKET_STATUS.RESOLVED || ticket.status === CONSTANTS.TICKET_STATUS.CLOSED;
      var endTime = isCompleted ? new Date(ticket.updatedDate || ticket.closedDate).getTime() : new Date().getTime();
      var startTime = new Date(ticket.createdDate).getTime();
      
      var ageMs = endTime - startTime;
      var ageHours = ageMs / (1000 * 60 * 60);

      var limitHours = 48; // default LOW
      if (ticket.priority === CONSTANTS.PRIORITY.CRITICAL) limitHours = 4;
      else if (ticket.priority === CONSTANTS.PRIORITY.HIGH) limitHours = 12;
      else if (ticket.priority === CONSTANTS.PRIORITY.MEDIUM) limitHours = 24;

      var breached = ageHours > limitHours;

      if (breached && !isCompleted) {
        var breachWarn = "Ticket " + ticketId + " [" + ticket.priority + "] assigned to " + (ticket.assignedExecutive || "None") + " has breached its SLA ceiling of " + limitHours + " Hours. Age: " + Math.round(ageHours) + " Hours.";
        LoggerService.warn("SLA BREACH DETECTED: " + breachWarn);
        NotificationService.createSystemAlert("SLA Breach Alert", breachWarn, CONSTANTS.NOTIFICATION_TYPES.ERROR);
      }

      return {
        ticketId: ticketId,
        priority: ticket.priority,
        status: ticket.status,
        slaLimitHours: limitHours,
        actualAgeHours: ageHours,
        isBreached: breached,
        isResolvedOrClosed: isCompleted
      };
    });
  },

  /**
   * Automates support ticket assignment to the least loaded Support Executive.
   * 
   * @param {string} ticketId - Unique Ticket ID
   * @param {Object} userContext - Operational execution user context
   * @return {Object|null} The updated ticket record or null
   */
  autoAssignTicket: function(ticketId, userContext) {
    var self = this;
    return this._execute("autoAssignTicket", function() {
      var ticket = TicketRepository.find(ticketId);
      if (!ticket) throw new Error("Ticket " + ticketId + " not found.");

      // Find all executives
      var executives = UserRepository.findByRole(CONSTANTS.ROLES.TECHNICAL_EXECUTIVE);
      if (executives.length === 0) {
        LoggerService.warn("No Support Executives available for auto-assignment.");
        return null;
      }

      // Calculate current workload (open tickets count) of each executive
      var openTickets = TicketRepository.findOpenTickets();
      var workloadMap = {};
      executives.forEach(function(exec) {
        workloadMap[exec.id] = 0;
      });

      openTickets.forEach(function(t) {
        if (t.teId && workloadMap[t.teId] !== undefined) {
          workloadMap[t.teId]++;
        }
      });

      // Find executive with the minimum workload
      var selectedExec = null;
      var minWorkload = 99999;

      executives.forEach(function(exec) {
        if (workloadMap[exec.id] < minWorkload) {
          minWorkload = workloadMap[exec.id];
          selectedExec = exec;
        }
      });

      if (selectedExec) {
        LoggerService.info("Auto-assigning ticket " + ticketId + " to executive " + selectedExec.name + " (Workload: " + minWorkload + " open tickets).");
        return self.assignTicket(ticketId, selectedExec.id, userContext);
      }

      return null;
    });
  },

  /**
   * Retrieves a single ticket by unique ID.
   */
  getTicket: function(ticketId) {
    return this._execute("getTicket", function() {
      if (!ticketId) throw new Error("Ticket ID is required.");
      var ticket = TicketRepository.find(ticketId);
      if (!ticket) {
        throw new Error("Ticket ID '" + ticketId + "' not found.");
      }
      return ticket;
    });
  },

  /**
   * Retrieves all tickets.
   */
  getTickets: function() {
    return this._execute("getTickets", function() {
      return TicketRepository.findAll(true);
    });
  },

  /**
   * Standard support ticket field update.
   */
  updateTicket: function(ticketId, updates, userContext) {
    var self = this;
    return this._execute("updateTicket", function() {
      if (!ticketId) throw new Error("Ticket ID is required.");
      var existing = TicketRepository.find(ticketId);
      if (!existing) {
        throw new Error("Ticket ID '" + ticketId + "' not found.");
      }

      updates.updatedDate = new Date().toISOString();
      var updated = TicketRepository.update(ticketId, updates);
      AuditManager.logEvent("TICKET_UPDATE", "SUCCESS", userContext, "Updated support ticket ID " + ticketId);

      // Recalculate client health score because ticket status might have changed
      ClientService.recalculateHealthScore(existing.clientId);

      return updated;
    }, userContext);
  },

  /**
   * Permanently deletes a support ticket.
   */
  deleteTicket: function(ticketId, userContext) {
    var self = this;
    return this._execute("deleteTicket", function() {
      if (!ticketId) throw new Error("Ticket ID is required.");
      var existing = TicketRepository.find(ticketId);
      if (!existing) {
        throw new Error("Ticket ID '" + ticketId + "' not found.");
      }

      var deleted = TicketRepository.delete(ticketId);
      AuditManager.logEvent("TICKET_DELETION", "SUCCESS", userContext, "Deleted ticket ID " + ticketId);
      
      // Health score check
      ClientService.recalculateHealthScore(existing.clientId);

      return { id: ticketId, success: deleted };
    }, userContext);
  }
};
