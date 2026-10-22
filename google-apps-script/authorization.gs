/**
 * @fileoverview Authorization Engine.
 * Implements granular Role-Based Access Control (RBAC) and permission locks.
 * @license Apache-2.0
 */

var AuthorizationEngine = {
  /**
   * Complete Extended Role list
   */
  ROLES: {
    CEO: "CEO",
    COO: "COO",
    SUPPORT_MANAGER: "Support Manager",
    SUPPORT_EXECUTIVE: "Support Executive",
    MARKETING: "Marketing",
    FRANCHISE: "Franchise",
    TECHNICAL: "Technical",
    FINANCE: "Finance",
    AI_ADMIN: "AI Administrator"
  },

  /**
   * Action Permissions Mapping Matrix
   * Maps specific action identifiers to the array of roles permitted to invoke them.
   */
  PERMISSIONS_MATRIX: {
    // Client Management Actions
    "CLIENT_VIEW": ["CEO", "COO", "Support Manager", "Support Executive", "Marketing", "Franchise", "Technical"],
    "CLIENT_CREATE": ["CEO", "COO", "Support Manager", "Franchise"],
    "CLIENT_DELETE": ["CEO"],

    // Ticket Actions
    "TICKET_VIEW": ["CEO", "COO", "Support Manager", "Support Executive", "Technical", "Franchise"],
    "TICKET_CREATE": ["CEO", "COO", "Support Manager", "Support Executive", "Franchise"],
    "TICKET_UPDATE": ["CEO", "COO", "Support Manager", "Support Executive", "Technical"],
    "TICKET_DELETE": ["CEO"],
    "TICKET_ESCALATE": ["CEO", "COO", "Support Manager", "Support Executive"],

    // Work Log Actions
    "WORKLOG_VIEW": ["CEO", "COO", "Support Manager", "Technical", "Support Executive"],
    "WORKLOG_CREATE": ["CEO", "COO", "Support Manager", "Technical", "Support Executive"],
    
    // Follow Up Scheduling Actions
    "FOLLOWUP_VIEW": ["CEO", "COO", "Support Manager", "Support Executive", "Technical"],
    "FOLLOWUP_CREATE": ["CEO", "COO", "Support Manager", "Support Executive", "Technical"],

    // Notification Controls
    "NOTIFICATION_BROADCAST": ["CEO", "COO", "Support Manager", "AI Administrator"],
    "NOTIFICATION_READ": ["CEO", "COO", "Support Manager", "Support Executive", "Technical", "Marketing", "Franchise", "Finance", "AI Administrator"],

    // Training / Operational Logs
    "TRAINING_LOG": ["CEO", "COO", "Support Manager", "Technical", "AI Administrator"],

    // Dashboard Analytics & Financial Reports
    "DASHBOARD_VIEW": ["CEO", "COO", "Support Manager", "Finance", "AI Administrator"],
    "REPORTS_GENERATE": ["CEO", "COO", "Support Manager", "Finance"],

    // Core System Configuration Settings
    "SETTINGS_EDIT": ["CEO", "AI Administrator"],
    "DATABASE_SYNC": ["CEO", "COO", "Support Manager", "Technical", "AI Administrator"],
    "HEALTH_CHECK": ["CEO", "COO", "Support Manager", "Technical", "AI Administrator"],
    "AUDIT_VIEW": ["CEO", "AI Administrator"]
  },

  /**
   * Validates if a specific user role has permissions to execute a target action.
   * Centralizes validation and issues audit alerts on failure.
   * 
   * @param {string} userRole - Dynamic role of current session (e.g. "Technical")
   * @param {string} actionName - Action index from PERMISSIONS_MATRIX
   * @param {Object} auditContext - Staging parameter (userId, deviceId, sessionId, requestId)
   * @return {boolean} True if permission lock is granted
   * @throws {Error} Throws if unauthorized to abort script instantly
   */
  checkPermission: function(userRole, actionName, auditContext) {
    if (!actionName) {
      throw new Error("Action name is required for permissions check.");
    }

    var allowedRoles = this.PERMISSIONS_MATRIX[actionName];
    if (!allowedRoles) {
      LoggerService.warn("Permisison scope undefined for action: " + actionName + ". Defaulting to secure block.");
      var securityErr = new Error("Security policy blocked action: " + actionName);
      securityErr.code = CONSTANTS.ERROR_CODES.AUTH_FORBIDDEN_ROLE;
      throw securityErr;
    }

    // Direct role lookup match
    if (allowedRoles.indexOf(userRole) !== -1) {
      return true;
    }

    // Log explicit permission denied event
    var ctx = auditContext || {};
    AuditManager.logPermissionDenied(
      ctx.userId || "GUEST",
      ctx.deviceId || "UNKNOWN",
      ctx.sessionId || "NO-SESSION",
      actionName,
      allowedRoles.join("|"),
      userRole || "GUEST",
      ctx.requestId || "req-unknown"
    );

    // Throw standard access error
    var err = new Error("Action unauthorized. Role '" + userRole + "' is not permitted to execute '" + actionName + "'.");
    err.code = CONSTANTS.ERROR_CODES.AUTH_FORBIDDEN_ROLE;
    throw err;
  }
};
