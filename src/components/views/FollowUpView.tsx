/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FollowUpTracker, UserRole } from '../../types';
import { can, Permission } from '../../utils/rbac';
import { MaterialCard } from '../common/MaterialCard';
import { AIHook } from '../common/AIHook';
import { SHEETS_MAPPING_CONFIG } from '../../config/sheetsMapping';
import { exportFollowUpsToCSV } from '../../utils/exportUtils';
import { getLocalDateString } from '../../utils/helpers';
import { FollowUpSalaryKpiStrip } from './followups/FollowUpSalaryKpiStrip';
import { ScheduleFollowUpForm } from './followups/ScheduleFollowUpForm';
import { FollowUpCard } from './followups/FollowUpCard';
import { FollowUpOutreachDrawer } from './followups/FollowUpOutreachDrawer';
import { FollowUpCalendarPreviewModal } from './followups/FollowUpCalendarPreviewModal';
import { CalendarClock, Plus, CheckCircle2, Search, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FollowUpViewProps {
  id?: string;
}

type TabType = 'today' | 'overdue' | 'upcoming' | 'completed';

export const FollowUpView: React.FC<FollowUpViewProps> = ({ id }) => {
  const {
    clients,
    followUps,
    tickets,
    users,
    workLogs,
    addFollowUp,
    updateFollowUp,
    updateClientStatus,
    currentUser,
    openGoogleReviewModal,
    language
  } = useApp();

  const isUrdu = language === 'ur';

  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [onlyUnresolvedClients, setOnlyUnresolvedClients] = useState<boolean>(true);
  const [isCalendarPreviewOpen, setIsCalendarPreviewOpen] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [activeOutreachFollowUp, setActiveOutreachFollowUp] = useState<FollowUpTracker | null>(null);
  const [outreachType, setOutreachType] = useState<'call' | 'whatsapp' | 'reschedule' | 'complete' | null>(null);
  const [successBannerMsg, setSuccessBannerMsg] = useState('');

  const todayStr = useMemo(() => getLocalDateString(), []);

  const flashBanner = (msg: string) => {
    setSuccessBannerMsg(msg);
    setTimeout(() => setSuccessBannerMsg(''), 4500);
  };

  const filteredFollowUps = useMemo(() => {
    return followUps.filter(f => {
      if (currentUser?.role === UserRole.SUPPORT_EXECUTIVE || currentUser?.role === 'Support Executive') {
        const myName = (currentUser.name || '').toLowerCase();
        const firstToken = myName.split(' ')[0];
        const fExec = (f.executiveName || '').toLowerCase();
        const assignedSet = new Set(currentUser.assignedClients || []);
        const isMyClient =
          (f.clientId && assignedSet.has(f.clientId)) ||
          clients.some(
            c =>
              (c.id === f.clientId || c.name === f.clientName) &&
              (c.assignedExecutive || c.assignedSupport || '').toLowerCase().includes(firstToken)
          );
        if (!isMyClient && !fExec.includes(firstToken)) return false;
      }

      if (onlyUnresolvedClients && activeTab !== 'completed') {
        if (f.status === 'Completed') return false;
        const relatedTicket = tickets.find(t => t.id === f.ticketId || t.clientId === f.clientId);
        if (
          relatedTicket &&
          (relatedTicket.status === 'Resolved' || relatedTicket.status === 'Closed') &&
          f.status !== 'Pending'
        ) {
          return false;
        }
      }

      const matchesSearch =
        f.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.executiveName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.reason.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (activeTab === 'today') return f.status !== 'Completed' && f.scheduledDate === todayStr;
      if (activeTab === 'overdue') return f.status !== 'Completed' && f.scheduledDate < todayStr;
      if (activeTab === 'upcoming') return f.status !== 'Completed' && f.scheduledDate > todayStr;
      if (activeTab === 'completed') return f.status === 'Completed';
      return true;
    });
  }, [followUps, activeTab, searchQuery, todayStr, onlyUnresolvedClients, tickets, currentUser, clients]);

  const tabCounts = useMemo(() => {
    const counts = { today: 0, overdue: 0, upcoming: 0, completed: 0 };
    followUps.forEach(f => {
      if (f.status !== 'Pending') counts.completed++;
      else if (f.scheduledDate === todayStr) counts.today++;
      else if (f.scheduledDate < todayStr) counts.overdue++;
      else if (f.scheduledDate > todayStr) counts.upcoming++;
    });
    return counts;
  }, [followUps, todayStr]);

  const handleEscalateAction = (f: FollowUpTracker) => {
    updateFollowUp(f.id, {
      status: 'Escalated',
      priority: 'Critical',
      remarks: 'ESCALATED: Support executive requested immediate supervisory audit.'
    });
    flashBanner('Outreach escalated to supervisor! Urgency upgraded to Critical.');
  };

  return (
    <div id={id} className="space-y-6 max-w-5xl mx-auto pb-12 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-md-surface-container p-4 rounded-3xl border border-md-surface-variant shadow-2xs select-none">
        <AIHook
          screenId="followup_tracker"
          contextMessage={
            isUrdu
              ? 'فالو اپ ٹریکر: صرف ان کلائنٹس کو دکھایا جا رہا ہے جن کا مسئلہ ابھی حل نہیں ہوا۔'
              : 'Showing unresolved client issues synced directly with ULTIMATE & Follow_Up_Tracker sheets.'
          }
        />
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCalendarPreviewOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <CalendarClock size={14} />
            <span>{isUrdu ? 'کیلنڈر پریویو چیک کریں' : 'Check Calendar Preview'}</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={onlyUnresolvedClients}
              onChange={e => setOnlyUnresolvedClients(e.target.checked)}
            />
            <span>{isUrdu ? 'صرف حل نہ ہونے والے مسائل (Unresolved Only)' : 'Unresolved Issues Only'}</span>
          </label>

          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Ultimate Sheet Follow-Up Sync Active
          </span>
        </div>
      </div>

      <FollowUpSalaryKpiStrip users={users} followUps={followUps} currentUser={currentUser} isUrdu={isUrdu} />

      <AnimatePresence>
        {successBannerMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm"
          >
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 animate-bounce" />
            <span>{successBannerMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-md-outline" />
          <input
            type="text"
            placeholder={isUrdu ? 'کلائنٹ، ملازم، یا مقصد کے ذریعے تلاش کریں...' : 'Search by client, executive, purpose...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full ltr:pl-11 ltr:pr-10 rtl:pr-11 rtl:pl-10 py-3.5 bg-md-surface-container rounded-2xl border border-md-surface-variant text-xs text-md-on-surface font-semibold placeholder-md-outline/65 focus:outline-hidden focus:ring-1 focus:ring-md-primary shadow-3xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute ltr:right-4 rtl:left-4 top-1/2 -translate-y-1/2 text-md-outline hover:text-md-on-surface"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 bg-md-surface-container-low p-1 rounded-2xl border border-md-surface-variant gap-0.5 select-none">
          {(['today', 'overdue', 'upcoming', 'completed'] as TabType[]).map(tab => {
            const count = tabCounts[tab];
            const isActive = activeTab === tab;
            const tabLabel = isUrdu
              ? tab === 'today' ? 'آج' : tab === 'overdue' ? 'تاخیر' : tab === 'upcoming' ? 'آئندہ' : 'مکمل'
              : tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setExpandedCardId(null);
                }}
                className={`py-2 px-1 rounded-xl text-[10px] font-black tracking-wider uppercase flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? tab === 'overdue' && count > 0
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-md-primary text-md-on-primary shadow-sm'
                    : 'text-md-outline hover:text-md-on-surface hover:bg-md-surface-variant/30'
                }`}
              >
                <span className="truncate">{tabLabel}</span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full mt-0.5 font-bold ${
                    isActive
                      ? 'bg-black/15 text-white'
                      : tab === 'overdue' && count > 0
                      ? 'bg-red-100 text-red-700 animate-pulse'
                      : 'bg-md-surface-variant text-md-on-surface-variant'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        {!showAddForm && can(currentUser?.role, Permission.CREATE_FOLLOW_UP) && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex-1 py-3.5 bg-md-primary text-md-on-primary rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-md-primary/95 transition-all shadow-md active:scale-98 cursor-pointer select-none"
          >
            <Plus size={15} />
            <span>{isUrdu ? 'نیا فالو اپ شیڈول کریں' : 'Schedule New'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => exportFollowUpsToCSV(filteredFollowUps)}
          className="px-4 py-3.5 rounded-2xl border border-md-surface-variant bg-md-surface-container hover:bg-md-surface-variant/40 text-xs font-bold text-md-on-surface flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
          title={isUrdu ? 'فالو اپس CSV میں محفوظ کریں' : 'Export Follow-ups to CSV'}
        >
          <Download size={15} className="text-blue-600" />
          <span>{isUrdu ? 'ایکسپورٹ CSV' : 'Export CSV'}</span>
        </button>
      </div>

      <ScheduleFollowUpForm
        show={showAddForm}
        onClose={() => setShowAddForm(false)}
        clients={clients}
        currentUser={currentUser}
        todayStr={todayStr}
        isUrdu={isUrdu}
        addFollowUp={addFollowUp}
        onScheduled={flashBanner}
      />

      <div className="space-y-3.5">
        <div className="flex items-center justify-between border-b border-md-surface-variant pb-1.5 select-none">
          <span className="text-[10px] font-mono font-black text-md-outline uppercase tracking-wider block">
            {isUrdu
              ? activeTab === 'today' ? 'آج کے فالو اپس کی فہرست'
                : activeTab === 'overdue' ? 'تاخیر شدہ فالو اپ کیو'
                : activeTab === 'upcoming' ? 'آئندہ فالو اپس'
                : 'مکمل شدہ فالو اپس کا ریکارڈ'
              : activeTab === 'today' ? "Today's Outreach List"
                : activeTab === 'overdue' ? 'Overdue Critical Queue'
                : activeTab === 'upcoming' ? 'Upcoming Planner Checklist'
                : 'Completed / Processed Outreach Logs'}{' '}
            ({filteredFollowUps.length})
          </span>
          <span className="text-[9px] font-mono font-bold text-md-outline uppercase">
            {isUrdu ? 'ایس او پی اسٹینڈرڈ' : 'SOP Standard'}
          </span>
        </div>

        {filteredFollowUps.length === 0 ? (
          <MaterialCard variant="outlined" className="p-10 text-center space-y-2 border-dashed select-none">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500/80 animate-pulse" />
            <p className="text-xs text-md-on-surface font-extrabold">{isUrdu ? 'کیو بالکل خالی ہے!' : 'Queue Clear!'}</p>
            <p className="text-[10px] text-md-outline max-w-xs mx-auto leading-relaxed">
              {isUrdu
                ? "اس زمرے میں فی الحال کوئی فالو اپ ٹاسک موجود نہیں ہے۔ نیا ٹاسک شامل کرنے کے لیے 'نیا فالو اپ شیڈول کریں' دبائیں۔"
                : 'No outreach tasks found for this folder category. Tap Schedule New to add client callback activities.'}
            </p>
          </MaterialCard>
        ) : (
          <div className="space-y-4">
            {filteredFollowUps.map(f => (
              <FollowUpCard
                key={f.id}
                followUp={f}
                clientObj={clients.find(c => c.id === f.clientId)}
                isExpanded={expandedCardId === f.id}
                isUrdu={isUrdu}
                onToggleExpand={() => setExpandedCardId(expandedCardId === f.id ? null : f.id)}
                onEscalate={handleEscalateAction}
                onOpenReschedule={item => {
                  setActiveOutreachFollowUp(item);
                  setOutreachType('reschedule');
                }}
                onOpenWhatsApp={item => {
                  setActiveOutreachFollowUp(item);
                  setOutreachType('whatsapp');
                }}
                onOpenGoogleReview={client => openGoogleReviewModal(client)}
                onOpenCallLog={item => {
                  setActiveOutreachFollowUp(item);
                  setOutreachType('call');
                }}
              />
            ))}
          </div>
        )}
      </div>

      <FollowUpOutreachDrawer
        activeOutreachFollowUp={activeOutreachFollowUp}
        outreachType={outreachType}
        clients={clients}
        currentUser={currentUser}
        todayStr={todayStr}
        isUrdu={isUrdu}
        onClose={() => {
          setActiveOutreachFollowUp(null);
          setOutreachType(null);
        }}
        updateFollowUp={updateFollowUp}
        addFollowUp={addFollowUp}
        updateClientStatus={updateClientStatus}
        onActionSuccess={flashBanner}
      />

      <FollowUpCalendarPreviewModal
        isOpen={isCalendarPreviewOpen}
        onClose={() => setIsCalendarPreviewOpen(false)}
        followUps={followUps}
        workLogs={workLogs}
        isUrdu={isUrdu}
      />

      <div className="py-2.5 px-4 rounded-xl border border-md-surface-variant/60 bg-md-surface-container-low text-[10px] font-mono text-md-outline flex flex-col gap-1.5 select-none">
        <div className="flex items-center justify-between gap-1">
          <span>Mapped Sheets Name: {SHEETS_MAPPING_CONFIG.FOLLOW_UP_TRACKER.sheetName}</span>
          <span className="font-extrabold text-md-primary">CONFIGURABLE COLUMN MAPPING LAYER ACTIVE</span>
        </div>
        <div className="text-[9px] text-md-outline/85 leading-relaxed truncate">
          Row Schema: [
          {SHEETS_MAPPING_CONFIG.FOLLOW_UP_TRACKER.columns.map(col => `${col.columnLetter}:${col.headerName}`).join(', ')}
          ]
        </div>
      </div>
    </div>
  );
};
