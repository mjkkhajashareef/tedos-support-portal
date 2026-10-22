/**
 * @fileoverview System Health & Performance Diagnostic Controller.
 * Coordinates HTTP/REST requests for compiling performance reports and pinging the database.
 * @license Apache-2.0
 */

var HealthController = {
  /**
   * Compiles a comprehensive technical health and capacity report.
   */
  getHealth: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET"],
      successMessage: "System health and capacity audit completed."
    }, function(body, userContext) {
      return HealthService.getSystemHealthReport();
    });
  },

  /**
   * Conducts a safe live transaction throughput probe and measures latency.
   */
  ping: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET", "POST"],
      successMessage: "Technical latency ping completed."
    }, function(body, userContext) {
      var latency = HealthService.pingDatabase();
      return {
        status: latency !== -1 ? "ONLINE" : "OFFLINE",
        latencyMs: latency,
        timestamp: new Date().toISOString()
      };
    });
  }
};
