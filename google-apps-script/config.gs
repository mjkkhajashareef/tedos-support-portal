/**
 * @fileoverview System configuration and constants.
 * Defines API versions, status codes, and error definitions for the TEDOS architecture.
 * @license Apache-2.0
 */

var CONFIG = {
  API_VERSION: "v1",
  SHEET_NAMES: {
    CLIENTS: "Clients",
    USERS: "Users",
    TICKETS: "Tickets",
    NOTIFICATIONS: "Notifications",
    FOLLOW_UPS: "Follow-ups",
    WORK_LOGS: "Work Logs",
    SETTINGS: "Settings",
    TRAINING_LOGS: "Training Logs",
    AUDIT_LOGS: "Audit Logs"
  },
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500
  }
};

var CONSTANTS = {
  ERROR_CODES: {
    AUTH_UNAUTHORIZED_ACCESS: "ERR_AUTH_001",
    AUTH_EXPIRED_SESSION: "ERR_AUTH_002",
    REQ_RESOURCE_NOT_FOUND: "ERR_REQ_404",
    SRV_RATE_LIMIT_EXCEEDED: "ERR_SRV_429",
    SRV_INTERNAL_FAILURE: "ERR_SRV_500"
  }
};
