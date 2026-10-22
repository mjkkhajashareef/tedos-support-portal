/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService } from '../utils/auth';
import { User, UserRole, UserStatus, Session } from '../types';
import { AppPermission, checkRolePermission, ROLE_PERMISSIONS_MAP } from '../config/permissions';
import { ACTIVE_CONFIG } from '../config/appConfig';
import { AuthAudit } from '../utils/authAudit';
import { Logger } from '../utils/helpers';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  activeRole: UserRole | null;
  permissions: AppPermission[];
  sessionExpirationTime: string | null;
  sessionTimeRemaining: number; // in seconds
  deviceFingerprint: string;
  isIdle: boolean;
  login: (role: UserRole, rememberMe?: boolean) => Promise<void>;
  loginWithUser: (user: User, rememberMe?: boolean) => Promise<void>;
  logout: (reason?: 'user_request' | 'timeout') => Promise<void>;
  hasPermission: (permission: AppPermission) => boolean;
  isAuthorized: (requiredPermissions: AppPermission[], requireAll?: boolean) => boolean;
  resetSessionTimeout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generate or retrieve a persistent device fingerprint for session audits
const getOrCreateDeviceFingerprint = (): string => {
  if (typeof window === 'undefined') return 'server-fingerprint';
  
  let fingerprint = localStorage.getItem('tedos_device_fingerprint');
  if (!fingerprint) {
    fingerprint = `dev-${Date.now()}-${Math.floor(Math.random() * 100000000).toString(36)}`;
    localStorage.setItem('tedos_device_fingerprint', fingerprint);
  }
  return fingerprint;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionExpirationTime, setSessionExpirationTime] = useState<string | null>(null);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number>(0);
  const [isIdle, setIsIdle] = useState<boolean>(false);
  const [deviceFingerprint] = useState<string>(getOrCreateDeviceFingerprint);

  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const expirationMin = ACTIVE_CONFIG.security.tokenExpirationMin;
  const expirationMs = expirationMin * 60 * 1000;

  // 1. Auto Session Restore on Startup
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const session = authService.getSession();
    
    if (session) {
      const expirationTimestamp = session.tokens.expiresAt;
      const lastActivityTimestamp = parseInt(localStorage.getItem('tedos_last_activity') || '0', 10);
      const currentTime = Date.now();

      // Check if session is still valid both on token expiration and inactivity thresholds
      if (currentTime < expirationTimestamp && (currentTime - lastActivityTimestamp) < expirationMs) {
        setCurrentUser(session.user);
        setSessionExpirationTime(new Date(expirationTimestamp).toISOString());
        lastActivityRef.current = lastActivityTimestamp;
        
        Logger.info('[AUTH_INIT]', `Session restored for user ${session.user.name} (${session.user.role})`);
      } else {
        // Session expired while app was closed
        authService.clearSession();
        clearSessionStorage();
        Logger.info('[AUTH_INIT]', 'Cached session was expired, cleared.');
      }
    }
  }, []);

  // 2. Cross-tab session state synchronization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tedos_user') {
        if (!e.newValue) {
          // Logged out in another tab
          setCurrentUser(null);
          setSessionExpirationTime(null);
          setSessionTimeRemaining(0);
          Logger.info('[SESSION_SYNC]', 'Logout detected in another browser tab, syncing.');
        } else {
          // Logged in another tab
          try {
            const user: User = JSON.parse(e.newValue);
            setCurrentUser(user);
            
            const expires = localStorage.getItem('tedos_session_expires');
            if (expires) {
              setSessionExpirationTime(new Date(parseInt(expires, 10)).toISOString());
            }
            Logger.info('[SESSION_SYNC]', `Login detected in another browser tab, syncing user ${user.name}.`);
          } catch {
            // Ignore corrupted storage in handler
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Helper to clear standard session storage items
  const clearSessionStorage = () => {
    localStorage.removeItem('tedos_user');
    localStorage.removeItem('tedos_session_expires');
    localStorage.removeItem('tedos_last_activity');
  };

  // 3. Activity Tracker & Inactivity Timer
  const resetSessionTimeout = () => {
    lastActivityRef.current = Date.now();
    localStorage.setItem('tedos_last_activity', lastActivityRef.current.toString());
    setIsIdle(false);
  };

  // Setup user interaction event listeners to detect active user state
  useEffect(() => {
    if (typeof window === 'undefined' || !currentUser) return;

    const updateActivity = () => {
      resetSessionTimeout();
    };

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    activityEvents.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Run active tick monitoring
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const lastActivity = lastActivityRef.current;
      const idleDuration = now - lastActivity;

      // Session timeout check
      if (idleDuration >= expirationMs) {
        Logger.warn('[SESSION_MANAGER]', `Idle limit exceeded (${expirationMin} mins). Executing auto-logout.`);
        logout('timeout');
      } else {
        // Calculate remaining seconds
        const secondsRemaining = Math.max(0, Math.ceil((expirationMs - idleDuration) / 1000));
        setSessionTimeRemaining(secondsRemaining);

        // Mark as idle if half of the expiration time has elapsed without interactions
        if (idleDuration >= (expirationMs / 2)) {
          setIsIdle(true);
        } else {
          setIsIdle(false);
        }
      }
    }, 1000);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentUser]);

  // 4. Centralized Authentication Core
  const login = async (role: UserRole, rememberMe: boolean = false): Promise<void> => {
    // Standard names map matching configuration specs
    const names: Record<UserRole, string> = {
      [UserRole.CEO]: 'Chief Executive Officer',
      [UserRole.COO]: 'Mohammed Khaja Shareef',
      [UserRole.DIRECTOR]: 'Philsof Admin',
      [UserRole.OPERATION_MANAGER]: 'Operation Manager',
      [UserRole.SUPPORT_MANAGER]: 'Syed (Support Manager)',
      [UserRole.SUPPORT_EXECUTIVE]: 'Asad',
      [UserRole.MARKETING_EXECUTIVE]: 'Marketing Lead',
      [UserRole.FRANCHISE_COORDINATOR]: 'Franchise Coordinator',
      [UserRole.TECHNICAL_TEAM]: 'Technical Support',
      [UserRole.FINANCE]: 'Finance Manager',
      [UserRole.AI_ADMINISTRATOR]: 'System Admin',
    };

    const mobiles: Record<UserRole, string> = {
      [UserRole.CEO]: '9999999999',
      [UserRole.COO]: '9160633333',
      [UserRole.DIRECTOR]: '9394419813',
      [UserRole.OPERATION_MANAGER]: '9100000004',
      [UserRole.SUPPORT_MANAGER]: '9100000003',
      [UserRole.SUPPORT_EXECUTIVE]: '9100000101',
      [UserRole.MARKETING_EXECUTIVE]: '9000000003',
      [UserRole.FRANCHISE_COORDINATOR]: '9000000004',
      [UserRole.TECHNICAL_TEAM]: '9000000005',
      [UserRole.FINANCE]: '9000000006',
      [UserRole.AI_ADMINISTRATOR]: '9000000007',
    };

    const isDirectorOrAdmin = role === UserRole.DIRECTOR || role === UserRole.COO;
    const userEmail = isDirectorOrAdmin ? 'support@philsof.com' : `${role.toLowerCase().replace(/\s+/g, '')}@technoevident.com`;

    const user: User = {
      id: `usr-${role.toLowerCase().replace(/\s+/g, '-')}`,
      employeeId: `EMP-${Date.now().toString().slice(-4)}`,
      name: names[role] || 'Enterprise Staff',
      email: userEmail,
      mobile: mobiles[role] || '9999999999',
      role,
      department: 'Support',
      reportingManager: 'Vikas Kumar',
      assignedRegion: 'Global',
      assignedClients: [],
      designation: 'Staff',
      status: UserStatus.ACTIVE,
      joiningDate: new Date().toISOString().split('T')[0],
      lastLogin: new Date().toISOString(),
      active: true,
    };

    const now = Date.now();
    const expirationTimestamp = now + expirationMs;

    const session: Session = {
      user,
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: expirationTimestamp,
      },
      rememberMe,
    };

    setCurrentUser(user);
    setSessionExpirationTime(new Date(expirationTimestamp).toISOString());
    setSessionTimeRemaining(expirationMin * 60);
    lastActivityRef.current = now;

    // Cache parameters to storage via authService
    authService.saveSession(session);
    localStorage.setItem('tedos_session_expires', expirationTimestamp.toString());
    localStorage.setItem('tedos_last_activity', now.toString());

    // Security logging hooks
    AuthAudit.onLogin(user);
  };

  const loginWithUser = async (user: User, rememberMe: boolean = true): Promise<void> => {
    const now = Date.now();
    const expirationTimestamp = now + expirationMs;

    const session: Session = {
      user,
      tokens: {
        accessToken: `tedos-token-${Date.now()}`,
        refreshToken: `tedos-refresh-${Date.now()}`,
        expiresAt: expirationTimestamp,
      },
      rememberMe,
    };

    setCurrentUser(user);
    setSessionExpirationTime(new Date(expirationTimestamp).toISOString());
    setSessionTimeRemaining(expirationMin * 60);
    lastActivityRef.current = now;

    authService.saveSession(session);
    localStorage.setItem('tedos_session_expires', expirationTimestamp.toString());
    localStorage.setItem('tedos_last_activity', now.toString());

    AuthAudit.onLogin(user);
  };

  const logout = async (reason: 'user_request' | 'timeout' = 'user_request'): Promise<void> => {
    const prevUser = currentUser;
    setCurrentUser(null);
    setSessionExpirationTime(null);
    setSessionTimeRemaining(0);
    setIsIdle(false);
    authService.clearSession();
    clearSessionStorage();

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (prevUser) {
      if (reason === 'timeout') {
        const idleDurationMs = Date.now() - lastActivityRef.current;
        AuthAudit.onSessionExpired(prevUser, idleDurationMs);
      } else {
        AuthAudit.onLogout(prevUser);
      }
    }
  };

  // 5. RBAC Permission Engine Hooks
  const hasPermission = (permission: AppPermission): boolean => {
    if (!currentUser) return false;
    return checkRolePermission(currentUser.role, permission);
  };

  const isAuthorized = (requiredPermissions: AppPermission[], requireAll = true): boolean => {
    if (!currentUser) return false;
    if (requiredPermissions.length === 0) return true;

    if (requireAll) {
      return requiredPermissions.every((perm) => hasPermission(perm));
    } else {
      return requiredPermissions.some((perm) => hasPermission(perm));
    }
  };

  const activeRole = currentUser ? currentUser.role : null;
  const permissions = activeRole ? ROLE_PERMISSIONS_MAP[activeRole] : [];

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        activeRole,
        permissions,
        sessionExpirationTime,
        sessionTimeRemaining,
        deviceFingerprint,
        isIdle,
        login,
        loginWithUser,
        logout,
        hasPermission,
        isAuthorized,
        resetSessionTimeout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
