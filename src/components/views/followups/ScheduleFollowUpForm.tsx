/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FollowUpTracker, SupportClient, User } from '../../../types';
import { MaterialCard } from '../../common/MaterialCard';
import { getLocalDateOffsetString } from '../../../utils/helpers';
import { CalendarClock, Plus, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScheduleFollowUpFormProps {
  show: boolean;
  onClose: () => void;
  clients: SupportClient[];
  currentUser: User | null;
  todayStr: string;
  isUrdu: boolean;
  addFollowUp: (
    followUp: Partial<FollowUpTracker> & Pick<FollowUpTracker, 'clientId' | 'clientName' | 'reason' | 'priority'>
  ) => void;
  onScheduled: (message: string) => void;
}

export const ScheduleFollowUpForm: React.FC<ScheduleFollowUpFormProps> = ({
  show,
  onClose,
  clients,
  currentUser,
  todayStr,
  isUrdu,
  addFollowUp,
  onScheduled
}) => {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [newReason, setNewReason] = useState('');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [newDate, setNewDate] = useState(() => getLocalDateOffsetString(1));
  const [newTime, setNewTime] = useState('11:00');
  const [newRemarks, setNewRemarks] = useState('');
  const [newNextAction, setNewNextAction] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (show) {
      setNewDate(getLocalDateOffsetString(1));
      setFormError('');
      if (clients.length > 0 && !selectedClientId) {
        setSelectedClientId(clients[0].id);
      }
    }
  }, [show, clients, selectedClientId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === selectedClientId);
    if (!client || !newReason.trim() || !newDate) {
      setFormError(isUrdu ? 'براہ کرم تمام ضروری خانے پُر کریں۔' : 'Please fill in all required fields.');
      return;
    }

    addFollowUp({
      clientId: selectedClientId,
      clientName: client.company,
      reason: newReason.trim(),
      priority: newPriority,
      scheduledDate: newDate,
      scheduledTime: newTime,
      remarks: newRemarks.trim() || 'Scheduled.',
      nextAction: newNextAction.trim() || 'No next action configured.',
      executiveName: currentUser?.name || 'Rahul Sharma',
      lastContactDate: todayStr,
      status: 'Pending',
      syncStatus: 'Synchronized'
    });

    setNewReason('');
    setNewRemarks('');
    setNewNextAction('');
    setFormError('');
    onClose();
    onScheduled('Outreach callback scheduled and synchronized successfully!');
  };

  return (
    <AnimatePresence>
      {show && (
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
                  <span>{isUrdu ? 'کلائنٹ فالو اپ شیڈول کریں' : 'Schedule Client Outreach'}</span>
                </h3>
                <p className="text-[10px] text-md-on-surface-variant/75">
                  {isUrdu ? 'فالو اپ کالز اور کسٹمر رابطہ شیڈول فارم' : 'Minimal typing callbacks and audit parameters.'}
                </p>
              </div>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-md-surface-variant/40 text-md-outline">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
                  {isUrdu ? 'کلائنٹ کا انتخاب *' : 'Support Client *'}
                </label>
                <select
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-3 text-xs text-md-on-surface font-semibold"
                >
                  <option value="" disabled>{isUrdu ? 'کلائنٹ منتخب کریں' : 'Select Target Client'}</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company} ({c.name})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
                  {isUrdu ? 'رابطے کا مقصد / وجہ *' : 'Purpose / Reason *'}
                </label>
                <input
                  type="text"
                  placeholder={isUrdu ? 'مثال: پرنٹر مارجن سیٹنگ فالو اپ یا بلنگ تصدیق' : 'e.g., Audit printer escape spacing on-site'}
                  value={newReason}
                  onChange={e => setNewReason(e.target.value)}
                  required
                  className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-3 text-xs text-md-on-surface"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
                    {isUrdu ? 'مقررہ تاریخ *' : 'Due Date *'}
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-2.5 text-xs text-md-on-surface font-semibold font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
                    {isUrdu ? 'وقت *' : 'Time *'}
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    required
                    className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-2.5 text-xs text-md-on-surface font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
                  {isUrdu ? 'ترجیح / اہمیت' : 'Urgency Priority'}
                </label>
                <div className="grid grid-cols-4 gap-1 bg-md-surface-container-low p-1 rounded-xl border border-md-surface-variant">
                  {(['Low', 'Medium', 'High', 'Critical'] as const).map(p => {
                    const pLabel = isUrdu ? (p === 'Low' ? 'کم' : p === 'Medium' ? 'درمیانی' : p === 'High' ? 'اعلیٰ' : 'ہنگامی') : p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewPriority(p)}
                        className={`py-1.5 text-[10px] font-bold rounded-lg text-center cursor-pointer ${
                          newPriority === p
                            ? p === 'Critical' ? 'bg-red-500 text-white shadow-xs'
                              : p === 'High' ? 'bg-amber-500 text-white shadow-xs'
                              : p === 'Medium' ? 'bg-blue-500 text-white shadow-xs'
                              : 'bg-gray-500 text-white shadow-xs'
                            : 'text-md-outline hover:text-md-on-surface hover:bg-md-surface-variant/20'
                        }`}
                      >
                        {pLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
                    {isUrdu ? 'ابتدائی ریمارکس' : 'Initial Remarks'}
                  </label>
                  <input
                    type="text"
                    placeholder={isUrdu ? 'ریمارکس...' : 'Remarks...'}
                    value={newRemarks}
                    onChange={e => setNewRemarks(e.target.value)}
                    className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-2.5 text-xs text-md-on-surface"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
                    {isUrdu ? 'اگلا ہدف' : 'Next Action Goal'}
                  </label>
                  <input
                    type="text"
                    placeholder={isUrdu ? 'اگلا قدم...' : 'Next Action...'}
                    value={newNextAction}
                    onChange={e => setNewNextAction(e.target.value)}
                    className="w-full rounded-xl border border-md-surface-variant bg-md-surface p-2.5 text-xs text-md-on-surface"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-3 border border-md-surface-variant hover:bg-md-surface-variant/20 rounded-xl font-bold text-center text-md-on-surface cursor-pointer select-none"
                >
                  {isUrdu ? 'منسوخ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-md-primary hover:bg-md-primary/95 text-md-on-primary rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs cursor-pointer select-none"
                >
                  <Plus size={14} />
                  <span>{isUrdu ? 'شیڈول کریں' : 'Schedule'}</span>
                </button>
              </div>
            </form>
          </MaterialCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
