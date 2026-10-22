/**
 * @fileoverview System-wide Constants, Status Lists, and Error Codes.
 * @license Apache-2.0
 */

var CONSTANTS = {
  // Roles list matching React UserRole enum
  ROLES: {
    CEO: "CEO",
    SUPPORT_MANAGER: "Support Manager",
    TECHNICAL_EXECUTIVE: "Technical Executive",
    AI_ADMINISTRATOR: "AI Administrator"
  },

  // Ticket Status values
  TICKET_STATUS: {
    NEW: "New",
    ASSIGNED: "Assigned",
    IN_PROGRESS: "In Progress",
    WAIT_FOR_CLIENT: "Waiting for Client",
    RESCHEDULED: "Rescheduled",
    ESCALATED: "Escalated",
    RESOLVED: "Resolved",
    CLOSED: "Closed"
  },

  // Ticket & Follow-up Priority values
  PRIORITY: {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    CRITICAL: "Critical"
  },

  // Record Synchronization States
  RECORD_STATES: {
    DRAFT: "Draft",
    PENDING_SYNC: "Pending Sync",
    SYNCED: "Synced",
    CONFLICT: "Conflict",
    FAILED: "Failed",
    ARCHIVED: "Archived"
  },

  // Notification types
  NOTIFICATION_TYPES: {
    INFO: "info",
    WARNING: "warning",
    SUCCESS: "success",
    ERROR: "error"
  },

  // Standardized Error Codes for Enterprise Triage
  ERROR_CODES: {
    // Auth & Identity Errors
    AUTH_MISSING_API_KEY: "AUTH_001",
    AUTH_INVALID_API_KEY: "AUTH_002",
    AUTH_MISSING_SIGNATURE: "AUTH_003",
    AUTH_INVALID_SIGNATURE: "AUTH_004",
    AUTH_MISSING_SESSION: "AUTH_005",
    AUTH_EXPIRED_SESSION: "AUTH_006",
    AUTH_FORBIDDEN_ROLE: "AUTH_007",
    
    // Request Errors
    REQ_BAD_VERSION: "REQ_101",
    REQ_BAD_JSON: "REQ_102",
    REQ_MISSING_PAYLOAD: "REQ_103",
    REQ_VALIDATION_FAILED: "REQ_104",
    REQ_RESOURCE_NOT_FOUND: "REQ_105",
    
    // Server Errors
    SRV_LOCK_TIMEOUT: "SRV_501",
    SRV_DATABASE_OFFLINE: "SRV_502",
    SRV_CONCURRENT_CONFLICT: "SRV_503",
    SRV_INTERNAL_FAILURE: "SRV_500",
    
    // Limits
    SRV_RATE_LIMIT_EXCEEDED: "SRV_429"
  }
};
