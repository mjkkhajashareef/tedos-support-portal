/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FollowUpTracker, SupportClient } from '../../../types';
import { MaterialCard } from '../../common/MaterialCard';
import {
  User,
  CalendarClock,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  MessageSquare,
  Star,
  Phone,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';

interface FollowUpCardProps {
  followUp: FollowUpTracker;
  clientObj?: SupportClient;
  isExpanded: boolean;
  isUrdu: boolean;
  onToggleExpand: () => void;
  onEscalate: (f: FollowUpTracker) => void;
  onOpenReschedule: (f: FollowUpTracker) => void;
  onOpenWhatsApp: (f: FollowUpTracker) => void;
  onOpenGoogleReview: (client: SupportClient | null) => void;
  onOpenCallLog: (f: FollowUpTracker, client?: SupportClient) => void;
}

export const FollowUpCard: React.FC<FollowUpCardProps> = ({
  followUp: f,
  clientObj,
  isExpanded,
  isUrdu,
  onToggleExpand,
  onEscalate,
  onOpenReschedule,
  onOpenWhatsApp,
  onOpenGoogleReview,
  onOpenCallLog
}) => {
  return (
    <MaterialCard
      variant="outlined"
      className={`p-4 transition-all duration-300 relative overflow-hidden ${
        f.priority === 'Critical'
          ? 'border-red-400 bg-red-500/3'
          : f.priority === 'High'
          ? 'border-amber-400 bg-amber-500/3'
          : 'border-md-surface-variant'
      }`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          f.priority === 'Critical'
            ? 'bg-red-500'
            : f.priority === 'High'
            ? 'bg-amber-500'
            : f.priority === 'Medium'
            ? 'bg-blue-500'
            : 'bg-gray-400'
        }`}
      />

      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono font-black text-md-primary bg-md-primary/5 border border-md-primary/10 px-1.5 py-0.5 rounded">
              {f.teId}
            </span>
            <h4 className="text-xs font-black text-md-on-surface mt-1 block">{f.clientName}</h4>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span
              className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full select-none ${
                f.priority === 'Critical'
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : f.priority === 'High'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : f.priority === 'Medium'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              {f.priority}
            </span>

            <span
              className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                f.status === 'Completed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : f.status === 'Rescheduled'
                  ? 'bg-blue-100 text-blue-800'
                  : f.status === 'Escalated'
                  ? 'bg-red-100 text-red-800 animate-pulse'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {f.status}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-md-on-surface-variant font-bold leading-relaxed">{f.reason}</p>

        <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-md-outline py-2 border-y border-dashed border-md-surface-variant/60 select-none">
          <div className="flex items-center gap-1">
            <User size={10} className="text-md-outline" />
            <span>
              {isUrdu ? 'ایگزیکٹو:' : 'Executive:'} <strong>{f.executiveName}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <CalendarClock size={10} className="text-md-outline" />
            <span>
              {isUrdu ? 'مقررہ وقت:' : 'Due:'}{' '}
              <strong>
                {f.scheduledDate} {f.scheduledTime}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={10} className="text-md-outline" />
            <span>
              {isUrdu ? 'آخری رابطہ:' : 'Last Touch:'} <strong>{f.lastContactDate || (isUrdu ? 'کبھی نہیں' : 'Never')}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <TrendingUp size={10} className="text-md-outline" />
            <span>
              {isUrdu ? 'کلائنٹ اسٹیٹس:' : 'Client status:'}{' '}
              <strong
                className={
                  clientObj?.status === 'Critical'
                    ? 'text-red-600'
                    : clientObj?.status === 'Warning'
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }
              >
                {clientObj?.status || 'Active'}
              </strong>
            </span>
          </div>
        </div>

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-[10px] space-y-2 pt-2 bg-md-surface-container-low/40 p-2.5 rounded-xl border border-md-outline/5 text-md-outline"
          >
            {f.remarks && (
              <p className="leading-relaxed">
                <strong>{isUrdu ? 'سپورٹ ریمارکس:' : 'Support Remarks:'}</strong> {f.remarks}
              </p>
            )}
            {f.nextAction && (
              <p className="leading-relaxed">
                <strong>{isUrdu ? 'اگلا ہدف:' : 'Next Action Milestone:'}</strong> {f.nextAction}
              </p>
            )}
            <p className="text-[8px] font-mono opacity-80 select-none">
              Record Hash ID: {f.id} • Sync: {f.syncStatus}
            </p>
          </motion.div>
        )}

        <div className="flex items-center justify-between gap-1.5 pt-1.5">
          <button
            onClick={onToggleExpand}
            className="px-2.5 py-2.5 rounded-xl text-[10px] font-bold text-md-outline hover:text-md-on-surface hover:bg-md-surface-variant/30 flex items-center gap-1 cursor-pointer select-none"
          >
            {isExpanded ? (
              <>
                <ChevronUp size={11} />
                <span>{isUrdu ? 'چھپائیں' : 'Hide'}</span>
              </>
            ) : (
              <>
                <ChevronDown size={11} />
                <span>{isUrdu ? 'تفصیلات' : 'Details'}</span>
              </>
            )}
          </button>

          {f.status === 'Pending' ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => onEscalate(f)}
                className="p-2.5 rounded-xl bg-red-100 hover:bg-red-200 border border-red-200 text-red-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                title={isUrdu ? 'سپروائزر کو بھیجیں' : 'Escalate followup to support supervisor'}
              >
                <ShieldAlert size={12} />
                <span>{isUrdu ? 'اعلیٰ افسر' : 'Escalate'}</span>
              </button>

              <button
                onClick={() => onOpenReschedule(f)}
                className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                title={isUrdu ? 'دوبارہ وقت طے کریں' : 'Reschedule callback outreach'}
              >
                <CalendarClock size={12} />
                <span>{isUrdu ? 'نیا وقت' : 'Reschedule'}</span>
              </button>

              <button
                onClick={() => onOpenWhatsApp(f)}
                className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer animate-pulse"
                title={isUrdu ? 'واٹس ایپ پیغام بھیجیں' : 'Launch WhatsApp template outbox copy'}
              >
                <MessageSquare size={12} />
                <span>{isUrdu ? 'واٹس ایپ' : 'WhatsApp'}</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenGoogleReview(clientObj || null)}
                className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 font-bold text-[10px] flex items-center gap-1 cursor-pointer select-none"
                title={isUrdu ? 'گوگل میپس ریویو لنک کسٹمر کو بھیجیں' : 'Send Google Maps review request'}
              >
                <Star size={12} className="text-amber-500 fill-amber-500" />
                <span>{isUrdu ? 'ریویو' : 'Review'}</span>
              </button>

              <button
                onClick={() => onOpenCallLog(f, clientObj)}
                className="p-2.5 rounded-xl bg-md-primary hover:bg-md-primary/90 text-md-on-primary font-black text-[10px] flex items-center gap-1 cursor-pointer"
                title={isUrdu ? 'فون کال لاگ درج کریں' : 'Simulate telephone phone call'}
              >
                <Phone size={12} />
                <span>{isUrdu ? 'کال لاگ' : 'Call Log'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 font-semibold text-[10px] text-emerald-600 select-none">
              <Check size={12} />
              <span>{isUrdu ? 'مکمل شدہ آؤٹ ریچ' : 'Processed outreach'}</span>
            </div>
          )}
        </div>
      </div>
    </MaterialCard>
  );
};
