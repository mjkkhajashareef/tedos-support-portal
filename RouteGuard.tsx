/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ShieldAlert, RefreshCw, ChevronLeft, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { AppPermission } from '../../config/permissions';
import { ModuleId } from '../../types';
import { AuthAudit } from '../../utils/authAudit';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermission: AppPermission;
  moduleName: string;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children, requiredPermission, moduleName }) => {
  const { hasPermission, currentUser, deviceFingerprint } = useAuth();
  const { setCurrentModule, config } = useApp();

  const isAuthorized = hasPermission(requiredPermission);

  // Trigger the permission denial security audit hook exactly once on mount when unauthorized
  useEffect(() => {
    if (!isAuthorized) {
      AuthAudit.onPermissionDenied(currentUser, requiredPermission, moduleName);
    }
  }, [isAuthorized, currentUser, requiredPermission, moduleName]);

  if (isAuthorized) {
    return <>{children}</>;
  }

  return (
    <div
      id={`route-guard-denied-${requiredPermission.toLowerCase()}`}
      className="max-w-xl mx-auto my-8 p-6 sm:p-8 bg-md-surface rounded-3xl border border-md-outline/10 shadow-xl shadow-red-950/5 animate-slide-up"
    >
      {/* Visual Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4 border border-red-500/20">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-md-on-background">
          Access Authorization Blocked
        </h2>
        <p className="text-xs text-md-on-surface-variant mt-1.5 leading-relaxed max-w-md">
          The requested security boundary [<strong>{moduleName}</strong>] is restricted. Your authenticated role profile is not authorized to access this module.
        </p>
      </div>

      {/* Technical Audit Trace Box */}
      <div className="bg-md-surface-variant/40 rounded-2xl p-4 border border-md-outline/5 font-mono text-xs text-md-on-surface-variant mb-6 space-y-2">
        <div className="text-xs border-b border-md-outline/10 pb-2 mb-2 font-bold tracking-wider uppercase text-md-outline">
          Security Incident Telemetry
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-md-outline">Operator ID:</span>
          <span className="font-semibold text-md-on-surface-variant">{currentUser?.id || 'anonymous'}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-md-outline">Operator Name:</span>
          <span className="font-semibold text-md-on-surface-variant">{currentUser?.name || 'Guest'}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-md-outline">Assigned Role:</span>
          <span className="px-2 py-0.5 rounded bg-md-primary/10 text-md-primary text-[10px] font-bold">
            {currentUser?.role || 'Guest'}
          </span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-md-outline">Required Permission:</span>
          <span className="font-semibold text-red-400 select-all">{requiredPermission}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-md-outline">Device Identifier:</span>
          <span className="font-semibold select-all truncate max-w-[200px] text-right">{deviceFingerprint}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-md-outline">Timestamp (UTC):</span>
          <span className="font-semibold">{new Date().toISOString()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          id="guard-back-dashboard-btn"
          onClick={() => setCurrentModule(ModuleId.DASHBOARD)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-md-surface-variant text-md-on-surface-variant hover:bg-md-surface-variant/80 transition-colors font-medium text-sm border border-md-outline/10 cursor-pointer"
        >
          <ChevronLeft size={16} />
          Return to Dashboard
        </button>
        <button
          id="guard-switch-operator-btn"
          onClick={() => setCurrentModule(ModuleId.LOGIN)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-md-primary text-md-on-primary hover:bg-md-primary/90 transition-colors font-medium text-sm cursor-pointer shadow-lg shadow-md-primary/10"
        >
          <RefreshCw size={14} className="animate-spin-hover" />
          Switch Operator
        </button>
      </div>

      {/* Info Footer */}
      <div className="mt-6 pt-4 border-t border-md-outline/5 text-center flex items-center justify-center gap-1 text-[11px] text-md-outline">
        <HelpCircle size={12} />
        <span>Need higher elevation? Contact tech desk at <strong>{config.app.supportEmail}</strong></span>
      </div>
    </div>
  );
};
