/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Ticket,
  Calendar,
  Clock,
  FileText,
  ClipboardPen,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Link2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ArrowRight,
  MessageSquare,
  Globe,
  ExternalLink,
  Phone
} from 'lucide-react';
import { TicketStatus, ModuleId, WorkLogEntry } from '../../types';
import { PendingProofLinksBanner } from '../common/PendingProofLinksBanner';
import { QuickLinksGrid } from '../common/QuickLinksGrid';
import { isValidProofLink } from '../../utils/helpers';

export const SupportExecutiveDashboard: React.FC = () => {
  const {
    tickets,
    clients,
    workLogs,
    currentUser,
    setSelectedClientId,
    setIsBlankWorkspace,
    language,
    setCurrentModule,
    openPendingProofModal,
    updateWorkLogProofLink,
    setWhatsAppModalOpen,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    refreshCurrentView,
    isRefreshing
  } = useApp();
  const isUrdu = language === 'ur';

  const [inputUrls, setInputUrls] = useState<Record<string, string>>({});
  const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({});
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

  const myName = (currentUser?.name || '').trim().toLowerCase();
  const firstToken = myName.split(' ')[0];
  const assignedClientIds = useMemo(() => new Set(currentUser?.assignedClients || []), [currentUser]);

  // Requirement: "support team ku unka ticket batana sab Ka Nhi, ayse hi har cheez unki unku batana"
  const myClients = useMemo(() => {
    return clients.filter(c => {
      if (assignedClientIds.has(c.id) || (c.teId && assignedClientIds.has(c.teId))) return true;
      const cExec = (c.assignedExecutive || c.assignedSupport || '').trim().toLowerCase();
      return cExec === myName || (firstToken && cExec.includes(firstToken));
    });
  }, [clients, myName, firstToken, assignedClientIds]);

  const myClientIds = useMemo(() => new Set(myClients.map(c => c.id)), [myClients]);

  const myTickets = useMemo(() => {
    return tickets.filter(t => {
      if (t.status === TicketStatus.CLOSED || t.status === TicketStatus.CANCELLED) return false;
      const assignedTo = ((t as any).assignedExecutive || (t as any).assignedTo || '').trim().toLowerCase();
      if (assignedTo === myName || (firstToken && assignedTo.includes(firstToken))) return true;
      const raisedBy = (t.raisedBy || (t as any).raisedFrom || t.createdBy || '').trim().toLowerCase();
      if (raisedBy === myName || (firstToken && raisedBy.includes(firstToken))) return true;
      return myClientIds.has(t.clientId) || myClients.some(c => c.name === t.clientName);
    });
  }, [tickets, myName, firstToken, myClientIds, myClients]);

  const myFollowUps = useMemo(() => {
    return myTickets.flatMap(t => (t.followUps || []).filter(f => f.status === 'Pending'));
  }, [myTickets]);

  const myTraining = useMemo(() => {
    return myTickets.flatMap(t => t.trainingLogs || []);
  }, [myTickets]);

  // Compute pending proof links
  const allLogsFromTickets = tickets.flatMap((t) => t.workLogs || []);
  const combinedLogsMap = new Map<string, WorkLogEntry>();
  [...workLogs, ...allLogsFromTickets].forEach((log) => {
    if (log && log.id && !combinedLogsMap.has(log.id)) {
      combinedLogsMap.set(log.id, log);
    }
  });

  const pendingProofLogs = Array.from(combinedLogsMap.values()).filter((log) => {
    const logExec = (log.executiveName || (log as any).supportName || '').trim().toLowerCase();
    const isMine = logExec === myName || (firstToken && logExec.includes(firstToken)) || myClientIds.has(log.clientId);
    if (!isMine) return false;
    if (log.isProofPending === true) return true;
    if (log.proofLink === 'PENDING') return true;
    const hasValidProof = log.proofLink && isValidProofLink(log.proofLink);
    return (log.durationMinutes || 0) > 5 && !hasValidProof;
  });

  const handleSaveProofInline = async (log: WorkLogEntry) => {
    const rawUrl = (inputUrls[log.id] || '').trim();
    if (!rawUrl) {
      setErrorMessages((prev) => ({
        ...prev,
        [log.id]: isUrdu ? 'براہ کرم لنک درج کریں۔' : 'Please enter a URL.'
      }));
      return;
    }

    if (!isValidProofLink(rawUrl)) {
      setErrorMessages((prev) => ({
        ...prev,
        [log.id]: isUrdu
          ? 'غلط لنک! meet.google.com یا drive.google.com کا لنک دیں۔'
          : 'Must be from meet.google.com or drive.google.com'
      }));
      return;
    }

    setSubmittingIds((prev) => ({ ...prev, [log.id]: true }));
    try {
      if (updateWorkLogProofLink) {
        await updateWorkLogProofLink(log.id, rawUrl);
      }
    } catch (err: any) {
      setErrorMessages((prev) => ({
        ...prev,
        [log.id]: err?.message || 'Error updating proof link'
      }));
    } finally {
      setSubmittingIds((prev) => ({ ...prev, [log.id]: false }));
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Top Bar with Navigation and Quick Action to Daily Work Log */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-md-surface p-4 sm:p-5 rounded-2xl border border-md-surface-variant shadow-2xs">
        <div className="flex items-center gap-3">
          {/* Universal Navigation Controls */}
          <div className="flex items-center bg-md-surface-variant/40 rounded-xl p-0.5 border border-md-surface-variant shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={goBack}
              disabled={!canGoBack}
              className="p-1 sm:p-1.5 rounded-lg text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-surface-variant transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title={isUrdu ? 'پچھلا صفحہ (Back)' : 'Previous Page (Back)'}
            >
              <ChevronLeft size={16} className="rtl:rotate-180" />
            </button>

            <button
              type="button"
              onClick={goForward}
              disabled={!canGoForward}
              className="p-1 sm:p-1.5 rounded-lg text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-surface-variant transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title={isUrdu ? 'اگلا صفحہ (Next)' : 'Next Page (Forward)'}
            >
              <ChevronRight size={16} className="rtl:rotate-180" />
            </button>

            <div className="w-[1px] h-3.5 bg-md-surface-variant/80 mx-0.5" />

            <button
              type="button"
              onClick={refreshCurrentView}
              className="p-1 sm:p-1.5 rounded-lg text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-surface-variant transition cursor-pointer"
              title={isUrdu ? 'ریفریش کریں (Refresh)' : 'Refresh view'}
            >
              <RotateCw size={15} className={isRefreshing ? 'animate-spin text-md-primary' : ''} />
            </button>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-md-on-surface">
              {isUrdu ? 'ایگزیکٹو ڈیش بورڈ' : 'Executive Dashboard'}
            </h1>
            <p className="text-xs text-md-outline mt-0.5">
              {isUrdu ? 'مقرر کردہ کلائنٹس، اوپن ٹکٹس، ڈیلی ورک لاگ اور پینڈنگ ٹاسک کا جائزہ' : 'Overview of assigned clients, daily work logs, and pending tasks'}
            </p>
          </div>
        </div>

        {/* Action buttons: Daily Work Log & WhatsApp Shift Close */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <button
            type="button"
            onClick={() => setWhatsAppModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer select-none"
            title="Work Close Summary to WhatsApp Group"
          >
            <MessageSquare size={14} />
            <span>{isUrdu ? 'شفٹ کلوز سمری' : 'Shift Close'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentModule(ModuleId.DAILY_WORK_LOG)}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-md-primary hover:bg-md-primary/95 text-md-on-primary text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer select-none"
          >
            <ClipboardPen size={15} />
            <span>{isUrdu ? 'ڈیلی ورک لاگ درج کریں' : 'New Daily Work Log'}</span>
            <ArrowRight size={13} className="rtl:rotate-180" />
          </button>
        </div>
      </div>

      {/* Prominent Pending Proof Links Alert Banner */}
      <PendingProofLinksBanner onOpenModal={openPendingProofModal} />

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-5">
        <DashboardCard 
          title={isUrdu ? 'مقرر کردہ کلائنٹس' : 'Assigned Clients'} 
          value={myClients.length} 
          icon={<Users className="text-blue-500" size={18} />} 
        />
        <DashboardCard 
          title={isUrdu ? 'کھلے ٹکٹس' : 'Open Tickets'} 
          value={myTickets.length} 
          icon={<Ticket className="text-amber-500" size={18} />} 
        />
        <DashboardCard 
          title={isUrdu ? 'زیر التواء فالو اپ' : 'Pending Follow-ups'} 
          value={myFollowUps.length} 
          icon={<Calendar className="text-emerald-500" size={18} />} 
        />
        <DashboardCard 
          title={isUrdu ? 'پینڈنگ پروف لنکس' : 'Pending Proofs'} 
          value={pendingProofLogs.length} 
          icon={<Clock className="text-amber-600 animate-spin-slow" size={18} />}
          highlight={pendingProofLogs.length > 0}
          onClick={openPendingProofModal}
        />
        <DashboardCard 
          title={isUrdu ? 'ٹریننگ سیشنز' : 'Training Sessions'} 
          value={myTraining.length} 
          icon={<FileText className="text-purple-500" size={18} />} 
        />
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tasks and Pending Proof Links */}
        <div className="space-y-6 lg:col-span-2">
          {/* Pending Proof Links Quick-Paste Box */}
          {pendingProofLogs.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-300 dark:border-amber-700/60 p-5 rounded-2xl space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-amber-300/40 pb-2">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-600 animate-spin-slow" />
                  <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    {isUrdu
                      ? `پینڈنگ پروف لنکس (${pendingProofLogs.length}) — لاگ آؤٹ سے پہلے شامل کریں`
                      : `Pending Proof Links (${pendingProofLogs.length}) — Attach before Logout`}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={openPendingProofModal}
                  className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline"
                >
                  {isUrdu ? 'سب دیکھیں' : 'View Modal'}
                </button>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {pendingProofLogs.map((log) => {
                  const currentInput = inputUrls[log.id] || '';
                  const isSubmitting = submittingIds[log.id];
                  const error = errorMessages[log.id];

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-amber-300/60 text-xs space-y-2 shadow-3xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-bold text-md-on-surface truncate">
                          <Building2 size={13} className="text-md-primary shrink-0" />
                          <span className="truncate">{log.clientName}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 shrink-0">
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

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Link2 size={12} className="absolute ltr:left-2.5 rtl:right-2.5 top-1/2 -translate-y-1/2 text-md-outline" />
                          <input
                            type="url"
                            placeholder="https://meet.google.com/... or https://drive.google.com/..."
                            value={currentInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setInputUrls((prev) => ({ ...prev, [log.id]: val }));
                            }}
                            className="w-full ltr:pl-7 rtl:pr-7 pr-2 py-1.5 text-xs font-mono bg-md-surface-container-low border border-md-surface-variant rounded-lg text-md-on-surface focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSaveProofInline(log)}
                          disabled={isSubmitting || !currentInput.trim()}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          <CheckCircle2 size={12} />
                          <span>{isSubmitting ? '...' : isUrdu ? 'محفوظ کریں' : 'Save'}</span>
                        </button>
                      </div>
                      {error && (
                        <p className="text-[10px] text-red-600 font-medium">{error}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Today's Tasks */}
          <div className="bg-md-surface p-5 sm:p-6 rounded-2xl border border-md-surface-variant shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-md-on-surface">
              {isUrdu ? 'آج کے کام اور فالو اپ' : "Today's Tasks"}
            </h2>
            <div className="space-y-3">
              {myFollowUps.length === 0 ? (
                <p className="text-xs text-md-outline italic py-4 text-center">
                  {isUrdu ? 'آج کے لیے کوئی زیر التواء فالو اپ نہیں ہے۔' : 'No pending follow-ups for today.'}
                </p>
              ) : (
                myFollowUps.slice(0, 5).map(f => (
                  <div key={f.id} className="p-3.5 border border-md-surface-variant rounded-xl bg-md-surface-container-low text-xs flex items-center justify-between">
                    <span className="font-semibold text-md-on-surface">{f.reason}</span>
                    <span className="font-mono text-md-outline bg-md-surface px-2 py-0.5 rounded-md border border-md-surface-variant">{f.scheduledDate}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* My Assigned Clients & Live Software Links (Requirement #1) */}
          <div className="bg-md-surface p-5 sm:p-6 rounded-2xl border border-md-surface-variant shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-blue-600 dark:text-blue-400" />
                <h2 className="text-base font-bold text-md-on-surface">
                  {isUrdu ? `میرے تفویض کردہ کلائنٹس (${myClients.length})` : `My Assigned Clients & Software URLs (${myClients.length})`}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBlankWorkspace(false);
                  setCurrentModule(ModuleId.MY_CLIENTS);
                }}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{isUrdu ? 'سب دیکھیں' : 'View All'}</span>
                <ArrowRight size={12} className="rtl:rotate-180" />
              </button>
            </div>

            {myClients.length === 0 ? (
              <p className="text-xs text-md-outline italic py-4 text-center">
                {isUrdu ? 'آپ کو کوئی کلائنٹ تفویض نہیں کیا گیا۔' : 'No clients assigned to your account yet.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {myClients.map(client => {
                  const url = client.url || client.deploymentUrl;
                  const cleanUrl = url ? (url.startsWith('http') ? url : `https://${url}`) : '';
                  return (
                    <div
                      key={client.id}
                      className="p-3.5 rounded-xl border border-md-surface-variant bg-md-surface-container-low space-y-2.5 text-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-md-on-surface truncate">{client.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold shrink-0">
                            {client.teId || client.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-md-outline truncate">{client.company || client.department}</p>
                      </div>

                      {/* Client Software URL Button */}
                      {cleanUrl ? (
                        <a
                          href={cleanUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-[11px] flex items-center justify-between gap-1 shadow-2xs transition"
                          title="Click to launch client software"
                        >
                          <span className="truncate font-mono">{cleanUrl}</span>
                          <ExternalLink size={12} className="shrink-0" />
                        </a>
                      ) : (
                        <div className="py-1 px-2 rounded-lg bg-md-surface text-md-outline text-[10px] text-center font-mono">
                          🌐 URL: Not Configured
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1 border-t border-md-surface-variant/40">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClientId(client.id);
                            setIsBlankWorkspace(false);
                            setCurrentModule(ModuleId.DAILY_WORK_LOG);
                          }}
                          className="flex-1 py-1 px-2 rounded-lg bg-md-primary text-md-on-primary font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition"
                        >
                          <ClipboardPen size={11} />
                          <span>{isUrdu ? 'ورک لاگ' : 'Work Log'}</span>
                        </button>
                        {client.phone && (
                          <a
                            href={`tel:${client.phone}`}
                            className="p-1 rounded-lg bg-md-surface text-md-on-surface border border-md-surface-variant hover:text-blue-600"
                            title="Call client"
                          >
                            <Phone size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="bg-md-surface p-5 sm:p-6 rounded-2xl border border-md-surface-variant shadow-2xs space-y-4 h-fit">
          <h2 className="text-base font-bold text-md-on-surface">
            {isUrdu ? 'حالیہ سرگرمیاں' : 'Recent Activity'}
          </h2>
          <div className="space-y-3">
            {myTickets.flatMap(t => t.history).length === 0 ? (
              <p className="text-xs text-md-outline italic py-4 text-center">
                {isUrdu ? 'کوئی حالیہ سرگرمی ریکارڈ نہیں ہوئی۔' : 'No recent activities recorded.'}
              </p>
            ) : (
              myTickets.flatMap(t => t.history).slice(-5).map(h => (
                <div key={h.id} className="text-xs border-b border-md-surface-variant pb-2.5 text-md-on-surface flex items-center justify-between">
                  <span>{isUrdu ? 'ٹکٹ اسٹیٹس تبدیلی:' : 'Ticket status change:'}</span>
                  <span className="font-mono font-bold text-md-primary">{h.fromStatus} → {h.toStatus}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Authorized Quick Links for Support Executive */}
      <QuickLinksGrid id="executive-quick-links" showAdminShortcuts={false} />
    </div>
  );
};

interface DashboardCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
  onClick?: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  highlight = false,
  onClick
}) => (
  <div
    onClick={onClick}
    className={`p-4 sm:p-5 rounded-2xl border shadow-2xs flex items-center gap-3 sm:gap-4 transition-all ${
      onClick ? 'cursor-pointer hover:shadow-xs' : ''
    } ${
      highlight
        ? 'bg-amber-500/10 border-amber-400 text-amber-900 dark:text-amber-200'
        : 'bg-md-surface border-md-surface-variant'
    }`}
  >
    <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${highlight ? 'bg-amber-500 text-white shadow-2xs' : 'bg-md-surface-container-high'}`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] text-md-outline font-medium truncate">{title}</p>
      <p className={`text-lg sm:text-2xl font-black mt-0.5 ${highlight ? 'text-amber-700 dark:text-amber-300' : 'text-md-on-surface'}`}>
        {value}
      </p>
    </div>
  </div>
);
