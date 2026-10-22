/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole } from '../types';

/**
 * Enterprise Application Permissions
 * Standardized system actions governed by the Role-Based Access Control (RBAC) engine.
 */
export enum AppPermission {
  // Module View Permissions
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
  VIEW_CLIENTS = 'VIEW_CLIENTS',
  VIEW_WORK_LOGS = 'VIEW_WORK_LOGS',
  VIEW_FOLLOW_UPS = 'VIEW_FOLLOW_UPS',
  VIEW_REPORTS = 'VIEW_REPORTS',
  VIEW_AI_ASSISTANT = 'VIEW_AI_ASSISTANT',
  VIEW_SETTINGS = 'VIEW_SETTINGS',
  VIEW_WHATSAPP = 'VIEW_WHATSAPP',

  // Administrative / Mutation Actions
  EDIT_CLIENTS = 'EDIT_CLIENTS',
  WRITE_WORK_LOGS = 'WRITE_WORK_LOGS',
  EDIT_FOLLOW_UPS = 'EDIT_FOLLOW_UPS',
  SEND_WHATSAPP = 'SEND_WHATSAPP',
  ACCESS_FINANCIALS = 'ACCESS_FINANCIALS',
  EDIT_SETTINGS = 'EDIT_SETTINGS',
  AUDIT_LOG_CLEAR = 'AUDIT_LOG_CLEAR',
}

/**
 * Role-Based Access Control (RBAC) Decoupled Mapping
 * Configures the permissions matrix for each of the 9 system roles.
 */
export const ROLE_PERMISSIONS_MAP: Record<UserRole, AppPermission[]> = {
  [UserRole.CEO]: [
    AppPermission.VIEW_DASHBOARD,
    AppPermission.VIEW_CLIENTS,
    AppPermission.VIEW_WORK_LOGS,
    AppPermission.VIEW_FOLLOW_UPS,
    AppPermission.VIEW_REPORTS,
    AppPermission.VIEW_AI_ASSISTANT,
    AppPermission.VIEW_SETTINGS,
    AppPermission.VIEW_WHATSAPP,
    AppPermission.ACCESS_FINANCIALS,
  ],
  [UserRole.COO]: [
    AppPermission.VIEW_DASHBOARD,
    AppPermission.VIEW_CLIENTS,
    AppPermission.VIEW_WORK_LOGS,
    AppPermission.VIEW_FOLLOW_UPS,
    AppPermission.VIEW_REPORTS,
    AppPermission.VIEW_AI_ASSISTANT,
    AppPermission.VIEW_SETTINGS,
    AppPermission.VIEW_WHATSAPP,
    AppPermission.EDIT_CLIENTS,
    AppPermission.EDIT_FOLLOW_UPS,
    AppPermission.ACCESS_FINANCIALS,
  ],
  [UserRole.OPERATION_MANAGER]: [
    AppPermission.VIEW_DASHBOARD,
    AppPermission.VIEW_CLIENTS,
    AppPermission.VIEW_WORK_LOGS,
    AppPermission.VIEW_FOLLOW_UPS,
    AppPermission.VIEW_REPORTS,
    AppPermission.VIEW_AI_ASSISTANT,
    AppPermission.VIEW_WHATSAPP,
    AppPermission.EDIT_CLIENTS,
    AppPermission.WRITE_WORK_LOGS,
    AppPermission.EDIT_FOLLOW_UPS,
    AppPermission.SEND_WHATSAPP,
  ],
  [UserRole.SUPPORT_MANAGER]: [
    AppPermission.VIEW_DASHBOARD,
    AppPermission.VIEW_CLIENTS,
    AppPermission.VIEW_WORK_LOGS,
    AppPermission.VIEW_FOLLOW_UPS,
    AppPermission.VIEW_AI_ASSISTANT,
    AppPermission.VIEW_WHATSAPP,
    AppPermission.EDIT_CLIENTS,
    AppPermission.WRITE_WORK_LOGS,
    AppPermission.EDIT_FOLLOW_UPS,
    AppPermission.SEND_WHATSAPP,
  ],
  [UserRole.SUPPORT_EXECUTIVE]: [
    AppPermission.VIEW_DASHBOARD,
    AppPermission.VIEW_CLIENTS,
    AppPermission.VIEW_WORK_LOGS,
    AppPermission.VIEW_FOLLOW_UPS,
    AppPermission.VIEW_WHATSAPP,
    AppPermission.WRITE_WORK_LOGS,
    AppPermission.SEND_WHATSAPP,
  ],
  [UserRole.MARKETING_EXECUTIVE]: [
    AppPermission.VIEW_DASHBOARD,
    AppPermission.VIEW_CLIENTS,
    AppPermission.VIEW_REPORTS,
    AppPermission.VIEW_WHATSAPP,
    AppPermission.SEND_WHATSAPP,
  ],
  [UserRole.FRANCHISE_COORDINATOR]: [
    AppPermission.VIEW_DASHBOARD,
    AppPermission.VIEW_CLIENTS,
    AppPermission.VIEW_FOLLOW_UPS,
    AppPermission.EDIT_FOLLOW_UPS,
  ],
  [UserRole.TECHNICAL_TEAM]: [
    AppPermission.VIEW_DASHBOARD,
    AppPermission.VIEW_CLIENTS,
    AppPermission.VIEW_SETTINGS,
    AppPermission.VIEW_AI_ASSISTANT,
    AppPermission.EDIT_CLIENTS,
    AppPermission.EDIT_SETTINGS,
  ],
  [UserRole.FINANCE]: [
    AppPermission.VIEW_DASHBOARD,
    AppPermission.VIEW_REPORTS,
    AppPermission.ACCESS_FINANCIALS,
  ],
  [UserRole.AI_ADMINISTRATOR]: [
    AppPermission.VIEW_DASHBOARD,
    AppPermission.VIEW_CLIENTS,
    AppPermission.VIEW_AI_ASSISTANT,
    AppPermission.VIEW_SETTINGS,
    AppPermission.EDIT_SETTINGS,
  ],
  [UserRole.DIRECTOR]: [
    AppPermission.VIEW_DASHBOARD,
    AppPermission.VIEW_CLIENTS,
    AppPermission.VIEW_WORK_LOGS,
    AppPermission.VIEW_FOLLOW_UPS,
    AppPermission.VIEW_REPORTS,
    AppPermission.VIEW_AI_ASSISTANT,
    AppPermission.VIEW_SETTINGS,
    AppPermission.VIEW_WHATSAPP,
    AppPermission.EDIT_CLIENTS,
    AppPermission.EDIT_FOLLOW_UPS,
    AppPermission.ACCESS_FINANCIALS,
  ],
};

/**
 * Validation Engine helper checks
 * Returns true if a given role is permitted to perform a specified permission.
 */
export const checkRolePermission = (role: UserRole | undefined, permission: AppPermission): boolean => {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS_MAP[role];
  return permissions ? permissions.includes(permission) : false;
};
