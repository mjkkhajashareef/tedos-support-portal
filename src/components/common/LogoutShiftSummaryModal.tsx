/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  LogOut,
  MessageSquare,
  Share2,
  Copy,
  Check,
  Calendar,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Zap,
  PhoneCall,
  Sparkles,
  RotateCcw,
  Building2,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const WHATSAPP_SUPPORT_GROUP_URL =
  'https://chat.whatsapp.com/FAkeCRc4ohi6YcgmIUACew?s=cl&p=a&mlu=4&ilr=4';

interface LogoutShiftSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
}

export const LogoutShiftSummaryModal: React.FC<LogoutShiftSummaryModalProps> = ({
  isOpen,
  onClose,
  onConfirmLogout
}) => {
  const { currentUser, workLogs, language } = useApp();
  const isUrdu = language === 'ur';

  const [copied, setCopied] = useState(false);
  const [customNote, setCustomNote] = useState('');

  // Helper to format live 12-hour IST time
  const getNowFormattedTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // State for Shift Close Time (dynamic and editable)
  const [shiftCloseTime, setShiftCloseTime] = useState<string>(getNowFormattedTime);

  // State for Reporting Hours (standard shift duration in hours and minutes)
  const [reportingHours, setReportingHours] = useState<number>(8);
  const [reportingMinutes, setReportingMinutes] = useState<number>(0);

  // Automatically refresh shift close time to current live clock whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setShiftCloseTime(getNowFormattedTime());
    }
  }, [isOpen]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  const execName = currentUser?.name || 'Support Executive';
  const execId = currentUser?.employeeId || '1000m00016';
  const execRole = currentUser?.role || 'Support Executive';

  // Compute today's logs for this executive
  const myTodayLogs = useMemo(() => {
    if (!currentUser) return [];
    const myName = (currentUser.name || '').toLowerCase();
    const firstToken = myName.split(' ')[0];
    return workLogs.filter((w) => {
      const isDate = w.date === todayStr;
      const isMe =
        (w.executiveName || '').toLowerCase().includes(firstToken) ||
        (w.supportName || '').toLowerCase().includes(firstToken) ||
        (currentUser.employeeId && w.teId === currentUser.employeeId);
      return isDate && isMe;
    });
  }, [workLogs, currentUser, todayStr]);

  const stats = useMemo(() => {
    let totalMinutes = 0;
    let verifiedCount = 0;
    let regularUsers = 0;
    let notUsing = 0;
    let needTraining = 0;

    myTodayLogs.forEach((l) => {
      totalMinutes += l.durationMinutes || 0;
      if (
        l.proofLink &&
        (l.proofLink.includes('meet.google.com') ||
          l.proofLink.includes('drive.google.com'))
      ) {
        verifiedCount++;
      }
      if (l.softwareUsage === 'Regular User') regularUsers++;
      else if (l.softwareUsage === 'Not Using') notUsing++;
      else if (l.softwareUsage === 'Need Training') needTraining++;
    });

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return {
      callsCount: myTodayLogs.length,
      totalMinutes,
      durationStr: `${hours}h ${mins}m`,
      verifiedCount,
      regularUsers,
      notUsing,
      needTraining
    };
  }, [myTodayLogs]);

  // Total Reporting vs Working hours computation
  const totalReportingMinutes = reportingHours * 60 + reportingMinutes;
  const reportingHoursStr = `${reportingHours}h ${reportingMinutes > 0 ? `${reportingMinutes}m` : '00m'}`;

  const diffMinutes = totalReportingMinutes - stats.totalMinutes;
  const diffHours = Math.floor(Math.abs(diffMinutes) / 60);
  const diffMins = Math.abs(diffMinutes) % 60;
  const bufferDurationStr =
    diffMinutes >= 0
      ? `${diffHours}h ${diffMins}m (Buffer / Transition / Notes)`
      : `+${diffHours}h ${diffMins}m (Overtime)`;

  const productivityRatio = Math.round(
    (stats.totalMinutes / Math.max(1, totalReportingMinutes)) * 100
  );

  // Complete combined Shift Summary & Logout message for WhatsApp group (All clients listed, no truncation!)
  const fullSummaryMessage = useMemo(() => {
    let text = `📊 *[DAILY SUPPORT SUMMARY & LOGOUT / روزانہ سپورٹ رپورٹ و اختتام شفٹ]*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👤 *Executive / نام:* ${execName}\n`;
    text += `🆔 *TE-ID / ملازم کوڈ:* ${execId}\n`;
    text += `🏷️ *Role / عہدہ:* ${execRole}\n`;
    text += `📅 *Date / تاریخ:* ${todayFormatted}\n`;
    text += `⏰ *Shift Close Time / اختتام وقت:* ${shiftCloseTime}\n`;
    text += `🌐 *Portal:* Techno Evident Operations ERP (Philsof)\n\n`;

    text += `⏱️ *HOURS BREAKDOWN / اوقات کار کا تفصیلی جائزہ:*\n`;
    text += `• Total Reporting Hours (Shift) / کل حاضری وقت: ${reportingHoursStr} (${totalReportingMinutes} min)\n`;
    text += `• Total Working Hours (Active) / کل کام کا دورانیہ: ${stats.durationStr} (${stats.totalMinutes} min)\n`;
    text += `• Documentation & Transition / دفتری و فالو اپ وقت: ${bufferDurationStr}\n`;
    text += `• Productivity Ratio / کارکردگی تناسب: ${productivityRatio}%\n\n`;

    text += `📈 *TODAY'S WORK OUTPUT / مجموعی کارکردگی:*\n`;
    text += `• Total Calls Handled / کل کالز: ${stats.callsCount}\n`;
    text += `• Verified Proof Recordings / ریکارڈنگ لنکس: ${stats.verifiedCount} of ${stats.callsCount}\n`;
    if (stats.regularUsers > 0) text += `• باقاعدہ استعمال (Regular Users): ${stats.regularUsers}\n`;
    if (stats.needTraining > 0) text += `• ٹریننگ درکار (Need Training): ${stats.needTraining}\n`;
    if (stats.notUsing > 0) text += `• استعمال نہیں ہو رہا (Not Using): ${stats.notUsing}\n`;
    text += `\n`;

    if (myTodayLogs.length > 0) {
      text += `📝 *CLIENT SESSIONS LOG / کالز و اوقات کی مکمل تفصیل:*\n`;
      // LIST ALL CLIENT SESSIONS WITHOUT TRUNCATION!
      myTodayLogs.forEach((l, idx) => {
        const clientName = l.clientName || 'Client';
        const durFormatted = l.duration || `${l.durationMinutes || 0}m`;
        const durMins = l.durationMinutes ? `${l.durationMinutes} min` : '';
        const durDisplay = durMins ? `${durFormatted} (${durMins})` : durFormatted;
        const tag = l.softwareUsage ? ` [${l.softwareUsage}]` : '';
        const issue = l.category || l.issueCategory || l.workType || 'Support';
        const proof = l.proofLink ? `\n   🔗 Proof: ${l.proofLink}` : '';
        text += `${idx + 1}. *${clientName}* — ${durDisplay}${tag}\n   - Issue: ${issue}${proof}\n`;
      });
      text += `\n`;
    }

    if (customNote.trim()) {
      text += `⚠️ *Special Notes / نوٹس:*\n${customNote.trim()}\n\n`;
    }

    text += `🔴 *LOGOUT STATUS / اسٹیٹس:* All daily client calls, support tickets & daily logs have been submitted and synchronized to Google Sheets. Successfully signing off for today.\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `✅ _Synced to Google Sheets & Server Archive via Philsof Support OS_`;

    return text;
  }, [
    execName,
    execId,
    execRole,
    todayFormatted,
    shiftCloseTime,
    reportingHoursStr,
    totalReportingMinutes,
    stats,
    bufferDurationStr,
    productivityRatio,
    myTodayLogs,
    customNote
  ]);

  // Primary 1-Click: Copy summary, Open WhatsApp with pre-filled message, and Logout!
  const handleOneClickSendAndLogout = () => {
    navigator.clipboard.writeText(fullSummaryMessage);
    setCopied(true);

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullSummaryMessage)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    setTimeout(() => {
      onConfirmLogout();
    }, 500);
  };

  // Send summary to WhatsApp without logging out (keep working)
  const handleShareSummaryOnly = () => {
    navigator.clipboard.writeText(fullSummaryMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 3500);

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullSummaryMessage)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Open direct group link (message copied to clipboard)
  const handleOpenGroupDirectly = () => {
    navigator.clipboard.writeText(fullSummaryMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 3500);
    window.open(WHATSAPP_SUPPORT_GROUP_URL, '_blank', 'noopener,noreferrer');
  };

  const handleCopyOnly = () => {
    navigator.clipboard.writeText(fullSummaryMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 3500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <LogOut size={22} />
            </div>
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                <span>
                  {isUrdu
                    ? 'سافٹ ویئر لاگ آؤٹ اور مکمل شفٹ سمری (واٹس ایپ)'
                    : 'Shift Summary & Logout for WhatsApp'}
                </span>
                <span className="text-[10px] bg-rose-500/30 text-rose-300 px-2 py-0.5 rounded-full font-mono font-bold">
                  SHIFT END
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                {isUrdu
                  ? 'حاضری کے گھنٹے، کام کا کل وقت اور ہر کلائنٹ کی تفصیل واٹس ایپ گروپ میں بھیجیں'
                  : 'Total Reporting Hours, Working Duration & Client-by-Client Breakdown for WhatsApp'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs flex-1">
          {/* Shift Time & Reporting Hours Settings Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 uppercase font-mono">
                <Clock size={13} className="text-blue-600" />
                <span>
                  {isUrdu
                    ? 'شفٹ اوقات کار کی تصدیق (Shift Timing & Reporting Hours):'
                    : 'Shift Timing & Reporting Hours:'}
                </span>
              </span>

              <button
                type="button"
                onClick={() => setShiftCloseTime(getNowFormattedTime())}
                className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                title="Refresh Shift Close Time to Current Live Minute"
              >
                <RotateCcw size={11} />
                <span>{isUrdu ? 'ابھی کا وقت لگائیں (Refresh to Now)' : 'Set Current Time'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Shift Close Time Input */}
              <div>
                <label className="text-[10px] font-mono text-slate-500 block mb-1">
                  {isUrdu ? 'اختتام شفٹ کا وقت (Shift Close Time):' : 'Shift Close Time:'}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={shiftCloseTime}
                    onChange={(e) => setShiftCloseTime(e.target.value)}
                    placeholder="06:30 PM"
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Total Reporting Hours Selector */}
              <div>
                <label className="text-[10px] font-mono text-slate-500 block mb-1">
                  {isUrdu ? 'کل حاضری / ڈیوٹی گھنٹے (Reporting Hours):' : 'Total Reporting Hours (Duty Shift):'}
                </label>
                <div className="flex items-center gap-1.5">
                  {[8, 8.5, 9].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => {
                        const h = Math.floor(hrs);
                        const m = hrs % 1 !== 0 ? 30 : 0;
                        setReportingHours(h);
                        setReportingMinutes(m);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                        reportingHours === Math.floor(hrs) && reportingMinutes === (hrs % 1 !== 0 ? 30 : 0)
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {hrs}h
                    </button>
                  ))}
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="number"
                      min={1}
                      max={16}
                      value={reportingHours}
                      onChange={(e) => setReportingHours(Number(e.target.value) || 8)}
                      className="w-14 p-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-center"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">hrs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Core Metric Cards Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Reporting Hours</span>
              <span className="text-base sm:text-lg font-black text-indigo-600">{reportingHoursStr}</span>
              <span className="text-[9px] text-slate-400 font-mono block">({totalReportingMinutes} min)</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Active Working</span>
              <span className="text-base sm:text-lg font-black text-emerald-600">{stats.durationStr}</span>
              <span className="text-[9px] text-slate-400 font-mono block">({stats.totalMinutes} min)</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Productivity</span>
              <span className="text-base sm:text-lg font-black text-purple-600">{productivityRatio}%</span>
              <span className="text-[9px] text-slate-400 font-mono block">Ratio</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Calls / Proofs</span>
              <span className="text-base sm:text-lg font-black text-blue-600">{stats.callsCount}</span>
              <span className="text-[9px] text-slate-400 font-mono block">({stats.verifiedCount} proofs)</span>
            </div>
          </div>

          {/* Breakdown Table: Client By Client Work Time (All Clients Listed!) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                <Building2 size={12} className="text-blue-500" />
                <span>
                  {isUrdu
                    ? `آج کے تمام کلائنٹس اور اوقات کی فہرست (${myTodayLogs.length} سیشنز):`
                    : `Complete Client Breakdown (${myTodayLogs.length} Sessions Logged):`}
                </span>
              </span>
              <span className="text-[10px] font-mono text-emerald-600 font-bold">
                Total: {stats.durationStr}
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {myTodayLogs.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  {isUrdu ? 'آج کا کوئی ورک لاگ درج نہیں ہے۔' : 'No calls logged today.'}
                </div>
              ) : (
                myTodayLogs.map((log, idx) => (
                  <div key={log.id || idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <span className="font-bold text-slate-800 dark:text-slate-100 block truncate">
                          {log.clientName || 'Client'}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {log.category || log.issueCategory || 'Support'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono font-bold text-emerald-600 ml-2">
                      <span>{log.duration || `${log.durationMinutes || 0}m`}</span>
                      <span className="text-[9px] text-slate-400 block font-normal">
                        ({log.durationMinutes || 0} min)
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Optional remark */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
              {isUrdu ? 'اضافی نوٹس یا ریمارکس (اختیاری):' : 'Additional Shift Notes (Optional):'}
            </label>
            <input
              type="text"
              placeholder={isUrdu ? 'مثال: کل صبح 2 کلائنٹس کو فالو اپ کال کرنی ہے...' : 'e.g. 2 calls follow-up tomorrow morning...'}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Complete WhatsApp Summary Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                <Sparkles size={11} className="text-emerald-500" />
                <span>
                  {isUrdu
                    ? 'واٹس ایپ گروپ کے لیے تیار کردہ مکمل سمری (Pre-filled):'
                    : 'Complete Summary Message for WhatsApp Group:'}
                </span>
              </span>
              {copied && (
                <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1 animate-fade-in">
                  <Check size={13} /> {isUrdu ? 'کاپی ہو گیا!' : 'Copied to Clipboard!'}
                </span>
              )}
            </div>

            <pre className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[10.5px] whitespace-pre-wrap leading-relaxed border border-slate-800 max-h-48 overflow-y-auto">
              {fullSummaryMessage}
            </pre>
          </div>

          {/* Group link display */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
            <span className="text-slate-600 dark:text-slate-300 truncate max-w-[280px] font-mono text-[10px]">
              {WHATSAPP_SUPPORT_GROUP_URL}
            </span>
            <button
              type="button"
              onClick={handleOpenGroupDirectly}
              className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-bold shrink-0 ml-2 cursor-pointer hover:underline"
            >
              <span>{isUrdu ? 'براہ راست گروپ کھولیں' : 'Open Group Link'}</span>
              <ExternalLink size={11} />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {isUrdu ? 'منسوخ کریں' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleCopyOnly}
              className="px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Copy summary text only"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareSummaryOnly}
              className="px-3 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Post to WhatsApp without logging out"
            >
              <Share2 size={13} />
              <span>{isUrdu ? 'صرف واٹس ایپ' : 'Post & Stay'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onConfirmLogout}
              className="px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition cursor-pointer w-full sm:w-auto"
              title="Logout directly without opening WhatsApp"
            >
              {isUrdu ? 'صرف لاگ آؤٹ' : 'Logout Only'}
            </button>

            {/* Giant 1-Click Send Summary & Logout Button */}
            <button
              type="button"
              onClick={handleOneClickSendAndLogout}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer"
              title="Open WhatsApp with pre-filled summary and complete logout in 1 click"
            >
              <Zap size={15} className="text-yellow-300 animate-pulse fill-yellow-300" />
              <span>
                {isUrdu
                  ? '⚡ 1-کلک سمری بھیجیں اور لاگ آؤٹ کریں'
                  : '⚡ 1-Click Send Summary & Logout'}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
