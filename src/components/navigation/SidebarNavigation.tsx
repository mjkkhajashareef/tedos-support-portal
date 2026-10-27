/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  MessageSquare,
  Sparkles,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Rocket,
  ShieldAlert,
  BookOpen,
  Compass,
  Wand2,
  Receipt
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ModuleId } from '../../types';
import { canAccessModule } from '../../utils/rbac';
import { TRANSLATIONS } from '../../i18n/translations';
import { BrandLogo } from '../common/BrandLogo';

interface SidebarNavigationProps {
  id?: string;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ id }) => {
  const {
    currentModule,
    setCurrentModule,
    isSidebarOpen,
    setSidebarOpen,
    isBlankWorkspace,
    currentUser,
    logoutUser,
    setLoginWhatsAppModalOpen,
    setWhatsAppModalOpen,
    openDemoForModule,
    unreadMessagesCount,
    language
  } = useApp();

  const [permRevision, setPermRevision] = useState(0);

  useEffect(() => {
    const handlePermUpdate = () => {
      setPermRevision(r => r + 1);
    };
    window.addEventListener('tedos_permissions_updated', handlePermUpdate);
    return () => window.removeEventListener('tedos_permissions_updated', handlePermUpdate);
  }, []);

  const t = TRANSLATIONS[language];

  const menuItems = [
    { id: ModuleId.DASHBOARD, label: t.dashboard, icon: LayoutDashboard },
    { id: ModuleId.COO_DASHBOARD, label: t.cooOperations, icon: ShieldAlert },
    { id: ModuleId.SUPPORT_EXECUTIVE_DASHBOARD, label: t.executiveWorkspace, icon: Briefcase },
    { id: ModuleId.DAILY_WORK_LOG, label: t.dailyWorkLog, icon: ClipboardPen },
    {
      id: ModuleId.WORK_LOG_HISTORY,
      label: language === 'ur' ? 'ورک لاگ ہسٹری و کمانڈ' : 'Work Log History',
      icon: CalendarClock
    },
    { id: ModuleId.TICKETS, label: t.ticketCenter, icon: Ticket },
    {
      id: ModuleId.MY_CLIENTS,
      label: language === 'ur' ? 'میرے تفویض کردہ کلائنٹس' : 'My Assigned Clients',
      icon: Users
    },
    { id: ModuleId.CLIENTS, label: t.clients, icon: Users },
    { id: ModuleId.CLIENT_ACTIVATION, label: t.activateClient, icon: Rocket },
    {
      id: ModuleId.OVER_SERVICE,
      label: language === 'ur' ? 'اوور سروس (DLT • Payment • WhatsApp)' : 'Over Service (DLT • Payment • WhatsApp)',
      icon: Rocket
    },
    { id: ModuleId.FOLLOW_UP, label: t.followUps, icon: CalendarClock },
    { id: ModuleId.POLICIES, label: t.policiesNotice, icon: BookOpen },
    { id: ModuleId.TRAINING, label: t.trainingResources, icon: GraduationCap },
    { id: ModuleId.WHATSAPP, label: t.whatsappAutomation, icon: MessageSquareCode },
    {
      id: ModuleId.PAYROLL,
      label: language === 'ur' ? 'پے رول و حاضری پورٹل' : 'Payroll & Attendance',
      icon: Briefcase
    },
    { id: ModuleId.REPORTS, label: t.reportsAnalytics, icon: BarChart3 },
    {
      id: ModuleId.NOTIFICATIONS,
      label: language === 'ur' ? 'پیغامات و مواصلات (Communication)' : 'Communication & Messages',
      icon: MessageSquare
    },
    { id: ModuleId.USER_MANAGEMENT, label: t.userManagement, icon: Users },
    {
      id: ModuleId.CLIENT_USAGE_BILLING,
      label: language === 'ur' ? 'کلائنٹ تفصیلات، بلنگ و استعمال' : 'Client Details & Usage (Billing)',
      icon: Receipt
    },
    {
      id: ModuleId.ROLE_MANAGEMENT,
      label: language === 'ur' ? 'رول و پرمیشن مینیجمنٹ' : 'Rule Management',
      icon: ShieldAlert
    },
    { id: ModuleId.SETTINGS, label: t.systemSettings, icon: Settings },
    { id: ModuleId.AI_ASSISTANT, label: t.aiAssistant, icon: Sparkles },
    {
      id: ModuleId.AI_MESSAGE_STUDIO,
      label: language === 'ur' ? 'اے آئی پالش و ریڈی میڈ میسج' : 'AI Polish & Messages',
      icon: Wand2
    },
  ].filter(item => canAccessModule(currentUser?.role, item.id));

  return (
    <div
      id={id}
      className={`hidden md:flex flex-col h-screen bg-md-surface-container-low border-e border-md-surface-variant transition-all duration-300 relative z-20 ${
        isSidebarOpen ? 'w-72' : 'w-20'
      }`}
    >
      {/* Brand Header with Vector Dots */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-md-surface-variant">
        {isSidebarOpen ? (
          <div className="overflow-hidden">
            <BrandLogo size="sm" showTagline={false} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1 mx-auto p-1">
            <span className="w-2 h-2 rounded-full bg-[#0074c8]" />
            <span className="w-2 h-2 rounded-full bg-[#00a859]" />
            <span className="w-2 h-2 rounded-full bg-[#00a859]" />
            <span className="w-2 h-2 rounded-full bg-[#0074c8]" />
          </div>
        )}

        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-1.5 rounded-full hover:bg-md-surface-variant text-md-on-surface-variant cursor-pointer"
          title={isSidebarOpen ? 'Collapse' : 'Expand'}
        >
          {isSidebarOpen ? (
            language === 'ur' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />
          ) : (
            language === 'ur' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />
          )}
        </button>
      </div>

      {/* Navigation list */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {menuItems.map((item) => {
          const isSelected =
            !isBlankWorkspace &&
            (currentModule === item.id || (item.id === ModuleId.CLIENTS && currentModule === ModuleId.CLIENT_WORKSPACE));
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`sidebar-item-${item.id}`}
              onClick={() => {
                setCurrentModule(item.id);
              }}
              className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-2xl transition-all ltr:text-left rtl:text-right group cursor-pointer ${
                isSelected
                  ? 'bg-md-primary text-md-on-primary font-bold shadow-sm'
                  : 'text-md-on-surface-variant hover:bg-md-surface-variant/50'
              }`}
            >
              <Icon
                size={18}
                className={`shrink-0 transition-transform group-hover:scale-105 ${
                  isSelected ? 'text-md-on-primary' : 'text-md-on-surface-variant/80'
                }`}
              />
              {isSidebarOpen && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="text-xs font-semibold tracking-wide truncate">{item.label}</span>
                  {item.id === ModuleId.NOTIFICATIONS && unreadMessagesCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold shrink-0">
                      {unreadMessagesCount}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Interactive Demo & Software Guide Launcher Button */}
      <div className="p-2 border-t border-md-surface-variant">
        <button
          id="sidebar-demo-guide-btn"
          onClick={() => openDemoForModule(currentModule)}
          className={`w-full flex items-center gap-2.5 p-2.5 rounded-2xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 hover:from-blue-600/20 hover:to-indigo-600/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800/60 font-bold transition-all cursor-pointer ${
            isSidebarOpen ? 'justify-start' : 'justify-center'
          }`}
          title={language === 'ur' ? 'سافٹ ویئر ڈیمو و گائیڈ' : 'Software Tour & Demo'}
        >
          <Compass size={18} className="text-blue-600 dark:text-blue-400 shrink-0 animate-spin-slow" />
          {isSidebarOpen && (
            <div className="flex flex-col text-left rtl:text-right truncate">
              <span className="text-xs font-bold truncate">
                {language === 'ur' ? 'سافٹ ویئر ڈیمو و گائیڈ' : 'Demo & Guide'}
              </span>
              <span className="text-[9px] text-md-outline truncate">
                {language === 'ur' ? 'کیسے استعمال کریں؟' : 'How to use?'}
              </span>
            </div>
          )}
        </button>
      </div>

      {/* User Footer Account Details */}
      {currentUser && (
        <div className="p-3 border-t border-md-surface-variant bg-md-surface-container/60">
          <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {isSidebarOpen && (
              <div className="min-w-0 flex flex-col">
                <span className="text-xs font-bold text-md-on-surface truncate">{currentUser.name}</span>
                <span className="text-[10px] font-mono text-md-outline uppercase truncate">{currentUser.role}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <button
                id="sidebar-whatsapp-login"
                onClick={() => setLoginWhatsAppModalOpen(true)}
                className="p-1.5 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-600 text-md-on-surface-variant transition-colors cursor-pointer"
                title={language === 'ur' ? 'واٹس ایپ گروپ لاگ ان حاضری' : 'Post WhatsApp Group Login Attendance'}
              >
                <MessageSquare size={16} />
              </button>
              <button
                id="sidebar-logout"
                onClick={logoutUser}
                className="p-1.5 rounded-xl hover:bg-rose-500/10 hover:text-rose-600 text-md-on-surface-variant transition-colors cursor-pointer"
                title={t.logout}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
