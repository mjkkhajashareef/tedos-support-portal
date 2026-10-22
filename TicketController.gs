/**
 * @fileoverview Support Ticket Controller Layer.
 * Coordinates HTTP/REST requests for tickets to the TicketService.
 * @license Apache-2.0
 */

var TicketController = {
  /**
   * Retrieves all tickets.
   */
  getTickets: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET"],
      successMessage: "Support tickets list retrieved successfully."
    }, function(body, userContext) {
      return TicketService.getTickets();
    });
  },

  /**
   * Retrieves a single support ticket.
   */
  getTicket: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET"],
      successMessage: "Support ticket details retrieved."
    }, function(body, userContext) {
      var id = request.query ? request.query.id : null;
      return TicketService.getTicket(id);
    });
  },

  /**
   * Creates a new support ticket.
   */
  createTicket: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Support ticket registered successfully."
    }, function(body, userContext) {
      return TicketService.createTicket(body, userContext);
    });
  },

  /**
   * Batch creates multiple support tickets.
   */
  batchCreateTickets: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Batch tickets creation completed."
    }, function(body, userContext) {
      if (!body || !Array.isArray(body)) {
        throw new Error("Payload body must be a JSON array of tickets.");
      }
      var results = [];
      for (var i = 0; i < body.length; i++) {
        try {
          var tkt = TicketService.createTicket(body[i], userContext);
          results.push({ index: i, success: true, ticket: tkt });
        } catch (err) {
          results.push({ index: i, success: false, message: err.message });
        }
      }
      return results;
    });
  },

  /**
   * Updates an existing support ticket.
   */
  updateTicket: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["PUT", "PATCH"],
      successMessage: "Support ticket updated successfully."
    }, function(body, userContext) {
      var id = request.query ? request.query.id : null;
      if (!id && body) id = body.id;
      return TicketService.updateTicket(id, body, userContext);
    });
  },

  /**
   * Permanently deletes a ticket.
   */
  deleteTicket: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["DELETE"],
      successMessage: "Support ticket deleted successfully."
    }, function(body, userContext) {
      var id = request.query ? request.query.id : null;
      return TicketService.deleteTicket(id, userContext);
    });
  },

  /**
   * Assigns a ticket to a technical support executive.
   */
  assignTicket: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Support ticket assigned successfully."
    }, function(body, userContext) {
      if (!body) throw new Error("Body payload is required.");
      var ticketId = body.ticketId;
      var teId = body.teId;
      return TicketService.assignTicket(ticketId, teId, userContext);
    });
  },

  /**
   * Escalates a support ticket priority level.
   */
  escalateTicket: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Support ticket escalated successfully."
    }, function(body, userContext) {
      if (!body) throw new Error("Body payload is required.");
      var ticketId = body.ticketId;
      var reason = body.reason || "Escalated by supervisor request.";
      return TicketService.escalateTicket(ticketId, reason, userContext);
    });
  },

  /**
   * Marks a support ticket as resolved.
   */
  resolveTicket: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Support ticket resolved successfully."
    }, function(body, userContext) {
      if (!body) throw new Error("Body payload is required.");
      var ticketId = body.ticketId;
      var resolutionSummary = body.resolutionSummary;
      return TicketService.resolveTicket(ticketId, resolutionSummary, userContext);
    });
  },

  /**
   * Marks a support ticket as closed.
   */
  closeTicket: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Support ticket closed successfully."
    }, function(body, userContext) {
      var ticketId = body ? body.ticketId : (request.query ? request.query.id : null);
      return TicketService.closeTicket(ticketId, userContext);
    });
  },

  /**
   * Runs SLA breach analytics on a support ticket.
   */
  checkSla: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET", "POST"],
      successMessage: "SLA compliance audit completed."
    }, function(body, userContext) {
      var ticketId = request.query ? request.query.id : (body ? body.ticketId : null);
      return TicketService.checkSlaBreach(ticketId);
    });
  },

  /**
   * Automates support ticket workload assignment.
   */
  autoAssign: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Automatic ticket assignment completed."
    }, function(body, userContext) {
      var ticketId = body ? body.ticketId : (request.query ? request.query.id : null);
      var result = TicketService.autoAssignTicket(ticketId, userContext);
      if (!result) {
        return { ticketId: ticketId, status: "UNASSIGNED", message: "No active support executives available for assignment." };
      }
      return { ticketId: ticketId, status: "ASSIGNED", ticket: result };
    });
  }
};
