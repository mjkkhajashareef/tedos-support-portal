/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Link2,
  Clock,
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkLogEntry, UserRole } from '../../types';
import { isValidProofLink } from '../../utils/helpers';

interface PendingProofLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PendingProofLinksModal: React.FC<PendingProofLinksModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    workLogs,
    tickets,
    updateWorkLogProofLink,
    updateWorkLogFields,
    addNotification,
    currentUser,
    language
  } = useApp();
  const isUrdu = language === 'ur';

  // Requirement #6: "Pending proof link me support team ko manager remark ka access hata dena hai"
  // Only Managers and Leadership can add or approve with Manager Remarks!
  const canManageRemarks =
    currentUser?.role === UserRole.SUPPORT_MANAGER ||
    currentUser?.role === UserRole.OPERATION_MANAGER ||
    currentUser?.role === UserRole.COO ||
    currentUser?.role === UserRole.DIRECTOR ||
    currentUser?.role === UserRole.AI_ADMINISTRATOR;

  const [inputUrls, setInputUrls] = useState<Record<string, string>>({});
  const [managerRemarks, setManagerRemarks] = useState<Record<string, string>>({});
  const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({});
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
  const [successIds, setSuccessIds] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Gather all work logs that have pending proof links
  // A log is pending proof if:
  // 1. isProofPending is true, OR
  // 2. durationMinutes > 5 AND (!proofLink || proofLink.trim() === '' || proofLink === 'PENDING') AND approvalStatus !== 'Rejected'
  const allLogsFromTickets = tickets.flatMap((t) => t.workLogs || []);
  const combinedLogsMap = new Map<string, WorkLogEntry>();
  
  [...workLogs, ...allLogsFromTickets].forEach((log) => {
    if (log && log.id && !combinedLogsMap.has(log.id)) {
      combinedLogsMap.set(log.id, log);
    }
  });

  const allLogs = Array.from(combinedLogsMap.values());
  const isSupportExecutive = currentUser?.role === UserRole.SUPPORT_EXECUTIVE;
  const currentExecName = (currentUser?.name || '').trim().toLowerCase();

  const pendingLogs = allLogs.filter((log) => {
    if (successIds[log.id]) return false;
    // If approved by manager, it is no longer pending
    if (log.approvalStatus === 'Approved') return false;
    if (log.proofLink && (log.proofLink.includes('Approved') || log.proofLink.includes('Done') || log.proofLink.includes('OK'))) return false;

    // Role Isolation: Support executive only sees their own pending logs
    if (isSupportExecutive && currentExecName) {
      const logExec = (log.executiveName || (log as any).supportName || '').trim().toLowerCase();
      if (!logExec.includes(currentExecName) && !currentExecName.includes(logExec)) {
        return false;
      }
    }

    const duration = Number(log.durationMinutes) || 0;
    // Calls <= 10 minutes do not require proof and are automatically approved without pending status
    if (duration <= 10) return false;

    if (log.isProofPending === true) return true;
    if (log.proofLink === 'PENDING') return true;
    const hasValidProof = log.proofLink && isValidProofLink(log.proofLink);
    if (!hasValidProof) {
      return true;
    }
    return false;
  });

  // Filter by search query
  const filteredLogs = pendingLogs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.clientName || '').toLowerCase().includes(q) ||
      (log.details || '').toLowerCase().includes(q) ||
      (log.category || '').toLowerCase().includes(q) ||
      (log.teId || '').toLowerCase().includes(q)
    );
  });

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
          : 'Please enter a Google Meet or Google Drive recording URL.'
      }));
      return;
    }

    if (!isValidProofLink(rawUrl)) {
      setErrorMessages((prev) => ({
        ...prev,
        [log.id]: isUrdu
          ? 'غلط لنک! لنک meet.google.com یا drive.google.com پر مشتمل ہونا چاہیے۔'
          : 'Invalid link! URL must be from meet.google.com or drive.google.com'
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
        [log.id]: err?.message || 'Failed to update proof link'
      }));
    } finally {
      setSubmittingIds((prev) => ({ ...prev, [log.id]: false }));
    }
  };

  // Requirement #5: Manager OK / Done / Custom Remark to approve and sync to sheet
  const handleSaveManagerRemark = async (log: WorkLogEntry, customText?: string) => {
    if (!canManageRemarks) {
      setErrorMessages((prev) => ({
        ...prev,
        [log.id]: isUrdu
          ? 'صرف مینیجر یا ایڈمن کو مینیجر ریمارک شامل کرنے کا اختیار ہے۔'
          : 'Manager Remarks are restricted to Managers & Leadership.'
      }));
      return;
    }

    const rawRemark = (customText || managerRemarks[log.id] || '').trim();
    if (!rawRemark) {
      setErrorMessages((prev) => ({
        ...prev,
        [log.id]: isUrdu
          ? 'براہ کرم مینیجر ریمارک (OK, Done یا ریمارک) درج کریں تاکہ شیٹ میں سنک ہو سکے۔'
          : 'Please enter or click a Manager Remark (OK, Done, etc.) to approve and sync.'
      }));
      return;
    }

    setSubmittingIds((prev) => ({ ...prev, [log.id]: true }));
    try {
      updateWorkLogFields(log.id, {
        managerRemark: rawRemark,
        approvalRemark: rawRemark,
        approvalStatus: 'Approved',
        isProofPending: false
      });
      setSuccessIds((prev) => ({ ...prev, [log.id]: true }));
      addNotification({
        title: isUrdu ? 'مینیجر ریمارک گوگل شیٹ میں سنک ہو گیا' : 'Manager Remark Synced to Google Sheet',
        message: `${log.clientName}: "${rawRemark}" (Approval Synced)`,
        type: 'success'
      });
    } catch (err: any) {
      setErrorMessages((prev) => ({
        ...prev,
        [log.id]: err?.message || 'Failed to sync Manager Remark'
      }));
    } finally {
      setSubmittingIds((prev) => ({ ...prev, [log.id]: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-50 duration-200">
      <div className="bg-md-surface w-full max-w-2xl rounded-3xl border border-md-surface-variant shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-md-surface-variant flex items-center justify-between bg-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Clock size={20} className="animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-md-on-surface">
                  {isUrdu ? 'کل کے کام کے پینڈنگ پروف لنکس اور مینیجر ریمارک' : 'Pending Proof Links Manager & Morning SLA'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500 text-white shadow-xs">
                  {pendingLogs.length} {isUrdu ? 'زیر التواء' : 'Pending'}
                </span>
              </div>
              <p className="text-[11px] text-md-outline mt-0.5">
                {isUrdu
                  ? 'صبح 10:00 سے 11:00 کے درمیان تمام پینڈنگ پروف لنکس جمع کرنا لازمی ہے۔ اگر کلئیر نہ ہوں تو مینیجر ریمارک لکھ کر شیٹ میں سنک کریں تاکہ وارننگ ختم ہو۔'
                  : 'Mandatory morning SLA (10:00 AM – 11:00 AM). Attach Google Meet recordings or write a Manager Remark to sync directly with Google Sheet.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-md-surface-variant/40 text-md-outline hover:text-md-on-surface transition cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-md-surface-variant bg-md-surface-container-low flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-md-outline" />
            <input
              type="text"
              placeholder={isUrdu ? 'کلائنٹ یا نوٹس سے تلاش کریں...' : 'Search pending logs by client or notes...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ltr:pl-8.5 rtl:pr-8.5 py-1.5 px-3 text-xs bg-md-surface border border-md-surface-variant rounded-xl text-md-on-surface placeholder-md-outline/65 focus:outline-hidden focus:ring-1 focus:ring-md-primary"
            />
          </div>
        </div>

        {/* Morning 10:00 to 11:00 AM SLA Alert Box */}
        <div className="p-3 bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
            <div className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
              <span className="font-black underline">
                {isUrdu ? 'صبح 10:00 تا 11:00 کا خصوصی وقت:' : 'Morning 10:00 AM – 11:00 AM SLA:'}
              </span>{' '}
              {isUrdu
                ? 'کل کے تمام نامکمل لنکس یہاں شامل کریں، ورنہ ہر 5 منٹ پر ریمائنڈر آئے گا۔ مینیجر ریمارک لکھنے سے لنک حل ہو کر شیٹ میں سنک ہو جاتا ہے۔'
                : 'Yesterday pending proof links must be cleared. Reminders trigger every 5 minutes until resolved or marked with Manager Remark.'}
            </div>
          </div>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 divide-y divide-md-surface-variant/40">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="text-sm font-bold text-md-on-surface">
                {isUrdu ? 'کوئی پینڈنگ پروف لنک نہیں ہے!' : 'All proof links are up to date!'}
              </h4>
              <p className="text-xs text-md-outline max-w-sm mx-auto">
                {isUrdu
                  ? 'آپ کے تمام سپورٹ ورک لاگز میں تصدیقی میٹ لنکس کامیابی سے شامل ہیں۔'
                  : 'Every session exceeding 10 minutes has an attached, verified recording link or approval.'}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const currentInput = inputUrls[log.id] || '';
              const isSubmitting = submittingIds[log.id];
              const error = errorMessages[log.id];

              return (
                <div key={log.id} className="pt-3.5 first:pt-0 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-xs text-md-on-surface flex items-center gap-1.5">
                          <Building2 size={13} className="text-md-primary" />
                          {log.clientName}
                        </span>
                        {log.teId && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-blue-500/10 text-blue-600 border border-blue-400/20">
                            {log.teId}
                          </span>
                        )}
                        <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-400/30">
                          {log.category || log.issueCategory}
                        </span>
                      </div>
                      <p className="text-xs text-md-on-surface-variant font-medium line-clamp-2">
                        {log.details}
                      </p>
                    </div>

                    <div className="text-right shrink-0 text-[10px] font-mono text-md-outline">
                      <div className="flex items-center gap-1 justify-end font-semibold">
                        <Calendar size={11} />
                        <span>{log.date}</span>
                      </div>
                      <div className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                        {log.durationMinutes} {isUrdu ? 'منٹ' : 'mins'}
                      </div>
                    </div>
                  </div>

                  {/* URL Paste input with Action Button */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Link2 size={13} className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-md-outline" />
                        <input
                          type="url"
                          placeholder={
                            isUrdu
                              ? 'آپشن 1: گوگل میٹ ریکارڈنگ لنک (meet.google.com / drive.google.com)'
                              : 'Option 1: Paste https://meet.google.com/... or https://drive.google.com/...'
                          }
                          value={currentInput}
                          onChange={(e) => handleInputChange(log.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveProof(log);
                            }
                          }}
                          className="w-full ltr:pl-8 rtl:pr-8 pr-3 py-2 text-xs font-mono bg-md-surface-container-low border border-md-surface-variant rounded-xl text-md-on-surface placeholder-md-outline/60 focus:ring-1 focus:ring-md-primary focus:bg-md-surface focus:outline-hidden"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveProof(log)}
                        disabled={isSubmitting || !currentInput.trim()}
                        className="px-3.5 py-2 rounded-xl bg-md-primary hover:bg-md-primary/95 text-md-on-primary text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                      >
                        {isSubmitting ? (
                          <span>{isUrdu ? 'محفوظ ہو رہا ہے...' : 'Saving...'}</span>
                        ) : (
                          <>
                            <CheckCircle2 size={13} />
                            <span>{isUrdu ? 'لنک محفوظ کریں' : 'Save Link'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Option 2: Manager Remark - RESTRICTED TO MANAGERS & LEADERSHIP ONLY (Requirement #5 & #6) */}
                    {canManageRemarks && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-900 dark:text-amber-200 uppercase block">
                            {isUrdu
                              ? '📋 آپشن 2 (مینیجر منظوری): وقت پر لنک نہ آنے پر OK یا Done دبائیں یا ریمارک لکھ کر شیٹ میں سنک کریں:'
                              : '📋 Option 2 (Manager Approval): Click OK / Done or write custom remark to verify & sync:'}
                          </span>
                        </div>

                        {/* Quick 1-Click Action Badges for Manager (Requirement #5) */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleSaveManagerRemark(log, 'OK - Approved by Manager')}
                            disabled={isSubmitting}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Instant Approval: OK - Approved by Manager"
                          >
                            <CheckCircle2 size={12} />
                            <span>✅ OK (منظور شدہ)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSaveManagerRemark(log, 'Done - Work Verified by Manager')}
                            disabled={isSubmitting}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Instant Approval: Done - Work Verified by Manager"
                          >
                            <CheckCircle2 size={12} />
                            <span>👍 Done (تصدیق شدہ)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSaveManagerRemark(log, 'Warning: Proof link overdue - Conditionally Approved')}
                            disabled={isSubmitting}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Overdue Warning & Approval"
                          >
                            <AlertTriangle size={12} />
                            <span>⚠️ Overdue Warning (تاخیر پر وارننگ)</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={managerRemarks[log.id] || ''}
                            onChange={(e) => setManagerRemarks((prev) => ({ ...prev, [log.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveManagerRemark(log);
                              }
                            }}
                            placeholder={
                              isUrdu
                                ? 'یا اپنی مرضی کا مینیجر ریمارک یہاں لکھیں...'
                                : 'Or type custom manager remark here...'
                            }
                            className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-amber-400/40 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveManagerRemark(log)}
                            disabled={isSubmitting || !(managerRemarks[log.id] || '').trim()}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                          >
                            <CheckCircle2 size={13} />
                            <span>{isUrdu ? 'سنک کریں' : 'Sync'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {error && (
                      <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 pl-1">
                        <AlertTriangle size={11} className="shrink-0" />
                        <span>{error}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-md-surface-variant bg-md-surface-container-low flex items-center justify-between text-xs text-md-outline">
          <span className="text-[11px]">
            {isUrdu
              ? '💡 نوٹ: گوگل میٹ ریکارڈنگ لنک شامل کرنے سے لاگ فوری تصدیق شدہ ہو جاتا ہے۔'
              : '💡 Note: Attaching recording link marks the work log as Verified in Google Sheets.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-md-surface-variant hover:bg-md-surface-variant/40 text-md-on-surface text-xs font-bold transition cursor-pointer"
          >
            {isUrdu ? 'بند کریں' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
