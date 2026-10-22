/**
 * @fileoverview Dashboard Analytical Aggregation Service.
 * Compiles operational metrics, detects revenue risks, identifies critical clients, and calculates executive workload scores.
 * Uses high-performance caching to prevent slow spreadsheet polling.
 * @license Apache-2.0
 */

var DashboardService = {
  serviceName: "DashboardService",

  /**
   * Helper to execute service operations with timing, validation, retry, logging, and safety.
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
          Utilities.sleep(100 * attempt); // Brief backoff
        }
      }
    }

    var totalDuration = new Date().getTime() - startTime;
    LoggerService.error("[" + this.serviceName + "] Action '" + actionName + "' permanently failed after " + maxRetries + " attempts (" + totalDuration + "ms).", lastError);
    throw lastError;
  },

  /**
   * Compiles the complete consolidated analytical dashboard.
   * Checks Cache first before polling sheet datasets.
   * 
   * @param {boolean} [forceRefresh=false] - If true, bypasses the cache completely
   * @return {Object} Analytical dashboard payload structure
   */
  getDashboardAnalytics: function(forceRefresh) {
    var self = this;
    return this._execute("getDashboardAnalytics", function() {
      var cacheKey = "DASHBOARD_ANALYTICS_PAYLOAD";
      
      if (!forceRefresh) {
        var cached = CacheManager.getJson(cacheKey);
        if (cached) {
          LoggerService.info("Serving Dashboard Analytics from cache.");
          return cached;
        }
      }

      LoggerService.info("Compiling full Dashboard Analytics from database tables.");

      var clients = ClientRepository.findAll(true);
      var tickets = TicketRepository.findAll(true);
      var workLogs = WorkLogRepository.findAll(true);
      var followUps = FollowUpRepository.findAll(true);

      // 1. Client Totals
      var totalClients = clients.length;
      var activeClients = clients.filter(function(c) { return c.status === "Active"; }).length;
      var suspendedClients = clients.filter(function(c) { return c.status === "Suspended"; }).length;

      // 2. Ticket Metrics
      var openTickets = tickets.filter(function(t) {
        return t.status !== CONSTANTS.TICKET_STATUS.RESOLVED && t.status !== CONSTANTS.TICKET_STATUS.CLOSED;
      });
      var totalOpenTickets = openTickets.length;

      var priorityBreakdown = { Critical: 0, High: 0, Medium: 0, Low: 0 };
      openTickets.forEach(function(t) {
        if (priorityBreakdown[t.priority] !== undefined) {
          priorityBreakdown[t.priority]++;
        }
      });

      var statusBreakdown = {};
      tickets.forEach(function(t) {
        statusBreakdown[t.status] = (statusBreakdown[t.status] || 0) + 1;
      });

      // 3. Work Logs Totals
      var totalMinutesLogged = 0;
      workLogs.forEach(function(wl) {
        totalMinutesLogged += Number(wl.durationMinutes || 0);
      });
      var totalHoursLogged = Number((totalMinutesLogged / 60).toFixed(1));

      // 4. Critical Clients Detection (< 50 health or suspended or multiple open critical tickets)
      var criticalClientsList = self._detectCriticalClients(clients, openTickets);

      // 5. Revenue Risks Churn Detection (expiring soon or critical health)
      var revenueRisksList = self._detectRevenueRisks(clients);

      // 6. Executive Workload Score calculation
      var workloads = self._calculateExecutiveWorkloads(openTickets);

      // 7. Follow Ups Status
      var pendingFollowUps = followUps.filter(function(f) { return f.status === "Pending"; }).length;

      var payload = {
        compiledAt: new Date().toISOString(),
        clientMetrics: {
          totalCount: totalClients,
          activeCount: activeClients,
          suspendedCount: suspendedClients,
          criticalCount: criticalClientsList.length
        },
        ticketMetrics: {
          totalOpenCount: totalOpenTickets,
          priorityBreakdown: priorityBreakdown,
          statusBreakdown: statusBreakdown
        },
        efficiencyMetrics: {
          totalHoursLogged: totalHoursLogged,
          pendingFollowUpsCount: pendingFollowUps
        },
        criticalClients: criticalClientsList,
        revenueRisks: revenueRisksList,
        executiveWorkloads: workloads
      };

      // Store in Cache for 5 minutes
      CacheManager.putJson(cacheKey, payload, 300);

      return payload;
    });
  },

  /**
   * Internal routine to identify clients requiring critical support attention.
   * 
   * @private
   */
  _detectCriticalClients: function(clients, openTickets) {
    var criticalList = [];

    clients.forEach(function(client) {
      // Filter out soft deleted clients
      if (client.status === "Archived" || client.status === "Deleted") return;

      var clientOpenTickets = openTickets.filter(function(t) { return t.clientId === client.id; });
      var criticalTicketsCount = clientOpenTickets.filter(function(t) { return t.priority === CONSTANTS.PRIORITY.CRITICAL; }).length;

      var health = Number(client.healthStatus || 100);
      var isCritical = health < 50 || client.status === "Suspended" || criticalTicketsCount >= 2;

      if (isCritical) {
        criticalList.push({
          clientId: client.id,
          clientName: client.name,
          healthStatus: health,
          status: client.status,
          openTicketsCount: clientOpenTickets.length,
          criticalTicketsCount: criticalTicketsCount,
          reason: health < 50 ? "Health Score below critical threshold." : (client.status === "Suspended" ? "Administrative Suspension." : "Multiple critical unresolved support tickets.")
        });
      }
    });

    return criticalList;
  },

  /**
   * Internal routine to evaluate accounts at risk of churn or revenue leakage.
   * 
   * @private
   */
  _detectRevenueRisks: function(clients) {
    var riskList = [];
    var today = new Date().getTime();

    clients.forEach(function(client) {
      if (client.status !== "Active") return; // Only scan active clients

      var health = Number(client.healthStatus || 100);
      var expiryTime = client.expiryDate ? new Date(client.expiryDate).getTime() : 0;
      var daysUntilExpiry = expiryTime ? (expiryTime - today) / (1000 * 60 * 60 * 24) : -999;

      var isAtRisk = health < 40 || daysUntilExpiry <= 30;

      if (isAtRisk) {
        var riskFactor = "Health Score is extremely low (" + health + ")";
        if (daysUntilExpiry < 0) riskFactor = "License has EXPIRED (" + Math.round(Math.abs(daysUntilExpiry)) + " days ago)";
        else if (daysUntilExpiry <= 30) riskFactor = "License expiring in " + Math.round(daysUntilExpiry) + " days";

        riskList.push({
          clientId: client.id,
          clientName: client.name,
          company: client.company,
          licenseType: client.licenseType,
          expiryDate: client.expiryDate,
          daysUntilExpiry: Math.round(daysUntilExpiry),
          healthStatus: health,
          riskFactor: riskFactor
        });
      }
    });

    return riskList;
  },

  /**
   * Internal routine to aggregate work volumes and workload stresses per Support Executive.
   * 
   * @private
   */
  _calculateExecutiveWorkloads: function(openTickets) {
    var executives = UserRepository.findByRole(CONSTANTS.ROLES.TECHNICAL_EXECUTIVE);
    var workloadResults = [];

    executives.forEach(function(exec) {
      var assignedOpen = openTickets.filter(function(t) { return t.teId === exec.id; });
      
      // Calculate weighted workload score
      // Critical Ticket = 4, High = 3, Medium = 2, Low = 1
      var totalWeight = 0;
      var criticalCount = 0;
      var highCount = 0;

      assignedOpen.forEach(function(t) {
        if (t.priority === CONSTANTS.PRIORITY.CRITICAL) {
          totalWeight += 4;
          criticalCount++;
        } else if (t.priority === CONSTANTS.PRIORITY.HIGH) {
          totalWeight += 3;
          highCount++;
        } else if (t.priority === CONSTANTS.PRIORITY.MEDIUM) {
          totalWeight += 2;
        } else {
          totalWeight += 1;
        }
      });

      // Status indicator based on weighted score
      var stressLevel = "Normal";
      if (totalWeight >= 12 || criticalCount >= 2) stressLevel = "Overloaded";
      else if (totalWeight >= 6) stressLevel = "Moderate";

      workloadResults.push({
        executiveId: exec.id,
        executiveName: exec.name,
        avatarUrl: exec.avatarUrl || "",
        openTicketsCount: assignedOpen.length,
        criticalTicketsCount: criticalCount,
        highTicketsCount: highCount,
        workloadScore: totalWeight,
        stressLevel: stressLevel
      });
    });

    return workloadResults;
  },

  /**
   * Helper to invalidate the dashboard cache immediately on database mutations.
   */
  invalidateCache: function() {
    CacheManager.remove("DASHBOARD_ANALYTICS_PAYLOAD");
    LoggerService.info("Invalidated Dashboard Analytics caching state.");
  }
};
