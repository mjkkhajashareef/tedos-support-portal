/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ModuleId, SupportClient } from '../../../types';
import { MaterialCard } from '../../common/MaterialCard';
import { AIHook } from '../../common/AIHook';
import { PendingProofLinksBanner } from '../../common/PendingProofLinksBanner';
import {
  Search,
  ClipboardPen,
  ChevronRight,
  Calendar,
  Building2,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';

interface DashboardGreetingAndLaunchHubProps {
  isUrdu: boolean;
  companyName: string;
  brandTagline: string;
  greeting: string;
  formattedDate: string;
  userName: string;
  userRole: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filteredClients: SupportClient[];
  urgentClientsCount: number;
  onSelectClient: (clientId: string) => void;
  onStartDailyWorkLog: () => void;
  onNavigateModule: (module: ModuleId) => void;
  onOpenPendingProofModal: () => void;
}

export const DashboardGreetingAndLaunchHub: React.FC<DashboardGreetingAndLaunchHubProps> = ({
  isUrdu,
  companyName,
  brandTagline,
  greeting,
  formattedDate,
  userName,
  userRole,
  searchQuery,
  onSearchChange,
  filteredClients,
  urgentClientsCount,
  onSelectClient,
  onStartDailyWorkLog,
  onNavigateModule,
  onOpenPendingProofModal,
}) => {
  return (
    <>
      {/* SECTION 1. GREETING CARD */}
      <div
        id="dashboard-greeting-card"
        className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-linear-to-br from-md-primary/10 via-md-primary/5 to-transparent border border-md-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-md bg-md-primary text-md-on-primary flex items-center justify-center font-black text-[10px] select-none">
              TE
            </div>
            <span className="text-[10px] font-mono tracking-widest font-black text-md-primary uppercase">
              {companyName} • {brandTagline}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-md-on-background select-none">
            {greeting}, {userName || 'Executive'}
          </h2>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-0.5 text-xs text-md-on-surface-variant/80">
            <span className="inline-flex items-center gap-1 font-semibold text-md-primary">
              <ShieldAlert size={13} />
              {userRole || 'Support Executive'}
            </span>
            <span className="text-md-outline/40">•</span>
            <span className="inline-flex items-center gap-1 font-medium text-md-on-surface-variant/70">
              <Calendar size={13} className="text-md-outline" />
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Global Instant Search Block */}
        <div className="w-full md:w-80 space-y-1 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute ltr:left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 text-md-outline" />
            <input
              type="text"
              placeholder={isUrdu ? 'کلائنٹ کا نام، کمپنی، یا لاگ تلاش کریں...' : 'Search clients, logs, followups...'}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4 py-2.5 rounded-2xl border border-md-surface-variant bg-md-surface-container-low text-xs text-md-on-surface placeholder-md-outline/65 focus:outline-hidden focus:ring-1 focus:ring-md-primary focus:bg-md-surface transition-all shadow-2xs"
            />
          </div>
          <span className="text-[9px] font-mono text-md-outline/75 px-1 block ltr:text-right rtl:text-left">
            {isUrdu ? 'ورک اسپیس کھولنے کے لیے کلائنٹ پر کلک کریں' : 'Tap client card to enter Workspace'}
          </span>
        </div>
      </div>

      {/* QUICK WORKFLOW LAUNCH HUB */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={onStartDailyWorkLog}
          className="p-4 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm transition active:scale-98 flex items-center justify-between text-left rtl:text-right cursor-pointer"
        >
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-200">
              {isUrdu ? 'کلائنٹ سیشن ورک لاگ' : 'Client Work Flow'}
            </span>
            <h3 className="text-sm font-black">
              {isUrdu ? 'اگلے کلائنٹ کا ورک لاگ کھولیں ↗' : 'Start Daily Work Log ↗'}
            </h3>
            <p className="text-[11px] text-blue-100">
              {isUrdu ? 'نئے کلائنٹ کا ٹائمر اور لاگ اندراج' : 'Single client session timer & log'}
            </p>
          </div>
          <ClipboardPen size={22} className="text-white shrink-0 ml-2 rtl:mr-2 rtl:ml-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateModule(ModuleId.NOTIFICATIONS)}
          className="p-4 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm transition active:scale-98 flex items-center justify-between text-left rtl:text-right cursor-pointer"
        >
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-200">
              {isUrdu ? 'ٹیم رابطہ و میسجز' : 'Team Messages'}
            </span>
            <h3 className="text-sm font-black">
              {isUrdu ? 'ان باکس و نیا پیغام ✉️' : 'Inbox & Create Message ✉️'}
            </h3>
            <p className="text-[11px] text-emerald-100">
              {isUrdu ? 'ساتھیوں سے پیغامات کے ذریعے بات کریں' : 'Send & receive internal team messages'}
            </p>
          </div>
          <MessageSquare size={22} className="text-white shrink-0 ml-2 rtl:mr-2 rtl:ml-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateModule(ModuleId.MY_CLIENTS)}
          className="p-4 rounded-2xl bg-linear-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-sm transition active:scale-98 flex items-center justify-between text-left rtl:text-right cursor-pointer"
        >
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-200">
              {isUrdu ? 'لائیو سافٹ ویئر لنکس' : 'Client Portals'}
            </span>
            <h3 className="text-sm font-black">
              {isUrdu ? 'میرے کلائنٹس کے URLs 🌐' : 'My Clients & Software URLs 🌐'}
            </h3>
            <p className="text-[11px] text-purple-100">
              {isUrdu ? 'سافٹ ویئر پورٹل، فون اور واٹس ایپ' : 'Live software URLs & instant contacts'}
            </p>
          </div>
          <Building2 size={22} className="text-white shrink-0 ml-2 rtl:mr-2 rtl:ml-0" />
        </button>
      </div>

      {/* Instant Search Results Panel */}
      {searchQuery.trim() !== '' && (
        <MaterialCard variant="outlined" className="p-4 space-y-2 animate-fade-in border-md-primary/30 shadow-md">
          <span className="text-[10px] font-mono font-bold text-md-primary uppercase tracking-wider block">
            {isUrdu ? `تلاش کے نتائج (${filteredClients.length} ملے)` : `Search Results (${filteredClients.length} found)`}
          </span>
          {filteredClients.length === 0 ? (
            <p className="text-xs text-md-on-surface-variant/70 italic p-2">
              {isUrdu ? 'کوئی مماثل کلائنٹ ریکارڈ نہیں ملا۔' : 'No matching client records found.'}
            </p>
          ) : (
            <div className="divide-y divide-md-surface-variant">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => onSelectClient(client.id)}
                  className="w-full py-3 ltr:text-left rtl:text-right text-xs flex items-center justify-between hover:bg-md-primary-container/15 px-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-md-on-surface block truncate">{client.name}</span>
                    <span className="text-[10px] text-md-outline truncate block mt-0.5">
                      {client.company} • {client.assignedExecutive}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        client.status === 'Critical'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : client.status === 'Warning'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {client.status}
                    </span>
                    <ChevronRight size={14} className="text-md-outline rtl:rotate-180" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </MaterialCard>
      )}

      {/* AI Hook Insight Banner */}
      <MaterialCard
        variant="filled"
        className="bg-md-tertiary-container/20 border border-md-tertiary-container/30 py-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl"
      >
        <AIHook
          screenId="dashboard_executive"
          contextMessage={isUrdu ? 'قبل از وقت خطرات کے تدارک کا تجزیہ فعال ہے۔' : 'Pre-emptive risk mitigation analysis active.'}
        />
        <span className="text-[11px] font-medium text-md-on-tertiary-container/90 leading-relaxed">
          {isUrdu ? (
            <>👉 روسٹر کی تصدیق مکمل۔ <strong>{urgentClientsCount} کلائنٹس</strong> کو فوری سسٹم ہیلتھ چیک درکار ہے۔</>
          ) : (
            <>👉 Roster check completed. <strong>{urgentClientsCount} clients</strong> require urgent system health verification.</>
          )}
        </span>
      </MaterialCard>

      {/* Prominent Pending Proof Links Alert Banner */}
      <PendingProofLinksBanner onOpenModal={onOpenPendingProofModal} />
    </>
  );
};
