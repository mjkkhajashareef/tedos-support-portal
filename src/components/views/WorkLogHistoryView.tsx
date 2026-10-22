/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { WorkLogEntry, UserRole } from '../../types';
import { MaterialCard } from '../common/MaterialCard';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Building2,
  RefreshCw,
  Edit3,
  MessageSquare,
  Sparkles,
  Link2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isValidProofLink } from '../../utils/helpers';

interface WorkLogHistoryViewProps {
  id?: string;
}

export const WorkLogHistoryView: React.FC<WorkLogHistoryViewProps> = ({ id }) => {
  const {
    workLogs,
    clients,
    currentUser,
    updateWorkLogFields,
    language,
    refreshCurrentView,
    isRefreshing
  } = useApp();

  const isUrdu = language === 'ur';
  const isSupportExecutive = currentUser?.role === UserRole.SUPPORT_EXECUTIVE;
  const isManagerOrLeadership =
    currentUser?.role === UserRole.SUPPORT_MANAGER ||
    currentUser?.role === UserRole.OPERATION_MANAGER ||
    currentUser?.role === UserRole.COO ||
    currentUser?.role === UserRole.DIRECTOR ||
    currentUser?.role === UserRole.AI_ADMINISTRATOR;

  const currentExecName = (currentUser?.name || '').trim().toLowerCase();
  const firstToken = currentExecName.split(' ')[0];

  // Requirement: Support Executive should ONLY see their own logs; Manager & COO see full Support Team history
  const scopedWorkLogs = useMemo(() => {
    if (isSupportExecutive && currentExecName) {
      return workLogs.filter(log => {
        const execName = (log.executiveName || (log as any).supportName || '').toLowerCase().trim();
        return execName === currentExecName || (firstToken && execName.includes(firstToken));
      });
    }
    // For Support Manager, COO, and Leadership: Show all Support Team logs
    return workLogs;
  }, [workLogs, isSupportExecutive, currentExecName, firstToken]);

  // Default to 'all' so Work Log History is never blank upon login
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExecutive, setSelectedExecutive] = useState('ALL');
  const [selectedClientFilter, setSelectedClientFilter] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Sheet Sync State for Manager / COO
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState(false);

  // Edit Special Manager Remark Modal / Inline
  const [editingLog, setEditingLog] = useState<WorkLogEntry | null>(null);
  const [managerRemarkInput, setManagerRemarkInput] = useState('');
  const [isSavingRemark, setIsSavingRemark] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  const executivesList = useMemo(() => {
    if (isSupportExecutive) {
      return [currentUser?.name || 'My Logs'];
    }
    const set = new Set<string>();
    scopedWorkLogs.forEach(l => {
      const name = l.executiveName || (l as any).supportName;
      if (name) set.add(name);
    });
    return ['ALL', ...Array.from(set)];
  }, [scopedWorkLogs, isSupportExecutive, currentUser]);

  const filteredLogs = useMemo(() => {
    return scopedWorkLogs.filter(log => {
      // Date filter
      if (dateFilter === 'today' && log.date !== todayStr) return false;
      if (dateFilter === 'yesterday' && log.date !== yesterdayStr) return false;
      if (dateFilter === 'week' && (!log.date || log.date < weekAgoStr)) return false;

      // Executive filter (only relevant for Manager/COO)
      if (!isSupportExecutive && selectedExecutive !== 'ALL') {
        const execName = (log.executiveName || (log as any).supportName || '').toLowerCase();
        if (!execName.includes(selectedExecutive.toLowerCase())) return false;
      }

      // Client filter
      if (selectedClientFilter !== 'ALL') {
        if (log.clientId !== selectedClientFilter && log.clientName !== selectedClientFilter) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL') {
        if (log.category !== selectedCategory && log.issueCategory !== selectedCategory) return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          (log.clientName || '').toLowerCase().includes(q) ||
          (log.details || '').toLowerCase().includes(q) ||
          (log.teId || '').toLowerCase().includes(q) ||
          (log.executiveName || '').toLowerCase().includes(q) ||
          (log.saadNote || (log as any).specialManagerRemark || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [scopedWorkLogs, dateFilter, selectedExecutive, selectedClientFilter, selectedCategory, searchQuery, todayStr, yesterdayStr, weekAgoStr, isSupportExecutive]);

  const handleOpenEditRemark = (log: WorkLogEntry) => {
    setEditingLog(log);
    setManagerRemarkInput(log.managerRemark || log.saadNote || (log as any).specialManagerRemark || '');
  };

  const handleSaveRemarkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    setIsSavingRemark(true);
    try {
      updateWorkLogFields(editingLog.id, {
        managerRemark: managerRemarkInput.trim(),
        specialManagerRemark: managerRemarkInput.trim(),
        saadNote: managerRemarkInput.trim(),
        approvalRemark: managerRemarkInput.trim(),
        approvalStatus: 'Approved',
        isProofPending: false
      });
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2500);
      setEditingLog(null);
    } finally {
      setIsSavingRemark(false);
    }
  };

  const handleExportCSV = () => {
    if (isSupportExecutive) return; // Hidden/restricted for Support Executive per requirement 4
    const headers = [
      'Log ID',
      'Date',
      'Time',
      'Client Name',
      'TE ID',
      'Executive',
      'Issue Category',
      'Work Type',
      'Call Status',
      'Duration Mins',
      'Summary',
      'Special Manager Remark',
      'Proof Link',
      'Approval Status',
      'Next Follow-up'
    ];

    const rows = filteredLogs.map(l => [
      l.id,
      l.date,
      l.time,
      `"${(l.clientName || '').replace(/"/g, '""')}"`,
      l.teId,
      `"${(l.executiveName || '').replace(/"/g, '""')}"`,
      l.issueCategory || l.category,
      l.workType || l.category,
      l.callStatus || l.status,
      l.durationMinutes,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${(l.specialManagerRemark || l.saadNote || l.managerRemark || '').replace(/"/g, '""')}"`,
      l.proofLink || '',
      l.approvalStatus || 'Pending',
      l.nextFollowUpDate || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TEDOS_Work_Logs_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (isSupportExecutive) return;
    window.print();
  };

  return (
    <div id={id || 'tedos-worklog-history-view'} className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner */}
      <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white">
                  {isSupportExecutive
                    ? isUrdu
                      ? `میری روزانہ ورک لاگ ہسٹری (${currentUser?.name})`
                      : `My Work Log History (${currentUser?.name})`
                    : isUrdu
                    ? 'سپورٹ ٹیم ورک لاگ ہسٹری (Support Team Log History)'
                    : 'Support Team Work Log History (Umar, Farman, Haneef, Sumayya, Asad)'}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  {filteredLogs.length} {isUrdu ? 'ریکارڈز' : 'Entries'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isSupportExecutive
                  ? isUrdu
                    ? 'آپ کے اپنے لاگز، فالو اپس اور تصدیق شدہ کام کا ریکارڈ'
                    : 'Your personal logged calls, customer troubleshooting notes, and proof links'
                  : isUrdu
                  ? 'سپورٹ ٹیم کے تمام اراکین کی تاریخی تفصیلات • مینیجر ریمارکس • گوگل شیٹ لائیو سنک'
                  : 'Full Support Team records • Manager & COO remarks • Live Google Sheet 2-Way Sync'}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sync to Sheet Button (Prominent for Manager & COO per requirement #4) */}
            <button
              type="button"
              disabled={isManualSyncing || isRefreshing}
              onClick={async () => {
                setIsManualSyncing(true);
                try {
                  await refreshCurrentView();
                  setSyncSuccessToast(true);
                  setTimeout(() => setSyncSuccessToast(false), 3000);
                } finally {
                  setIsManualSyncing(false);
                }
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Sync with Google Sheets"
            >
              <RefreshCw size={14} className={isManualSyncing || isRefreshing ? 'animate-spin' : ''} />
              <span>
                {isManualSyncing || isRefreshing
                  ? isUrdu ? 'شیٹ سنک ہو رہی ہے...' : 'Syncing...'
                  : isUrdu ? '⚡ شیٹ سنک کریں (Sync to Sheet)' : '⚡ Sync to Sheet'}
              </span>
            </button>

            {!isSupportExecutive && (
              <>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Export to CSV Spreadsheet"
                >
                  <Download size={14} />
                  <span>{isUrdu ? 'CSV ایکسپورٹ' : 'Export CSV'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Print Report"
                >
                  <Printer size={14} />
                  <span>{isUrdu ? 'پرنٹ' : 'Print'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sync Success Toast */}
        <AnimatePresence>
          {syncSuccessToast && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>
                {isUrdu
                  ? 'گوگل شیٹ کے ساتھ کامیابی سے ڈیٹا سنک ہو گیا اور تمام نئے لاگز اپڈیٹ ہو گئے!'
                  : 'Successfully synchronized with Google Sheets! All work logs and manager remarks are up-to-date.'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex-wrap">
          <span className="text-xs font-bold text-slate-500 mr-1">
            {isUrdu ? 'فلٹر تاریخ:' : 'Date Filter:'}
          </span>
          <button
            type="button"
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              dateFilter === 'today'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {isUrdu ? 'آج (Today)' : 'Today'}
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('yesterday')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              dateFilter === 'yesterday'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {isUrdu ? 'گزشتہ کل (Yesterday)' : 'Yesterday'}
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              dateFilter === 'week'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {isUrdu ? 'اس ہفتے (Last 7 Days)' : 'Last 7 Days'}
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              dateFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {isUrdu ? 'تمام ریکارڈز (All)' : 'All Records'}
          </button>
        </div>

        {/* Search & Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isUrdu ? 'کلائنٹ، خلاصہ یا TE ID تلاش کریں...' : 'Search client, summary, notes...'}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedExecutive}
              onChange={e => setSelectedExecutive(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">{isUrdu ? 'تمام ایگزیکٹوز (All Executives)' : 'All Executives'}</option>
              {executivesList.filter(e => e !== 'ALL').map(e => (
                <option key={e} value={e}>👤 {e}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">{isUrdu ? 'تمام کیٹیگریز (All Categories)' : 'All Categories'}</option>
              <option value="Technical Support">Technical Support</option>
              <option value="Data Import">Data Import</option>
              <option value="Follow Up">Follow Up</option>
              <option value="Training Sessions'">Training Sessions'</option>
              <option value="OTHER">OTHER</option>
              <option value="COO Meeting">COO Meeting</option>
            </select>
          </div>
        </div>
      </MaterialCard>

      {/* History Table Card */}
      <MaterialCard variant="elevated" className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left rtl:text-right">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Client & TE-ID</th>
                <th className="py-3 px-4">Executive</th>
                <th className="py-3 px-4">Category / Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Summary Notes</th>
                <th className="py-3 px-4">Proof Link</th>
                <th className="py-3 px-4">Special Manager Remark</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="space-y-1">
                      <Clock size={28} className="mx-auto text-slate-300" />
                      <p className="text-xs font-bold">
                        {isUrdu ? 'اس فلٹر میں کوئی ورک لاگ موجود نہیں ہے۔' : 'No work logs match the selected filter.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const hasProof = log.proofLink && isValidProofLink(log.proofLink);
                  const clientObj = clients.find(c => c.id === log.clientId || c.name === log.clientName);
                  const specialRemark = log.specialManagerRemark || log.saadNote || log.managerRemark || '';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-slate-900 dark:text-white block">{log.date}</span>
                        <span className="text-[10px] text-slate-400">{log.time || log.startTime}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-black text-slate-900 dark:text-white block">{log.clientName}</span>
                        <span className="text-[10px] font-mono text-blue-600">{log.teId}</span>
                        {clientObj?.url && (
                          <a
                            href={clientObj.url.startsWith('http') ? clientObj.url : `https://${clientObj.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-600 hover:underline mt-0.5 truncate max-w-[140px]"
                          >
                            <span>🌐 Software</span>
                            <ExternalLink size={9} />
                          </a>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                        {log.executiveName || (log as any).supportName}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {log.issueCategory || log.category}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {log.workType || log.callStatus || 'Standard'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-black text-blue-600 dark:text-blue-400 block">
                          {log.duration || `${log.durationMinutes}m`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {log.startTime} → {log.endTime}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-700 dark:text-slate-300 text-xs line-clamp-2 leading-relaxed">
                          {log.details}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        {hasProof ? (
                          <a
                            href={log.proofLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 hover:underline"
                          >
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            <span>Verified</span>
                            <ExternalLink size={10} />
                          </a>
                        ) : log.proofMissingReason ? (
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium block">
                            ⚠️ Reason: {log.proofMissingReason}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded font-bold">
                            Pending Proof
                          </span>
                        )}
                      </td>

                      {/* SPECIAL MANAGER REMARK (Requirement #3) */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {specialRemark ? (
                          <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200 font-medium leading-snug">
                            📌 {specialRemark}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">None</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            log.approvalStatus === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {log.approvalStatus || 'Pending'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isManagerOrLeadership ? (
                          <button
                            type="button"
                            onClick={() => handleOpenEditRemark(log)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 hover:text-blue-700 transition cursor-pointer"
                            title="Edit Special Manager Remark & Sync"
                          >
                            <Edit3 size={14} />
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400">View Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </MaterialCard>

      {/* Special Manager Remark Edit Modal */}
      <AnimatePresence>
        {editingLog && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-amber-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isUrdu ? 'خصوصی مینیجر ریمارک (Special Manager Remark)' : 'Special Manager Remark & Approval Sync'}
                  </h3>
                </div>
                <button
                  onClick={() => setEditingLog(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Client:</span>{' '}
                <span className="font-mono text-blue-600 font-bold">{editingLog.clientName} ({editingLog.teId})</span>
                <p className="text-slate-500 text-[11px] mt-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                  {editingLog.details}
                </p>
              </div>

              <form onSubmit={handleSaveRemarkSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block">
                    {isUrdu ? 'خصوصی مینیجر ریمارک لکھیں:' : 'Special Manager Remark (Sheet & System Sync):'}
                  </label>
                  <textarea
                    rows={3}
                    value={managerRemarkInput}
                    onChange={e => setManagerRemarkInput(e.target.value)}
                    placeholder="Enter remark to approve & sync to Google Sheet..."
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingLog(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingRemark || !managerRemarkInput.trim()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    <span>{isSavingRemark ? 'Syncing...' : 'Save & Sync Remark'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
