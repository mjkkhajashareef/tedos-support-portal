/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  X,
  Copy,
  Check,
  Printer,
  Share2,
  Users,
  Clock,
  Smile,
  Frown,
  CheckCircle2,
  Layers,
  Building2,
  PhoneCall
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { openWhatsAppChat } from '../../utils/whatsappUtils';

interface DailyTeamSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyTeamSummaryModal: React.FC<DailyTeamSummaryModalProps> = ({
  isOpen,
  onClose
}) => {
  const { workLogs, tickets, users, language } = useApp();
  const isUrdu = language === 'ur';

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [dateMode, setDateMode] = useState<'today' | 'custom'>('today');
  const [copied, setCopied] = useState(false);

  const handleSelectToday = () => {
    setDateMode('today');
    setSelectedDate(todayStr);
  };

  const handleSelectCustom = (val: string) => {
    setDateMode('custom');
    setSelectedDate(val);
  };

  // Combine and deduplicate logs
  const allLogsFromTickets = tickets.flatMap(t => t.workLogs || []);
  const allLogs = useMemo(() => {
    const map = new Map<string, any>();
    [...workLogs, ...allLogsFromTickets].forEach(log => {
      if (log && log.id && !map.has(log.id)) {
        map.set(log.id, log);
      }
    });
    return Array.from(map.values());
  }, [workLogs, allLogsFromTickets]);

  // Filter logs for selected date
  const filteredLogs = useMemo(() => {
    return allLogs.filter(l => {
      const d = (l.date || '').split('T')[0];
      return d === selectedDate;
    });
  }, [allLogs, selectedDate]);

  // Calculations
  const totalLogs = filteredLogs.length;
  const totalMinutes = filteredLogs.reduce((acc, l) => acc + (Number(l.durationMinutes) || 15), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const happyCount = filteredLogs.filter(l => l.clientStatus === 'Happy' || l.clientSatisfactionKpi === 'Satisfied').length;
  const unhappyCount = filteredLogs.filter(l => l.clientStatus === 'Unhappy' || l.clientStatusRisk === 'At Risk').length;

  // Executive breakdown
  const executiveStats = useMemo(() => {
    const stats: Record<string, { count: number; minutes: number; happy: number; unhappy: number }> = {};
    filteredLogs.forEach(l => {
      let exec = l.executiveName || l.supportName || '';
      if (!exec || exec === 'Executive' || exec === 'Support Executive') {
        const matchedUser = users.find(u => (u.employeeId && l.teId && u.employeeId.toLowerCase() === l.teId.toLowerCase()));
        exec = matchedUser?.name || 'Support Executive';
      }
      if (!stats[exec]) {
        stats[exec] = { count: 0, minutes: 0, happy: 0, unhappy: 0 };
      }
      stats[exec].count += 1;
      stats[exec].minutes += Number(l.durationMinutes) || 15;
      if (l.clientStatus === 'Happy' || l.clientSatisfactionKpi === 'Satisfied') stats[exec].happy += 1;
      if (l.clientStatus === 'Unhappy' || l.clientStatusRisk === 'At Risk') stats[exec].unhappy += 1;
    });
    return stats;
  }, [filteredLogs, users]);

  // Generate WhatsApp summary text
  const formattedSummaryText = useMemo(() => {
    const dateFormatted = new Date(selectedDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    let text = `📊 *DAILY SUPPORT TEAM PERFORMANCE SUMMARY*\n`;
    text += `📅 Date: ${dateFormatted} (${dateMode === 'today' ? 'Today' : 'Historical'})\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📞 Total Sessions / Calls Logged: *${totalLogs}*\n`;
    text += `⏱️ Total Duration: *${totalHours} hours* (${totalMinutes} mins)\n`;
    text += `😊 Client Satisfaction: *${happyCount} Happy* | *${unhappyCount} At Risk*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👥 *EXECUTIVE WISE BREAKDOWN:*\n`;

    const execKeys = Object.keys(executiveStats);
    if (execKeys.length === 0) {
      text += `_No support work logs recorded for this date._\n`;
    } else {
      execKeys.forEach((exec, idx) => {
        const item = executiveStats[exec];
        const hrs = (item.minutes / 60).toFixed(1);
        text += `${idx + 1}. *${exec}*: ${item.count} sessions (${hrs} hrs) | 😊 ${item.happy} | 😟 ${item.unhappy}\n`;
      });
    }

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🏢 *RECENT CLIENT INTERACTIONS:*\n`;
    filteredLogs.slice(0, 10).forEach((l, idx) => {
      text += `• ${l.clientName || 'Client'} (${l.workType || 'Call'}) - ${l.details?.slice(0, 50) || 'Work logged'}...\n`;
    });

    text += `\n_Techno Evident Customer Support Operations_`;
    return text;
  }, [selectedDate, dateMode, totalLogs, totalHours, totalMinutes, happyCount, unhappyCount, executiveStats, filteredLogs]);

  const handleCopySummary = () => {
    navigator.clipboard.writeText(formattedSummaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    openWhatsAppChat({ message: formattedSummaryText });
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Calendar size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-black">
                  {isUrdu ? 'روزانہ سپورٹ ٹیم کی سمری و رپورٹ (Daily Support Summary)' : 'Daily Support Team Summary & Analytics'}
                </h2>
                <p className="text-xs text-white/90">
                  {isUrdu ? 'آج کی سمری یا کیلنڈر سے تاریخ منتخب کر کے مکمل رپورٹ حاصل کریں' : 'Choose Today or select date from calendar to extract team summary'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-black/15 hover:bg-black/25 text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-5 overflow-y-auto">
            {/* Requirement #6: Date Selector: Today vs Calendar Date Picker */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase flex items-center gap-2">
                  <Calendar size={14} className="text-blue-600" />
                  <span>{isUrdu ? 'سمری کے لیے تاریخ منتخب کریں:' : 'Select Summary Date:'}</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectToday}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      dateMode === 'today'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    📅 {isUrdu ? 'آج کی سمری (Today)' : 'Today'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDateMode('custom')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      dateMode === 'custom'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    🗓️ {isUrdu ? 'کیلنڈر تاریخ (Calendar)' : 'Pick Calendar Date'}
                  </button>
                </div>
              </div>

              {/* Date Input Calendar */}
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => handleSelectCustom(e.target.value)}
                  className="w-full sm:w-64 p-2.5 rounded-xl border border-blue-400 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                />
                <span className="text-xs font-mono font-bold text-slate-500">
                  {filteredLogs.length} {isUrdu ? 'لاگز موجود' : 'records found'}
                </span>
              </div>
            </div>

            {/* Quick Metrics KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-center">
                <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 block mb-0.5">
                  {isUrdu ? 'کل سیشنز' : 'Total Sessions'}
                </span>
                <span className="text-xl font-mono font-black text-blue-900 dark:text-blue-100">
                  {totalLogs}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-center">
                <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 block mb-0.5">
                  {isUrdu ? 'کل دورانیہ' : 'Total Duration'}
                </span>
                <span className="text-xl font-mono font-black text-indigo-900 dark:text-indigo-100">
                  {totalHours}h
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block mb-0.5">
                  {isUrdu ? 'مطمئن (Happy)' : 'Satisfied (Happy)'}
                </span>
                <span className="text-xl font-mono font-black text-emerald-800 dark:text-emerald-200">
                  {happyCount}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300 block mb-0.5">
                  {isUrdu ? 'غیر مطمئن (At Risk)' : 'At Risk (Unhappy)'}
                </span>
                <span className="text-xl font-mono font-black text-rose-800 dark:text-rose-200">
                  {unhappyCount}
                </span>
              </div>
            </div>

            {/* Executive Wise Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1.5">
                <Users size={14} className="text-purple-600" />
                <span>{isUrdu ? 'ایگزیکٹو وار کارکردگی خلاصہ:' : 'Executive-wise Breakdown:'}</span>
              </span>

              {Object.keys(executiveStats).length === 0 ? (
                <p className="text-xs text-slate-400 italic p-4 text-center border border-dashed rounded-2xl">
                  {isUrdu ? 'اس تاریخ کے لیے کوئی ورک لاگ درج نہیں ہے۔' : 'No records logged on this date.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(executiveStats).map(([name, stat]: [string, any]) => (
                    <div
                      key={name}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between"
                    >
                      <div className="font-bold text-slate-900 dark:text-white truncate pr-2">
                        <span>👤 {name}</span>
                        <span className="block text-[10px] text-slate-500 font-normal">
                          {(stat.minutes / 60).toFixed(1)} hrs logged
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                          {stat.count} calls
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                          😊 {stat.happy}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ready WhatsApp Summary Preview */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1.5">
                <Share2 size={14} className="text-emerald-600" />
                <span>{isUrdu ? 'واٹس ایپ گروپ سمری ٹیکسٹ (WhatsApp Group Ready Text):' : 'Ready Text for WhatsApp Sharing:'}</span>
              </span>
              <pre className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {formattedSummaryText}
              </pre>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCopySummary}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? (isUrdu ? 'سمری کاپی ہو گئی!' : 'Copied!') : (isUrdu ? 'سمری کاپی کریں' : 'Copy Summary')}</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer size={14} />
                <span>{isUrdu ? 'پرنٹ' : 'Print'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <Share2 size={14} />
                <span>{isUrdu ? 'واٹس ایپ گروپ میں بھیجیں' : 'Share to WhatsApp'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
