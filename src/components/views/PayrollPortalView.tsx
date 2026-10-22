/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MaterialCard } from '../common/MaterialCard';
import {
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Mail,
  Phone,
  ArrowUpRight,
  UserCheck,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface PayrollPortalViewProps {
  id?: string;
}

export const PayrollPortalView: React.FC<PayrollPortalViewProps> = ({ id }) => {
  const { currentUser, language } = useApp();
  const isUrdu = language === 'ur';

  const [checkInTime, setCheckInTime] = useState<string>('09:30 AM');
  const [attendanceMarked, setAttendanceMarked] = useState(true);

  const baseSalary = (currentUser as any)?.baseSalary || 22000;
  const monthlyIncentive = (currentUser as any)?.monthlyIncentive || 2500;
  const totalPay = baseSalary + monthlyIncentive;

  // Verified technoevident.xyz Payroll Attendance Portal
  const ATTENDANCE_PORTAL_URL = 'https://technoevident.xyz/';

  return (
    <div id={id || 'tedos-payroll-portal-view'} className="space-y-6 animate-fade-in pb-12">
      {/* Top Header Card */}
      <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <DollarSign size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white">
                  {isUrdu ? 'تنخواہ، انعام اور حاضری پورٹل (Payroll & Attendance)' : 'Payroll, Salary & Attendance Portal'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isUrdu
                  ? 'لاگ ان کے بعد حاضری کا باضابطہ پورٹل لنک، ماہانہ تنخواہ اور انعام کے پی آئی کی تصدیق'
                  : 'Official Attendance Web Portal, Daily Time In/Out & Monthly Salary + Incentive Overview'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
              👤 {currentUser?.name} ({currentUser?.employeeId})
            </span>
          </div>
        </div>
      </MaterialCard>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance Portal Direct Launch Card */}
        <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-blue-300" />
              <h2 className="text-base font-black">
                {isUrdu ? 'حاضری پورٹل (Attendance Portal Direct Link)' : 'Official Attendance Portal'}
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-white/20 text-white font-bold">
              Secure Auth
            </span>
          </div>

          <p className="text-xs text-blue-200 leading-relaxed">
            {isUrdu
              ? 'ملازمین کی روزانہ لاگ ان و لاگ آؤٹ بائیو میٹرک حاضری اور پے رول کے لیے آفیشل لنک استعمال کریں:'
              : 'Launch the official Techno Evident Attendance System to verify daily biometric check-in/out logs.'}
          </p>

          <div className="p-4 rounded-2xl bg-white/10 border border-white/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-200 font-mono">Today Check-In:</span>
              <span className="font-bold text-white font-mono">{checkInTime}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-200 font-mono">Status:</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/30 text-emerald-300 font-bold">
                ✓ Attendance Recorded
              </span>
            </div>
          </div>

          <a
            href={ATTENDANCE_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-blue-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            title="Open Official Attendance Portal"
          >
            <span>{isUrdu ? 'حاضری پورٹل کھولیں (Open Attendance System)' : 'Open Official Attendance Portal'}</span>
            <ExternalLink size={14} />
          </a>
        </MaterialCard>

        {/* Salary & Incentive Overview Card */}
        <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <DollarSign size={20} className="text-emerald-600" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {isUrdu ? 'ماہانہ تنخواہ و انعام (Salary & Incentive KPI)' : 'Monthly Compensation Breakdown'}
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
              Monthly Active
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isUrdu ? 'بنیادی تنخواہ (Base Salary)' : 'Base Monthly Salary'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Standard Executive Structure</span>
              </div>
              <span className="text-base font-mono font-black text-slate-900 dark:text-white">
                ₹{baseSalary.toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                  {isUrdu ? 'ماہانہ کے پی آئی انعام (Monthly Incentive KPI)' : 'Monthly KPI Incentive Bonus'}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                  Linked to Daily Work Logs & Satisfaction
                </span>
              </div>
              <span className="text-base font-mono font-black text-emerald-700 dark:text-emerald-300">
                + ₹{monthlyIncentive.toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
              <span className="text-xs font-black text-blue-900 dark:text-blue-200 uppercase">
                {isUrdu ? 'کل ماہانہ تخمینہ:' : 'Total Monthly Potential:'}
              </span>
              <span className="text-xl font-mono font-black text-blue-700 dark:text-blue-300">
                ₹{totalPay.toLocaleString()}
              </span>
            </div>
          </div>
        </MaterialCard>
      </div>

      {/* Support & Contact Helpdesk Banner */}
      <MaterialCard variant="outlined" className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
              {isUrdu ? 'حاضری یا تنخواہ میں تکنیکی مدد کے لیے:' : 'Payroll or Attendance Technical Support Contact:'}
            </span>
            <p className="text-[11px] text-slate-500">
              {isUrdu
                ? 'کسی بھی شکایت یا مدد کے لیے ای میل یا واٹس ایپ پر رابطہ کریں۔'
                : 'For corrections or assistance, contact official technical support desk.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <a
              href="mailto:support@philsof.com"
              className="px-3 py-2 rounded-xl bg-blue-600 text-white font-bold flex items-center gap-1.5 shadow-sm hover:bg-blue-700 transition"
            >
              <Mail size={14} />
              <span>support@philsof.com</span>
            </a>
            <a
              href="https://wa.me/919063807153?text=Hello%20Support%2C%20I%20have%20an%20inquiry%20regarding%20payroll%20or%20attendance."
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-1.5 shadow-sm hover:bg-emerald-700 transition"
            >
              <Phone size={14} />
              <span>9063807153 (Call / WA)</span>
            </a>
          </div>
        </div>
      </MaterialCard>
    </div>
  );
};
