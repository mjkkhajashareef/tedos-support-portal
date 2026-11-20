/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FollowUpTracker, SupportClient, User, WorkLogEntry } from '../../../types';
import { MaterialCard } from '../../common/MaterialCard';
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  PhoneCall,
  GraduationCap,
  FileText,
  BookOpen,
} from 'lucide-react';

interface TrainingClientSummary {
  id: string;
  name: string;
  company: string;
  trainingTopic: string;
}

interface DashboardPriorityAndTimelineProps {
  isUrdu: boolean;
  currentUser: User | null;
  clients: SupportClient[];
  urgentClients: SupportClient[];
  highPriorityFollowups: FollowUpTracker[];
  trainingRequiredClients: TrainingClientSummary[];
  recentlyAssignedClients: SupportClient[];
  workLogs: WorkLogEntry[];
  followUps: FollowUpTracker[];
  onSelectClient: (clientId: string) => void;
}

export const DashboardPriorityAndTimeline: React.FC<DashboardPriorityAndTimelineProps> = ({
  isUrdu,
  currentUser,
  clients,
  urgentClients,
  highPriorityFollowups,
  trainingRequiredClients,
  recentlyAssignedClients,
  workLogs,
  followUps,
  onSelectClient,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* SECTION 4. TODAY'S PRIORITY */}
      <MaterialCard id="dashboard-todays-priority" variant="outlined" className="space-y-4">
        <div className="flex items-center justify-between border-b border-md-surface-variant pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-md-primary" />
            <h3 className="text-sm font-bold text-md-on-surface">
              {isUrdu ? 'آج کے انتہائی اہم کام اور ترجیحات' : "Today's High-Priority Workload"}
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-md-primary/10 text-md-primary rounded-full font-bold">
            {isUrdu ? 'اہم ترین' : 'Critical Actions'}
          </span>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {/* Urgent Clients Category */}
          <div className="space-y-2">
            <span className="text-[9px] font-mono font-bold text-md-outline uppercase tracking-wider block">
              {isUrdu ? 'فوری توجہ طلب کلائنٹس (ہیلتھ اسکور < 50%)' : 'Urgent Clients (Health Score < 50%)'}
            </span>
            {urgentClients.map((client) => (
              <div
                key={client.id}
                onClick={() => onSelectClient(client.id)}
                className="p-3 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/15 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-md-on-surface block truncate">{client.name}</span>
                  <span className="text-[10px] text-md-on-surface-variant/70 block truncate">
                    {isUrdu ? 'ہیلتھ: ' : 'Health: '}
                    <strong className="font-mono text-red-600">{client.healthStatus}%</strong> •{' '}
                    {isUrdu ? 'تفویض: ' : 'Assigned to '}
                    {client.assignedExecutive}
                  </span>
                </div>
                <ChevronRight size={14} className="text-red-500/70 rtl:rotate-180" />
              </div>
            ))}
          </div>

          {/* High Priority Follow-ups */}
          <div className="space-y-2">
            <span className="text-[9px] font-mono font-bold text-md-outline uppercase tracking-wider block">
              {isUrdu ? 'اعلیٰ ترجیحی شیڈول شدہ فالو اپس' : 'High Priority Scheduled Follow-ups'}
            </span>
            {highPriorityFollowups.map((f) => (
              <div
                key={f.id}
                className="p-3 rounded-xl bg-md-surface-container border border-md-surface-variant flex items-start gap-2.5"
              >
                <div className="p-1 rounded-lg bg-red-100 text-red-600 mt-0.5 shrink-0">
                  <Activity size={12} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-md-on-surface truncate">{f.clientName}</span>
                    <span className="text-[9px] font-mono text-red-600 bg-red-50 border border-red-100 px-1 rounded">
                      {isUrdu ? 'اہم' : 'High'}
                    </span>
                  </div>
                  <p className="text-[10px] text-md-on-surface-variant/80 mt-0.5 leading-relaxed">{f.reason}</p>
                  <span className="text-[9px] text-md-outline font-mono mt-1 block">
                    {isUrdu ? 'وقت: ' : 'Scheduled: '}
                    {new Date(f.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Clients Requiring Training */}
          <div className="space-y-2">
            <span className="text-[9px] font-mono font-bold text-md-outline uppercase tracking-wider block">
              {isUrdu ? 'سپورٹ ٹریننگ کے متلاشی کلائنٹس' : 'Clients Requiring Support Training'}
            </span>
            {trainingRequiredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => onSelectClient(client.id)}
                className="p-3 rounded-xl bg-teal-500/5 hover:bg-teal-500/10 border border-teal-500/15 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-md-on-surface block truncate">{client.name}</span>
                  <span className="text-[10px] text-teal-700 dark:text-teal-400 block truncate font-medium">
                    🎓 {client.trainingTopic}
                  </span>
                </div>
                <ChevronRight size={14} className="text-teal-500/70 rtl:rotate-180" />
              </div>
            ))}
          </div>

          {/* Recently Assigned Clients */}
          <div className="space-y-2">
            <span className="text-[9px] font-mono font-bold text-md-outline uppercase tracking-wider block">
              {isUrdu ? 'حال ہی میں تفویض کردہ کلائنٹس' : 'Recently Assigned Clients'}
            </span>
            {recentlyAssignedClients.map((client) => (
              <div
                key={client.id}
                onClick={() => onSelectClient(client.id)}
                className="p-3 rounded-xl bg-md-surface-container-low hover:bg-md-surface-container border border-md-surface-variant cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-md-on-surface block truncate">{client.name}</span>
                  <span className="text-[10px] text-md-on-surface-variant/75 block truncate">
                    {isUrdu ? 'تفویض: ' : 'Assigned to '}
                    {client.assignedExecutive} • {client.softwareDetails.version}
                  </span>
                </div>
                <ChevronRight size={14} className="text-md-outline rtl:rotate-180" />
              </div>
            ))}
          </div>
        </div>
      </MaterialCard>

      {/* SECTION 5. RECENT ACTIVITY TIMELINE */}
      <MaterialCard id="dashboard-recent-activity" variant="outlined" className="space-y-4">
        <div className="flex items-center justify-between border-b border-md-surface-variant pb-2">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-md-primary" />
            <h3 className="text-sm font-bold text-md-on-surface">
              {isUrdu ? 'سرگرمیوں کی ٹائم لائن اور تاریخ' : 'Operational Activity Timeline'}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-md-outline font-semibold">
            {isUrdu ? 'تاریخچہ' : 'Historical Trace'}
          </span>
        </div>

        <div className="relative border-s border-md-outline/10 ps-5 ms-2.5 space-y-5 py-2">
          {/* Timeline Item 1: Last Work Log */}
          <div className="relative">
            <div className="absolute ltr:-left-[27px] rtl:-right-[27px] top-0 w-3.5 h-3.5 rounded-full bg-md-primary flex items-center justify-center border-2 border-md-surface" />
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-md-on-surface flex items-center gap-1.5">
                  <FileText size={12} className="text-md-primary" />
                  {isUrdu ? 'آخری ورک لاگ جمع کرایا گیا' : 'Last Work Log Submitted'}
                </span>
                <span className="text-[9px] font-mono text-md-outline">
                  {isUrdu ? '25 منٹ قبل' : '25 mins ago'}
                </span>
              </div>
              <p className="text-[11px] text-md-on-surface-variant leading-relaxed">
                <strong>{workLogs[0]?.executiveName || currentUser?.name || 'Executive'}</strong>{' '}
                {isUrdu ? 'نے' : 'logged'}{' '}
                <span className="font-semibold text-md-primary">
                  "{workLogs[0]?.category || (isUrdu ? 'سپورٹ کال' : 'Support Call')}"
                </span>{' '}
                {isUrdu ? 'درج کیا۔ کلائنٹ:' : 'for'}{' '}
                {workLogs[0]?.clientName || clients[0]?.name || (isUrdu ? 'متعلقہ کلائنٹ' : 'Assigned Client')}۔{' '}
                {isUrdu ? 'دورانیہ:' : 'Duration:'} {workLogs[0]?.durationMinutes || 15}{' '}
                {isUrdu ? 'منٹ' : 'mins'}.
              </p>
            </div>
          </div>

          {/* Timeline Item 2: Last Follow-up */}
          <div className="relative">
            <div className="absolute ltr:-left-[27px] rtl:-right-[27px] top-0 w-3.5 h-3.5 rounded-full bg-teal-500 flex items-center justify-center border-2 border-md-surface" />
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-md-on-surface flex items-center gap-1.5">
                  <PhoneCall size={12} className="text-teal-600" />
                  {isUrdu ? 'آخری فالو اپ رابطہ' : 'Last Follow-up Outreach'}
                </span>
                <span className="text-[9px] font-mono text-md-outline">{isUrdu ? 'آج' : 'Today'}</span>
              </div>
              <p className="text-[11px] text-md-on-surface-variant leading-relaxed">
                <strong>{followUps[0]?.executiveName || currentUser?.name || 'Executive'}</strong>{' '}
                {isUrdu ? 'نے فالو اپ رابطہ مکمل کیا برائے' : 'completed follow-up outreach for'}{' '}
                <span className="font-semibold text-teal-700 dark:text-teal-400">
                  {followUps[0]?.clientName || clients[0]?.name || (isUrdu ? 'متعلقہ کلائنٹ' : 'Assigned Client')}
                </span>
                . {isUrdu ? 'سسٹم مستحکم ہے۔' : 'Status reported stable.'}
              </p>
            </div>
          </div>

          {/* Timeline Item 3: Last Training */}
          <div className="relative">
            <div className="absolute ltr:-left-[27px] rtl:-right-[27px] top-0 w-3.5 h-3.5 rounded-full bg-purple-500 flex items-center justify-center border-2 border-md-surface" />
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-md-on-surface flex items-center gap-1.5">
                  <GraduationCap size={12} className="text-purple-600" />
                  {isUrdu ? 'آخری ٹریننگ سیشن' : 'Last Training Session Conducted'}
                </span>
                <span className="text-[9px] font-mono text-md-outline">{isUrdu ? 'کل' : 'Yesterday'}</span>
              </div>
              <p className="text-[11px] text-md-on-surface-variant leading-relaxed">
                <strong>{currentUser?.name || 'Executive'}</strong>{' '}
                {isUrdu ? 'نے ٹریننگ سیشن مکمل کیا برائے' : 'concluded training session with tech team at'}{' '}
                <span className="font-semibold text-purple-700 dark:text-purple-400">
                  {clients[1]?.name || clients[0]?.name || (isUrdu ? 'متعلقہ کلائنٹ' : 'Assigned Client')}
                </span>
                .
              </p>
            </div>
          </div>

          {/* Timeline Item 4: Last Client Opened */}
          <div className="relative">
            <div className="absolute ltr:-left-[27px] rtl:-right-[27px] top-0 w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center border-2 border-md-surface" />
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-md-on-surface flex items-center gap-1.5">
                  <BookOpen size={12} className="text-amber-600" />
                  {isUrdu ? 'آخری بار کھولا گیا ورک اسپیس' : 'Last Client Workspace Opened'}
                </span>
                <span className="text-[9px] font-mono text-md-outline">
                  {isUrdu ? '10 منٹ قبل' : '10 mins ago'}
                </span>
              </div>
              <p className="text-[11px] text-md-on-surface-variant leading-relaxed">
                {isUrdu ? 'کلائنٹ ورک اسپیس برائے' : 'Client workspace for'}{' '}
                <strong>{clients[0]?.name || (isUrdu ? 'متعلقہ کلائنٹ' : 'Assigned Client')}</strong>{' '}
                {isUrdu
                  ? 'کا معائنہ مکمل کیا گیا۔'
                  : 'was accessed by command station to evaluate transactional latency logs.'}
              </p>
            </div>
          </div>
        </div>
      </MaterialCard>
    </div>
  );
};
