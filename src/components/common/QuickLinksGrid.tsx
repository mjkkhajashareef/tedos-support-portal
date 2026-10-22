/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ModuleId, UserRole } from '../../types';
import { ALL_CONFIGURABLE_MODULES, canAccessModule } from '../../utils/rbac';
import {
  LayoutDashboard,
  Ticket,
  Users,
  ClipboardPen,
  CalendarClock,
  GraduationCap,
  MessageSquareCode,
  BarChart3,
  Bell,
  Sparkles,
  Settings,
  Briefcase,
  Rocket,
  ShieldAlert,
  BookOpen,
  Search,
  ExternalLink,
  ShieldCheck,
  Building2,
  ArrowUpRight,
  SlidersHorizontal,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { motion } from 'motion/react';

const MODULE_ICON_MAP: Record<ModuleId, React.ComponentType<{ size?: number; className?: string }>> = {
  [ModuleId.DASHBOARD]: LayoutDashboard,
  [ModuleId.SUPPORT_EXECUTIVE_DASHBOARD]: Briefcase,
  [ModuleId.DAILY_WORK_LOG]: ClipboardPen,
  [ModuleId.OVER_SERVICE]: Rocket,
  [ModuleId.TICKETS]: Ticket,
  [ModuleId.FOLLOW_UP]: CalendarClock,
  [ModuleId.CLIENTS]: Users,
  [ModuleId.CLIENT_ACTIVATION]: Rocket,
  [ModuleId.CLIENT_WORKSPACE]: Building2,
  [ModuleId.POLICIES]: BookOpen,
  [ModuleId.TRAINING]: GraduationCap,
  [ModuleId.WHATSAPP]: MessageSquareCode,
  [ModuleId.REPORTS]: BarChart3,
  [ModuleId.NOTIFICATIONS]: Bell,
  [ModuleId.AI_ASSISTANT]: Sparkles,
  [ModuleId.COO_DASHBOARD]: ShieldAlert,
  [ModuleId.USER_MANAGEMENT]: Users,
  [ModuleId.SETTINGS]: Settings,
  [ModuleId.LOGIN]: LayoutDashboard,
  [ModuleId.MY_CLIENTS]: Users,
  [ModuleId.WORK_LOG_HISTORY]: CalendarClock,
  [ModuleId.EXECUTIVE_INBOX]: Bell,
  [ModuleId.ROLE_MANAGEMENT]: ShieldAlert,
  [ModuleId.PAYROLL]: Briefcase,
  [ModuleId.AI_MESSAGE_STUDIO]: Sparkles,
};

const MODULE_THEME_MAP: Record<ModuleId, { bg: string; text: string; border: string; hover: string; gradient: string }> = {
  [ModuleId.DAILY_WORK_LOG]: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
    hover: 'hover:border-blue-500 hover:shadow-blue-500/10',
    gradient: 'from-blue-600 to-indigo-600'
  },
  [ModuleId.OVER_SERVICE]: {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/30',
    hover: 'hover:border-indigo-500 hover:shadow-indigo-500/10',
    gradient: 'from-indigo-600 to-purple-600'
  },
  [ModuleId.TICKETS]: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    hover: 'hover:border-emerald-500 hover:shadow-emerald-500/10',
    gradient: 'from-emerald-600 to-teal-600'
  },
  [ModuleId.CLIENTS]: {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/30',
    hover: 'hover:border-indigo-500 hover:shadow-indigo-500/10',
    gradient: 'from-indigo-600 to-violet-600'
  },
  [ModuleId.FOLLOW_UP]: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
    hover: 'hover:border-amber-500 hover:shadow-amber-500/10',
    gradient: 'from-amber-600 to-orange-600'
  },
  [ModuleId.SUPPORT_EXECUTIVE_DASHBOARD]: {
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/30',
    hover: 'hover:border-cyan-500 hover:shadow-cyan-500/10',
    gradient: 'from-cyan-600 to-blue-600'
  },
  [ModuleId.POLICIES]: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/30',
    hover: 'hover:border-rose-500 hover:shadow-rose-500/10',
    gradient: 'from-rose-600 to-pink-600'
  },
  [ModuleId.TRAINING]: {
    bg: 'bg-teal-500/10 dark:bg-teal-500/15',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-500/30',
    hover: 'hover:border-teal-500 hover:shadow-teal-500/10',
    gradient: 'from-teal-600 to-emerald-600'
  },
  [ModuleId.WHATSAPP]: {
    bg: 'bg-green-500/10 dark:bg-green-500/15',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-500/30',
    hover: 'hover:border-green-500 hover:shadow-green-500/10',
    gradient: 'from-green-600 to-emerald-600'
  },
  [ModuleId.REPORTS]: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/15',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
    hover: 'hover:border-purple-500 hover:shadow-purple-500/10',
    gradient: 'from-purple-600 to-indigo-600'
  },
  [ModuleId.CLIENT_ACTIVATION]: {
    bg: 'bg-orange-500/10 dark:bg-orange-500/15',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/30',
    hover: 'hover:border-orange-500 hover:shadow-orange-500/10',
    gradient: 'from-orange-600 to-amber-600'
  },
  [ModuleId.CLIENT_WORKSPACE]: {
    bg: 'bg-sky-500/10 dark:bg-sky-500/15',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-500/30',
    hover: 'hover:border-sky-500 hover:shadow-sky-500/10',
    gradient: 'from-sky-600 to-blue-600'
  },
  [ModuleId.AI_ASSISTANT]: {
    bg: 'bg-fuchsia-500/10 dark:bg-fuchsia-500/15',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
    border: 'border-fuchsia-500/30',
    hover: 'hover:border-fuchsia-500 hover:shadow-fuchsia-500/10',
    gradient: 'from-fuchsia-600 to-purple-600'
  },
  [ModuleId.NOTIFICATIONS]: {
    bg: 'bg-yellow-500/10 dark:bg-yellow-500/15',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-500/30',
    hover: 'hover:border-yellow-500 hover:shadow-yellow-500/10',
    gradient: 'from-yellow-600 to-amber-600'
  },
  [ModuleId.COO_DASHBOARD]: {
    bg: 'bg-violet-500/10 dark:bg-violet-500/15',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-500/30',
    hover: 'hover:border-violet-500 hover:shadow-violet-500/10',
    gradient: 'from-violet-600 to-purple-600'
  },
  [ModuleId.USER_MANAGEMENT]: {
    bg: 'bg-slate-500/10 dark:bg-slate-500/15',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-500/30',
    hover: 'hover:border-slate-500 hover:shadow-slate-500/10',
    gradient: 'from-slate-700 to-zinc-800'
  },
  [ModuleId.SETTINGS]: {
    bg: 'bg-neutral-500/10 dark:bg-neutral-500/15',
    text: 'text-neutral-700 dark:text-neutral-300',
    border: 'border-neutral-500/30',
    hover: 'hover:border-neutral-500 hover:shadow-neutral-500/10',
    gradient: 'from-neutral-700 to-stone-800'
  },
  [ModuleId.DASHBOARD]: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
    hover: 'hover:border-blue-500 hover:shadow-blue-500/10',
    gradient: 'from-blue-600 to-indigo-600'
  },
  [ModuleId.LOGIN]: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-500/30',
    hover: 'hover:border-blue-500',
    gradient: 'from-blue-600 to-indigo-600'
  },
  [ModuleId.MY_CLIENTS]: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
    hover: 'hover:border-blue-500 hover:shadow-blue-500/10',
    gradient: 'from-blue-600 to-indigo-600'
  },
  [ModuleId.WORK_LOG_HISTORY]: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    hover: 'hover:border-emerald-500 hover:shadow-emerald-500/10',
    gradient: 'from-emerald-600 to-teal-600'
  },
  [ModuleId.EXECUTIVE_INBOX]: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
    hover: 'hover:border-amber-500 hover:shadow-amber-500/10',
    gradient: 'from-amber-600 to-orange-600'
  },
  [ModuleId.ROLE_MANAGEMENT]: {
    bg: 'bg-red-500/10 dark:bg-red-500/15',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/30',
    hover: 'hover:border-red-500 hover:shadow-red-500/10',
    gradient: 'from-red-600 to-rose-600'
  },
  [ModuleId.PAYROLL]: {
    bg: 'bg-teal-500/10 dark:bg-teal-500/15',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-500/30',
    hover: 'hover:border-teal-500 hover:shadow-teal-500/10',
    gradient: 'from-teal-600 to-emerald-600'
  },
  [ModuleId.AI_MESSAGE_STUDIO]: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/15',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
    hover: 'hover:border-purple-500 hover:shadow-purple-500/10',
    gradient: 'from-purple-600 to-indigo-600'
  }
};

const MODULE_DESCRIPTIONS: Record<ModuleId, { en: string; ur: string }> = {
  [ModuleId.DAILY_WORK_LOG]: {
    en: 'Log client meetings, calls, remote sessions & proof links',
    ur: 'روزانہ کلائنٹ کالز، میٹنگز اور گوگل میٹ پروف لنکس کا اندراج'
  },
  [ModuleId.OVER_SERVICE]: {
    en: 'Manage (a) DLT SMS, (b) Payment Gateway & (c) WhatsApp API integrations',
    ur: 'اوور سروس حب — (a) DLT SMS (b) Payment Gateway (c) WhatsApp API'
  },
  [ModuleId.TICKETS]: {
    en: 'Manage customer support requests, SLA timers & issue resolution',
    ur: 'سپورٹ ٹکٹس، مسائل کا حل اور ایس ایل اے نگرانی'
  },
  [ModuleId.CLIENTS]: {
    en: 'Complete directory of active, warning & new client accounts',
    ur: 'تمام فعال، وارننگ اور نئے کلائنٹس کا تفصیلی ریکارڈ'
  },
  [ModuleId.FOLLOW_UP]: {
    en: 'Scheduled outreach, call logs, next action reminders',
    ur: 'شیڈول شدہ فالو اپس، کال لاگز اور اگلی کارروائی'
  },
  [ModuleId.SUPPORT_EXECUTIVE_DASHBOARD]: {
    en: 'Dedicated executive workstation, workload & pending proof alerts',
    ur: 'ایگزیکٹو ورک اسپیس، روزانہ کا کام اور پینڈنگ پروف الرٹس'
  },
  [ModuleId.POLICIES]: {
    en: 'Official 28-Rule company support protocol & client directives',
    ur: '28 قوانین پر مشتمل کمپنی کی سپورٹ پالیسیز اور قواعد'
  },
  [ModuleId.TRAINING]: {
    en: 'Client onboarding checklists, staff certification & video guides',
    ur: 'کلائنٹ آن بورڈنگ چیک لسٹس، سافٹ ویئر گائیڈز اور ٹریننگ'
  },
  [ModuleId.WHATSAPP]: {
    en: 'Direct WhatsApp communication, broadcast alerts & templates',
    ur: 'براہ راست واٹس ایپ پیغامات اور خودکار ریمائنڈرز'
  },
  [ModuleId.REPORTS]: {
    en: 'SLA resolution metrics, CSAT scores & performance analytics',
    ur: 'کارکردگی کی رپورٹس، ایس ایل اے اور تجزیاتی گراف'
  },
  [ModuleId.CLIENT_ACTIVATION]: {
    en: 'Step-by-step wizard to provision new customer accounts',
    ur: 'نئے کلائنٹ کا لائسنس، پروڈکٹ اور سیٹ اپ فعال کریں'
  },
  [ModuleId.CLIENT_WORKSPACE]: {
    en: '360° client profile, financial records, MOU & health status',
    ur: 'کلائنٹ کا مکمل 360 پروفائل، ادائیگیاں اور ہیلتھ اسکور'
  },
  [ModuleId.AI_ASSISTANT]: {
    en: 'Intelligent AI copilot for instant troubleshooting & log summaries',
    ur: 'ذہین اے آئی معاون برائے فوری مدد اور لاگ سمریز'
  },
  [ModuleId.NOTIFICATIONS]: {
    en: 'Real-time telemetry alerts, Sheets sync logs & system notices',
    ur: 'سسٹم کے اہم انتباہات اور لائیو اپ ڈیٹس'
  },
  [ModuleId.COO_DASHBOARD]: {
    en: 'Operations auditing, executive productivity & compliance telemetry',
    ur: 'آپریشنز کا آڈٹ، ملازمین کی کارکردگی اور سینئر نگرانی'
  },
  [ModuleId.USER_MANAGEMENT]: {
    en: 'Configure user credentials, roles, passwords & access rules',
    ur: 'صارفین کے اکاؤنٹس، پاس ورڈ اور رسائی کے اصول'
  },
  [ModuleId.SETTINGS]: {
    en: 'Role Management (Module checkboxes), Google Sheets ID & safe test URL',
    ur: 'رول مینیجمنٹ (ماڈیول چیک باکسز)، شیٹس کنفیگ اور ٹیسٹ لنک'
  },
  [ModuleId.DASHBOARD]: {
    en: 'Master overview of operations, follow-ups & workload',
    ur: 'سپورٹ آپریشنز کا جامع جائزہ اور مجموعی خلاصہ'
  },
  [ModuleId.MY_CLIENTS]: {
    en: 'Dedicated assigned clients roster, contacts & live software portal URLs',
    ur: 'میرے تفویض کردہ کلائنٹس، رابطے اور لائیو سافٹ ویئر پورٹلز'
  },
  [ModuleId.WORK_LOG_HISTORY]: {
    en: 'Central command center, audit logs, deduplicated search & sheet sync',
    ur: 'ورک لاگ ہسٹری، کمانڈ سینٹر اور مکمل شیٹ ریکارڈ'
  },
  [ModuleId.EXECUTIVE_INBOX]: {
    en: 'Manager & Leadership special notes, directives and interactive replies',
    ur: 'مینیجر و لیڈرشپ کے خصوصی نوٹس اور دو طرفہ جوابی نظام'
  },
  [ModuleId.ROLE_MANAGEMENT]: {
    en: 'Fine-grained module access control checkboxes for every system role',
    ur: 'ہر کردار کے لیے ماڈیول پرمیشنز اور چیک باکس رول مینیجمنٹ'
  },
  [ModuleId.PAYROLL]: {
    en: 'Staff compensation, incentive calculations and attendance registry',
    ur: 'ملازمین کی تنخواہ، مراعات اور حاضری کا نظام'
  },
  [ModuleId.LOGIN]: {
    en: 'Authentication gateway',
    ur: 'لاگ ان گیٹ وے'
  },
  [ModuleId.AI_MESSAGE_STUDIO]: {
    en: 'TaleemPro (Urdu) & Edsof (English) branded WhatsApp messages and Google Reviews',
    ur: 'تعلیم پرو (اردو) اور ایڈسوف (انگلش) پیغامات، گوگل ریویوز اور لیٹر ہیڈ اسٹوڈیو'
  }
};

interface QuickLinksGridProps {
  id?: string;
  showAdminShortcuts?: boolean;
}

export const QuickLinksGrid: React.FC<QuickLinksGridProps> = ({ id, showAdminShortcuts = true }) => {
  const { 
    currentUser, 
    setCurrentModule, 
    language,
    openShareTestModal 
  } = useApp();
  const isUrdu = language === 'ur';

  // Listen to permissions change so quick links update immediately when saved in settings
  const [permRevision, setPermRevision] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    const handlePermUpdate = () => {
      setPermRevision(r => r + 1);
    };
    window.addEventListener('tedos_permissions_updated', handlePermUpdate);
    return () => window.removeEventListener('tedos_permissions_updated', handlePermUpdate);
  }, []);

  // Filter modules based on logged-in user's role authority
  const authorizedModules = ALL_CONFIGURABLE_MODULES.filter(mod => {
    // Hide Login from quick links
    if (mod.id === ModuleId.LOGIN) return false;
    return canAccessModule(currentUser?.role, mod.id);
  });

  // Categories list derived from authorized modules
  const categories = ['ALL', ...Array.from(new Set(authorizedModules.map(m => m.category)))];

  // Apply search and category filter
  const displayedModules = authorizedModules.filter(mod => {
    const q = searchFilter.toLowerCase().trim();
    const desc = MODULE_DESCRIPTIONS[mod.id];
    const matchesSearch = 
      !q || 
      mod.labelEn.toLowerCase().includes(q) || 
      mod.labelUr.includes(q) ||
      mod.id.toLowerCase().includes(q) ||
      (desc && (desc.en.toLowerCase().includes(q) || desc.ur.includes(q)));

    const matchesCategory = categoryFilter === 'ALL' || mod.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const isDirectorOrCoo = currentUser?.role === UserRole.DIRECTOR || currentUser?.role === UserRole.COO || currentUser?.role === UserRole.AI_ADMINISTRATOR;

  return (
    <div id={id || 'main-page-quick-links'} className="space-y-4">
      {/* Header bar with Role Authority Badge & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-600 text-white">
              <SlidersHorizontal size={16} />
            </span>
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">
              {isUrdu ? 'اہم فوری لنکس و ماڈیولز (Quick Links)' : 'Dynamic Quick Links & Authorizations'}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <ShieldCheck size={12} />
              <span>
                {isUrdu
                  ? `${authorizedModules.length} ماڈیولز کی اتھارٹی حاصل ہے`
                  : `${authorizedModules.length} Authorized Modules`}
              </span>
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {isUrdu ? 'آپ کے تفویض کردہ اختیارات اور شارٹ کٹس' : 'Your Permitted Applications & Shortcuts'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isUrdu
              ? `سافٹ ویئر کے رول مینیجمنٹ میں آپ کے کردار (${currentUser?.role || 'User'}) کے تحت جو اختیارات منتخب ہیں، وہ یہاں براہ راست دستیاب ہیں۔`
              : `Modules granted to your assigned role (${currentUser?.role || 'User'}) in Rule Management are dynamically accessible below.`}
          </p>
        </div>

        {/* Action Buttons: Rule Settings for Admins */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
          {/* Jump to Settings -> Rule Management for Admins */}
          {showAdminShortcuts && (
            <button
              type="button"
              id="quick-links-manage-rules-btn"
              onClick={() => setCurrentModule(ModuleId.SETTINGS)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs transition cursor-pointer"
              title={isUrdu ? 'رول مینیجمنٹ سیٹنگز میں جائیں' : 'Configure Rule Management Checkboxes in Settings'}
            >
              <Settings size={14} />
              <span>{isUrdu ? 'رول سیٹنگز' : 'Rule Settings'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Quick Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {categories.map((cat) => {
            const isSelected = categoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {cat === 'ALL' ? (isUrdu ? 'تمام اختیارات' : 'All Permitted') : cat}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search size={14} className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={isUrdu ? 'فوری لنک تلاش کریں...' : 'Filter quick links...'}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Quick Links Grid Display */}
      {displayedModules.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
          <ShieldAlert size={32} className="mx-auto text-amber-500 opacity-60" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {isUrdu ? 'کوئی مماثل کوئیک لنک نہیں ملا' : 'No matching authorized modules found'}
          </p>
          <p className="text-[11px]">
            {isUrdu 
              ? 'تلاش کی شرائط بدلیں یا سیٹنگز میں جا کر مزید ماڈیولز کے چیک باکسز کو آن کریں۔' 
              : 'Adjust search or enable module checkboxes in Settings > Rule Management.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {displayedModules.map((mod) => {
            const Icon = MODULE_ICON_MAP[mod.id] || LayoutDashboard;
            const theme = MODULE_THEME_MAP[mod.id] || MODULE_THEME_MAP[ModuleId.DASHBOARD];
            const desc = MODULE_DESCRIPTIONS[mod.id];

            return (
              <motion.div
                key={mod.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
                onClick={() => setCurrentModule(mod.id)}
                className={`group relative p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${theme.hover} transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between overflow-hidden select-none`}
              >
                {/* Top Banner with Icon & Category */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.text} transition-transform group-hover:scale-110 shadow-xs shrink-0`}>
                      <Icon size={20} />
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                        {mod.category}
                      </span>
                      <span className="p-1 rounded-md text-slate-400 group-hover:text-blue-600 transition-colors">
                        <ArrowUpRight size={14} className="rtl:rotate-270" />
                      </span>
                    </div>
                  </div>

                  {/* Titles */}
                  <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors leading-tight">
                    {isUrdu ? mod.labelUr : mod.labelEn}
                  </h3>
                  
                  {isUrdu && (
                    <span className="text-[11px] font-medium text-slate-400 block mt-0.5 truncate">
                      {mod.labelEn}
                    </span>
                  )}

                  {/* Description */}
                  {desc && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {isUrdu ? desc.ur : desc.en}
                    </p>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-[10px] text-slate-400">
                    ID: {mod.id}
                  </span>
                  <span className={`font-bold ${theme.text} group-hover:underline flex items-center gap-1`}>
                    <span>{isUrdu ? 'کھولیں' : 'Open'}</span>
                    <span>➔</span>
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
