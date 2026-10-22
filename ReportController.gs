/**
 * @fileoverview System Reporting and Analytical Controller.
 * Coordinates HTTP/REST requests for compiling audit reports and metrics trends.
 * @license Apache-2.0
 */

var ReportController = {
  /**
   * Compiles the SLA Compliance audit report.
   */
  getSlaReport: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET", "POST"],
      successMessage: "SLA compliance report generated."
    }, function(body, userContext) {
      var startDate = request.query ? request.query.startDate : (body ? body.startDate : null);
      var endDate = request.query ? request.query.endDate : (body ? body.endDate : null);
      return ReportService.generateClientSLAComplianceReport(startDate, endDate);
    });
  },

  /**
   * Compiles team support activity trends.
   */
  getTrendReport: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET", "POST"],
      successMessage: "Activity trend report generated."
    }, function(body, userContext) {
      var startDate = request.query ? request.query.startDate : (body ? body.startDate : null);
      var endDate = request.query ? request.query.endDate : (body ? body.endDate : null);
      return ReportService.generateActivityTrendReport(startDate, endDate);
    });
  },

  /**
   * Compiles ticket resolution velocity statistics.
   */
  getFulfillmentReport: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET", "POST"],
      successMessage: "Ticket fulfillment report generated."
    }, function(body, userContext) {
      var startDate = request.query ? request.query.startDate : (body ? body.startDate : null);
      var endDate = request.query ? request.query.endDate : (body ? body.endDate : null);
      return ReportService.generateTicketFulfillmentReport(startDate, endDate);
    });
  }
};
