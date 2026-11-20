/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  UserRole,
  ModuleId,
  User,
  AppNotification,
  SupportClient,
  WorkLogEntry,
  FollowUpTracker,
  Ticket,
  TimelineEntryType,
  WhatsAppLogMetadata,
  TrainingLogEntry,
  UserCreate,
  OverServiceEntry,
  InternalMessage,
  ActiveWorkLogSession,
  ShiftRecord
} from '../types';
import { ThemeType } from '../config/theme';
import { BrandAssetConfig } from '../config/branding';
import { AppConfiguration } from '../config/appConfig';
import { CreateClientRequest } from '../utils/apiGateway';

export interface AppContextType {
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
  loginWithCredentials: (
    identifier: string,
    pass: string
  ) => Promise<{ success: boolean; error?: { en: string; ur: string }; user?: User }>;
  logoutUser: () => void;
  addWorkLog: (
    log: Partial<WorkLogEntry> &
      Pick<WorkLogEntry, 'clientId' | 'clientName' | 'category' | 'details' | 'durationMinutes' | 'status'>
  ) => Promise<{ success: boolean; message?: string } | void>;
  addFollowUp: (
    followUp: Partial<FollowUpTracker> &
      Pick<FollowUpTracker, 'clientId' | 'clientName' | 'reason' | 'priority'>,
    options?: { skipGasSync?: boolean }
  ) => void;
  updateFollowUp: (id: string, updates: Partial<FollowUpTracker>) => void;
  updateClientStatus: (clientId: string, status: 'Critical' | 'Warning' | 'Active' | 'Inactive') => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isBlankWorkspace: boolean;
  setIsBlankWorkspace: (blank: boolean) => void;

  // Enterprise Ticket System operations
  addTicket: (
    ticket: Omit<
      Ticket,
      'id' | 'createdDate' | 'updatedDate' | 'timeline' | 'workLogs' | 'followUps' | 'whatsappLogs' | 'trainingLogs' | 'attachments'
    >
  ) => Promise<Ticket> | void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  addTicketTimelineEntry: (ticketId: string, type: TimelineEntryType, notes: string) => void;
  addTicketWorkLog: (
    ticketId: string,
    log: Omit<WorkLogEntry, 'id' | 'ticketId' | 'timestamp' | 'date' | 'time' | 'syncStatus'>
  ) => void;
  addTicketFollowUp: (
    ticketId: string,
    followUp: Omit<FollowUpTracker, 'id' | 'ticketId' | 'syncStatus'>
  ) => void;
  addTicketWhatsAppLog: (
    ticketId: string,
    log: Omit<WhatsAppLogMetadata, 'id' | 'timestamp' | 'status'>
  ) => void;
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

  // Internal Team Communication & Messaging Center
  internalMessages: InternalMessage[];
  sendInternalMessage: (
    msg: Omit<InternalMessage, 'id' | 'timestamp' | 'read' | 'readBy'>
  ) => Promise<InternalMessage>;
  markInternalMessageAsRead: (messageId: string) => Promise<void>;
  deleteInternalMessage: (messageId: string) => Promise<void>;
  refreshInternalMessages: () => Promise<void>;
  unreadMessagesCount: number;

  // Interactive Demo & Walkthrough Guide
  isDemoGuideOpen: boolean;
  setDemoGuideOpen: (open: boolean) => void;
  demoActiveModule: ModuleId | null;
  openDemoForModule: (module?: ModuleId) => void;

  // Google Maps Location Review & Feedback Sync Modal
  isGoogleReviewModalOpen: boolean;
  setGoogleReviewModalOpen: (open: boolean) => void;
  reviewModalClient: SupportClient | null;
  openGoogleReviewModal: (client?: SupportClient | null) => void;

  // Data Export, Reports & Backup/Restore
  isBackupModalOpen: boolean;
  setBackupModalOpen: (open: boolean) => void;
  openBackupModal: (module?: ModuleId) => void;

  // Safe Testing URL Modal
  isShareTestModalOpen: boolean;
  setShareTestModalOpen: (open: boolean) => void;
  openShareTestModal: () => void;

  // Pending Google Meet Proof Links Manager
  isPendingProofModalOpen: boolean;
  setPendingProofModalOpen: (open: boolean) => void;
  openPendingProofModal: () => void;
  updateWorkLogProofLink: (logId: string, proofUrl: string) => Promise<boolean>;

  // Navigation & Refresh
  goBack: () => void;
  goForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  refreshCurrentView: () => Promise<void>;
  isRefreshing: boolean;

  // Client URL & Login Configuration
  updateClientUrl: (identifier: string, newUrl: string, login?: string, remarks?: string) => Promise<void>;
  isSheetSyncModalOpen: boolean;
  setSheetSyncModalOpen: (open: boolean) => void;
  openSheetSyncModal: () => void;
  importSheetRowData: (tsvText: string) => Promise<{ count: number; importedClients: string[] }>;

  // Active Work Log Session State
  activeLogSession: ActiveWorkLogSession | null;
  updateActiveLogSession: (updates: Partial<ActiveWorkLogSession> | null) => void;
  clearActiveLogSession: () => void;

  // Shift Management & Attendance Timing
  shifts: ShiftRecord[];
  activeTodayShift: ShiftRecord | null;
  startDailyShift: (
    customStartTime?: string,
    notes?: string,
    targetShiftMinutes?: number
  ) => Promise<ShiftRecord>;
  endDailyShift: (
    shiftId?: string,
    customEndTime?: string,
    breakMinutes?: number,
    notes?: string,
    customStartTime?: string
  ) => Promise<ShiftRecord | null>;
  updateShiftRecord: (shiftId: string, updates: Partial<ShiftRecord>) => Promise<ShiftRecord | null>;

  // Dynamic configurations & language
  language: 'en' | 'ur';
  setLanguage: (lang: 'en' | 'ur') => void;
  activeTheme: ThemeType;
  setActiveTheme: (theme: ThemeType) => void;
  branding: BrandAssetConfig;
  config: AppConfiguration;
}
