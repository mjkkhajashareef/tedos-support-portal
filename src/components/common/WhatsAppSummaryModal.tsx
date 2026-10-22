/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Copy,
  Check,
  Share2,
  Calendar,
  User,
  Sparkles,
  PhoneCall,
  Clock,
  ShieldCheck,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WhatsAppSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppSummaryModal: React.FC<WhatsAppSummaryModalProps> = ({ isOpen, onClose }) => {
  const { workLogs, currentUser, users } = useApp();
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedExecutive, setSelectedExecutive] = useState<string>(currentUser?.name || 'All');
  const [copied, setCopied] = useState(false);
  const [customNote, setCustomNote] = useState('');

  // Filter logs based on date and executive
  const filteredLogs = useMemo(() => {
    return workLogs.filter((log) => {
      const matchDate = log.date === selectedDate;
      const matchExec =
        selectedExecutive === 'All' ||
        log.executiveName === selectedExecutive ||
        log.supportName === selectedExecutive;
      return matchDate && matchExec;
    });
  }, [workLogs, selectedDate, selectedExecutive]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalMinutes = 0;
    let verifiedCount = 0;
    let regularUsers = 0;
    let notUsing = 0;
    let needTraining = 0;

    filteredLogs.forEach((log) => {
      totalMinutes += log.durationMinutes || 0;
      if (log.proofLink && (log.proofLink.includes('drive.google.com') || log.proofLink.includes('meet.google.com'))) {
        verifiedCount++;
      }
      if (log.softwareUsage === 'Regular User') regularUsers++;
      else if (log.softwareUsage === 'Not Using') notUsing++;
      else if (log.softwareUsage === 'Need Training') needTraining++;
    });

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    return {
      totalCalls: filteredLogs.length,
      totalMinutes,
      durationStr: `${hours}h ${mins}m`,
      verifiedCount,
      regularUsers,
      notUsing,
      needTraining,
    };
  }, [filteredLogs]);

  // Generate formatted WhatsApp message (English + Urdu bilingual)
  const generatedMessage = useMemo(() => {
    const execLabel = selectedExecutive === 'All' ? 'Team Overview (تمام ایگزیکٹوز)' : selectedExecutive;

    let text = `*TEDOS Support - Daily Summary / روزانہ سپورٹ رپورٹ*\n`;
    text += `📅 *Date:* ${selectedDate}\n`;
    text += `👤 *Executive:* ${execLabel}\n\n`;

    text += `📊 *Daily Overview / کارکردگی کا خلاصہ:*\n`;
    text += `• Total Calls / کل کالز: ${stats.totalCalls}\n`;
    text += `• Total Duration / کل وقت: ${stats.durationStr} (${stats.totalMinutes} min / Target: 420m)\n`;
    text += `• Verified Proofs / تصدیق شدہ ریکارڈنگ: ${stats.verifiedCount} of ${stats.totalCalls}\n\n`;

    text += `🏷️ *Software Usage Status / کلائنٹس استعمال کی صورتحال:*\n`;
    text += `• باقاعدہ استعمال (Regular Users): ${stats.regularUsers}\n`;
    text += `• استعمال نہیں ہو رہا (Not Using): ${stats.notUsing}\n`;
    text += `• ٹریننگ درکار ہے (Need Training): ${stats.needTraining}\n\n`;

    if (filteredLogs.length > 0) {
      text += `📝 *Client Session Log / کالز کی تفصیل:*\n`;
      filteredLogs.forEach((log, index) => {
        const clientName = log.clientName || 'Unknown Client';
        const dur = log.duration || `${log.durationMinutes}m`;
        const tag = log.softwareUsage ? ` [${log.softwareUsage}]` : '';
        const proof = log.proofLink ? `\n   🔗 Proof: ${log.proofLink}` : '';
        text += `${index + 1}. *${clientName}* (${dur})${tag}\n   - Issue: ${log.category || log.issueCategory || 'Support'}${proof}\n`;
      });
      text += `\n`;
    }

    if (customNote.trim()) {
      text += `⚠️ *Special Notes / نوٹس:*\n${customNote.trim()}\n\n`;
    }

    text += `✅ _Generated via TEDOS Support ERP & Compliance Engine_`;

    return text;
  }, [selectedDate, selectedExecutive, stats, filteredLogs, customNote]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(generatedMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareToSupportGroup = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(generatedMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenGroupLink = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    window.open('https://chat.whatsapp.com/FAkeCRc4ohi6YcgmIUACew?s=cl&p=a&mlu=4&ilr=4', '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-md-surface border border-md-surface-variant rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-md-surface-variant bg-emerald-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold">WhatsApp Daily Support Summary</h2>
              <p className="text-xs text-emerald-100">روزانہ کی کارکردگی اور کلائنٹ اسٹیٹس رپورٹ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Controls: Date & Executive selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-md-surface-container-low p-3 rounded-xl border border-md-surface-variant">
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-md-outline uppercase flex items-center gap-1">
                <Calendar size={12} />
                <span>Select Date</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-md-surface border border-md-surface-variant rounded-lg p-2 text-xs font-semibold text-md-on-surface"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-md-outline uppercase flex items-center gap-1">
                <User size={12} />
                <span>Executive Filter</span>
              </label>
              <select
                value={selectedExecutive}
                onChange={(e) => setSelectedExecutive(e.target.value)}
                className="w-full bg-md-surface border border-md-surface-variant rounded-lg p-2 text-xs font-semibold text-md-on-surface"
              >
                <option value="All">All Executives (Team Aggregate)</option>
                {users
                  .filter(u => {
                    const l = (u.name || '').toLowerCase();
                    return !l.includes('asad') && !l.includes('ikhlas') && !l.includes('mahek') && !l.includes('rahul');
                  })
                  .map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.role})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* KPI Mini-cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-md-surface-container-low p-2.5 rounded-xl border border-md-surface-variant">
              <span className="text-[10px] text-md-outline block">Total Calls</span>
              <span className="text-lg font-bold text-md-primary">{stats.totalCalls}</span>
            </div>
            <div className="bg-md-surface-container-low p-2.5 rounded-xl border border-md-surface-variant">
              <span className="text-[10px] text-md-outline block">Logged Time</span>
              <span className="text-lg font-bold text-emerald-600">{stats.durationStr}</span>
            </div>
            <div className="bg-md-surface-container-low p-2.5 rounded-xl border border-md-surface-variant">
              <span className="text-[10px] text-md-outline block">Verified Proofs</span>
              <span className="text-lg font-bold text-blue-600">{stats.verifiedCount}</span>
            </div>
            <div className="bg-md-surface-container-low p-2.5 rounded-xl border border-md-surface-variant">
              <span className="text-[10px] text-md-outline block">Regular Users</span>
              <span className="text-lg font-bold text-purple-600">{stats.regularUsers}</span>
            </div>
          </div>

          {/* Optional remark / notice */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-md-outline uppercase block">
              Additional Observations / Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 2 calls pending follow-up tomorrow, Ali attended server downtime."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full bg-md-surface-container-low border border-md-surface-variant rounded-xl p-2.5 text-xs text-md-on-surface placeholder-md-outline/60 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Formatted Message Preview */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono font-bold text-md-outline uppercase flex items-center gap-1.5">
                <Sparkles size={12} className="text-emerald-600" />
                <span>Generated Urdu / English WhatsApp Output</span>
              </label>
              <span className="text-[10px] text-emerald-600 font-semibold">Ready to paste</span>
            </div>
            <pre className="w-full bg-zinc-900 text-zinc-100 p-3.5 rounded-xl border border-zinc-700 text-[11px] font-mono whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
              {generatedMessage}
            </pre>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-md-surface-variant bg-md-surface-container-low flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-md-outline hover:bg-md-surface transition-colors"
          >
            Close
          </button>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopy}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-md-surface border border-md-surface-variant text-md-on-surface hover:bg-md-surface-container'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Share via standard WhatsApp"
            >
              <Share2 size={13} />
              <span>Share via WA</span>
            </button>

            <button
              onClick={handleShareToSupportGroup}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Copy message & open official Techno Evident support WhatsApp group"
            >
              <MessageSquare size={13} />
              <span>Share to Support Group</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
