/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole } from '../types';

/**
 * TEDOS Global Reusable System Constants
 */

// Support Client Workspace Health Ratings
export enum ClientHealthStatus {
  EXCELLENT = 'Excellent',
  STABLE = 'Stable',
  WARNING = 'Warning',
  CRITICAL = 'Critical',
}

// Google Sheet Tab Mappings
export const GOOGLE_SHEETS_TABS = {
  CLIENT_WORKSPACES: 'Client_Workspaces_Telemetry',
  DAILY_WORK_LOGS: 'Daily_Work_Logs',
  FOLLOW_UP_TRACKER: 'Follow_Up_Tracker',
  TRAINING_LOG: 'Training_Log',
  WHATSAPP_OUTBOX: 'WhatsApp_Outbox',
  KPI_DASHBOARD: 'KPI_Dashboard_Live',
  SYSTEM_AUDIT_LOGS: 'System_Audit_Logs',
};

// Error Messages Registry (Uniform Client Feedback)
export const SYSTEM_ERRORS = {
  UNAUTHORIZED: 'Security check failed. You do not have permission to execute this operation.',
  EXPIRED_SESSION: 'Your secure session has expired. Please authenticate again.',
  NETWORK_TIMEOUT: 'The remote Google Sheets database connector timed out. Retrying sync...',
  INVALID_PHONE: 'The phone number provided does not comply with international E.164 standards.',
  SCHEMA_MISMATCH: 'Sheet column schema mismatch detected. Please run the Sheet Alignment tool.',
  AI_DISPATCH_FAILED: 'AI Copilot inference stream failed. Using offline local analytics fallback.',
  REQUIRED_FIELD_MISSING: 'This action cannot be completed because a mandatory field is missing.',
};

// Success Messages Registry
export const SYSTEM_SUCCESS = {
  LOGIN: 'Identity authenticated. Launching TEDOS secure environment.',
  SYNC: 'Database successfully aligned. Local cache synchronized with Google Sheets.',
  RECORD_CREATED: 'Log entry committed and locked in Sheet journal.',
  OUTREACH_SCHEDULED: 'Outreach task scheduled and synced with WhatsApp dispatcher.',
};

// Validation Boundaries
export const VALIDATION_LIMITS = {
  MIN_COMPANY_NAME: 2,
  MAX_COMPANY_NAME: 100,
  MAX_WORK_LOG_LENGTH: 2000,
  MIN_PASSWORD_LENGTH: 6,
  MAX_DAILY_SYNC_ATTEMPTS: 25,
};

// System Health Limits
export const HEALTH_THRESHOLDS = {
  CRITICAL: 35,
  WARNING: 65,
  STABLE: 85,
};
