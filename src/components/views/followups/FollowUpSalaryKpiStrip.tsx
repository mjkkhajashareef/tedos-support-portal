/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FollowUpTracker, User } from '../../../types';
import { MaterialCard } from '../../common/MaterialCard';
import { TrendingUp } from 'lucide-react';

interface FollowUpSalaryKpiStripProps {
  users: User[];
  followUps: FollowUpTracker[];
  currentUser: User | null;
  isUrdu: boolean;
}

export const FollowUpSalaryKpiStrip: React.FC<FollowUpSalaryKpiStripProps> = ({
  users,
  followUps,
  currentUser,
  isUrdu
}) => {
  const visibleUsers = users
    .filter(u => {
      const isExec = u.role === 'Support Executive' || u.role === 'Freelancer' || u.isFreelancer;
      if (!isExec) return false;
      if (currentUser?.role === 'Support Executive' && currentUser?.email?.toLowerCase() !== 'support@philsof.com') {
        return u.id === currentUser.id || u.email === currentUser.email;
      }
      return true;
    })
    .slice(0, 8);

  return (
    <MaterialCard
      variant="elevated"
      className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-emerald-600" />
          <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase">
            {isUrdu
              ? 'ایگزیکٹو اور فری لانسر سیلری، ماہانہ انعام اور فالو اپ کے پی آئی ٹریکر'
              : 'Executive & Freelancer Salaries, Monthly Incentives & Follow-Up KPI Tracker'}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500">Live Payroll & SLA KPI</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
        {visibleUsers.map(exec => {
          const firstName = exec.name.split(' ')[0].toLowerCase();
          const execPending = followUps.filter(
            f => f.status !== 'Completed' && f.executiveName.toLowerCase().includes(firstName)
          ).length;
          const execSolved = followUps.filter(
            f => f.status === 'Completed' && f.executiveName.toLowerCase().includes(firstName)
          ).length;
          const baseSalaryVal = typeof exec.baseSalary === 'number' ? exec.baseSalary : 0;
          const incentiveVal = typeof exec.monthlyIncentive === 'number' ? exec.monthlyIncentive : 0;

          return (
            <div
              key={exec.id}
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 dark:text-white truncate">{exec.name}</span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    exec.isFreelancer || exec.role === 'Freelancer'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {exec.isFreelancer || exec.role === 'Freelancer' ? 'Freelancer' : 'Executive'}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                Salary:{' '}
                <strong className={baseSalaryVal > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400 font-normal'}>
                  ₹{baseSalaryVal.toLocaleString()}
                </strong>{' '}
                • KPI / Incentive:{' '}
                <strong className={incentiveVal > 0 ? 'text-emerald-600' : 'text-slate-400 font-normal'}>
                  {incentiveVal > 0 ? `+₹${incentiveVal.toLocaleString()}` : '₹0'}
                </strong>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-200/70 dark:border-slate-700/60">
                <span className="text-amber-600 font-bold">Unresolved: {execPending}</span>
                <span className="text-emerald-600 font-bold">Solved: {execSolved}</span>
              </div>
            </div>
          );
        })}
      </div>
    </MaterialCard>
  );
};
