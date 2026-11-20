/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Ticket } from '../../../types';
import { MaterialCard } from '../../common/MaterialCard';
import {
  Ticket as TicketIcon,
  History,
  Info,
  Clock,
  CalendarClock,
  MessageSquareCode,
  GraduationCap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface TicketTimelinePanelProps {
  selectedTicket: Ticket;
  isUrdu: boolean;
}

export const TicketTimelinePanel: React.FC<TicketTimelinePanelProps> = ({
  selectedTicket,
  isUrdu
}) => {
  return (
    <MaterialCard className="p-6 space-y-6">
      <div className="flex justify-between items-center pb-2 border-b border-md-surface-variant/60">
        <h3 className="text-sm font-bold text-md-on-surface flex items-center gap-2">
          <History size={16} className="text-md-primary" />{' '}
          {isUrdu ? 'سرگرمیوں کا مکمل ریکارڈ (Audit Log)' : 'Chronicle Activity Audit Log'}
        </h3>
        <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded uppercase">
          {isUrdu ? 'تصدیق شدہ و محفوظ' : 'Verified Secure'}
        </span>
      </div>

      <div className="relative border-l-2 border-md-surface-variant ml-3 pl-6 space-y-6">
        {selectedTicket.timeline.map((entry, idx) => {
          let iconColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
          let IconNode = Info;
          if (entry.type === 'Ticket Created') {
            iconColor = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
            IconNode = TicketIcon;
          } else if (entry.type === 'Work Log Added') {
            iconColor = 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
            IconNode = Clock;
          } else if (entry.type === 'Follow-up Scheduled') {
            iconColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            IconNode = CalendarClock;
          } else if (entry.type === 'WhatsApp Sent') {
            iconColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
            IconNode = MessageSquareCode;
          } else if (entry.type === 'Training Conducted') {
            iconColor = 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
            IconNode = GraduationCap;
          } else if (entry.type === 'Resolved' || entry.type === 'Closed') {
            iconColor = 'bg-emerald-500 text-white';
            IconNode = CheckCircle2;
          } else if (entry.type === 'Issue Escalated') {
            iconColor = 'bg-red-500 text-white';
            IconNode = AlertTriangle;
          }

          return (
            <div key={entry.id || idx} className="relative">
              <span
                className={`absolute -left-[37px] top-0.5 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-md-background ${iconColor}`}
              >
                <IconNode size={12} />
              </span>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-md-on-surface">{entry.type}</span>
                <span className="text-[10px] text-md-outline font-medium font-mono">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-xs font-medium text-md-outline mt-1 font-mono uppercase">
                {isUrdu ? 'بذریعہ: ' : 'Performed By: '}
                {entry.performedBy}
              </p>
              <p className="text-xs font-medium text-md-on-surface-variant/90 bg-md-surface-container-lowest border border-md-surface-variant/40 p-2.5 rounded-xl mt-1.5">
                {entry.notes}
              </p>
            </div>
          );
        })}
      </div>
    </MaterialCard>
  );
};
