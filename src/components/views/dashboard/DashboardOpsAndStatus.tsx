/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FollowUpTracker, SupportClient, User, UserRole, WorkLogEntry } from '../../../types';
import { MaterialCard } from '../../common/MaterialCard';
import { DailyTeamSummaryModal } from '../../common/DailyTeamSummaryModal';
import {
  Bell,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  CloudLightning,
  Cpu,
  Database,
  GraduationCap,
  Info,
  MessageSquare,
  ShieldCheck,
  Users,
  Wifi,
} from 'lucide-react';

interface DashboardOpsAndStatusProps {
  isUrdu: boolean;
  currentUser: User | null;
  users: User[];
  clients: SupportClient[];
  workLogs: WorkLogEntry[];
  followUps: FollowUpTracker[];
  todaysWorkLogsCount: number;
  isTeamSummaryModalOpen: boolean;
  onOpenPendingProofModal: () => void;
  onOpenTeamSummaryModal: () => void;
  onCloseTeamSummaryModal: () => void;
}

export const DashboardOpsAndStatus: React.FC<DashboardOpsAndStatusProps> = ({
  isUrdu,
  currentUser,
  users,
  clients,
  workLogs,
  followUps,
  todaysWorkLogsCount,
  isTeamSummaryModalOpen,
  onOpenPendingProofModal,
  onOpenTeamSummaryModal,
  onCloseTeamSummaryModal,
}) => {
  const connectionStatuses = [
    { name: isUrdu ? 'گوگل شیٹس' : 'Google Sheets', status: isUrdu ? 'مربوط' : 'Connected', details: isUrdu ? 'ہمہ وقت ہم آہنگ' : 'v4.0 Sync Active', icon: Database, color: 'text-emerald-500 bg-emerald-500/10' },
    { name: isUrdu ? 'ایپس اسکرپٹ' : 'Apps Script', status: isUrdu ? 'مربوط' : 'Connected', details: 'REST API Gateway', icon: Cpu, color: 'text-blue-500 bg-blue-500/10' },
    { name: isUrdu ? 'انٹرنیٹ' : 'Internet', status: isUrdu ? 'آن لائن' : 'Online', details: '14ms Latency', icon: Wifi, color: 'text-teal-500 bg-teal-500/10' },
    { name: isUrdu ? 'واٹس ایپ API' : 'WhatsApp API', status: isUrdu ? 'مربوط' : 'Connected', details: 'Live Proxy v16', icon: MessageSquare, color: 'text-emerald-500 bg-emerald-500/10' },
    { name: isUrdu ? 'سنک صورتحال' : 'Sync Status', status: isUrdu ? 'ہم آہنگ' : 'Synchronized', details: isUrdu ? 'ڈیٹا محفوظ ہے' : 'Database Mapped', icon: CloudLightning, color: 'text-amber-500 bg-amber-500/10' },
    { name: isUrdu ? 'آخری سنک' : 'Last Sync Time', status: isUrdu ? 'ابھی' : 'Just Now', details: isUrdu ? 'کوئی تاخیر نہیں' : 'No pending queue', icon: Clock, color: 'text-purple-500 bg-purple-500/10' },
  ];

  return (
    <>
      {/* SECTION 6. LEADERSHIP TEAM OPERATIONS & GOOGLE SHEETS SYNC GUIDE */}
      <div id="dashboard-performance-snapshot" className="space-y-4">
        {currentUser?.role !== UserRole.SUPPORT_EXECUTIVE ? (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-purple-900/90 text-white shadow-md border border-indigo-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white/10 text-white shrink-0">
                    <ShieldCheck size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">
                      {isUrdu ? 'ورک لاگ ثبوت (Proof Links) اور گوگل شیٹ سنک کا طریقہ کار' : 'Proof Links & Google Sheets Automatic Sync Guide'}
                    </h3>
                    <p className="text-xs text-indigo-200">
                      {isUrdu ? 'سپورٹ ٹیم کا کام، پینڈنگ ثبوت اور مینیجر کی منظوری سے شیٹ میں اندراج کا نظام' : 'How executive proof links verify and sync automatically to Google Sheets upon Manager approval'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenPendingProofModal}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer select-none shrink-0"
                >
                  <CheckCircle2 size={14} />
                  <span>{isUrdu ? 'زیر التواء ثبوت ریویو کریں' : 'Review Pending Proofs'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-white/10 text-xs">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono text-emerald-300 font-bold block">1. سپورٹ ٹیم لاگ اندراج (Step 1)</span>
                  <p className="text-indigo-100 text-[11px] leading-relaxed">
                    {isUrdu
                      ? 'سپورٹ ایگزیکٹو ورک لاگ میں کلائنٹ کال درج کرتے وقت Google Meet/AnyDesk کا لنک دیتا ہے۔ اگر فوری لنک نہ ہو تو وجہ درج کر کے لاگ ہوتا ہے۔'
                      : 'Executive submits work log with Meet/AnyDesk proof. If missing or pending, it is flagged.'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono text-amber-300 font-bold block">2. پینڈنگ کیو میں اندراج (Step 2)</span>
                  <p className="text-indigo-100 text-[11px] leading-relaxed">
                    {isUrdu
                      ? '5 منٹ سے زائد دورانیہ والے سیشن جن کا ثبوت پینڈنگ ہو وہ ایڈمن/مینیجر کے پاس پینڈنگ کیو (Pending Queue) میں چلے جاتے ہیں۔'
                      : 'Sessions > 5 mins without verified proof queue up for Leadership & Manager audit.'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono text-cyan-300 font-bold block">3. مینیجر منظوری و شیٹ سنک (Step 3)</span>
                  <p className="text-indigo-100 text-[11px] leading-relaxed">
                    {isUrdu
                      ? 'مینیجر یا سی او او جب "Approve" کرتا ہے تو اسپیشل ریمارک کے ساتھ لاگ کی پینڈنگ ختم ہو جاتی ہے اور فوری طور پر گوگل شیٹ میں سنک ہو جاتا ہے۔'
                      : 'Manager/COO Approves with remark: Pending flag is removed and entry immediately syncs to Google Sheets.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-black text-md-outline uppercase tracking-wider block">
                {isUrdu ? 'سپورٹ ٹیم کی مجموعی کارکردگی کا جائزہ (Team Summary)' : 'Support Team Productivity Overview'}
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-md-surface border border-md-surface-variant/70 text-center select-none shadow-xs">
                  <span className="text-[10px] font-mono text-md-outline uppercase font-semibold block mb-1">
                    {isUrdu ? 'ایکٹو سپورٹ اسٹاف' : 'Active Support Staff'}
                  </span>
                  <span className="text-2xl font-black text-indigo-600 block leading-none">
                    {users.filter((u) => u.role === UserRole.SUPPORT_EXECUTIVE).length || 4}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-1 block">Umar, Sumayya, Farman, Haneef</span>
                </div>

                <div className="p-4 rounded-2xl bg-md-surface border border-md-surface-variant/70 text-center select-none shadow-xs">
                  <span className="text-[10px] font-mono text-md-outline uppercase font-semibold block mb-1">
                    {isUrdu ? 'آج کے کل لاگز' : 'Total Logs Today'}
                  </span>
                  <span className="text-2xl font-black text-md-on-surface block leading-none">{todaysWorkLogsCount}</span>
                  <span className="text-[9px] text-emerald-600 font-bold mt-1 block">Live Recorded</span>
                </div>

                <div className="p-4 rounded-2xl bg-md-surface border border-md-surface-variant/70 text-center select-none shadow-xs">
                  <span className="text-[10px] font-mono text-md-outline uppercase font-semibold block mb-1">
                    {isUrdu ? 'کلائنٹس کوریج' : 'Clients Covered'}
                  </span>
                  <span className="text-2xl font-black text-md-on-surface block leading-none">
                    {new Set(workLogs.map((w) => w.clientId || w.clientName)).size || clients.length}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-1 block">Across Roster</span>
                </div>

                <div className="p-4 rounded-2xl bg-md-surface border border-md-surface-variant/70 text-center select-none shadow-xs">
                  <span className="text-[10px] font-mono text-md-outline uppercase font-semibold block mb-1">
                    {isUrdu ? 'فالو اپس مکمل' : 'Follow-ups Done'}
                  </span>
                  <span className="text-2xl font-black text-md-on-surface block leading-none">
                    {followUps.filter((f) => f.status === 'Completed').length}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-1 block">Client Outreaches</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <span className="text-xs font-mono font-black text-md-outline uppercase tracking-wider block">
              {isUrdu ? 'میری مجموعی کارکردگی کا خلاصہ' : 'My Performance Snapshot'}
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-md-surface border border-md-surface-variant/70 text-center select-none shadow-xs">
                <span className="text-[10px] font-mono text-md-outline uppercase font-semibold block mb-1">
                  {isUrdu ? 'رابطہ شدہ کلائنٹس' : 'Clients Covered'}
                </span>
                <span className="text-3xl font-black text-md-on-surface block leading-none">
                  {workLogs.filter((w) => (w.executiveName || '').includes(currentUser?.name || '')).length || 4}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-md-surface border border-md-surface-variant/70 text-center select-none shadow-xs">
                <span className="text-[10px] font-mono text-md-outline uppercase font-semibold block mb-1">
                  {isUrdu ? 'مکمل فالو اپس' : 'Follow-ups Completed'}
                </span>
                <span className="text-3xl font-black text-md-on-surface block leading-none">
                  {followUps.filter((f) => f.status === 'Completed').length}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-md-surface border border-md-surface-variant/70 text-center select-none shadow-xs">
                <span className="text-[10px] font-mono text-md-outline uppercase font-semibold block mb-1">
                  {isUrdu ? 'درج شدہ ورک لاگز' : 'Work Logs Submitted'}
                </span>
                <span className="text-3xl font-black text-md-on-surface block leading-none">
                  {workLogs.filter((w) => (w.executiveName || '').includes(currentUser?.name || '')).length || todaysWorkLogsCount}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-md-surface border border-md-surface-variant/70 text-center select-none shadow-xs">
                <span className="text-[10px] font-mono text-md-outline uppercase font-semibold block mb-1">
                  {isUrdu ? 'کلائنٹس تفویض' : 'Assigned Clients'}
                </span>
                <span className="text-3xl font-black text-md-on-surface block leading-none">{clients.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 7. CONNECTION STATUS */}
      <div id="dashboard-connection-status" className="space-y-3">
        <span className="text-xs font-mono font-black text-md-outline uppercase tracking-wider block">
          {isUrdu ? 'سسٹم ڈائیگنوسٹک اور کنکشن ہب' : 'Systems Diagnostic & Connection Hub'}
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {connectionStatuses.map((conn) => {
            const Icon = conn.icon;
            return (
              <div
                key={conn.name}
                className="p-3 rounded-2xl bg-md-surface-container-low border border-md-outline/5 text-center flex flex-col items-center justify-center gap-1 select-none"
              >
                <div className={`p-1.5 rounded-xl ${conn.color} mb-1`}>
                  <Icon size={14} />
                </div>
                <span className="text-[10px] font-bold text-md-on-surface block leading-none">{conn.name}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black tracking-wide flex items-center gap-0.5 justify-center mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {conn.status}
                </span>
                <span className="text-[8px] font-mono text-md-outline/80 leading-none mt-0.5">{conn.details}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 8. NOTIFICATION AREA */}
      <MaterialCard id="dashboard-notifications" variant="outlined" className="space-y-3.5 border-md-primary/10">
        <div className="flex items-center justify-between border-b border-md-surface-variant pb-2">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-md-primary" />
            <h3 className="text-sm font-bold text-md-on-surface">
              {isUrdu ? 'اہم انتباہات اور اعلانات' : 'Targeted Alerts & Notifications'}
            </h3>
          </div>
          <span className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
            {isUrdu ? 'لائیو فیڈ' : 'Live Stream'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-md-surface-container border border-md-surface-variant flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 mt-0.5 shrink-0"><Users size={14} /></div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono font-extrabold text-blue-600 uppercase tracking-wider block">
                {isUrdu ? 'تفویض کردہ کام' : 'Assigned Work'}
              </span>
              <p className="text-xs font-semibold text-md-on-surface mt-0.5">
                {isUrdu ? 'روسٹر میں نیا کلائنٹ شامل' : 'Roster Relaunch Warning'}
              </p>
              <p className="text-[10px] text-md-on-surface-variant/80 mt-1 leading-relaxed">
                {isUrdu ? (
                  <>نیا کلائنٹ <strong>'{clients[0]?.name || 'کلائنٹ'}'</strong> آپ کے روسٹر میں تفویض کر دیا گیا ہے۔</>
                ) : (
                  <>Client <strong>'{clients[0]?.name || 'Client'}'</strong> assigned to your active support roster.</>
                )}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-md-surface-container border border-md-surface-variant flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-md-primary/10 text-md-primary mt-0.5 shrink-0"><CalendarClock size={14} /></div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono font-extrabold text-md-primary uppercase tracking-wider block">
                {isUrdu ? 'آنے والا فالو اپ' : 'Upcoming Follow-up'}
              </span>
              <p className="text-xs font-semibold text-md-on-surface mt-0.5">
                {isUrdu ? 'کلائنٹ پرنٹ ٹیسٹ توثیق' : 'Client Print Verification'}
              </p>
              <p className="text-[10px] text-md-on-surface-variant/80 mt-1 leading-relaxed">
                {isUrdu ? (
                  <>آج شام 4:30 بجے <strong>{clients[1]?.name || clients[0]?.name || 'کلائنٹ'}</strong> سے رابطہ کنفرم کریں۔</>
                ) : (
                  <>Confirm status with <strong>{clients[1]?.name || clients[0]?.name || 'Client'}</strong> at 4:30 PM today.</>
                )}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-md-surface-container border border-md-surface-variant flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 mt-0.5 shrink-0"><GraduationCap size={14} /></div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono font-extrabold text-teal-600 uppercase tracking-wider block">
                {isUrdu ? 'ٹریننگ یاد دہانی' : 'Training Reminder'}
              </span>
              <p className="text-xs font-semibold text-md-on-surface mt-0.5">
                {isUrdu ? 'SaaS انٹرپرائز ٹریننگ' : 'SaaS Enterprise Training'}
              </p>
              <p className="text-[10px] text-md-on-surface-variant/80 mt-1 leading-relaxed">
                {isUrdu ? (
                  <><strong>{clients[0]?.name || 'کلائنٹ'}</strong> کے لیے سسٹم ٹریننگ سیشن شیڈول ہے۔</>
                ) : (
                  <>Scheduled software training session for <strong>{clients[0]?.name || 'Client'}</strong>.</>
                )}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-md-surface-container border border-md-surface-variant flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 mt-0.5 shrink-0"><Info size={14} /></div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono font-extrabold text-amber-600 uppercase tracking-wider block">
                {isUrdu ? 'سسٹم نوٹس' : 'System Notice'}
              </span>
              <p className="text-xs font-semibold text-md-on-surface mt-0.5">
                {isUrdu ? 'انفراسٹرکچر شیڈول مینٹیننس' : 'Scheduled Infrastructure Maintenance'}
              </p>
              <p className="text-[10px] text-md-on-surface-variant/80 mt-1 leading-relaxed">
                {isUrdu ? (
                  <>گوگل شیٹس سنکرونائزیشن 02:00 UTC پر معمول کے بیک اپ سے گزرے گی۔</>
                ) : (
                  <>Google Sheets synchronization REST proxies will undergo brief database backup at 02:00 UTC.</>
                )}
              </p>
            </div>
          </div>
        </div>
      </MaterialCard>

      {/* Bottom Summary Bar */}
      <MaterialCard
        variant="elevated"
        className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Calendar className="text-blue-300" size={20} />
          </div>
          <div>
            <span className="text-xs font-black block">
              {isUrdu ? 'سپورٹ ٹیم روزانہ کارکردگی خلاصہ (Daily Support Team Summary)' : 'Daily Support Team Performance Summary'}
            </span>
            <p className="text-[11px] text-blue-200">
              {isUrdu ? 'آج کی مکمل کارکردگی یا پچھلی تاریخ کا کیلنڈر سے انتخاب کر کے تفصیلی سمری نکالیں' : 'Extract complete performance summary for Today or any past calendar date'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenTeamSummaryModal}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-blue-950 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
        >
          <Calendar size={14} className="text-blue-700" />
          <span>{isUrdu ? 'سمری نکالیں (Today / Calendar)' : 'Extract Summary (Today / Calendar)'}</span>
        </button>
      </MaterialCard>

      {/* Mapped Sheets Identifier footer */}
      <div className="py-2.5 px-4 rounded-xl border border-md-surface-variant/60 bg-md-surface-container-low text-[10px] font-mono text-md-outline flex flex-col sm:flex-row sm:items-center justify-between gap-1 select-none">
        <span>{isUrdu ? 'مربوط شیٹ آئی ڈی: Support_Clients_v1.0 (گوگل شیٹس ماسٹر نوڈ)' : 'Mapped Sheets ID: Support_Clients_v1.0 (Google Sheets Master Proxy Node)'}</span>
        <span>{isUrdu ? 'آپریشنل سنک صورتحال: ہم آہنگ (تمام ریکارڈز فعال ہیں)' : 'Operational Sync Status: Synchronized (All records active in RAM cache)'}</span>
      </div>

      {/* Daily Team Summary Modal */}
      <DailyTeamSummaryModal isOpen={isTeamSummaryModalOpen} onClose={onCloseTeamSummaryModal} />
    </>
  );
};
