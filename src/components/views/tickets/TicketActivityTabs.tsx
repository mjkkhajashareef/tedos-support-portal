/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Ticket, WorkLogEntry, FollowUpTracker, User } from '../../../types';
import { MaterialCard } from '../../common/MaterialCard';
import { VoiceDictationButton } from '../../common/VoiceDictationButton';
import { getLocalDateString, getLocalDateOffsetString } from '../../../utils/helpers';
import { TICKET_WORK_TYPES, TICKET_STATUS_OPTIONS } from './ticketStyleUtils';
import { TicketTimelinePanel } from './TicketTimelinePanel';
import {
  Clock,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  Calendar,
  Sparkles
} from 'lucide-react';

interface TicketActivityTabsProps {
  activeTab: 'timeline' | 'worklog' | 'followup';
  selectedTicket: Ticket;
  currentUser: User | null;
  isUrdu: boolean;
  addTicketWorkLog: (
    ticketId: string,
    log: Omit<WorkLogEntry, 'id' | 'ticketId' | 'timestamp' | 'date' | 'time' | 'syncStatus'>
  ) => void;
  addTicketFollowUp: (
    ticketId: string,
    followUp: Omit<FollowUpTracker, 'id' | 'ticketId' | 'syncStatus'>
  ) => void;
}

export const TicketActivityTabs: React.FC<TicketActivityTabsProps> = ({
  activeTab,
  selectedTicket,
  currentUser,
  isUrdu,
  addTicketWorkLog,
  addTicketFollowUp
}) => {
  const [wlCategory, setWlCategory] = useState('Phone Call');
  const [wlStatus, setWlStatus] = useState('Completed');
  const [wlDuration, setWlDuration] = useState<number>(15);
  const [wlSummary, setWlSummary] = useState('');
  const [wlRemarks, setWlRemarks] = useState('');
  const [wlFollowUpDate, setWlFollowUpDate] = useState(() => getLocalDateOffsetString(1));
  const [wlFormError, setWlFormError] = useState('');
  const [wlSuccess, setWlSuccess] = useState(false);

  const [fReason, setFReason] = useState('');
  const [fAction, setFAction] = useState('');
  const [fDate, setFDate] = useState(() => getLocalDateOffsetString(1));
  const [fTime, setFTime] = useState('11:00');
  const [fPriority, setFPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [fFormError, setFFormError] = useState('');
  const [fSuccess, setFSuccess] = useState(false);

  useEffect(() => {
    setWlSuccess(false);
    setFSuccess(false);
    const tomorrow = getLocalDateOffsetString(1);
    setWlFollowUpDate(tomorrow);
    setFDate(tomorrow);
  }, [selectedTicket.id]);

  const handleQuickWorkLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wlSummary.trim()) {
      setWlFormError('Please summarize the work performed.');
      return;
    }
    addTicketWorkLog(selectedTicket.id, {
      clientId: selectedTicket.clientId,
      clientName: selectedTicket.clientName,
      executiveName: currentUser?.name || 'Support Executive',
      teId: selectedTicket.teId,
      category: wlCategory,
      details: wlSummary,
      status: wlStatus,
      nextFollowUpDate: wlFollowUpDate,
      priority: selectedTicket.priority,
      durationMinutes: wlDuration,
      remarks: wlRemarks
    });
    setWlSummary('');
    setWlRemarks('');
    setWlFormError('');
    setWlSuccess(true);
    setTimeout(() => setWlSuccess(false), 3000);
  };

  const handleAIPolishSummary = () => {
    const raw = wlSummary.trim();
    if (!raw) {
      setWlSummary(
        `[${wlCategory}] Connected with ${selectedTicket.clientName || 'Client'}. Diagnosed issue (${selectedTicket.issueCategory}), verified database & printer setup, and confirmed smooth operation. Status: ${wlStatus}.`
      );
      return;
    }
    setWlSummary(
      `[${wlCategory} - ${wlStatus}] ${raw.charAt(0).toUpperCase() + raw.slice(1)}${raw.endsWith('.') ? '' : '.'} Verified with ${selectedTicket.clientName}.`
    );
  };

  const handleQuickFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fReason.trim()) {
      setFFormError('Please specify the follow-up callback reason.');
      return;
    }
    addTicketFollowUp(selectedTicket.id, {
      clientId: selectedTicket.clientId,
      clientName: selectedTicket.clientName,
      teId: selectedTicket.teId,
      executiveName: currentUser?.name || 'Support Executive',
      scheduledDate: fDate || getLocalDateString(),
      scheduledTime: fTime,
      priority: fPriority,
      lastContactDate: getLocalDateString(),
      status: 'Pending',
      reason: fReason,
      remarks: '',
      nextAction: fAction || 'Callback verification'
    });
    setFReason('');
    setFAction('');
    setFFormError('');
    setFSuccess(true);
    setTimeout(() => setFSuccess(false), 3000);
  };

  if (activeTab === 'timeline') {
    return <TicketTimelinePanel selectedTicket={selectedTicket} isUrdu={isUrdu} />;
  }

  if (activeTab === 'worklog') {
    return (
      <MaterialCard className="p-6">
        <form onSubmit={handleQuickWorkLogSubmit} className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-md-surface-variant/60">
            <h3 className="text-sm font-bold text-md-on-surface flex items-center gap-2">
              <Clock size={16} className="text-md-primary" />{' '}
              {isUrdu ? 'فوری سپورٹ ورک لاگ اندراج' : 'Log Ticket activity in 30 Seconds'}
            </h3>
            <span className="text-[10px] text-md-outline font-medium">
              {isUrdu ? 'براہ راست ٹائم لائن سے منسلک' : 'Direct Timeline Sync'}
            </span>
          </div>

          {wlSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />{' '}
              {isUrdu ? 'ورک لاگ کامیابی سے ٹکٹ ٹائم لائن میں شامل ہو گیا!' : 'Work Log registered successfully onto ticket timeline!'}
            </div>
          )}

          {wlFormError && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600" /> {wlFormError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-md-surface-container-lowest border border-md-surface-variant/60 p-3 rounded-xl flex flex-col justify-center">
              <span className="text-[10px] font-bold text-md-outline uppercase">{isUrdu ? 'سپورٹ ایگزیکٹو' : 'Logged Executive'}</span>
              <span className="text-xs font-bold text-md-on-surface flex items-center gap-1.5 mt-0.5">
                <UserIcon size={13} /> {currentUser?.name || 'Support Executive'}
              </span>
            </div>
            <div className="bg-md-surface-container-lowest border border-md-surface-variant/60 p-3 rounded-xl flex flex-col justify-center">
              <span className="text-[10px] font-bold text-md-outline uppercase">{isUrdu ? 'تاریخ / وقت' : 'Date / Time'}</span>
              <span className="text-xs font-bold text-md-on-surface flex items-center gap-1.5 mt-0.5">
                <Calendar size={13} /> {new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="bg-md-surface-container-lowest border border-md-surface-variant/60 p-3 rounded-xl flex flex-col justify-center">
              <span className="text-[10px] font-bold text-md-outline uppercase">{isUrdu ? 'فعال ٹکٹ آئی ڈی' : 'Active ID link'}</span>
              <span className="text-xs font-mono font-bold text-md-primary mt-0.5">{selectedTicket.id}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? 'کام کی نوعیت' : 'Work Type'}</label>
              <select
                value={wlCategory}
                onChange={e => setWlCategory(e.target.value)}
                className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden"
              >
                {TICKET_WORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? 'سرگرمی کا اسٹیٹس' : 'Activity Status'}</label>
              <select
                value={wlStatus}
                onChange={e => setWlStatus(e.target.value)}
                className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden"
              >
                {TICKET_STATUS_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? 'اگلی فالو اپ تاریخ' : 'Follow-up Date'}</label>
              <input
                type="date"
                value={wlFollowUpDate}
                onChange={e => setWlFollowUpDate(e.target.value)}
                className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2 text-xs font-medium outline-hidden"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-md-outline uppercase">{isUrdu ? 'کام کا دورانیہ (منٹ)' : 'Duration (Minutes)'}</label>
              <span className="text-xs font-mono text-md-primary font-bold">{wlDuration} {isUrdu ? 'منٹ' : 'Minutes'}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={wlDuration}
                onChange={e => setWlDuration(Number(e.target.value))}
                className="flex-1 accent-md-primary"
              />
              <div className="flex gap-1">
                {[10, 15, 30, 45, 60].map(mins => (
                  <button
                    type="button"
                    key={mins}
                    onClick={() => setWlDuration(mins)}
                    className={`px-2 py-1 text-[10px] rounded font-bold border transition cursor-pointer ${
                      wlDuration === mins
                        ? 'bg-md-primary text-md-on-primary border-md-primary'
                        : 'bg-md-surface-container-lowest text-md-on-surface-variant border-md-surface-variant hover:bg-md-surface-variant/20'
                    }`}
                  >
                    {mins}{isUrdu ? ' منٹ' : 'm'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 flex-wrap gap-2">
              <label className="block text-xs font-bold text-md-outline uppercase">{isUrdu ? 'کام کی تفصیل اور حل' : 'Activity Summary'}</label>
              <div className="flex items-center gap-1.5">
                <VoiceDictationButton
                  onTranscript={text => setWlSummary(prev => (prev ? prev + ' ' + text : text))}
                  defaultLang="ur-PK"
                />
                <button
                  type="button"
                  onClick={handleAIPolishSummary}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 py-1 px-2.5 rounded hover:bg-emerald-100 transition cursor-pointer"
                >
                  <Sparkles size={11} /> {isUrdu ? 'AI کے ذریعے درست کریں' : '✨ AI Polish Summary'}
                </button>
              </div>
            </div>
            <textarea
              placeholder={isUrdu ? 'آپ نے کیا کام کیا؟ تفصیلی نوٹس یہاں لکھیں...' : 'What did you do? Write notes or press AI Polish...'}
              value={wlSummary}
              onChange={e => setWlSummary(e.target.value)}
              rows={3}
              className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl p-3 text-xs font-medium outline-hidden resize-none focus:ring-1 focus:ring-md-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? 'اندرونی دفتری ریمارکس' : 'Remarks / Internal notes'}</label>
            <input
              type="text"
              placeholder={isUrdu ? 'اختیاری اندرونی دفتری ریمارکس...' : 'Optional internal executive notes...'}
              value={wlRemarks}
              onChange={e => setWlRemarks(e.target.value)}
              className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden focus:ring-1 focus:ring-md-primary"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-md-primary hover:bg-md-primary/95 text-md-on-primary py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition cursor-pointer flex justify-center items-center gap-2"
          >
            {isUrdu ? 'ورک لاگ ٹکٹ میں محفوظ کریں' : 'Submit 30s Work Log'}
          </button>
        </form>
      </MaterialCard>
    );
  }

  return (
    <MaterialCard className="p-6">
      <form onSubmit={handleQuickFollowUpSubmit} className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-md-surface-variant/60">
          <h3 className="text-sm font-bold text-md-on-surface flex items-center gap-2">
            <CalendarClock size={16} className="text-md-primary" /> {isUrdu ? 'فالو اپ کال شیڈول کریں' : 'Schedule Callback Follow-up'}
          </h3>
          <span className="text-[10px] text-md-outline font-medium">{isUrdu ? 'ٹیکنو ایویڈنٹ SOP' : 'Techno Evident Support SOP'}</span>
        </div>

        {fSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />{' '}
            {isUrdu ? 'فالو اپ کال کامیابی سے ٹکٹ ٹائم لائن میں درج ہو گئی!' : 'Follow-up callback registered onto ticket timeline!'}
          </div>
        )}

        {fFormError && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600" /> {fFormError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? 'شیڈول تاریخ' : 'Scheduled Date'}</label>
            <input
              type="date"
              value={fDate}
              onChange={e => setFDate(e.target.value)}
              className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2 text-xs font-medium outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? 'شیڈول وقت' : 'Scheduled Time'}</label>
            <input
              type="time"
              value={fTime}
              onChange={e => setFTime(e.target.value)}
              className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2 text-xs font-medium outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? 'ترجیح' : 'Priority'}</label>
            <select
              value={fPriority}
              onChange={e => setFPriority(e.target.value as any)}
              className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden"
            >
              <option value="Low">{isUrdu ? 'معمولی ترجیح (Low)' : 'Low Priority'}</option>
              <option value="Medium">{isUrdu ? 'درمیانی ترجیح (Medium)' : 'Medium Priority'}</option>
              <option value="High">{isUrdu ? 'زیادہ ترجیح (High)' : 'High Priority'}</option>
              <option value="Critical">{isUrdu ? 'انتہائی اہم ترجیح (Critical)' : 'Critical Priority'}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? 'اگلا ہدف / اقدام' : 'Target Next Action'}</label>
            <input
              type="text"
              placeholder={isUrdu ? 'مثال: پرنٹر مارجن تصدیق کے لیے کال...' : 'e.g. Printer margin alignment validation'}
              value={fAction}
              onChange={e => setFAction(e.target.value)}
              className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden focus:ring-1 focus:ring-md-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? 'فالو اپ کال کا مقصد' : 'Callback Follow-up Purpose'}</label>
          <textarea
            placeholder={isUrdu ? 'کلائنٹ کو دوبارہ رابطہ کرنے کا مقصد درج کریں...' : 'State the objective of the followup callback call...'}
            value={fReason}
            onChange={e => setFReason(e.target.value)}
            rows={3}
            className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl p-3 text-xs font-medium outline-hidden resize-none focus:ring-1 focus:ring-md-primary"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-md-primary hover:bg-md-primary/95 text-md-on-primary py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition cursor-pointer flex justify-center items-center gap-2"
        >
          {isUrdu ? 'فالو اپ کال محفوظ کریں' : 'Schedule Support Callback'}
        </button>
      </form>
    </MaterialCard>
  );
};
