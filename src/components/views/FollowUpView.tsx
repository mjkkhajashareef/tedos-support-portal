/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FollowUpTracker, SupportClient, UserRole } from '../../types';
import { can, Permission } from '../../utils/rbac';
import { MaterialCard } from '../common/MaterialCard';
import { AIHook } from '../common/AIHook';
import { SHEETS_MAPPING_CONFIG } from '../../config/sheetsMapping';
import {
  CalendarClock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Search,
  Phone,
  MessageSquare,
  Clock,
  User,
  ShieldCheck,
  Check,
  X,
  FileText,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  TrendingUp,
  UserCheck,
  Download,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportFollowUpsToCSV } from '../../utils/exportUtils';

interface FollowUpViewProps {
  id?: string;
}

type TabType = 'today' | 'overdue' | 'upcoming' | 'completed';

export const FollowUpView: React.FC<FollowUpViewProps> = ({ id }) => {
  const { 
    clients, 
    followUps, 
    tickets,
    users,
    workLogs,
    addFollowUp, 
    updateFollowUp, 
    updateClientStatus,
    currentUser,
    notifications,
    openGoogleReviewModal,
    language
  } = useApp();

  const isUrdu = language === 'ur';

  // 1. Search, Filter, Calendar Preview, and Unresolved Only State
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [onlyUnresolvedClients, setOnlyUnresolvedClients] = useState<boolean>(true);
  const [isCalendarPreviewOpen, setIsCalendarPreviewOpen] = useState<boolean>(false);
  const [previewDate, setPreviewDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // 2. Schedule New Follow-up Modal / Section State
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [newReason, setNewReason] = useState('');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('11:00');
  const [newRemarks, setNewRemarks] = useState('');
  const [newNextAction, setNewNextAction] = useState('');
  
  // 3. Quick Action Drawer / Dialog States
  const [activeOutreachFollowUp, setActiveOutreachFollowUp] = useState<FollowUpTracker | null>(null);
  const [outreachType, setOutreachType] = useState<'call' | 'whatsapp' | 'reschedule' | 'complete' | null>(null);
  
  // Call Logger States
  const [callOutcome, setCallOutcome] = useState('Answered & Resolved');
  const [updatedClientHealth, setUpdatedClientHealth] = useState<'Critical' | 'Warning' | 'Active' | 'Inactive'>('Active');
  const [callRemarks, setCallRemarks] = useState('');

  // WhatsApp States
  const [selectedTemplateId, setSelectedTemplateId] = useState('1');
  const [whatsappRemarks, setWhatsappRemarks] = useState('');

  // Reschedule States
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('12:00');
  const [rescheduleRemarks, setRescheduleRemarks] = useState('');

  // Simple Complete States
  const [completeRemarks, setCompleteRemarks] = useState('');

  // Notification Banner State
  const [successBannerMsg, setSuccessBannerMsg] = useState('');

  // Static Date Helpers
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Autofill dynamic scheduling defaults
  const handleOpenAddForm = () => {
    setShowAddForm(true);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNewDate(tomorrow.toISOString().split('T')[0]);
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  };

  // Filter follow-ups based on Tab, Search query, and Operation Manager Rule #8 ("Follow up me sirf unhi clients ko dikhana chahiye jinka issue abhi tak solve nahi hua hai")
  const filteredFollowUps = useMemo(() => {
    return followUps.filter((f) => {
      // If Support Executive, strictly filter to their own assigned clients
      if (currentUser?.role === UserRole.SUPPORT_EXECUTIVE || currentUser?.role === 'Support Executive') {
        const myName = (currentUser.name || '').toLowerCase();
        const firstToken = myName.split(' ')[0];
        const fExec = (f.executiveName || '').toLowerCase();
        const assignedSet = new Set(currentUser.assignedClients || []);
        const isMyClient =
          (f.clientId && assignedSet.has(f.clientId)) ||
          clients.some(
            c =>
              (c.id === f.clientId || c.name === f.clientName) &&
              ((c.assignedExecutive || c.assignedSupport || '').toLowerCase().includes(firstToken))
          );
        if (!isMyClient && !fExec.includes(firstToken)) return false;
      }

      // Rule #8: Only show clients whose issue is NOT solved yet
      if (onlyUnresolvedClients && activeTab !== 'completed') {
        if (f.status === 'Completed') return false;
        const relatedTicket = tickets.find(t => t.id === f.ticketId || t.clientId === f.clientId);
        if (relatedTicket && (relatedTicket.status === 'Resolved' || relatedTicket.status === 'Closed') && f.status !== 'Pending') {
          return false;
        }
      }

      // Search matching (Client Name, Executive Name, Purpose / Reason)
      const matchesSearch = 
        f.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.executiveName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.reason.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Tab matching logic
      if (activeTab === 'today') {
        return f.status !== 'Completed' && f.scheduledDate === todayStr;
      }
      if (activeTab === 'overdue') {
        return f.status !== 'Completed' && f.scheduledDate < todayStr;
      }
      if (activeTab === 'upcoming') {
        return f.status !== 'Completed' && f.scheduledDate > todayStr;
      }
      if (activeTab === 'completed') {
        return f.status === 'Completed';
      }
      return true;
    });
  }, [followUps, activeTab, searchQuery, todayStr, onlyUnresolvedClients, tickets, currentUser, clients]);

  // Tab count labels
  const tabCounts = useMemo(() => {
    const counts = { today: 0, overdue: 0, upcoming: 0, completed: 0 };
    followUps.forEach((f) => {
      if (f.status !== 'Pending') {
        counts.completed++;
      } else if (f.scheduledDate === todayStr) {
        counts.today++;
      } else if (f.scheduledDate < todayStr) {
        counts.overdue++;
      } else if (f.scheduledDate > todayStr) {
        counts.upcoming++;
      }
    });
    return counts;
  }, [followUps, todayStr]);

  // Handle New Follow-up Submission
  const handleCreateFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === selectedClientId);
    if (!client || !newReason.trim() || !newDate) {
      alert("Please fill in all required fields.");
      return;
    }

    const executiveName = currentUser?.name || 'Rahul Sharma';

    addFollowUp({
      clientId: selectedClientId,
      clientName: client.company,
      reason: newReason.trim(),
      priority: newPriority,
      scheduledDate: newDate,
      scheduledTime: newTime,
      remarks: newRemarks.trim() || 'Scheduled.',
      nextAction: newNextAction.trim() || 'No next action configured.',
      executiveName,
      lastContactDate: todayStr,
      status: 'Pending',
      syncStatus: 'Synchronized'
    });

    // Reset Form
    setNewReason('');
    setNewRemarks('');
    setNewNextAction('');
    setShowAddForm(false);
    
    // Show Toast
    flashBanner("Outreach callback scheduled and synchronized successfully!");
  };

  // Helper to trigger alert banners
  const flashBanner = (msg: string) => {
    setSuccessBannerMsg(msg);
    setTimeout(() => setSuccessBannerMsg(''), 4500);
  };

  // QUICK ACTION: Call Outreach Logger Submit
  const handleLogCall = () => {
    if (!activeOutreachFollowUp) return;

    let finalStatus: 'Completed' | 'Rescheduled' | 'Escalated' = 'Completed';
    let outreachRemarks = `[Call Outcome: ${callOutcome}] ${callRemarks || 'No addition comments entered'}.`;

    if (callOutcome === 'Busy / Callback Requested' || callOutcome === 'No Answer (Scheduled Retry)') {
      finalStatus = 'Rescheduled';
    }

    // 1. Update the follow-up state
    updateFollowUp(activeOutreachFollowUp.id, {
      status: finalStatus,
      remarks: outreachRemarks,
      lastContactDate: todayStr,
    });

    // 2. Update client health based on executive touch
    updateClientStatus(activeOutreachFollowUp.clientId, updatedClientHealth);

    // 3. If busy/no-answer, auto-schedule tomorrow followup to save taps!
    if (finalStatus === 'Rescheduled') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      addFollowUp({
        clientId: activeOutreachFollowUp.clientId,
        clientName: activeOutreachFollowUp.clientName,
        reason: `Retry callback: ${activeOutreachFollowUp.reason}`,
        priority: activeOutreachFollowUp.priority,
        scheduledDate: tomorrowStr,
        scheduledTime: activeOutreachFollowUp.scheduledTime,
        executiveName: activeOutreachFollowUp.executiveName,
        lastContactDate: todayStr,
        remarks: 'Auto-rescheduled from failed outreach call session.',
        status: 'Pending',
        syncStatus: 'Synchronized'
      });
      flashBanner(`Call outcome recorded. Automatically scheduled retry for tomorrow!`);
    } else {
      flashBanner(`Call logged! Outreach marked as Completed and Client Health updated.`);
    }

    // Reset Logger Drawer
    setActiveOutreachFollowUp(null);
    setOutreachType(null);
    setCallRemarks('');
  };

  // WhatsApp Templates Definition
  const whatsappTemplates = [
    {
      id: '1',
      title: 'Daily Check-in',
      text: (client: string, exec: string) => `Dear ${client} Management, following up from Techno Evident Support to confirm if your billing and local synchronization terminals are running smoothly today. Regards, ${exec}.`
    },
    {
      id: '2',
      title: 'License Expiry Watch',
      text: (client: string, exec: string) => `Urgent Notice: Dear ${client}, our records show your software subscription expires soon. Please connect back with us at your earliest convenience to maintain cloud backup features. Regards, ${exec}.`
    },
    {
      id: '3',
      title: 'Post-Setup Audit',
      text: (client: string, exec: string) => `Hello ${client}, we completed your printer escape configurations yesterday. Please confirm if receipt alignment is working fine under live workload today. Regards, ${exec}.`
    }
  ];

  const activeTemplateText = useMemo(() => {
    if (!activeOutreachFollowUp) return '';
    const template = whatsappTemplates.find(t => t.id === selectedTemplateId) || whatsappTemplates[0];
    return template.text(activeOutreachFollowUp.clientName, activeOutreachFollowUp.executiveName || currentUser?.name || 'Rahul Sharma');
  }, [selectedTemplateId, activeOutreachFollowUp]);

  // QUICK ACTION: WhatsApp Sender Simulator
  const handleSendWhatsApp = () => {
    if (!activeOutreachFollowUp) return;

    // Simulate Clipboard Copy & Device Launcher
    navigator.clipboard.writeText(activeTemplateText);
    
    // Complete the outreach activity in local state
    updateFollowUp(activeOutreachFollowUp.id, {
      status: 'Completed',
      remarks: `[WhatsApp Sent - Template: ${selectedTemplateId}] ${whatsappRemarks || 'Sent template outreach message.'}.`,
      lastContactDate: todayStr
    });

    flashBanner(`WhatsApp message copied to clipboard! Marked outreach activity as Completed.`);
    
    setActiveOutreachFollowUp(null);
    setOutreachType(null);
    setWhatsappRemarks('');
  };

  // QUICK ACTION: Reschedule Outreach
  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOutreachFollowUp || !rescheduleDate) return;

    // 1. Set current outreach status as Rescheduled
    updateFollowUp(activeOutreachFollowUp.id, {
      status: 'Rescheduled',
      remarks: `Rescheduled to ${rescheduleDate} ${rescheduleTime}. Reason: ${rescheduleRemarks || 'Operational reschedule.'}`
    });

    // 2. Clone a new follow-up outreach for the newly selected date
    addFollowUp({
      clientId: activeOutreachFollowUp.clientId,
      clientName: activeOutreachFollowUp.clientName,
      reason: activeOutreachFollowUp.reason,
      priority: activeOutreachFollowUp.priority,
      scheduledDate: rescheduleDate,
      scheduledTime: rescheduleTime,
      executiveName: activeOutreachFollowUp.executiveName,
      lastContactDate: todayStr,
      remarks: `Rescheduled. Previous notes: ${rescheduleRemarks}`,
      status: 'Pending',
      syncStatus: 'Synchronized'
    });

    flashBanner(`Outreach successfully rescheduled. New callback planned for ${rescheduleDate}!`);

    setActiveOutreachFollowUp(null);
    setOutreachType(null);
    setRescheduleRemarks('');
  };

  // QUICK ACTION: Complete Outreach
  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOutreachFollowUp) return;

    updateFollowUp(activeOutreachFollowUp.id, {
      status: 'Completed',
      remarks: completeRemarks.trim() || 'Outreach completed successfully by support executive.',
      lastContactDate: todayStr
    });

    flashBanner(`Outreach marked as Completed! Saved remarks into logs.`);

    setActiveOutreachFollowUp(null);
    setOutreachType(null);
    setCompleteRemarks('');
  };

  // QUICK ACTION: Escalate Outreach
  const handleEscalateAction = (f: FollowUpTracker) => {
    // Escalate elevates follow-up to Critical and updates state
    updateFollowUp(f.id, {
      status: 'Escalated',
      priority: 'Critical',
      remarks: 'ESCALATED: Support executive requested immediate supervisory audit.'
    });

    flashBanner(`Outreach escalated to supervisor! Urgency upgraded to Critical.`);
  };

  return (
    <div id={id} className="space-y-6 max-w-5xl mx-auto pb-12 animate-slide-up">
      
      {/* 1. SECTION: SYSTEM DIAGNOSTIC STATUS HEADER + CALENDAR PREVIEW BUTTON (Op Manager Req #1) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-md-surface-container p-4 rounded-3xl border border-md-surface-variant shadow-2xs select-none">
        <AIHook screenId="followup_tracker" contextMessage={isUrdu ? "فالو اپ ٹریکر: صرف ان کلائنٹس کو دکھایا جا رہا ہے جن کا مسئلہ ابھی حل نہیں ہوا۔" : "Showing unresolved client issues synced directly with ULTIMATE & Follow_Up_Tracker sheets."} />
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCalendarPreviewOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <CalendarClock size={14} />
            <span>{isUrdu ? '📅 کیلنڈر پریویو چیک کریں' : '📅 Check Calendar Preview'}</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={onlyUnresolvedClients}
              onChange={e => setOnlyUnresolvedClients(e.target.checked)}
            />
            <span>{isUrdu ? 'صرف حل نہ ہونے والے مسائل (Unresolved Only)' : 'Unresolved Issues Only'}</span>
          </label>

          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            ✓ Ultimate Sheet Follow-Up Sync Active
          </span>
        </div>
      </div>

      {/* OPERATION MANAGER REQ #9: EXECUTIVE & FREELANCER SALARIES + KPI DASHBOARD STRIP ON FOLLOW-UP TRACKER */}
      <MaterialCard variant="elevated" className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-600" />
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase">
              {isUrdu
                ? 'ایگزیکٹو اور فری لانسر سیلری، ماہانہ انعام اور فالو اپ کے پی آئی ٹریکر'
                : 'Executive & Freelancer Salaries, Monthly Incentives & Follow-Up KPI Tracker'}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Live Payroll & SLA KPI</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {users
            .filter(u => {
              const isExec = u.role === 'Support Executive' || u.role === 'Freelancer' || u.isFreelancer;
              if (!isExec) return false;
              // Requirement #9: Support executives only see their own salary and incentive, NOT others!
              if (currentUser?.role === 'Support Executive' && currentUser?.email?.toLowerCase() !== 'support@philsof.com') {
                return u.id === currentUser.id || u.email === currentUser.email;
              }
              return true;
            })
            .slice(0, 8)
            .map(exec => {
              const execPending = followUps.filter(
                f => f.status !== 'Completed' && f.executiveName.toLowerCase().includes(exec.name.split(' ')[0].toLowerCase())
              ).length;
              const execSolved = followUps.filter(
                f => f.status === 'Completed' && f.executiveName.toLowerCase().includes(exec.name.split(' ')[0].toLowerCase())
              ).length;

                const baseSalaryVal = typeof exec.baseSalary === 'number' ? exec.baseSalary : 0;
                const incentiveVal = typeof exec.monthlyIncentive === 'number' ? exec.monthlyIncentive : 0;

                return (
                  <div
                    key={exec.id}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 dark:text-white truncate">{exec.name}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          exec.isFreelancer || exec.role === 'Freelancer'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {exec.isFreelancer || exec.role === 'Freelancer' ? 'Freelancer' : 'Executive'}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                      💰 Salary:{' '}
                      <strong className={baseSalaryVal > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400 font-normal'}>
                        ₹{baseSalaryVal.toLocaleString()}
                      </strong>{' '}
                      • KPI / Incentive:{' '}
                      <strong className={incentiveVal > 0 ? 'text-emerald-600' : 'text-slate-400 font-normal'}>
                        {incentiveVal > 0 ? `+₹${incentiveVal.toLocaleString()}` : '₹0'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-200/70 dark:border-slate-700/60">
                      <span className="text-amber-600 font-bold">⏳ Unresolved: {execPending}</span>
                      <span className="text-emerald-600 font-bold">✅ Solved: {execSolved}</span>
                    </div>
                  </div>
                );
              })}
        </div>
      </MaterialCard>

      {/* Success Banner Notice */}
      <AnimatePresence>
        {successBannerMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm"
          >
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 animate-bounce" />
            <span>{successBannerMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEARCH AND FILTER CONSOLE */}
      <div className="space-y-3">
        {/* Search Input Box */}
        <div className="relative">
          <Search size={16} className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-md-outline" />
          <input
            type="text"
            placeholder={isUrdu ? "کلائنٹ، ملازم، یا مقصد کے ذریعے تلاش کریں..." : "Search by client, executive, purpose..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ltr:pl-11 ltr:pr-10 rtl:pr-11 rtl:pl-10 py-3.5 bg-md-surface-container rounded-2xl border border-md-surface-variant text-xs text-md-on-surface font-semibold placeholder-md-outline/65 focus:outline-hidden focus:ring-1 focus:ring-md-primary shadow-3xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute ltr:right-4 rtl:left-4 top-1/2 -translate-y-1/2 text-md-outline hover:text-md-on-surface"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dynamic Material Tabs (One-Hand Friendly) */}
        <div className="grid grid-cols-4 bg-md-surface-container-low p-1 rounded-2xl border border-md-surface-variant gap-0.5 select-none">
          {(['today', 'overdue', 'upcoming', 'completed'] as TabType[]).map((tab) => {
            const count = tabCounts[tab];
            const isActive = activeTab === tab;
            const tabLabel = isUrdu 
              ? (tab === 'today' ? 'آج' : tab === 'overdue' ? 'تاخیر' : tab === 'upcoming' ? 'آئندہ' : 'مکمل')
              : tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setExpandedCardId(null);
                }}
                className={`py-2 px-1 rounded-xl text-[10px] font-black tracking-wider uppercase flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isActive 
                    ? tab === 'overdue' && count > 0
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-md-primary text-md-on-primary shadow-sm'
                    : 'text-md-outline hover:text-md-on-surface hover:bg-md-surface-variant/30'
                }`}
              >
                <span className="truncate">{tabLabel}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full mt-0.5 font-bold ${
                  isActive 
                    ? 'bg-black/15 text-white' 
                    : tab === 'overdue' && count > 0
                      ? 'bg-red-100 text-red-700 animate-pulse'
                      : 'bg-md-surface-variant text-md-on-surface-variant'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTION BAR: SCHEDULE NEW BUTTON & EXPORT CSV */}
      <div className="flex gap-2">
        {!showAddForm && can(currentUser?.role, Permission.CREATE_FOLLOW_UP) && (
          <button
            onClick={handleOpenAddForm}
            className="flex-1 py-3.5 bg-md-primary text-md-on-primary rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-md-primary/95 transition-all shadow-md active:scale-98 cursor-pointer select-none"
          >
            <Plus size={15} />
            <span>{isUrdu ? "نیا فالو اپ شیڈول کریں" : "Schedule New"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => exportFollowUpsToCSV(filteredFollowUps)}
          className="px-4 py-3.5 rounded-2xl border border-md-surface-variant bg-md-surface-container hover:bg-md-surface-variant/40 text-xs font-bold text-md-on-surface flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
          title={isUrdu ? 'فالو اپس CSV میں محفوظ کریں' : 'Export Follow-ups to CSV'}
        >
          <Download size={15} className="text-blue-600" />
          <span>{isUrdu ? 'ایکسپورٹ CSV' : 'Export CSV'}</span>
        </button>
      </div>

      {/* 2. SECTION: OUTREACH SCHEDULER FORM */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <MaterialCard variant="elevated" className="p-5 space-y-4 border-md-primary/10">
              <div className="flex items-center justify-between border-b border-md-surface-variant pb-2">
                <div>
                  <h3 className="text-sm font-black text-md-on-surface flex items-center gap-1.5 select-none">
                    <CalendarClock size={16} className="text-md-primary" />
                    <span>{isUrdu ? "کلائنٹ فالو اپ شیڈول کریں" : "Schedule Client Outreach"}</span>
                  </h3>
                  <p className="text-[10px] text-md-on-surface-variant/75">
                    {isUrdu ? "فالو اپ کالز اور کسٹمر رابطہ شیڈول فارم" : "Minimal typing callbacks and audit parameters."}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1 rounded-full hover:bg-md-surface-variant/40 text-md-outline"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleCreateFollowUp} className="space-y-3.5 text-xs">
                {/* Client Select */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
                    {isUrdu ? "کلائنٹ کا انتخاب *" : "Support Client *"}
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-3 text-xs text-md-on-surface font-semibold"
                  >
                    <option value="" disabled>{isUrdu ? "کلائنٹ منتخب کریں" : "Select Target Client"}</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.company} ({c.name})</option>
                    ))}
                  </select>
                </div>

                {/* Purpose details */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
                    {isUrdu ? "رابطے کا مقصد / وجہ *" : "Purpose / Reason *"}
                  </label>
                  <input
                    type="text"
                    placeholder={isUrdu ? "مثال: پرنٹر مارجن سیٹنگ فالو اپ یا بلنگ تصدیق" : "e.g., Audit printer escape spacing on-site"}
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    required
                    className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-3 text-xs text-md-on-surface"
                  />
                </div>

                {/* Grid for Date, Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
                      {isUrdu ? "مقررہ تاریخ *" : "Due Date *"}
                    </label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      required
                      className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-2.5 text-xs text-md-on-surface font-semibold font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
                      {isUrdu ? "وقت *" : "Time *"}
                    </label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      required
                      className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-2.5 text-xs text-md-on-surface font-mono"
                    />
                  </div>
                </div>

                {/* Priority Selection */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
                    {isUrdu ? "ترجیح / اہمیت" : "Urgency Priority"}
                  </label>
                  <div className="grid grid-cols-4 gap-1 bg-md-surface-container-low p-1 rounded-xl border border-md-surface-variant">
                    {(['Low', 'Medium', 'High', 'Critical'] as const).map(p => {
                      const pLabel = isUrdu 
                        ? (p === 'Low' ? 'کم' : p === 'Medium' ? 'درمیانی' : p === 'High' ? 'اعلیٰ' : 'ہنگامی')
                        : p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewPriority(p)}
                          className={`py-1.5 text-[10px] font-bold rounded-lg text-center cursor-pointer ${
                            newPriority === p
                              ? p === 'Critical' ? 'bg-red-500 text-white shadow-xs' :
                                p === 'High' ? 'bg-amber-500 text-white shadow-xs' :
                                p === 'Medium' ? 'bg-blue-500 text-white shadow-xs' : 'bg-gray-500 text-white shadow-xs'
                              : 'text-md-outline hover:text-md-on-surface hover:bg-md-surface-variant/20'
                          }`}
                        >
                          {pLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional parameters */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
                      {isUrdu ? "ابتدائی ریمارکس" : "Initial Remarks"}
                    </label>
                    <input
                      type="text"
                      placeholder={isUrdu ? "ریمارکس..." : "Remarks..."}
                      value={newRemarks}
                      onChange={(e) => setNewRemarks(e.target.value)}
                      className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-2.5 text-xs text-md-on-surface"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
                      {isUrdu ? "اگلا ہدف" : "Next Action Goal"}
                    </label>
                    <input
                      type="text"
                      placeholder={isUrdu ? "اگلا قدم..." : "Next Action..."}
                      value={newNextAction}
                      onChange={(e) => setNewNextAction(e.target.value)}
                      className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-2.5 text-xs text-md-on-surface"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="w-1/3 py-3 border border-md-surface-variant hover:bg-md-surface-variant/20 rounded-xl font-bold text-center text-md-on-surface cursor-pointer select-none"
                  >
                    {isUrdu ? "منسوخ" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-md-primary hover:bg-md-primary/95 text-md-on-primary rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs cursor-pointer select-none"
                  >
                    <Plus size={14} />
                    <span>{isUrdu ? "شیڈول کریں" : "Schedule"}</span>
                  </button>
                </div>
              </form>
            </MaterialCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. SECTION: THE FOLLOW-UP CARD LISTINGS */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between border-b border-md-surface-variant pb-1.5 select-none">
          <span className="text-[10px] font-mono font-black text-md-outline uppercase tracking-wider block">
            {isUrdu ? (
              activeTab === 'today' ? "آج کے فالو اپس کی فہرست" :
              activeTab === 'overdue' ? "تاخیر شدہ فالو اپ کیو" :
              activeTab === 'upcoming' ? "آئندہ فالو اپس" : "مکمل شدہ فالو اپس کا ریکارڈ"
            ) : (
              activeTab === 'today' ? "Today's Outreach List" :
              activeTab === 'overdue' ? "Overdue Critical Queue" :
              activeTab === 'upcoming' ? "Upcoming Planner Checklist" : "Completed / Processed Outreach Logs"
            )} ({filteredFollowUps.length})
          </span>
          <span className="text-[9px] font-mono font-bold text-md-outline uppercase">
            {isUrdu ? "ایس او پی اسٹینڈرڈ" : "SOP Standard"}
          </span>
        </div>

        {filteredFollowUps.length === 0 ? (
          <MaterialCard variant="outlined" className="p-10 text-center space-y-2 border-dashed select-none">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500/80 animate-pulse" />
            <p className="text-xs text-md-on-surface font-extrabold">{isUrdu ? "کیو بالکل خالی ہے!" : "Queue Clear!"}</p>
            <p className="text-[10px] text-md-outline max-w-xs mx-auto leading-relaxed">
              {isUrdu 
                ? "اس زمرے میں فی الحال کوئی فالو اپ ٹاسک موجود نہیں ہے۔ نیا ٹاسک شامل کرنے کے لیے 'نیا فالو اپ شیڈول کریں' دبائیں۔" 
                : "No outreach tasks found for this folder category. Tap Schedule New to add client callback activities."}
            </p>
          </MaterialCard>
        ) : (
          <div className="space-y-4">
            {filteredFollowUps.map((f) => {
              const isExpanded = expandedCardId === f.id;
              
              // Find associated client to get status & executive details
              const clientObj = clients.find(c => c.id === f.clientId);
              
              return (
                <MaterialCard 
                  key={f.id} 
                  variant="outlined" 
                  className={`p-4 transition-all duration-300 relative overflow-hidden ${
                    f.priority === 'Critical' ? 'border-red-400 bg-red-500/3' :
                    f.priority === 'High' ? 'border-amber-400 bg-amber-500/3' : 'border-md-surface-variant'
                  }`}
                >
                  
                  {/* Criticality Top Border Flag */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${
                    f.priority === 'Critical' ? 'bg-red-500' :
                    f.priority === 'High' ? 'bg-amber-500' :
                    f.priority === 'Medium' ? 'bg-blue-500' : 'bg-gray-400'
                  }`} />

                  <div className="space-y-2.5">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono font-black text-md-primary bg-md-primary/5 border border-md-primary/10 px-1.5 py-0.5 rounded">
                          {f.teId}
                        </span>
                        <h4 className="text-xs font-black text-md-on-surface mt-1 block">
                          {f.clientName}
                        </h4>
                      </div>

                      {/* Status / Priority Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full select-none ${
                          f.priority === 'Critical' ? 'bg-red-100 text-red-800 border border-red-200' :
                          f.priority === 'High' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          f.priority === 'Medium' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {f.priority}
                        </span>

                        <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                          f.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          f.status === 'Rescheduled' ? 'bg-blue-100 text-blue-800' :
                          f.status === 'Escalated' ? 'bg-red-100 text-red-800 animate-pulse' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {f.status}
                        </span>
                      </div>
                    </div>

                    {/* Objective Detail */}
                    <p className="text-[11px] text-md-on-surface-variant font-bold leading-relaxed">
                      {f.reason}
                    </p>

                    {/* Metadata Strip */}
                    <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-md-outline py-2 border-y border-dashed border-md-surface-variant/60 select-none">
                      <div className="flex items-center gap-1">
                        <User size={10} className="text-md-outline" />
                        <span>{isUrdu ? "ایگزیکٹو:" : "Executive:"} <strong>{f.executiveName}</strong></span>
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <CalendarClock size={10} className="text-md-outline" />
                        <span>{isUrdu ? "مقررہ وقت:" : "Due:"} <strong>{f.scheduledDate} {f.scheduledTime}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={10} className="text-md-outline" />
                        <span>{isUrdu ? "آخری رابطہ:" : "Last Touch:"} <strong>{f.lastContactDate || (isUrdu ? 'کبھی نہیں' : 'Never')}</strong></span>
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <TrendingUp size={10} className="text-md-outline" />
                        <span>{isUrdu ? "کلائنٹ اسٹیٹس:" : "Client status:"} <strong className={`${
                          clientObj?.status === 'Critical' ? 'text-red-600' :
                          clientObj?.status === 'Warning' ? 'text-amber-600' : 'text-emerald-600'
                        }`}>{clientObj?.status || 'Active'}</strong></span>
                      </div>
                    </div>

                    {/* EXPANDABLE CORNER (Remarks, sync details, next action) */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-[10px] space-y-2 pt-2 bg-md-surface-container-low/40 p-2.5 rounded-xl border border-md-outline/5 text-md-outline"
                      >
                        {f.remarks && (
                          <p className="leading-relaxed">
                            <strong>{isUrdu ? "سپورٹ ریمارکس:" : "Support Remarks:"}</strong> {f.remarks}
                          </p>
                        )}
                        {f.nextAction && (
                          <p className="leading-relaxed">
                            <strong>{isUrdu ? "اگلا ہدف:" : "Next Action Milestone:"}</strong> {f.nextAction}
                          </p>
                        )}
                        <p className="text-[8px] font-mono opacity-80 select-none">
                          Record Hash ID: {f.id} • Sync: {f.syncStatus}
                        </p>
                      </motion.div>
                    )}

                    {/* BOTTOM THUMB TRASH & QUICK ACTION TRAY (Material 3 Thumb Friendly) */}
                    <div className="flex items-center justify-between gap-1.5 pt-1.5">
                      
                      {/* Expand Toggle */}
                      <button
                        onClick={() => setExpandedCardId(isExpanded ? null : f.id)}
                        className="px-2.5 py-2.5 rounded-xl text-[10px] font-bold text-md-outline hover:text-md-on-surface hover:bg-md-surface-variant/30 flex items-center gap-1 cursor-pointer select-none"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={11} />
                            <span>{isUrdu ? "چھپائیں" : "Hide"}</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={11} />
                            <span>{isUrdu ? "تفصیلات" : "Details"}</span>
                          </>
                        )}
                      </button>

                      {/* Horizontal Action Tray (Only for pending outbox actions) */}
                      {f.status === 'Pending' ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* ESCALATE (Fast long target) */}
                          <button
                            onClick={() => handleEscalateAction(f)}
                            className="p-2.5 rounded-xl bg-red-100 hover:bg-red-200 border border-red-200 text-red-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            title={isUrdu ? "سپروائزر کو بھیجیں" : "Escalate followup to support supervisor"}
                          >
                            <ShieldAlert size={12} />
                            <span>{isUrdu ? "اعلیٰ افسر" : "Escalate"}</span>
                          </button>

                          {/* RESCHEDULE */}
                          <button
                            onClick={() => {
                              setActiveOutreachFollowUp(f);
                              setOutreachType('reschedule');
                              setRescheduleDate(f.scheduledDate);
                              setRescheduleTime(f.scheduledTime);
                            }}
                            className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            title={isUrdu ? "دوبارہ وقت طے کریں" : "Reschedule callback outreach"}
                          >
                            <CalendarClock size={12} />
                            <span>{isUrdu ? "نیا وقت" : "Reschedule"}</span>
                          </button>

                          {/* WHATSAPP OUTBOX */}
                          <button
                            onClick={() => {
                              setActiveOutreachFollowUp(f);
                              setOutreachType('whatsapp');
                              setSelectedTemplateId('1');
                            }}
                            className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer animate-pulse"
                            title={isUrdu ? "واٹس ایپ پیغام بھیجیں" : "Launch WhatsApp template outbox copy"}
                          >
                            <MessageSquare size={12} />
                            <span>{isUrdu ? "واٹس ایپ" : "WhatsApp"}</span>
                          </button>

                          {/* GOOGLE MAPS REVIEW TRIGGER */}
                          <button
                            type="button"
                            onClick={() => {
                              const client = clients.find(c => c.id === f.clientId);
                              openGoogleReviewModal(client || null);
                            }}
                            className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 font-bold text-[10px] flex items-center gap-1 cursor-pointer select-none"
                            title={isUrdu ? "گوگل میپس ریویو لنک کسٹمر کو بھیجیں" : "Send Google Maps review request"}
                          >
                            <Star size={12} className="text-amber-500 fill-amber-500" />
                            <span>{isUrdu ? "ریویو" : "Review"}</span>
                          </button>

                          {/* CALL TRIGGER (MINIMAL TYPING ONE HAND BUTTON) */}
                          <button
                            onClick={() => {
                              setActiveOutreachFollowUp(f);
                              setOutreachType('call');
                              setCallOutcome('Answered & Resolved');
                              const client = clients.find(c => c.id === f.clientId);
                              setUpdatedClientHealth(client?.status || 'Active');
                            }}
                            className="p-2.5 rounded-xl bg-md-primary hover:bg-md-primary/90 text-md-on-primary font-black text-[10px] flex items-center gap-1 cursor-pointer"
                            title={isUrdu ? "فون کال لاگ درج کریں" : "Simulate telephone phone call"}
                          >
                            <Phone size={12} />
                            <span>{isUrdu ? "کال لاگ" : "Call Log"}</span>
                          </button>
                        </div>
                      ) : (
                        /* Completed actions */
                        <div className="flex items-center gap-1 font-semibold text-[10px] text-emerald-600 select-none">
                          <Check size={12} />
                          <span>{isUrdu ? "مکمل شدہ آؤٹ ریچ" : "Processed outreach"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </MaterialCard>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. SECTION: THE VERSATILE OVERLAY DRAWER (Call, WhatsApp, Reschedule Sheets) */}
      <AnimatePresence>
        {activeOutreachFollowUp && outreachType && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-0 animate-fade-in">
            {/* Modal Click Backdrop Out */}
            <div className="absolute inset-0" onClick={() => {
              setActiveOutreachFollowUp(null);
              setOutreachType(null);
            }} />

            {/* Bottom Sheet Slider Card */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-lg bg-md-surface rounded-t-3xl border-t border-md-surface-variant p-5 space-y-4 max-h-[85vh] overflow-y-auto pb-8 shadow-2xl z-10"
            >
              {/* Drawer Top Handle Indicator */}
              <div className="w-12 h-1 bg-md-outline/20 rounded-full mx-auto select-none" />

              {/* OUTREACH TYPE 1: TELEPHONE CALL DIALOG */}
              {outreachType === 'call' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-md-surface-variant pb-2 select-none">
                    <div>
                      <h3 className="text-sm font-black text-md-on-surface flex items-center gap-2">
                        <Phone size={16} className="text-md-primary animate-bounce" />
                        <span>{isUrdu ? "کال لاگ سیشن درج کریں" : "Log Call Outcome Session"}</span>
                      </h3>
                      <p className="text-[10px] text-md-outline mt-0.5">
                        {isUrdu ? "کلائنٹ:" : "Client:"} <strong>{activeOutreachFollowUp.clientName}</strong> • {clients.find(c => c.id === activeOutreachFollowUp.clientId)?.phone || '+91 XXXXX XXXXX'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveOutreachFollowUp(null);
                        setOutreachType(null);
                      }}
                      className="p-1 rounded-full hover:bg-md-surface-variant/40"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* 1. Outcomes Selectors (Taps instead of manual typing!) */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase block select-none">
                      {isUrdu ? "کال کا نتیجہ منتخب کریں (ون ٹچ انتخاب)" : "Call Outcome (One-Touch Selects)"}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { en: 'Answered & Resolved', ur: 'کال اٹینڈ ہوئی اور مسئلہ حل ہوا' },
                        { en: 'Busy / Callback Requested', ur: 'مصروف / دوبارہ کال کی درخواست' },
                        { en: 'No Answer (Scheduled Retry)', ur: 'جواب نہیں ملا (دوبارہ وقت طے)' },
                        { en: 'Disconnect / Invalid Number', ur: 'غلط نمبر / کال کٹ گئی' }
                      ].map((item) => (
                        <button
                          key={item.en}
                          type="button"
                          onClick={() => setCallOutcome(item.en)}
                          className={`p-3 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                            callOutcome === item.en
                              ? 'bg-md-primary/10 border-md-primary text-md-primary shadow-2xs'
                              : 'bg-md-surface border-md-surface-variant text-md-on-surface-variant hover:bg-md-surface-variant/30'
                          }`}
                        >
                          {isUrdu ? item.ur : item.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Client Status Updates (Required in SOP) */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase block select-none">
                      {isUrdu ? "کلائنٹ ہیلتھ اسٹیٹس اپ ڈیٹ کریں" : "Assess Client Health Status (SOP Trigger)"}
                    </label>
                    <div className="grid grid-cols-4 gap-1 bg-md-surface-container-low p-1 rounded-xl border border-md-surface-variant">
                      {(['Active', 'Warning', 'Critical', 'Inactive'] as const).map((health) => {
                        const hLabel = isUrdu 
                          ? (health === 'Active' ? 'فعال' : health === 'Warning' ? 'وارننگ' : health === 'Critical' ? 'نازک' : 'غیرفعال')
                          : health;
                        return (
                          <button
                            key={health}
                            type="button"
                            onClick={() => setUpdatedClientHealth(health)}
                            className={`py-2 text-[10px] font-bold rounded-lg text-center cursor-pointer ${
                              updatedClientHealth === health
                                ? health === 'Critical' ? 'bg-red-500 text-white shadow-xs' :
                                  health === 'Warning' ? 'bg-amber-500 text-white shadow-xs' :
                                  health === 'Active' ? 'bg-emerald-500 text-white shadow-xs' : 'bg-gray-500 text-white shadow-xs'
                                : 'text-md-outline hover:text-md-on-surface hover:bg-md-surface-variant/20'
                            }`}
                          >
                            {hLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Call Remarks */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase block">
                      {isUrdu ? "کال سیشن ریمارکس (اختیاری)" : "Call Session Remarks (Optional)"}
                    </label>
                    <input
                      type="text"
                      placeholder={isUrdu ? "مثال: پرنٹر کی سیٹنگ درست ہو گئی ہے اور کسٹمر مطمئن ہے۔" : "e.g. Printer is working perfectly fine now. Backups verified."}
                      value={callRemarks}
                      onChange={(e) => setCallRemarks(e.target.value)}
                      className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-3 text-xs text-md-on-surface"
                    />
                  </div>

                  <button
                    onClick={handleLogCall}
                    className="w-full py-3.5 bg-md-primary hover:bg-md-primary/95 text-md-on-primary rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <UserCheck size={14} />
                    <span>{isUrdu ? "کال لاگ محفوظ کریں" : "Commit Call Log to Sheet"}</span>
                  </button>
                </div>
              )}

              {/* OUTREACH TYPE 2: WHATSAPP OUTBOX DIALOG */}
              {outreachType === 'whatsapp' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-md-surface-variant pb-2 select-none">
                    <div>
                      <h3 className="text-sm font-black text-md-on-surface flex items-center gap-2">
                        <MessageSquare size={16} className="text-emerald-600 animate-pulse" />
                        <span>{isUrdu ? "واٹس ایپ میسج آؤٹ باکس ٹیمپلیٹ" : "WhatsApp Script Outbox Template"}</span>
                      </h3>
                      <p className="text-[10px] text-md-outline mt-0.5">
                        {isUrdu ? "کلائنٹ:" : "Client:"} <strong>{activeOutreachFollowUp.clientName}</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveOutreachFollowUp(null);
                        setOutreachType(null);
                      }}
                      className="p-1 rounded-full hover:bg-md-surface-variant/40"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Choose Template */}
                  <div className="space-y-1 select-none">
                    <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase block">
                      {isUrdu ? "میسج ٹیمپلیٹ منتخب کریں" : "Select Messaging Template (Zero Typing)"}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {whatsappTemplates.map((tpl) => {
                        const titleLabel = isUrdu
                          ? (tpl.id === '1' ? 'روزانہ چیک ان' : tpl.id === '2' ? 'لائسنس الرٹ' : 'سیٹ اپ آڈٹ')
                          : tpl.title;
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => setSelectedTemplateId(tpl.id)}
                            className={`p-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer text-[10px] ${
                              selectedTemplateId === tpl.id
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-2xs'
                                : 'bg-md-surface border-md-surface-variant text-md-on-surface-variant hover:bg-md-surface-variant/30'
                            }`}
                          >
                            {titleLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Render Message Box */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase block">
                      {isUrdu ? "تیار کردہ میسج (کاپی ہو جائے گا)" : "Live Draft Script (Copies on Commit)"}
                    </label>
                    <div className="p-3.5 rounded-2xl border border-emerald-300 bg-emerald-500/5 text-xs text-md-on-surface leading-relaxed whitespace-pre-wrap select-all font-medium">
                      {activeTemplateText}
                    </div>
                  </div>

                  {/* Quick Remarks */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase block">
                      {isUrdu ? "اندرونی نوٹس (اختیاری)" : "Internal WhatsApp Log Notes (Optional)"}
                    </label>
                    <input
                      type="text"
                      placeholder={isUrdu ? "مثال: کلائنٹ کو رینیول میسج واٹس ایپ کیا گیا۔" : "e.g. Sent renewal follow-up message on client request."}
                      value={whatsappRemarks}
                      onChange={(e) => setWhatsappRemarks(e.target.value)}
                      className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-3 text-xs text-md-on-surface"
                    />
                  </div>

                  <button
                    onClick={handleSendWhatsApp}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <MessageSquare size={14} />
                    <span>{isUrdu ? "کاپی کریں اور مکمل مارک کریں" : "Copy Draft & Mark Completed"}</span>
                  </button>
                </div>
              )}

              {/* OUTREACH TYPE 3: RESCHEDULE PICKER SHEET */}
              {outreachType === 'reschedule' && (
                <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-md-surface-variant pb-2">
                    <div>
                      <h3 className="text-sm font-black text-md-on-surface flex items-center gap-2">
                        <CalendarClock size={16} className="text-blue-600" />
                        <span>{isUrdu ? "دوبارہ فالو اپ کا وقت طے کریں" : "Reschedule Outreach Callback"}</span>
                      </h3>
                      <p className="text-[10px] text-md-outline mt-0.5">
                        {isUrdu ? "کلائنٹ:" : "Operational retry planner for:"} <strong>{activeOutreachFollowUp.clientName}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveOutreachFollowUp(null);
                        setOutreachType(null);
                      }}
                      className="p-1 rounded-full hover:bg-md-surface-variant/40"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Date, Time inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
                        {isUrdu ? "نئی تاریخ *" : "New Due Date *"}
                      </label>
                      <input
                        type="date"
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        required
                        className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-3 text-xs font-semibold font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
                        {isUrdu ? "نیا وقت *" : "New Due Time *"}
                      </label>
                      <input
                        type="time"
                        value={rescheduleTime}
                        onChange={(e) => setRescheduleTime(e.target.value)}
                        required
                        className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-3 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Reschedule explanation */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
                      {isUrdu ? "دوبارہ وقت دینے کی وجہ *" : "Rescheduling Reason / Remarks *"}
                    </label>
                    <input
                      type="text"
                      placeholder={isUrdu ? "مثال: کلائنٹ نے شام کے وقت رابطہ کرنے کو کہا۔" : "e.g. Client requested callback in the evening."}
                      value={rescheduleRemarks}
                      onChange={(e) => setRescheduleRemarks(e.target.value)}
                      required
                      className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-3 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <CalendarClock size={14} />
                    <span>{isUrdu ? "نیا وقت محفوظ کریں" : "Confirm Reschedule Log"}</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CALENDAR PREVIEW MODAL (Operation Manager Req #1: "calander par ek option rahena jis se preview check kar sakte hai") */}
      <AnimatePresence>
        {isCalendarPreviewOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setIsCalendarPreviewOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col"
            >
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2.5">
                  <CalendarClock size={20} className="text-blue-600" />
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      {isUrdu ? 'کیلنڈر پریویو (فالو اپس اور ورک لاگ شیڈول)' : 'Interactive Calendar Preview (Follow-Ups & Daily Work Logs)'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Select any date to preview all scheduled client follow-ups and logged support sessions.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCalendarPreviewOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-500/5 p-3.5 rounded-2xl border border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Select Preview Date:</span>
                    <input
                      type="date"
                      value={previewDate}
                      onChange={e => setPreviewDate(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-blue-400 bg-white dark:bg-slate-900 font-mono font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[-1, 0, 1, 2, 3].map(offset => {
                      const d = new Date();
                      d.setDate(d.getDate() + offset);
                      const dStr = d.toISOString().split('T')[0];
                      const count = followUps.filter(f => f.scheduledDate === dStr).length;
                      return (
                        <button
                          key={offset}
                          type="button"
                          onClick={() => setPreviewDate(dStr)}
                          className={`px-2.5 py-1.5 rounded-xl font-mono text-[11px] font-bold border cursor-pointer ${
                            previewDate === dStr
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {offset === 0 ? 'Today' : offset === -1 ? 'Yest' : dStr.slice(5)} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preview List for Selected Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 dark:text-white uppercase text-xs">
                      📌 Scheduled Follow-Ups on {previewDate} (
                      {followUps.filter(f => f.scheduledDate === previewDate).length})
                    </h4>
                    {followUps.filter(f => f.scheduledDate === previewDate).length === 0 ? (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-center">
                        No follow-ups scheduled for {previewDate}.
                      </div>
                    ) : (
                      followUps
                        .filter(f => f.scheduledDate === previewDate)
                        .map(f => (
                          <div
                            key={f.id}
                            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-white">{f.clientName}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 font-bold">
                                {f.scheduledTime} • {f.status}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300">{f.reason}</p>
                            <span className="text-[10px] font-mono text-blue-600 block">
                              👤 Executive: {f.executiveName} ({f.teId})
                            </span>
                          </div>
                        ))
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 dark:text-white uppercase text-xs">
                      📋 Work Logs Recorded on {previewDate} (
                      {workLogs.filter(w => w.date === previewDate).length})
                    </h4>
                    {workLogs.filter(w => w.date === previewDate).length === 0 ? (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-center">
                        No work logs recorded on {previewDate}.
                      </div>
                    ) : (
                      workLogs
                        .filter(w => w.date === previewDate)
                        .map(w => (
                          <div
                            key={w.id}
                            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-white">{w.clientName}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 font-bold">
                                {w.durationMinutes}m • {w.status}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 line-clamp-2">{w.details}</p>
                            <span className="text-[10px] font-mono text-indigo-600 block">
                              👤 Executive: {w.executiveName}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER SHEETS MAPPING DEFINITIONS */}
      <div className="py-2.5 px-4 rounded-xl border border-md-surface-variant/60 bg-md-surface-container-low text-[10px] font-mono text-md-outline flex flex-col gap-1.5 select-none">
        <div className="flex items-center justify-between gap-1">
          <span>Mapped Sheets Name: {SHEETS_MAPPING_CONFIG.FOLLOW_UP_TRACKER.sheetName}</span>
          <span className="font-extrabold text-md-primary">CONFIGURABLE COLUMN MAPPING LAYER ACTIVE</span>
        </div>
        <div className="text-[9px] text-md-outline/85 leading-relaxed truncate">
          Row Schema: [{SHEETS_MAPPING_CONFIG.FOLLOW_UP_TRACKER.columns.map(col => `${col.columnLetter}:${col.headerName}`).join(', ')}]
        </div>
      </div>
    </div>
  );
};
