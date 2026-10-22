/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppPermission } from '../../config/permissions';
import { Logger } from '../../utils/helpers';

interface AuthorizedProps {
  children: React.ReactNode;
  permission?: AppPermission | AppPermission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Declarative Authorization Component
 * Conditionally renders children nodes based on the operator's current active role permissions.
 */
export const Authorized: React.FC<AuthorizedProps> = ({
  children,
  permission,
  requireAll = true,
  fallback = null,
}) => {
  const { isAuthorized, hasPermission } = useAuth();

  if (!permission) {
    return <>{children}</>;
  }

  const permissionsArray = Array.isArray(permission) ? permission : [permission];

  const allowed = isAuthorized(permissionsArray, requireAll);

  if (allowed) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

/**
 * Authorization Middleware Helper for click actions or callbacks
 * Wraps any function with an RBAC permission check.
 */
export const withAuthorization = <T extends (...args: any[]) => any>(
  actionFn: T,
  permission: AppPermission,
  hasPermissionFn: (perm: AppPermission) => boolean,
  onDenied?: () => void
): ((...args: Parameters<T>) => ReturnType<T> | void) => {
  return (...args: Parameters<T>): ReturnType<T> | void => {
    if (hasPermissionFn(permission)) {
      return actionFn(...args);
    } else {
      if (onDenied) {
        onDenied();
      } else {
        Logger.warn('[AUTH_MIDDLEWARE]', `Action blocked: Missing required permission [${permission}].`);
      }
    }
  };
};
