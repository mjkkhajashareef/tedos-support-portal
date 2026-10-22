/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Bell,
  LogOut,
  Moon,
  Palette,
  Sun,
  MessageSquare,
  ExternalLink,
  CalendarCheck,
  Compass,
  MapPin,
  Database,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Clock,
  Globe
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole, ModuleId, WorkLogEntry } from '../../types';
import { LanguageToggle } from '../common/LanguageToggle';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { TRANSLATIONS } from '../../i18n/translations';
import { PendingProofLinksModal } from '../common/PendingProofLinksModal';
import { isValidProofLink } from '../../utils/helpers';

interface HeaderProps {
  id?: string;
}

export const Header: React.FC<HeaderProps> = ({ id }) => {
  const {
    currentModule,
    setCurrentModule,
    currentUser,
    selectedRole,
    loginAs,
    logoutUser,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    activeTheme,
    setActiveTheme,
    setWhatsAppModalOpen,
    setLoginWhatsAppModalOpen,
    openDemoForModule,
    openGoogleReviewModal,
    openBackupModal,
    language,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    refreshCurrentView,
    isRefreshing,
    isPendingProofModalOpen,
    setPendingProofModalOpen,
    openPendingProofModal,
    unreadMessagesCount,
    workLogs,
    tickets
  } = useApp();

  const t = TRANSLATIONS[language];
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  // Compute pending proof logs count
  const allLogsFromTickets = tickets.flatMap((t) => t.workLogs || []);
  const combinedLogsMap = new Map<string, WorkLogEntry>();
  [...workLogs, ...allLogsFromTickets].forEach((log) => {
    if (log && log.id && !combinedLogsMap.has(log.id)) {
      combinedLogsMap.set(log.id, log);
    }
  });
  const pendingProofLogsCount = Array.from(combinedLogsMap.values()).filter((log) => {
    if (log.isProofPending === true) return true;
    if (log.proofLink === 'PENDING') return true;
    const hasValidProof = log.proofLink && isValidProofLink(log.proofLink);
    return (log.durationMinutes || 0) > 5 && !hasValidProof;
  }).length;

  const unreadNotifications = notifications.filter((n) => !n.read);

  const cycleTheme = () => {
    if (activeTheme === 'light') setActiveTheme('dark');
    else if (activeTheme === 'dark') setActiveTheme('sapphire');
    else setActiveTheme('light');
  };

  const getThemeIcon = () => {
    switch (activeTheme) {
      case 'dark':
        return <Moon size={17} className="text-amber-400" />;
      case 'sapphire':
        return <Palette size={17} className="text-blue-500" />;
      case 'light':
      default:
        return <Sun size={17} className="text-amber-600" />;
    }
  };

  const getModuleTitle = () => {
    switch (currentModule) {
      case ModuleId.DASHBOARD:
        return t.dashboard;
      case ModuleId.COO_DASHBOARD:
        return t.cooOperations;
      case ModuleId.POLICIES:
        return t.policiesNotice;
      case ModuleId.SUPPORT_EXECUTIVE_DASHBOARD:
        return t.executiveWorkspace;
      case ModuleId.CLIENTS:
        return t.clients;
      case ModuleId.DAILY_WORK_LOG:
        return t.dailyWorkLog;
      case ModuleId.OVER_SERVICE:
        return language === 'ur' ? 'اوور سروس (DLT • Payment • WhatsApp)' : 'Over Service (DLT • Payment • WhatsApp)';
      case ModuleId.FOLLOW_UP:
        return t.followUps;
      case ModuleId.TRAINING:
        return t.trainingResources;
      case ModuleId.WHATSAPP:
        return t.whatsappAutomation;
      case ModuleId.REPORTS:
        return t.reportsAnalytics;
      case ModuleId.NOTIFICATIONS:
        return t.notifications;
      case ModuleId.AI_ASSISTANT:
        return t.aiAssistant;
      case ModuleId.USER_MANAGEMENT:
        return t.userManagement;
      case ModuleId.SETTINGS:
        return t.systemSettings;
      case ModuleId.LOGIN:
      default:
        return 'Techno Evident Support';
    }
  };

  return (
    <header
      id={id}
      className="h-16 border-b border-md-surface-variant bg-md-surface-container-lowest px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30"
    >
      {/* Module Title / Breadcrumb with Universal Back, Next, and Refresh Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Universal History Navigation (Back, Next, Refresh) */}
        <div className="flex items-center bg-md-surface-variant/40 dark:bg-zinc-800/80 rounded-xl p-0.5 border border-md-surface-variant shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={goBack}
            disabled={!canGoBack}
            className="p-1 sm:p-1.5 rounded-lg text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-surface-variant/60 transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            title={language === 'ur' ? 'پچھلا صفحہ (Back)' : 'Previous Page (Back)'}
            aria-label="Go Back"
          >
            <ChevronLeft size={16} className="rtl:rotate-180" />
          </button>

          <button
            type="button"
            onClick={goForward}
            disabled={!canGoForward}
            className="p-1 sm:p-1.5 rounded-lg text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-surface-variant/60 transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            title={language === 'ur' ? 'اگلا صفحہ (Next)' : 'Next Page (Forward)'}
            aria-label="Go Forward"
          >
            <ChevronRight size={16} className="rtl:rotate-180" />
          </button>

          <div className="w-[1px] h-3.5 bg-md-surface-variant/80 mx-0.5" />

          <button
            type="button"
            onClick={refreshCurrentView}
            className="p-1 sm:p-1.5 rounded-lg text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-surface-variant/60 transition cursor-pointer"
            title={language === 'ur' ? 'ڈیٹا ریفریش کریں (Refresh)' : 'Refresh view & synchronization'}
            aria-label="Refresh Data"
          >
            <RotateCw size={15} className={isRefreshing ? 'animate-spin text-md-primary' : ''} />
          </button>
        </div>

        {currentUser && (
          <div className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-md-primary-container text-md-on-primary-container font-bold text-xs select-none">
            {currentUser.name.charAt(0)}
          </div>
        )}
        <div className="flex flex-col">
          <h1 className="text-sm sm:text-base font-bold tracking-tight text-md-on-background line-clamp-1">
            {getModuleTitle()}
          </h1>
          {currentUser && (
            <div className="flex items-center gap-1.5 md:hidden">
              <span className="text-[10px] font-medium text-md-outline uppercase font-mono">
                {currentUser.role}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Pending Proof Links Alert Quick-Button */}
        {pendingProofLogsCount > 0 && (
          <button
            id="header-pending-proof-btn"
            onClick={openPendingProofModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer select-none animate-pulse"
            title={
              language === 'ur'
                ? `${pendingProofLogsCount} پینڈنگ گوگل میٹ پروف لنکس`
                : `${pendingProofLogsCount} Pending Google Meet proof links`
            }
          >
            <Clock size={13} className="animate-spin-slow shrink-0" />
            <span className="hidden sm:inline">
              {language === 'ur' ? `پروف پینڈنگ (${pendingProofLogsCount})` : `Proof Pending (${pendingProofLogsCount})`}
            </span>
            <span className="sm:hidden text-[11px] font-mono">
              ⏱️ {pendingProofLogsCount}
            </span>
          </button>
        )}
        {/* PWA Mobile & Desktop Install Button */}
        <PWAInstallButton />

        {/* Global Language Toggle (Urdu / English) */}
        <LanguageToggle />

        {/* Sync to Sheet Button for Support Manager, COO, and Leadership */}
        {(currentUser?.role === UserRole.SUPPORT_MANAGER ||
          currentUser?.role === UserRole.OPERATION_MANAGER ||
          currentUser?.role === UserRole.COO ||
          currentUser?.role === UserRole.DIRECTOR) && (
          <button
            onClick={refreshCurrentView}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow-xs cursor-pointer select-none disabled:opacity-50"
            title={language === 'ur' ? 'گوگل شیٹ کے ساتھ لائیو سنک کریں' : 'Sync Live with Google Sheets'}
          >
            <RotateCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">⚡ {language === 'ur' ? 'شیٹ سنک' : 'Sync to Sheet'}</span>
            <span className="sm:hidden text-[11px]">⚡ سنک</span>
          </button>
        )}



        {/* Google Maps Review & Feedback Sync Modal Launcher */}
        <button
          id="header-google-review-btn"
          onClick={() => openGoogleReviewModal()}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 text-xs font-bold transition-all shadow-xs cursor-pointer select-none"
          title={language === 'ur' ? 'کلائنٹ سے 5 اسٹار گوگل میپس ریویو حاصل کریں' : 'Collect 5-Star Google Maps Review'}
        >
          <MapPin size={14} className="text-amber-600 dark:text-amber-400" />
          <span className="hidden lg:inline">{language === 'ur' ? 'گوگل ریویو' : 'Google Review'}</span>
          <span className="lg:hidden text-[11px]">⭐ {language === 'ur' ? 'ریویو' : 'Review'}</span>
        </button>

        {/* Data Export & Backup Center */}
        <button
          id="header-backup-export-btn"
          onClick={() => openBackupModal(currentModule)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-400/40 text-xs font-bold transition-all shadow-xs cursor-pointer select-none"
          title={language === 'ur' ? 'ڈیٹا بیک اپ، رپورٹس اور CSV ایکسپورٹ' : 'Data Export, Reports & System Backup'}
        >
          <Database size={14} className="text-indigo-600 dark:text-indigo-400" />
          <span className="hidden xl:inline">{language === 'ur' ? 'ڈیٹا و رپورٹس' : 'Export & Reports'}</span>
          <span className="xl:hidden text-[11px]">{language === 'ur' ? 'رپورٹس' : 'Export'}</span>
        </button>

        {/* Direct Link to technoevident.xyz Payroll Attendance Portal */}
        <a
          id="header-payroll-portal-btn"
          href="https://technoevident.xyz/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 text-xs font-bold transition-all cursor-pointer select-none"
          title="Open Techno Evident Payroll Portal to mark daily attendance"
        >
          <CalendarCheck size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="hidden sm:inline">{t.payrollPortal}</span>
          <span className="sm:hidden text-[11px]">Payroll ↗</span>
        </a>

        {currentUser && (
          <>
            {/* Quick Action: WhatsApp Login Attendance Status */}
            <button
              id="header-whatsapp-login-btn"
              onClick={() => setLoginWhatsAppModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-600/10 hover:bg-teal-600/20 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700/60 text-xs font-bold transition-all cursor-pointer select-none"
              title={language === 'ur' ? 'واٹس ایپ گروپ لاگ ان حاضری' : 'Post Login Status to WhatsApp Group'}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{language === 'ur' ? 'حاضری' : 'Attendance'}</span>
            </button>

            {/* Quick Action: WhatsApp Daily Summary Modal */}
            <button
              id="header-whatsapp-summary-btn"
              onClick={() => setWhatsAppModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 text-xs font-bold transition-all cursor-pointer select-none"
              title={language === 'ur' ? 'روزانہ واٹس ایپ سپورٹ خلاصہ' : 'Open WhatsApp Daily Support Summary'}
            >
              <MessageSquare size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'ur' ? 'خلاصہ' : 'Summary'}</span>
            </button>

            {/* Dynamic Theme Selector */}
            <button
              id="header-theme-toggle-btn"
              onClick={cycleTheme}
              className="p-2 rounded-full hover:bg-md-surface-variant text-md-on-surface-variant transition-colors cursor-pointer"
              title={`Active Theme: ${activeTheme}. Click to toggle.`}
            >
              {getThemeIcon()}
            </button>

            {/* Team Internal Messages Direct Button */}
            <button
              id="header-team-messages-btn"
              onClick={() => setCurrentModule(ModuleId.NOTIFICATIONS)}
              className="p-2 rounded-full hover:bg-md-surface-variant text-md-on-surface-variant relative cursor-pointer"
              title={language === 'ur' ? 'انٹرنل ٹیم میسجز و ان باکس' : 'Team Messages & Inbox'}
            >
              <MessageSquare size={18} />
              {unreadMessagesCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white text-[8px] font-bold flex items-center justify-center animate-bounce">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            <div className="relative">
              <button
                id="header-notifications-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-md-surface-variant text-md-on-surface-variant relative cursor-pointer"
                title={t.notifications}
              >
                <Bell size={18} />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-md-error text-md-on-error text-[8px] font-bold flex items-center justify-center animate-bounce">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute ltr:right-0 rtl:left-0 mt-2 w-80 bg-md-surface-container-lowest border border-md-surface-variant rounded-2xl shadow-lg py-3 z-50 animate-fade-in">
                  <div className="px-4 pb-2 border-b border-md-surface-variant flex items-center justify-between">
                    <span className="text-xs font-bold text-md-on-surface">{t.notifications}</span>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-[10px] text-md-primary hover:underline font-semibold"
                      >
                        {language === 'ur' ? 'تمام صاف کریں' : 'Clear all'}
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-md-on-surface-variant/60">
                        {language === 'ur' ? 'کوئی نئی اطلاع نہیں ہے' : 'No notifications'}
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationAsRead(n.id);
                            setShowNotifications(false);
                          }}
                          className={`p-3.5 border-b border-md-surface-variant hover:bg-md-surface-variant/30 cursor-pointer transition-colors flex gap-2.5 ${
                            !n.read ? 'bg-md-primary-container/5' : ''
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs ${!n.read ? 'font-bold text-md-on-surface' : 'text-md-on-surface-variant/80'}`}>
                              {n.title}
                            </p>
                            <p className="text-[11px] text-md-on-surface-variant/70 mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                            <span className="text-[9px] font-mono text-md-outline mt-1 block">
                              {n.timestamp}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Logout Button */}
            <button
              id="header-logout-btn"
              onClick={logoutUser}
              className="p-2 rounded-full hover:bg-rose-500/10 hover:text-rose-600 text-md-on-surface-variant transition-colors cursor-pointer"
              title={t.logout}
            >
              <LogOut size={18} />
            </button>
          </>
        )}
      </div>

      {/* Dedicated Pending Google Meet Proof Links Modal */}
      <PendingProofLinksModal
        isOpen={isPendingProofModalOpen}
        onClose={() => setPendingProofModalOpen(false)}
      />
    </header>
  );
};
