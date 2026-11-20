/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ModuleId } from '../../../types';
import { QuickLinksGrid } from '../../common/QuickLinksGrid';
import {
  ClipboardPen,
  Calendar,
  Users,
  PhoneCall,
  AlertOctagon,
  GraduationCap,
  ListTodo,
} from 'lucide-react';

interface DashboardSummaryCardsProps {
  isUrdu: boolean;
  assignedClientsCount: number;
  todaysFollowupsCount: number;
  overdueFollowupsCount: number;
  pendingTrainingsCount: number;
  todaysWorkLogsCount: number;
  pendingTasksCount: number;
  onNavigateModule: (module: ModuleId) => void;
  onOpenTeamSummary: () => void;
}

export const DashboardSummaryCards: React.FC<DashboardSummaryCardsProps> = ({
  isUrdu,
  assignedClientsCount,
  todaysFollowupsCount,
  overdueFollowupsCount,
  pendingTrainingsCount,
  todaysWorkLogsCount,
  pendingTasksCount,
  onNavigateModule,
  onOpenTeamSummary,
}) => {
  return (
    <>
      {/* SECTION 2. TODAY'S SUMMARY */}
      <div id="dashboard-todays-summary" className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-mono font-black text-md-outline uppercase tracking-wider block">
            {isUrdu ? 'آج کا آپریشنل بوجھ اور کام' : "Today's Operational Workload"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenTeamSummary}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Daily Team Summary with Today and Calendar Date Picker"
            >
              <Calendar size={13} />
              <span>{isUrdu ? '📊 روزانہ ٹیم سمری (Today / Calendar)' : '📊 Daily Team Summary'}</span>
            </button>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              {isUrdu ? 'لائیو ڈیٹا سنک' : 'Live Dashboard Sync'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Summary Card 1 */}
          <button
            type="button"
            onClick={() => onNavigateModule(ModuleId.MY_CLIENTS)}
            className="p-4 rounded-2xl bg-md-surface-container-low border border-md-outline/5 flex flex-col justify-between h-28 hover:border-md-primary/30 hover:bg-md-surface-container transition-all text-left rtl:text-right cursor-pointer group active:scale-98"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono text-md-outline uppercase font-bold tracking-wider group-hover:text-md-primary transition">
                {isUrdu ? 'مفوضہ کلائنٹس ↗' : 'Assigned Clients ↗'}
              </span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600"><Users size={16} /></div>
            </div>
            <div>
              <span className="text-2xl font-black text-md-on-surface block leading-none">{assignedClientsCount}</span>
              <span className="text-[9px] text-md-on-surface-variant/70 mt-1 block">
                {isUrdu ? 'کلک کریں اور کلائنٹس دیکھیں' : 'Tap to open Assigned Clients'}
              </span>
            </div>
          </button>

          {/* Summary Card 2 */}
          <button
            type="button"
            onClick={() => onNavigateModule(ModuleId.FOLLOW_UP)}
            className="p-4 rounded-2xl bg-md-surface-container-low border border-md-outline/5 flex flex-col justify-between h-28 hover:border-md-primary/30 hover:bg-md-surface-container transition-all text-left rtl:text-right cursor-pointer group active:scale-98"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono text-md-outline uppercase font-bold tracking-wider group-hover:text-md-primary transition">
                {isUrdu ? 'آج کے فالو اپس ↗' : "Today's Follow-ups ↗"}
              </span>
              <div className="p-1.5 rounded-lg bg-md-primary/15 text-md-primary"><PhoneCall size={16} /></div>
            </div>
            <div>
              <span className="text-2xl font-black text-md-on-surface block leading-none">{todaysFollowupsCount}</span>
              <span className="text-[9px] text-md-on-surface-variant/70 mt-1 block">
                {isUrdu ? 'کلک کریں اور فالو اپس کھولیں' : 'Tap to view Scheduled Follow-ups'}
              </span>
            </div>
          </button>

          {/* Summary Card 3 */}
          <button
            type="button"
            onClick={() => onNavigateModule(ModuleId.FOLLOW_UP)}
            className="p-4 rounded-2xl bg-md-surface-container-low border border-md-outline/5 flex flex-col justify-between h-28 hover:border-red-300 hover:bg-red-50/20 dark:hover:bg-red-950/20 transition-all text-left rtl:text-right cursor-pointer group active:scale-98"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono text-md-outline uppercase font-bold tracking-wider group-hover:text-red-600 transition">
                {isUrdu ? 'زائد المیعاد فالو اپس ↗' : 'Overdue Follow-ups ↗'}
              </span>
              <div className="p-1.5 rounded-lg bg-red-500/10 text-red-600"><AlertOctagon size={16} /></div>
            </div>
            <div>
              <span className={`text-2xl font-black block leading-none ${overdueFollowupsCount > 0 ? 'text-red-600' : 'text-md-on-surface'}`}>
                {overdueFollowupsCount}
              </span>
              <span className="text-[9px] text-md-on-surface-variant/70 mt-1 block">
                {isUrdu ? 'فوری توجہ طلب فالو اپس' : 'Tap to view Overdue Outreach'}
              </span>
            </div>
          </button>

          {/* Summary Card 4 */}
          <button
            type="button"
            onClick={() => onNavigateModule(ModuleId.TRAINING)}
            className="p-4 rounded-2xl bg-md-surface-container-low border border-md-outline/5 flex flex-col justify-between h-28 hover:border-teal-300 hover:bg-teal-50/20 dark:hover:bg-teal-950/20 transition-all text-left rtl:text-right cursor-pointer group active:scale-98"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono text-md-outline uppercase font-bold tracking-wider group-hover:text-teal-600 transition">
                {isUrdu ? 'زیر التواء ٹریننگ ↗' : 'Pending Trainings ↗'}
              </span>
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600"><GraduationCap size={16} /></div>
            </div>
            <div>
              <span className="text-2xl font-black text-md-on-surface block leading-none">{pendingTrainingsCount}</span>
              <span className="text-[9px] text-md-on-surface-variant/70 mt-1 block">
                {isUrdu ? 'ٹریننگ شیڈول کھولیں' : 'Tap to open Training Portal'}
              </span>
            </div>
          </button>

          {/* Summary Card 5 */}
          <button
            type="button"
            onClick={() => onNavigateModule(ModuleId.WORK_LOG_HISTORY)}
            className="p-4 rounded-2xl bg-md-surface-container-low border border-md-outline/5 flex flex-col justify-between h-28 hover:border-purple-300 hover:bg-purple-50/20 dark:hover:bg-purple-950/20 transition-all text-left rtl:text-right cursor-pointer group active:scale-98"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono text-md-outline uppercase font-bold tracking-wider group-hover:text-purple-600 transition">
                {isUrdu ? 'آج کے ورک لاگز ↗' : "Today's Work Logs ↗"}
              </span>
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600"><ClipboardPen size={16} /></div>
            </div>
            <div>
              <span className="text-2xl font-black text-md-on-surface block leading-none">{todaysWorkLogsCount}</span>
              <span className="text-[9px] text-md-on-surface-variant/70 mt-1 block">
                {isUrdu ? 'ورک لاگ ہسٹری کھولیں' : 'Tap to open Work Log History'}
              </span>
            </div>
          </button>

          {/* Summary Card 6 */}
          <button
            type="button"
            onClick={() => onNavigateModule(ModuleId.FOLLOW_UP)}
            className="p-4 rounded-2xl bg-md-surface-container-low border border-md-outline/5 flex flex-col justify-between h-28 hover:border-amber-300 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 transition-all text-left rtl:text-right cursor-pointer group active:scale-98"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono text-md-outline uppercase font-bold tracking-wider group-hover:text-amber-600 transition">
                {isUrdu ? 'باقی ماندہ کام ↗' : 'Pending Tasks ↗'}
              </span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600"><ListTodo size={16} /></div>
            </div>
            <div>
              <span className="text-2xl font-black text-md-on-surface block leading-none">{pendingTasksCount}</span>
              <span className="text-[9px] text-md-on-surface-variant/70 mt-1 block">
                {isUrdu ? 'باقی ماندہ کاموں کی لسٹ کھولیں' : 'Tap to open actionable task queue'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* SECTION 3. DYNAMIC ROLE-BASED QUICK LINKS */}
      <QuickLinksGrid id="dashboard-quick-links" />
    </>
  );
};
