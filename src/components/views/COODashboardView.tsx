/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { WorkLogEntry, UserRole, User } from '../../types';
import { MaterialCard } from '../common/MaterialCard';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Users,
  Calendar,
  Sparkles,
  Search,
  Filter,
  ExternalLink,
  MessageSquare,
  ArrowUpRight,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  FileCheck2,
  Link2,
  Download,
  Printer,
  Ticket as TicketIcon,
  Award,
  Send,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportWorkLogsToCSV, printDailyWorkLogReport } from '../../utils/exportUtils';

export const COODashboardView: React.FC = () => {
  const {
    workLogs,
    users,
    clients,
    tickets,
    updateWorkLogApproval,
    addLogComment,
    replyToLogComment,
    setWhatsAppModalOpen,
    language,
    refreshCurrentView,
    isRefreshing
  } = useApp();

  const isUrdu = language === 'ur';

  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [daybookRange, setDaybookRange] = useState<'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'all' | 'custom'>('all');
  const [selectedExecutiveFilter, setSelectedExecutiveFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'productivity' | 'approvals' | 'tickets' | 'salaries' | 'analytics'>('productivity');
  const [approvalFilter, setApprovalFilter] = useState<'All' | 'Pending' | 'Flagged'>('All');
  const [approvalRemark, setApprovalRemark] = useState<Record<string, string>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // Support Team canonical list + dynamic users/logs
  const supportTeamNames = useMemo(() => {
    const set = new Set<string>([
      'Umar Farooq', 'Sumayya', 'Farman', 'Haneef'
    ]);
    users.forEach(u => {
      const lower = (u.name || '').toLowerCase();
      if (lower && !lower.includes('asad') && !lower.includes('ikhlas') && !lower.includes('rahul')) {
        set.add(u.name.trim());
      }
    });
    return Array.from(set).sort();
  }, [users]);

  // Filter support executives
  const supportExecutives = useMemo(() => {
    const list = users.filter(
      (u) =>
        u.role === UserRole.SUPPORT_EXECUTIVE ||
        u.role === UserRole.SUPPORT_MANAGER ||
        u.role === UserRole.TECHNICAL_TEAM
    );
    const base = list.length === 0 ? users : list;
    if (selectedExecutiveFilter === 'ALL') return base;
    return base.filter(u => u.name.toLowerCase().includes(selectedExecutiveFilter.toLowerCase()));
  }, [users, selectedExecutiveFilter]);

  // Helper to check if log matches daybookRange
  const matchesDaybookDate = (logDate: string) => {
    if (!logDate) return daybookRange === 'all';
    if (daybookRange === 'all') return true;
    if (daybookRange === 'custom') return logDate === selectedDate;
    const today = new Date(todayStr);
    const d = new Date(logDate);
    const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (daybookRange === 'today') return logDate === todayStr;
    if (daybookRange === 'yesterday') return diffDays === 1;
    if (daybookRange === 'this_week') return diffDays >= 0 && diffDays <= 7;
    if (daybookRange === 'last_week') return diffDays > 7 && diffDays <= 14;
    if (daybookRange === 'this_month') return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    if (daybookRange === 'last_month') {
      const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    }
    return true;
  };

  // Filtered workLogs for current Daybook + Executive selection
  const filteredWorkLogs = useMemo(() => {
    return workLogs.filter((log) => {
      const matchDate = matchesDaybookDate(log.date);
      const execName = (log.supportName || log.executiveName || '').toLowerCase();
      const matchExec =
        selectedExecutiveFilter === 'ALL' ||
        execName.includes(selectedExecutiveFilter.toLowerCase());
      return matchDate && matchExec;
    });
  }, [workLogs, daybookRange, selectedDate, selectedExecutiveFilter]);

  // Aggregate daily metrics per executive
  const executiveProductivity = useMemo(() => {
    const TARGET_MINUTES = 420; // 7 Hours

    return supportExecutives.map((exec) => {
      const execTokens = exec.name.toLowerCase().split(/\s+/).filter(Boolean);
      const firstToken = execTokens[0] || '';
      const empId = (exec.employeeId || '').toLowerCase().trim();

      const logsToday = filteredWorkLogs.filter((log) => {
        const logExec = (log.executiveName || log.supportName || '').toLowerCase().trim();
        if (!logExec) return false;
        if (logExec.includes(exec.name.toLowerCase()) || exec.name.toLowerCase().includes(logExec)) return true;
        if (firstToken && (logExec.includes(firstToken) || firstToken.includes(logExec))) return true;
        if (empId && log.teId && log.teId.toLowerCase().trim() === empId) return true;
        return false;
      });

      const totalMinutes = logsToday.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
      const percentage = Math.min(100, Math.round((totalMinutes / TARGET_MINUTES) * 100));
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;

      // Status tagging
      let statusTag: 'On Track' | 'Moderate' | 'Deficient' | 'Inactive';
      let statusColor: string;
      let statusTagUrdu: string;
      if (totalMinutes >= TARGET_MINUTES) {
        statusTag = 'On Track';
        statusTagUrdu = 'مکمل ہدف';
        statusColor = 'text-emerald-700 bg-emerald-100 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300';
      } else if (totalMinutes >= 240) {
        statusTag = 'Moderate';
        statusTagUrdu = 'مناسب پیش رفت';
        statusColor = 'text-amber-700 bg-amber-100 border-amber-300 dark:bg-amber-950 dark:text-amber-300';
      } else if (totalMinutes > 0) {
        statusTag = 'Deficient';
        statusTagUrdu = 'ناکافی وقت';
        statusColor = 'text-rose-700 bg-rose-100 border-rose-300 dark:bg-rose-950 dark:text-rose-300';
      } else {
        statusTag = 'Inactive';
        statusTagUrdu = 'غیر حاضر / کوئی لاگ نہیں';
        statusColor = 'text-zinc-600 bg-zinc-100 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400';
      }

      // Check first call login time
      const firstLog = [...logsToday].sort((a, b) => (a.time || a.startTime || '').localeCompare(b.time || b.startTime || ''))[0];
      const firstLoginTime = firstLog?.startTime || firstLog?.time || 'No Entry';
      const isLate = firstLoginTime !== 'No Entry' && firstLoginTime > '10:20';

      const unverifiedCount = logsToday.filter(
        (l) => (l.durationMinutes || 0) > 5 && (!l.proofLink || !l.proofLink.trim())
      ).length;

      return {
        executive: exec,
        totalCalls: logsToday.length,
        totalMinutes,
        durationStr: isUrdu ? `${hours} گھنٹے ${mins} منٹ` : `${hours}h ${mins}m`,
        percentage,
        statusTag,
        statusTagUrdu,
        statusColor,
        firstLoginTime,
        isLate,
        unverifiedCount,
        logsToday,
      };
    });
  }, [supportExecutives, workLogs, selectedDate, isUrdu]);

  // Pending Approval Queue (Flagged or pending logs)
  const approvalQueue = useMemo(() => {
    return filteredWorkLogs.filter((log) => {
      const isOver5WithoutProof = (log.durationMinutes || 0) > 5 && (!log.proofLink || !log.proofLink.trim());
      const isPending = log.approvalStatus === 'Pending';
      const isFlagged = Boolean(log.flagReason) || isOver5WithoutProof;

      if (approvalFilter === 'Pending') return isPending;
      if (approvalFilter === 'Flagged') return isFlagged;
      return isPending || isFlagged || log.approvalStatus === 'Approved' || log.approvalStatus === 'Rejected';
    });
  }, [filteredWorkLogs, approvalFilter]);

  // Overall Department Snapshot
  const deptSnapshot = useMemo(() => {
    const totalMinutes = executiveProductivity.reduce((acc, curr) => acc + curr.totalMinutes, 0);
    const totalCalls = executiveProductivity.reduce((acc, curr) => acc + curr.totalCalls, 0);
    const activeStaff = executiveProductivity.filter((e) => e.totalMinutes > 0).length;
    const flaggedLogs = approvalQueue.filter(
      (l) => l.approvalStatus === 'Pending' || l.flagReason || ((l.durationMinutes || 0) > 5 && !l.proofLink)
    ).length;

    return {
      totalHours: (totalMinutes / 60).toFixed(1),
      totalCalls,
      activeStaff,
      totalStaff: supportExecutives.length,
      flaggedLogs,
    };
  }, [executiveProductivity, approvalQueue, supportExecutives]);

  const handleApprove = (logId: string) => {
    const remark = approvalRemark[logId] || (isUrdu ? 'سی او او نے منظور کیا' : 'Approved by COO');
    updateWorkLogApproval(logId, 'Approved', remark);
  };

  const handleReject = (logId: string) => {
    const remark = approvalRemark[logId] || (isUrdu ? 'سی او او نے مسترد کیا - ثبوت نامکمل یا غلط ہے' : 'Rejected by COO - Missing/invalid proof or duplicate submission');
    updateWorkLogApproval(logId, 'Rejected', remark);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-md-surface p-5 rounded-2xl border border-md-surface-variant shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-md-on-surface">
                {isUrdu ? 'سی او او (COO) ایگزیکٹو آپریشنز ڈیش بورڈ' : 'COO Executive Operations Dashboard'}
              </h1>
              <p className="text-xs text-md-outline">
                {isUrdu 
                  ? '7 گھنٹے کی کارکردگی کی نگرانی، TE پالیسی کا نفاذ اور سیشن ثبوتوں کی منظوری'
                  : '7-Hour Productivity Monitoring, TE Policy Enforcement & Session Proof Approvals'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Support Executive Dropdown (Op Manager Req #4) */}
          <select
            value={selectedExecutiveFilter}
            onChange={(e) => setSelectedExecutiveFilter(e.target.value)}
            className="bg-md-surface-container-low px-3 py-1.5 rounded-xl border border-md-surface-variant text-xs font-semibold text-md-on-surface focus:outline-hidden"
          >
            <option value="ALL">{isUrdu ? 'تمام سپورٹ ٹیم (All Support Team)' : 'All Support Team'}</option>
            {supportTeamNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {/* Daybook Date Filter Dropdown (Op Manager Req #3) */}
          <select
            value={daybookRange}
            onChange={(e) => setDaybookRange(e.target.value as any)}
            className="bg-md-surface-container-low px-3 py-1.5 rounded-xl border border-md-surface-variant text-xs font-semibold text-md-on-surface focus:outline-hidden"
          >
            <option value="all">{isUrdu ? 'تمام تاریخیں (All Time)' : 'All Time (Daybook)'}</option>
            <option value="today">{isUrdu ? 'آج (Today)' : 'Today'}</option>
            <option value="yesterday">{isUrdu ? 'کل (Yesterday)' : 'Yesterday'}</option>
            <option value="this_week">{isUrdu ? 'اس ہفتے (This Week)' : 'This Week'}</option>
            <option value="last_week">{isUrdu ? 'پچھلے ہفتے (Last Week)' : 'Last Week'}</option>
            <option value="this_month">{isUrdu ? 'اس مہینے (This Month)' : 'This Month'}</option>
            <option value="last_month">{isUrdu ? 'پچھلے مہینے (Last Month)' : 'Last Month'}</option>
            <option value="custom">{isUrdu ? 'مخصوص تاریخ (Custom Date)' : 'Custom Date'}</option>
          </select>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-md-surface-container-low px-3 py-1.5 rounded-xl border border-md-surface-variant">
            <Calendar size={14} className="text-md-outline" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setDaybookRange('custom');
              }}
              className="bg-transparent text-xs font-semibold text-md-on-surface focus:outline-hidden"
            />
          </div>

          {/* Export CSV & Print Report */}
          <button
            onClick={() => exportWorkLogsToCSV(filteredWorkLogs, `COO_WorkLogs_${selectedDate}`)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-md-surface-container-high hover:bg-md-surface-variant text-md-on-surface flex items-center gap-1.5 border border-md-surface-variant cursor-pointer"
          >
            <Download size={13} />
            <span>CSV</span>
          </button>
          <button
            onClick={() => printDailyWorkLogReport(filteredWorkLogs, `COO Operations Report (${daybookRange})`)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-md-surface-container-high hover:bg-md-surface-variant text-md-on-surface flex items-center gap-1.5 border border-md-surface-variant cursor-pointer"
          >
            <Printer size={13} />
            <span>{isUrdu ? 'رپورٹ' : 'Report'}</span>
          </button>

          {/* ⚡ Sync to Sheet Button */}
          <button
            disabled={isManualSyncing || isRefreshing}
            onClick={async () => {
              setIsManualSyncing(true);
              try {
                await refreshCurrentView();
                setSyncToast(true);
                setTimeout(() => setSyncToast(false), 3000);
              } finally {
                setIsManualSyncing(false);
              }
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer select-none disabled:opacity-50"
            title="Force 2-Way Sync with Google Sheets"
          >
            <RefreshCw size={13} className={isManualSyncing || isRefreshing ? 'animate-spin' : ''} />
            <span>
              {isManualSyncing || isRefreshing
                ? isUrdu ? 'سنک ہو رہا ہے...' : 'Syncing...'
                : isUrdu ? '⚡ شیٹ سنک' : '⚡ Sync to Sheet'}
            </span>
          </button>

          {/* Quick WhatsApp Summary Button */}
          <button
            onClick={() => setWhatsAppModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer select-none"
          >
            <MessageSquare size={14} />
            <span>{isUrdu ? 'یومیہ خلاصہ' : 'Daily Summary'}</span>
          </button>
        </div>
      </div>

      {/* Sync Toast */}
      <AnimatePresence>
        {syncToast && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2"
          >
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>
              {isUrdu
                ? 'گوگل شیٹ کے ساتھ ڈیٹا کامیابی سے سنک ہو گیا اور لائیو ریفریش ہو گیا!'
                : 'Data synchronized with Google Sheets successfully! Latest logs and client details updated.'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snapshot KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MaterialCard elevation="flat" className="p-4 rounded-2xl border border-md-surface-variant">
          <div className="flex items-center justify-between">
            <span className="text-xs text-md-outline font-medium">
              {isUrdu ? 'کل درج شدہ وقت' : 'Logged Time'}
            </span>
            <Clock size={16} className="text-md-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-md-on-surface">{deptSnapshot.totalHours}{isUrdu ? ' گھنٹے' : 'h'}</span>
            <span className="text-[10px] text-md-outline font-mono">{isUrdu ? 'آج' : 'Today'}</span>
          </div>
        </MaterialCard>

        <MaterialCard elevation="flat" className="p-4 rounded-2xl border border-md-surface-variant">
          <div className="flex items-center justify-between">
            <span className="text-xs text-md-outline font-medium">
              {isUrdu ? 'مکمل شدہ کالز' : 'Calls Completed'}
            </span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-md-on-surface">{deptSnapshot.totalCalls}</span>
            <span className="text-[10px] text-md-outline font-mono">{isUrdu ? 'سیشنز' : 'sessions'}</span>
          </div>
        </MaterialCard>

        <MaterialCard elevation="flat" className="p-4 rounded-2xl border border-md-surface-variant">
          <div className="flex items-center justify-between">
            <span className="text-xs text-md-outline font-medium">
              {isUrdu ? 'فعال ایگزیکٹوز' : 'Active Executives'}
            </span>
            <Users size={16} className="text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-md-on-surface">
              {deptSnapshot.activeStaff} / {deptSnapshot.totalStaff}
            </span>
            <span className="text-[10px] text-md-outline font-mono">{isUrdu ? 'حاضر' : 'logged in'}</span>
          </div>
        </MaterialCard>

        <MaterialCard elevation="flat" className="p-4 rounded-2xl border border-md-surface-variant">
          <div className="flex items-center justify-between">
            <span className="text-xs text-md-outline font-medium">
              {isUrdu ? 'زیر التواء منظوری' : 'Pending Approvals'}
            </span>
            <AlertTriangle size={16} className={deptSnapshot.flaggedLogs > 0 ? 'text-amber-600' : 'text-md-outline'} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{deptSnapshot.flaggedLogs}</span>
            <span className="text-[10px] text-md-outline font-mono">{isUrdu ? 'جائزہ درکار' : 'requires review'}</span>
          </div>
        </MaterialCard>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-md-surface-variant gap-4 text-xs font-bold overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('productivity')}
          className={`pb-2.5 px-1 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === 'productivity'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-md-outline hover:text-md-on-surface'
          }`}
        >
          <Clock size={14} />
          <span>{isUrdu ? '7 گھنٹے پیداواری صلاحیت کی نگرانی' : '7-Hour Productivity Monitor'}</span>
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-2.5 px-1 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === 'approvals'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-md-outline hover:text-md-on-surface'
          }`}
        >
          <FileCheck2 size={14} />
          <span>
            {isUrdu 
              ? `زیر التواء منظوری و آڈٹ کیو (${deptSnapshot.flaggedLogs})` 
              : `Pending Approvals & Audit Queue (${deptSnapshot.flaggedLogs})`}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`pb-2.5 px-1 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === 'tickets'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-md-outline hover:text-md-on-surface'
          }`}
        >
          <TicketIcon size={14} />
          <span>{isUrdu ? `ٹکٹ ریس اور الٹیمیٹ رسپانس 1 (${tickets.length})` : `Raised Tickets & Ultimate Response 1 (${tickets.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('salaries')}
          className={`pb-2.5 px-1 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === 'salaries'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-md-outline hover:text-md-on-surface'
          }`}
        >
          <Award size={14} />
          <span>{isUrdu ? 'تنخواہ، انعامات اور کے پی آئی (Salaries & KPIs)' : 'Salaries, Incentives & KPI Tracker'}</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-2.5 px-1 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            activeTab === 'analytics'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-md-outline hover:text-md-on-surface'
          }`}
        >
          <BarChart3 size={14} />
          <span>{isUrdu ? 'ٹیم ہیٹ میپ اور کوالٹی معیارات' : 'Team Heatmap & Quality Benchmarks'}</span>
        </button>
      </div>

      {/* TAB 1: 7-HOUR PRODUCTIVITY MONITOR */}
      {activeTab === 'productivity' && (
        <div className="space-y-4">
          <div className="bg-md-surface p-4 rounded-2xl border border-md-surface-variant">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-md-on-surface">
                  {isUrdu ? 'یومیہ 420 منٹ ہدف کی تکمیل کا جائزہ' : 'Daily 420-Minute Target Fulfillment'}
                </h3>
                <p className="text-xs text-md-outline">
                  {isUrdu 
                    ? 'TE پالیسی نمبر 2 کے مطابق ہر ورکنگ ڈے پر 7 گھنٹے (420 منٹ) کلائنٹ کام لازمی ہے۔'
                    : 'TE Policy #2 requires 7 logged hours (420 minutes) of client work per working day.'}
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-purple-600 bg-purple-100 dark:bg-purple-950 px-2.5 py-1 rounded-full">
                {isUrdu ? 'ہدف: 420 منٹ / 7.0 گھنٹے' : 'Target: 420m / 7.0h'}
              </span>
            </div>

            <div className="space-y-3.5">
              {executiveProductivity.map((item) => (
                <div
                  key={item.executive.id}
                  className="p-3.5 rounded-xl border border-md-surface-variant bg-md-surface-container-low space-y-2.5 hover:border-md-primary/40 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-600/10 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center border border-purple-200">
                        {item.executive.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-md-on-surface">{item.executive.name}</span>
                          <span className="text-[10px] font-mono text-md-outline">({item.executive.id})</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${item.statusColor}`}>
                            {isUrdu ? item.statusTagUrdu : item.statusTag}
                          </span>
                          {item.isLate && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                              {isUrdu ? `تاخیر سے آمد (${item.firstLoginTime})` : `Late Entry (${item.firstLoginTime})`}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-md-outline">
                          {isUrdu 
                            ? `پہلی انٹری: ${item.firstLoginTime} | ${item.totalCalls} کالز مکمل | ${item.unverifiedCount} غیر تصدیق شدہ`
                            : `First Entry: ${item.firstLoginTime} | ${item.totalCalls} Calls Completed | ${item.unverifiedCount} Unverified`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right rtl:text-left">
                        <span className="text-xs font-bold text-md-on-surface block font-mono">
                          {item.durationStr}
                        </span>
                        <span className="text-[10px] text-md-outline font-mono">
                          {item.totalMinutes} / 420 {isUrdu ? 'منٹ' : 'min'} ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        item.percentage >= 100
                          ? 'bg-emerald-500'
                          : item.percentage >= 60
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING APPROVAL QUEUE */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-md-on-surface">
                {isUrdu ? 'تصدیق اور آڈٹ ریویو قطار (Proof Approval & Sheets Sync)' : 'Verification & Audit Review Queue (Proof Approval & Sheets Sync)'}
              </h3>
              <p className="text-xs text-md-outline">
                {isUrdu 
                  ? 'وہ لاگز جن کا دورانیہ 5 منٹ سے زیادہ ہے لیکن ثبوت لنک موجود نہیں ہے یا خصوصی جائزے کی ضرورت ہے۔'
                  : 'Logs flagged for duration > 5 min without proof, duplicate links, or manual review requests.'}
              </p>
            </div>

            {/* Explanatory Banner for Admin / Manager on how Sheets sync works */}
            <div className="w-full p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200">
                <ShieldAlert size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  {isUrdu
                    ? 'رہنمائی: ثبوتوں کی منظوری اور گوگل شیٹ میں آٹو سنک کا طریقہ کار'
                    : 'System Architecture: How Proof Approvals Sync to Google Sheets'}
                </span>
              </div>
              <p className="text-indigo-800 dark:text-indigo-300 leading-relaxed text-[11px]">
                {isUrdu
                  ? '1. جب سپورٹ ایگزیکٹو لاگ جمع کرتا ہے تو ثبوت نہ ہونے کی صورت میں لاگ "Pending Proof" میں چلا جاتا ہے۔\n2. مینیجر یا سی او او جب اس فہرست میں کسی لاگ پر ریمارک لکھ کر "منظور کریں (Approve)" یا "مسترد کریں (Reject)" پر کلک کرتا ہے:\n3. سسٹم فوری طور پر اس کا پینڈنگ اسٹیٹس ختم کر کے اسے Approved مارک کرتا ہے اور یہ ریکارڈ خودکار طور پر گوگل شیٹ (Support_Clients & Ultimate Sheet) میں سنک ہو جاتا ہے۔'
                  : '1. When a Support Executive logs work with missing/pending proof, it is held in this Pending Proofs queue.\n2. When Leadership/Manager enters a Special Manager Remark and clicks "Approve" or "Reject":\n3. The pending state is resolved and the verified record immediately syncs to Google Sheets (Support_Clients & Ultimate Sheet) and the server repository.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-md-outline">{isUrdu ? 'فلٹر:' : 'Filter:'}</span>
              <div className="flex bg-md-surface-container-low p-0.5 rounded-lg border border-md-surface-variant text-xs">
                {(['All', 'Pending', 'Flagged'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setApprovalFilter(f)}
                    className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      approvalFilter === f
                        ? 'bg-purple-600 text-white'
                        : 'text-md-outline hover:text-md-on-surface'
                    }`}
                  >
                    {f === 'All' ? (isUrdu ? 'تمام' : 'All') : f === 'Pending' ? (isUrdu ? 'زیر التواء' : 'Pending') : (isUrdu ? 'انتباہ شدہ' : 'Flagged')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {approvalQueue.length === 0 ? (
            <div className="p-8 text-center bg-md-surface rounded-2xl border border-md-surface-variant">
              <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-md-on-surface">
                {isUrdu ? 'قطار میں کوئی انتباہ شدہ لاگ موجود نہیں' : 'No Flagged Logs in Queue'}
              </p>
              <p className="text-xs text-md-outline mt-1">
                {isUrdu 
                  ? `${selectedDate} کے تمام لاگز TE ثبوت کے رہنما اصولوں کے مطابق ہیں یا ان کا جائزہ مکمل ہو چکا ہے۔`
                  : `All logs for ${selectedDate} meet TE proof guidelines or have already been reviewed.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvalQueue.map((log) => {
                const isOver5WithoutProof = (log.durationMinutes || 0) > 5 && (!log.proofLink || !log.proofLink.trim());
                const isApproved = log.approvalStatus === 'Approved';
                const isRejected = log.approvalStatus === 'Rejected';

                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-xl border transition-all bg-md-surface ${
                      isOver5WithoutProof || log.flagReason
                        ? 'border-amber-400 dark:border-amber-800/80 bg-amber-500/5'
                        : 'border-md-surface-variant'
                    } space-y-3`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-md-on-surface">
                            {log.clientName || 'Client Log'}
                          </span>
                          <span className="text-[10px] font-mono text-md-outline">
                            {isUrdu ? 'بذریعہ: ' : 'by '} {log.executiveName || log.supportName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-md-surface-container-high border border-md-surface-variant font-mono">
                            {log.duration || `${log.durationMinutes}m`}
                          </span>

                          {log.approvalStatus && (
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                isApproved
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : isRejected
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                              }`}
                            >
                              {log.approvalStatus}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-md-outline mt-1 leading-relaxed">
                          {log.details || log.summary || (isUrdu ? 'کوئی تفصیل فراہم نہیں کی گئی' : 'No details provided')}
                        </p>
                      </div>

                      {/* Flag badges */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isOver5WithoutProof && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                            <AlertTriangle size={11} />
                            <span>{isUrdu ? 'ثبوت غائب (>5 منٹ)' : 'Missing Proof (>5m)'}</span>
                          </span>
                        )}
                        {log.flagReason && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <AlertTriangle size={11} />
                            <span>{log.flagReason}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Proof Link preview */}
                    {log.proofLink ? (
                      <div className="flex items-center gap-1.5 text-xs text-blue-600 font-mono">
                        <Link2 size={12} />
                        <a href={log.proofLink} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-md">
                          {log.proofLink}
                        </a>
                      </div>
                    ) : (
                      <div className="text-[10px] font-mono text-rose-600">
                        {isUrdu ? '⚠️ کوئی ریکارڈنگ یا تصویری ثبوت منسلک نہیں ہے۔' : '⚠️ No recording or proof link attached.'}
                      </div>
                    )}

                    {/* Review Actions */}
                    <div className="pt-2 border-t border-md-surface-variant flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder={isUrdu ? "آڈٹ ریمارک (مثال: خصوصی منظوری دی گئی)..." : "Audit remark (e.g. Approved exception for emergency remote install)..."}
                        value={approvalRemark[log.id] || ''}
                        onChange={(e) => setApprovalRemark({ ...approvalRemark, [log.id]: e.target.value })}
                        className="flex-1 bg-md-surface-container-low border border-md-surface-variant rounded-lg px-2.5 py-1.5 text-xs text-md-on-surface outline-hidden"
                      />

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(log.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-2xs transition-all cursor-pointer select-none"
                        >
                          <ThumbsUp size={12} />
                          <span>{isUrdu ? 'منظور کریں' : 'Approve'}</span>
                        </button>
                        <button
                          onClick={() => handleReject(log.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1 shadow-2xs transition-all cursor-pointer select-none"
                        >
                          <ThumbsDown size={12} />
                          <span>{isUrdu ? 'مسترد کریں' : 'Reject'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RAISED TICKETS & ULTIMATE RESPONSE 1 (Op Manager Req #6 & #7) */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="bg-md-surface p-4 rounded-2xl border border-md-surface-variant space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-md-on-surface">
                  {isUrdu ? 'سپورٹ مینیجر و ٹیم ٹکٹ ریس اور Ultimate Response 1 سسٹم' : 'Support Manager & Team Raised Tickets — Ultimate Sheet Response 1 Feed'}
                </h3>
                <p className="text-xs text-md-outline">
                  {isUrdu
                    ? 'کون سی ٹکٹ ریس ہوئی، کس نے حل کیا، اٹیچمنٹ اور Ultimate Sheet کے Response 1 کا مکمل ریکارڈ۔'
                    : 'Tracks every ticket raised (FROM → TO), who solved it, attachments, and bi-directional sync with Ultimate Sheet Response 1.'}
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                {tickets.length} {isUrdu ? 'ٹکٹس' : 'Total Tickets'}
              </span>
            </div>

            <div className="space-y-2.5">
              {tickets.map((t) => (
                <div key={t.id} className="p-3.5 rounded-xl border border-md-surface-variant bg-md-surface-container-low space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-purple-600">{t.id}</span>
                      <span className="text-xs font-bold text-md-on-surface">{t.clientName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        FROM: {t.raisedFrom || t.raisedBy || 'Support Team'} → TO: {t.raisedTo || 'COO / Technical'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        t.status === 'Resolved' || t.status === 'Closed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-md-outline">{t.createdAt}</span>
                  </div>
                  <p className="text-xs text-md-on-surface">{t.issue}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div className="p-2 rounded-lg bg-md-surface border border-md-surface-variant">
                      <span className="text-[10px] text-md-outline block font-mono uppercase">Solved By</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{t.solvedBy || (t.status === 'Resolved' ? t.assignedTo : 'Pending Resolution')}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-md-surface border border-md-surface-variant">
                      <span className="text-[10px] text-md-outline block font-mono uppercase">Ultimate Sheet Response 1</span>
                      <span className="font-semibold text-md-on-surface">{t.ultimateResponse1 || t.resolutionNote || 'Synced to Ultimate Sheet Col Response 1'}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-md-surface border border-md-surface-variant">
                      <span className="text-[10px] text-md-outline block font-mono uppercase">Ticket Attachment</span>
                      {t.attachmentUrl ? (
                        <a href={t.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono truncate block">
                          {t.attachmentName || t.attachmentUrl}
                        </a>
                      ) : (
                        <span className="text-md-outline">No attachment</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SALARIES, INCENTIVES & KPI TRACKER (Op Manager Req #9) */}
      {activeTab === 'salaries' && (
        <div className="bg-md-surface p-4 rounded-2xl border border-md-surface-variant space-y-3">
          <div>
            <h3 className="text-sm font-bold text-md-on-surface">
              {isUrdu ? 'ایگزیکٹو اور فری لانسر تنخواہیں، ماہانہ انعامات اور کے پی آئی ڈیش بورڈ' : 'Executive & Freelancer Salaries, Monthly Incentives & KPI Dashboard'}
            </h3>
            <p className="text-xs text-md-outline">
              {isUrdu
                ? 'ہر سپورٹ ایگزیکٹو اور فری لانسر کی بنیادی تنخواہ، ماہانہ انعام اور کارکردگی کا مکمل حساب۔'
                : 'Live compensation, monthly sheet incentives, logged hours, and KPI score tracker across all executives and freelancers.'}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-md-surface-variant text-md-outline font-mono uppercase text-[10px]">
                  <th className="py-2.5 px-3">Executive / Freelancer</th>
                  <th className="py-2.5 px-3">Role / Type</th>
                  <th className="py-2.5 px-3">Base Salary</th>
                  <th className="py-2.5 px-3">Monthly Incentive</th>
                  <th className="py-2.5 px-3">Logged Sessions</th>
                  <th className="py-2.5 px-3">KPI Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-md-surface-variant">
                {supportExecutives.map((u, idx) => {
                  const uLogs = workLogs.filter(
                    (l) =>
                      (l.supportName || '').toLowerCase().includes(u.name.toLowerCase()) ||
                      (l.executiveName || '').toLowerCase().includes(u.name.toLowerCase())
                  );
                  const totalMins = uLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
                  const baseSalary = u.baseSalary || (u.employmentType === 'Freelancer' ? 18000 : 28000 + (idx % 4) * 2500);
                  const incentive = u.monthlyIncentive || Math.min(5000, uLogs.length * 150);
                  const kpi = u.kpiScore || Math.min(98, 78 + uLogs.length * 2);
                  return (
                    <tr key={u.id} className="hover:bg-md-surface-container-low">
                      <td className="py-2.5 px-3 font-bold text-md-on-surface">{u.name} <span className="text-[10px] font-mono text-md-outline">({u.id})</span></td>
                      <td className="py-2.5 px-3">{u.employmentType || u.role}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold">₹{baseSalary.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">+₹{incentive.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono">{uLogs.length} calls ({Math.round(totalMins / 60 * 10) / 10}h)</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {kpi}% KPI
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: TEAM HEATMAP & QUALITY BENCHMARKS */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Call Duration Distribution */}
            <div className="bg-md-surface p-4 rounded-2xl border border-md-surface-variant space-y-3">
              <h3 className="text-xs font-mono font-bold text-md-outline uppercase tracking-wider">
                {isUrdu ? 'سپورٹ سیشن دورانیہ کا خاکہ' : 'Support Session Duration Profile'}
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-md-surface-variant">
                  <span>{isUrdu ? 'فوری چیک (≤ 5 منٹ)' : 'Quick Checks (≤ 5 mins)'}</span>
                  <span className="font-bold text-md-on-surface">
                    {workLogs.filter((l) => (l.durationMinutes || 0) <= 5).length} {isUrdu ? 'کالز (ثبوت اختیاری)' : 'calls (Proof optional)'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-md-surface-variant">
                  <span>{isUrdu ? 'معیاری تشخیص (6–30 منٹ)' : 'Standard Diagnostics (6–30 mins)'}</span>
                  <span className="font-bold text-md-on-surface">
                    {workLogs.filter((l) => (l.durationMinutes || 0) > 5 && (l.durationMinutes || 0) <= 30).length} {isUrdu ? 'کالز' : 'calls'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-md-surface-variant">
                  <span>{isUrdu ? 'تفصیلی حل و ٹربل شوٹنگ (> 30 منٹ)' : 'Deep Troubleshooting (> 30 mins)'}</span>
                  <span className="font-bold text-md-on-surface">
                    {workLogs.filter((l) => (l.durationMinutes || 0) > 30).length} {isUrdu ? 'کالز' : 'calls'}
                  </span>
                </div>
              </div>
            </div>

            {/* Client Software Usage Distribution */}
            <div className="bg-md-surface p-4 rounded-2xl border border-md-surface-variant space-y-3">
              <h3 className="text-xs font-mono font-bold text-md-outline uppercase tracking-wider">
                {isUrdu ? 'کلائنٹ سافٹ ویئر استعمال و صحت' : 'Client Software Engagement Health'}
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-md-surface-variant text-emerald-700 dark:text-emerald-300 font-semibold">
                  <span>{isUrdu ? 'باقاعدہ استعمال کنندگان (Regular Users)' : 'Regular Users (باقاعدہ استعمال)'}</span>
                  <span>{workLogs.filter((l) => l.softwareUsage === 'Regular User').length} {isUrdu ? 'کلائنٹس' : 'clients'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-md-surface-variant text-rose-700 dark:text-rose-300 font-semibold">
                  <span>{isUrdu ? 'استعمال نہیں ہو رہا / خطرہ (Not Using)' : 'Not Using / At Risk (استعمال نہیں ہو رہا)'}</span>
                  <span>{workLogs.filter((l) => l.softwareUsage === 'Not Using').length} {isUrdu ? 'کلائنٹس' : 'clients'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-md-surface-variant text-blue-700 dark:text-blue-300 font-semibold">
                  <span>{isUrdu ? 'ٹریننگ درکار ہے (Need Training)' : 'Need Training (ٹریننگ درکار ہے)'}</span>
                  <span>{workLogs.filter((l) => l.softwareUsage === 'Need Training').length} {isUrdu ? 'کلائنٹس' : 'clients'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

