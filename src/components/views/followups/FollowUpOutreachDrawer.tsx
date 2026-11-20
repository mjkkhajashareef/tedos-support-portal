/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { FollowUpTracker, SupportClient, User } from '../../../types';
import { getLocalDateOffsetString } from '../../../utils/helpers';
import { Phone, MessageSquare, CalendarClock, X, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FollowUpOutreachDrawerProps {
  activeOutreachFollowUp: FollowUpTracker | null;
  outreachType: 'call' | 'whatsapp' | 'reschedule' | 'complete' | null;
  clients: SupportClient[];
  currentUser: User | null;
  todayStr: string;
  isUrdu: boolean;
  onClose: () => void;
  updateFollowUp: (id: string, updates: Partial<FollowUpTracker>) => void;
  addFollowUp: (
    followUp: Partial<FollowUpTracker> & Pick<FollowUpTracker, 'clientId' | 'clientName' | 'reason' | 'priority'>
  ) => void;
  updateClientStatus: (clientId: string, status: 'Critical' | 'Warning' | 'Active' | 'Inactive') => void;
  onActionSuccess: (msg: string) => void;
}

const WHATSAPP_TEMPLATES = [
  {
    id: '1',
    title: 'Daily Check-in',
    text: (client: string, exec: string) =>
      `Dear ${client} Management, following up from Techno Evident Support to confirm if your billing and local synchronization terminals are running smoothly today. Regards, ${exec}.`
  },
  {
    id: '2',
    title: 'License Expiry Watch',
    text: (client: string, exec: string) =>
      `Urgent Notice: Dear ${client}, our records show your software subscription expires soon. Please connect back with us at your earliest convenience to maintain cloud backup features. Regards, ${exec}.`
  },
  {
    id: '3',
    title: 'Post-Setup Audit',
    text: (client: string, exec: string) =>
      `Hello ${client}, we completed your printer escape configurations yesterday. Please confirm if receipt alignment is working fine under live workload today. Regards, ${exec}.`
  }
];

export const FollowUpOutreachDrawer: React.FC<FollowUpOutreachDrawerProps> = ({
  activeOutreachFollowUp,
  outreachType,
  clients,
  currentUser,
  todayStr,
  isUrdu,
  onClose,
  updateFollowUp,
  addFollowUp,
  updateClientStatus,
  onActionSuccess
}) => {
  const [callOutcome, setCallOutcome] = useState('Answered & Resolved');
  const [updatedClientHealth, setUpdatedClientHealth] = useState<'Critical' | 'Warning' | 'Active' | 'Inactive'>('Active');
  const [callRemarks, setCallRemarks] = useState('');

  const [selectedTemplateId, setSelectedTemplateId] = useState('1');
  const [whatsappRemarks, setWhatsappRemarks] = useState('');

  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('12:00');
  const [rescheduleRemarks, setRescheduleRemarks] = useState('');

  useEffect(() => {
    if (!activeOutreachFollowUp) return;
    if (outreachType === 'call') {
      setCallOutcome('Answered & Resolved');
      const client = clients.find(c => c.id === activeOutreachFollowUp.clientId);
      setUpdatedClientHealth(client?.status || 'Active');
    } else if (outreachType === 'whatsapp') {
      setSelectedTemplateId('1');
    } else if (outreachType === 'reschedule') {
      setRescheduleDate(activeOutreachFollowUp.scheduledDate);
      setRescheduleTime(activeOutreachFollowUp.scheduledTime);
    }
  }, [activeOutreachFollowUp, outreachType, clients]);

  const activeTemplateText = useMemo(() => {
    if (!activeOutreachFollowUp) return '';
    const template = WHATSAPP_TEMPLATES.find(t => t.id === selectedTemplateId) || WHATSAPP_TEMPLATES[0];
    return template.text(
      activeOutreachFollowUp.clientName,
      activeOutreachFollowUp.executiveName || currentUser?.name || 'Rahul Sharma'
    );
  }, [selectedTemplateId, activeOutreachFollowUp, currentUser]);

  const handleLogCall = () => {
    if (!activeOutreachFollowUp) return;
    const isRescheduled =
      callOutcome === 'Busy / Callback Requested' || callOutcome === 'No Answer (Scheduled Retry)';
    const finalStatus: 'Completed' | 'Rescheduled' = isRescheduled ? 'Rescheduled' : 'Completed';
    const outreachRemarks = `[Call Outcome: ${callOutcome}] ${callRemarks || 'No addition comments entered'}.`;

    updateFollowUp(activeOutreachFollowUp.id, {
      status: finalStatus,
      remarks: outreachRemarks,
      lastContactDate: todayStr
    });
    updateClientStatus(activeOutreachFollowUp.clientId, updatedClientHealth);

    if (finalStatus === 'Rescheduled') {
      addFollowUp({
        clientId: activeOutreachFollowUp.clientId,
        clientName: activeOutreachFollowUp.clientName,
        reason: `Retry callback: ${activeOutreachFollowUp.reason}`,
        priority: activeOutreachFollowUp.priority,
        scheduledDate: getLocalDateOffsetString(1),
        scheduledTime: activeOutreachFollowUp.scheduledTime,
        executiveName: activeOutreachFollowUp.executiveName,
        lastContactDate: todayStr,
        remarks: 'Auto-rescheduled from failed outreach call session.',
        status: 'Pending',
        syncStatus: 'Synchronized'
      });
      onActionSuccess('Call outcome recorded. Automatically scheduled retry for tomorrow!');
    } else {
      onActionSuccess('Call logged! Outreach marked as Completed and Client Health updated.');
    }

    setCallRemarks('');
    onClose();
  };

  const handleSendWhatsApp = () => {
    if (!activeOutreachFollowUp) return;
    navigator.clipboard.writeText(activeTemplateText);
    updateFollowUp(activeOutreachFollowUp.id, {
      status: 'Completed',
      remarks: `[WhatsApp Sent - Template: ${selectedTemplateId}] ${whatsappRemarks || 'Sent template outreach message.'}.`,
      lastContactDate: todayStr
    });
    onActionSuccess('WhatsApp message copied to clipboard! Marked outreach activity as Completed.');
    setWhatsappRemarks('');
    onClose();
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOutreachFollowUp || !rescheduleDate) return;

    updateFollowUp(activeOutreachFollowUp.id, {
      status: 'Rescheduled',
      remarks: `Rescheduled to ${rescheduleDate} ${rescheduleTime}. Reason: ${rescheduleRemarks || 'Operational reschedule.'}`
    });
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
    onActionSuccess(`Outreach successfully rescheduled. New callback planned for ${rescheduleDate}!`);
    setRescheduleRemarks('');
    onClose();
  };

  return (
    <AnimatePresence>
      {activeOutreachFollowUp && outreachType && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-0 animate-fade-in">
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-lg bg-md-surface rounded-t-3xl border-t border-md-surface-variant p-5 space-y-4 max-h-[85vh] overflow-y-auto pb-8 shadow-2xl z-10"
          >
            <div className="w-12 h-1 bg-md-outline/20 rounded-full mx-auto select-none" />

            {outreachType === 'call' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-md-surface-variant pb-2 select-none">
                  <div>
                    <h3 className="text-sm font-black text-md-on-surface flex items-center gap-2">
                      <Phone size={16} className="text-md-primary animate-bounce" />
                      <span>{isUrdu ? 'کال لاگ سیشن درج کریں' : 'Log Call Outcome Session'}</span>
                    </h3>
                    <p className="text-[10px] text-md-outline mt-0.5">
                      {isUrdu ? 'کلائنٹ:' : 'Client:'} <strong>{activeOutreachFollowUp.clientName}</strong> •{' '}
                      {clients.find(c => c.id === activeOutreachFollowUp.clientId)?.phone || '+91 XXXXX XXXXX'}
                    </p>
                  </div>
                  <button onClick={onClose} className="p-1 rounded-full hover:bg-md-surface-variant/40">
                    <X size={15} />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase block select-none">
                    {isUrdu ? 'کال کا نتیجہ منتخب کریں (ون ٹچ انتخاب)' : 'Call Outcome (One-Touch Selects)'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { en: 'Answered & Resolved', ur: 'کال اٹینڈ ہوئی اور مسئلہ حل ہوا' },
                      { en: 'Busy / Callback Requested', ur: 'مصروف / دوبارہ کال کی درخواست' },
                      { en: 'No Answer (Scheduled Retry)', ur: 'جواب نہیں ملا (دوبارہ وقت طے)' },
                      { en: 'Disconnect / Invalid Number', ur: 'غلط نمبر / کال کٹ گئی' }
                    ].map(item => (
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

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase block select-none">
                    {isUrdu ? 'کلائنٹ ہیلتھ اسٹیٹس اپ ڈیٹ کریں' : 'Assess Client Health Status (SOP Trigger)'}
                  </label>
                  <div className="grid grid-cols-4 gap-1 bg-md-surface-container-low p-1 rounded-xl border border-md-surface-variant">
                    {(['Active', 'Warning', 'Critical', 'Inactive'] as const).map(health => {
                      const hLabel = isUrdu
                        ? health === 'Active' ? 'فعال' : health === 'Warning' ? 'وارننگ' : health === 'Critical' ? 'نازک' : 'غیرفعال'
                        : health;
                      return (
                        <button
                          key={health}
                          type="button"
                          onClick={() => setUpdatedClientHealth(health)}
                          className={`py-2 text-[10px] font-bold rounded-lg text-center cursor-pointer ${
                            updatedClientHealth === health
                              ? health === 'Critical' ? 'bg-red-500 text-white shadow-xs'
                                : health === 'Warning' ? 'bg-amber-500 text-white shadow-xs'
                                : health === 'Active' ? 'bg-emerald-500 text-white shadow-xs'
                                : 'bg-gray-500 text-white shadow-xs'
                              : 'text-md-outline hover:text-md-on-surface hover:bg-md-surface-variant/20'
                          }`}
                        >
                          {hLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase block">
                    {isUrdu ? 'کال سیشن ریمارکس (اختیاری)' : 'Call Session Remarks (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={isUrdu ? 'مثال: پرنٹر کی سیٹنگ درست ہو گئی ہے اور کسٹمر مطمئن ہے۔' : 'e.g. Printer is working perfectly fine now. Backups verified.'}
                    value={callRemarks}
                    onChange={e => setCallRemarks(e.target.value)}
                    className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-3 text-xs text-md-on-surface"
                  />
                </div>

                <button
                  onClick={handleLogCall}
                  className="w-full py-3.5 bg-md-primary hover:bg-md-primary/95 text-md-on-primary rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <UserCheck size={14} />
                  <span>{isUrdu ? 'کال لاگ محفوظ کریں' : 'Commit Call Log to Sheet'}</span>
                </button>
              </div>
            )}

            {outreachType === 'whatsapp' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-md-surface-variant pb-2 select-none">
                  <div>
                    <h3 className="text-sm font-black text-md-on-surface flex items-center gap-2">
                      <MessageSquare size={16} className="text-emerald-600 animate-pulse" />
                      <span>{isUrdu ? 'واٹس ایپ میسج آؤٹ باکس ٹیمپلیٹ' : 'WhatsApp Script Outbox Template'}</span>
                    </h3>
                    <p className="text-[10px] text-md-outline mt-0.5">
                      {isUrdu ? 'کلائنٹ:' : 'Client:'} <strong>{activeOutreachFollowUp.clientName}</strong>
                    </p>
                  </div>
                  <button onClick={onClose} className="p-1 rounded-full hover:bg-md-surface-variant/40">
                    <X size={15} />
                  </button>
                </div>

                <div className="space-y-1 select-none">
                  <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase block">
                    {isUrdu ? 'میسج ٹیمپلیٹ منتخب کریں' : 'Select Messaging Template (Zero Typing)'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {WHATSAPP_TEMPLATES.map(tpl => {
                      const titleLabel = isUrdu
                        ? tpl.id === '1' ? 'روزانہ چیک ان' : tpl.id === '2' ? 'لائسنس الرٹ' : 'سیٹ اپ آڈٹ'
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

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase block">
                    {isUrdu ? 'تیار کردہ میسج (کاپی ہو جائے گا)' : 'Live Draft Script (Copies on Commit)'}
                  </label>
                  <div className="p-3.5 rounded-2xl border border-emerald-300 bg-emerald-500/5 text-xs text-md-on-surface leading-relaxed whitespace-pre-wrap select-all font-medium">
                    {activeTemplateText}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase block">
                    {isUrdu ? 'اندرونی نوٹس (اختیاری)' : 'Internal WhatsApp Log Notes (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={isUrdu ? 'مثال: کلائنٹ کو رینیول میسج واٹس ایپ کیا گیا۔' : 'e.g. Sent renewal follow-up message on client request.'}
                    value={whatsappRemarks}
                    onChange={e => setWhatsappRemarks(e.target.value)}
                    className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-3 text-xs text-md-on-surface"
                  />
                </div>

                <button
                  onClick={handleSendWhatsApp}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <MessageSquare size={14} />
                  <span>{isUrdu ? 'کاپی کریں اور مکمل مارک کریں' : 'Copy Draft & Mark Completed'}</span>
                </button>
              </div>
            )}

            {outreachType === 'reschedule' && (
              <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-md-surface-variant pb-2">
                  <div>
                    <h3 className="text-sm font-black text-md-on-surface flex items-center gap-2">
                      <CalendarClock size={16} className="text-blue-600" />
                      <span>{isUrdu ? 'دوبارہ فالو اپ کا وقت طے کریں' : 'Reschedule Outreach Callback'}</span>
                    </h3>
                    <p className="text-[10px] text-md-outline mt-0.5">
                      {isUrdu ? 'کلائنٹ:' : 'Operational retry planner for:'}{' '}
                      <strong>{activeOutreachFollowUp.clientName}</strong>
                    </p>
                  </div>
                  <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-md-surface-variant/40">
                    <X size={15} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
                      {isUrdu ? 'نئی تاریخ *' : 'New Due Date *'}
                    </label>
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={e => setRescheduleDate(e.target.value)}
                      required
                      className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-3 text-xs font-semibold font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
                      {isUrdu ? 'نیا وقت *' : 'New Due Time *'}
                    </label>
                    <input
                      type="time"
                      value={rescheduleTime}
                      onChange={e => setRescheduleTime(e.target.value)}
                      required
                      className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-3 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
                    {isUrdu ? 'دوبارہ وقت دینے کی وجہ *' : 'Rescheduling Reason / Remarks *'}
                  </label>
                  <input
                    type="text"
                    placeholder={isUrdu ? 'مثال: کلائنٹ نے شام کے وقت رابطہ کرنے کو کہا۔' : 'e.g. Client requested callback in the evening.'}
                    value={rescheduleRemarks}
                    onChange={e => setRescheduleRemarks(e.target.value)}
                    required
                    className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-3 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CalendarClock size={14} />
                  <span>{isUrdu ? 'نیا وقت محفوظ کریں' : 'Confirm Reschedule Log'}</span>
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
