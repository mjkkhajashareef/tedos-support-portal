/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ModuleId } from '../../types';
import { ALL_CONFIGURABLE_MODULES, canAccessModule } from '../../utils/rbac';
import { SidebarNavigation } from '../navigation/SidebarNavigation';
import { Header } from './Header';
import { BottomNavigation } from '../navigation/BottomNavigation';
import { InteractiveDemoGuide } from '../common/InteractiveDemoGuide';
import { GoogleReviewFeedbackModal } from '../common/GoogleReviewFeedbackModal';
import { DataBackupRestoreModal } from '../common/DataBackupRestoreModal';
import { TRANSLATIONS } from '../../i18n/translations';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  GraduationCap,
  MessageSquareCode,
  BarChart3,
  Bell,
  Sparkles,
  Settings,
  X,
  UserCheck,
  ShieldAlert,
  BookOpen,
  Rocket,
  ExternalLink,
  CheckCircle2,
  LayoutGrid,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  id?: string;
}

export const AppShell: React.FC<AppShellProps> = ({ children, id }) => {
  const {
    currentModule,
    setCurrentModule,
    currentUser,
    language,
    isGoogleReviewModalOpen,
    setGoogleReviewModalOpen,
    reviewModalClient,
    isBackupModalOpen,
    setBackupModalOpen,
    isBlankWorkspace,
    setIsBlankWorkspace
  } = useApp();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [permRevision, setPermRevision] = useState(0);
  const [selectedQuickLink, setSelectedQuickLink] = useState<ModuleId>(ModuleId.DAILY_WORK_LOG);
  const [isQuickLauncherExpanded, setIsQuickLauncherExpanded] = useState<boolean>(true);
  const [isQuickLauncherHidden, setIsQuickLauncherHidden] = useState<boolean>(() => {
    return localStorage.getItem('tedos_quick_link_hidden') === 'true';
  });
  const [launcherPosition, setLauncherPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right'>(() => {
    return (localStorage.getItem('tedos_quick_link_pos') as any) || 'bottom-right';
  });

  const t = TRANSLATIONS[language];
  const isUrdu = language === 'ur';

  useEffect(() => {
    const handlePermUpdate = () => {
      setPermRevision(r => r + 1);
    };
    window.addEventListener('tedos_permissions_updated', handlePermUpdate);
    return () => window.removeEventListener('tedos_permissions_updated', handlePermUpdate);
  }, []);

  // Authorized modules for the current user according to Rule Management
  const authorizedQuickModules = ALL_CONFIGURABLE_MODULES.filter(
    mod => mod.id !== ModuleId.LOGIN && canAccessModule(currentUser?.role, mod.id)
  );

  useEffect(() => {
    if (authorizedQuickModules.length > 0) {
      const stillAllowed = authorizedQuickModules.some(m => m.id === selectedQuickLink);
      if (!stillAllowed) {
        setSelectedQuickLink(authorizedQuickModules[0].id);
      }
    }
  }, [currentUser, permRevision]);

  // Enforce access control guard: If user is on an unauthorized module, redirect to first authorized module
  useEffect(() => {
    if (currentUser && currentModule !== ModuleId.LOGIN) {
      if (!canAccessModule(currentUser.role, currentModule)) {
        const fallbackMod = authorizedQuickModules[0]?.id || ModuleId.DASHBOARD;
        setCurrentModule(fallbackMod);
      }
    }
  }, [currentUser, currentModule, permRevision]);

  const handleQuickLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuickLink) return;
    setCurrentModule(selectedQuickLink);
    setIsBlankWorkspace(false);
  };

  // Helper lists for the "More" menu on mobile
  const moreItems = [
    { id: ModuleId.COO_DASHBOARD, label: t.cooOperations, icon: ShieldAlert, color: 'text-purple-600 bg-purple-50' },
    {
      id: ModuleId.OVER_SERVICE,
      label: isUrdu ? 'اوور سروس (DLT • Payment • WhatsApp)' : 'Over Service (DLT • Payment • WhatsApp)',
      icon: Rocket,
      color: 'text-indigo-600 bg-indigo-50'
    },
    { id: ModuleId.POLICIES, label: t.policiesNotice, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
    { id: ModuleId.CLIENTS, label: t.clients, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
    { id: ModuleId.TRAINING, label: t.trainingResources, icon: GraduationCap, color: 'text-teal-600 bg-teal-50' },
    { id: ModuleId.WHATSAPP, label: t.whatsappAutomation, icon: MessageSquareCode, color: 'text-emerald-600 bg-emerald-50' },
    { id: ModuleId.REPORTS, label: t.reportsAnalytics, icon: BarChart3, color: 'text-blue-600 bg-blue-50' },
    { id: ModuleId.NOTIFICATIONS, label: t.notifications, icon: Bell, color: 'text-amber-600 bg-amber-50' },
    { id: ModuleId.AI_ASSISTANT, label: t.aiAssistant, icon: Sparkles, color: 'text-purple-600 bg-purple-50' },
    { id: ModuleId.USER_MANAGEMENT, label: t.userManagement, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
    { id: ModuleId.SETTINGS, label: t.systemSettings, icon: Settings, color: 'text-gray-600 bg-gray-50' },
  ].filter(item => canAccessModule(currentUser?.role, item.id));

  return (
    <div id={id} className="min-h-screen bg-md-background flex overflow-hidden">
      {/* Sidebar - Visible on Desktop, expanded on Login */}
      {(currentModule !== ModuleId.LOGIN && currentUser) && <SidebarNavigation />}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top App Bar Header */}
        {(currentModule !== ModuleId.LOGIN && currentUser) && <Header />}

        {/* Core Content Area */}
        <main
          className={`flex-1 overflow-y-auto ${
            (currentModule === ModuleId.LOGIN || !currentUser) ? 'pb-0' : 'pb-28 md:pb-24'
          } p-4 sm:p-6 md:p-8`}
        >
          {children}
        </main>

        {/* Quick Link Direct Selector & Submit Widget (Adjustable / Hideable per req #4) */}
        {currentUser && currentModule !== ModuleId.LOGIN && (
          isQuickLauncherHidden ? (
            <div className="fixed bottom-16 md:bottom-5 right-4 z-40">
              <button
                type="button"
                onClick={() => {
                  setIsQuickLauncherHidden(false);
                  localStorage.setItem('tedos_quick_link_hidden', 'false');
                }}
                className="px-3.5 py-2 rounded-full bg-slate-900/90 text-amber-300 border border-blue-500/50 shadow-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition cursor-pointer"
                title={isUrdu ? 'کوئیک لنکس دکھائیں' : 'Show Quick Links'}
              >
                <LayoutGrid size={14} />
                <span>{isUrdu ? 'کوئیک لنک' : 'Quick Link'}</span>
              </button>
            </div>
          ) : (
            <div
              id="quick-link-launcher"
              className={`fixed z-40 max-w-sm w-[calc(100vw-2rem)] sm:w-96 transition-all ${
                launcherPosition === 'bottom-left'
                  ? 'bottom-16 md:bottom-5 left-4 md:left-24'
                  : launcherPosition === 'top-right'
                  ? 'top-20 right-4'
                  : 'bottom-16 md:bottom-5 right-4'
              }`}
            >
              <div className="rounded-2xl bg-slate-900/95 dark:bg-slate-900 text-white border border-blue-500/40 shadow-2xl overflow-hidden backdrop-blur-md">
                {/* Launcher Header with Move & Close Controls */}
                <div
                  className="px-3.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between select-none"
                >
                  <div
                    onClick={() => setIsQuickLauncherExpanded(prev => !prev)}
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <LayoutGrid size={14} className="text-amber-300 shrink-0" />
                    <span className="text-xs font-black tracking-wide uppercase truncate">
                      {isUrdu ? 'کوئیک لنک سلیکٹر' : 'Quick Link Selector'}
                    </span>
                    <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.2 rounded-full">
                      {authorizedQuickModules.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Position Switcher */}
                    <button
                      type="button"
                      onClick={() => {
                        const nextPos =
                          launcherPosition === 'bottom-right'
                            ? 'bottom-left'
                            : launcherPosition === 'bottom-left'
                            ? 'top-right'
                            : 'bottom-right';
                        setLauncherPosition(nextPos);
                        localStorage.setItem('tedos_quick_link_pos', nextPos);
                      }}
                      className="p-1 rounded hover:bg-white/20 text-white text-[10px] font-mono transition cursor-pointer"
                      title={isUrdu ? 'جگہ تبدیل کریں (Move Position)' : 'Move Position'}
                    >
                      ⇄ Move
                    </button>

                    {/* Expand/Collapse Toggle */}
                    <button
                      type="button"
                      onClick={() => setIsQuickLauncherExpanded(prev => !prev)}
                      className="p-1 rounded hover:bg-white/20 text-white transition cursor-pointer"
                    >
                      {isQuickLauncherExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>

                    {/* Close / Hide Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsQuickLauncherHidden(true);
                        localStorage.setItem('tedos_quick_link_hidden', 'true');
                      }}
                      className="p-1 rounded hover:bg-red-500/80 text-white transition cursor-pointer"
                      title={isUrdu ? 'چھپائیں (Hide)' : 'Hide Quick Launcher'}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Launcher Body: Select Link + Submit */}
                {isQuickLauncherExpanded && (
                  <form onSubmit={handleQuickLinkSubmit} className="p-3.5 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span className="truncate">
                        {isUrdu
                          ? `رول (${currentUser.role}) کا لنک منتخب کریں:`
                          : `Select link for ${currentUser.role}:`}
                      </span>
                      {!isBlankWorkspace && (
                        <button
                          type="button"
                          onClick={() => setIsBlankWorkspace(true)}
                          className="text-[10px] text-amber-300 hover:underline font-bold cursor-pointer shrink-0 ml-1"
                        >
                          {isUrdu ? 'خالی اسکرین' : 'Blank'}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        aria-label="Select Quick Link Module"
                        value={selectedQuickLink}
                        onChange={e => setSelectedQuickLink(e.target.value as ModuleId)}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-blue-400"
                      >
                        {authorizedQuickModules.map(mod => (
                          <option key={mod.id} value={mod.id}>
                            {isUrdu ? `${mod.labelUr} (${mod.labelEn})` : mod.labelEn}
                          </option>
                        ))}
                      </select>

                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer shrink-0"
                      >
                        <CheckCircle2 size={14} />
                        <span>{isUrdu ? 'سبمٹ' : 'Submit'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )
        )}

        {/* Bottom Navigation Bar - Visible on Mobile only */}
        {(currentModule !== ModuleId.LOGIN && currentUser) && (
          <BottomNavigation onOpenMoreMenu={() => setIsMoreMenuOpen(true)} />
        )}
      </div>

      {/* Global Interactive Demo & Software Walkthrough Guide Modal */}
      <InteractiveDemoGuide />

      {/* Global Google Maps Review & Feedback Synchronizer Modal */}
      <GoogleReviewFeedbackModal
        isOpen={isGoogleReviewModalOpen}
        onClose={() => setGoogleReviewModalOpen(false)}
        defaultClient={reviewModalClient}
      />

      {/* Global Data Export, Reports & Full System Backup/Restore Modal */}
      <DataBackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setBackupModalOpen(false)}
      />

      {/* Mobile "More Menu" Bottom Sheet - Animated with motion */}
      <AnimatePresence>
        {isMoreMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />

            {/* Bottom Sheet Container */}
            <motion.div
              initial={{ translateY: '100%' }}
              animate={{ translateY: 0 }}
              exit={{ translateY: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-md-surface-container-lowest border-t border-md-surface-variant rounded-t-[28px] z-50 p-6 pb-12 md:hidden flex flex-col"
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-md-outline/30 rounded-full mx-auto mb-4" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                  <span className="text-base font-bold text-md-on-surface">
                    {language === 'ur' ? 'ٹیکنو ایویڈنٹ سپورٹ پورٹل' : 'TEDOS Support Portal'}
                  </span>
                  <span className="text-xs text-md-outline font-medium">
                    {language === 'ur' ? 'تمام دستیاب ماڈیولز اور فیچرز' : 'All Available Modules'}
                  </span>
                </div>
                <button
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="p-1.5 rounded-full hover:bg-md-surface-variant text-md-on-surface-variant"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Grid of Modules */}
              <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-1">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isSelected = !isBlankWorkspace && currentModule === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`more-menu-item-${item.id}`}
                      onClick={() => {
                        setCurrentModule(item.id);
                        setIsMoreMenuOpen(false);
                      }}
                      className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-md-primary-container/45 border-md-primary text-md-on-primary-container'
                          : 'bg-md-surface-container-low border-md-surface-variant hover:bg-md-surface-variant/40'
                      }`}
                    >
                      <div className={`p-2 rounded-xl mb-3 ${item.color}`}>
                        <Icon size={20} />
                      </div>
                      <span className="text-xs font-semibold tracking-wide text-md-on-surface">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Quick user badge in more drawer */}
              {currentUser && (
                <div className="mt-6 pt-4 border-t border-md-surface-variant flex items-center gap-3">
                  <div className="p-2 rounded-full bg-md-secondary-container text-md-on-secondary-container">
                    <UserCheck size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-md-on-surface">{currentUser.name}</span>
                    <span className="text-[10px] font-mono text-md-outline uppercase">{currentUser.role}</span>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
