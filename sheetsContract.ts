/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole, TicketStatus, TicketPriority, TimelineEntryType } from '../types';

/**
 * Enterprise Record States
 * Defines the synchronization state of any local TEDOS record.
 */
export enum RecordState {
  DRAFT = 'Draft',                 // Created locally, not ready to sync
  PENDING_SYNC = 'Pending Sync',   // Queued for synchronization
  SYNCED = 'Synced',               // Successfully synchronized with Google Sheets
  CONFLICT = 'Conflict',           // Remote and local versions diverged
  FAILED = 'Failed',               // Sync failed due to network or validation errors
  ARCHIVED = 'Archived'            // Locally or remotely archived
}

/**
 * Synchronization Modes
 * Supported operational modes for the data synchronization engine.
 */
export enum SyncMode {
  FULL_SYNC = 'Full Sync',               // Overwrites local/remote with full database state
  INCREMENTAL_SYNC = 'Incremental Sync', // Syncs only changed records (delta-tracking)
  MANUAL_SYNC = 'Manual Sync',           // Triggered on-demand by the user
  BACKGROUND_SYNC = 'Background Sync',   // Automated periodic sync in the background
  RETRY_QUEUE = 'Retry Queue'            // Handles offline-to-online queue replay
}

/**
 * Conflict Resolution Strategies
 * Rules for resolving data collisions between client states and the Sheets backend.
 */
export enum ConflictResolutionStrategy {
  LAST_WRITE_WINS = 'Last Write Wins',     // Most recent timestamp overrides previous data
  VERSION_CHECKING = 'Version Checking',   // Checks record version/revision index before update
  OPTIMISTIC_LOCKING = 'Optimistic Locking', // Checks timestamp matching before write
  MANUAL_REVIEW = 'Manual Review'          // Places record in CONFLICT state for human triage
}

/**
 * Configurable Field Mapping Contract
 * Maps logical field names to dynamic spreadsheet targets without hardcoding column letters.
 */
export interface FieldMapping {
  field: string;          // Logical property name in TypeScript
  headerName: string;     // Column header text in the Google Sheet row 1
  columnIndex: number;    // Dynamic 0-based column index (0 = A, 1 = B, etc.)
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'json';
}

/**
 * Centralized Validation Rules Contract
 */
export interface FieldValidator {
  field: string;
  required: boolean;
  pattern?: RegExp;       // Regex pattern validation
  min?: number;           // Minimum value (numbers) or length (strings)
  max?: number;           // Maximum value (numbers) or length (strings)
  enum?: string[];        // Restrict to specific values
  custom?: (value: any) => boolean | string; // Custom validation logic
}

/**
 * Sheet Entity Definition
 * Defines the complete behavioral and structural blueprint of a single TEDOS Sheet.
 */
export interface SheetEntityContract {
  entityName: string;
  sheetName: string;
  primaryKey: string;
  fieldMappings: FieldMapping[];
  validationRules: FieldValidator[];
  readRules: string;
  writeRules: string;
  updateRules: string;
  syncStrategy: SyncMode;
  conflictStrategy: ConflictResolutionStrategy;
}

/**
 * Enterprise Google Sheets Mapping and Contract Configurations
 */
export const SHEETS_CONTRACT: Record<string, SheetEntityContract> = {
  CLIENT: {
    entityName: 'Client',
    sheetName: 'Clients',
    primaryKey: 'id',
    readRules: 'Allowed for all authenticated internal organizational roles.',
    writeRules: 'Restricted to Support Managers or AI Administrators.',
    updateRules: 'Updates allowed on client metadata, contract, or health changes.',
    syncStrategy: SyncMode.INCREMENTAL_SYNC,
    conflictStrategy: ConflictResolutionStrategy.OPTIMISTIC_LOCKING,
    fieldMappings: [
      { field: 'id', headerName: 'Client ID', columnIndex: 0, dataType: 'string' },
      { field: 'name', headerName: 'Client Name', columnIndex: 1, dataType: 'string' },
      { field: 'company', headerName: 'Company Name', columnIndex: 2, dataType: 'string' },
      { field: 'phone', headerName: 'Phone Number', columnIndex: 3, dataType: 'string' },
      { field: 'email', headerName: 'Email Address', columnIndex: 4, dataType: 'string' },
      { field: 'status', headerName: 'Client Status', columnIndex: 5, dataType: 'string' },
      { field: 'assignedExecutive', headerName: 'Assigned Executive', columnIndex: 6, dataType: 'string' },
      { field: 'softwareVersion', headerName: 'Software Version', columnIndex: 7, dataType: 'string' },
      { field: 'licenseType', headerName: 'License Type', columnIndex: 8, dataType: 'string' },
      { field: 'expiryDate', headerName: 'Expiry Date', columnIndex: 9, dataType: 'string' },
      { field: 'lastBackupDate', headerName: 'Last Backup Date', columnIndex: 10, dataType: 'string' },
      { field: 'healthStatus', headerName: 'Health Score', columnIndex: 11, dataType: 'number' },
      { field: 'recentActivityTimestamp', headerName: 'Last Activity Time', columnIndex: 12, dataType: 'string' },
      { field: 'version', headerName: 'Record Version', columnIndex: 13, dataType: 'number' }
    ],
    validationRules: [
      { field: 'id', required: true, pattern: /^CLT-\d{3,6}$/ },
      { field: 'name', required: true, min: 2, max: 100 },
      { field: 'company', required: true, min: 2, max: 100 },
      { field: 'phone', required: true, pattern: /^\+?[0-9\s-]{10,15}$/ },
      { field: 'email', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      { field: 'status', required: true, enum: ['Critical', 'Warning', 'Active', 'Inactive'] },
      { field: 'healthStatus', required: true, min: 0, max: 100 }
    ]
  },

  TICKET: {
    entityName: 'Ticket',
    sheetName: 'Tickets',
    primaryKey: 'id',
    readRules: 'Allowed for all support staff and managers.',
    writeRules: 'Support executives and managers can raise tickets.',
    updateRules: 'Changes to statuses, assigned executives, and resolution metadata are logged.',
    syncStrategy: SyncMode.BACKGROUND_SYNC,
    conflictStrategy: ConflictResolutionStrategy.VERSION_CHECKING,
    fieldMappings: [
      { field: 'id', headerName: 'Ticket ID', columnIndex: 0, dataType: 'string' },
      { field: 'teId', headerName: 'Technical Exec ID', columnIndex: 1, dataType: 'string' },
      { field: 'clientId', headerName: 'Client ID', columnIndex: 2, dataType: 'string' },
      { field: 'clientName', headerName: 'Client Name', columnIndex: 3, dataType: 'string' },
      { field: 'issueCategory', headerName: 'Category', columnIndex: 4, dataType: 'string' },
      { field: 'issueDescription', headerName: 'Description', columnIndex: 5, dataType: 'string' },
      { field: 'priority', headerName: 'Priority', columnIndex: 6, dataType: 'string' },
      { field: 'status', headerName: 'Status', columnIndex: 7, dataType: 'string' },
      { field: 'assignedExecutive', headerName: 'Assigned Executive', columnIndex: 8, dataType: 'string' },
      { field: 'createdBy', headerName: 'Created By', columnIndex: 9, dataType: 'string' },
      { field: 'createdDate', headerName: 'Creation Date', columnIndex: 10, dataType: 'string' },
      { field: 'updatedDate', headerName: 'Last Updated Date', columnIndex: 11, dataType: 'string' },
      { field: 'resolutionSummary', headerName: 'Resolution Details', columnIndex: 12, dataType: 'string' },
      { field: 'closedDate', headerName: 'Close Date', columnIndex: 13, dataType: 'string' },
      { field: 'version', headerName: 'Record Version', columnIndex: 14, dataType: 'number' }
    ],
    validationRules: [
      { field: 'id', required: true, pattern: /^TKT-\d{4}-\d{3,6}$/ },
      { field: 'clientId', required: true, pattern: /^CLT-\d{3,6}$/ },
      { field: 'clientName', required: true },
      { field: 'issueCategory', required: true, min: 2, max: 80 },
      { field: 'issueDescription', required: true, min: 5, max: 2000 },
      { field: 'priority', required: true, enum: ['Low', 'Medium', 'High', 'Critical'] },
      { field: 'status', required: true, enum: ['New', 'Assigned', 'In Progress', 'Waiting for Client', 'Rescheduled', 'Escalated', 'Resolved', 'Closed'] }
    ]
  },

  WORK_LOG: {
    entityName: 'Work Log',
    sheetName: 'Daily_Work_Logs',
    primaryKey: 'id',
    readRules: 'Executives read their own logs; Managers and CEO read all.',
    writeRules: 'Authenticated executives logged in the workspace.',
    updateRules: 'Logs are immutable once submitted and successfully synced.',
    syncStrategy: SyncMode.RETRY_QUEUE,
    conflictStrategy: ConflictResolutionStrategy.LAST_WRITE_WINS,
    fieldMappings: [
      { field: 'id', headerName: 'Log ID', columnIndex: 0, dataType: 'string' },
      { field: 'ticketId', headerName: 'Ticket ID Link', columnIndex: 1, dataType: 'string' },
      { field: 'clientId', headerName: 'Client ID', columnIndex: 2, dataType: 'string' },
      { field: 'clientName', headerName: 'Client Name', columnIndex: 3, dataType: 'string' },
      { field: 'timestamp', headerName: 'Timestamp (ISO)', columnIndex: 4, dataType: 'string' },
      { field: 'date', headerName: 'Date Logged', columnIndex: 5, dataType: 'string' },
      { field: 'time', headerName: 'Time Logged', columnIndex: 6, dataType: 'string' },
      { field: 'executiveName', headerName: 'Executive Name', columnIndex: 7, dataType: 'string' },
      { field: 'teId', headerName: 'TE Code', columnIndex: 8, dataType: 'string' },
      { field: 'category', headerName: 'Work Type', columnIndex: 9, dataType: 'string' },
      { field: 'details', headerName: 'Summary Notes', columnIndex: 10, dataType: 'string' },
      { field: 'status', headerName: 'Action Status', columnIndex: 11, dataType: 'string' },
      { field: 'nextFollowUpDate', headerName: 'Next Callback Date', columnIndex: 12, dataType: 'string' },
      { field: 'priority', headerName: 'Task Priority', columnIndex: 13, dataType: 'string' },
      { field: 'durationMinutes', headerName: 'Duration in Mins', columnIndex: 14, dataType: 'number' },
      { field: 'remarks', headerName: 'Internal Remarks', columnIndex: 15, dataType: 'string' }
    ],
    validationRules: [
      { field: 'id', required: true },
      { field: 'clientId', required: true, pattern: /^CLT-\d{3,6}$/ },
      { field: 'clientName', required: true },
      { field: 'date', required: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
      { field: 'durationMinutes', required: true, min: 1, max: 1440 },
      { field: 'category', required: true },
      { field: 'details', required: true, min: 3, max: 5000 }
    ]
  },

  FOLLOW_UP: {
    entityName: 'Follow-up',
    sheetName: 'Follow_Up_Tracker',
    primaryKey: 'id',
    readRules: 'Executives can track their queues; Managers can reassign.',
    writeRules: 'Created automatically on work log submission or raised manually on ticket workflows.',
    updateRules: 'Rescheduling modifies dates, times, and appends historic notes.',
    syncStrategy: SyncMode.BACKGROUND_SYNC,
    conflictStrategy: ConflictResolutionStrategy.OPTIMISTIC_LOCKING,
    fieldMappings: [
      { field: 'id', headerName: 'FollowUp ID', columnIndex: 0, dataType: 'string' },
      { field: 'ticketId', headerName: 'Ticket ID Link', columnIndex: 1, dataType: 'string' },
      { field: 'clientId', headerName: 'Client ID', columnIndex: 2, dataType: 'string' },
      { field: 'clientName', headerName: 'Client Name', columnIndex: 3, dataType: 'string' },
      { field: 'teId', headerName: 'TE Code', columnIndex: 4, dataType: 'string' },
      { field: 'executiveName', headerName: 'Executive', columnIndex: 5, dataType: 'string' },
      { field: 'scheduledDate', headerName: 'Scheduled Date', columnIndex: 6, dataType: 'string' },
      { field: 'scheduledTime', headerName: 'Scheduled Time', columnIndex: 7, dataType: 'string' },
      { field: 'priority', headerName: 'Priority', columnIndex: 8, dataType: 'string' },
      { field: 'lastContactDate', headerName: 'Last Contact Date', columnIndex: 9, dataType: 'string' },
      { field: 'status', headerName: 'Status', columnIndex: 10, dataType: 'string' },
      { field: 'reason', headerName: 'Follow-up Purpose', columnIndex: 11, dataType: 'string' },
      { field: 'remarks', headerName: 'Resolution Remarks', columnIndex: 12, dataType: 'string' },
      { field: 'nextAction', headerName: 'Recommended Action', columnIndex: 13, dataType: 'string' },
      { field: 'version', headerName: 'Record Version', columnIndex: 14, dataType: 'number' }
    ],
    validationRules: [
      { field: 'id', required: true },
      { field: 'clientId', required: true, pattern: /^CLT-\d{3,6}$/ },
      { field: 'clientName', required: true },
      { field: 'scheduledDate', required: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
      { field: 'scheduledTime', required: true, pattern: /^\d{2}:\d{2}$/ },
      { field: 'status', required: true, enum: ['Pending', 'Completed', 'Rescheduled', 'Escalated', 'Cancelled'] }
    ]
  },

  NOTIFICATION: {
    entityName: 'Notification',
    sheetName: 'Notifications',
    primaryKey: 'id',
    readRules: 'Scoped strictly per user session.',
    writeRules: 'Triggered by system alerts, alarms, or admin broadcasts.',
    updateRules: 'Only read status (boolean) can be updated.',
    syncStrategy: SyncMode.BACKGROUND_SYNC,
    conflictStrategy: ConflictResolutionStrategy.LAST_WRITE_WINS,
    fieldMappings: [
      { field: 'id', headerName: 'Notification ID', columnIndex: 0, dataType: 'string' },
      { field: 'title', headerName: 'Title', columnIndex: 1, dataType: 'string' },
      { field: 'message', headerName: 'Notification Message', columnIndex: 2, dataType: 'string' },
      { field: 'timestamp', headerName: 'Timestamp (ISO)', columnIndex: 3, dataType: 'string' },
      { field: 'read', headerName: 'Is Read', columnIndex: 4, dataType: 'boolean' },
      { field: 'type', headerName: 'Notification Type', columnIndex: 5, dataType: 'string' }
    ],
    validationRules: [
      { field: 'id', required: true },
      { field: 'title', required: true, min: 1, max: 200 },
      { field: 'message', required: true, min: 1, max: 2000 },
      { field: 'timestamp', required: true },
      { field: 'read', required: true },
      { field: 'type', required: true, enum: ['info', 'warning', 'success', 'error'] }
    ]
  },

  USER: {
    entityName: 'User',
    sheetName: 'Users',
    primaryKey: 'id',
    readRules: 'Authenticated internal directory access.',
    writeRules: 'Restricted entirely to CEO or AI Administrator role.',
    updateRules: 'Roles, profiles, and access states can only be mutated by administrators.',
    syncStrategy: SyncMode.MANUAL_SYNC,
    conflictStrategy: ConflictResolutionStrategy.OPTIMISTIC_LOCKING,
    fieldMappings: [
      { field: 'id', headerName: 'User/Executive ID', columnIndex: 0, dataType: 'string' },
      { field: 'name', headerName: 'Full Name', columnIndex: 1, dataType: 'string' },
      { field: 'email', headerName: 'Organizational Email', columnIndex: 2, dataType: 'string' },
      { field: 'role', headerName: 'Assigned Role', columnIndex: 3, dataType: 'string' },
      { field: 'avatarUrl', headerName: 'Avatar Profile URL', columnIndex: 4, dataType: 'string' }
    ],
    validationRules: [
      { field: 'id', required: true },
      { field: 'name', required: true, min: 2, max: 80 },
      { field: 'email', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      { field: 'role', required: true, enum: Object.values(UserRole) }
    ]
  },

  TRAINING: {
    entityName: 'Training',
    sheetName: 'Training_Logs',
    primaryKey: 'id',
    readRules: 'Trainers, executives, and managers can audit logs.',
    writeRules: 'Executives conducting system trainings on support modules.',
    updateRules: 'Log entries can be modified up to 48 hours following session completion.',
    syncStrategy: SyncMode.INCREMENTAL_SYNC,
    conflictStrategy: ConflictResolutionStrategy.LAST_WRITE_WINS,
    fieldMappings: [
      { field: 'id', headerName: 'Training ID', columnIndex: 0, dataType: 'string' },
      { field: 'topic', headerName: 'Training Topic', columnIndex: 1, dataType: 'string' },
      { field: 'date', headerName: 'Session Date', columnIndex: 2, dataType: 'string' },
      { field: 'durationMinutes', headerName: 'Duration in Minutes', columnIndex: 3, dataType: 'number' },
      { field: 'attendeesCount', headerName: 'Number of Attendees', columnIndex: 4, dataType: 'number' },
      { field: 'notes', headerName: 'Curriculum & Notes', columnIndex: 5, dataType: 'string' },
      { field: 'conductedBy', headerName: 'Conductor Name', columnIndex: 6, dataType: 'string' },
      { field: 'ticketId', headerName: 'Ticket ID Link', columnIndex: 7, dataType: 'string' }
    ],
    validationRules: [
      { field: 'id', required: true },
      { field: 'topic', required: true, min: 2, max: 150 },
      { field: 'date', required: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
      { field: 'durationMinutes', required: true, min: 5, max: 600 },
      { field: 'attendeesCount', required: true, min: 1, max: 200 },
      { field: 'conductedBy', required: true }
    ]
  },

  AUDIT_LOG: {
    entityName: 'Audit Log',
    sheetName: 'Audit_Logs',
    primaryKey: 'id',
    readRules: 'Managers, security leads, and organizational auditors only.',
    writeRules: 'System-triggered only. Append-only ledger.',
    updateRules: 'No edits, mutations, or deletions allowed (Immutable log integrity).',
    syncStrategy: SyncMode.RETRY_QUEUE,
    conflictStrategy: ConflictResolutionStrategy.LAST_WRITE_WINS, // Effectively append-only
    fieldMappings: [
      { field: 'id', headerName: 'Event ID', columnIndex: 0, dataType: 'string' },
      { field: 'type', headerName: 'Event Type', columnIndex: 1, dataType: 'string' },
      { field: 'timestamp', headerName: 'Occurred At (ISO)', columnIndex: 2, dataType: 'string' },
      { field: 'performedBy', headerName: 'Action Performed By', columnIndex: 3, dataType: 'string' },
      { field: 'notes', headerName: 'Audit Description', columnIndex: 4, dataType: 'string' },
      { field: 'ticketId', headerName: 'Connected Ticket ID', columnIndex: 5, dataType: 'string' },
      { field: 'clientId', headerName: 'Connected Client ID', columnIndex: 6, dataType: 'string' }
    ],
    validationRules: [
      { field: 'id', required: true },
      { field: 'type', required: true },
      { field: 'timestamp', required: true },
      { field: 'performedBy', required: true },
      { field: 'notes', required: true }
    ]
  },

  SETTINGS: {
    entityName: 'Settings',
    sheetName: 'Application_Settings',
    primaryKey: 'key',
    readRules: 'Loaded on application boot by any authenticated session.',
    writeRules: 'Restricted entirely to Support Managers and AI Administrators.',
    updateRules: 'Setting keys are immutable; only values are subject to update.',
    syncStrategy: SyncMode.FULL_SYNC,
    conflictStrategy: ConflictResolutionStrategy.MANUAL_REVIEW,
    fieldMappings: [
      { field: 'key', headerName: 'Config Key', columnIndex: 0, dataType: 'string' },
      { field: 'value', headerName: 'Config Value', columnIndex: 1, dataType: 'string' },
      { field: 'description', headerName: 'Config Description', columnIndex: 2, dataType: 'string' },
      { field: 'updatedBy', headerName: 'Last Updated By', columnIndex: 3, dataType: 'string' },
      { field: 'updatedAt', headerName: 'Updated Timestamp', columnIndex: 4, dataType: 'string' }
    ],
    validationRules: [
      { field: 'key', required: true, pattern: /^[A-Z_][A-Z0-9_]*$/ },
      { field: 'value', required: true },
      { field: 'description', required: true }
    ]
  }
};

/**
 * Centered Validator Engine
 * Executes schema-level validations defined inside the enterprise sheets contract.
 * Guarantees zero-duplication rules across views, routes, and controllers.
 */
export class CentralValidator {
  /**
   * Validates a record against the sheets contract schema.
   * Returns true if valid, or a string detailing validation failures if invalid.
   */
  public static validateRecord<T extends Record<string, any>>(entityKey: keyof typeof SHEETS_CONTRACT, data: T): true | string[] {
    const schema = SHEETS_CONTRACT[entityKey];
    if (!schema) {
      return [`Entity schema for key "${entityKey}" is not declared.`];
    }

    const errors: string[] = [];

    schema.validationRules.forEach((rule) => {
      const val = data[rule.field];

      // 1. Required Check
      if (rule.required && (val === undefined || val === null || val === '')) {
        errors.push(`Field "${rule.field}" is required in schema "${schema.entityName}".`);
        return;
      }

      // If value is empty and not required, pass
      if (val === undefined || val === null || val === '') {
        return;
      }

      // 2. Pattern (Regex) Check
      if (rule.pattern && !rule.pattern.test(String(val))) {
        errors.push(`Field "${rule.field}" value "${val}" violates required pattern in schema "${schema.entityName}".`);
      }

      // 3. Min check
      if (rule.min !== undefined) {
        if (typeof val === 'number' && val < rule.min) {
          errors.push(`Field "${rule.field}" is below minimum value of ${rule.min}.`);
        } else if (typeof val === 'string' && val.length < rule.min) {
          errors.push(`Field "${rule.field}" length is below minimum of ${rule.min} characters.`);
        }
      }

      // 4. Max check
      if (rule.max !== undefined) {
        if (typeof val === 'number' && val > rule.max) {
          errors.push(`Field "${rule.field}" is above maximum value of ${rule.max}.`);
        } else if (typeof val === 'string' && val.length > rule.max) {
          errors.push(`Field "${rule.field}" length exceeds maximum of ${rule.max} characters.`);
        }
      }

      // 5. Enum check
      if (rule.enum && !rule.enum.includes(String(val))) {
        errors.push(`Field "${rule.field}" value "${val}" is not member of permitted enum [${rule.enum.join(', ')}].`);
      }

      // 6. Custom logic check
      if (rule.custom) {
        const customRes = rule.custom(val);
        if (typeof customRes === 'string') {
          errors.push(`Custom validation error on field "${rule.field}": ${customRes}`);
        } else if (!customRes) {
          errors.push(`Custom validation constraint violated on field "${rule.field}".`);
        }
      }
    });

    return errors.length === 0 ? true : errors;
  }
}

/**
 * Configurable Mapping Adapter Layer
 * Transforms a strongly-typed local TEDOS entity into a sorted cell value row
 * based completely on dynamic contract definitions, with no hardcoded letters.
 */
export class SheetsMappingAdapter {
  /**
   * Translates a record object into an ordered array ready for batch update in Sheets.
   */
  public static recordToRow<T extends Record<string, any>>(entityKey: keyof typeof SHEETS_CONTRACT, data: T): any[] {
    const schema = SHEETS_CONTRACT[entityKey];
    if (!schema) return [];

    // Sort mappings strictly by columnIndex to guarantee correct row order
    const sortedMappings = [...schema.fieldMappings].sort((a, b) => a.columnIndex - b.columnIndex);
    
    // Create pre-allocated array matching the size of the mapping headers
    const rowData: any[] = new Array(sortedMappings.length).fill('');

    sortedMappings.forEach((mapping) => {
      const value = data[mapping.field];
      if (value !== undefined && value !== null) {
        if (mapping.dataType === 'json') {
          rowData[mapping.columnIndex] = JSON.stringify(value);
        } else {
          rowData[mapping.columnIndex] = value;
        }
      }
    });

    return rowData;
  }

  /**
   * Translates an ordered cell row from Google Sheets back into a strongly-typed TypeScript entity.
   */
  public static rowToRecord<T extends Record<string, any>>(entityKey: keyof typeof SHEETS_CONTRACT, row: any[]): T {
    const schema = SHEETS_CONTRACT[entityKey];
    const record: Record<string, any> = {};

    if (!schema) return record as T;

    schema.fieldMappings.forEach((mapping) => {
      const cellValue = row[mapping.columnIndex];
      if (cellValue === undefined || cellValue === null || cellValue === '') {
        record[mapping.field] = undefined;
        return;
      }

      // Cast based on contract metadata
      switch (mapping.dataType) {
        case 'number':
          record[mapping.field] = Number(cellValue);
          break;
        case 'boolean':
          record[mapping.field] = String(cellValue).toLowerCase() === 'true' || cellValue === true;
          break;
        case 'json':
          try {
            record[mapping.field] = JSON.parse(String(cellValue));
          } catch {
            record[mapping.field] = cellValue;
          }
          break;
        default:
          record[mapping.field] = String(cellValue);
      }
    });

    return record as T;
  }
}

/**
 * FUTURE INTERFACE CONTRACT FOR EXTENDIBILITY
 * 
 * Demonstrates compliance with the constraint:
 * "The contract must support replacing Google Sheets with SQL or Cloud databases without changing business modules."
 * 
 * By referencing this data access interface, business layers interact with a pure data-provider,
 * allowing sheets-provider.ts to be hot-swapped for postgresql-provider.ts or firestore-provider.ts.
 */
export interface ITedosRepositoryContract<T extends { id: string }> {
  /**
   * Retrieve single record by primary ID
   */
  getById(id: string): Promise<T | null>;

  /**
   * Search and filter records based on criteria
   */
  find(query: Partial<T>): Promise<T[]>;

  /**
   * Create new record. Validates through CentralValidator before persistent insertion.
   */
  create(record: T): Promise<T>;

  /**
   * Update existing record. Resolves conflicts using target conflict strategy.
   */
  update(id: string, record: Partial<T>): Promise<T>;

  /**
   * Batch synchronization function
   */
  sync(mode: SyncMode, strategy: ConflictResolutionStrategy): Promise<{
    syncedCount: number;
    failedCount: number;
    conflictedRecords: T[];
  }>;
}
