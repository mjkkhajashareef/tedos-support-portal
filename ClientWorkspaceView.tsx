/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ModuleId, SupportClient, UserRole } from '../../types';
import { MaterialCard } from '../common/MaterialCard';
import { AIHook } from '../common/AIHook';
import {
  ArrowLeft,
  Phone,
  Mail,
  ShieldCheck,
  CalendarCheck,
  ClipboardList,
  MessageSquareCode,
  Sparkles,
  RefreshCw,
  Plus,
  Clock,
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';
import { motion } from 'motion/react';

interface ClientWorkspaceViewProps {
  id?: string;
}

export const ClientWorkspaceView: React.FC<ClientWorkspaceViewProps> = ({ id }) => {
  const {
    selectedClientId,
    setSelectedClientId,
    setCurrentModule,
    clients,
    workLogs,
    followUps,
    addWorkLog,
    addFollowUp,
    language
  } = useApp();

  const isUrdu = language === 'ur';

  // Active Workspace Sub-Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'training' | 'logs' | 'whatsapp'>('profile');

  // Simple local form state for instant workspace quick-logs
  const [quickLogText, setQuickLogText] = useState('');
  const [isSubmittingQuickLog, setIsSubmittingQuickLog] = useState(false);

  // If no client selected, default to the first one or show clean prompt
  const client = clients.find(c => c.id === selectedClientId) || clients[0];

  if (!client) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <p className="text-sm text-md-on-surface-variant/80 italic">
          {isUrdu ? "فی الوقت کوئی کلائنٹ منتخب نہیں ہے۔ پہلے کلائنٹس ڈائریکٹری میں جائیں۔" : "No client currently selected. Go to Clients directory first."}
        </p>
        <button
          onClick={() => setCurrentModule(ModuleId.CLIENTS)}
          className="mt-4 px-4 py-2.5 rounded-full bg-md-primary text-md-on-primary text-xs font-bold cursor-pointer"
        >
          {isUrdu ? "کلائنٹس ڈائریکٹری کھولیں" : "Open Clients Directory"}
        </button>
      </div>
    );
  }

  // Filter logs & followups for this client
  const clientLogs = workLogs.filter(log => log.clientId === client.id);
  const clientFollowups = followUps.filter(f => f.clientId === client.id);

  const handleBackToClients = () => {
    setSelectedClientId(null);
    setCurrentModule(ModuleId.CLIENTS);
  };

  const handleAddQuickLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLogText.trim()) return;

    setIsSubmittingQuickLog(true);

    // Simulate 300ms cloud synchronization lag
    setTimeout(() => {
      addWorkLog({
        clientId: client.id,
        clientName: client.company,
        category: isUrdu ? 'فوری ورک اسپیس لاگ' : 'Quick Workspace Log',
        details: quickLogText,
        durationMinutes: 15,
        status: 'Resolved'
      });
      setQuickLogText('');
      setIsSubmittingQuickLog(false);
    }, 300);
  };

  const tabs = [
    { id: 'profile', labelEn: 'License & Health', labelUr: 'لائسنس اور سسٹم صحت', icon: ShieldCheck },
    { id: 'training', labelEn: 'Training Checklists', labelUr: 'ٹریننگ چیک لسٹ', icon: ClipboardList },
    { id: 'logs', labelEn: 'History Logs', labelUr: 'سرگرمیوں کی تاریخ', icon: Clock },
    { id: 'whatsapp', labelEn: 'WhatsApp Automation', labelUr: 'واٹس ایپ آٹومیشن', icon: MessageSquareCode },
  ];

  return (
    <div id={id} className="space-y-6 max-w-5xl mx-auto animate-slide-up">
      {/* Header Bar with back link */}
      <div className="flex items-center justify-between gap-3 border-b border-md-surface-variant pb-3">
        <button
          onClick={handleBackToClients}
          className="flex items-center gap-2 text-xs font-bold text-md-primary hover:underline cursor-pointer select-none"
        >
          <ArrowLeft size={16} className="rtl:rotate-180" />
          <span>{isUrdu ? "کلائنٹس کی فہرست پر واپس جائیں" : "Back to Clients"}</span>
        </button>
        <div className="flex items-center gap-1">
          <Database size={12} className="text-md-outline" />
          <span className="text-[10px] font-mono text-md-outline uppercase font-medium">
            Sheet Ref: {client.id}
          </span>
        </div>
      </div>

      {/* Profile Card Header */}
      <MaterialCard variant="elevated" className="p-5 sm:p-6 bg-md-surface-container-low">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-3xl bg-md-primary text-md-on-primary font-bold text-lg flex items-center justify-center shrink-0 select-none shadow-md">
              {client.company.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-md-on-surface leading-tight">
                  {client.company}
                </h3>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  client.status === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                  client.status === 'Warning' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {client.status}
                </span>
              </div>
              <p className="text-xs text-md-on-surface-variant mt-1">
                {isUrdu ? "اہم رابطہ کار: " : "Primary Contact: "}<strong className="font-semibold text-md-on-surface">{client.name}</strong> • {isUrdu ? "مقرر کردہ ایگزیکٹو: " : "Assigned to: "}<strong className="font-semibold">{client.assignedExecutive}</strong> • 🏢 Dept: <strong>{client.department || 'Retail & POS'}</strong>
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
                {client.url && (
                  <a
                    href={client.url.startsWith('http') ? client.url : `https://${client.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-bold text-blue-600 underline inline-flex items-center gap-1"
                  >
                    <ExternalLink size={12} />
                    <span>{client.url.startsWith('http') ? client.url : `https://${client.url}`}</span>
                  </a>
                )}
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 font-semibold text-[11px]">
                  📌 {isUrdu ? 'اسپیشل مینیجر ریمارک: ' : 'Special Manager Remark: '}{client.specialManagerRemark || client.noteSaad || 'Standard SLA'}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 font-bold text-[11px]">
                  💰 Monthly Incentive: {client.monthlyIncentive || '₹2,500'}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentModule(ModuleId.TICKETS)}
                  className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] cursor-pointer"
                >
                  🎫 Raise Ticket (FROM → TO)
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats: Health Score */}
          <div className="flex items-center gap-5 shrink-0 self-start md:self-center border-t md:border-t-0 pt-4 md:pt-0 border-md-surface-variant">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono font-bold text-md-outline uppercase">
                {isUrdu ? "ہیلتھ انڈیکس" : "Health Index"}
              </span>
              <span className={`text-2xl font-black mt-1 ${
                client.healthStatus <= 40 ? 'text-red-600' :
                client.healthStatus <= 75 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {client.healthStatus}%
              </span>
            </div>

            <div className="w-px h-10 bg-md-surface-variant" />

            <div className="flex flex-col">
              <span className="text-[9px] font-mono font-bold text-md-outline uppercase">
                {isUrdu ? "سافٹ ویئر ورژن" : "Software Version"}
              </span>
              <span className="text-xs font-bold text-md-on-surface mt-1.5 font-mono bg-md-surface-container-high px-2 py-0.5 rounded-md">
                {client.softwareDetails.version}
              </span>
            </div>
          </div>
        </div>
      </MaterialCard>

      {/* AI Assistance architectural hook container */}
      <MaterialCard variant="filled" className="bg-md-tertiary-container/20 border border-md-tertiary-container/40 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <AIHook 
            screenId={`workspace_${client.id}`} 
            contextMessage={isUrdu ? "سسٹم ٹیلی میٹری لاگز تجزیہ کے لیے تیار ہے۔" : "System telemetry logs analysis ready."} 
          />
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-md-tertiary flex items-center gap-1.5">
              <Sparkles size={14} className="animate-pulse" />
              <span>{isUrdu ? "خودکار تجزیاتی تجاویز فعال" : "Future Automated Insights Ready"}</span>
            </span>
          </div>
        </div>
        <p className="text-[11px] text-md-on-surface-variant/80 mt-2.5 leading-relaxed italic">
          💡 {isUrdu 
            ? `اگلا تجویز کردہ عمل: SQL بیک اپ کی جانچ کریں (آخری بار: ${client.softwareDetails.lastBackupDate})۔ خطرے کی سطح: ${client.healthStatus < 50 ? 'زیادہ (High)' : 'کم (Low)'}۔` 
            : `Next proposed action: Verify SQL backup integrity (Last run: ${client.softwareDetails.lastBackupDate}). Risk level is currently ${client.healthStatus < 50 ? 'High' : 'Low'}.`}
        </p>
      </MaterialCard>

      {/* Sub-Tabs for Client Workspace Modules */}
      <div className="flex items-center border-b border-md-surface-variant gap-1 overflow-x-auto scrollbar-none pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 py-3 px-4 text-xs font-semibold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                isActive
                  ? 'border-md-primary text-md-primary bg-md-primary-container/10'
                  : 'border-transparent text-md-on-surface-variant/75 hover:bg-md-surface-variant/20'
              }`}
            >
              <Icon size={14} />
              <span>{isUrdu ? tab.labelUr : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Tab Contents */}
      <div className="min-h-72">
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System details */}
            <MaterialCard variant="outlined" className="space-y-4">
              <span className="text-[10px] font-mono font-black text-md-outline uppercase tracking-wider block">
                {isUrdu ? "تکنیکی کنفیگریشن" : "Technical Configuration"}
              </span>
              <div className="space-y-3.5 text-xs text-md-on-surface">
                <div className="flex justify-between border-b border-md-surface-variant/50 pb-2">
                  <span className="text-md-on-surface-variant/80">{isUrdu ? "لائسنس معاہدہ" : "License Agreement"}</span>
                  <span className="font-bold">{client.softwareDetails.licenseType}</span>
                </div>
                <div className="flex justify-between border-b border-md-surface-variant/50 pb-2">
                  <span className="text-md-on-surface-variant/80">{isUrdu ? "لائسنس اختتام تاریخ" : "License Expiration"}</span>
                  <span className="font-bold font-mono text-red-600">{client.softwareDetails.expiryDate}</span>
                </div>
                <div className="flex justify-between border-b border-md-surface-variant/50 pb-2">
                  <span className="text-md-on-surface-variant/80">{isUrdu ? "آخری ڈیٹا بیس بیک اپ" : "Last Database Backup"}</span>
                  <span className="font-bold font-mono">{client.softwareDetails.lastBackupDate}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-md-on-surface-variant/80">{isUrdu ? "مقرر کردہ سپورٹ اسٹاف" : "Assigned Support Staff"}</span>
                  <span className="font-bold">{client.assignedExecutive}</span>
                </div>
              </div>
            </MaterialCard>

            {/* Direct contact actions */}
            <MaterialCard variant="outlined" className="space-y-4">
              <span className="text-[10px] font-mono font-black text-md-outline uppercase tracking-wider block">
                {isUrdu ? "رابطے کے ذرائع" : "Contact & Communication Outlets"}
              </span>
              <div className="space-y-2">
                <a
                  href={`tel:${client.phone}`}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-md-surface hover:bg-md-primary-container/15 border border-md-surface-variant transition-colors text-xs text-md-on-surface font-semibold cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Phone size={14} className="text-md-primary" />
                    <span>{isUrdu ? "موبائل پر کال کریں: " : "Call Mobile: "}{client.phone}</span>
                  </div>
                  <ChevronRight size={14} className="text-md-outline rtl:rotate-180" />
                </a>

                <a
                  href={`mailto:${client.email}`}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-md-surface hover:bg-md-primary-container/15 border border-md-surface-variant transition-colors text-xs text-md-on-surface font-semibold cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Mail size={14} className="text-md-primary" />
                    <span>{isUrdu ? "ای میل سپورٹ: " : "Email Support: "}{client.email}</span>
                  </div>
                  <ChevronRight size={14} className="text-md-outline rtl:rotate-180" />
                </a>
              </div>
            </MaterialCard>
          </div>
        )}

        {activeTab === 'training' && (
          <div className="space-y-4">
            <MaterialCard variant="outlined" className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black text-md-outline uppercase tracking-wider">
                  {isUrdu ? "آپریشنل چیک لسٹ تعمیل" : "Operational Checklist compliance"}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {isUrdu ? "75% مکمل" : "75% complete"}
                </span>
              </div>

              {/* Sample Checklists mapping sheets structure */}
              <div className="space-y-3">
                {[
                  { titleEn: 'Server Installation & setup', titleUr: 'سرور انسٹالیشن اور مکمل سیٹ اپ', done: true },
                  { titleEn: 'Printer & Thermal printer escape character configuration', titleUr: 'پرنٹر اور تھرمل پرنٹر کنفیگریشن', done: true },
                  { titleEn: 'Store staff core training session', titleUr: 'اسٹور اسٹاف بنیادی ٹریننگ سیشن', done: true },
                  { titleEn: 'Daily Google Drive auto-backup scheduler mapping', titleUr: 'گوگل ڈرائیو روزانہ خودکار بیک اپ میپنگ', done: false },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-md-surface-container/60 border border-md-surface-variant/40"
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      readOnly
                      className="mt-0.5 h-4 w-4 rounded-md border-md-outline text-md-primary focus:ring-md-primary cursor-not-allowed"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${item.done ? 'line-through text-md-on-surface-variant/60 font-medium' : 'text-md-on-surface font-semibold'}`}>
                        {isUrdu ? item.titleUr : item.titleEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </MaterialCard>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-5">
            {/* Quick Log Form */}
            <MaterialCard variant="outlined" className="p-4 bg-md-surface-container-low/40">
              <form onSubmit={handleAddQuickLog} className="space-y-3">
                <span className="text-[10px] font-mono font-black text-md-outline uppercase tracking-wider block">
                  {isUrdu ? "فوری لاگ اندراج (30 سیکنڈ فاسٹ انٹری)" : "Add Quick Log Entry (30-Sec Entry)"}
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={isUrdu ? "سپورٹ ٹاسک کا خلاصہ درج کریں..." : "Enter support task summary details..."}
                    value={quickLogText}
                    onChange={(e) => setQuickLogText(e.target.value)}
                    className="flex-1 text-xs border border-md-surface-variant rounded-xl px-3.5 bg-md-surface focus:outline-hidden focus:ring-1 focus:ring-md-primary py-2.5"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingQuickLog || !quickLogText.trim()}
                    className="px-4.5 rounded-xl bg-md-primary text-md-on-primary text-xs font-bold flex items-center justify-center gap-1 hover:bg-md-primary/95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingQuickLog ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Plus size={14} />
                        <span className="hidden sm:inline">{isUrdu ? "شامل کریں" : "Add"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </MaterialCard>

            {/* Timeline Log Grid */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono font-black text-md-outline uppercase tracking-wider block">
                {isUrdu ? "سرگرمیوں کی تاریخی ٹائم لائن" : "Historical Activities Timeline"}
              </span>
              {clientLogs.length === 0 ? (
                <p className="text-xs text-md-on-surface-variant/70 italic text-center py-6">
                  {isUrdu ? "اس کلائنٹ کے لیے کوئی سپورٹ سرگرمی درج نہیں ہے۔" : "No logged support activities recorded for this client."}
                </p>
              ) : (
                <div className="space-y-3">
                  {clientLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-xl border border-md-surface-variant bg-md-surface-container-lowest text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-md-on-surface bg-md-primary-container/20 text-md-primary px-2 py-0.5 rounded-md">
                          {log.category}
                        </span>
                        <span className="text-[10px] font-mono text-md-outline">
                          {new Date(log.timestamp).toLocaleDateString()} {isUrdu ? 'کو' : 'at'} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-md-on-surface-variant/90 leading-relaxed font-medium">
                        {log.details}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-md-outline/90 pt-1.5 border-t border-dashed border-md-surface-variant/60 font-mono">
                        <span>{isUrdu ? "اسٹاف: " : "Staff: "}<strong>{log.executiveName}</strong></span>
                        <span>{isUrdu ? "دورانیہ: " : "Duration: "}<strong>{log.durationMinutes} {isUrdu ? "منٹ" : "mins"}</strong></span>
                        <span className={`font-bold ${
                          log.status === 'Resolved' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>{log.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'whatsapp' && (
          <div className="space-y-4">
            <MaterialCard variant="outlined" className="space-y-4">
              <span className="text-[10px] font-mono font-black text-md-outline uppercase tracking-wider block">
                {isUrdu ? "خودکار واٹس ایپ پیغامات" : "Automated WhatsApp Triggers"}
              </span>
              <p className="text-xs text-md-on-surface-variant/80">
                {isUrdu 
                  ? "کلائنٹ کے رجسٹرڈ موبائل نمبر پر واٹس ایپ کے ذریعے فوری اسٹیٹس پیغامات بھیجیں:"
                  : "Instantly broadcast automated status alerts directly to the client's registered mobile number over WhatsApp integration:"}
              </p>

              <div className="space-y-2.5">
                {[
                  { 
                    titleEn: 'Send Server backup validation log', 
                    titleUr: 'سرور بیک اپ تصدیقی لاگ بھیجیں',
                    descEn: 'Alerts the client of a successful backup with timestamp.',
                    descUr: 'کلائنٹ کو بیک اپ کی کامیابی کا الرٹ ٹائم اسٹیمپ کے ساتھ بھیجتا ہے۔'
                  },
                  { 
                    titleEn: 'Send critical status notification', 
                    titleUr: 'اہم صورتحال کا نوٹیفکیشن بھیجیں',
                    descEn: 'Broadcasts an urgent technical support visit schedule alert.',
                    descUr: 'فوری تکنیکی دورے کا الرٹ ارسال کرتا ہے۔'
                  },
                  { 
                    titleEn: 'Send software updates announcement', 
                    titleUr: 'سافٹ ویئر اپ ڈیٹس کا اعلان بھیجیں',
                    descEn: 'Shares v5.0 release notes with store staff.',
                    descUr: 'اسٹور اسٹاف کو نئے ورژن کی تفصیلات بھیجتا ہے۔'
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left rtl:text-right p-3.5 rounded-xl border border-md-surface-variant bg-md-surface hover:bg-emerald-50/20 hover:border-emerald-500/50 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-md-on-surface block">{isUrdu ? item.titleUr : item.titleEn}</span>
                      <span className="text-[10px] text-md-on-surface-variant/75 block mt-0.5">{isUrdu ? item.descUr : item.descEn}</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 font-mono shrink-0 ltr:ml-4 rtl:mr-4 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                      <span>{isUrdu ? "بھیجیں" : "Trigger"}</span>
                      <ChevronRight size={12} className="rtl:rotate-180" />
                    </span>
                  </button>
                ))}
              </div>
            </MaterialCard>
          </div>
        )}
      </div>
    </div>
  );
};

