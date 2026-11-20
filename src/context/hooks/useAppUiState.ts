/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import {
  UserRole,
  ModuleId,
  User,
  AppNotification,
  SupportClient,
  InternalMessage
} from '../../types';
import { messageService } from '../../utils/messageService';
import { ThemeType, THEME_REGISTRY, applyThemeToDOM } from '../../config/theme';
import { emitSystemToast } from '../../components/common/SystemToastStack';

export function useAppUiState(currentUser: User | null, clients: SupportClient[]) {
  const [language, setLanguageState] = useState<'en' | 'ur'>(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('tedos_language');
      if (savedLang === 'en' || savedLang === 'ur') return savedLang;
    }
    return 'ur';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
      if (language === 'ur') {
        document.body.classList.add('lang-ur');
        document.body.classList.remove('lang-en');
      } else {
        document.body.classList.remove('lang-ur');
        document.body.classList.add('lang-en');
      }
    }
  }, [language]);

  const setLanguage = (lang: 'en' | 'ur') => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tedos_language', lang);
      document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
      if (lang === 'ur') {
        document.body.classList.add('lang-ur');
        document.body.classList.remove('lang-en');
      } else {
        document.body.classList.remove('lang-ur');
        document.body.classList.add('lang-en');
      }
    }
  };

  const [activeTheme, setActiveTheme] = useState<ThemeType>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('tedos_theme');
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'sapphire') {
        return savedTheme;
      }
    }
    return 'light';
  });

  useEffect(() => {
    applyThemeToDOM(THEME_REGISTRY[activeTheme]);
    localStorage.setItem('tedos_theme', activeTheme);
  }, [activeTheme]);

  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.SUPPORT_EXECUTIVE);
  const [currentModule, _setCurrentModule] = useState<ModuleId>(ModuleId.LOGIN);
  const [isBlankWorkspace, setIsBlankWorkspace] = useState<boolean>(false);
  const [navHistory, setNavHistory] = useState<ModuleId[]>([ModuleId.LOGIN]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const [isPendingProofModalOpen, setPendingProofModalOpen] = useState(false);
  const openPendingProofModal = () => setPendingProofModalOpen(true);

  const [isWhatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [isLoginWhatsAppModalOpen, setLoginWhatsAppModalOpen] = useState(false);
  const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isDemoGuideOpen, setDemoGuideOpen] = useState(false);
  const [demoActiveModule, setDemoActiveModule] = useState<ModuleId | null>(null);
  const [isGoogleReviewModalOpen, setGoogleReviewModalOpen] = useState(false);
  const [reviewModalClient, setReviewModalClient] = useState<SupportClient | null>(null);
  const [isBackupModalOpen, setBackupModalOpen] = useState(false);
  const [isShareTestModalOpen, setShareTestModalOpen] = useState(false);
  const [isSheetSyncModalOpen, setSheetSyncModalOpen] = useState(false);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [internalMessages, setInternalMessages] = useState<InternalMessage[]>(() =>
    messageService.getStoredMessages()
  );

  const setCurrentModule = (module: ModuleId) => {
    setIsBlankWorkspace(false);
    _setCurrentModule(module);
    setNavHistory(prev => {
      const currentStack = prev.slice(0, historyIndex + 1);
      if (currentStack[currentStack.length - 1] === module) return prev;
      return [...currentStack, module];
    });
    setHistoryIndex(prev => prev + 1);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const prevModule = navHistory[historyIndex - 1];
      setHistoryIndex(prev => prev - 1);
      _setCurrentModule(prevModule);
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    }
  };

  const goForward = () => {
    if (historyIndex < navHistory.length - 1) {
      const nextModule = navHistory[historyIndex + 1];
      setHistoryIndex(prev => prev + 1);
      _setCurrentModule(nextModule);
    } else if (typeof window !== 'undefined') {
      window.history.forward();
    }
  };

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < navHistory.length - 1;

  const openGoogleReviewModal = (client?: SupportClient | null) => {
    if (client) {
      setReviewModalClient(client);
    } else if (selectedClientId) {
      const found = clients.find(c => c.id === selectedClientId);
      setReviewModalClient(found || null);
    }
    setGoogleReviewModalOpen(true);
  };

  const openBackupModal = (_module?: ModuleId) => setBackupModalOpen(true);
  const openShareTestModal = () => setShareTestModalOpen(true);
  const openSheetSyncModal = () => setSheetSyncModalOpen(true);

  const openDemoForModule = (module?: ModuleId) => {
    if (module) setDemoActiveModule(module);
    setDemoGuideOpen(true);
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    setNotifications(prev => [
      {
        ...notif,
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: 'Just now',
        read: false
      },
      ...prev
    ]);
    emitSystemToast({
      title: notif.title,
      message: notif.message,
      type: notif.type
    });
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => setNotifications([]);

  const sendInternalMessage = async (
    msg: Omit<InternalMessage, 'id' | 'timestamp' | 'read' | 'readBy'>
  ) => {
    const created = await messageService.sendMessage(msg);
    setInternalMessages(prev => [created, ...prev.filter(m => m.id !== created.id)]);
    addNotification({
      title: language === 'ur' ? 'پیغام ارسال ہو گیا' : 'Message Sent',
      message: `${msg.recipientName}: ${msg.subject}`,
      type: 'success'
    });
    return created;
  };

  const markInternalMessageAsRead = async (messageId: string) => {
    const userId = currentUser?.id || currentUser?.employeeId || 'current-user';
    await messageService.markAsRead(messageId, userId);
    setInternalMessages(prev =>
      prev.map(m =>
        m.id === messageId ? { ...m, read: true, readBy: [...(m.readBy || []), userId] } : m
      )
    );
  };

  const deleteInternalMessage = async (messageId: string) => {
    if (currentUser?.role === UserRole.SUPPORT_EXECUTIVE) {
      console.warn('[AppContext] Support Executives cannot delete internal messages.');
      return;
    }
    await messageService.deleteMessage(messageId);
    setInternalMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const refreshInternalMessages = async () => {
    const fresh = await messageService.syncWithServer();
    setInternalMessages(fresh);
  };

  const unreadMessagesCount = useMemo(
    () => messageService.getUnreadCount(internalMessages, currentUser),
    [internalMessages, currentUser]
  );

  useEffect(() => {
    refreshInternalMessages();
    const handleMsgUpdate = () => setInternalMessages(messageService.getStoredMessages());
    window.addEventListener('tedos_messages_updated', handleMsgUpdate);
    const interval = setInterval(() => {
      messageService.syncWithServer().then(res => setInternalMessages(res));
    }, 10000);
    return () => {
      window.removeEventListener('tedos_messages_updated', handleMsgUpdate);
      clearInterval(interval);
    };
  }, []);

  return {
    language,
    setLanguage,
    activeTheme,
    setActiveTheme,
    selectedRole,
    setSelectedRole,
    currentModule,
    _setCurrentModule,
    setCurrentModule,
    isBlankWorkspace,
    setIsBlankWorkspace,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    selectedClientId,
    setSelectedClientId,
    isSidebarOpen,
    setSidebarOpen,
    isPendingProofModalOpen,
    setPendingProofModalOpen,
    openPendingProofModal,
    isWhatsAppModalOpen,
    setWhatsAppModalOpen,
    isLoginWhatsAppModalOpen,
    setLoginWhatsAppModalOpen,
    isLogoutModalOpen,
    setLogoutModalOpen,
    isDemoGuideOpen,
    setDemoGuideOpen,
    demoActiveModule,
    openDemoForModule,
    isGoogleReviewModalOpen,
    setGoogleReviewModalOpen,
    reviewModalClient,
    openGoogleReviewModal,
    isBackupModalOpen,
    setBackupModalOpen,
    openBackupModal,
    isShareTestModalOpen,
    setShareTestModalOpen,
    openShareTestModal,
    isSheetSyncModalOpen,
    setSheetSyncModalOpen,
    openSheetSyncModal,
    notifications,
    setNotifications,
    addNotification,
    markNotificationAsRead,
    clearAllNotifications,
    internalMessages,
    sendInternalMessage,
    markInternalMessageAsRead,
    deleteInternalMessage,
    refreshInternalMessages,
    unreadMessagesCount
  };
}
