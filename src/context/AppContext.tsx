/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, ModuleId, SupportClient, WorkLogEntry } from '../types';
import { TEDOS_BRAND_ASSETS } from '../config/branding';
import { ACTIVE_CONFIG } from '../config/appConfig';
import { useAuth } from './AuthContext';
import { isLogPendingProof } from '../utils/helpers';
import { serverLogin } from '../utils/userDirectory';
import { AppContextType } from './appContextTypes';
import { useAppUiState } from './hooks/useAppUiState';
import { useShiftManager } from './hooks/useShiftManager';
import { useUserManagement, normalize10DigitMobile } from './hooks/useUserManagement';
import { useTicketOperations } from './hooks/useTicketOperations';
import { useFollowUpOperations } from './hooks/useFollowUpOperations';
import { useWorkLogOperations } from './hooks/useWorkLogOperations';
import { useClientOperations } from './hooks/useClientOperations';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, login: loginAsAuth, loginWithUser, logout: logoutAuth } = useAuth();

  const [clients, setClients] = useState<SupportClient[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('tedos_cached_clients');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const clean = parsed.filter(
              c => !/supermart|apex logistics|metro medico|royal textiles|zigma|apollo/i.test(c.name || '')
            );
            if (clean.length > 0) return clean;
          }
        }
      } catch {}
    }
    return [];
  });

  const ui = useAppUiState(currentUser, clients);
  const shiftsHook = useShiftManager({
    currentUser,
    language: ui.language,
    addNotification: ui.addNotification
  });
  const usersHook = useUserManagement({
    currentUser,
    loginWithUser,
    setClients,
    addNotification: ui.addNotification
  });

  const [scopedClientsRef, setScopedClientsRef] = useState<SupportClient[]>(clients);

  const ticketOps = useTicketOperations({
    currentUser,
    setClients,
    visibleClients: scopedClientsRef,
    addNotification: ui.addNotification
  });

  const followUpOps = useFollowUpOperations({
    currentUser,
    clients,
    visibleClients: scopedClientsRef,
    tickets: ticketOps.tickets,
    setTickets: ticketOps.setTickets
  });

  const workLogHook = useWorkLogOperations({
    currentUser,
    language: ui.language,
    clients,
    setClients,
    visibleClients: scopedClientsRef,
    tickets: ticketOps.tickets,
    setTickets: ticketOps.setTickets,
    setFollowUps: followUpOps.setFollowUps,
    addFollowUp: followUpOps.addFollowUp,
    setPendingProofModalOpen: ui.setPendingProofModalOpen,
    addNotification: ui.addNotification
  });

  const clientOps = useClientOperations({
    currentUser,
    clients,
    setClients,
    language: ui.language,
    setSelectedClientId: ui.setSelectedClientId,
    setCurrentModule: ui.setCurrentModule,
    setUsers: usersHook.setUsers,
    setTickets: ticketOps.setTickets,
    setWorkLogs: workLogHook.setWorkLogs,
    setFollowUps: followUpOps.setFollowUps,
    setShifts: shiftsHook.setShifts,
    setNotifications: ui.setNotifications,
    addNotification: ui.addNotification,
    normalizeMobile: normalize10DigitMobile,
    users: usersHook.users
  });

  useEffect(() => {
    setScopedClientsRef(clientOps.visibleClients);
  }, [clientOps.visibleClients]);

  useEffect(() => {
    clientOps.fetchAppData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      ui.setSelectedRole(currentUser.role);
      ui.setSidebarOpen(true);
      if (ui.currentModule === ModuleId.LOGIN) {
        ui._setCurrentModule(ModuleId.DASHBOARD);
        ui.setIsBlankWorkspace(true);
      }
      clientOps.fetchAppData();
    } else {
      ui.setIsBlankWorkspace(false);
      ui._setCurrentModule(ModuleId.LOGIN);
    }
  }, [currentUser]);

  const checkAndPromptPendingProofs = () => {
    setTimeout(() => {
      const allLogsFromTickets = ticketOps.tickets.flatMap(t => t.workLogs || []);
      const combined = new Map<string, WorkLogEntry>();
      [...workLogHook.workLogs, ...allLogsFromTickets].forEach(log => {
        if (log && log.id && !combined.has(log.id)) combined.set(log.id, log);
      });
      const pending = Array.from(combined.values()).filter(l => isLogPendingProof(l, currentUser));
      if (pending.length > 0) {
        ui.setPendingProofModalOpen(true);
      }
    }, 1500);
  };

  const loginAs = (role: UserRole) => {
    loginAsAuth(role);
    ui.setSidebarOpen(true);
    ui._setCurrentModule(ModuleId.DASHBOARD);
    ui.setIsBlankWorkspace(true);
    ui.setLoginWhatsAppModalOpen(true);
    checkAndPromptPendingProofs();
  };

  const loginWithCredentials = async (identifier: string, pass: string) => {
    const res = await serverLogin(identifier, pass);
    if (!res.success || !res.user) {
      return { success: false, error: res.error };
    }
    await loginWithUser(res.user);
    ui.setSelectedRole(res.user.role);
    ui.setSidebarOpen(true);
    ui._setCurrentModule(ModuleId.DASHBOARD);
    ui.setIsBlankWorkspace(true);
    ui.setLoginWhatsAppModalOpen(true);
    checkAndPromptPendingProofs();
    return { success: true, user: res.user };
  };

  const logoutUser = () => ui.setLogoutModalOpen(true);

  const confirmLogout = () => {
    ui.setLogoutModalOpen(false);
    logoutAuth();
    ui.setIsBlankWorkspace(false);
    ui._setCurrentModule(ModuleId.LOGIN);
    ui.setSelectedClientId(null);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        selectedRole: ui.selectedRole,
        currentModule: ui.currentModule,
        selectedClientId: ui.selectedClientId,
        notifications: ui.notifications,
        clients: clientOps.visibleClients,
        allClients: clientOps.allClients,
        workLogs: workLogHook.visibleWorkLogs,
        followUps: followUpOps.visibleFollowUps,
        tickets: ticketOps.visibleTickets,
        users: usersHook.users,
        usersLoading: usersHook.usersLoading,
        overServices: followUpOps.overServices,
        addOverService: followUpOps.addOverService,
        updateOverService: followUpOps.updateOverService,
        setCurrentModule: ui.setCurrentModule,
        setSelectedClientId: ui.setSelectedClientId,
        setSelectedRole: ui.setSelectedRole,
        loginAs,
        loginWithCredentials,
        logoutUser,
        addWorkLog: workLogHook.addWorkLog,
        addFollowUp: followUpOps.addFollowUp,
        updateFollowUp: followUpOps.updateFollowUp,
        updateClientStatus: clientOps.updateClientStatus,
        markNotificationAsRead: ui.markNotificationAsRead,
        clearAllNotifications: ui.clearAllNotifications,
        addNotification: ui.addNotification,
        updateWorkLogApproval: workLogHook.updateWorkLogApproval,
        updateWorkLogFields: workLogHook.updateWorkLogFields,
        updateWorkLogProofLink: workLogHook.updateWorkLogProofLink,
        isPendingProofModalOpen: ui.isPendingProofModalOpen,
        setPendingProofModalOpen: ui.setPendingProofModalOpen,
        openPendingProofModal: ui.openPendingProofModal,
        goBack: ui.goBack,
        goForward: ui.goForward,
        canGoBack: ui.canGoBack,
        canGoForward: ui.canGoForward,
        refreshCurrentView: clientOps.refreshCurrentView,
        isRefreshing: clientOps.isRefreshing,
        isWhatsAppModalOpen: ui.isWhatsAppModalOpen,
        setWhatsAppModalOpen: ui.setWhatsAppModalOpen,
        isLoginWhatsAppModalOpen: ui.isLoginWhatsAppModalOpen,
        setLoginWhatsAppModalOpen: ui.setLoginWhatsAppModalOpen,
        isLogoutModalOpen: ui.isLogoutModalOpen,
        setLogoutModalOpen: ui.setLogoutModalOpen,
        confirmLogout,
        internalMessages: ui.internalMessages,
        sendInternalMessage: ui.sendInternalMessage,
        markInternalMessageAsRead: ui.markInternalMessageAsRead,
        deleteInternalMessage: ui.deleteInternalMessage,
        refreshInternalMessages: ui.refreshInternalMessages,
        unreadMessagesCount: ui.unreadMessagesCount,
        isDemoGuideOpen: ui.isDemoGuideOpen,
        setDemoGuideOpen: ui.setDemoGuideOpen,
        demoActiveModule: ui.demoActiveModule,
        openDemoForModule: ui.openDemoForModule,
        isGoogleReviewModalOpen: ui.isGoogleReviewModalOpen,
        setGoogleReviewModalOpen: ui.setGoogleReviewModalOpen,
        reviewModalClient: ui.reviewModalClient,
        openGoogleReviewModal: ui.openGoogleReviewModal,
        isBackupModalOpen: ui.isBackupModalOpen,
        setBackupModalOpen: ui.setBackupModalOpen,
        openBackupModal: ui.openBackupModal,
        isShareTestModalOpen: ui.isShareTestModalOpen,
        setShareTestModalOpen: ui.setShareTestModalOpen,
        openShareTestModal: ui.openShareTestModal,
        isSidebarOpen: ui.isSidebarOpen,
        setSidebarOpen: ui.setSidebarOpen,
        isBlankWorkspace: ui.isBlankWorkspace,
        setIsBlankWorkspace: ui.setIsBlankWorkspace,
        addTicket: ticketOps.addTicket,
        updateTicket: ticketOps.updateTicket,
        addTicketTimelineEntry: ticketOps.addTicketTimelineEntry,
        addTicketWorkLog: ticketOps.addTicketWorkLog,
        addTicketFollowUp: ticketOps.addTicketFollowUp,
        addTicketWhatsAppLog: ticketOps.addTicketWhatsAppLog,
        addTicketTrainingLog: ticketOps.addTicketTrainingLog,
        addClient: clientOps.addClient,
        addUser: usersHook.addUser,
        updateUser: usersHook.updateUser,
        deactivateUser: usersHook.deactivateUser,
        deleteUser: usersHook.deleteUser,
        resetUserPassword: usersHook.resetUserPassword,
        refreshUsers: usersHook.refreshUsers,
        refreshClients: clientOps.refreshClients,
        updateClientUrl: clientOps.updateClientUrl,
        isSheetSyncModalOpen: ui.isSheetSyncModalOpen,
        setSheetSyncModalOpen: ui.setSheetSyncModalOpen,
        openSheetSyncModal: ui.openSheetSyncModal,
        importSheetRowData: clientOps.importSheetRowData,
        language: ui.language,
        setLanguage: ui.setLanguage,
        activeTheme: ui.activeTheme,
        setActiveTheme: ui.setActiveTheme,
        activeLogSession: workLogHook.activeLogSession,
        updateActiveLogSession: workLogHook.updateActiveLogSession,
        clearActiveLogSession: workLogHook.clearActiveLogSession,
        shifts: shiftsHook.visibleShifts,
        activeTodayShift: shiftsHook.activeTodayShift,
        startDailyShift: shiftsHook.startDailyShift,
        endDailyShift: shiftsHook.endDailyShift,
        updateShiftRecord: shiftsHook.updateShiftRecord,
        branding: TEDOS_BRAND_ASSETS,
        config: ACTIVE_CONFIG
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
