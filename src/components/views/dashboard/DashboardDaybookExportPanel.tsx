/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SupportClient, User, UserRole, WorkLogEntry } from '../../../types';
import { MaterialCard } from '../../common/MaterialCard';
import { exportWorkLogsToCSV, printDailyWorkLogReport } from '../../../utils/exportUtils';
import { ClipboardPen, Download, Printer } from 'lucide-react';

export type DaybookRangeFilter = 'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_WEEK' | 'CUSTOM_DATE';

interface DashboardDaybookExportPanelProps {
  isUrdu: boolean;
  currentUser: User | null;
  users: User[];
  clients: SupportClient[];
  filteredWorkLogs: WorkLogEntry[];
  dashboardExecFilter: string;
  onExecFilterChange: (value: string) => void;
  dashboardDaybookRange: DaybookRangeFilter;
  onDaybookRangeChange: (value: DaybookRangeFilter) => void;
  dashboardLogDate: string;
  onLogDateChange: (value: string) => void;
}

export const DashboardDaybookExportPanel: React.FC<DashboardDaybookExportPanelProps> = ({
  isUrdu,
  currentUser,
  users,
  clients,
  filteredWorkLogs,
  dashboardExecFilter,
  onExecFilterChange,
  dashboardDaybookRange,
  onDaybookRangeChange,
  dashboardLogDate,
  onLogDateChange,
}) => {
  const executiveOptions = Array.from(
    new Set([
      'Umar Farooq',
      'Sumayya',
      'Farman',
      'Haneef',
      'Khaja Shareef',
      'Techno Admin',
      ...users
        .filter((u) => u.role === UserRole.SUPPORT_EXECUTIVE || u.role === UserRole.SUPPORT_MANAGER)
        .map((u) => u.name),
    ])
  ).filter((name) => {
    const l = (name || '').toLowerCase();
    return l && !l.includes('rahul') && !l.includes('sneha') && !l.includes('amit');
  });

  return (
    <MaterialCard
      variant="elevated"
      className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardPen size={17} className="text-blue-600" />
            <span>
              {isUrdu
                ? 'ڈیش بورڈ ورک لاگ ایکسپورٹ، رپورٹ اور تاریخ فلٹر'
                : 'Dashboard Work Log Export, Reports & Date Selector'}
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            {isUrdu
              ? 'کونسی تاریخ کا ڈیٹا چاہیے منتخب کریں اور ایکسپورٹ یا رپورٹ نکالیں۔'
              : 'Select target date or Daybook range (Today, Yesterday, This Week, Last Week) and export or print reports.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentUser?.role !== UserRole.SUPPORT_EXECUTIVE && (
            <select
              value={dashboardExecFilter}
              onChange={(e) => onExecFilterChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              <option value="ALL">All Support Executives</option>
              {executiveOptions.map((name) => (
                <option key={name} value={name}>
                  👤 {name}
                </option>
              ))}
            </select>
          )}

          <select
            value={dashboardDaybookRange}
            onChange={(e) => onDaybookRangeChange(e.target.value as DaybookRangeFilter)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
          >
            <option value="ALL">All Dates</option>
            <option value="TODAY">Today</option>
            <option value="YESTERDAY">Yesterday</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="LAST_WEEK">Last Week</option>
            <option value="CUSTOM_DATE">Select Date</option>
          </select>

          <input
            type="date"
            value={dashboardLogDate}
            onChange={(e) => {
              onLogDateChange(e.target.value);
              onDaybookRangeChange('CUSTOM_DATE');
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
          />

          <button
            type="button"
            onClick={() => exportWorkLogsToCSV(filteredWorkLogs)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={13} />
            <span>Export Data (CSV)</span>
          </button>

          <button
            type="button"
            onClick={() =>
              printDailyWorkLogReport(
                filteredWorkLogs,
                dashboardLogDate,
                dashboardExecFilter === 'ALL' ? currentUser?.name : dashboardExecFilter
              )
            }
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={13} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono uppercase text-slate-400">
              <th className="py-2 px-3">Date & Duration</th>
              <th className="py-2 px-3">Client & Department</th>
              <th className="py-2 px-3">Support Executive</th>
              <th className="py-2 px-3">Work Type & Summary</th>
              <th className="py-2 px-3">
                {isUrdu ? 'اسپیشل مینیجر ریمارک / انعام' : 'Special Manager Remark / Incentive KPI'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredWorkLogs.slice(0, 6).map((wl) => {
              const cObj = clients.find((c) => c.id === wl.clientId || c.name === wl.clientName);
              return (
                <tr key={wl.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{wl.date}</div>
                    <div className="text-[10px] text-blue-600">
                      {wl.durationMinutes} mins ({wl.status})
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900 dark:text-white">{wl.clientName}</div>
                    <div className="text-[10px] text-slate-500">🏢 {cObj?.department || wl.category}</div>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                    👤 {wl.executiveName}
                  </td>
                  <td className="py-2.5 px-3 max-w-xs">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600">
                      {wl.workType || wl.category}
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 truncate mt-0.5">{wl.details}</p>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="text-[10px] text-amber-700 dark:text-amber-300 truncate max-w-[160px]">
                      📌 {wl.saadNote || cObj?.noteSaad || 'Verified'}
                    </div>
                    <div className="text-[10px] font-mono font-bold text-emerald-600">
                      💰 {wl.monthlyIncentive || cObj?.monthlyIncentive || '₹2,500'}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </MaterialCard>
  );
};
