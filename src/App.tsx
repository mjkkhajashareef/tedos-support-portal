/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { ModuleId } from './types';

// Views
import { LoginView } from './components/views/LoginView';
import { DashboardView } from './components/views/DashboardView';
import { TicketsView } from './components/views/TicketsView';
import { ClientsView } from './components/views/ClientsView';
import { ClientWorkspaceView } from './components/views/ClientWorkspaceView';
import { DailyWorkLogView } from './components/views/DailyWorkLogView';
import { OverServiceView } from './components/views/OverServiceView';
import { FollowUpView } from './components/views/FollowUpView';
import { ModuleShellView } from './components/views/ModuleShellView';
import { UserManagementView } from './components/views/UserManagementView';
import { SupportExecutiveDashboard } from './components/views/SupportExecutiveDashboard';
import { ClientActivationWizard } from './components/clients/ClientActivationWizard';
import { COODashboardView } from './components/views/COODashboardView';
import { PoliciesAndRulesView } from './components/views/PoliciesAndRulesView';
import { SettingsView } from './components/views/SettingsView';
import { MyClientsView } from './components/views/MyClientsView';
import { WorkLogHistoryView } from './components/views/WorkLogHistoryView';
import { RoleManagementView } from './components/views/RoleManagementView';
import { PayrollPortalView } from './components/views/PayrollPortalView';
import { ExecutiveInboxView } from './components/views/ExecutiveInboxView';
import { WhatsAppSummaryModal } from './components/common/WhatsAppSummaryModal';
import { WhatsAppLoginStatusModal } from './components/common/WhatsAppLoginStatusModal';
import { LogoutShiftSummaryModal } from './components/common/LogoutShiftSummaryModal';
import { SheetColumnSyncModal } from './components/common/SheetColumnSyncModal';
import { GeminiChatbotView } from './components/gemini/GeminiChatbotView';
import { GeminiFloatingWidget } from './components/gemini/GeminiFloatingWidget';
import { AIMessageStudioView } from './components/views/AIMessageStudioView';
import { ClientUsageBillingView } from './components/views/ClientUsageBillingView';

function RootView() {
  const {
    currentModule,
    currentUser,
    isWhatsAppModalOpen,
    setWhatsAppModalOpen,
    isLoginWhatsAppModalOpen,
    setLoginWhatsAppModalOpen,
    isLogoutModalOpen,
    setLogoutModalOpen,
    confirmLogout,
    isBlankWorkspace,
    language
  } = useApp();

  const isUrdu = language === 'ur';

  // Redirect to Login if no active user session exists
  if (!currentUser) {
    return <LoginView />;
  }

  // Routing manager for modules
  const renderModule = () => {
    // Requirement: Upon login, left side shows modules, center screen stays blank until user selects a module on the left or selects & submits a Quick Link on the bottom-right
    if (isBlankWorkspace) {
      return (
        <div
          id="initial-blank-workspace"
          className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 select-none"
        >
          <div className="max-w-md space-y-2 opacity-60">
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400">
              {currentUser.name} • {currentUser.role} ({currentUser.employeeId})
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isUrdu
                ? 'بائیں جانب سائیڈبار سے ماڈیول منتخب کریں یا دائیں جانب نیچے Quick Link سے لنک سلیکٹ کر کے Submit کریں۔'
                : 'Select a module from the left sidebar or choose a link from the bottom-right Quick Link selector and click Submit.'}
            </p>
          </div>
        </div>
      );
    }

    switch (currentModule) {
      case ModuleId.LOGIN:
        return <LoginView />;
      case ModuleId.DASHBOARD:
        return <DashboardView />;
      case ModuleId.COO_DASHBOARD:
        return <COODashboardView />;
      case ModuleId.POLICIES:
        return <PoliciesAndRulesView />;
      case ModuleId.SUPPORT_EXECUTIVE_DASHBOARD:
        return <SupportExecutiveDashboard />;
      case ModuleId.TICKETS:
        return <TicketsView />;
      case ModuleId.CLIENTS:
        return <ClientsView />;
      case ModuleId.MY_CLIENTS:
        return <MyClientsView />;
      case ModuleId.CLIENT_ACTIVATION:
        return <ClientActivationWizard />;
      case ModuleId.CLIENT_WORKSPACE:
        return <ClientWorkspaceView />;
      case ModuleId.DAILY_WORK_LOG:
        return <DailyWorkLogView />;
      case ModuleId.WORK_LOG_HISTORY:
        return <WorkLogHistoryView />;
      case ModuleId.OVER_SERVICE:
        return <OverServiceView />;
      case ModuleId.FOLLOW_UP:
        return <FollowUpView />;
      case ModuleId.USER_MANAGEMENT:
        return <UserManagementView />;
      case ModuleId.ROLE_MANAGEMENT:
        return <RoleManagementView />;
      case ModuleId.CLIENT_USAGE_BILLING:
        return <ClientUsageBillingView />;
      case ModuleId.PAYROLL:
        return <PayrollPortalView />;
      case ModuleId.EXECUTIVE_INBOX:
        return <ExecutiveInboxView />;
      case ModuleId.SETTINGS:
        return <SettingsView />;
      case ModuleId.AI_ASSISTANT:
        return <GeminiChatbotView />;
      case ModuleId.AI_MESSAGE_STUDIO:
        return <AIMessageStudioView />;

      case ModuleId.NOTIFICATIONS:
        return <ExecutiveInboxView />;

      // Other modules share the adaptive shell view
      case ModuleId.TRAINING:
      case ModuleId.WHATSAPP:
      case ModuleId.REPORTS:
      default:
        return <ModuleShellView />;
    }
  };

  return (
    <>
      {renderModule()}
      <GeminiFloatingWidget />
      <WhatsAppSummaryModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
      />
      <WhatsAppLoginStatusModal
        isOpen={isLoginWhatsAppModalOpen}
        onClose={() => setLoginWhatsAppModalOpen(false)}
      />
      <LogoutShiftSummaryModal
        isOpen={isLogoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirmLogout={confirmLogout}
      />
      <SheetColumnSyncModal />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppShell>
          <RootView />
        </AppShell>
      </AppProvider>
    </AuthProvider>
  );
}
