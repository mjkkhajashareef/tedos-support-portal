/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ModuleId, SupportClient, UserRole } from '../../types';
import { MaterialCard } from '../common/MaterialCard';
import { AIHook } from '../common/AIHook';
import { PendingProofLinksBanner } from '../common/PendingProofLinksBanner';
import { DailyTeamSummaryModal } from '../common/DailyTeamSummaryModal';
import { QuickLinksGrid } from '../common/QuickLinksGrid';
import { exportWorkLogsToCSV, printDailyWorkLogReport } from '../../utils/exportUtils';
import {
  Search,
  ClipboardPen,
  CalendarClock,
  Activity,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Sliders,
  Send,
  Clock,
  Calendar,
  Building2,
  Users,
  PhoneCall,
  AlertOctagon,
  GraduationCap,
  ListTodo,
  Database,
  Cpu,
  Wifi,
  MessageSquare,
  MessageCircle,
  CloudLightning,
  RefreshCw,
  Bell,
  Sparkles,
  Info,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Award,
  BookOpen,
  ArrowRight,
  Download,
  Printer
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardViewProps {
  id?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ id }) => {
  const {
    currentUser,
    selectedRole,
    clients,
    followUps,
    workLogs,
    users,
    setCurrentModule,
    setSelectedClientId,
    branding,
    config,
    language,
    openPendingProofModal
  } = useApp();

  const isUrdu = language === 'ur';

  const [searchQuery, setSearchQuery] = useState('');
  const [liveTime, setLiveTime] = useState(new Date());
  const [dashboardLogDate, setDashboardLogDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dashboardDaybookRange, setDashboardDaybookRange] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_WEEK' | 'CUSTOM_DATE'>('ALL');
  const [dashboardExecFilter, setDashboardExecFilter] = useState<string>('ALL');
  const [isTeamSummaryModalOpen, setTeamSummaryModalOpen] = useState<boolean>(false);

  // Keep a small live clock to make connection sync time feel alive and dynamic
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // 1. Dynamic Greeting based on time
  const getGreeting = () => {
    const hr = liveTime.getHours();
    if (isUrdu) {
      if (hr < 12) return 'صبح بخیر';
      if (hr < 17) return 'دوپہر بخیر';
      return 'شام بخیر';
    }
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return liveTime.toLocaleDateString(isUrdu ? 'ur-PK' : 'en-US', options);
  };

  const handleClientClick = (clientId: string) => {
    setSelectedClientId(clientId);
    setCurrentModule(ModuleId.CLIENT_WORKSPACE);
  };

  // 2. Metrics & Workload calculations from active AppContext lists
  const myClients = clients.filter(c => c.assignedExecutive === currentUser?.name) || [];
  const assignedClientsCount = myClients.length || clients.length;

  const activeFollowups = followUps.filter(f => f.status === 'Pending');
  const todaysFollowupsCount = activeFollowups.length;
  
  const overdueFollowupsCount = followUps.filter(f => f.status === 'Overdue').length;
  const pendingTrainingsCount = 2; // Fixed mock training metrics
  const todaysWorkLogsCount = workLogs.length;
  const pendingTasksCount = activeFollowups.length + overdueFollowupsCount + 1; // calculated tasks workload

  // Search filter for clients
  const filteredClients = searchQuery.trim()
    ? clients.filter(
        c =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.company.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // 3. Configurable Quick Actions configurations (for future updates)
  const quickActionsConfig = [
    {
      id: 'action-worklog',
      label: isUrdu ? 'ورک لاگ شامل کریں' : 'Add Work Log',
      description: isUrdu ? 'آج کی سرگرمی کا اندراج' : 'Log today\'s operations',
      icon: ClipboardPen,
      onClick: () => setCurrentModule(ModuleId.DAILY_WORK_LOG),
      bgColor: 'bg-md-primary/10 hover:bg-md-primary/15 text-md-primary border-md-primary/25',
    },
    {
      id: 'action-clients',
      label: isUrdu ? 'کلائنٹ پروفائل' : 'Open Client',
      description: isUrdu ? 'کلائنٹس کی فہرست و تفصیلات' : 'View client profiles',
      icon: Users,
      onClick: () => setCurrentModule(ModuleId.CLIENTS),
      bgColor: 'bg-md-secondary-container/60 hover:bg-md-secondary-container text-md-on-secondary-container border-md-outline/10',
    },
    {
      id: 'action-followup',
      label: isUrdu ? 'فالو اپ شیڈول' : 'Follow-up',
      description: isUrdu ? 'کلائنٹس کو کال کا شیڈول' : 'Log scheduled outreach',
      icon: CalendarClock,
      onClick: () => setCurrentModule(ModuleId.FOLLOW_UP),
      bgColor: 'bg-md-tertiary-container/40 hover:bg-md-tertiary-container/65 text-md-on-tertiary-container border-md-tertiary-container/50',
    },
    {
      id: 'action-whatsapp',
      label: isUrdu ? 'واٹس ایپ رابطہ' : 'WhatsApp',
      description: isUrdu ? 'براہ راست واٹس ایپ پیغام' : 'Launch quick message',
      icon: MessageCircle,
      onClick: () => setCurrentModule(ModuleId.WHATSAPP),
      bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    }
  ];

  // 4. Priority calculations
  const urgentClients = clients.filter(c => c.healthStatus < 50);
  const highPriorityFollowups = followUps.filter(f => f.priority === 'High' && f.status === 'Pending');
  
  // Clients requiring training list (Zigma & Apollo permanently removed per Req #22)
  const trainingRequiredClients = clients.slice(0, 2).map(c => ({
    id: c.id,
    name: c.name,
    company: c.company,
    trainingTopic: isUrdu ? 'سافٹ ویئر ابتدائی ٹریننگ v5.0' : 'v5.0-SaaS System Orientation & Billing Setup'
  }));

  // Filtered Dashboard Work Logs for Date & Executive Export/Report (Req #13, #14 & Op Manager #2, #3, #4)
  const filteredDashboardWorkLogs = React.useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

    return workLogs.filter(l => {
      if (dashboardExecFilter !== 'ALL') {
        const execLower = (l.executiveName || l.supportName || '').toLowerCase();
        if (!execLower.includes(dashboardExecFilter.toLowerCase().split(' ')[0])) return false;
      }
      if (dashboardDaybookRange === 'TODAY') return l.date === todayStr;
      if (dashboardDaybookRange === 'YESTERDAY') return l.date === yesterdayStr;
      if (dashboardDaybookRange === 'CUSTOM_DATE') return l.date === dashboardLogDate;
      if (dashboardDaybookRange === 'THIS_WEEK') {
        return now.getTime() - new Date(l.date).getTime() <= 7 * 86400000;
      }
      if (dashboardDaybookRange === 'LAST_WEEK') {
        const diffDays = (now.getTime() - new Date(l.date).getTime()) / 86400000;
        return diffDays > 7 && diffDays <= 14;
      }
      return true;
    });
  }, [workLogs, dashboardExecFilter, dashboardDaybookRange, dashboardLogDate]);

  // Recently assigned clients mock list
  const recentlyAssignedClients = clients.filter(c => c.status === 'Warning' || c.status === 'Active').slice(0, 2);

  // 7. Connection Status definitions
  const connectionStatuses = [
    { name: isUrdu ? 'گوگل شیٹس' : 'Google Sheets', status: isUrdu ? 'مربوط' : 'Connected', details: isUrdu ? 'ہمہ وقت ہم آہنگ' : 'v4.0 Sync Active', icon: Database, color: 'text-emerald-500 bg-emerald-500/10' },
    { name: isUrdu ? 'ایپس اسکرپٹ' : 'Apps Script', status: isUrdu ? 'مربوط' : 'Connected', details: 'REST API Gateway', icon: Cpu, color: 'text-blue-500 bg-blue-500/10' },
    { name: isUrdu ? 'انٹرنیٹ' : 'Internet', status: isUrdu ? 'آن لائن' : 'Online', details: '14ms Latency', icon: Wifi, color: 'text-teal-500 bg-teal-500/10' },
    { name: isUrdu ? 'واٹس ایپ API' : 'WhatsApp API', status: isUrdu ? 'مربوط' : 'Connected', details: 'Live Proxy v16', icon: MessageSquare, color: 'text-emerald-500 bg-emerald-500/10' },
    { name: isUrdu ? 'سنک صورتحال' : 'Sync Status', status: isUrdu ? 'ہم آہنگ' : 'Synchronized', details: isUrdu ? 'ڈیٹا محفوظ ہے' : 'Database Mapped', icon: CloudLightning, color: 'text-amber-500 bg-amber-500/10' },
    { name: isUrdu ? 'آخری سنک' : 'Last Sync Time', status: isUrdu ? 'ابھی' : 'Just Now', details: isUrdu ? 'کوئی تاخیر نہیں' : 'No pending queue', icon: Clock, color: 'text-purple-500 bg-purple-500/10' }
  ];

  return (
    <div id={id} className="space-y-6 max-w-5xl mx-auto pb-12 animate-slide-up">
      
      {/* SECTION 1. GREETING CARD */}
      <div 
        id="dashboard-greeting-card" 
        className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-linear-to-br from-md-primary/10 via-md-primary/5 to-transparent border border-md-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-2">
          {/* Company Branding Tag */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-md bg-md-primary text-md-on-primary flex items-center justify-center font-black text-[10px] select-none">
              TE
            </div>
            <span className="text-[10px] font-mono tracking-widest font-black text-md-primary uppercase">
              {branding.companyName} • {branding.brandTagline}
            </span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-md-on-background select-none">
            {getGreeting()}, {currentUser?.name || 'Executive'}
          </h2>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-0.5 text-xs text-md-on-surface-variant/80">
            <span className="inline-flex items-center gap-1 font-semibold text-md-primary">
              <ShieldAlert size={13} />
              {currentUser?.role || 'Support Executive'}
            </span>
            <span className="text-md-outline/40">•</span>
            <span className="inline-flex items-center gap-1 font-medium text-md-on-surface-variant/70">
              <Calendar size={13} className="text-md-outline" />
              {getFormattedDate()}
            </span>
          </div>
        </div>

        {/* Global Instant Search Block */}
        <div className="w-full md:w-80 space-y-1 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute ltr:left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 text-md-outline" />
            <input
              type="text"
              placeholder={isUrdu ? "کلائنٹ کا نام، کمپنی، یا لاگ تلاش کریں..." : "Search clients, logs, followups..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4 py-2.5 rounded-2xl border border-md-surface-variant bg-md-surface-container-low text-xs text-md-on-surface placeholder-md-outline/65 focus:outline-hidden focus:ring-1 focus:ring-md-primary focus:bg-md-surface transition-all shadow-2xs"
            />
          </div>
          <span className="text-[9px] font-mono text-md-outline/75 px-1 block ltr:text-right rtl:text-left">
            {isUrdu ? "ورک اسپیس کھولنے کے لیے کلائنٹ پر کلک کریں" : "Tap client card to enter Workspace"}
          </span>
        </div>
      </div>

      {/* QUICK WORKFLOW LAUNCH HUB (Requirement #4 & #5: Daily Work Log Next Client & Team Messaging) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            setSelectedClientId(null);
            setCurrentModule(ModuleId.DAILY_WORK_LOG);
          }}
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
          onClick={() => setCurrentModule(ModuleId.NOTIFICATIONS)}
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
          onClick={() => setCurrentModule(ModuleId.MY_CLIENTS)}
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
              {isUrdu ? "کوئی مماثل کلائنٹ ریکارڈ نہیں ملا۔" : "No matching client records found."}
            </p>
          ) : (
            <div className="divide-y divide-md-surface-variant">
              {filteredClients.map(client => (
                <button
                  key={client.id}
                  onClick={() => handleClientClick(client.id)}
                  className="w-full py-3 ltr:text-left rtl:text-right text-xs flex items-center justify-between hover:bg-md-primary-container/15 px-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-md-on-surface block truncate">{client.name}</span>
                    <span className="text-[10px] text-md-outline truncate block mt-0.5">{client.company} • {client.assignedExecutive}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      client.status === 'Critical' ? 'bg-red-50 text-red-700 border border-red-200' :
                      client.status === 'Warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700'
                    }`}>
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
      <MaterialCard variant="filled" className="bg-md-tertiary-container/20 border border-md-tertiary-container/30 py-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl">
        <AIHook screenId="dashboard_executive" contextMessage={isUrdu ? "قبل از وقت خطرات کے تدارک کا تجزیہ فعال ہے۔" : "Pre-emptive risk mitigation analysis active."} />
        <span className="text-[11px] font-medium text-md-on-tertiary-container/90 leading-relaxed">
          {isUrdu ? (
            <>👉 روسٹر کی تصدیق مکمل۔ <strong>{urgentClients.length} کلائنٹس</strong> کو فوری سسٹم ہیلتھ چیک درکار ہے۔</>
          ) : (
            <>👉 Roster check completed. <strong>{urgentClients.length} clients</strong> require urgent system health verification.</>
          )}
        </span>
      </MaterialCard>

      {/* Prominent Pending Proof Links Alert Banner */}
      <PendingProofLinksBanner onOpenModal={openPendingProofModal} />

      {/* SECTION 2. TODAY'S SUMMARY */}
      <div id="dashboard-todays-summary" className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-mono font-black text-md-outline uppercase tracking-wider block">
            {isUrdu ? "آج کا آپریشنل بوجھ اور کام" : "Today's Operational Workload"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTeamSummaryModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Daily Team Summary with Today and Calendar Date Picker"
            >
              <Calendar size={13} />
              <span>{isUrdu ? '📊 روزانہ ٹیم سمری (Today / Calendar)' : '📊 Daily Team Summary'}</span>
            </button>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              {isUrdu ? "لائیو ڈیٹا سنک" : "Live Dashboard Sync"}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Summary Card 1 */}
          <div className="p-4 rounded-2xl bg-md-surface-container-low border border-md-outline/5 flex flex-col justify-between h-28 hover:border-md-primary/20 transition-all select-none">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-md-outline uppercase font-bold tracking-wider">
                {isUrdu ? "مفوضہ کلائنٹس" : "Assigned Clients"}
              </span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600"><Users size={16} /></div>
            </div>
            <div>
              <span className="text-2xl font-black text-md-on-surface block leading-none">{assignedClientsCount}</span>
              <span className="text-[9px] text-md-on-surface-variant/70 mt-1 block">
                {isUrdu ? "روسٹر کی کل گنجائش" : "Roster total capacity"}
              </span>
            </div>
          </div>

          {/* Summary Card 2 */}
          <div className="p-4 rounded-2xl bg-md-surface-container-low border border-md-outline/5 flex flex-col justify-between h-28 hover:border-md-primary/20 transition-all select-none">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-md-outline uppercase font-bold tracking-wider">
                {isUrdu ? "آج کے فالو اپس" : "Today's Follow-ups"}
              </span>
              <div className="p-1.5 rounded-lg bg-md-primary/15 text-md-primary"><PhoneCall size={16} /></div>
            </div>
            <div>
              <span className="text-2xl font-black text-md-on-surface block leading-none">{todaysFollowupsCount}</span>
              <span className="text-[9px] text-md-on-surface-variant/70 mt-1 block">
                {isUrdu ? "آج کے لیے شیڈول" : "Scheduled for today"}
              </span>
            </div>
          </div>

          {/* Summary Card 3 */}
          <div className="p-4 rounded-2xl bg-md-surface-container-low border border-md-outline/5 flex flex-col justify-between h-28 hover:border-md-primary/20 transition-all select-none">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-md-outline uppercase font-bold tracking-wider">
                {isUrdu ? "زائد المیعاد فالو اپس" : "Overdue Follow-ups"}
              </span>
              <div className="p-1.5 rounded-lg bg-red-500/10 text-red-600"><AlertOctagon size={16} /></div>
            </div>
            <div>
              <span className={`text-2xl font-black block leading-none ${overdueFollowupsCount > 0 ? 'text-red-600' : 'text-md-on-surface'}`}>{overdueFollowupsCount}</span>
              <span className="text-[9px] text-md-on-surface-variant/70 mt-1 block">
                {isUrdu ? "فوری توجہ طلب" : "Awaiting remediation"}
              </span>
            </div>
          </div>

          {/* Summary Card 4 */}
          <div className="p-4 rounded-2xl bg-md-surface-container-low border border-md-outline/5 flex flex-col justify-between h-28 hover:border-md-primary/20 transition-all select-none">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-md-outline uppercase font-bold tracking-wider">
                {isUrdu ? "زیر التواء ٹریننگ" : "Pending Trainings"}
              </span>
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600"><GraduationCap size={16} /></div>
            </div>
            <div>
              <span className="text-2xl font-black text-md-on-surface block leading-none">{pendingTrainingsCount}</span>
              <span className="text-[9px] text-md-on-surface-variant/70 mt-1 block">
                {isUrdu ? "ضروری کلائنٹ سیشنز" : "Required Client sessions"}
              </span>
            </div>
          </div>

          {/* Summary Card 5 */}
          <div className="p-4 rounded-2xl bg-md-surface-container-low border border-md-outline/5 flex flex-col justify-between h-28 hover:border-md-primary/20 transition-all select-none">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-md-outline uppercase font-bold tracking-wider">
                {isUrdu ? "آج کے ورک لاگز" : "Today's Work Logs"}
              </span>
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600"><ClipboardPen size={16} /></div>
            </div>
            <div>
              <span className="text-2xl font-black text-md-on-surface block leading-none">{todaysWorkLogsCount}</span>
              <span className="text-[9px] text-md-on-surface-variant/70 mt-1 block">
                {isUrdu ? "کامیابی سے درج" : "Submissions completed"}
              </span>
            </div>
          </div>

          {/* Summary Card 6 */}
          <div className="p-4 rounded-2xl bg-md-surface-container-low border border-md-outline/5 flex flex-col justify-between h-28 hover:border-md-primary/20 transition-all select-none">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-md-outline uppercase font-bold tracking-wider">
                {isUrdu ? "باقی ماندہ کام" : "Pending Tasks"}
              </span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600"><ListTodo size={16} /></div>
            </div>
            <div>
              <span className="text-2xl font-black text-md-on-surface block leading-none">{pendingTasksCount}</span>
              <span className="text-[9px] text-md-on-surface-variant/70 mt-1 block">
                {isUrdu ? "براہ راست قابل عمل لسٹ" : "Direct actionable queue"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3. DYNAMIC ROLE-BASED QUICK LINKS */}
      <QuickLinksGrid id="dashboard-quick-links" />

      {/* SECTION 3B. DASHBOARD WORK LOG EXPORT, REPORT & DATE PICKER HUB (Req #13, #14, Op Manager #2, #3, #4, #9) */}
      <MaterialCard variant="elevated" className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
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
            {/* Support Executive Selector (All executives for Managers/COO/Director, own name for Support Executive) */}
            {currentUser?.role !== UserRole.SUPPORT_EXECUTIVE && (
              <select
                value={dashboardExecFilter}
                onChange={e => setDashboardExecFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                <option value="ALL">All Support Executives</option>
                {Array.from(
                  new Set([
                    'Umar Farooq',
                    'Sumayya',
                    'Farman',
                    'Haneef',
                    'Asad',
                    'Khaja Shareef',
                    'Techno Admin',
                    ...users
                      .filter(u => u.role === UserRole.SUPPORT_EXECUTIVE || u.role === UserRole.SUPPORT_MANAGER)
                      .map(u => u.name)
                  ])
                )
                  .filter(name => {
                    const l = (name || '').toLowerCase();
                    return l && !l.includes('rahul') && !l.includes('sneha') && !l.includes('amit');
                  })
                  .map(name => (
                    <option key={name} value={name}>
                      👤 {name}
                    </option>
                  ))}
              </select>
            )}

            {/* Daybook Date Filter */}
            <select
              value={dashboardDaybookRange}
              onChange={e => setDashboardDaybookRange(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="LAST_WEEK">Last Week</option>
              <option value="CUSTOM_DATE">Select Date</option>
            </select>

            {/* Explicit Date Picker (Req #14: "Date bhi hona hai kounsi date ka chahiye") */}
            <input
              type="date"
              value={dashboardLogDate}
              onChange={e => {
                setDashboardLogDate(e.target.value);
                setDashboardDaybookRange('CUSTOM_DATE');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
            />

            {/* Export CSV & Print Report (Req #13) */}
            <button
              type="button"
              onClick={() => exportWorkLogsToCSV(filteredDashboardWorkLogs)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} />
              <span>Export Data (CSV)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                printDailyWorkLogReport(
                  filteredDashboardWorkLogs,
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

        {/* Filtered Work Logs Preview Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono uppercase text-slate-400">
                <th className="py-2 px-3">Date & Duration</th>
                <th className="py-2 px-3">Client & Department</th>
                <th className="py-2 px-3">Support Executive</th>
                <th className="py-2 px-3">Work Type & Summary</th>
                <th className="py-2 px-3">{isUrdu ? 'اسپیشل مینیجر ریمارک / انعام' : 'Special Manager Remark / Incentive KPI'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDashboardWorkLogs.slice(0, 6).map(wl => {
                const cObj = clients.find(c => c.id === wl.clientId || c.name === wl.clientName);
                return (
                  <tr key={wl.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{wl.date}</div>
                      <div className="text-[10px] text-blue-600">{wl.durationMinutes} mins ({wl.status})</div>
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

      {/* SECTION 4. TODAY'S PRIORITY & SECTION 5. RECENT ACTIVITY (GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 4. TODAY'S PRIORITY */}
        <MaterialCard id="dashboard-todays-priority" variant="outlined" className="space-y-4">
          <div className="flex items-center justify-between border-b border-md-surface-variant pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-md-primary" />
              <h3 className="text-sm font-bold text-md-on-surface">
                {isUrdu ? "آج کے انتہائی اہم کام اور ترجیحات" : "Today's High-Priority Workload"}
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-md-primary/10 text-md-primary rounded-full font-bold">
              {isUrdu ? "اہم ترین" : "Critical Actions"}
            </span>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {/* Urgent Clients Category */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono font-bold text-md-outline uppercase tracking-wider block">
                {isUrdu ? "فوری توجہ طلب کلائنٹس (ہیلتھ اسکور < 50%)" : "Urgent Clients (Health Score < 50%)"}
              </span>
              {urgentClients.map(client => (
                <div
                  key={client.id}
                  onClick={() => handleClientClick(client.id)}
                  className="p-3 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/15 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-md-on-surface block truncate">{client.name}</span>
                    <span className="text-[10px] text-md-on-surface-variant/70 block truncate">
                      {isUrdu ? "ہیلتھ: " : "Health: "}<strong className="font-mono text-red-600">{client.healthStatus}%</strong> • {isUrdu ? "تفویض: " : "Assigned to "}{client.assignedExecutive}
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-red-500/70 rtl:rotate-180" />
                </div>
              ))}
            </div>

            {/* High Priority Follow-ups */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono font-bold text-md-outline uppercase tracking-wider block">
                {isUrdu ? "اعلیٰ ترجیحی شیڈول شدہ فالو اپس" : "High Priority Scheduled Follow-ups"}
              </span>
              {highPriorityFollowups.map(f => (
                <div
                  key={f.id}
                  className="p-3 rounded-xl bg-md-surface-container border border-md-surface-variant flex items-start gap-2.5"
                >
                  <div className="p-1 rounded-lg bg-red-100 text-red-600 mt-0.5 shrink-0">
                    <Activity size={12} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-md-on-surface truncate">{f.clientName}</span>
                      <span className="text-[9px] font-mono text-red-600 bg-red-50 border border-red-100 px-1 rounded">
                        {isUrdu ? "اہم" : "High"}
                      </span>
                    </div>
                    <p className="text-[10px] text-md-on-surface-variant/80 mt-0.5 leading-relaxed">{f.reason}</p>
                    <span className="text-[9px] text-md-outline font-mono mt-1 block">
                      {isUrdu ? "وقت: " : "Scheduled: "}{new Date(f.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Clients Requiring Training */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono font-bold text-md-outline uppercase tracking-wider block">
                {isUrdu ? "سپورٹ ٹریننگ کے متلاشی کلائنٹس" : "Clients Requiring Support Training"}
              </span>
              {trainingRequiredClients.map(client => (
                <div
                  key={client.id}
                  onClick={() => handleClientClick(client.id)}
                  className="p-3 rounded-xl bg-teal-500/5 hover:bg-teal-500/10 border border-teal-500/15 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-md-on-surface block truncate">{client.name}</span>
                    <span className="text-[10px] text-teal-700 dark:text-teal-400 block truncate font-medium">
                      🎓 {client.trainingTopic}
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-teal-500/70 rtl:rotate-180" />
                </div>
              ))}
            </div>

            {/* Recently Assigned Clients */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono font-bold text-md-outline uppercase tracking-wider block">
                {isUrdu ? "حال ہی میں تفویض کردہ کلائنٹس" : "Recently Assigned Clients"}
              </span>
              {recentlyAssignedClients.map(client => (
                <div
                  key={client.id}
                  onClick={() => handleClientClick(client.id)}
                  className="p-3 rounded-xl bg-md-surface-container-low hover:bg-md-surface-container border border-md-surface-variant cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-md-on-surface block truncate">{client.name}</span>
                    <span className="text-[10px] text-md-on-surface-variant/75 block truncate">
                      {isUrdu ? "تفویض: " : "Assigned to "}{client.assignedExecutive} • {client.softwareDetails.version}
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-md-outline rtl:rotate-180" />
                </div>
              ))}
            </div>
          </div>
        </MaterialCard>

        {/* SECTION 5. RECENT ACTIVITY TIMELINE */}
        <MaterialCard id="dashboard-recent-activity" variant="outlined" className="space-y-4">
          <div className="flex items-center justify-between border-b border-md-surface-variant pb-2">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-md-primary" />
              <h3 className="text-sm font-bold text-md-on-surface">
                {isUrdu ? "سرگرمیوں کی ٹائم لائن اور تاریخ" : "Operational Activity Timeline"}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-md-outline font-semibold">
              {isUrdu ? "تاریخچہ" : "Historical Trace"}
            </span>
          </div>

          <div className="relative border-s border-md-outline/10 ps-5 ms-2.5 space-y-5 py-2">
            
            {/* Timeline Item 1: Last Work Log */}
            <div className="relative">
              <div className="absolute ltr:-left-[27px] rtl:-right-[27px] top-0 w-3.5 h-3.5 rounded-full bg-md-primary flex items-center justify-center border-2 border-md-surface" />
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-md-on-surface flex items-center gap-1.5">
                    <FileText size={12} className="text-md-primary" />
                    {isUrdu ? "آخری ورک لاگ جمع کرایا گیا" : "Last Work Log Submitted"}
                  </span>
                  <span className="text-[9px] font-mono text-md-outline">
                    {isUrdu ? "25 منٹ قبل" : "25 mins ago"}
                  </span>
                </div>
                <p className="text-[11px] text-md-on-surface-variant leading-relaxed">
                  <strong>{workLogs[0]?.executiveName || currentUser?.name || 'Executive'}</strong> {isUrdu ? 'نے' : 'logged'} <span className="font-semibold text-md-primary">"{workLogs[0]?.category || (isUrdu ? 'سپورٹ کال' : 'Support Call')}"</span> {isUrdu ? 'درج کیا۔ کلائنٹ:' : 'for'} {workLogs[0]?.clientName || clients[0]?.name || (isUrdu ? 'متعلقہ کلائنٹ' : 'Assigned Client')}۔ {isUrdu ? 'دورانیہ:' : 'Duration:'} {workLogs[0]?.durationMinutes || 15} {isUrdu ? 'منٹ' : 'mins'}.
                </p>
              </div>
            </div>

            {/* Timeline Item 2: Last Follow-up */}
            <div className="relative">
              <div className="absolute ltr:-left-[27px] rtl:-right-[27px] top-0 w-3.5 h-3.5 rounded-full bg-teal-500 flex items-center justify-center border-2 border-md-surface" />
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-md-on-surface flex items-center gap-1.5">
                    <PhoneCall size={12} className="text-teal-600" />
                    {isUrdu ? "آخری فالو اپ رابطہ" : "Last Follow-up Outreach"}
                  </span>
                  <span className="text-[9px] font-mono text-md-outline">
                    {isUrdu ? "آج" : "Today"}
                  </span>
                </div>
                <p className="text-[11px] text-md-on-surface-variant leading-relaxed">
                  <strong>{followUps[0]?.executiveName || currentUser?.name || 'Executive'}</strong> {isUrdu ? 'نے فالو اپ رابطہ مکمل کیا برائے' : 'completed follow-up outreach for'} <span className="font-semibold text-teal-700 dark:text-teal-400">{followUps[0]?.clientName || clients[0]?.name || (isUrdu ? 'متعلقہ کلائنٹ' : 'Assigned Client')}</span>. {isUrdu ? 'سسٹم مستحکم ہے۔' : 'Status reported stable.'}
                </p>
              </div>
            </div>

            {/* Timeline Item 3: Last Training */}
            <div className="relative">
              <div className="absolute ltr:-left-[27px] rtl:-right-[27px] top-0 w-3.5 h-3.5 rounded-full bg-purple-500 flex items-center justify-center border-2 border-md-surface" />
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-md-on-surface flex items-center gap-1.5">
                    <GraduationCap size={12} className="text-purple-600" />
                    {isUrdu ? "آخری ٹریننگ سیشن" : "Last Training Session Conducted"}
                  </span>
                  <span className="text-[9px] font-mono text-md-outline">
                    {isUrdu ? "کل" : "Yesterday"}
                  </span>
                </div>
                <p className="text-[11px] text-md-on-surface-variant leading-relaxed">
                  <strong>{currentUser?.name || 'Executive'}</strong> {isUrdu ? 'نے ٹریننگ سیشن مکمل کیا برائے' : 'concluded training session with tech team at'} <span className="font-semibold text-purple-700 dark:text-purple-400">{clients[1]?.name || clients[0]?.name || (isUrdu ? 'متعلقہ کلائنٹ' : 'Assigned Client')}</span>.
                </p>
              </div>
            </div>

            {/* Timeline Item 4: Last Client Opened */}
            <div className="relative">
              <div className="absolute ltr:-left-[27px] rtl:-right-[27px] top-0 w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center border-2 border-md-surface" />
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-md-on-surface flex items-center gap-1.5">
                    <BookOpen size={12} className="text-amber-600" />
                    {isUrdu ? "آخری بار کھولا گیا ورک اسپیس" : "Last Client Workspace Opened"}
                  </span>
                  <span className="text-[9px] font-mono text-md-outline">
                    {isUrdu ? "10 منٹ قبل" : "10 mins ago"}
                  </span>
                </div>
                <p className="text-[11px] text-md-on-surface-variant leading-relaxed">
                  {isUrdu ? 'کلائنٹ ورک اسپیس برائے' : 'Client workspace for'} <strong>{clients[0]?.name || (isUrdu ? 'متعلقہ کلائنٹ' : 'Assigned Client')}</strong> {isUrdu ? 'کا معائنہ مکمل کیا گیا۔' : 'was accessed by command station to evaluate transactional latency logs.'}
                </p>
              </div>
            </div>

          </div>
        </MaterialCard>
      </div>

      {/* SECTION 6. LEADERSHIP TEAM OPERATIONS & GOOGLE SHEETS SYNC GUIDE */}
      <div id="dashboard-performance-snapshot" className="space-y-4">
        {currentUser?.role !== UserRole.SUPPORT_EXECUTIVE ? (
          <div className="space-y-4">
            {/* Google Sheets Sync & Proof Approval Guide Banner */}
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
                  onClick={openPendingProofModal}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer select-none shrink-0"
                >
                  <CheckCircle2 size={14} />
                  <span>{isUrdu ? 'زیر التواء ثبوت ریویو کریں' : 'Review Pending Proofs'}</span>
                </button>
              </div>

              {/* Explanatory 3-step timeline */}
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

            {/* Team Productivity Headline Stats */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-black text-md-outline uppercase tracking-wider block">
                {isUrdu ? "سپورٹ ٹیم کی مجموعی کارکردگی کا جائزہ (Team Summary)" : "Support Team Productivity Overview"}
              </span>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-md-surface border border-md-surface-variant/70 text-center select-none shadow-xs">
                  <span className="text-[10px] font-mono text-md-outline uppercase font-semibold block mb-1">
                    {isUrdu ? "ایکٹو سپورٹ اسٹاف" : "Active Support Staff"}
                  </span>
                  <span className="text-2xl font-black text-indigo-600 block leading-none">
                    {users.filter(u => u.role === UserRole.SUPPORT_EXECUTIVE).length || 4}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-1 block">Umar, Sumayya, Farman, Haneef</span>
                </div>
                
                <div className="p-4 rounded-2xl bg-md-surface border border-md-surface-variant/70 text-center select-none shadow-xs">
                  <span className="text-[10px] font-mono text-md-outline uppercase font-semibold block mb-1">
                    {isUrdu ? "آج کے کل لاگز" : "Total Logs Today"}
                  </span>
                  <span className="text-2xl font-black text-md-on-surface block leading-none">
                    {todaysWorkLogsCount}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-bold mt-1 block">Live Recorded</span>
                </div>

                <div className="p-4 rounded-2xl bg-md-surface border border-md-surface-variant/70 text-center select-none shadow-xs">
                  <span className="text-[10px] font-mono text-md-outline uppercase font-semibold block mb-1">
                    {isUrdu ? "کلائنٹس کوریج" : "Clients Covered"}
                  </span>
                  <span className="text-2xl font-black text-md-on-surface block leading-none">
                    {new Set(workLogs.map(w => w.clientId || w.clientName)).size || clients.length}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-1 block">Across Roster</span>
                </div>

                <div className="p-4 rounded-2xl bg-md-surface border border-md-surface-variant/70 text-center select-none shadow-xs">
                  <span className="text-[10px] font-mono text-md-outline uppercase font-semibold block mb-1">
                    {isUrdu ? "فالو اپس مکمل" : "Follow-ups Done"}
                  </span>
                  <span className="text-2xl font-black text-md-on-surface block leading-none">
                    {followUps.filter(f => f.status === 'Completed').length}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-1 block">Client Outreaches</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <span className="text-xs font-mono font-black text-md-outline uppercase tracking-wider block">
              {isUrdu ? "میری مجموعی کارکردگی کا خلاصہ" : "My Performance Snapshot"}
            </span>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-md-surface border border-md-surface-variant/70 text-center select-none shadow-xs">
                <span className="text-[10px] font-mono text-md-outline uppercase font-semibold block mb-1">
                  {isUrdu ? "رابطہ شدہ کلائنٹس" : "Clients Covered"}
                </span>
                <span className="text-3xl font-black text-md-on-surface block leading-none">
                  {workLogs.filter(w => (w.executiveName || '').includes(currentUser?.name || '')).length || 4}
                </span>
              </div>
              
              <div className="p-4 rounded-2xl bg-md-surface border border-md-surface-variant/70 text-center select-none shadow-xs">
                <span className="text-[10px] font-mono text-md-outline uppercase font-semibold block mb-1">
                  {isUrdu ? "مکمل فالو اپس" : "Follow-ups Completed"}
                </span>
                <span className="text-3xl font-black text-md-on-surface block leading-none">
                  {followUps.filter(f => f.status === 'Completed').length}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-md-surface border border-md-surface-variant/70 text-center select-none shadow-xs">
                <span className="text-[10px] font-mono text-md-outline uppercase font-semibold block mb-1">
                  {isUrdu ? "درج شدہ ورک لاگز" : "Work Logs Submitted"}
                </span>
                <span className="text-3xl font-black text-md-on-surface block leading-none">
                  {workLogs.filter(w => (w.executiveName || '').includes(currentUser?.name || '')).length || todaysWorkLogsCount}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-md-surface border border-md-surface-variant/70 text-center select-none shadow-xs">
                <span className="text-[10px] font-mono text-md-outline uppercase font-semibold block mb-1">
                  {isUrdu ? "کلائنٹس تفویض" : "Assigned Clients"}
                </span>
                <span className="text-3xl font-black text-md-on-surface block leading-none">
                  {clients.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 7. CONNECTION STATUS */}
      <div id="dashboard-connection-status" className="space-y-3">
        <span className="text-xs font-mono font-black text-md-outline uppercase tracking-wider block">
          {isUrdu ? "سسٹم ڈائیگنوسٹک اور کنکشن ہب" : "Systems Diagnostic & Connection Hub"}
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
              {isUrdu ? "اہم انتباہات اور اعلانات" : "Targeted Alerts & Notifications"}
            </h3>
          </div>
          <span className="text-[9px] font-mono font-bold tracking-wider text-md-outline uppercase">
            {isUrdu ? "لائیو فیڈ" : "Live Stream"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          {/* Notification Item 1: Assigned Work */}
          <div className="p-3 rounded-xl bg-md-surface-container border border-md-surface-variant flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 mt-0.5 shrink-0">
              <Users size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono font-extrabold text-blue-600 uppercase tracking-wider block">
                {isUrdu ? "تفویض کردہ کام" : "Assigned Work"}
              </span>
              <p className="text-xs font-semibold text-md-on-surface mt-0.5">
                {isUrdu ? "روسٹر میں نیا کلائنٹ شامل" : "Roster Relaunch Warning"}
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

          {/* Notification Item 2: Upcoming Follow-up */}
          <div className="p-3 rounded-xl bg-md-surface-container border border-md-surface-variant flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-md-primary/10 text-md-primary mt-0.5 shrink-0">
              <CalendarClock size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono font-extrabold text-md-primary uppercase tracking-wider block">
                {isUrdu ? "آنے والا فالو اپ" : "Upcoming Follow-up"}
              </span>
              <p className="text-xs font-semibold text-md-on-surface mt-0.5">
                {isUrdu ? "کلائنٹ پرنٹ ٹیسٹ توثیق" : "Client Print Verification"}
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

          {/* Notification Item 3: Training Reminder */}
          <div className="p-3 rounded-xl bg-md-surface-container border border-md-surface-variant flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 mt-0.5 shrink-0">
              <GraduationCap size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono font-extrabold text-teal-600 uppercase tracking-wider block">
                {isUrdu ? "ٹریننگ یاد دہانی" : "Training Reminder"}
              </span>
              <p className="text-xs font-semibold text-md-on-surface mt-0.5">
                {isUrdu ? "SaaS انٹرپرائز ٹریننگ" : "SaaS Enterprise Training"}
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

          {/* Notification Item 4: System Notice */}
          <div className="p-3 rounded-xl bg-md-surface-container border border-md-surface-variant flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 mt-0.5 shrink-0">
              <Info size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono font-extrabold text-amber-600 uppercase tracking-wider block">
                {isUrdu ? "سسٹم نوٹس" : "System Notice"}
              </span>
              <p className="text-xs font-semibold text-md-on-surface mt-0.5">
                {isUrdu ? "انفراسٹرکچر شیڈول مینٹیننس" : "Scheduled Infrastructure Maintenance"}
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

      {/* Bottom Summary Bar (Requirement #6: "summary bottom select kare to date poochna today ya date calander open Honda select kar k summary nikale sakna yaha SE bhi") */}
      <MaterialCard variant="elevated" className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
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
          onClick={() => setTeamSummaryModalOpen(true)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-blue-950 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
        >
          <Calendar size={14} className="text-blue-700" />
          <span>{isUrdu ? 'سمری نکالیں (Today / Calendar)' : 'Extract Summary (Today / Calendar)'}</span>
        </button>
      </MaterialCard>

      {/* Mapped Sheets Identifier footer */}
      <div className="py-2.5 px-4 rounded-xl border border-md-surface-variant/60 bg-md-surface-container-low text-[10px] font-mono text-md-outline flex flex-col sm:flex-row sm:items-center justify-between gap-1 select-none">
        <span>{isUrdu ? "مربوط شیٹ آئی ڈی: Support_Clients_v1.0 (گوگل شیٹس ماسٹر نوڈ)" : "Mapped Sheets ID: Support_Clients_v1.0 (Google Sheets Master Proxy Node)"}</span>
        <span>{isUrdu ? "آپریشنل سنک صورتحال: ہم آہنگ (تمام ریکارڈز فعال ہیں)" : "Operational Sync Status: Synchronized (All records active in RAM cache)"}</span>
      </div>

      {/* Daily Team Summary Modal (Requirement #6) */}
      <DailyTeamSummaryModal
        isOpen={isTeamSummaryModalOpen}
        onClose={() => setTeamSummaryModalOpen(false)}
      />
    </div>
  );
};
