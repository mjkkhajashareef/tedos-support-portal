/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FollowUpTracker, WorkLogEntry } from '../../../types';
import { getLocalDateString, getLocalDateOffsetString } from '../../../utils/helpers';
import { CalendarClock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FollowUpCalendarPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  followUps: FollowUpTracker[];
  workLogs: WorkLogEntry[];
  isUrdu: boolean;
}

export const FollowUpCalendarPreviewModal: React.FC<FollowUpCalendarPreviewModalProps> = ({
  isOpen,
  onClose,
  followUps,
  workLogs,
  isUrdu
}) => {
  const [previewDate, setPreviewDate] = useState<string>(() => getLocalDateString());

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col"
          >
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <CalendarClock size={20} className="text-blue-600" />
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    {isUrdu
                      ? 'کیلنڈر پریویو (فالو اپس اور ورک لاگ شیڈول)'
                      : 'Interactive Calendar Preview (Follow-Ups & Daily Work Logs)'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Select any date to preview all scheduled client follow-ups and logged support sessions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-500/5 p-3.5 rounded-2xl border border-blue-500/20">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 dark:text-slate-200">Select Preview Date:</span>
                  <input
                    type="date"
                    value={previewDate}
                    onChange={e => setPreviewDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-blue-400 bg-white dark:bg-slate-900 font-mono font-bold"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  {[-1, 0, 1, 2, 3].map(offset => {
                    const dStr = getLocalDateOffsetString(offset);
                    const count = followUps.filter(f => f.scheduledDate === dStr).length;
                    return (
                      <button
                        key={offset}
                        type="button"
                        onClick={() => setPreviewDate(dStr)}
                        className={`px-2.5 py-1.5 rounded-xl font-mono text-[11px] font-bold border cursor-pointer ${
                          previewDate === dStr
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {offset === 0 ? 'Today' : offset === -1 ? 'Yest' : dStr.slice(5)} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-black text-slate-900 dark:text-white uppercase text-xs">
                    Scheduled Follow-Ups on {previewDate} ({followUps.filter(f => f.scheduledDate === previewDate).length})
                  </h4>
                  {followUps.filter(f => f.scheduledDate === previewDate).length === 0 ? (
                    <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-center">
                      No follow-ups scheduled for {previewDate}.
                    </div>
                  ) : (
                    followUps
                      .filter(f => f.scheduledDate === previewDate)
                      .map(f => (
                        <div
                          key={f.id}
                          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white">{f.clientName}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 font-bold">
                              {f.scheduledTime} • {f.status}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300">{f.reason}</p>
                          <span className="text-[10px] font-mono text-blue-600 block">
                            Executive: {f.executiveName} ({f.teId})
                          </span>
                        </div>
                      ))
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="font-black text-slate-900 dark:text-white uppercase text-xs">
                    Work Logs Recorded on {previewDate} ({workLogs.filter(w => w.date === previewDate).length})
                  </h4>
                  {workLogs.filter(w => w.date === previewDate).length === 0 ? (
                    <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-center">
                      No work logs recorded on {previewDate}.
                    </div>
                  ) : (
                    workLogs
                      .filter(w => w.date === previewDate)
                      .map(w => (
                        <div
                          key={w.id}
                          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white">{w.clientName}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 font-bold">
                              {w.durationMinutes}m • {w.status}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 line-clamp-2">{w.details}</p>
                          <span className="text-[10px] font-mono text-indigo-600 block">
                            Executive: {w.executiveName}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
