/**
 * @fileoverview System REST API Router.
 * Matches endpoint paths, extracts route parameters, and routes to appropriate Controllers.
 * @license Apache-2.0
 */

var Router = {
  /**
   * Routes the validated controller request to its matching controller action.
   * 
   * @param {Object} request - Standardized controller request
   * @return {Object} ApiResponse
   */
  route: function(request) {
    var method = request.method;
    var path = request.path;
    
    // Ensure query object is initialized
    if (!request.query) {
      request.query = {};
    }

    // Normalized matching (trim trailing slashes)
    if (path.length > 1 && path.charAt(path.length - 1) === "/") {
      path = path.substring(0, path.length - 1);
    }

    // 1. Auth Routing
    if (path === "/auth/login") {
      return AuthController.login(request);
    }
    if (path === "/auth/logout") {
      return AuthController.logout(request);
    }

    // 2. Clients Routing
    if (path === "/clients") {
      if (method === "GET") {
        return ClientController.getClients(request);
      }
      if (method === "POST") {
        return ClientController.createClient(request);
      }
    }
    // Dynamic matching for /clients/:id
    if (path.indexOf("/clients/") === 0) {
      var clientId = path.substring(9);
      request.query.id = clientId;
      if (method === "GET") {
        return ClientController.getClient(request);
      }
      if (method === "PUT" || method === "PATCH") {
        return ClientController.updateClient(request);
      }
      if (method === "DELETE") {
        return ClientController.deleteClient(request);
      }
    }

    // 3. Tickets Routing
    if (path === "/tickets") {
      if (method === "GET") {
        return TicketController.getTickets(request);
      }
      if (method === "POST") {
        return TicketController.createTicket(request);
      }
    }
    // Dynamic matching for /tickets/:id
    if (path.indexOf("/tickets/") === 0) {
      var ticketId = path.substring(9);
      request.query.id = ticketId;
      request.query.ticketId = ticketId;
      if (method === "GET") {
        return TicketController.getTicket(request);
      }
      if (method === "PUT" || method === "PATCH") {
        return TicketController.updateTicket(request);
      }
      if (method === "DELETE") {
        return TicketController.deleteTicket(request);
      }
    }
    
    // Ticket operations routing
    if (path === "/tickets/assign") {
      return TicketController.assignTicket(request);
    }
    if (path === "/tickets/escalate") {
      return TicketController.escalateTicket(request);
    }
    if (path === "/tickets/resolve") {
      return TicketController.resolveTicket(request);
    }
    if (path === "/tickets/close") {
      return TicketController.closeTicket(request);
    }
    if (path === "/tickets/check-sla") {
      return TicketController.checkSla(request);
    }
    if (path === "/tickets/auto-assign") {
      return TicketController.autoAssign(request);
    }

    // 4. Work Logs Routing
    if (path === "/work-logs") {
      if (method === "GET") {
        return WorkLogController.getWorkLogs(request);
      }
      if (method === "POST") {
        return WorkLogController.createWorkLog(request);
      }
    }
    if (path.indexOf("/work-logs/") === 0) {
      request.query.id = path.substring(11);
      if (method === "PUT" || method === "PATCH") {
        return WorkLogController.updateWorkLog(request);
      }
      if (method === "DELETE") {
        return WorkLogController.deleteWorkLog(request);
      }
    }

    // 5. Follow-ups Routing
    if (path === "/follow-ups") {
      if (method === "GET") {
        return FollowUpController.getFollowUps(request);
      }
      if (method === "POST") {
        return FollowUpController.createFollowUp(request);
      }
    }
    if (path.indexOf("/follow-ups/") === 0) {
      request.query.id = path.substring(12);
      if (method === "PUT" || method === "PATCH") {
        return FollowUpController.updateFollowUp(request);
      }
      if (method === "DELETE") {
        return FollowUpController.deleteFollowUp(request);
      }
    }

    // 6. Notifications Routing
    if (path === "/notifications") {
      if (method === "GET") {
        return NotificationController.getNotifications(request);
      }
      if (method === "POST") {
        return NotificationController.createNotification(request);
      }
    }

    // 7. Sync Routing
    if (path === "/sync") {
      return SyncController.batchSync(request);
    }
    if (path === "/sync/single") {
      return SyncController.sync(request);
    }
    if (path === "/sync/resolve") {
      return SyncController.resolveConflict(request);
    }

    // 8. Dashboard Routing
    if (path === "/dashboard/metrics") {
      return DashboardController.getDashboardMetrics(request);
    }

    // 9. Reports Routing
    if (path === "/reports/sla") {
      return ReportController.getSlaReport(request);
    }
    if (path === "/reports/trends") {
      return ReportController.getTrendReport(request);
    }
    if (path === "/reports/fulfillment") {
      return ReportController.getFulfillmentReport(request);
    }

    // 10. Users Routing
    if (path === "/users") {
      if (method === "GET") {
        return UserController.getUsers(request);
      }
      if (method === "POST") {
        return UserController.createUser(request);
      }
    }
    if (path.indexOf("/users/") === 0) {
      var userId = path.substring(7);
      request.query.id = userId;
      if (method === "GET") {
        return UserController.getUserProfile(request);
      }
      if (method === "PUT" || method === "PATCH") {
        return UserController.updateUser(request);
      }
      if (method === "DELETE") {
        return UserController.deleteUser(request);
      }
    }
    if (path === "/users/role") {
      return UserController.updateUserRole(request);
    }
    if (path === "/users/ban") {
      return UserController.banUser(request);
    }
    if (path === "/users/unban") {
      return UserController.unbanUser(request);
    }

    // 11. Settings Routing
    if (path === "/settings") {
      if (method === "GET") {
        return SettingsController.getAllSettings(request);
      }
      if (method === "POST" || method === "PUT") {
        return SettingsController.batchUpdateSettings(request);
      }
    }
    if (path === "/settings/single") {
      if (method === "GET") {
        return SettingsController.getSetting(request);
      }
      if (method === "POST" || method === "PUT") {
        return SettingsController.updateSetting(request);
      }
    }

    // 12. Audits Routing
    if (path === "/audits") {
      return AuditController.query(request);
    }
    if (path === "/audits/flush") {
      return AuditController.flush(request);
    }
    if (path === "/audits/purge") {
      return AuditController.purge(request);
    }

    // Fallback error for non-matching endpoints
    return buildErrorResponse(
      "Endpoint '" + method + " " + path + "' not found on this server.",
      CONSTANTS.ERROR_CODES.REQ_RESOURCE_NOT_FOUND
    );
  }
};
