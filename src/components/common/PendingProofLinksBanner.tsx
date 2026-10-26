/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Clock,
  ChevronDown,
  ChevronUp,
  Link2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkLogEntry, UserRole } from '../../types';
import { isValidProofLink } from '../../utils/helpers';

interface PendingProofLinksBannerProps {
  className?: string;
  onOpenModal?: () => void;
}

export const PendingProofLinksBanner: React.FC<PendingProofLinksBannerProps> = ({
  className = '',
  onOpenModal
}) => {
  const { workLogs, tickets, updateWorkLogProofLink, language, currentUser } = useApp();
  const isUrdu = language === 'ur';
  const isSupportExecutive = currentUser?.role === UserRole.SUPPORT_EXECUTIVE;
  const currentExecName = (currentUser?.name || '').trim().toLowerCase();

  const [isExpanded, setIsExpanded] = useState(false);
  const [inputUrls, setInputUrls] = useState<Record<string, string>>({});
  const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({});
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
  const [successIds, setSuccessIds] = useState<Record<string, boolean>>({});

  // Deduplicate and filter pending logs
  const allLogsFromTickets = tickets.flatMap((t) => t.workLogs || []);
  const combinedLogsMap = new Map<string, WorkLogEntry>();

  [...workLogs, ...allLogsFromTickets].forEach((log) => {
    if (log && log.id && !combinedLogsMap.has(log.id)) {
      combinedLogsMap.set(log.id, log);
    }
  });

  const pendingLogs = Array.from(combinedLogsMap.values()).filter((log) => {
    if (successIds[log.id]) return false;
    // If manager already approved or marked resolved, no longer pending
    if (log.approvalStatus === 'Approved') return false;
    if (log.proofLink && (log.proofLink.includes('Approved') || log.proofLink.includes('Done') || log.proofLink.includes('OK'))) return false;

    // Support Executive data isolation: only show their own pending logs
    if (isSupportExecutive && currentExecName) {
      const logExec = (log.executiveName || (log as any).supportName || '').trim().toLowerCase();
      if (!logExec.includes(currentExecName) && !currentExecName.includes(logExec)) {
        return false;
      }
    }

    const duration = Number(log.durationMinutes) || 0;
    // Rule: Calls <= 10 minutes do not require proof and are automatically approved without pending status
    if (duration <= 10) return false;

    if (log.isProofPending === true) return true;
    if (log.proofLink === 'PENDING') return true;
    const hasValidProof = log.proofLink && isValidProofLink(log.proofLink);
    if (!hasValidProof) {
      return true;
    }
    return false;
  });

  if (pendingLogs.length === 0) return null;

  const handleInputChange = (logId: string, val: string) => {
    setInputUrls((prev) => ({ ...prev, [logId]: val }));
    if (errorMessages[logId]) {
      setErrorMessages((prev) => {
        const next = { ...prev };
        delete next[logId];
        return next;
      });
    }
  };

  const handleSaveProof = async (log: WorkLogEntry) => {
    const rawUrl = (inputUrls[log.id] || '').trim();
    if (!rawUrl) {
      setErrorMessages((prev) => ({
        ...prev,
        [log.id]: isUrdu
          ? 'براہ کرم گوگل میٹ یا ڈرائیو ریکارڈنگ کا لنک درج کریں۔'
          : 'Please enter a Google Meet or Drive URL.'
      }));
      return;
    }

    if (!isValidProofLink(rawUrl)) {
      setErrorMessages((prev) => ({
        ...prev,
        [log.id]: isUrdu
          ? 'غلط لنک! لنک meet.google.com یا drive.google.com پر مشتمل ہونا چاہیے۔'
          : 'Invalid link! Must be from meet.google.com or drive.google.com'
      }));
      return;
    }

    setSubmittingIds((prev) => ({ ...prev, [log.id]: true }));

    try {
      if (updateWorkLogProofLink) {
        await updateWorkLogProofLink(log.id, rawUrl);
      }
      setSuccessIds((prev) => ({ ...prev, [log.id]: true }));
    } catch (err: any) {
      setErrorMessages((prev) => ({
        ...prev,
        [log.id]: err?.message || 'Failed to update'
      }));
    } finally {
      setSubmittingIds((prev) => ({ ...prev, [log.id]: false }));
    }
  };

  return (
    <div
      className={`rounded-2xl border border-amber-400/60 bg-amber-500/10 p-3.5 sm:p-4 text-xs space-y-3 shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Clock size={16} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-amber-900 dark:text-amber-200">
                {isUrdu ? 'پینڈنگ پروف لنکس' : 'Pending Proof Links'}
              </span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-white">
                {pendingLogs.length} {isUrdu ? 'باقی' : 'Pending'}
              </span>
            </div>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-300 mt-0.5">
              {isUrdu
                ? 'گوگل میٹ ریکارڈنگز وقت لیتی ہیں۔ لاگ آؤٹ کرنے سے پہلے یا صبح لاگ ان کے بعد یہاں لنک پیسٹ کریں۔'
                : 'Google Meet recordings delay: Paste and link recordings before logout or upon morning login.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenModal && (
            <button
              type="button"
              onClick={onOpenModal}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer select-none"
            >
              <span>{isUrdu ? 'مکمل فہرست' : 'View All'}</span>
              <ArrowRight size={12} className="rtl:rotate-180" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer select-none"
          >
            <span>{isExpanded ? (isUrdu ? 'چھپائیں' : 'Collapse') : (isUrdu ? 'فوری پیسٹ کریں' : 'Quick Paste')}</span>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Expandable Quick Paste Box */}
      {isExpanded && (
        <div className="pt-2 border-t border-amber-300/40 space-y-3 animate-in fade-in-50 duration-150">
          {pendingLogs.map((log) => {
            const currentInput = inputUrls[log.id] || '';
            const isSubmitting = submittingIds[log.id];
            const error = errorMessages[log.id];

            return (
              <div
                key={log.id}
                className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-amber-300/50 space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between text-[11px] gap-2">
                  <div className="flex items-center gap-2 font-bold text-md-on-surface truncate">
                    <Building2 size={13} className="text-md-primary shrink-0" />
                    <span className="truncate">{log.clientName}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800">
                      {log.durationMinutes}m
                    </span>
                  </div>
                  <span className="text-[10px] text-md-outline font-mono shrink-0">
                    {log.date}
                  </span>
                </div>

                <p className="text-[11px] text-md-on-surface-variant font-medium line-clamp-1">
                  {log.details}
                </p>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Link2 size={12} className="absolute ltr:left-2.5 rtl:right-2.5 top-1/2 -translate-y-1/2 text-md-outline" />
                      <input
                        type="url"
                        placeholder="https://meet.google.com/... or https://drive.google.com/..."
                        value={currentInput}
                        onChange={(e) => handleInputChange(log.id, e.target.value)}
                        className="w-full ltr:pl-7 rtl:pr-7 pr-2 py-1.5 text-xs font-mono bg-md-surface-container-low border border-md-surface-variant rounded-lg text-md-on-surface focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSaveProof(log)}
                      disabled={isSubmitting || !currentInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <CheckCircle2 size={12} />
                      <span>{isSubmitting ? '...' : isUrdu ? 'محفوظ' : 'Save'}</span>
                    </button>
                  </div>
                  {error && (
                    <p className="text-[10px] text-red-600 font-medium flex items-center gap-1">
                      <AlertTriangle size={10} className="shrink-0" />
                      <span>{error}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
