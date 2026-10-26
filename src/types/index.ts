/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  CEO = 'CEO',
  COO = 'COO',
  OPERATION_MANAGER = 'Operation Manager',
  SUPPORT_MANAGER = 'Support Manager',
  SUPPORT_EXECUTIVE = 'Support Executive',
  MARKETING_EXECUTIVE = 'Marketing Executive',
  FRANCHISE_COORDINATOR = 'Franchise Coordinator',
  TECHNICAL_TEAM = 'Technical Team',
  FINANCE = 'Finance',
  AI_ADMINISTRATOR = 'AI Administrator',
  DIRECTOR = 'Director',
}

export enum ModuleId {
  LOGIN = 'login',
  DASHBOARD = 'dashboard',
  COO_DASHBOARD = 'coo_dashboard',
  SUPPORT_EXECUTIVE_DASHBOARD = 'support_executive_dashboard',
  TICKETS = 'tickets',
  CLIENTS = 'clients',
  MY_CLIENTS = 'my_clients',
  CLIENT_ACTIVATION = 'client_activation',
  CLIENT_WORKSPACE = 'workspace',
  DAILY_WORK_LOG = 'worklog',
  WORK_LOG_HISTORY = 'worklog_history',
  OVER_SERVICE = 'over_service',
  FOLLOW_UP = 'followup',
  TRAINING = 'training',
  WHATSAPP = 'whatsapp',
  REPORTS = 'reports',
  NOTIFICATIONS = 'notifications',
  EXECUTIVE_INBOX = 'executive_inbox',
  AI_ASSISTANT = 'ai_assistant',
  AI_MESSAGE_STUDIO = 'ai_message_studio',
  SETTINGS = 'settings',
  USER_MANAGEMENT = 'user_management',
  ROLE_MANAGEMENT = 'role_management',
  POLICIES = 'policies',
  PAYROLL = 'payroll',
}

export enum UserStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  SUSPENDED = 'Suspended',
}

export interface User {
  id: string;
  employeeId: string;
  name: string;
  designation: string;
  email: string;
  mobile: string;
  role: UserRole;
  department: string;
  reportingManager: string;
  assignedRegion: string;
  assignedClients: string[];
  status: UserStatus;
  joiningDate: string;
  lastLogin: string;
  active: boolean;
  avatarUrl?: string;
  password?: string;
  aliases?: string[];
  baseSalary?: number;
  monthlyIncentive?: number;
  isFreelancer?: boolean;
}

export interface UserCreate {
  employeeId: string;
  name: string;
  designation: string;
  email: string;
  mobile: string;
  role: UserRole;
  department: string;
  reportingManager: string;
  assignedRegion: string;
  joiningDate: string;
  password?: string;
  assignedClients?: string[];
  baseSalary?: number;
  monthlyIncentive?: number;
  isFreelancer?: boolean;
}

export interface UserUpdate extends Partial<UserCreate> {
  id: string;
  status?: UserStatus;
  active?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface Session {
  user: User;
  tokens: AuthTokens;
  rememberMe: boolean;
}

export enum ClientLifecycleStatus {
  LEAD = 'Lead',
  PROSPECT = 'Prospect',
  ACTIVE = 'Active',
  SUSPENDED = 'Suspended',
  CHURNED = 'Churned',
}

export interface Subscription {
  id: string;
  plan: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired' | 'Cancelled';
}

export interface Product {
  id: string;
  name: string;
  features: string[];
  subscriptionId?: string;
}

export interface Assignment {
  userId: string;
  role: string;
  assignedDate: string;
}

export interface EnterpriseHook {
  id: string;
  type: 'WhatsApp' | 'DLT' | 'Email' | 'ERP';
  enabled: boolean;
  config: Record<string, string>;
}

export interface SupportClient {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  status: 'Critical' | 'Warning' | 'Active' | 'Inactive';
  lifecycleStatus: ClientLifecycleStatus;
  subscriptions: Subscription[];
  products: Product[];
  assignments: Assignment[];
  enterpriseHooks: EnterpriseHook[];
  assignedExecutive: string;
  softwareDetails: {
    version: string;
    licenseType: string;
    expiryDate: string;
    lastBackupDate: string;
  };
  healthStatus: number; // 0 to 100
  recentActivityTimestamp: string;
  teId?: string;
  clientContact?: number | string;
  operatorContact?: number | string;
  assignedSupport?: string;
  department?: string;
  plan?: string;
  url?: string;
  deploymentUrl?: string;
  softwareUrl?: string;
  softwareLogin?: string;
  noteSaad?: string;
  specialManagerRemark?: string;
  monthlyIncentive?: string | number;
  lastWorkSummary?: string;
  clientSatisfactionKpi?: string;
  coPilotNote?: string;
  googleMapLink?: string;
  ultimateResponse1?: string;
  dltSmsStatus?: string;
  paymentGatewayStatus?: string;
  whatsappApiStatus?: string;
}

export interface MOU {
  id: string;
  startDate: string;
  endDate: string;
  documentUrl: string;
}

export interface Quotation {
  id: string;
  amount: number;
  date: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
}

export interface Invoice {
  id: string;
  amount: number;
  dueDate: string;
  status: 'Pending' | 'Paid' | 'Overdue';
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  method: 'Bank Transfer' | 'UPI' | 'Cheque';
}

export interface Receipt {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface PaymentGatewayConfig {
  merchantId: string;
  apiKey: string;
}

export interface WebsiteConfig {
  url: string;
  domain: string;
  hostingExpiry: string;
  sslExpiry: string;
  workspaceEmail: string;
}

export interface Client360 {
  id: string;
  name: string;
  basicInfo: {
    phone: string;
    email: string;
    address: string;
  };
  products: Product[];
  services: string[];
  mou: MOU[];
  quotations: Quotation[];
  invoices: Invoice[];
  payments: Payment[];
  receipts: Receipt[];
  trainingLogs: TrainingLogEntry[];
  supportTickets: Ticket[];
  developmentRequests: string[];
  documents: Document[];
  dltInfo: { registered: boolean; entityId: string };
  whatsappInfo: { enabled: boolean; number: string };
  paymentGateway: PaymentGatewayConfig;
  website: WebsiteConfig;
  assignments: {
    executiveId: string;
    managerId: string;
  };
  timeline: TicketTimelineEntry[];
}

export interface Client360Repository {
  getById: (id: string) => Promise<Client360 | null>;
  list: () => Promise<Client360[]>;
  update: (client: Client360) => Promise<Client360>;
}

export interface Client360Context {
  client: Client360 | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface WorkLogEntry {
  id: string;
  ticketId?: string;
  clientId: string;
  clientName: string;
  timestamp: string;
  date: string;
  time: string;
  executiveName: string;
  teId: string;
  category: string; // Maps to Work Type / Issue Category
  details: string; // Maps to Summary
  status: string; // Connected, Completed, Pending, Not Answering, Rescheduled, Escalated, Cancelled
  nextFollowUpDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  durationMinutes: number;
  remarks: string;
  syncStatus: 'Synchronized' | 'Pending Sync' | 'Pending Proof Sync';
  // GAS Integration fields
  issueCategory?: string;
  workType?: string;
  proofLink?: string;
  startTime?: string;
  endTime?: string;
  duration?: string;
  remarksClient?: string;
  supportName?: string;
  softwareUsage?: 'Regular User' | 'Not Using' | 'Need Training';
  approvalStatus?: 'Approved' | 'Pending' | 'Rejected';
  approvalRemark?: string;
  flagReason?: string;
  isProofPending?: boolean;
  proofPendingDate?: string;
  proofUpdatedAt?: string;
  internalNote?: string;
  managerRemark?: string;
  cooRemark?: string;
  executiveReply?: string;
  executiveReplyTimestamp?: string;
  saadNote?: string;
  specialManagerRemark?: string;
  proofMissingReason?: string;
  clientStatus?: 'Happy' | 'Unhappy';
  lastWorkSummary?: string;
  clientSatisfactionKpi?: string;
  monthlyIncentive?: string;
  coPilotNote?: string;
  callStatus?: string;
  workStatus?: string;
  clientStatusRisk?: 'Normal' | 'At Risk' | 'High Priority' | 'Unhappy' | 'Overdue';
}

export interface FollowUpTracker {
  id: string;
  ticketId?: string;
  clientId: string;
  clientName: string;
  teId: string;
  executiveName: string;
  scheduledDate: string; // Due Date
  scheduledTime: string; // Due Time
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  lastContactDate: string;
  status: 'Pending' | 'Completed' | 'Rescheduled' | 'Escalated' | 'Cancelled';
  reason: string; // Purpose
  remarks?: string;
  nextAction?: string;
  syncStatus: 'Synchronized' | 'Pending Sync';
}

export enum TicketStatus {
  NEW = 'New',
  ASSIGNED = 'Assigned',
  IN_PROGRESS = 'In Progress',
  WAITING_FOR_CUSTOMER = 'Waiting for Customer',
  FOLLOW_UP_SCHEDULED = 'Follow-up Scheduled',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed',
  REOPENED = 'Reopened',
  ON_HOLD = 'On Hold',
  ESCALATED = 'Escalated',
  CANCELLED = 'Cancelled',
}

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export enum IssueCategory {
  TECHNICAL = 'Technical',
  BILLING = 'Billing',
  FEATURE_REQUEST = 'Feature Request',
  TRAINING = 'Training',
  DOMAIN_HOSTING = 'Domain & Hosting',
  OTHER = 'Other',
}

export enum IssueType {
  BUG = 'Bug',
  REQUEST = 'Request',
  QUERY = 'Query',
}

export enum EscalationStatus {
  NONE = 'None',
  LEVEL1 = 'Level 1',
  LEVEL2 = 'Level 2',
  MANAGEMENT = 'Management',
}

export enum DevApprovalStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export interface TicketComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  isInternal: boolean;
}

export interface TransitionHistoryEntry {
  id: string;
  fromStatus: TicketStatus;
  toStatus: TicketStatus;
  timestamp: string;
  performedBy: string; // UserId
  notes: string;
}

export interface WorkflowHook {
  id: string;
  type: 'WhatsApp' | 'DLT' | 'Email';
  enabled: boolean;
  config: Record<string, string>;
}

export type TimelineEntryType =
  | 'Ticket Created'
  | 'Assigned'
  | 'Work Log Added'
  | 'Follow-up Scheduled'
  | 'WhatsApp Sent'
  | 'Training Conducted'
  | 'Issue Escalated'
  | 'Resolved'
  | 'Closed';

export interface TicketTimelineEntry {
  id: string;
  type: TimelineEntryType;
  timestamp: string; // ISO date-time
  performedBy: string; // Executive or User name
  notes: string;
}

export interface WhatsAppLogMetadata {
  id: string;
  templateId: string;
  templateName: string;
  timestamp: string; // ISO string
  recipientPhone: string;
  status: 'Sent' | 'Delivered' | 'Read';
  text: string;
}

export interface TrainingLogEntry {
  id: string;
  topic: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  attendeesCount: number;
  notes?: string;
  conductedBy: string;
}

export interface AttachmentArchitecture {
  id: string;
  name: string;
  sizeBytes: number;
  fileType: 'Image' | 'PDF' | 'Video' | 'Document';
  uploadedAt: string; // ISO string
  uploadedBy: string;
}

export interface Ticket {
  id: string; // Auto-generated ID (TKT-YYYY-XXXX)
  teId: string; // Connected Technical Executive Code
  clientId: string;
  clientName: string;
  productId: string;
  issueCategory: IssueCategory;
  issueType: IssueType;
  issueDescription: string;
  priority: TicketPriority;
  status: TicketStatus;
  slaExpiry: string;
  escalationStatus: EscalationStatus;
  devApprovalStatus: DevApprovalStatus;
  requiresTraining: boolean;
  assignedExecutive: string; // Matches User or Executive Name
  createdBy: string;
  createdDate: string; // YYYY-MM-DD
  updatedDate: string; // YYYY-MM-DD
  resolutionSummary?: string;
  closedDate?: string;
  
  // Embedded workflows for zero-orphan strict containment
  history: TransitionHistoryEntry[];
  timeline: TicketTimelineEntry[];
  workLogs: WorkLogEntry[];
  followUps: FollowUpTracker[];
  whatsappLogs: WhatsAppLogMetadata[];
  trainingLogs: TrainingLogEntry[];
  attachments: AttachmentArchitecture[];
  internalComments: TicketComment[];
  raisedBy?: string;
  fromRole?: string;
  assignedToRole?: string;
  solvedBy?: string;
  attachmentUrl?: string;
  ultimateResponse1?: string;
}

export interface OverServiceEntry {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  executiveName: string;
  dltSms: string;
  dltEntityId?: string;
  paymentGateway: string;
  paymentMerchantId?: string;
  whatsappApi: string;
  whatsappWabaNumber?: string;
  overServiceDetails: string;
  status: 'Active' | 'Pending' | 'In Progress' | 'Completed';
  remarks?: string;
}

export interface TicketCreate extends Omit<Ticket, 'id' | 'history' | 'timeline' | 'workLogs' | 'followUps' | 'whatsappLogs' | 'trainingLogs' | 'attachments' | 'internalComments' | 'createdDate' | 'updatedDate'> {}

export interface TicketUpdate extends Partial<Omit<Ticket, 'id' | 'history' | 'timeline' | 'workLogs' | 'followUps' | 'whatsappLogs' | 'trainingLogs' | 'attachments' | 'internalComments'>> {}

export interface TicketRepository {
  getById: (id: string) => Promise<Ticket | null>;
  list: () => Promise<Ticket[]>;
  create: (ticket: TicketCreate) => Promise<Ticket>;
  update: (id: string, ticket: TicketUpdate) => Promise<Ticket>;
}

export interface TicketWorkflowService {
  escalate: (ticketId: string, level: EscalationStatus) => Promise<Ticket>;
  requestDevApproval: (ticketId: string) => Promise<Ticket>;
  approveDev: (ticketId: string) => Promise<Ticket>;
  routeToTraining: (ticketId: string) => Promise<Ticket>;
}


export enum SOPStatus { DRAFT = 'Draft', APPROVED = 'Approved', DEPRECATED = 'Deprecated' }
export enum SOPSeverity { LOW = 'Low', MEDIUM = 'Medium', HIGH = 'High', CRITICAL = 'Critical' }
export enum ArticleStatus { DRAFT = 'Draft', PUBLISHED = 'Published', ARCHIVED = 'Archived' }

export interface ResolutionStep {
  stepNumber: number;
  title: string;
  description: string;
  expectedResult: string;
  isMandatory: boolean;
  estimatedTimeMinutes: number;
}

export interface SOP {
  id: string;
  title: string;
  productId: string;
  module: string;
  issueCategory: IssueCategory;
  issueType: IssueType;
  severity: SOPSeverity;
  version: string;
  status: SOPStatus;
  createdBy: string;
  approvedBy?: string;
  lastUpdated: string;
  resolutionChecklist: ResolutionStep[];
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  productId: string;
  category: string;
  keywords: string[];
  symptoms: string[];
  rootCause: string;
  solution: string;
  attachments: AttachmentArchitecture[];
  relatedSopIds: string[];
  relatedTicketIds: string[];
  tags: string[];
  status: ArticleStatus;
}

export interface KnownIssue {
  id: string;
  productId: string;
  description: string;
  temporaryWorkaround: string;
  permanentFix: string;
  fixedVersion: string;
  releaseNotes: string;
}

export interface ResolutionTemplate {
  id: string;
  name: string;
  internalResolution: string;
  customerResponse: string;
  whatsappTemplateReference: string;
  emailTemplateReference: string;
}

export interface TicketKnowledgeMapping {
  ticketId: string;
  sopId?: string;
  kbArticleId?: string;
  knownIssueId?: string;
  templateId?: string;
}

export interface KnowledgeRepository {
  listSops: () => Promise<SOP[]>;
  listArticles: () => Promise<KnowledgeArticle[]>;
  listKnownIssues: () => Promise<KnownIssue[]>;
  listTemplates: () => Promise<ResolutionTemplate[]>;
  search: (query: string, criteria: Record<string, string>) => Promise<any[]>;
}

export interface KnowledgeContext {
  sops: SOP[];
  articles: KnowledgeArticle[];
  knownIssues: KnownIssue[];
  templates: ResolutionTemplate[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface TicketContext {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createTicket: (data: TicketCreate) => Promise<void>;
  updateTicket: (id: string, data: TicketUpdate) => Promise<void>;
}

export interface InternalMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string; // 'ALL' or userId or role
  recipientName: string;
  recipientRole?: string;
  recipientType: 'individual' | 'role' | 'all';
  subject: string;
  body: string;
  priority: 'Normal' | 'Important' | 'Urgent';
  timestamp: string;
  date?: string;
  time?: string;
  read: boolean;
  readBy?: string[];
  clientId?: string;
  clientName?: string;
  ticketId?: string;
  replyToId?: string;
}

export interface ActiveWorkLogSession {
  clientId: string;
  clientName: string;
  teId: string;
  startTime: string; // "15:55:00"
  startTimestamp: number; // Date.now()
  isTimerRunning: boolean;
  issueCategory: string;
  workType: string;
  callStatus: string;
  summary: string;
  clientStatus: 'Happy' | 'Unhappy' | '';
  endTime: string;
  durationMinutes: number;
  durationFormatted: string;
  proofLink: string;
  hasProofDropdown: 'yes_now' | 'pending' | 'no';
  strongReason: string;
  nextFollowUpDate: string;
}

