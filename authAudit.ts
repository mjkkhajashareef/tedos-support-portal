/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, UserRole } from '../types';
import { Logger } from './helpers';

export type AuthAuditEventType = 'LOGIN' | 'LOGOUT' | 'PERMISSION_DENIED' | 'SESSION_EXPIRED';

export interface DeviceMetadata {
  userAgent: string;
  platform: string;
  screenResolution: string;
  language: string;
  isTouchDevice: boolean;
  viewportSize: string;
}

export interface AuthAuditEvent {
  id: string;
  eventType: AuthAuditEventType;
  timestamp: string; // ISO 8601
  user: Omit<User, 'avatarUrl'> | null;
  device: DeviceMetadata;
  details?: string;
  targetPermission?: string;
}

/**
 * Retrieve current client-side device and browser metadata
 */
export const getDeviceMetadata = (): DeviceMetadata => {
  if (typeof window === 'undefined') {
    return {
      userAgent: 'server-side',
      platform: 'unknown',
      screenResolution: '0x0',
      language: 'unknown',
      isTouchDevice: false,
      viewportSize: '0x0',
    };
  }

  return {
    userAgent: navigator.userAgent || 'unknown',
    platform: (navigator as any).userAgentData?.platform || navigator.platform || 'unknown',
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language || 'en-US',
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
  };
};

/**
 * Enterprise Audit Hooks Engine
 * Standardized hooks to log, format, and cache security-sensitive authentication events.
 */
export const AuthAudit = {
  /**
   * Dispatches and persists an audit event
   */
  logEvent: (eventType: AuthAuditEventType, user: User | null, details?: string, targetPermission?: string): AuthAuditEvent => {
    const formattedUser = user ? { 
      id: user.id, 
      employeeId: user.employeeId,
      name: user.name, 
      email: user.email, 
      mobile: user.mobile,
      role: user.role,
      department: user.department,
      designation: user.designation,
      reportingManager: user.reportingManager,
      assignedRegion: user.assignedRegion,
      assignedClients: user.assignedClients,
      status: user.status,
      joiningDate: user.joiningDate,
      lastLogin: user.lastLogin,
      active: user.active
    } : null;
    
    const event: AuthAuditEvent = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      eventType,
      timestamp: new Date().toISOString(),
      user: formattedUser,
      device: getDeviceMetadata(),
      details,
      targetPermission,
    };

    // Format logs with distinct security tags
    const logPrefix = `[SECURITY_AUDIT:${eventType}]`;
    const userString = user ? `${user.name} (${user.role})` : 'Anonymous';
    Logger.info(logPrefix, `${userString} - ${details || 'No additional context.'}`, {
      targetPermission,
      device: event.device.platform,
    });

    // Persist event trace in local cache for future diagnostics
    if (typeof window !== 'undefined') {
      try {
        const existingLogsRaw = localStorage.getItem('tedos_auth_audit_trail');
        const logs: AuthAuditEvent[] = existingLogsRaw ? JSON.parse(existingLogsRaw) : [];
        
        // Push and truncate to keep only the latest 100 entries (avoid storage leak)
        logs.unshift(event);
        localStorage.setItem('tedos_auth_audit_trail', JSON.stringify(logs.slice(0, 100)));

        // Dispatch a custom security event for real-time log viewers
        const customEvent = new CustomEvent('tedos-security-audit', { detail: event });
        window.dispatchEvent(customEvent);
      } catch (err) {
        Logger.error('AuthAudit.logEvent', 'Failed to persist security log in local storage', err);
      }
    }

    return event;
  },

  /**
   * Specific Hook: Trigger on successful User Login
   */
  onLogin: (user: User, method: string = 'Role Selector'): AuthAuditEvent => {
    return AuthAudit.logEvent('LOGIN', user, `User authenticated via ${method}.`);
  },

  /**
   * Specific Hook: Trigger on explicit User Logout
   */
  onLogout: (user: User | null): AuthAuditEvent => {
    return AuthAudit.logEvent('LOGOUT', user, 'Session closed by operator request.');
  },

  /**
   * Specific Hook: Trigger on Role access blockage
   */
  onPermissionDenied: (user: User | null, permission: string, moduleName: string): AuthAuditEvent => {
    return AuthAudit.logEvent(
      'PERMISSION_DENIED',
      user,
      `Access blocked to module [${moduleName}]. Requested permission was [${permission}].`,
      permission
    );
  },

  /**
   * Specific Hook: Trigger on session idle expiry
   */
  onSessionExpired: (user: User | null, idleDurationMs: number): AuthAuditEvent => {
    const minStr = Math.round(idleDurationMs / 60000);
    return AuthAudit.logEvent(
      'SESSION_EXPIRED',
      user,
      `Session automatically terminated due to system inactivity exceeding ${minStr} minutes.`
    );
  },

  /**
   * Retrieve the current cached audit trails
   */
  getTrail: (): AuthAuditEvent[] => {
    if (typeof window === 'undefined') return [];
    try {
      const logsRaw = localStorage.getItem('tedos_auth_audit_trail');
      return logsRaw ? JSON.parse(logsRaw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Clear the local diagnostic audit trails (requires security validation)
   */
  clearTrail: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tedos_auth_audit_trail');
      Logger.warn('[SECURITY_AUDIT:CLEAR]', 'Audit logs cleared by command.');
    }
  }
};
