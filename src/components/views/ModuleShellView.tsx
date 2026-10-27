/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ModuleId } from '../../types';
import { MaterialCard } from '../common/MaterialCard';
import { AIHook } from '../common/AIHook';
import { openWhatsAppChat, detectClientBrand, sendInteraktMessage, fetchInteraktConfig, InteraktConfig } from '../../utils/whatsappUtils';
import { exportWorkLogsToCSV, printDailyWorkLogReport } from '../../utils/exportUtils';
import {
  GraduationCap,
  MessageSquareCode,
  BarChart3,
  Bell,
  Sparkles,
  Settings,
  Send,
  Database,
  CheckCircle2,
  RefreshCw,
  Server,
  Phone,
  Download,
  Printer,
  BookOpen,
  Award,
  ExternalLink
} from 'lucide-react';

interface ModuleShellViewProps {
  id?: string;
}

export const ModuleShellView: React.FC<ModuleShellViewProps> = ({ id }) => {
  const {
    currentModule,
    notifications,
    markNotificationAsRead,
    clients,
    workLogs,
    addWorkLog,
    users,
    currentUser,
    language
  } = useApp();
  const isUrdu = language === 'ur';

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success'>('idle');
  const [selectedWaClientId, setSelectedWaClientId] = useState<string>(clients[0]?.id || '');
  const [interaktConfig, setInteraktConfig] = useState<InteraktConfig | null>(null);
  const [isSendingInterakt, setIsSendingInterakt] = useState(false);
  const [interaktSuccessAlert, setInteraktSuccessAlert] = useState<string | null>(null);

  const activeWaClient = clients.find(c => c.id === selectedWaClientId) || clients[0];
  const activeBrand = detectClientBrand(activeWaClient);

  const getInitialMessageForBrand = (client: any) => {
    const brand = detectClientBrand(client);
    const cName = client?.name || 'محترم کلائنٹ';
    if (brand === 'TALEEMPRO') {
      return `السلام علیکم ورحمۃ اللہ، محترم ${cName}! تعلیم پرو (TaleemPro) سپورٹ ٹیم کی جانب سے رابطہ۔ آپ کے سافٹ ویئر کا یومیہ بیک اپ اور سسٹم ہیلتھ چیک مکمل اور محفوظ ہے۔ اگر کوئی رہنمائی درکار ہو تو مطلع فرمائیں۔`;
    }
    return `Hello ${cName}! Your Edsof Support Team here. We have verified your daily cloud backup and system health status. Please let us know if you need any assistance.`;
  };

  const [waMessage, setWaMessage] = useState<string>(() => getInitialMessageForBrand(clients[0]));
  const [waKpiLogs, setWaKpiLogs] = useState<
    Array<{ id: string; clientName: string; phone: string; msg: string; exec: string; time: string; channel?: string }>
  >([]);

  const [trainingTopic, setTrainingTopic] = useState('');
  const [trainingClientId, setTrainingClientId] = useState(clients[0]?.id || '');
  const [trainingSessions, setTrainingSessions] = useState<
    Array<{ id: string; clientName: string; topic: string; trainer: string; status: string; duration: string }>
  >(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('tedos_training_sessions_v4');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  });

  // Load Interakt config on mount
  React.useEffect(() => {
    fetchInteraktConfig().then(cfg => setInteraktConfig(cfg));
  }, []);

  // Update template message when selected client changes
  const handleSelectClient = (clientId: string) => {
    setSelectedWaClientId(clientId);
    const target = clients.find(c => c.id === clientId);
    if (target) {
      setWaMessage(getInitialMessageForBrand(target));
    }
  };

  const handleSendViaInterakt = async () => {
    if (!activeWaClient?.phone || !waMessage.trim()) return;
    setIsSendingInterakt(true);
    setInteraktSuccessAlert(null);

    const result = await sendInteraktMessage({
      phoneNumber: activeWaClient.phone,
      message: waMessage,
      clientName: activeWaClient.name,
      clientBrand: activeBrand
    });

    setIsSendingInterakt(false);

    if (result.success && result.channel === 'INTERAKT_CENTRAL_WABA') {
      setInteraktSuccessAlert(`پیغام مرکزی سرکاری نمبر (${result.senderNumber || interaktConfig?.senderNumber}) سے کامیابی سے بھیج دیا گیا!`);
      setWaKpiLogs(prev => [
        {
          id: `wa-${Date.now()}`,
          clientName: activeWaClient.name,
          phone: activeWaClient.phone,
          msg: waMessage,
          exec: `${currentUser?.name || 'Executive'} (Interakt Official WABA)`,
          time: 'Just now',
          channel: 'Interakt Central Number'
        },
        ...prev
      ]);
      setTimeout(() => setInteraktSuccessAlert(null), 5000);
    } else {
      // Fallback
      if (result.fallbackUrl) {
        window.open(result.fallbackUrl, '_blank', 'noopener,noreferrer');
      } else {
        openWhatsAppChat({ phone: activeWaClient.phone, message: waMessage });
      }
      setWaKpiLogs(prev => [
        {
          id: `wa-${Date.now()}`,
          clientName: activeWaClient.name,
          phone: activeWaClient.phone,
          msg: waMessage,
          exec: currentUser?.name || 'Executive',
          time: 'Just now (WhatsApp Web)',
          channel: 'WhatsApp Web'
        },
        ...prev
      ]);
    }
  };

  const handleSendWhatsAppKpi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWaClient) return;

    if (interaktConfig?.enabled && interaktConfig.apiKey) {
      handleSendViaInterakt();
      return;
    }

    openWhatsAppChat({
      phone: activeWaClient.phone,
      message: waMessage
    });

    setWaKpiLogs(prev => [
      {
        id: `wa-${Date.now()}`,
        clientName: activeWaClient.name,
        phone: activeWaClient.phone,
        msg: waMessage,
        exec: currentUser?.name || 'Executive',
        time: 'Just now',
        channel: 'WhatsApp Web'
      },
      ...prev
    ]);
  };

  const handleAddTrainingSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainingTopic.trim()) return;
    const targetClient = clients.find(c => c.id === trainingClientId) || clients[0];
    const newSession = {
      id: `tr-${Date.now()}`,
      clientName: targetClient?.name || 'Assigned Client',
      topic: trainingTopic.trim(),
      trainer: currentUser?.name || 'Support Executive',
      status: 'Completed',
      duration: '30 Mins'
    };

    setTrainingSessions(prev => {
      const next = [newSession, ...prev];
      try { localStorage.setItem('tedos_training_sessions_v4', JSON.stringify(next)); } catch {}
      return next;
    });

    // Also persist as Work Log so it immediately appears in Work Logs & history
    addWorkLog({
      clientId: targetClient?.id || 'cl-training',
      clientName: targetClient?.name || 'Client',
      category: "Training Sessions'",
      details: `Staff Training Session: ${trainingTopic.trim()}`,
      durationMinutes: 30,
      status: 'Completed'
    });

    setTrainingTopic('');
  };

  const getModuleConfig = () => {
    switch (currentModule) {
      case ModuleId.TRAINING:
        return {
          title: isUrdu ? 'ٹریننگ اینڈ ریسورسز (Training & Resources)' : 'Training & Onboarding Resources Hub',
          icon: GraduationCap,
          sheet: 'Training_Log & SOP Library',
          desc: isUrdu
            ? 'کلائنٹ کو سافٹ ویئر چلانے کی ٹریننگ (POS، بلنگ، بارکوڈ، جی ایس ٹی رپورٹ) دینے کا ریکارڈ اور سپورٹ ٹیم کے لیے مکمل تکنیکی گائیڈز۔'
            : 'Client software onboarding sessions (POS, GST billing, barcode & printer setup) and step-by-step SOP manuals for Support Executives.',
          color: 'text-teal-600 bg-teal-50'
        };
      case ModuleId.WHATSAPP:
        return {
          title: isUrdu ? 'واٹس ایپ کے پی آئی اور آٹومیشن (WhatsApp KPI Hub)' : 'WhatsApp KPI & Client Outreach Hub',
          icon: MessageSquareCode,
          sheet: 'WhatsApp_KPI_Tracker (Executive Authorized)',
          desc: isUrdu
            ? 'سپورٹ ایگزیکٹو اور مینیجرز کے لیے براہ راست کلائنٹ واٹس ایپ کے پی آئی میسجز، فالو اپ الرٹس اور ریویو لنکس بھیجنے کا بااختیار مرکز۔'
            : 'Authorized for Support Executives & Managers to dispatch direct WhatsApp KPI check-ins, backup alerts, and follow-up messages to assigned clients.',
          color: 'text-emerald-600 bg-emerald-50'
        };
      case ModuleId.REPORTS:
        return {
          title: isUrdu ? 'رپورٹس، ایکسپورٹ اور کے پی آئی تجزیات' : 'Reports, CSV Exports & KPI Analytics',
          icon: BarChart3,
          sheet: 'KPI_Dashboard & Salary_Incentive_Tracker',
          desc: isUrdu
            ? 'سپورٹ ٹیم کی کارکردگی، کل گھنٹے، تنخواہ و ماہانہ انعام (Incentive KPI) اور ورک لاگز کی مکمل CSV/پرنٹ رپورٹس۔'
            : 'Comprehensive executive performance analytics, total hours, monthly salary + incentive KPIs, and instant CSV/PDF report exports.',
          color: 'text-blue-600 bg-blue-50'
        };
      case ModuleId.NOTIFICATIONS:
        return {
          title: isUrdu ? 'سسٹم نوٹیفیکیشنز اور ان باکس الرٹس' : 'System Notifications & Leadership Inbox',
          icon: Bell,
          sheet: 'System_Audit_Log & Remark_Replies',
          desc: isUrdu
            ? 'سی او او، ڈائریکٹر، مینیجر کے ریمارکس اور سپورٹ ٹیم کے جوابات سمیت تمام لائیو الرٹس۔'
            : 'Real-time inbox for COO/Director/Manager remarks, Support Executive replies, and ticket Response 1 updates.',
          color: 'text-amber-600 bg-amber-50'
        };
      default:
        return {
          title: isUrdu ? 'ماڈیول فاؤنڈیشن' : 'TEDOS Module Hub',
          icon: Server,
          sheet: 'TEDOS_Database_v1.0',
          desc: isUrdu ? 'معیاری انٹرپرائز ماڈیول سسٹم۔' : 'Enterprise standard module layout system.',
          color: 'text-md-primary bg-md-primary-container/10'
        };
    }
  };

  const config = getModuleConfig();
  const IconComponent = config.icon;

  return (
    <div id={id} className="space-y-6 max-w-5xl mx-auto animate-slide-up pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className={`p-3.5 rounded-2xl ${config.color} shrink-0`}>
            <IconComponent size={24} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
              {config.title}
            </h2>
            <span className="text-[11px] font-mono text-slate-500 mt-0.5 block">
              DB Mapped Reference: <strong>{config.sheet}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportWorkLogsToCSV(workLogs)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => printDailyWorkLogReport(workLogs, new Date().toISOString().split('T')[0], currentUser?.name)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      <MaterialCard variant="elevated" className="p-5 space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          {config.desc}
        </p>
      </MaterialCard>

      {/* WHATSAPP KPI MODULE (Authorized for Support Executive & Managers - Req #24) */}
      {currentModule === ModuleId.WHATSAPP && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MaterialCard variant="elevated" className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Phone size={16} className="text-emerald-600" />
                <span>
                  {isUrdu
                    ? 'واٹس ایپ کے پی آئی پیغام بھیجیں (Support Executive Authority)'
                    : 'Send Direct WhatsApp KPI Message (Support Executive Authorized)'}
                </span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                KPI Active
              </span>
            </div>

            <form onSubmit={handleSendWhatsAppKpi} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isUrdu ? 'اپنا تفویض کردہ کلائنٹ منتخب کریں:' : 'Select Assigned Client:'}
                </label>
                <select
                  value={selectedWaClientId}
                  onChange={e => handleSelectClient(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) — {detectClientBrand(c) === 'TALEEMPRO' ? 'تعلیم پرو (TaleemPro)' : 'Edsof ERP'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Interakt Channel Indicator */}
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    {isUrdu 
                      ? `مرکزی بزنس واٹس ایپ نمبر: ${interaktConfig?.senderNumber || '+92 300 0000000'} (Interakt API)`
                      : `Official Company Sender: ${interaktConfig?.senderNumber || '+92 300 0000000'} (Interakt API)`}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-900 border font-mono text-slate-600 dark:text-slate-300">
                  {activeBrand === 'TALEEMPRO' ? 'اردو (Urdu)' : 'English'}
                </span>
              </div>

              {interaktSuccessAlert && (
                <div className="p-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 animate-fade-in shadow-sm">
                  <CheckCircle2 size={16} />
                  <span>{interaktSuccessAlert}</span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isUrdu ? 'فوری برانڈڈ ٹیمپلیٹس (TaleemPro / Edsof):' : 'Branded Quick Templates (TaleemPro / Edsof):'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(activeBrand === 'TALEEMPRO'
                    ? [
                        {
                          label: 'یومیہ کلاؤڈ بیک اپ',
                          text: `السلام علیکم ورحمۃ اللہ، محترم ${activeWaClient?.name || ''}! تعلیم پرو (TaleemPro) سپورٹ ٹیم کی جانب سے اطلاع دی جاتی ہے کہ آپ کے اسکول سافٹ ویئر کا یومیہ کلاؤڈ بیک اپ اور ڈیٹا کی صحت کامیابی سے تصدیق کر لی گئی ہے۔`
                        },
                        {
                          label: 'فالو اپ و کسٹمر کیئر',
                          text: `السلام علیکم ورحمۃ اللہ، محترم ${activeWaClient?.name || ''}! تعلیم پرو (TaleemPro) سپورٹ ٹیم کی جانب سے رابطہ ہے۔ کیا سافٹ ویئر میں تمام امور، فیس اندراج اور حاضری کے ماڈیولز درست چل رہے ہیں؟`
                        },
                        {
                          label: 'اسٹاف ٹریننگ شیڈول',
                          text: `السلام علیکم ورحمۃ اللہ، محترم ${activeWaClient?.name || ''}! تعلیم پرو (TaleemPro) اسکول مینجمنٹ سافٹ ویئر کے لیے آپ کا اسٹاف ٹریننگ سیشن آج گوگل میٹ کے ذریعے شیڈول ہے۔ برائے مہربانی متعلقہ عملے کے ساتھ شرکت فرمائیں۔`
                        }
                      ]
                    : [
                        {
                          label: 'Daily Backup Verified',
                          text: `Hello ${activeWaClient?.name || ''}! Your Edsof Support Team here. We have verified your daily cloud backup and system database health status. Everything is running smoothly.`
                        },
                        {
                          label: 'Operations Follow-up',
                          text: `Hello ${activeWaClient?.name || ''}! This is a follow-up check-in from your Edsof Support Team. Is everything running smoothly with your system today? Please let us know if you require any assistance.`
                        },
                        {
                          label: 'Staff Training Schedule',
                          text: `Hello ${activeWaClient?.name || ''}! Your staff training session for Edsof is scheduled for today via Google Meet. Please join with your team at the scheduled time.`
                        }
                      ]
                  ).map(tpl => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => setWaMessage(tpl.text)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] cursor-pointer"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isUrdu ? 'واٹس ایپ پیغام (بغیر TEDOS ERP v4.5 کے):' : 'WhatsApp Client Message (Clean Branded):'}
                </label>
                <textarea
                  rows={3}
                  value={waMessage}
                  onChange={e => setWaMessage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSendViaInterakt}
                  disabled={isSendingInterakt}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  {isSendingInterakt ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  <span>
                    {isUrdu 
                      ? 'مرکزی کمپنی نمبر سے بھیجیں (Interakt API)' 
                      : 'Send via Official Business Number (Interakt API)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => openWhatsAppChat({ phone: activeWaClient?.phone, message: waMessage })}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 cursor-pointer"
                  title="Open direct WhatsApp Web chat"
                >
                  <Phone size={13} />
                  <span>{isUrdu ? 'واٹس ایپ ویب پر کھولیں' : 'WhatsApp Web'}</span>
                </button>
              </div>
            </form>
          </MaterialCard>

          <MaterialCard variant="elevated" className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {isUrdu ? `واٹس ایپ کے پی آئی آؤٹ ریچ ہسٹری (${waKpiLogs.length})` : `WhatsApp KPI Outreach Log (${waKpiLogs.length})`}
            </h3>
            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {waKpiLogs.map(log => (
                <div
                  key={log.id}
                  className="p-3.5 border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 dark:text-white">
                      {log.clientName} ({log.phone})
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 font-bold">
                      Sent by {log.exec}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">{log.msg}</p>
                  <span className="text-[10px] font-mono text-slate-400 block">{log.time}</span>
                </div>
              ))}
            </div>
          </MaterialCard>
        </div>
      )}

      {/* TRAINING & RESOURCES MODULE (Req #21 & #23: What is Training & Resources + Interactive Training Log) */}
      {currentModule === ModuleId.TRAINING && (
        <div className="space-y-6">
          {/* Clear Explanation Box for Req #21 & #23 */}
          <MaterialCard variant="elevated" className="p-5 rounded-3xl bg-teal-500/5 border border-teal-500/25 space-y-3">
            <h3 className="text-sm font-black text-teal-900 dark:text-teal-300 flex items-center gap-2">
              <BookOpen size={17} />
              <span>
                {isUrdu
                  ? 'ٹریننگ اینڈ ریسورسز اور ٹکٹ کے 5 ایکشن بٹنز کی مکمل وضاحت:'
                  : 'Guide: What are Training & Resources, Work Log, Call Back, WhatsApp Ping & Attachments?'}
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <strong className="text-blue-600 block mb-1">1. Add Work Log (ورک لاگ):</strong>
                <span>Records daily support calls, duration, and Google Meet proof links directly to the sheet.</span>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <strong className="text-amber-600 block mb-1">2. Schedule Call Back (فالو اپ کال):</strong>
                <span>Sets a reminder date & time for unresolved client issues in the Follow-up Tracker & Ultimate Sheet.</span>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <strong className="text-emerald-600 block mb-1">3. WhatsApp Ping (واٹس ایپ رابطہ):</strong>
                <span>Sends instant WhatsApp status updates or review links to the client's registered mobile number.</span>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <strong className="text-teal-600 block mb-1">4. Training Log (کلائنٹ ٹریننگ ریکارڈ):</strong>
                <span>Logs online/offline training given to a client's cashier, accountant, or operator on using TEDOS software.</span>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <strong className="text-purple-600 block mb-1">5. Attachments (اسکرین شاٹ / دستاویز):</strong>
                <span>Attaches error screenshots, invoice PDFs, or Google Drive proof links when raising or solving a ticket.</span>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <strong className="text-indigo-600 block mb-1">6. Training & Resources Hub:</strong>
                <span>Contains SOP manuals (printer setup, GST filing, DB lock fix) and tracks client onboarding sessions.</span>
              </div>
            </div>
          </MaterialCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Log New Client Training Session */}
            <MaterialCard variant="elevated" className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {isUrdu ? '+ نیا کلائنٹ ٹریننگ سیشن درج کریں' : '+ Record Client Software Training Session'}
              </h3>
              <form onSubmit={handleAddTrainingSession} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Client</label>
                  <select
                    value={trainingClientId}
                    onChange={e => setTrainingClientId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.department || 'ERP'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Training Topic / Module Covered
                  </label>
                  <input
                    type="text"
                    required
                    value={trainingTopic}
                    onChange={e => setTrainingTopic(e.target.value)}
                    placeholder="e.g. POS Billing, Thermal Printer Alignment, GST Report..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
                >
                  Save Training Session
                </button>
              </form>
            </MaterialCard>

            {/* Completed Training Sessions & SOP Library */}
            <MaterialCard variant="elevated" className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Client Training Log & SOP Manuals ({trainingSessions.length})
              </h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {trainingSessions.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 dark:text-white">{item.clientName}</span>
                      <span className="px-2 py-0.5 rounded bg-teal-500/15 text-teal-700 font-bold text-[10px]">
                        {item.status} • {item.duration}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-medium">{item.topic}</p>
                    <span className="text-[10px] font-mono text-indigo-600 block">Trainer: {item.trainer}</span>
                  </div>
                ))}
              </div>
            </MaterialCard>
          </div>
        </div>
      )}

      {/* REPORTS & SALARY KPI ANALYTICS */}
      {currentModule === ModuleId.REPORTS && (
        <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {isUrdu
                ? 'سپورٹ ٹیم اور فری لانسرز کی تنخواہ، انعام اور کے پی آئی رپورٹ'
                : 'Support Team & Freelancer Salary, Incentive & Work Log KPI Report'}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono uppercase text-slate-400">
                  <th className="py-2.5 px-3">Employee ID & Name</th>
                  <th className="py-2.5 px-3">Role / Type</th>
                  <th className="py-2.5 px-3">Base Salary</th>
                  <th className="py-2.5 px-3">Monthly Incentive KPI</th>
                  <th className="py-2.5 px-3">Assigned Clients</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="py-2.5 px-3 font-bold">
                      <span className="font-mono text-blue-600 mr-2">{u.employeeId}</span>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      {u.role} {u.isFreelancer ? '(Freelancer)' : ''}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      ₹{(u.baseSalary || 22000).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">
                      +₹{(u.monthlyIncentive || 2500).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {
                        clients.filter(
                          c =>
                            (c.assignedExecutive || '').toLowerCase() === u.name.toLowerCase() ||
                            (u.assignedClients || []).includes(c.id)
                        ).length
                      }{' '}
                      Clients
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MaterialCard>
      )}

      {/* NOTIFICATIONS & INBOX */}
      {currentModule === ModuleId.NOTIFICATIONS && (
        <div className="space-y-2.5">
          <span className="text-[10px] font-mono font-bold text-md-outline uppercase tracking-wider block">
            System Notifications & Remark Reply Inbox ({notifications.length})
          </span>
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => markNotificationAsRead(n.id)}
              className={`p-4 border border-md-surface-variant rounded-xl text-xs space-y-1.5 cursor-pointer transition-all ${
                !n.read ? 'bg-md-primary-container/10 border-md-primary/30' : 'bg-md-surface-container-low/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-md-on-surface">{n.title}</span>
                <span className="text-[9px] font-mono text-md-outline">{n.timestamp}</span>
              </div>
              <p className="text-md-on-surface-variant/80 font-medium leading-relaxed">{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
