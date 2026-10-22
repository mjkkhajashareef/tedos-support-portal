/**
 * @fileoverview System Reporting and Analytical Service.
 * Aggregates logs, trends, SLA performance figures, and operational statistics within specific time ranges.
 * @license Apache-2.0
 */

var ReportService = {
  serviceName: "ReportService",

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
          Utilities.sleep(100 * attempt);
        }
      }
    }

    var totalDuration = new Date().getTime() - startTime;
    LoggerService.error("[" + this.serviceName + "] Action '" + actionName + "' permanently failed after " + maxRetries + " attempts (" + totalDuration + "ms).", lastError);
    throw lastError;
  },

  /**
   * Generates a comprehensive SLA compliance audit report.
   * 
   * @param {string} startDate - Range start (YYYY-MM-DD)
   * @param {string} endDate - Range end (YYYY-MM-DD)
   * @return {Object} SLA compliance report
   */
  generateClientSLAComplianceReport: function(startDate, endDate) {
    var self = this;
    return this._execute("generateClientSLAComplianceReport", function() {
      if (!startDate || !endDate) throw new Error("Start date and End date are required.");

      var cacheKey = "REPORT_SLA_" + startDate + "_" + endDate;
      var cached = CacheManager.getJson(cacheKey);
      if (cached) return cached;

      var tickets = TicketRepository.findAll(true);
      var start = new Date(startDate).getTime();
      var end = new Date(endDate).getTime();

      // Filter tickets within range
      var rangeTickets = tickets.filter(function(t) {
        var created = new Date(t.createdDate).getTime();
        return created >= start && created <= end;
      });

      var totalCount = rangeTickets.length;
      var complianceCount = 0;
      var breachCount = 0;
      
      var priorityCompliance = {
        Critical: { total: 0, compliant: 0 },
        High: { total: 0, compliant: 0 },
        Medium: { total: 0, compliant: 0 },
        Low: { total: 0, compliant: 0 }
      };

      rangeTickets.forEach(function(t) {
        var slaReport = TicketService.checkSlaBreach(t.id);
        var pri = t.priority;

        if (priorityCompliance[pri]) {
          priorityCompliance[pri].total++;
          if (!slaReport.isBreached) {
            priorityCompliance[pri].compliant++;
            complianceCount++;
          } else {
            breachCount++;
          }
        }
      });

      var overallRate = totalCount > 0 ? Number(((complianceCount / totalCount) * 100).toFixed(1)) : 100;

      var report = {
        startDate: startDate,
        endDate: endDate,
        generatedAt: new Date().toISOString(),
        overallComplianceRate: overallRate,
        totalTicketsAudited: totalCount,
        slaMetCount: complianceCount,
        slaBreachedCount: breachCount,
        prioritySlaBreakdown: {
          Critical: priorityCompliance.Critical.total > 0 ? Number(((priorityCompliance.Critical.compliant / priorityCompliance.Critical.total) * 100).toFixed(1)) : 100,
          High: priorityCompliance.High.total > 0 ? Number(((priorityCompliance.High.compliant / priorityCompliance.High.total) * 100).toFixed(1)) : 100,
          Medium: priorityCompliance.Medium.total > 0 ? Number(((priorityCompliance.Medium.compliant / priorityCompliance.Medium.total) * 100).toFixed(1)) : 100,
          Low: priorityCompliance.Low.total > 0 ? Number(((priorityCompliance.Low.compliant / priorityCompliance.Low.total) * 100).toFixed(1)) : 100
        }
      };

      // Cache report for 1 hour
      CacheManager.putJson(cacheKey, report, 3600);

      return report;
    });
  },

  /**
   * Compiles team support activity, trends, and total hours logged.
   * 
   * @param {string} startDate - Range start (YYYY-MM-DD)
   * @param {string} endDate - Range end (YYYY-MM-DD)
   * @return {Object} Activity trend report payload
   */
  generateActivityTrendReport: function(startDate, endDate) {
    var self = this;
    return this._execute("generateActivityTrendReport", function() {
      if (!startDate || !endDate) throw new Error("Start date and End date are required.");

      var cacheKey = "REPORT_TREND_" + startDate + "_" + endDate;
      var cached = CacheManager.getJson(cacheKey);
      if (cached) return cached;

      var logs = WorkLogRepository.findByDateRange(startDate, endDate);
      
      var categorySummary = {};
      var dateTrend = {};
      var totalMinutes = 0;

      logs.forEach(function(log) {
        var duration = Number(log.durationMinutes || 0);
        totalMinutes += duration;

        // Group by category
        var cat = log.category || "Consultation";
        categorySummary[cat] = (categorySummary[cat] || 0) + duration;

        // Group by date
        var d = log.date;
        if (!dateTrend[d]) {
          dateTrend[d] = { totalMinutes: 0, logCount: 0 };
        }
        dateTrend[d].totalMinutes += duration;
        dateTrend[d].logCount++;
      });

      // Format trends as array
      var trendsArray = [];
      for (var d in dateTrend) {
        if (dateTrend.hasOwnProperty(d)) {
          trendsArray.push({
            date: d,
            totalHoursLogged: Number((dateTrend[d].totalMinutes / 60).toFixed(1)),
            submissionsCount: dateTrend[d].logCount
          });
        }
      }
      trendsArray.sort(function(a, b) { return a.date.localeCompare(b.date); });

      // Convert category durations to hours
      var categoriesHours = {};
      for (var cat in categorySummary) {
        if (categorySummary.hasOwnProperty(cat)) {
          categoriesHours[cat] = Number((categorySummary[cat] / 60).toFixed(1));
        }
      }

      var report = {
        startDate: startDate,
        endDate: endDate,
        generatedAt: new Date().toISOString(),
        totalWorkLogsSubmitted: logs.length,
        totalHoursLogged: Number((totalMinutes / 60).toFixed(1)),
        categoryWorkDistributionHours: categoriesHours,
        timelineTrend: trendsArray
      };

      CacheManager.putJson(cacheKey, report, 1800); // 30 minutes caching

      return report;
    });
  },

  /**
   * Evaluates support tickets resolution velocity and queue states.
   * 
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @return {Object} Ticket fulfillment statistics
   */
  generateTicketFulfillmentReport: function(startDate, endDate) {
    var self = this;
    return this._execute("generateTicketFulfillmentReport", function() {
      if (!startDate || !endDate) throw new Error("Dates are required.");

      var cacheKey = "REPORT_FULFILLMENT_" + startDate + "_" + endDate;
      var cached = CacheManager.getJson(cacheKey);
      if (cached) return cached;

      var tickets = TicketRepository.findAll(true);
      var start = new Date(startDate).getTime();
      var end = new Date(endDate).getTime();

      var inRangeTickets = tickets.filter(function(t) {
        var created = new Date(t.createdDate).getTime();
        return created >= start && created <= end;
      });

      var total = inRangeTickets.length;
      var resolved = inRangeTickets.filter(function(t) { return t.status === CONSTANTS.TICKET_STATUS.RESOLVED || t.status === CONSTANTS.TICKET_STATUS.CLOSED; }).length;
      var open = total - resolved;

      // Calculate Category weights
      var categories = {};
      inRangeTickets.forEach(function(t) {
        var cat = t.issueCategory || "General Support";
        categories[cat] = (categories[cat] || 0) + 1;
      });

      var report = {
        startDate: startDate,
        endDate: endDate,
        generatedAt: new Date().toISOString(),
        totalTicketsCreated: total,
        resolvedTicketsCount: resolved,
        openTicketsCount: open,
        backlogResolutionRate: total > 0 ? Number(((resolved / total) * 100).toFixed(1)) : 100,
        ticketsByIssueCategory: categories
      };

      CacheManager.putJson(cacheKey, report, 1800);

      return report;
    });
  }
};
