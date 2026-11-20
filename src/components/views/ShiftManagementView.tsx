/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ModuleId, ShiftRecord, UserRole } from '../../types';
import {
  getLocalDateString,
  getLocalDateOffsetString,
  formatTimeHHMM,
  parseTimeToSeconds,
  isLogPendingProof
} from '../../utils/helpers';
import {
  Clock,
  Play,
  Square,
  Calendar,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  X,
  Plus,
  Search,
  MessageSquare,
  Link2,
  Coffee,
  Activity,
  Users
} from 'lucide-react';

const formatDurationFromMinutes = (totalMinutes: number): string => {
  const safe = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
};

const formatHHMMDisplay = (time24?: string): string => {
  if (!time24) return '--:--';
  const parts = time24.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return time24;
  const h24 = parts[0];
  const m = parts[1];
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
};

const computeShiftNetMinutes = (shift: ShiftRecord, nowTick: number): number => {
  if (!shift.shiftStartTime) return 0;
  const startSecs = parseTimeToSeconds(shift.shiftStartTime);
  const nowDate = new Date(nowTick);
  const endSecs = shift.shiftEndTime
    ? parseTimeToSeconds(shift.shiftEndTime)
    : nowDate.getHours() * 3600 + nowDate.getMinutes() * 60 + nowDate.getSeconds();

  let diffSecs = endSecs - startSecs;
  if (diffSecs < 0) diffSecs += 24 * 3600;
  const grossMins = Math.max(0, Math.round(diffSecs / 60));
  return Math.max(0, grossMins - (Number(shift.breakMinutes) || 0));
};

export const ShiftManagementView: React.FC = () => {
  const {
    currentUser,
    users,
    shifts,
    activeTodayShift,
    startDailyShift,
    endDailyShift,
    updateShiftRecord,
    workLogs,
    setCurrentModule,
    setLogoutModalOpen,
    setLoginWhatsAppModalOpen,
    openPendingProofModal,
    refreshCurrentView,
    isRefreshing,
    language
  } = useApp();

  const isUrdu = language === 'ur';
  const isManagerOrLeadership =
    currentUser?.role === UserRole.DIRECTOR ||
    currentUser?.role === UserRole.COO ||
    currentUser?.role === UserRole.OPERATION_MANAGER ||
    currentUser?.role === UserRole.SUPPORT_MANAGER ||
    currentUser?.role === UserRole.AI_ADMINISTRATOR;

  // Live clock tick (updates every second for real-time shift elapsed tracking)
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = getLocalDateString(new Date(nowTick));
  const yesterdayStr = getLocalDateOffsetString(-1, new Date(nowTick));
  const weekAgoStr = getLocalDateOffsetString(-7, new Date(nowTick));
  const liveClockStr = new Date(nowTick).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // Start / End form controls
  const [startTimeInput, setStartTimeInput] = useState<string>(() => formatTimeHHMM());
  const [endTimeInput, setEndTimeInput] = useState<string>(() => formatTimeHHMM());
  const [breakMinutesInput, setBreakMinutesInput] = useState<number>(0);
  const [targetHoursInput, setTargetHoursInput] = useState<number>(8);
  const [notesInput, setNotesInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sync inputs when activeTodayShift updates
  useEffect(() => {
    if (activeTodayShift) {
      setStartTimeInput(activeTodayShift.shiftStartTime || formatTimeHHMM());
      setEndTimeInput(activeTodayShift.shiftEndTime || formatTimeHHMM());
      setBreakMinutesInput(Number(activeTodayShift.breakMinutes) || 0);
      setTargetHoursInput(Math.round((activeTodayShift.targetShiftMinutes || 480) / 60));
      setNotesInput(activeTodayShift.notes || '');
    } else {
      setStartTimeInput(formatTimeHHMM());
      setBreakMinutesInput(0);
      setNotesInput('');
    }
  }, [activeTodayShift?.id, activeTodayShift?.shiftStartTime, activeTodayShift?.shiftEndTime]);

  // Ledger filters
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('week');
  const [execFilter, setExecFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    shiftStartTime: string;
    shiftEndTime: string;
    breakMinutes: number;
    status: 'Active' | 'Completed';
    notes: string;
  }>({
    shiftStartTime: '09:30',
    shiftEndTime: '',
    breakMinutes: 0,
    status: 'Active',
    notes: ''
  });

  const showNotice = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Match workLogs belonging to a given shift (same executive + date)
  const getLogsForShift = (shiftDate: string, execName: string, empId?: string) => {
    const cleanName = (execName || '').trim().toLowerCase();
    const firstToken = cleanName.split(/\s+/)[0] || '';
    const cleanEmp = (empId || '').trim().toLowerCase();
    return workLogs.filter(l => {
      if (l.date !== shiftDate) return false;
      const logExec = (l.executiveName || l.supportName || '').trim().toLowerCase();
      const logEmp = (l.teId || '').trim().toLowerCase();
      return (
        (cleanName && (logExec === cleanName || logExec.includes(cleanName) || cleanName.includes(logExec))) ||
        (firstToken && logExec.includes(firstToken)) ||
        (cleanEmp && logEmp === cleanEmp)
      );
    });
  };

  // Current executive's today logs & live shift reconciliation
  const todayMyLogs = useMemo(() => {
    return getLogsForShift(todayStr, currentUser?.name || '', currentUser?.employeeId);
  }, [workLogs, todayStr, currentUser]);

  const todayWorkStats = useMemo(() => {
    const loggedMinutes = todayMyLogs.reduce((acc, l) => acc + (Number(l.durationMinutes) || 0), 0);
    const pendingProofsCount = todayMyLogs.filter(l => isLogPendingProof(l, currentUser)).length;
    const verifiedProofsCount = todayMyLogs.length - pendingProofsCount;
    return {
      callsCount: todayMyLogs.length,
      loggedMinutes,
      pendingProofsCount,
      verifiedProofsCount
    };
  }, [todayMyLogs, currentUser]);

  const todayShiftNetMinutes = useMemo(() => {
    if (!activeTodayShift) return 0;
    return computeShiftNetMinutes(
      {
        ...activeTodayShift,
        breakMinutes: breakMinutesInput
      },
      nowTick
    );
  }, [activeTodayShift, breakMinutesInput, nowTick]);

  const todayBufferMinutes = Math.max(0, todayShiftNetMinutes - todayWorkStats.loggedMinutes);
  const todayUtilizationPct =
    todayShiftNetMinutes > 0
      ? Math.min(100, Math.round((todayWorkStats.loggedMinutes / todayShiftNetMinutes) * 100))
      : 0;
  const policyTargetPct = Math.min(100, Math.round((todayWorkStats.loggedMinutes / 420) * 100));

  // Filter historical shifts for ledger
  const filteredShifts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return shifts.filter(s => {
      if (dateFilter === 'today' && s.date !== todayStr) return false;
      if (dateFilter === 'yesterday' && s.date !== yesterdayStr) return false;
      if (dateFilter === 'week' && s.date < weekAgoStr) return false;
      if (dateFilter === 'month' && s.date.slice(0, 7) !== todayStr.slice(0, 7)) return false;

      if (execFilter !== 'ALL') {
        const sExec = (s.executiveName || '').toLowerCase();
        const firstTok = execFilter.toLowerCase().split(/\s+/)[0];
        if (!sExec.includes(firstTok) && sExec !== execFilter.toLowerCase()) return false;
      }

      if (q) {
        const hay = `${s.executiveName} ${s.employeeId} ${s.date} ${s.notes || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [shifts, dateFilter, execFilter, searchQuery, todayStr, yesterdayStr, weekAgoStr]);

  const handleStartShift = async () => {
    setIsSaving(true);
    try {
      await startDailyShift(startTimeInput, notesInput, targetHoursInput * 60);
      showNotice(isUrdu ? 'آج کی شفٹ شروع ہو گئی۔' : 'Shift started and synced.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateActiveShiftTiming = async () => {
    if (!activeTodayShift) return;
    setIsSaving(true);
    try {
      await updateShiftRecord(activeTodayShift.id, {
        shiftStartTime: startTimeInput,
        shiftEndTime: activeTodayShift.status === 'Completed' ? endTimeInput : undefined,
        breakMinutes: Number(breakMinutesInput) || 0,
        targetShiftMinutes: (Number(targetHoursInput) || 8) * 60,
        notes: notesInput
      });
      showNotice(isUrdu ? 'شفٹ کے اوقات محفوظ ہو گئے۔' : 'Shift timings updated.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEndShift = async (openSummaryAfter = false) => {
    setIsSaving(true);
    try {
      const endT = formatTimeHHMM();
      await endDailyShift(activeTodayShift?.id, endT, Number(breakMinutesInput) || 0, notesInput);
      setEndTimeInput(endT);
      showNotice(isUrdu ? 'شفٹ اختتام پذیر ہو گئی۔' : 'Shift ended and recorded.');
      if (openSummaryAfter) {
        setLogoutModalOpen(true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReopenShift = async () => {
    if (!activeTodayShift) return;
    setIsSaving(true);
    try {
      await updateShiftRecord(activeTodayShift.id, {
        status: 'Active',
        shiftEndTime: undefined,
        shiftEndTimestamp: undefined
      });
      showNotice(isUrdu ? 'شفٹ دوبارہ فعال کر دی گئی۔' : 'Shift reopened as Active.');
    } finally {
      setIsSaving(false);
    }
  };

  const beginEditRow = (s: ShiftRecord) => {
    setEditingShiftId(s.id);
    setEditDraft({
      shiftStartTime: s.shiftStartTime || '09:30',
      shiftEndTime: s.shiftEndTime || '',
      breakMinutes: Number(s.breakMinutes) || 0,
      status: s.status,
      notes: s.notes || ''
    });
  };

  const saveEditRow = async (s: ShiftRecord) => {
    await updateShiftRecord(s.id, {
      shiftStartTime: editDraft.shiftStartTime,
      shiftEndTime: editDraft.shiftEndTime || undefined,
      breakMinutes: Number(editDraft.breakMinutes) || 0,
      status: editDraft.shiftEndTime ? 'Completed' : editDraft.status,
      notes: editDraft.notes
    });
    setEditingShiftId(null);
    showNotice(isUrdu ? 'ریکارڈ اپ ڈیٹ ہو گیا۔' : 'Shift record saved.');
  };

  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Employee ID',
      'Executive',
      'Role',
      'Shift Start',
      'Shift End',
      'Break (min)',
      'Net Reporting (min)',
      'Logged Client Calls',
      'Logged Work (min)',
      'Status',
      'Notes'
    ];
    const rows = filteredShifts.map(s => {
      const sLogs = getLogsForShift(s.date, s.executiveName, s.employeeId);
      const loggedMins = sLogs.reduce((acc, l) => acc + (Number(l.durationMinutes) || 0), 0);
      const netMins = computeShiftNetMinutes(s, nowTick);
      return [
        s.date,
        s.employeeId,
        `"${(s.executiveName || '').replace(/"/g, '""')}"`,
        `"${(s.role || '').replace(/"/g, '""')}"`,
        s.shiftStartTime || '',
        s.shiftEndTime || 'Active',
        s.breakMinutes || 0,
        netMins,
        sLogs.length,
        loggedMins,
        s.status,
        `"${(s.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TEDOS_Shifts_${todayStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const teamMembersList = useMemo(() => {
    const set = new Set<string>(['Umar Farooq', 'Farman', 'Haneef', 'Sumayya']);
    users.forEach(u => {
      if (u.role === UserRole.SUPPORT_EXECUTIVE || u.role === UserRole.SUPPORT_MANAGER) {
        set.add(u.name);
      }
    });
    return Array.from(set).sort();
  }, [users]);

  return (
    <div id="tedos-shift-management-view" className="max-w-7xl mx-auto space-y-6 pb-16 animate-fade-in">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isUrdu ? 'شفٹ مینیجمنٹ اور یومیہ حاضری' : 'Shift Management & Daily Attendance'}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                  activeTodayShift?.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                    : activeTodayShift?.status === 'Completed'
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                {activeTodayShift?.status === 'Active'
                  ? isUrdu ? 'شفٹ جاری ہے' : 'Shift Active'
                  : activeTodayShift?.status === 'Completed'
                  ? isUrdu ? 'شفٹ مکمل' : 'Shift Completed'
                  : isUrdu ? 'شفٹ شروع نہیں ہوئی' : 'Not Clocked In'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentUser?.name} ({currentUser?.employeeId}) • {isUrdu ? 'روزانہ شفٹ اوقات کار اور ورک لاگ مطابقت' : 'Record shift start & end times reconciled against daily client work logs'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right rtl:text-left">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">{todayStr}</span>
            <span className="text-sm font-mono font-bold text-slate-900 dark:text-white tabular-nums">{liveClockStr}</span>
          </div>

          <button
            type="button"
            onClick={() => setLoginWhatsAppModalOpen(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
          >
            <MessageSquare size={14} className="text-emerald-600" />
            <span>{isUrdu ? 'واٹس ایپ لاگ ان' : 'Attendance Msg'}</span>
          </button>

          {isManagerOrLeadership && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
            >
              <Download size={14} />
              <span>CSV</span>
            </button>
          )}

          <button
            type="button"
            disabled={isRefreshing}
            onClick={refreshCurrentView}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Primary Workspace Grid: Left Shift Clock Control + Right Integrated Work Log Reconciliation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 5 Columns: Shift Start / End Punch Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity size={16} className="text-blue-600" />
                <span>{isUrdu ? 'آج کی شفٹ کنٹرول' : "Today's Shift Clock-In / Out"}</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                {activeTodayShift ? `${formatHHMMDisplay(activeTodayShift.shiftStartTime)}` : todayStr}
              </span>
            </div>

            {/* Live Elapsed Reporting Counter */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                  {isUrdu ? 'کل شفٹ دورانیہ (وقفہ نکال کر)' : 'Net Reporting Duration'}
                </span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5 block">
                  {activeTodayShift ? formatDurationFromMinutes(todayShiftNetMinutes) : '0h 00m'}
                </span>
              </div>
              <div className="text-right rtl:text-left">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  {isUrdu ? 'مقررہ ہدف' : 'Shift Target'}
                </span>
                <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                  {targetHoursInput}h 00m
                </span>
              </div>
            </div>

            {/* Editable Shift Times */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  {isUrdu ? 'شفٹ شروع وقت' : 'Shift Start Time'}
                </label>
                <input
                  type="time"
                  value={startTimeInput}
                  onChange={e => setStartTimeInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  {isUrdu ? 'اختتام وقت' : 'Shift End Time'}
                </label>
                <input
                  type="time"
                  value={activeTodayShift?.status === 'Completed' ? endTimeInput : ''}
                  placeholder="--:--"
                  disabled={!activeTodayShift || activeTodayShift.status !== 'Completed'}
                  onChange={e => setEndTimeInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 mb-1">
                  <Coffee size={12} className="text-amber-600" />
                  <span>{isUrdu ? 'وقفہ / بریک (منٹ)' : 'Break Duration (min)'}</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={240}
                  step={5}
                  value={breakMinutesInput}
                  onChange={e => setBreakMinutesInput(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  {isUrdu ? 'کل شفٹ گھنٹے' : 'Standard Shift (hrs)'}
                </label>
                <select
                  value={targetHoursInput}
                  onChange={e => setTargetHoursInput(Number(e.target.value) || 8)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value={7}>7h (TE Client Target)</option>
                  <option value={8}>8h (Standard Duty)</option>
                  <option value={9}>9h (Full Reporting)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                {isUrdu ? 'شفٹ نوٹس (اختیاری)' : 'Shift Notes / Handover (Optional)'}
              </label>
              <input
                type="text"
                value={notesInput}
                onChange={e => setNotesInput(e.target.value)}
                placeholder={isUrdu ? 'آج کی شفٹ سے متعلق کوئی نوٹ...' : 'e.g., Morning follow-ups, technical training schedule...'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
            {!activeTodayShift ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleStartShift}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                <Play size={14} className="fill-current" />
                <span>{isUrdu ? 'آج کی شفٹ شروع کریں' : 'Start Daily Shift'}</span>
              </button>
            ) : activeTodayShift.status === 'Active' ? (
              <>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleUpdateActiveShiftTiming}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Save size={14} />
                  <span>{isUrdu ? 'محفوظ کریں' : 'Save Timing'}</span>
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleEndShift(true)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  <Square size={13} className="fill-current" />
                  <span>{isUrdu ? 'شفٹ بند کریں و سمری بھیجیں' : 'End Shift & Send Summary'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleUpdateActiveShiftTiming}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <Save size={14} />
                  <span>{isUrdu ? 'اوقات اپ ڈیٹ کریں' : 'Save Adjusted Times'}</span>
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleReopenShift}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer transition"
                >
                  {isUrdu ? 'دوبارہ کھولیں' : 'Reopen'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right 7 Columns: Work Log Reconciliation & Today's Logged Sessions */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {isUrdu ? 'شفٹ اور ورک لاگ کا تقابلی جائزہ' : 'Shift vs. Work Log Reconciliation (Today)'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isUrdu
                  ? 'آپ کے کل شفٹ وقت بمقابلہ کلائنٹ کالز میں صرف شدہ وقت کا لائیو حساب'
                  : 'Live sync between your recorded shift hours and client work logs submitted today'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {todayWorkStats.pendingProofsCount > 0 && (
                <button
                  type="button"
                  onClick={openPendingProofModal}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <AlertCircle size={13} />
                  <span>{todayWorkStats.pendingProofsCount} Pending Proof</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setCurrentModule(ModuleId.DAILY_WORK_LOG)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
              >
                <Plus size={13} />
                <span>{isUrdu ? 'ورک لاگ شامل کریں' : 'Log Client Call'}</span>
              </button>
            </div>
          </div>

          {/* 4-Card KPI Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                {isUrdu ? 'شفٹ وقت' : 'Reporting Time'}
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5 block">
                {activeTodayShift ? formatDurationFromMinutes(todayShiftNetMinutes) : '0h 00m'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                {isUrdu ? 'کلائنٹ ورک' : 'Client Work'}
              </span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-0.5 block">
                {formatDurationFromMinutes(todayWorkStats.loggedMinutes)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                {isUrdu ? 'دفتری / وقفہ فرق' : 'Notes / Buffer'}
              </span>
              <span className="text-base font-bold text-slate-700 dark:text-slate-200 font-mono tabular-nums mt-0.5 block">
                {formatDurationFromMinutes(todayBufferMinutes)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                {isUrdu ? 'کل کالز / تناسب' : 'Calls / Util.'}
              </span>
              <span className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums mt-0.5 block">
                {todayWorkStats.callsCount} <span className="text-xs font-normal text-slate-400">({todayUtilizationPct}%)</span>
              </span>
            </div>
          </div>

          {/* 420-min TE Policy #2 Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {isUrdu ? 'TE پالیسی #2 ہدف (420 منٹ کلائنٹ ورک):' : 'Daily 7h Client Work Benchmark (TE Policy #2):'}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                {todayWorkStats.loggedMinutes} / 420 min ({policyTargetPct}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  policyTargetPct >= 100
                    ? 'bg-emerald-500'
                    : policyTargetPct >= 60
                    ? 'bg-blue-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${policyTargetPct}%` }}
              />
            </div>
          </div>

          {/* Today's Client Sessions Logged List */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
              <span>{isUrdu ? `آج کے درج شدہ کلائنٹ سیشنز (${todayMyLogs.length})` : `Client Sessions Recorded Today (${todayMyLogs.length})`}</span>
              <button
                type="button"
                onClick={() => setLogoutModalOpen(true)}
                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {isUrdu ? 'مکمل واٹس ایپ رپورٹ دیکھیں →' : 'Preview Full WhatsApp Shift Summary →'}
              </button>
            </div>

            {todayMyLogs.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2 my-auto">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isUrdu ? 'آج ابھی تک کوئی کلائنٹ ورک لاگ درج نہیں ہوا۔' : 'No client work logs recorded for today yet.'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isUrdu
                    ? 'جب آپ Daily Work Log میں کالز درج کریں گے تو وہ خودکار طور پر یہاں آپ کی شفٹ کے ساتھ نظر آئیں گی۔'
                    : 'Sessions submitted in Daily Work Log automatically reconcile here against your shift timer.'}
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
                {todayMyLogs.map((log, idx) => {
                  const needsProof = isLogPendingProof(log, currentUser);
                  return (
                    <div
                      key={log.id || idx}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                            {log.startTime || log.time || '--:--'}
                            {log.endTime ? `–${log.endTime}` : ''}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {log.clientName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {log.issueCategory || log.category} • {log.details || log.summary}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {needsProof ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Pending Proof
                          </span>
                        ) : log.proofLink && log.proofLink.startsWith('http') ? (
                          <a
                            href={log.proofLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 text-[10px] font-mono"
                          >
                            <Link2 size={11} />
                            <span>Proof</span>
                          </a>
                        ) : null}
                        <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                          {log.durationMinutes || 0}m
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shift Attendance Ledger & Team Roster */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {isManagerOrLeadership
                ? isUrdu ? 'ٹیم شفٹ اور حاضری ریکارڈ' : 'Team Shift & Attendance Log'
                : isUrdu ? 'میرا شفٹ ریکارڈ' : 'My Shift History'}
            </h2>
            <span className="text-[11px] font-mono text-slate-400">({filteredShifts.length})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold">
              {(['today', 'yesterday', 'week', 'month', 'all'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setDateFilter(f)}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    dateFilter === f
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {f === 'today'
                    ? isUrdu ? 'آج' : 'Today'
                    : f === 'yesterday'
                    ? isUrdu ? 'کل' : 'Yesterday'
                    : f === 'week'
                    ? isUrdu ? '7 دن' : '7 Days'
                    : f === 'month'
                    ? isUrdu ? 'ماہ' : 'Month'
                    : isUrdu ? 'تمام' : 'All'}
                </button>
              ))}
            </div>

            {isManagerOrLeadership && (
              <select
                value={execFilter}
                onChange={e => setExecFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="ALL">{isUrdu ? 'تمام ایگزیکٹوز' : 'All Team Members'}</option>
                {teamMembersList.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}

            <div className="relative">
              <Search size={13} className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isUrdu ? 'تلاش کریں...' : 'Search shifts...'}
                className="ltr:pl-8 ltr:pr-3 rtl:pr-8 rtl:pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>
        </div>

        {filteredShifts.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
            <Calendar size={24} className="mx-auto text-slate-400" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isUrdu ? 'اس فلٹر میں کوئی شفٹ ریکارڈ نہیں ملا۔' : 'No shift records found for this filter.'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isUrdu
                ? 'اوپر "آج کی شفٹ شروع کریں" بٹن دبا کر اپنی پہلی شفٹ ریکارڈ کریں۔'
                : 'Click "Start Daily Shift" above to clock in or switch the date filter to All.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono uppercase text-slate-400">
                  <th className="py-2.5 px-3">{isUrdu ? 'تاریخ' : 'Date'}</th>
                  <th className="py-2.5 px-3">{isUrdu ? 'ایگزیکٹو' : 'Executive'}</th>
                  <th className="py-2.5 px-3">{isUrdu ? 'شروع' : 'Start'}</th>
                  <th className="py-2.5 px-3">{isUrdu ? 'اختتام' : 'End'}</th>
                  <th className="py-2.5 px-3">{isUrdu ? 'وقفہ' : 'Break'}</th>
                  <th className="py-2.5 px-3">{isUrdu ? 'حاضری وقت' : 'Reporting'}</th>
                  <th className="py-2.5 px-3">{isUrdu ? 'لاگ شدہ کام' : 'Work Logged'}</th>
                  <th className="py-2.5 px-3">{isUrdu ? 'اسٹیٹس' : 'Status'}</th>
                  <th className="py-2.5 px-3 text-right">{isUrdu ? 'ترمیم' : 'Edit'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredShifts.map(s => {
                  const rowLogs = getLogsForShift(s.date, s.executiveName, s.employeeId);
                  const rowWorkMins = rowLogs.reduce((acc, l) => acc + (Number(l.durationMinutes) || 0), 0);
                  const netReportingMins = computeShiftNetMinutes(s, nowTick);
                  const isEditing = editingShiftId === s.id;
                  const canEditRow = isManagerOrLeadership || s.date === todayStr;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">
                        {s.date}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-900 dark:text-white block">{s.executiveName}</span>
                        <span className="text-[10px] font-mono text-slate-400">{s.employeeId}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="time"
                            value={editDraft.shiftStartTime}
                            onChange={e => setEditDraft(d => ({ ...d, shiftStartTime: e.target.value }))}
                            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono"
                          />
                        ) : (
                          formatHHMMDisplay(s.shiftStartTime)
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="time"
                            value={editDraft.shiftEndTime}
                            onChange={e => setEditDraft(d => ({ ...d, shiftEndTime: e.target.value }))}
                            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono"
                          />
                        ) : s.shiftEndTime ? (
                          formatHHMMDisplay(s.shiftEndTime)
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Running</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums">
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            max={240}
                            value={editDraft.breakMinutes}
                            onChange={e => setEditDraft(d => ({ ...d, breakMinutes: Number(e.target.value) || 0 }))}
                            className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono"
                          />
                        ) : (
                          `${s.breakMinutes || 0}m`
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                        {formatDurationFromMinutes(netReportingMins)}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums whitespace-nowrap">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatDurationFromMinutes(rowWorkMins)}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">({rowLogs.length})</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            s.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => saveEditRow(s)}
                              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                              title="Save"
                            >
                              <Save size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingShiftId(null)}
                              className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                              title="Cancel"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : canEditRow ? (
                          <button
                            type="button"
                            onClick={() => beginEditRow(s)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition"
                            title="Edit Shift Timing"
                          >
                            <Edit3 size={13} />
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
