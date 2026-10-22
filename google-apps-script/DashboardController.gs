/**
 * @fileoverview Dashboard Analytical Aggregation Controller.
 * Coordinates HTTP/REST requests for compiling KPIs and visual data metrics.
 * @license Apache-2.0
 */

var DashboardController = {
  /**
   * Compiles the consolidated analytical dashboard payload.
   */
  getAnalytics: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET", "POST"],
      successMessage: "Dashboard analytical metrics compiled."
    }, function(body, userContext) {
      var forceRefresh = false;
      if (request.query && request.query.forceRefresh === "true") {
        forceRefresh = true;
      } else if (body && body.forceRefresh === true) {
        forceRefresh = true;
      }
      return DashboardService.getDashboardAnalytics(forceRefresh);
    });
  },

  /**
   * Forces invalidation of the analytical cached dashboard immediately.
   */
  invalidateCache: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Dashboard analytics cache invalidated successfully."
    }, function(body, userContext) {
      DashboardService.invalidateCache();
      return { success: true };
    });
  }
};
