/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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
  Sparkles
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

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  const nowTimeStr = useMemo(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }, []);

  const execName = currentUser?.name || 'Support Executive';
  const execId = currentUser?.employeeId || '1000m00016';
  const execRole = currentUser?.role || 'Support Executive';
  const execDept = (currentUser as any)?.department || 'Edsof / Philsof Technical Support';

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

  // Complete combined Shift Summary & Logout message for WhatsApp group
  const fullSummaryMessage = useMemo(() => {
    let text = `📊 *[DAILY SUPPORT SUMMARY & LOGOUT / روزانہ سپورٹ رپورٹ و اختتام شفٹ]*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👤 *Executive / نام:* ${execName}\n`;
    text += `🆔 *TE-ID / ملازم کوڈ:* ${execId}\n`;
    text += `🏷️ *Role / عہدہ:* ${execRole}\n`;
    text += `📅 *Date / تاریخ:* ${todayFormatted}\n`;
    text += `⏰ *Shift Close Time / وقت:* ${nowTimeStr}\n`;
    text += `🌐 *Portal:* Techno Evident Operations ERP (Philsof)\n\n`;

    text += `📈 *TODAY'S WORK OUTPUT / کارکردگی کا جائزہ:*\n`;
    text += `• Total Calls Handled / کل کالز: ${stats.callsCount}\n`;
    text += `• Total Duration / کل دورانیہ: ${stats.durationStr} (${stats.totalMinutes} min)\n`;
    text += `• Verified Proof Recordings / ریکارڈنگ لنکس: ${stats.verifiedCount} of ${stats.callsCount}\n`;
    if (stats.regularUsers > 0) text += `• باقاعدہ استعمال (Regular Users): ${stats.regularUsers}\n`;
    if (stats.needTraining > 0) text += `• ٹریننگ درکار (Need Training): ${stats.needTraining}\n`;
    if (stats.notUsing > 0) text += `• استعمال نہیں ہو رہا (Not Using): ${stats.notUsing}\n`;
    text += `\n`;

    if (myTodayLogs.length > 0) {
      text += `📝 *CLIENT SESSIONS LOG / کالز کی تفصیل:*\n`;
      myTodayLogs.slice(0, 10).forEach((l, idx) => {
        const clientName = l.clientName || 'Client';
        const dur = l.duration || `${l.durationMinutes || 0}m`;
        const tag = l.softwareUsage ? ` [${l.softwareUsage}]` : '';
        const issue = l.category || l.issueCategory || l.workType || 'Support';
        const proof = l.proofLink ? `\n   🔗 Proof: ${l.proofLink}` : '';
        text += `${idx + 1}. *${clientName}* (${dur})${tag}\n   - Issue: ${issue}${proof}\n`;
      });
      if (myTodayLogs.length > 10) {
        text += `...اور مزید ${myTodayLogs.length - 10} کلائنٹ سیشنز درج ہیں۔\n`;
      }
      text += `\n`;
    }

    if (customNote.trim()) {
      text += `⚠️ *Special Notes / نوٹس:*\n${customNote.trim()}\n\n`;
    }

    text += `🔴 *LOGOUT STATUS / اسٹیٹس:* All daily client calls, support tickets & daily logs have been submitted and synchronized to Google Sheets. Successfully signing off for today.\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `✅ _Synced to Google Sheets & Server Archive via Philsof Support OS_`;

    return text;
  }, [execName, execId, execRole, todayFormatted, nowTimeStr, stats, myTodayLogs, customNote]);

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
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
                    ? 'سافٹ ویئر لاگ آؤٹ اور واٹس ایپ گروپ سمری'
                    : 'Shift Summary & Logout for WhatsApp'}
                </span>
                <span className="text-[10px] bg-rose-500/30 text-rose-300 px-2 py-0.5 rounded-full font-mono font-bold">
                  SHIFT END
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                {isUrdu
                  ? 'ایک کلک میں سمری واٹس ایپ گروپ میں بھیجیں اور لاگ آؤٹ کریں'
                  : 'Post complete work summary to WhatsApp group and sign off'}
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
          {/* Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Calls Logged</span>
              <span className="text-base sm:text-lg font-black text-blue-600">{stats.callsCount}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Logged Time</span>
              <span className="text-base sm:text-lg font-black text-emerald-600">{stats.durationStr}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Verified Proofs</span>
              <span className="text-base sm:text-lg font-black text-purple-600">{stats.verifiedCount}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Close Time</span>
              <span className="text-base sm:text-lg font-black text-rose-600">{nowTimeStr}</span>
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
