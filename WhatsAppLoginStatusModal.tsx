/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  MessageSquare,
  Share2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  User,
  Calendar,
  Building,
  PhoneCall
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const WHATSAPP_SUPPORT_GROUP_URL =
  'https://chat.whatsapp.com/FAkeCRc4ohi6YcgmIUACew?s=cl&p=a&mlu=4&ilr=4';

interface WhatsAppLoginStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppLoginStatusModal: React.FC<WhatsAppLoginStatusModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentUser, language } = useApp();
  const isUrdu = language === 'ur';

  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
      setCurrentDate(
        now.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      );
    }
  }, [isOpen]);

  const execName = currentUser?.name || 'Support Executive';
  const execId = currentUser?.employeeId || '1000m00016';
  const execRole = currentUser?.role || 'Support Executive';
  const execDept = (currentUser as any)?.department || 'Edsof / Philsof Technical Support';

  // Complete, comprehensive login announcement for WhatsApp Support Group
  const statusMessage = useMemo(() => {
    let msg = `🟢 *[SHIFT START - ATTENDANCE & LOGIN / حاضری و آغاز ڈیوٹی]*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👤 *Employee / نام:* ${execName}\n`;
    msg += `🆔 *TE-ID / ملازم کوڈ:* ${execId}\n`;
    msg += `🏷️ *Role / عہدہ:* ${execRole}\n`;
    msg += `🏢 *Department / شعبہ:* ${execDept}\n`;
    msg += `📅 *Date / تاریخ:* ${currentDate || 'Today'}\n`;
    msg += `⏰ *Login Time / وقت:* ${currentTime || 'Online'}\n`;
    msg += `🌐 *Portal:* Techno Evident Operations ERP (Philsof)\n`;
    if (currentUser?.mobile) {
      msg += `📱 *Contact:* ${currentUser.mobile}\n`;
    }
    msg += `✅ *Status / کیفیت:* Online & Active. Ready for Client Calls, Software Support, Ticket Resolution & Training Sessions.\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `_Reported via Techno Evident Support Operations Engine_`;
    return msg;
  }, [execName, execId, execRole, execDept, currentDate, currentTime, currentUser?.mobile]);

  // 1-Click: Copy to clipboard and open WhatsApp with pre-filled message
  const handleOneClickSendToWhatsApp = () => {
    navigator.clipboard.writeText(statusMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 3500);

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(statusMessage)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Open direct group link (message copied so user can paste immediately)
  const handleOpenGroupDirectly = () => {
    navigator.clipboard.writeText(statusMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 3500);
    window.open(WHATSAPP_SUPPORT_GROUP_URL, '_blank', 'noopener,noreferrer');
  };

  const handleCopyOnly = () => {
    navigator.clipboard.writeText(statusMessage);
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
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/15 text-white shadow-xs">
              <MessageSquare size={22} />
            </div>
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                <span>
                  {isUrdu
                    ? 'واٹس ایپ گروپ لاگ ان حاضری نوٹیفکیشن'
                    : 'WhatsApp Group Login Attendance'}
                </span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-bold tracking-wide">
                  LIVE
                </span>
              </h2>
              <p className="text-xs text-emerald-100">
                {isUrdu
                  ? 'لاگ ان ہوتے ہی گروپ میں مکمل میسج شیئر کریں'
                  : 'Post complete shift start status to official support group'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Welcome executive strip */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={20} className="shrink-0 text-emerald-600" />
              <div>
                <p className="font-bold text-xs">
                  {isUrdu
                    ? `خوش آمدید ${execName}!`
                    : `Welcome, ${execName}!`}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  {isUrdu
                    ? 'آپ کا پورٹل لاگ ان کامیاب ہو چکا ہے۔ نیچے دیے گئے بٹن سے واٹس ایپ گروپ میں اطلاع بھیجیں۔'
                    : 'You have logged in. Click below to announce attendance to the support group.'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-600 text-white px-2 py-1 rounded-lg shrink-0">
              {currentTime}
            </span>
          </div>

          {/* Quick Details Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block font-mono">EXECUTIVE</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{execName}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block font-mono">TE-ID</span>
              <span className="font-mono font-bold text-emerald-600 truncate block">{execId}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block font-mono">LOGIN TIME</span>
              <span className="font-mono font-bold text-blue-600 truncate block">{currentTime}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block font-mono">STATUS</span>
              <span className="font-bold text-emerald-600 truncate block">🟢 Online</span>
            </div>
          </div>

          {/* Complete WhatsApp Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1">
                <Sparkles size={11} className="text-emerald-600" />
                <span>
                  {isUrdu
                    ? 'گروپ میں جانے والا مکمل میسج (Pre-filled):'
                    : 'Complete Message to Post in WhatsApp Group:'}
                </span>
              </span>
              {copied && (
                <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1 animate-fade-in">
                  <Check size={13} /> {isUrdu ? 'کاپی ہو گیا!' : 'Copied to Clipboard!'}
                </span>
              )}
            </div>
            <pre className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[10.5px] whitespace-pre-wrap border border-slate-800 leading-relaxed max-h-48 overflow-y-auto">
              {statusMessage}
            </pre>
          </div>

          {/* Group link helper */}
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
              className="px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer w-full sm:w-auto"
            >
              {isUrdu ? 'بعد میں / جاری رکھیں' : 'Continue'}
            </button>

            <button
              type="button"
              onClick={handleCopyOnly}
              className="px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Copy message text to clipboard"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Giant 1-Click Send Button */}
          <button
            type="button"
            onClick={handleOneClickSendToWhatsApp}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer"
            title="Open WhatsApp with pre-filled message and copy to clipboard"
          >
            <Zap size={15} className="text-yellow-300 animate-pulse fill-yellow-300" />
            <span>
              {isUrdu
                ? '⚡ 1-کلک میں واٹس ایپ پر بھیجیں'
                : '⚡ 1-Click Send to WhatsApp'}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
