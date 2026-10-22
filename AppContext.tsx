/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  UserRole,
  ModuleId,
  User,
  AppNotification,
  SupportClient,
  WorkLogEntry,
  FollowUpTracker,
  Ticket,
  TicketStatus,
  TicketPriority,
  IssueCategory,
  IssueType,
  EscalationStatus,
  DevApprovalStatus,
  TicketTimelineEntry,
  TimelineEntryType,
  WhatsAppLogMetadata,
  TrainingLogEntry,
  AttachmentArchitecture,
  UserCreate,
  UserStatus,
  OverServiceEntry,
  ClientLifecycleStatus,
  InternalMessage
} from '../types';
import { messageService } from '../utils/messageService';
import { ThemeType, THEME_REGISTRY, applyThemeToDOM } from '../config/theme';
import { BrandAssetConfig, TEDOS_BRAND_ASSETS } from '../config/branding';
import { AppConfiguration, ACTIVE_CONFIG } from '../config/appConfig';
import { useAuth } from './AuthContext';
import { offlineDb } from '../utils/indexedDb';

interface AppContextType {
  currentUser: User | null;
  selectedRole: UserRole;
  currentModule: ModuleId;
  selectedClientId: string | null;
  notifications: AppNotification[];
  clients: SupportClient[];
  workLogs: WorkLogEntry[];
  followUps: FollowUpTracker[];
  tickets: Ticket[];
  users: User[];
  usersLoading: boolean;
  setCurrentModule: (module: ModuleId) => void;
  setSelectedClientId: (id: string | null) => void;
  setSelectedRole: (role: UserRole) => void;
  loginAs: (role: UserRole) => void;
  loginWithCredentials: (identifier: string, pass: string) => Promise<{ success: boolean; error?: { en: string; ur: string }; user?: User }>;
  logoutUser: () => void;
  addWorkLog: (log: Partial<WorkLogEntry> & Pick<WorkLogEntry, 'clientId' | 'clientName' | 'category' | 'details' | 'durationMinutes' | 'status'>) => Promise<{ success: boolean; message?: string } | void>;
  addFollowUp: (followUp: Partial<FollowUpTracker> & Pick<FollowUpTracker, 'clientId' | 'clientName' | 'reason' | 'priority'>, options?: { skipGasSync?: boolean }) => void;
  updateFollowUp: (id: string, updates: Partial<FollowUpTracker>) => void;
  updateClientStatus: (clientId: string, status: 'Critical' | 'Warning' | 'Active' | 'Inactive') => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isBlankWorkspace: boolean;
  setIsBlankWorkspace: (blank: boolean) => void;
  
  // Enterprise Ticket System operations
  addTicket: (ticket: Omit<Ticket, 'id' | 'createdDate' | 'updatedDate' | 'timeline' | 'workLogs' | 'followUps' | 'whatsappLogs' | 'trainingLogs' | 'attachments'>) => Promise<Ticket> | void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  addTicketTimelineEntry: (ticketId: string, type: TimelineEntryType, notes: string) => void;
  addTicketWorkLog: (ticketId: string, log: Omit<WorkLogEntry, 'id' | 'ticketId' | 'timestamp' | 'date' | 'time' | 'syncStatus'>) => void;
  addTicketFollowUp: (ticketId: string, followUp: Omit<FollowUpTracker, 'id' | 'ticketId' | 'syncStatus'>) => void;
  addTicketWhatsAppLog: (ticketId: string, log: Omit<WhatsAppLogMetadata, 'id' | 'timestamp' | 'status'>) => void;
  addTicketTrainingLog: (ticketId: string, log: Omit<TrainingLogEntry, 'id'>) => void;

  addClient: (client: CreateClientRequest) => Promise<SupportClient | undefined>;
  addUser: (user: UserCreate) => Promise<User | undefined>;

  updateUser: (user: User) => Promise<User | undefined>;
  deactivateUser: (id: string) => Promise<User | undefined>;
  deleteUser: (id: string) => Promise<void>;
  resetUserPassword: (id: string, newPassword?: string) => Promise<string>;
  refreshUsers: () => Promise<void>;
  refreshClients: () => Promise<void>;
  updateWorkLogApproval: (logId: string, approvalStatus: 'Approved' | 'Rejected', remark?: string) => void;
  updateWorkLogFields: (logId: string, updates: Partial<WorkLogEntry>) => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  overServices: OverServiceEntry[];
  addOverService: (entry: Omit<OverServiceEntry, 'id'>) => void;
  updateOverService: (id: string, updates: Partial<OverServiceEntry>) => void;
  allClients: SupportClient[];
  isWhatsAppModalOpen: boolean;
  setWhatsAppModalOpen: (open: boolean) => void;
  isLoginWhatsAppModalOpen: boolean;
  setLoginWhatsAppModalOpen: (open: boolean) => void;
  isLogoutModalOpen: boolean;
  setLogoutModalOpen: (open: boolean) => void;
  confirmLogout: () => void;
  
  // Internal Team Communication & Messaging Center (Requirement #4)
  internalMessages: InternalMessage[];
  sendInternalMessage: (msg: Omit<InternalMessage, 'id' | 'timestamp' | 'read' | 'readBy'>) => Promise<InternalMessage>;
  markInternalMessageAsRead: (messageId: string) => Promise<void>;
  deleteInternalMessage: (messageId: string) => Promise<void>;
  refreshInternalMessages: () => Promise<void>;
  unreadMessagesCount: number;
  
  // Interactive Demo & Software Walkthrough Guide
  isDemoGuideOpen: boolean;
  setDemoGuideOpen: (open: boolean) => void;
  demoActiveModule: ModuleId | null;
  openDemoForModule: (module?: ModuleId) => void;

  // Google Maps Location Review & Feedback Sync Modal
  isGoogleReviewModalOpen: boolean;
  setGoogleReviewModalOpen: (open: boolean) => void;
  reviewModalClient: SupportClient | null;
  openGoogleReviewModal: (client?: SupportClient | null) => void;

  // Data Export, Reports & Full System Backup/Restore
  isBackupModalOpen: boolean;
  setBackupModalOpen: (open: boolean) => void;
  openBackupModal: (module?: ModuleId) => void;
  
  // Safe Testing URL Modal for Reviewers
  isShareTestModalOpen: boolean;
  setShareTestModalOpen: (open: boolean) => void;
  openShareTestModal: () => void;
  
  // Pending Google Meet Proof Links Manager
  isPendingProofModalOpen: boolean;
  setPendingProofModalOpen: (open: boolean) => void;
  openPendingProofModal: () => void;
  updateWorkLogProofLink: (logId: string, proofUrl: string) => Promise<boolean>;

  // Universal Navigation & Refresh (Back, Next, Refresh)
  goBack: () => void;
  goForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  refreshCurrentView: () => Promise<void>;
  isRefreshing: boolean;

  // Client URL & Login configuration & persistent sharing
  updateClientUrl: (identifier: string, newUrl: string, login?: string, remarks?: string) => Promise<void>;
  isSheetSyncModalOpen: boolean;
  setSheetSyncModalOpen: (open: boolean) => void;
  openSheetSyncModal: () => void;
  importSheetRowData: (tsvText: string) => Promise<{ count: number; importedClients: string[] }>;

  // dynamic configurations & language
  language: 'en' | 'ur';
  setLanguage: (lang: 'en' | 'ur') => void;
  activeTheme: ThemeType;
  setActiveTheme: (theme: ThemeType) => void;
  branding: BrandAssetConfig;
  config: AppConfiguration;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

import { apiGateway } from '../utils/apiGateway';
import { CreateClientRequest } from '../utils/apiGateway';
import { CONFIG } from '../config/appConfig';
import { fetchClientsFromGAS, postWorkLogToGAS, AddWorkLogPayload, isValidProofLink } from '../utils/helpers';
import { loadStoredUsers, saveStoredUsers, authenticateUser, serverLogin, syncSupportTeamFromClients, syncUsersWithServer, persistUserToServer } from '../utils/userDirectory';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, login: loginAsAuth, loginWithUser, logout: logoutAuth } = useAuth();

  // Initialize language state (en / ur) - default to 'ur' (Urdu) as requested
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
  
  const [tickets, setTickets] = useState<Ticket[]>([]); // Initialize empty
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.SUPPORT_EXECUTIVE);
  const [currentModule, _setCurrentModule] = useState<ModuleId>(ModuleId.LOGIN);
  const [isBlankWorkspace, setIsBlankWorkspace] = useState<boolean>(false);
  const [navHistory, setNavHistory] = useState<ModuleId[]>([ModuleId.LOGIN]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const setCurrentModule = (module: ModuleId) => {
    console.log('AppContext: setCurrentModule called with', module);
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

  // Pending Google Meet Proof Links Modal State
  const [isPendingProofModalOpen, setPendingProofModalOpen] = useState(false);
  const openPendingProofModal = () => setPendingProofModalOpen(true);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [clients, setClients] = useState<SupportClient[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('tedos_cached_clients');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const clean = parsed.filter(c => !/supermart|apex logistics|metro medico|royal textiles|zigma|apollo/i.test(c.name || ''));
            if (clean.length > 0) return clean;
          }
        }
      } catch {}
    }
    return [];
  });
  const [workLogs, setWorkLogs] = useState<WorkLogEntry[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpTracker[]>([]);
  const [overServices, setOverServices] = useState<OverServiceEntry[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('tedos_over_services');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed.filter(o => !/supermart|apex/i.test(o.clientName || ''));
          }
        }
      } catch {}
    }
    return [];
  });
  const [users, setUsers] = useState<User[]>(() => loadStoredUsers());
  const [usersLoading, setUsersLoading] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isWhatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [isLoginWhatsAppModalOpen, setLoginWhatsAppModalOpen] = useState(false);
  const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);
  const [internalMessages, setInternalMessages] = useState<InternalMessage[]>(() => messageService.getStoredMessages());
  const [isDemoGuideOpen, setDemoGuideOpen] = useState(false);
  const [demoActiveModule, setDemoActiveModule] = useState<ModuleId | null>(null);

  // Google Maps Location Review & Feedback Sync
  const [isGoogleReviewModalOpen, setGoogleReviewModalOpen] = useState(false);
  const [reviewModalClient, setReviewModalClient] = useState<SupportClient | null>(null);

  const openGoogleReviewModal = (client?: SupportClient | null) => {
    if (client) {
      setReviewModalClient(client);
    } else if (selectedClientId) {
      const found = clients.find(c => c.id === selectedClientId);
      setReviewModalClient(found || null);
    }
    setGoogleReviewModalOpen(true);
  };

  // Data Export, Reports & Full System Backup/Restore
  const [isBackupModalOpen, setBackupModalOpen] = useState(false);
  const openBackupModal = (module?: ModuleId) => {
    setBackupModalOpen(true);
  };

  // Safe Testing URL Modal State
  const [isShareTestModalOpen, setShareTestModalOpen] = useState(false);
  const openShareTestModal = () => {
    setShareTestModalOpen(true);
  };

  const openDemoForModule = (module?: ModuleId) => {
    if (module) {
      setDemoActiveModule(module);
    }
    setDemoGuideOpen(true);
  };
  
  const fetchAppData = async () => {
    try {
      console.log('[RUNTIME LOG] fetchAppData started');

      // Fetch clients directly from Google Apps Script Endpoint via proxy or direct URL
      const fetchClientsTask = async (): Promise<SupportClient[]> => {
        try {
          const gasClients = await fetchClientsFromGAS('/api/proxy');
          if (gasClients && gasClients.length > 0) {
            console.log('[RUNTIME LOG] Real GAS fetchClients count via proxy:', gasClients.length);
            return gasClients;
          }
        } catch (proxyErr) {
          console.warn('[AppContext] /api/proxy fetch error, trying direct GAS endpoint:', proxyErr);
        }
        try {
          const directClients = await fetchClientsFromGAS(CONFIG.apiEndpoint);
          if (directClients && directClients.length > 0) {
            console.log('[RUNTIME LOG] Real GAS fetchClients count direct:', directClients.length);
            return directClients;
          }
        } catch (gasErr) {
          console.warn('[AppContext] Real GAS fetch error, falling back to apiGateway:', gasErr);
        }
        try {
          const fallbackRes = await apiGateway.getClients();
          return fallbackRes.data || [];
        } catch (fbErr) {
          console.error('[AppContext] apiGateway.getClients fallback failed:', fbErr);
          return [];
        }
      };

      const [clientsList, ticketsRes, workLogsRes, followUpsRes, notifsRes, usersRes] = await Promise.all([
        fetchClientsTask(),
        apiGateway.getTickets().catch(() => ({ success: true, data: [] })),
        apiGateway.getWorkLogs().catch(() => ({ success: true, data: [] })),
        apiGateway.getFollowUps().catch(() => ({ success: true, data: [] })),
        apiGateway.getNotifications().catch(() => ({ success: true, data: [] })),
        apiGateway.getUsers().catch(() => ({ success: true, data: [] }))
      ]);
      
      console.log('[RUNTIME LOG] fetchClients response count:', clientsList.length);
      console.log('[RUNTIME LOG] fetchUsers response count:', usersRes.data?.length);

      if (clientsList && clientsList.length > 0) {
        const uniqueClientsMap = new Map<string, SupportClient>();
        clientsList.forEach((c, idx) => {
          const lowerName = (c.name || '').toLowerCase();
          if (lowerName.includes('zigma') || lowerName.includes('apollo') || lowerName.includes('supermart') || lowerName.includes('apex logistics')) return;
          const key = c.id || `client-${idx}`;
          if (!uniqueClientsMap.has(key)) {
            uniqueClientsMap.set(key, c);
          }
        });
        const sanitizedClients = Array.from(uniqueClientsMap.values());
        if (sanitizedClients.length > 0) {
          setClients(sanitizedClients);
          localStorage.setItem('tedos_cached_clients', JSON.stringify(sanitizedClients));
          const syncedUsers = syncSupportTeamFromClients(sanitizedClients);
          setUsers(syncedUsers);
        }
      }
      
      if (ticketsRes.success && ticketsRes.data) {
        const cleanTickets = ticketsRes.data.filter(
          (t: Ticket) => !/zigma|apollo/i.test(t.clientName || '')
        );
        if (cleanTickets.length > 0) setTickets(cleanTickets);
      }
      if (workLogsRes.success && workLogsRes.data) {
        const cleanLogs = workLogsRes.data.filter(
          (l: WorkLogEntry) => !/zigma|apollo/i.test(l.clientName || '')
        );
        if (cleanLogs.length > 0) setWorkLogs(cleanLogs);
      }
      // Cross-Device Server Sync (Requirement #2)
      try {
        const srvRes = await fetch('/api/worklogs');
        if (srvRes.ok) {
          const srvJson = await srvRes.json();
          if (srvJson.success && Array.isArray(srvJson.workLogs)) {
            const cleanSrv = srvJson.workLogs.filter(
              (l: WorkLogEntry) => l && l.id && !/zigma|apollo/i.test(l.clientName || '')
            );
            if (cleanSrv.length > 0) {
              setWorkLogs(prev => {
                const map = new Map<string, WorkLogEntry>();
                [...cleanSrv, ...prev].forEach(item => map.set(item.id, item));
                return Array.from(map.values()).sort((a, b) => {
                  const da = new Date(b.date || b.timestamp || 0).getTime();
                  const db = new Date(a.date || a.timestamp || 0).getTime();
                  return da - db;
                });
              });
            }
          }
        }
      } catch (err) {
        console.warn('[AppContext] Server work logs fetch notice:', err);
      }

      // Cross-Device Client URLs Sync (Requirement #4 - "sheet me Jo url hai client Ka wo software me show Hona")
      try {
        const urlRes = await fetch('/api/client-urls');
        if (urlRes.ok) {
          const urlJson = await urlRes.json();
          if (urlJson.success && urlJson.urls) {
            const urlMap: Record<string, any> = urlJson.urls;
            localStorage.setItem('tedos_client_urls', JSON.stringify(urlMap));
            setClients(prev => {
              const updated = prev.map(c => {
                const entry =
                  urlMap[c.teId || ''] ||
                  urlMap[c.id || ''] ||
                  urlMap[c.name || ''] ||
                  (c.teId ? urlMap[c.teId.toUpperCase()] || urlMap[c.teId.toLowerCase()] : null) ||
                  (c.name ? urlMap[c.name.toLowerCase()] : null) ||
                  null;
                if (!entry) return c;
                const enrichedUrl = typeof entry === 'string' ? entry : entry.url;
                const enrichedLogin = typeof entry === 'object' ? entry.login : '';
                const enrichedRemarks = typeof entry === 'object' ? (entry.remarks || entry.specialManagerRemark || entry.noteSaad) : '';
                return {
                  ...c,
                  url: enrichedUrl || c.url,
                  softwareUrl: enrichedUrl || c.softwareUrl,
                  deploymentUrl: enrichedUrl || c.deploymentUrl,
                  softwareLogin: enrichedLogin || c.softwareLogin,
                  email: enrichedLogin || c.email,
                  noteSaad: enrichedRemarks || c.noteSaad,
                  specialManagerRemark: enrichedRemarks || c.specialManagerRemark
                };
              });
              try {
                localStorage.setItem('tedos_cached_clients', JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
        }
      } catch (err) {
        console.warn('[AppContext] Client URLs fetch notice:', err);
      }

      // Cross-Device RBAC Dynamic Rules Sync (Requirement #5)
      try {
        const rolesRes = await fetch('/api/roles');
        if (rolesRes.ok) {
          const rolesJson = await rolesRes.json();
          if (rolesJson.success && rolesJson.roles) {
            const raw = rolesJson.roles;
            const parsed = Array.isArray(raw) && raw.length > 0 ? (raw[0] || raw) : raw;
            if (parsed && typeof parsed === 'object') {
              localStorage.setItem('tedos_role_module_access', JSON.stringify(parsed));
              window.dispatchEvent(new Event('tedos_permissions_updated'));
            }
          }
        }
      } catch (err) {
        console.warn('[AppContext] Roles fetch notice:', err);
      }
      if (followUpsRes.success && followUpsRes.data) {
        const cleanFollowUps = followUpsRes.data.filter(
          (f: FollowUpTracker) => !/zigma|apollo/i.test(f.clientName || '')
        );
        if (cleanFollowUps.length > 0) setFollowUps(cleanFollowUps);
      }
      if (notifsRes.success && notifsRes.data) {
        const cleanNotifs = notifsRes.data.filter(
          (n: AppNotification) => !/zigma|apollo/i.test(n.message || '')
        );
        setNotifications(cleanNotifs);
      }
      
      if (usersRes.success && usersRes.data && usersRes.data.length > 0) {
        const stored = loadStoredUsers();
        setUsers(stored);
      }
    } catch (err) {
      console.error('[RUNTIME LOG] fetchAppData exception:', err);
    }
  };

  const refreshCurrentView = async () => {
    setIsRefreshing(true);
    try {
      await fetchAppData();
      setNotifications(prev => [
        {
          id: `n-${Date.now()}`,
          title: language === 'ur' ? 'ڈیٹا ریفریش ہو گیا' : 'Data Refreshed',
          message: language === 'ur' ? 'تمام ماڈیولز اور کلائنٹس کا ڈیٹا کامیابی سے تازہ ہو گیا۔' : 'All views and synchronization nodes refreshed successfully.',
          timestamp: 'Just now',
          read: false,
          type: 'info'
        },
        ...prev
      ]);
    } catch (err) {
      console.error('Failed to refresh app data', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  // Multi-Device Realtime Polling (Requirement #2: Updates from any user/laptop reflect everywhere)
  useEffect(() => {
    fetchAppData();

    const intervalId = setInterval(async () => {
      try {
        const srvRes = await fetch('/api/worklogs');
        if (srvRes.ok) {
          const srvJson = await srvRes.json();
          if (srvJson.success && Array.isArray(srvJson.workLogs)) {
            const cleanSrv = srvJson.workLogs.filter(
              (l: WorkLogEntry) => l && l.id && !/zigma|apollo/i.test(l.clientName || '')
            );
            if (cleanSrv.length > 0) {
              setWorkLogs(prev => {
                const map = new Map<string, WorkLogEntry>();
                [...cleanSrv, ...prev].forEach(item => map.set(item.id, item));
                return Array.from(map.values()).sort((a, b) => {
                  const da = new Date(b.date || b.timestamp || 0).getTime();
                  const db = new Date(a.date || a.timestamp || 0).getTime();
                  return da - db;
                });
              });
            }
          }
        }
      } catch {}
    }, 12000);

    return () => clearInterval(intervalId);
  }, []);

  // Check and trigger Morning 10:00 to 11:00 AM recurring reminder for pending proof links
  // If user hasn't cleared yesterday's pending proofs between 10:00 AM and 11:00 AM,
  // trigger reminder every 5 minutes until 1 hour window is complete or cleared via Manager Remark
  useEffect(() => {
    const checkMorningPendingSLA = () => {
      const now = new Date();
      const hours = now.getHours();
      // Between 10:00 AM and 11:00 AM
      if (hours >= 10 && hours < 11) {
        // Check if there are any pending proof logs
        const allLogsFromTickets = tickets.flatMap((t) => t.workLogs || []);
        const combined = new Map<string, WorkLogEntry>();
        [...workLogs, ...allLogsFromTickets].forEach((log) => {
          if (log && log.id && !combined.has(log.id)) combined.set(log.id, log);
        });

        const pending = Array.from(combined.values()).filter((l) => {
          if (l.isProofPending === true) return true;
          if (l.proofLink === 'PENDING') return true;
          const hasValidProof = l.proofLink && isValidProofLink(l.proofLink);
          return (l.durationMinutes || 0) > 5 && !hasValidProof;
        });

        if (pending.length > 0) {
          // Open pending proof modal & post high-priority alert
          setPendingProofModalOpen(true);
          addNotification({
            title: language === 'ur' ? 'صبح 10 تا 11 SLA: پینڈنگ پروف لنکس الرٹ' : 'Morning 10-11 SLA: Pending Proof Links',
            message: language === 'ur'
              ? `کل کے کام کے ${pending.length} پینڈنگ پروف لنکس باقی ہیں۔ براہ کرم فوری لنک شامل کریں یا مینیجر ریمارک درج کریں۔`
              : `${pending.length} pending proof links from yesterday require link attachment or Manager Remark.`,
            type: 'warning'
          });
        }
      }
    };

    // Run check every 5 minutes (300,000 ms)
    const morningInterval = setInterval(checkMorningPendingSLA, 5 * 60 * 1000);
    return () => clearInterval(morningInterval);
  }, [workLogs, tickets, language]);

  const [isSheetSyncModalOpen, setSheetSyncModalOpen] = useState(false);
  const openSheetSyncModal = () => setSheetSyncModalOpen(true);

  const updateClientUrl = async (
    identifier: string,
    newUrl: string,
    login?: string,
    remarks?: string
  ) => {
    const trimmed = (newUrl || '').trim();
    const formatted = trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://') && trimmed.includes('.')
      ? `https://${trimmed}`
      : trimmed;

    setClients(prev =>
      prev.map(c => {
        if (c.id === identifier || c.teId === identifier || c.name === identifier) {
          return {
            ...c,
            url: formatted,
            softwareUrl: formatted,
            deploymentUrl: formatted,
            softwareLogin: login !== undefined ? login : c.softwareLogin,
            email: login || c.email,
            noteSaad: remarks !== undefined ? remarks : c.noteSaad,
            specialManagerRemark: remarks !== undefined ? remarks : c.specialManagerRemark
          };
        }
        return c;
      })
    );

    const recordPayload = {
      url: formatted,
      login: login || '',
      remarks: remarks || '',
      updatedAt: new Date().toISOString()
    };

    try {
      const cachedStr = localStorage.getItem('tedos_client_urls');
      const cached = cachedStr ? JSON.parse(cachedStr) : {};
      cached[identifier] = recordPayload;
      localStorage.setItem('tedos_client_urls', JSON.stringify(cached));
    } catch {}

    try {
      await fetch('/api/client-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [identifier]: recordPayload })
      });
    } catch (e) {
      console.warn('Failed to sync client url to server:', e);
    }
  };

  const importSheetRowData = async (tsvText: string): Promise<{ count: number; importedClients: string[] }> => {
    if (!tsvText || !tsvText.trim()) return { count: 0, importedClients: [] };

    const lines = tsvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const updatesMap: Record<string, any> = {};
    const updatedNames: string[] = [];

    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length < 2) continue;

      const teId = (parts[0] || '').trim();
      const clientName = (parts[1] || '').trim();
      const phone = (parts[2] || '').trim();
      const assignedSupport = parts.length > 4 ? (parts[4] || '').trim() : '';
      const department = parts.length > 5 ? (parts[5] || '').trim() : '';
      const plan = parts.length > 6 ? (parts[6] || '').trim() : '';
      const status = parts.length > 7 ? (parts[7] || '').trim() : '';
      const rawUrl = parts.length > 14 ? (parts[14] || '').trim() : '';
      const login = parts.length > 15 ? (parts[15] || '').trim() : '';
      const remarks = parts.length > 18 ? (parts[18] || '').trim() : '';

      const formattedUrl = rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://') && rawUrl.includes('.')
        ? `https://${rawUrl}`
        : rawUrl;

      const record = {
        teId,
        clientName,
        phone,
        assignedSupport,
        department,
        plan,
        status,
        url: formattedUrl,
        login,
        remarks,
        updatedAt: new Date().toISOString()
      };

      if (teId) updatesMap[teId] = record;
      if (clientName) updatesMap[clientName] = record;
      updatedNames.push(clientName || teId);
    }

    if (Object.keys(updatesMap).length === 0) {
      return { count: 0, importedClients: [] };
    }

    setClients(prev => {
      const updated = prev.map(c => {
        const entry =
          updatesMap[c.teId || ''] ||
          updatesMap[c.id || ''] ||
          updatesMap[c.name || ''] ||
          (c.teId ? updatesMap[c.teId.toUpperCase()] || updatesMap[c.teId.toLowerCase()] : null) ||
          (c.name ? updatesMap[c.name.toLowerCase()] : null) ||
          null;
        if (!entry) return c;
        return {
          ...c,
          url: entry.url || c.url,
          softwareUrl: entry.url || c.softwareUrl,
          deploymentUrl: entry.url || c.deploymentUrl,
          softwareLogin: entry.login || c.softwareLogin,
          email: entry.login || c.email,
          noteSaad: entry.remarks || c.noteSaad,
          specialManagerRemark: entry.remarks || c.specialManagerRemark,
          phone: entry.phone || c.phone,
          assignedSupport: entry.assignedSupport || c.assignedSupport,
          assignedExecutive: entry.assignedSupport || c.assignedExecutive
        };
      });
      try {
        localStorage.setItem('tedos_cached_clients', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      const cachedStr = localStorage.getItem('tedos_client_urls');
      const cached = cachedStr ? JSON.parse(cachedStr) : {};
      const merged = { ...cached, ...updatesMap };
      localStorage.setItem('tedos_client_urls', JSON.stringify(merged));
    } catch {}

    try {
      await fetch('/api/client-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatesMap)
      });
    } catch (e) {
      console.warn('Failed to sync batch sheet URLs to server:', e);
    }

    return { count: Object.keys(updatesMap).length, importedClients: updatedNames };
  };

  // Synchronize state with AuthContext core
  useEffect(() => {
    if (currentUser) {
      setSelectedRole(currentUser.role);
      setSidebarOpen(true);
      if (currentModule === ModuleId.LOGIN) {
        _setCurrentModule(ModuleId.DASHBOARD);
        setIsBlankWorkspace(true);
      }
      fetchAppData(); // Call the fetcher
    } else {
      setIsBlankWorkspace(false);
      _setCurrentModule(ModuleId.LOGIN);
    }
  }, [currentUser]);





  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
      if (language === 'ur') {
        document.body.classList.add('lang-ur');
      } else {
        document.body.classList.remove('lang-ur');
      }
    }
  }, [language]);

  // Initialize theme from localStorage or default to system preference (dark mode support)
  const [activeTheme, setActiveTheme] = useState<ThemeType>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('tedos_theme');
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'sapphire') {
        return savedTheme;
      }
    }
    return 'light';
  });

  // Derive workLogs and followUps from tickets state while preserving standalone logs without duplicates
  useEffect(() => {
    const derivedLogsMap = new Map<string, WorkLogEntry>();
    const derivedFollowUpsMap = new Map<string, FollowUpTracker>();
    tickets.forEach(ticket => {
      if (/zigma|apollo/i.test(ticket.clientName || '')) return;
      (ticket.workLogs || []).forEach(wl => {
        if (/zigma|apollo/i.test(wl.clientName || '')) return;
        derivedLogsMap.set(wl.id, { ...wl, ticketId: ticket.id });
      });
      (ticket.followUps || []).forEach(f => {
        if (/zigma|apollo/i.test(f.clientName || '')) return;
        derivedFollowUpsMap.set(f.id, { ...f, ticketId: ticket.id });
      });
    });
    setWorkLogs(prev => {
      prev.forEach(l => {
        if (!/zigma|apollo/i.test(l.clientName || '') && !derivedLogsMap.has(l.id)) {
          derivedLogsMap.set(l.id, l);
        }
      });
      return Array.from(derivedLogsMap.values());
    });
    setFollowUps(prev => {
      prev.forEach(f => {
        if (!/zigma|apollo/i.test(f.clientName || '') && !derivedFollowUpsMap.has(f.id)) {
          derivedFollowUpsMap.set(f.id, f);
        }
      });
      return Array.from(derivedFollowUpsMap.values());
    });
  }, [tickets]);

  // Dynamically update and inject root CSS custom properties when theme state alters
  useEffect(() => {
    applyThemeToDOM(THEME_REGISTRY[activeTheme]);
    localStorage.setItem('tedos_theme', activeTheme);
  }, [activeTheme]);

  // Hydrate states from IndexedDB on startup (filtering out deleted Zigma & Apollo)
  useEffect(() => {
    const hydrateStores = async () => {
      try {
        const storedTickets = await offlineDb.getTickets();
        if (storedTickets && storedTickets.length > 0) {
          const clean = storedTickets.filter(t => !/zigma|apollo/i.test(t.clientName || ''));
          setTickets(clean);
        }
        const storedLogs = await offlineDb.getWorkLogs();
        if (storedLogs && storedLogs.length > 0) {
          const cleanLogs = storedLogs.filter(l => !/zigma|apollo/i.test(l.clientName || ''));
          setWorkLogs(prev => {
            const map = new Map<string, WorkLogEntry>();
            [...cleanLogs, ...prev].forEach(item => map.set(item.id, item));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.error('[TEDOS Sync] IndexedDB load failed, using local in-memory fallback', err);
      }
    };
    hydrateStores();

    // Cross-Laptop Real-Time Sync: poll /api/worklogs every 10 seconds (Requirement #2)
    const pollServerLogs = async () => {
      try {
        const res = await fetch('/api/worklogs');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.workLogs) && json.workLogs.length > 0) {
            setWorkLogs(prev => {
              const map = new Map<string, WorkLogEntry>();
              prev.forEach(l => map.set(l.id, l));
              json.workLogs.forEach((l: WorkLogEntry) => {
                if (l && l.id && !/zigma|apollo/i.test(l.clientName || '')) {
                  const existing = map.get(l.id);
                  map.set(l.id, existing ? { ...existing, ...l } : l);
                }
              });
              return Array.from(map.values()).sort((a, b) => {
                const da = new Date(b.date || b.timestamp || 0).getTime();
                const db = new Date(a.date || a.timestamp || 0).getTime();
                return da - db;
              });
            });
          }
        }
      } catch {
        // silent offline fallback
      }
    };

    const interval = setInterval(pollServerLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkAndPromptPendingProofs = () => {
    setTimeout(() => {
      const allLogsFromTickets = tickets.flatMap((t) => t.workLogs || []);
      const combined = new Map<string, WorkLogEntry>();
      [...workLogs, ...allLogsFromTickets].forEach((log) => {
        if (log && log.id && !combined.has(log.id)) combined.set(log.id, log);
      });

      const pending = Array.from(combined.values()).filter((l) => {
        if (l.isProofPending === true) return true;
        if (l.proofLink === 'PENDING') return true;
        const hasValidProof = l.proofLink && isValidProofLink(l.proofLink);
        return (l.durationMinutes || 0) > 5 && !hasValidProof;
      });

      if (pending.length > 0) {
        setPendingProofModalOpen(true);
      }
    }, 1500);
  };

  const loginAs = (role: UserRole) => {
    loginAsAuth(role);
    setSidebarOpen(true);
    _setCurrentModule(ModuleId.DASHBOARD);
    setIsBlankWorkspace(true);
    setLoginWhatsAppModalOpen(true);
    checkAndPromptPendingProofs();
  };

  const loginWithCredentials = async (identifier: string, pass: string) => {
    // 1. Authoritative cross-device server login (supports newly updated passwords, IDs, emails across all devices)
    const res = await serverLogin(identifier, pass);
    if (!res.success || !res.user) {
      return { success: false, error: res.error };
    }
    await loginWithUser(res.user);
    setSelectedRole(res.user.role);
    setSidebarOpen(true);
    _setCurrentModule(ModuleId.DASHBOARD);
    setIsBlankWorkspace(true);
    setLoginWhatsAppModalOpen(true);
    checkAndPromptPendingProofs();
    return { success: true, user: res.user };
  };

  const logoutUser = () => {
    setLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setLogoutModalOpen(false);
    logoutAuth();
    setIsBlankWorkspace(false);
    _setCurrentModule(ModuleId.LOGIN);
    setSelectedClientId(null);
  };

  // Internal Team Messaging operations
  const sendInternalMessage = async (msg: Omit<InternalMessage, 'id' | 'timestamp' | 'read' | 'readBy'>) => {
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
      prev.map(m => (m.id === messageId ? { ...m, read: true, readBy: [...(m.readBy || []), userId] } : m))
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

  const unreadMessagesCount = useMemo(() => {
    return messageService.getUnreadCount(internalMessages, currentUser);
  }, [internalMessages, currentUser]);

  useEffect(() => {
    refreshInternalMessages();
    syncUsersWithServer().then(res => {
      if (res && res.length > 0) setUsers(res);
    });

    const handleMsgUpdate = () => {
      setInternalMessages(messageService.getStoredMessages());
    };
    const handleUserUpdate = () => {
      setUsers(loadStoredUsers());
    };
    window.addEventListener('tedos_messages_updated', handleMsgUpdate);
    window.addEventListener('tedos_users_updated', handleUserUpdate);

    const interval = setInterval(() => {
      messageService.syncWithServer().then(res => setInternalMessages(res));
      syncUsersWithServer().then(res => {
        if (res && res.length > 0) setUsers(res);
      });
    }, 10000);

    return () => {
      window.removeEventListener('tedos_messages_updated', handleMsgUpdate);
      window.removeEventListener('tedos_users_updated', handleUserUpdate);
      clearInterval(interval);
    };
  }, []);

  const normalize10DigitMobile = (raw?: string): string => {
    const digits = (raw || '').replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
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
  };

  const addOverService = (entry: Omit<OverServiceEntry, 'id'>) => {
    const newEntry: OverServiceEntry = {
      ...entry,
      id: `OVS-${Date.now().toString().slice(-5)}`
    };
    setOverServices(prev => {
      const updated = [newEntry, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('tedos_over_services', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const updateOverService = (id: string, updates: Partial<OverServiceEntry>) => {
    setOverServices(prev => {
      const updated = prev.map(item => (item.id === id ? { ...item, ...updates } : item));
      if (typeof window !== 'undefined') {
        localStorage.setItem('tedos_over_services', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const addClient = async (client: CreateClientRequest): Promise<SupportClient | undefined> => {
    try {
      const cleanMobile = normalize10DigitMobile(client.basicInfo?.phone);
      if (cleanMobile && cleanMobile.length === 10) {
        const duplicateInClients = clients.some(c => normalize10DigitMobile(c.phone) === cleanMobile);
        const duplicateInUsers = users.some(u => normalize10DigitMobile(u.mobile) === cleanMobile);
        if (duplicateInClients || duplicateInUsers) {
          throw new Error('Ek mobile no. ki ek hi ID banni chahiye! Yeh mobile number pehle se registered hai.');
        }
      }

      console.log('AppContext: Adding client...', client);
      const response = await apiGateway.createClient(client);
      console.log('AppContext: Client creation response:', response);
      await fetchAppData();

      // Audit trail
      console.log(`[TEDOS Support Audit Log] CLIENT ACTIVATED: name=${client.name} email=${client.basicInfo?.email}`);

      // Notification
      const newNotification: AppNotification = {
        id: `n-${Date.now()}`,
        title: 'Client Activated',
        message: `Client ${client.name} (ID: ${response.data?.id}) has been successfully activated.`,
        timestamp: 'Just now',
        read: false,
        type: 'success'
      };
      setNotifications(prev => [newNotification, ...prev]);
      
      if (response.data) {
        setSelectedClientId(response.data.id);
        setCurrentModule(ModuleId.CLIENT_WORKSPACE);
      }
      return response.data;
    } catch (err) {
      console.error('Failed to create client', err);
      throw err;
    }
  };

  const addUser = async (user: UserCreate): Promise<User | undefined> => {
    try {
      const current = loadStoredUsers();
      const cleanMobile = normalize10DigitMobile(user.mobile);
      if (cleanMobile && cleanMobile.length === 10) {
        const dupUser = current.some(u => normalize10DigitMobile(u.mobile) === cleanMobile);
        if (dupUser) {
          throw new Error('Ek mobile no. ki ek hi ID banni chahiye! Yeh mobile number pehle se kisi ID par registered hai.');
        }
      }
      if (user.employeeId) {
        const dupEmpId = current.some(u => (u.employeeId || '').toLowerCase() === user.employeeId.trim().toLowerCase());
        if (dupEmpId) {
          throw new Error(`Employee ID "${user.employeeId}" pehle se mojood hai. Har user ki alag ID honi chahiye.`);
        }
      }

      console.log('AppContext: Adding user...', user);
      const newUser: User = {
        id: `usr-${Date.now()}`,
        employeeId: user.employeeId || `TE-${Math.floor(100 + Math.random() * 900)}`,
        name: user.name,
        designation: user.designation || user.role,
        email: user.email.toLowerCase(),
        mobile: user.mobile || '',
        role: user.role,
        department: user.department || 'Support Operations',
        reportingManager: user.reportingManager || 'Management',
        assignedRegion: user.assignedRegion || 'Global',
        assignedClients: user.assignedClients || [],
        status: UserStatus.ACTIVE,
        joiningDate: user.joiningDate || new Date().toISOString().split('T')[0],
        lastLogin: 'Never',
        active: true,
        password: user.password || 'Welcome@123',
        baseSalary: user.baseSalary || 20000,
        monthlyIncentive: user.monthlyIncentive || 2000,
        isFreelancer: user.isFreelancer || false
      };

      const updated = [...current, newUser];
      saveStoredUsers(updated);
      setUsers(updated);

      // Persist to central server for cross-device sync
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      }).catch(e => console.warn('Server user sync error:', e));

      try {
        await apiGateway.createUser(user);
      } catch (e) {
        console.warn('apiGateway createUser background error (stored locally):', e);
      }

      // Notification
      const newNotification: AppNotification = {
        id: `n-${Date.now()}`,
        title: 'User Created',
        message: `User ${user.name} (${newUser.employeeId}) has been successfully created.`,
        timestamp: 'Just now',
        read: false,
        type: 'success'
      };
      setNotifications(prev => [newNotification, ...prev]);
      
      return newUser;
    } catch (err) {
      console.error('Failed to create user', err);
      throw err;
    }
  };

  const refreshUsers = async () => {
    try {
      setUsersLoading(true);
      const srvUsers = await syncUsersWithServer();
      setUsers(srvUsers);
    } catch (err) {
      console.error('Failed to refresh users', err);
      const stored = loadStoredUsers();
      setUsers(stored);
    } finally {
      setUsersLoading(false);
    }
  };

  const refreshClients = async () => {
    try {
      console.log('[RUNTIME LOG] refreshClients started');
      let gasClients: SupportClient[] = [];
      try {
        gasClients = await fetchClientsFromGAS('/api/proxy');
      } catch {
        gasClients = await fetchClientsFromGAS(CONFIG.apiEndpoint);
      }
      if (gasClients && gasClients.length > 0) {
        const uniqueClientsMap = new Map<string, SupportClient>();
        gasClients.forEach((c, idx) => {
          const lowerName = (c.name || '').toLowerCase();
          if (lowerName.includes('zigma') || lowerName.includes('apollo') || lowerName.includes('supermart') || lowerName.includes('apex logistics')) return;
          const key = c.id || `client-${idx}`;
          if (!uniqueClientsMap.has(key)) {
            uniqueClientsMap.set(key, c);
          }
        });
        const sanitizedClients = Array.from(uniqueClientsMap.values());
        if (sanitizedClients.length > 0) {
          setClients(sanitizedClients);
          localStorage.setItem('tedos_cached_clients', JSON.stringify(sanitizedClients));
          const syncedUsers = syncSupportTeamFromClients(sanitizedClients);
          setUsers(syncedUsers);
          addNotification({
            title: language === 'ur' ? 'گوگل شیٹ سنک مکمل' : 'Google Sheet Synced',
            message: language === 'ur' ? `گوگل شیٹ سے ${sanitizedClients.length} اصلی کلائنٹس کامیابی سے سنک ہو گئے۔` : `Successfully synchronized ${sanitizedClients.length} clients from Google Sheet.`,
            type: 'success'
          });
        }
      } else {
        const fallback = await apiGateway.getClients();
        if (fallback.success && fallback.data) setClients(fallback.data);
      }
    } catch (err) {
      console.error('Failed to refresh clients', err);
      const fallback = await apiGateway.getClients();
      if (fallback.success && fallback.data) setClients(fallback.data);
    }
  };

  const updateUser = async (user: User): Promise<User | undefined> => {
    try {
      const current = loadStoredUsers();
      const cleanMobile = normalize10DigitMobile(user.mobile);
      if (cleanMobile && cleanMobile.length === 10) {
        const dupUser = current.some(
          u => u.id !== user.id && normalize10DigitMobile(u.mobile) === cleanMobile
        );
        if (dupUser) {
          throw new Error('Ek mobile no. ki ek hi ID banni chahiye! Yeh mobile number pehle se kisi doosri ID par registered hai.');
        }
      }
      if (user.employeeId) {
        const dupEmp = current.some(
          u => u.id !== user.id && (u.employeeId || '').toLowerCase() === user.employeeId.trim().toLowerCase()
        );
        if (dupEmp) {
          throw new Error(`Employee ID "${user.employeeId}" pehle se kisi doosre user ko assigned hai.`);
        }
      }

      const updatedList = current.map(u => (u.id === user.id ? { ...u, ...user } : u));
      saveStoredUsers(updatedList);
      setUsers(updatedList);

      // Also sync assignedExecutive on clients if assignedClients was updated
      if (Array.isArray(user.assignedClients)) {
        setClients(prev =>
          prev.map(c => {
            if (user.assignedClients.includes(c.id)) {
              return { ...c, assignedExecutive: user.name, assignedSupport: user.name };
            }
            return c;
          })
        );
      }

      // Persist to central server for instant cross-device synchronization
      await persistUserToServer(user);

      try {
        await apiGateway.updateUser(user.id, user);
      } catch (e) {
        console.warn('apiGateway background updateUser warning (saved locally):', e);
      }

      addNotification({
        title: 'User Updated',
        message: `Profile & Employee ID (${user.employeeId}) for ${user.name} updated successfully.`,
        type: 'success'
      });

      return user;
    } catch (err) {
      console.error('Failed to update user', err);
      throw err;
    }
  };

  const deactivateUser = async (id: string): Promise<User | undefined> => {
    try {
      const current = loadStoredUsers();
      let updatedUser: User | undefined;
      const updated = current.map(u => {
        if (u.id === id) {
          const nextActive = !u.active;
          updatedUser = { ...u, active: nextActive, status: nextActive ? UserStatus.ACTIVE : UserStatus.INACTIVE };
          return updatedUser;
        }
        return u;
      });
      saveStoredUsers(updated);
      setUsers(updated);

      if (updatedUser) {
        await persistUserToServer(updatedUser);
      }

      try {
        await apiGateway.updateUser(id, { id, active: updatedUser?.active });
      } catch (e) {
        console.warn('apiGateway background update failed:', e);
      }
      return updatedUser;
    } catch (err) {
      console.error('Failed to deactivate user', err);
      throw err;
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    try {
      const current = loadStoredUsers();
      const updated = current.filter(u => u.id !== id);
      saveStoredUsers(updated);
      setUsers(updated);

      fetch(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(e =>
        console.warn('Server user delete warning:', e)
      );

      try {
        await apiGateway.deleteUser(id);
      } catch (e) {
        console.warn('apiGateway background delete failed:', e);
      }

      setNotifications(prev => [
        {
          id: `n-${Date.now()}`,
          title: 'User Removed',
          message: `Team member has been removed.`,
          timestamp: 'Just now',
          read: false,
          type: 'info'
        },
        ...prev
      ]);
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  const resetUserPassword = async (id: string, newPassword?: string): Promise<string> => {
    try {
      const generated = newPassword || 'TE@' + Math.floor(100000 + Math.random() * 900000);
      const current = loadStoredUsers();
      let updatedUser: User | undefined;
      const updated = current.map(u => {
        if (u.id === id) {
          updatedUser = { ...u, password: generated };
          return updatedUser;
        }
        return u;
      });
      saveStoredUsers(updated);
      setUsers(updated);

      if (updatedUser) {
        await persistUserToServer(updatedUser);
      }

      try {
        await apiGateway.resetUserPassword(id, generated);
      } catch (e) {
        console.warn('apiGateway background reset password failed:', e);
      }

      setNotifications(prev => [
        {
          id: `n-${Date.now()}`,
          title: 'Password Reset',
          message: `Password reset successfully. Temporary credentials issued.`,
          timestamp: 'Just now',
          read: false,
          type: 'success'
        },
        ...prev
      ]);
      return generated;
    } catch (err) {
      console.error('Failed to reset user password', err);
      const fallbackPass = newPassword || 'TE@' + Math.floor(100000 + Math.random() * 900000);
      return fallbackPass;
    }
  };

  // Enterprise Ticket System Core Functions
  const addTicket = async (ticket: Omit<Ticket, 'id' | 'createdDate' | 'updatedDate' | 'timeline' | 'workLogs' | 'followUps' | 'whatsappLogs' | 'trainingLogs' | 'attachments'>): Promise<Ticket> => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newId = `TKT-${new Date().getFullYear()}-${String(tickets.length + 1).padStart(3, '0')}`;
    const raisedBy = ticket.raisedBy || currentUser?.name || ticket.createdBy || 'Support Manager';
    const fromRole = ticket.fromRole || currentUser?.role || UserRole.SUPPORT_MANAGER;
    // If Support Manager raises a ticket, route TO COO by default (Requirement #6)
    const assignedToRole = ticket.assignedToRole || (fromRole === UserRole.SUPPORT_MANAGER ? UserRole.COO : 'Technical / COO');
    const response1String =
      ticket.ultimateResponse1 ||
      `[TICKET ${newId}] FROM: ${raisedBy} (${fromRole}) -> TO: ${assignedToRole} (${ticket.assignedExecutive || 'COO'}) | Issue: ${ticket.issueCategory} | Status: ${ticket.status}${ticket.attachmentUrl ? ` | Attachment: ${ticket.attachmentUrl}` : ''}`;

    const initialAttachments: AttachmentArchitecture[] = ticket.attachmentUrl
      ? [
          {
            id: `att-${Date.now()}`,
            name: ticket.attachmentUrl,
            sizeBytes: 204800,
            fileType: 'Document',
            uploadedAt: new Date().toISOString(),
            uploadedBy: raisedBy
          }
        ]
      : [];

    const newTicket: Ticket = {
      ...ticket,
      id: newId,
      raisedBy,
      fromRole,
      assignedToRole,
      ultimateResponse1: response1String,
      createdDate: todayStr,
      updatedDate: todayStr,
      timeline: [
        {
          id: `tl-${Date.now()}-1`,
          type: 'Ticket Created',
          timestamp: new Date().toISOString(),
          performedBy: raisedBy,
          notes: `Ticket Raised [FROM: ${raisedBy} -> TO: ${assignedToRole}]: ${ticket.issueCategory}`
        }
      ],
      workLogs: [],
      followUps: [],
      history: [],
      whatsappLogs: [],
      trainingLogs: [],
      attachments: initialAttachments
    };

    if (ticket.assignedExecutive) {
      newTicket.timeline.push({
        id: `tl-${Date.now()}-2`,
        type: 'Assigned',
        timestamp: new Date().toISOString(),
        performedBy: raisedBy,
        notes: `Ticket routed TO: ${assignedToRole} (${ticket.assignedExecutive})`
      });
    }

    setTickets(prev => [newTicket, ...prev]);

    // Update Client's ultimateResponse1
    setClients(prev =>
      prev.map(c => (c.id === ticket.clientId || c.name === ticket.clientName ? { ...c, ultimateResponse1: response1String } : c))
    );

    // Sync Ticket Raise to Google Sheet ('Ticket Rase' tab) via /api/proxy and server backend
    const gasPayload = {
      action: 'raiseTicket',
      targetSheet: 'Ticket Rase',
      sheetName: 'Ticket Rase',
      tab: 'Ticket Rase',
      sheetTab: 'Ticket Rase',
      id: newId,
      ticketId: newId,
      date: todayStr,
      timestamp: new Date().toISOString(),
      supportName: raisedBy,
      executiveName: ticket.assignedExecutive || raisedBy,
      category: ticket.issueCategory,
      issueCategory: ticket.issueCategory,
      teId: ticket.teId || ticket.clientId,
      clientName: ticket.clientName,
      workType: `Ticket Raised (FROM: ${raisedBy} -> TO: ${assignedToRole})`,
      status: ticket.status || 'In Progress',
      summary: ticket.issueDescription,
      details: ticket.issueDescription,
      proofLink: ticket.attachmentUrl || '',
      attachmentUrl: ticket.attachmentUrl || '',
      startTime: '09:00',
      endTime: '09:15',
      duration: '00:15:00',
      ultimateResponse1: response1String,
      'Response 1': response1String,
      'Ticket Rase': response1String
    };

    try {
      await Promise.allSettled([
        postWorkLogToGAS(gasPayload, '/api/proxy'),
        fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTicket)
        }).then(r => r.json()).catch(err => console.warn('[AppContext] Server /api/tickets sync warning:', err))
      ]);
    } catch (e) {
      console.warn('[AppContext] Ultimate Sheet Ticket Rase tab sync warning:', e);
    }

    // Persist to IndexedDB
    offlineDb.saveTicket(newTicket).catch(err => {
      console.error('[TEDOS Db] Failed to save ticket to IndexedDB', err);
    });

    // Generate System Notification (Alerting user and leadership with Google Sheet sync confirmation)
    const newNotification: AppNotification = {
      id: `n-${Date.now()}`,
      title: `🚨 Ticket Raised (${raisedBy} ➔ ${assignedToRole})`,
      message: `Ticket ${newId} for ${ticket.clientName} synced to Google Sheet ("Ticket Rase") & Ultimate Response 1.`,
      timestamp: 'Just now',
      read: false,
      type: 'success'
    };
    setNotifications(prev => [newNotification, ...prev]);

    return newTicket;
  };

  const updateTicket = (id: string, updates: Partial<Ticket>) => {
    setTickets(prev =>
      prev.map(t => {
        if (t.id === id) {
          const isSolved = updates.status === TicketStatus.RESOLVED || updates.status === TicketStatus.CLOSED;
          const solvedByPerson = isSolved ? (updates.solvedBy || currentUser?.name || 'COO / Tech Team') : t.solvedBy;
          const updatedResponse1 =
            updates.ultimateResponse1 ||
            `[TICKET ${t.id}] FROM: ${t.raisedBy || t.createdBy} -> TO: ${updates.assignedToRole || t.assignedToRole || 'COO'} | Status: ${updates.status || t.status}${solvedByPerson ? ` | Solved By: ${solvedByPerson}` : ''}${updates.resolutionSummary ? ` | Resolution: ${updates.resolutionSummary}` : ''}${updates.attachmentUrl || t.attachmentUrl ? ` | Attachment: ${updates.attachmentUrl || t.attachmentUrl}` : ''}`;

          const updated: Ticket = {
            ...t,
            ...updates,
            solvedBy: solvedByPerson,
            ultimateResponse1: updatedResponse1,
            updatedDate: new Date().toISOString().split('T')[0]
          };

          // Sync updated Ticket status & solver to ULTIMATE Sheet Response 1
          postWorkLogToGAS(
            {
              action: 'syncTicketResponse1',
              id: updated.id,
              date: updated.updatedDate,
              supportName: solvedByPerson || currentUser?.name || updated.assignedExecutive,
              issueCategory: updated.issueCategory,
              teId: updated.teId || updated.clientId,
              clientName: updated.clientName,
              workType: `Ticket ${updated.status}`,
              status: updated.status,
              summary: updated.resolutionSummary || updated.issueDescription,
              proofLink: updated.attachmentUrl || '',
              startTime: '09:00',
              endTime: '09:15',
              duration: '00:15:00',
              ultimateResponse1: updatedResponse1,
              'Response 1': updatedResponse1
            },
            CONFIG.apiEndpoint
          ).catch(() => {});

          // If status changed, let's append a timeline entry automatically!
          if (updates.status && updates.status !== t.status) {
            let timelineType: TimelineEntryType = 'Assigned';
            if (updates.status === 'Escalated') timelineType = 'Issue Escalated';
            else if (updates.status === 'Resolved') timelineType = 'Resolved';
            else if (updates.status === 'Closed') timelineType = 'Closed';
            
            updated.timeline = [
              ...updated.timeline,
              {
                id: `tl-${Date.now()}`,
                type: timelineType,
                timestamp: new Date().toISOString(),
                performedBy: solvedByPerson || currentUser?.name || 'System',
                notes: `Status changed from ${t.status} to ${updates.status} (Synced to Ultimate Response 1).` + (updates.resolutionSummary ? ` Resolution: ${updates.resolutionSummary}` : '')
              }
            ];

            // Generate notification for status changes
            const newNotification: AppNotification = {
              id: `n-${Date.now()}`,
              title: `Ticket ${updates.status} (${id})`,
              message: `Ticket ${id} is now ${updates.status} by ${solvedByPerson || currentUser?.name || 'System'} [Ultimate Response 1 Updated].`,
              timestamp: 'Just now',
              read: false,
              type: updates.status === 'Escalated' ? 'error' : 'success'
            };
            setNotifications(prevNotif => [newNotification, ...prevNotif]);
          }

          offlineDb.saveTicket(updated).catch(err => {
            console.error('[TEDOS Db] Failed to save ticket updates to IndexedDB', err);
          });
          return updated;
        }
        return t;
      })
    );
  };

  const addTicketTimelineEntry = (ticketId: string, type: TimelineEntryType, notes: string) => {
    setTickets(prev =>
      prev.map(t => {
        if (t.id === ticketId) {
          const updated = {
            ...t,
            timeline: [
              ...t.timeline,
              {
                id: `tl-${Date.now()}`,
                type,
                timestamp: new Date().toISOString(),
                performedBy: currentUser?.name || 'System',
                notes
              }
            ],
            updatedDate: new Date().toISOString().split('T')[0]
          };
          offlineDb.saveTicket(updated).catch(err => {
            console.error('[TEDOS Db] Failed to save timeline to IndexedDB', err);
          });
          return updated;
        }
        return t;
      })
    );
  };

  const addTicketWorkLog = (ticketId: string, log: Omit<WorkLogEntry, 'id' | 'ticketId' | 'timestamp' | 'date' | 'time' | 'syncStatus'>) => {
    const executiveName = log.executiveName || currentUser?.name || 'Asad';
    const teId = log.teId || currentUser?.employeeId || 'TE-101';

    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const logId = `wl-${Date.now()}`;

    const newLog: WorkLogEntry = {
      ...log,
      id: logId,
      ticketId,
      timestamp: new Date().toISOString(),
      date: todayStr,
      time: timeStr,
      executiveName,
      teId,
      syncStatus: 'Synchronized'
    };

    setTickets(prev =>
      prev.map(t => {
        if (t.id === ticketId) {
          const updated = {
            ...t,
            workLogs: [newLog, ...t.workLogs],
            timeline: [
              ...t.timeline,
              {
                id: `tl-${Date.now()}`,
                type: 'Work Log Added' as TimelineEntryType,
                timestamp: new Date().toISOString(),
                performedBy: executiveName,
                notes: `Work Log added: ${log.category} (${log.durationMinutes} mins). Details: ${log.details}`
              }
            ],
            updatedDate: todayStr
          };
          offlineDb.saveTicket(updated).catch(err => {
            console.error('[TEDOS Db] Failed to save work log to ticket in IndexedDB', err);
          });
          return updated;
        }
        return t;
      })
    );
  };

  const addTicketFollowUp = (ticketId: string, followUp: Omit<FollowUpTracker, 'id' | 'ticketId' | 'syncStatus'>) => {
    const executiveName = followUp.executiveName || currentUser?.name || 'Asad';
    const teId = followUp.teId || currentUser?.employeeId || 'TE-101';

    const todayStr = new Date().toISOString().split('T')[0];
    const followUpId = `f-${Date.now()}`;

    const newFollowUp: FollowUpTracker = {
      ...followUp,
      id: followUpId,
      ticketId,
      teId,
      executiveName,
      syncStatus: 'Synchronized'
    };

    setTickets(prev =>
      prev.map(t => {
        if (t.id === ticketId) {
          const updated = {
            ...t,
            followUps: [newFollowUp, ...t.followUps],
            timeline: [
              ...t.timeline,
              {
                id: `tl-${Date.now()}`,
                type: 'Follow-up Scheduled' as TimelineEntryType,
                timestamp: new Date().toISOString(),
                performedBy: executiveName,
                notes: `Scheduled Follow-up for ${followUp.scheduledDate} at ${followUp.scheduledTime}. Purpose: ${followUp.reason}`
              }
            ],
            updatedDate: todayStr
          };
          offlineDb.saveTicket(updated).catch(err => {
            console.error('[TEDOS Db] Failed to save follow-up to ticket in IndexedDB', err);
          });
          return updated;
        }
        return t;
      })
    );
  };

  const addTicketWhatsAppLog = (ticketId: string, log: Omit<WhatsAppLogMetadata, 'id' | 'timestamp' | 'status'>) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const logId = `wa-${Date.now()}`;

    const newLog: WhatsAppLogMetadata = {
      ...log,
      id: logId,
      timestamp: new Date().toISOString(),
      status: 'Sent'
    };

    setTickets(prev =>
      prev.map(t => {
        if (t.id === ticketId) {
          const updated = {
            ...t,
            whatsappLogs: [newLog, ...t.whatsappLogs],
            timeline: [
              ...t.timeline,
              {
                id: `tl-${Date.now()}`,
                type: 'WhatsApp Sent' as TimelineEntryType,
                timestamp: new Date().toISOString(),
                performedBy: currentUser?.name || 'System',
                notes: `WhatsApp broadcast outbound to ${log.recipientPhone} (Template: ${log.templateName}). Msg: "${log.text}"`
              }
            ],
            updatedDate: todayStr
          };
          offlineDb.saveTicket(updated).catch(err => {
            console.error('[TEDOS Db] Failed to save WhatsApp log to ticket in IndexedDB', err);
          });
          return updated;
        }
        return t;
      })
    );
  };

  const addTicketTrainingLog = (ticketId: string, log: Omit<TrainingLogEntry, 'id'>) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const logId = `trn-${Date.now()}`;

    const newLog: TrainingLogEntry = {
      ...log,
      id: logId
    };

    setTickets(prev =>
      prev.map(t => {
        if (t.id === ticketId) {
          const updated = {
            ...t,
            trainingLogs: [newLog, ...t.trainingLogs],
            timeline: [
              ...t.timeline,
              {
                id: `tl-${Date.now()}`,
                type: 'Training Conducted' as TimelineEntryType,
                timestamp: new Date().toISOString(),
                performedBy: log.conductedBy,
                notes: `Conducted training on topic "${log.topic}" for ${log.attendeesCount} staff. Duration: ${log.durationMinutes} mins.`
              }
            ],
            updatedDate: todayStr
          };
          offlineDb.saveTicket(updated).catch(err => {
            console.error('[TEDOS Db] Failed to save Training log to ticket in IndexedDB', err);
          });
          return updated;
        }
        return t;
      })
    );
  };

  // Standalone compatibility helpers - automatic ticket binding without duplicate entries
  const addWorkLog = async (log: Partial<WorkLogEntry> & Pick<WorkLogEntry, 'clientId' | 'clientName' | 'category' | 'details' | 'durationMinutes' | 'status'>): Promise<{ success: boolean; message?: string }> => {
    const executiveName = log.executiveName || currentUser?.name || 'Asad';
    let teId = log.teId || '';
    if (!teId) {
      const matchedClient = clients.find(c => c.id === log.clientId || c.name === log.clientName);
      teId = matchedClient?.teId || matchedClient?.id || 'TE-101';
    }

    const unifiedLogId = log.id || `wl-${Date.now()}`;
    const todayStr = log.date || new Date().toISOString().split('T')[0];
    const timeStr = log.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const hours = Math.floor((log.durationMinutes || 15) / 60);
    const mins = (log.durationMinutes || 15) % 60;
    const durationFormatted = log.duration || `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;

    const hasValidProof = Boolean(log.proofLink && isValidProofLink(log.proofLink));
    const requiresProof = (log.durationMinutes || 0) > 5;
    const hasManagerRemark = Boolean(log.managerRemark || log.specialManagerRemark || log.saadNote);
    const shouldHoldForProof = (log.isProofPending === true || (requiresProof && !hasValidProof)) && !hasManagerRemark;

    let gasResult: { success: boolean; message?: string } = { success: true, message: 'Saved locally' };
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // Requirement #8: "Ultimate sheet me without proof link ke bhi data sync ho raha hai."
    // If proof link is required and pending, hold from syncing to Ultimate Sheet until proof or manager remark is provided!
    if (isOnline && !shouldHoldForProof && log.syncStatus !== 'Pending Sync' && log.syncStatus !== 'Pending Proof Sync') {
      try {
        const gasPayload: AddWorkLogPayload = {
          action: 'addWorkLog',
          id: unifiedLogId,
          date: todayStr,
          supportName: executiveName,
          issueCategory: log.issueCategory || log.category || 'General',
          teId: teId,
          clientName: log.clientName || 'Unknown Client',
          workType: log.workType || log.category || 'Inbound Support Call',
          status: log.status || 'Connected',
          summary: log.details || '',
          proofLink: log.proofLink || '',
          'Proof Link': log.proofLink || '',
          'Proof_Link': log.proofLink || '',
          'proof_link': log.proofLink || '',
          startTime: log.startTime || '09:00',
          endTime: log.endTime || '09:15',
          duration: durationFormatted,
          remarksClient: log.remarksClient || log.remarks || '',
          softwareUsage: log.softwareUsage,
          nextFollowUpDate: log.nextFollowUpDate || '',
          'Next Follow-up Date': log.nextFollowUpDate || '',
          followUpDate: log.nextFollowUpDate || '',
          internalNote: log.internalNote || log.remarks || '',
          'Internal Executive Remark': log.internalNote || log.remarks || '',
          managerRemark: log.managerRemark || '',
          'Manager Remark': log.managerRemark || '',
          cooRemark: log.cooRemark || '',
          'COO Remark': log.cooRemark || '',
          saadNote: log.saadNote || '',
          'Note Saad': log.saadNote || '',
          lastWorkSummary: log.lastWorkSummary || log.details || '',
          clientSatisfactionKpi: log.clientSatisfactionKpi || 'Satisfied',
          monthlyIncentive: log.monthlyIncentive || '',
          coPilotNote: log.coPilotNote || '',
          ultimateColumnS: log.coPilotNote || '',
          Column_S: log.coPilotNote || ''
        };
        gasResult = await postWorkLogToGAS(gasPayload, CONFIG.apiEndpoint);
      } catch (err: any) {
        console.warn('[AppContext] Failed to post work log to Google Apps Script:', err);
        gasResult = { success: false, message: err?.message || 'Failed to post to Google Sheets' };
      }
    } else if (shouldHoldForProof) {
      gasResult = { success: true, message: 'Saved to Pending Proofs. Will sync to Ultimate Sheet upon attaching proof link or manager approval.' };
    }

    // Update client metadata in state (lastWorkSummary, coPilotNote, noteSaad, clientSatisfactionKpi)
    setClients(prev =>
      prev.map(c => {
        if (c.id === log.clientId || c.name === log.clientName) {
          return {
            ...c,
            lastWorkSummary: log.details || c.lastWorkSummary,
            coPilotNote: log.coPilotNote || c.coPilotNote,
            noteSaad: log.saadNote || c.noteSaad,
            clientSatisfactionKpi: log.clientSatisfactionKpi || c.clientSatisfactionKpi,
            monthlyIncentive: log.monthlyIncentive || c.monthlyIncentive,
            recentActivityTimestamp: 'Just now'
          };
        }
        return c;
      })
    );

    // Requirement #5: If nextFollowUpDate is specified, record follow-up locally without duplicate sheet entry
    if (log.nextFollowUpDate && log.nextFollowUpDate.trim() !== '') {
      addFollowUp(
        {
          clientId: log.clientId,
          clientName: log.clientName,
          executiveName,
          teId,
          scheduledDate: log.nextFollowUpDate,
          scheduledTime: '11:00',
          priority: log.priority || 'High',
          lastContactDate: todayStr,
          status: 'Pending',
          reason: log.details || `Follow-up scheduled from Daily Work Log (${log.category})`,
          remarks: log.internalNote || log.remarks || ''
        },
        { skipGasSync: true } // Prevents double entry in Google Sheet!
      );
    }

    const completeLogEntry: WorkLogEntry = {
      id: unifiedLogId,
      ticketId: (log as any).ticketId,
      clientId: log.clientId,
      clientName: log.clientName,
      timestamp: new Date().toISOString(),
      date: todayStr,
      time: timeStr,
      executiveName,
      teId,
      category: log.category,
      issueCategory: log.issueCategory || log.category,
      workType: log.workType || log.category,
      details: log.details,
      status: log.status,
      nextFollowUpDate: log.nextFollowUpDate || '',
      priority: log.priority || 'Medium',
      durationMinutes: log.durationMinutes,
      duration: durationFormatted,
      proofLink: log.proofLink || '',
      startTime: log.startTime,
      endTime: log.endTime,
      remarksClient: log.remarksClient || log.remarks || '',
      remarks: log.remarks || '',
      syncStatus: log.syncStatus || 'Synchronized',
      isProofPending: log.isProofPending,
      proofPendingDate: log.proofPendingDate,
      approvalStatus: log.approvalStatus || 'Pending',
      approvalRemark: log.approvalRemark,
      flagReason: log.flagReason,
      softwareUsage: log.softwareUsage,
      internalNote: log.internalNote || log.remarks || '',
      managerRemark: log.managerRemark || '',
      cooRemark: log.cooRemark || '',
      executiveReply: log.executiveReply || '',
      saadNote: log.specialManagerRemark || log.saadNote || '',
      specialManagerRemark: log.specialManagerRemark || log.saadNote || '',
      proofMissingReason: log.proofMissingReason || '',
      clientStatus: log.clientStatus,
      lastWorkSummary: log.lastWorkSummary || log.details || '',
      clientSatisfactionKpi: log.clientSatisfactionKpi || '',
      monthlyIncentive: log.monthlyIncentive || '',
      coPilotNote: log.coPilotNote || '',
      callStatus: log.callStatus || log.status,
      workStatus: log.workStatus || 'Completed',
      clientStatusRisk: log.clientStatusRisk || 'Normal'
    };

    // Single source update: update standalone workLogs without duplicating ID
    setWorkLogs(prev => [completeLogEntry, ...prev.filter(l => l.id !== unifiedLogId)]);
    offlineDb.saveWorkLog(completeLogEntry).catch(err => {
      console.error('[TEDOS Db] Failed to save work log to IndexedDB', err);
    });

    // Cross-Laptop Multi-User Sync: Save directly to server /api/worklogs
    fetch('/api/worklogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(completeLogEntry)
    }).catch(err => console.warn('[AppContext] Server work logs sync notice:', err));

    // Also attach to active ticket using the SAME unifiedLogId so derivedLogsMap never creates a 2nd item
    const activeTicket =
      tickets.find(t => t.id === (log as any).ticketId) ||
      tickets.find(t => t.clientId === log.clientId && t.status !== 'Closed' && t.status !== 'Resolved') ||
      tickets.find(t => t.clientId === log.clientId);

    if (activeTicket) {
      setTickets(prev =>
        prev.map(t => {
          if (t.id === activeTicket.id) {
            const filteredLogs = (t.workLogs || []).filter(w => w.id !== unifiedLogId);
            const updated = {
              ...t,
              workLogs: [{ ...completeLogEntry, ticketId: t.id }, ...filteredLogs],
              updatedDate: todayStr
            };
            offlineDb.saveTicket(updated).catch(() => {});
            return updated;
          }
          return t;
        })
      );
    }

    return gasResult;
  };

  const addFollowUp = (
    followUp: Partial<FollowUpTracker> & Pick<FollowUpTracker, 'clientId' | 'clientName' | 'reason' | 'priority'>,
    options?: { skipGasSync?: boolean }
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const executiveName = followUp.executiveName || currentUser?.name || 'Asad';
    const matchedClient = clients.find(c => c.id === followUp.clientId || c.name === followUp.clientName);
    const teId = followUp.teId || matchedClient?.teId || matchedClient?.id || 'TE-101';
    const newFollowUpId = followUp.id || `f-${Date.now()}`;

    const newFollowUp: FollowUpTracker = {
      id: newFollowUpId,
      ticketId: (followUp as any).ticketId,
      clientId: followUp.clientId,
      clientName: followUp.clientName,
      teId,
      executiveName,
      scheduledDate: followUp.scheduledDate || todayStr,
      scheduledTime: followUp.scheduledTime || '11:00',
      priority: followUp.priority || 'High',
      lastContactDate: followUp.lastContactDate || todayStr,
      status: followUp.status || 'Pending',
      reason: followUp.reason,
      remarks: followUp.remarks || '',
      nextAction: followUp.nextAction || '',
      syncStatus: 'Synchronized'
    };

    // Update standalone followUps immediately
    setFollowUps(prev => {
      const filtered = prev.filter(
        f => !(f.clientId === newFollowUp.clientId && f.scheduledDate === newFollowUp.scheduledDate && f.reason === newFollowUp.reason)
      );
      return [newFollowUp, ...filtered];
    });
    offlineDb.saveFollowUp(newFollowUp).catch(() => {});

    // Sync Follow-up to ULTIMATE sheet only when not scheduled from Daily Work Log (prevents duplicate rows)
    if (!options?.skipGasSync) {
      postWorkLogToGAS(
        {
          action: 'syncUltimateFollowUp',
          id: newFollowUpId,
          date: todayStr,
          supportName: executiveName,
          issueCategory: 'Follow-up',
        teId,
        clientName: followUp.clientName,
        workType: 'Follow-up Scheduled',
        status: newFollowUp.status,
        summary: followUp.reason,
        startTime: newFollowUp.scheduledTime,
        endTime: newFollowUp.scheduledTime,
        duration: '00:15:00',
        nextFollowUpDate: newFollowUp.scheduledDate,
        'Next Follow-up Date': newFollowUp.scheduledDate,
        followUpDate: newFollowUp.scheduledDate,
        remarksClient: followUp.remarks || ''
      },
      CONFIG.apiEndpoint
    ).catch(e => console.warn('[AppContext] Ultimate Sheet follow-up sync warning:', e));
    }

    const activeTicket =
      tickets.find(t => t.id === (followUp as any).ticketId) ||
      tickets.find(t => t.clientId === followUp.clientId && t.status !== 'Closed' && t.status !== 'Resolved') ||
      tickets.find(t => t.clientId === followUp.clientId);

    if (activeTicket) {
      setTickets(prev =>
        prev.map(t => {
          if (t.id === activeTicket.id) {
            const updated = {
              ...t,
              followUps: [{ ...newFollowUp, ticketId: t.id }, ...(t.followUps || []).filter(f => f.id !== newFollowUpId)],
              updatedDate: todayStr
            };
            offlineDb.saveTicket(updated).catch(() => {});
            return updated;
          }
          return t;
        })
      );
    }
  };

  const updateFollowUp = (id: string, updates: Partial<FollowUpTracker>) => {
    setFollowUps(prev =>
      prev.map(f => {
        if (f.id === id) {
          const updated = { ...f, ...updates };
          offlineDb.saveFollowUp(updated).catch(() => {});
          return updated;
        }
        return f;
      })
    );

    setTickets(prev =>
      prev.map(t => {
        const hasFollowUp = t.followUps.some(f => f.id === id);
        if (hasFollowUp) {
          const updatedFollowUps = t.followUps.map(f => (f.id === id ? { ...f, ...updates } : f));
          const updatedTicket = {
            ...t,
            followUps: updatedFollowUps,
            updatedDate: new Date().toISOString().split('T')[0]
          };
          offlineDb.saveTicket(updatedTicket).catch(() => {});
          return updatedTicket;
        }
        return t;
      })
    );
  };

  const updateClientStatus = (clientId: string, status: 'Critical' | 'Warning' | 'Active' | 'Inactive') => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, status } : c))
    );
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const updateWorkLogApproval = (
    logId: string,
    approvalStatus: 'Approved' | 'Rejected',
    remark?: string
  ) => {
    updateWorkLogFields(logId, {
      approvalStatus,
      approvalRemark: remark,
      cooRemark: currentUser?.role === UserRole.COO || currentUser?.role === UserRole.DIRECTOR ? remark : undefined,
      managerRemark: currentUser?.role === UserRole.SUPPORT_MANAGER || currentUser?.role === UserRole.OPERATION_MANAGER ? remark : undefined
    });
  };

  const updateWorkLogFields = (logId: string, updates: Partial<WorkLogEntry>) => {
    let targetLog: WorkLogEntry | undefined;

    setWorkLogs(prev =>
      prev.map(l => {
        if (l.id === logId) {
          const cleanUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
          );
          const updated = { ...l, ...cleanUpdates };
          targetLog = updated;
          offlineDb.saveWorkLog(updated).catch(() => {});
          return updated;
        }
        return l;
      })
    );

    setTickets(prev =>
      prev.map(ticket => {
        const hasLog = (ticket.workLogs || []).some(l => l.id === logId);
        if (!hasLog) return ticket;
        const cleanUpdates = Object.fromEntries(
          Object.entries(updates).filter(([_, v]) => v !== undefined)
        );
        const updatedLogs = ticket.workLogs.map(l => (l.id === logId ? { ...l, ...cleanUpdates } : l));
        const updatedTicket = {
          ...ticket,
          workLogs: updatedLogs,
          updatedDate: new Date().toISOString().split('T')[0]
        };
        offlineDb.saveTicket(updatedTicket).catch(() => {});
        return updatedTicket;
      })
    );

    // If a Support Executive replied to a Manager/COO remark, notify COO/Director/Manager Inbox!
    if (updates.executiveReply && targetLog) {
      addNotification({
        title: `📩 Support Team Reply from ${targetLog.executiveName}`,
        message: `[Client: ${targetLog.clientName}] Reply: "${updates.executiveReply}"`,
        type: 'info'
      });
    }

    // If Manager/COO added a remark/notice, notify the Support Executive!
    if ((updates.managerRemark || updates.cooRemark) && targetLog) {
      addNotification({
        title: `📋 Leadership Remark on ${targetLog.clientName}`,
        message: `${currentUser?.name || 'Leadership'}: "${updates.managerRemark || updates.cooRemark}"`,
        type: 'warning'
      });
    }

    // Immediate Google Sheet Sync for any Leadership Action (Approvals, Status, Remarks, Proof Links)
    const isLeadershipAction = Boolean(
      updates.managerRemark !== undefined ||
      updates.cooRemark !== undefined ||
      updates.approvalRemark !== undefined ||
      updates.approvalStatus !== undefined ||
      updates.status !== undefined ||
      updates.proofLink !== undefined
    );

    if (isLeadershipAction && targetLog) {
      const activeRemark =
        updates.managerRemark ||
        updates.cooRemark ||
        updates.approvalRemark ||
        targetLog.managerRemark ||
        targetLog.cooRemark ||
        (updates.approvalStatus ? `Status updated to ${updates.approvalStatus}` : '');

      postWorkLogToGAS({
        action: 'updateWorkLogProof',
        id: logId,
        updateExistingOnly: true,
        date: targetLog.date,
        supportName: targetLog.executiveName,
        issueCategory: targetLog.issueCategory || targetLog.category || 'General',
        teId: targetLog.teId || 'TE-101',
        clientName: targetLog.clientName,
        workType: targetLog.workType || targetLog.category || 'Support',
        status: updates.status || targetLog.status || 'Completed',
        summary: targetLog.details || '',
        proofLink: updates.proofLink || targetLog.proofLink || '',
        managerRemark: activeRemark,
        'Manager Remark': activeRemark,
        cooRemark: updates.cooRemark || targetLog.cooRemark || '',
        'COO Remark': updates.cooRemark || targetLog.cooRemark || '',
        approvalStatus: updates.approvalStatus || targetLog.approvalStatus || 'Approved',
        approvalRemark: updates.approvalRemark || activeRemark,
        startTime: targetLog.startTime || '09:00',
        endTime: targetLog.endTime || '09:15',
        duration: targetLog.duration || '00:15:00'
      }).catch(err => console.warn('[AppContext] Leadership action GAS sync warning:', err));
    }

    // Cross-Laptop Multi-User Sync: Save updated log directly to server /api/worklogs
    if (targetLog) {
      fetch('/api/worklogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetLog)
      }).catch(err => console.warn('[AppContext] Server work logs update notice:', err));
    }
  };

  const updateWorkLogProofLink = async (logId: string, proofUrl: string): Promise<boolean> => {
    let updatedEntry: WorkLogEntry | undefined;

    // 1. Update tickets work logs in-place (no duplicate creation)
    setTickets((prev) =>
      prev.map((ticket) => {
        const hasLog = ticket.workLogs.some((l) => l.id === logId);
        if (!hasLog) return ticket;
        const updatedLogs = ticket.workLogs.map((l) => {
          if (l.id === logId) {
            const up = {
              ...l,
              proofLink: proofUrl,
              isProofPending: false,
              proofUpdatedAt: new Date().toISOString(),
              approvalStatus: 'Approved' as const,
              flagReason: undefined
            };
            updatedEntry = up;
            return up;
          }
          return l;
        });
        const updatedTicket = {
          ...ticket,
          workLogs: updatedLogs,
          updatedDate: new Date().toISOString().split('T')[0]
        };
        offlineDb.saveTicket(updatedTicket).catch(() => {});
        return updatedTicket;
      })
    );

    // 2. Update standalone workLogs in-place (never append a duplicate)
    setWorkLogs((prev) =>
      prev.map((l) => {
        if (l.id === logId) {
          const updated = {
            ...l,
            proofLink: proofUrl,
            isProofPending: false,
            proofUpdatedAt: new Date().toISOString(),
            approvalStatus: 'Approved' as const,
            syncStatus: 'Synchronized' as const,
            flagReason: undefined
          };
          updatedEntry = updated;
          offlineDb.saveWorkLog(updated).catch(() => {});
          return updated;
        }
        return l;
      })
    );

    // 3. Dispatch to GAS so Ultimate Sheet receives the verified proof link
    if (updatedEntry) {
      postWorkLogToGAS(
        {
          action: 'updateWorkLogProof',
          id: logId,
          updateExistingOnly: false,
          date: updatedEntry.date,
          supportName: updatedEntry.executiveName,
          issueCategory: updatedEntry.issueCategory || updatedEntry.category || 'General',
          teId: updatedEntry.teId || 'TE-101',
          clientName: updatedEntry.clientName,
          workType: updatedEntry.workType || updatedEntry.category || 'Support',
          status: updatedEntry.status || 'Completed',
          summary: updatedEntry.details || '',
          proofLink: proofUrl,
          'Proof Link': proofUrl,
          'Proof_Link': proofUrl,
          'proof_link': proofUrl,
          startTime: updatedEntry.startTime || '09:00',
          endTime: updatedEntry.endTime || '09:15',
          duration: updatedEntry.duration || '00:15:00',
          nextFollowUpDate: updatedEntry.nextFollowUpDate || '',
          'Next Follow-up Date': updatedEntry.nextFollowUpDate || '',
          followUpDate: updatedEntry.nextFollowUpDate || '',
          managerRemark: updatedEntry.managerRemark || '',
          'Manager Remark': updatedEntry.managerRemark || '',
          remarksClient: updatedEntry.remarksClient || updatedEntry.remarks || '',
          lastWorkSummary: updatedEntry.lastWorkSummary || updatedEntry.details || ''
        },
        CONFIG.apiEndpoint
      ).catch(e => console.warn('[AppContext] Proof update GAS warning:', e));
    }

    // 4. Add notification
    addNotification({
      title: language === 'ur' ? 'پروف لنک اپ ڈیٹ ہو گیا (بغیر ڈبل انٹری)' : 'Proof Link Updated (Single Entry)',
      message: language === 'ur' ? 'گوگل میٹ ریکارڈنگ لنک اسی ریکارڈ میں کامیابی سے اپ ڈیٹ ہو گیا ہے۔' : 'Google Meet recording link updated on existing record without duplicate entry.',
      type: 'success'
    });

    return true;
  };

  // Strict Client & Data Visibility: Support Executive ONLY sees their own assigned clients & data!
  // Operation Manager, COO, Support Manager, and Director see ALL clients & data.
  const visibleClients = React.useMemo(() => {
    const cleanAll = clients.filter(c => !/zigma|apollo/i.test(c.name || ''));
    if (!currentUser) return cleanAll;
    if (currentUser.role === UserRole.SUPPORT_EXECUTIVE) {
      const execNameLower = (currentUser.name || '').trim().toLowerCase();
      const firstToken = execNameLower.split(' ')[0];
      const assignedIds = new Set(currentUser.assignedClients || []);
      return cleanAll.filter(c => {
        if (assignedIds.has(c.id) || (c.teId && assignedIds.has(c.teId))) return true;
        const clientExec = (c.assignedExecutive || c.assignedSupport || '').trim().toLowerCase();
        if (!clientExec) return false;
        return (
          clientExec === execNameLower ||
          clientExec.includes(firstToken) ||
          firstToken.includes(clientExec)
        );
      });
    }
    return cleanAll;
  }, [clients, currentUser]);

  const visibleWorkLogs = React.useMemo(() => {
    const cleanLogs = workLogs.filter(l => !/zigma|apollo/i.test(l.clientName || ''));
    if (!currentUser || currentUser.role !== UserRole.SUPPORT_EXECUTIVE) return cleanLogs;
    const execNameLower = (currentUser.name || '').trim().toLowerCase();
    const firstToken = execNameLower.split(' ')[0];
    const myClientIds = new Set(visibleClients.map(c => c.id));
    const myClientNames = new Set(visibleClients.map(c => (c.name || '').toLowerCase()));
    const myEmpId = (currentUser.employeeId || '').trim().toLowerCase();
    return cleanLogs.filter(l => {
      const logExec = (l.executiveName || l.supportName || '').trim().toLowerCase();
      if (logExec && (logExec === execNameLower || logExec.includes(firstToken) || firstToken.includes(logExec))) {
        return true;
      }
      if (myEmpId && l.teId && l.teId.trim().toLowerCase() === myEmpId) {
        return true;
      }
      return myClientIds.has(l.clientId) || myClientNames.has((l.clientName || '').toLowerCase());
    });
  }, [workLogs, currentUser, visibleClients]);

  const visibleFollowUps = React.useMemo(() => {
    const cleanFollowUps = followUps.filter(f => !/zigma|apollo/i.test(f.clientName || ''));
    if (!currentUser || currentUser.role !== UserRole.SUPPORT_EXECUTIVE) return cleanFollowUps;
    const execNameLower = (currentUser.name || '').trim().toLowerCase();
    const firstToken = execNameLower.split(' ')[0];
    const myClientIds = new Set(visibleClients.map(c => c.id));
    const myClientNames = new Set(visibleClients.map(c => (c.name || '').toLowerCase()));
    return cleanFollowUps.filter(f => {
      const fExec = (f.executiveName || '').trim().toLowerCase();
      if (fExec && (fExec === execNameLower || fExec.includes(firstToken) || firstToken.includes(fExec))) {
        return true;
      }
      return myClientIds.has(f.clientId) || myClientNames.has((f.clientName || '').toLowerCase());
    });
  }, [followUps, currentUser, visibleClients]);

  const visibleTickets = React.useMemo(() => {
    const cleanTickets = tickets.filter(t => !/zigma|apollo/i.test(t.clientName || ''));
    if (!currentUser || currentUser.role !== UserRole.SUPPORT_EXECUTIVE) return cleanTickets;
    const execNameLower = (currentUser.name || '').trim().toLowerCase();
    const firstToken = execNameLower.split(' ')[0];
    const myClientIds = new Set(visibleClients.map(c => c.id));
    const myClientNames = new Set(visibleClients.map(c => (c.name || '').toLowerCase()));
    return cleanTickets.filter(t => {
      const tExec = (t.assignedExecutive || t.raisedBy || '').trim().toLowerCase();
      if (tExec && (tExec === execNameLower || tExec.includes(firstToken) || firstToken.includes(tExec))) {
        return true;
      }
      return myClientIds.has(t.clientId) || myClientNames.has((t.clientName || '').toLowerCase());
    });
  }, [tickets, currentUser, visibleClients]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        selectedRole,
        currentModule,
        selectedClientId,
        notifications,
        clients: visibleClients,
        allClients: clients.filter(c => !/zigma|apollo/i.test(c.name || '')),
        workLogs: visibleWorkLogs,
        followUps: visibleFollowUps,
        tickets: visibleTickets,
        users,
        usersLoading,
        overServices,
        addOverService,
        updateOverService,
        setCurrentModule,
        setSelectedClientId,
        setSelectedRole,
        loginAs,
        loginWithCredentials,
        logoutUser,
        addWorkLog,
        addFollowUp,
        updateFollowUp,
        updateClientStatus,
        markNotificationAsRead,
        clearAllNotifications,
        addNotification,
        updateWorkLogApproval,
        updateWorkLogFields,
        updateWorkLogProofLink,
        isPendingProofModalOpen,
        setPendingProofModalOpen,
        openPendingProofModal,
        goBack,
        goForward,
        canGoBack,
        canGoForward,
        refreshCurrentView,
        isRefreshing,
        isWhatsAppModalOpen,
        setWhatsAppModalOpen,
        isLoginWhatsAppModalOpen,
        setLoginWhatsAppModalOpen,
        isLogoutModalOpen,
        setLogoutModalOpen,
        confirmLogout,
        internalMessages,
        sendInternalMessage,
        markInternalMessageAsRead,
        deleteInternalMessage,
        refreshInternalMessages,
        unreadMessagesCount,
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
        isSidebarOpen,
        setSidebarOpen,
        isBlankWorkspace,
        setIsBlankWorkspace,
        
        // Ticket-centric operational endpoints
        addTicket,
        updateTicket,
        addTicketTimelineEntry,
        addTicketWorkLog,
        addTicketFollowUp,
        addTicketWhatsAppLog,
        addTicketTrainingLog,
        addClient,
        addUser,

        updateUser,
        deactivateUser,
        deleteUser,
        resetUserPassword,
        refreshUsers,
        refreshClients,
        updateClientUrl,
        isSheetSyncModalOpen,
        setSheetSyncModalOpen,
        openSheetSyncModal,
        importSheetRowData,
        language,
        setLanguage,
        activeTheme,
        setActiveTheme,
        branding: TEDOS_BRAND_ASSETS,
        config: ACTIVE_CONFIG,
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
