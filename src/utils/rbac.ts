import { UserRole, ModuleId } from '../types';

export enum Permission {
  // Clients
  CREATE_CLIENT = 'CREATE_CLIENT',
  EDIT_CLIENT = 'EDIT_CLIENT',
  DELETE_CLIENT = 'DELETE_CLIENT',
  ASSIGN_CLIENT = 'ASSIGN_CLIENT',
  VIEW_CLIENTS = 'VIEW_CLIENTS',

  // Tickets
  VIEW_TICKETS = 'VIEW_TICKETS',
  MANAGE_TICKETS = 'MANAGE_TICKETS',
  UPDATE_TICKETS = 'UPDATE_TICKETS',
  
  // Reports
  VIEW_REPORTS = 'VIEW_REPORTS',
  
  // System
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  
  // Work/Follow-up
  CREATE_WORK_LOG = 'CREATE_WORK_LOG',
  CREATE_FOLLOW_UP = 'CREATE_FOLLOW_UP',
  
  // Notifications
  VIEW_NOTIFICATIONS = 'VIEW_NOTIFICATIONS',
}

const STORAGE_KEY = 'tedos_role_module_access';

// All configurable modules
export const ALL_CONFIGURABLE_MODULES: { id: ModuleId; labelEn: string; labelUr: string; category: string }[] = [
  { id: ModuleId.DASHBOARD, labelEn: 'Operational Dashboard', labelUr: 'ڈیش بورڈ (اوور ویو)', category: 'Core' },
  { id: ModuleId.SUPPORT_EXECUTIVE_DASHBOARD, labelEn: 'Support Executive Workspace', labelUr: 'سپورٹ ایگزیکٹو ورک اسپیس', category: 'Support' },
  { id: ModuleId.DAILY_WORK_LOG, labelEn: 'Daily Work Log', labelUr: 'روزانہ ورک لاگ اندراج', category: 'Support' },
  { id: ModuleId.WORK_LOG_HISTORY, labelEn: 'Work Log History & Command Center', labelUr: 'ورک لاگ ہسٹری و کمانڈ سینٹر', category: 'Support' },
  { id: ModuleId.MY_CLIENTS, labelEn: 'My Assigned Clients', labelUr: 'میرے تفویض کردہ کلائنٹس', category: 'Clients' },
  { id: ModuleId.CLIENTS, labelEn: 'Master Clients Directory', labelUr: 'کلائنٹس کی مکمل ڈائریکٹری', category: 'Clients' },
  { id: ModuleId.CLIENT_ACTIVATION, labelEn: 'Client Activation', labelUr: 'نیا کلائنٹ فعال کریں', category: 'Clients' },
  { id: ModuleId.CLIENT_WORKSPACE, labelEn: 'Client Workspace', labelUr: 'کلائنٹ ورک اسپیس', category: 'Clients' },
  { id: ModuleId.TICKETS, labelEn: 'Ticket Center', labelUr: 'ٹکٹ مینیجمنٹ سینٹر', category: 'Support' },
  { id: ModuleId.FOLLOW_UP, labelEn: 'Follow-up Tracker', labelUr: 'کلائنٹ فالو اپس ٹریکر', category: 'Support' },
  { id: ModuleId.WHATSAPP, labelEn: 'WhatsApp KPI & Automation', labelUr: 'واٹس ایپ کے پی آئی و آٹومیشن', category: 'Communication' },
  { id: ModuleId.POLICIES, labelEn: '28-Rule Policies & Notices', labelUr: 'کمپنی پالیسیز و قواعد', category: 'Compliance' },
  { id: ModuleId.TRAINING, labelEn: 'Training & Resources', labelUr: 'تربیت و رہنمائی وسائل', category: 'Resources' },
  { id: ModuleId.NOTIFICATIONS, labelEn: 'Executive Inbox & Notifications', labelUr: 'ایگزیکٹو ان باکس و نوٹیفیکیشنز', category: 'System' },
  { id: ModuleId.PAYROLL, labelEn: 'Payroll & Attendance Portal', labelUr: 'تنخواہ و حاضری پورٹل', category: 'Administration' },
  { id: ModuleId.OVER_SERVICE, labelEn: 'Over Service (DLT / Payment / WhatsApp API)', labelUr: 'اوور سروس (DLT / پیمنٹ گیٹ وے / واٹس ایپ API)', category: 'Services' },
  { id: ModuleId.REPORTS, labelEn: 'Export & Reports Center', labelUr: 'ایکسپورٹ اور رپورٹس سینٹر', category: 'Analytics' },
  { id: ModuleId.COO_DASHBOARD, labelEn: 'Leadership Audit & Work Log Review', labelUr: 'لیڈرشپ آڈٹ و ورک لاگ ریویو', category: 'Leadership' },
  { id: ModuleId.USER_MANAGEMENT, labelEn: 'Team User Management', labelUr: 'ٹیم یوزر مینیجمنٹ', category: 'Administration' },
  { id: ModuleId.ROLE_MANAGEMENT, labelEn: 'Rule & Permission Management', labelUr: 'رول و پرمیشن مینیجمنٹ', category: 'Administration' },
  { id: ModuleId.SETTINGS, labelEn: 'System Settings', labelUr: 'سسٹم کنفیگریشن و سیٹنگز', category: 'Administration' },
  { id: ModuleId.CLIENT_USAGE_BILLING, labelEn: 'Client Details & Usage (Billing)', labelUr: 'کلائنٹ تفصیلات، بلنگ و استعمال', category: 'Administration' },
  { id: ModuleId.AI_ASSISTANT, labelEn: 'AI Support Assistant', labelUr: 'اے آئی سپورٹ اسسٹنٹ', category: 'AI' },
  { id: ModuleId.AI_MESSAGE_STUDIO, labelEn: 'AI Polish & Readymade Messages', labelUr: 'اے آئی پالش اور ریڈی میڈ پیغامات', category: 'AI' },
];

export const ALL_MODULE_IDS = ALL_CONFIGURABLE_MODULES.map(m => m.id);

// Executive Leadership Modules (Audit, Master Directory, Command Center, Over Service, Settings)
// Explicitly excludes personal Support Executive modules: DAILY_WORK_LOG, MY_CLIENTS, SUPPORT_EXECUTIVE_DASHBOARD
const LEADERSHIP_MODULE_IDS: ModuleId[] = [
  ModuleId.DASHBOARD,
  ModuleId.COO_DASHBOARD,
  ModuleId.WORK_LOG_HISTORY,
  ModuleId.CLIENTS,
  ModuleId.CLIENT_WORKSPACE,
  ModuleId.CLIENT_ACTIVATION,
  ModuleId.TICKETS,
  ModuleId.OVER_SERVICE,
  ModuleId.FOLLOW_UP,
  ModuleId.POLICIES,
  ModuleId.TRAINING,
  ModuleId.WHATSAPP,
  ModuleId.PAYROLL,
  ModuleId.REPORTS,
  ModuleId.NOTIFICATIONS,
  ModuleId.USER_MANAGEMENT,
  ModuleId.ROLE_MANAGEMENT,
  ModuleId.CLIENT_USAGE_BILLING,
  ModuleId.SETTINGS,
  ModuleId.AI_ASSISTANT
];

// Default Module Access Matrix
export const DEFAULT_ROLE_MODULE_ACCESS: Record<UserRole, ModuleId[]> = {
  [UserRole.DIRECTOR]: LEADERSHIP_MODULE_IDS,
  [UserRole.COO]: LEADERSHIP_MODULE_IDS,
  [UserRole.OPERATION_MANAGER]: LEADERSHIP_MODULE_IDS,
  [UserRole.AI_ADMINISTRATOR]: ALL_MODULE_IDS,
  
  // Support Manager
  [UserRole.SUPPORT_MANAGER]: [
    ModuleId.DASHBOARD,
    ModuleId.SUPPORT_EXECUTIVE_DASHBOARD,
    ModuleId.OVER_SERVICE,
    ModuleId.COO_DASHBOARD,
    ModuleId.WORK_LOG_HISTORY,
    ModuleId.TICKETS,
    ModuleId.CLIENTS,
    ModuleId.MY_CLIENTS,
    ModuleId.CLIENT_ACTIVATION,
    ModuleId.CLIENT_WORKSPACE,
    ModuleId.FOLLOW_UP,
    ModuleId.USER_MANAGEMENT,
    ModuleId.ROLE_MANAGEMENT,
    ModuleId.POLICIES,
    ModuleId.TRAINING,
    ModuleId.WHATSAPP,
    ModuleId.REPORTS,
    ModuleId.NOTIFICATIONS,
    ModuleId.PAYROLL,
    ModuleId.AI_ASSISTANT,
    ModuleId.AI_MESSAGE_STUDIO
  ],

  // Support Executive: Exactly the user-specified pages (No Team Management, No Export Data)
  [UserRole.SUPPORT_EXECUTIVE]: [
    ModuleId.DAILY_WORK_LOG,
    ModuleId.DASHBOARD,
    ModuleId.TICKETS,
    ModuleId.MY_CLIENTS,
    ModuleId.POLICIES,
    ModuleId.TRAINING,
    ModuleId.NOTIFICATIONS,
    ModuleId.FOLLOW_UP,
    ModuleId.WHATSAPP,
    ModuleId.PAYROLL,
    ModuleId.AI_MESSAGE_STUDIO
  ],

  [UserRole.TECHNICAL_TEAM]: [
    ModuleId.DASHBOARD,
    ModuleId.TICKETS,
    ModuleId.CLIENTS,
    ModuleId.CLIENT_WORKSPACE,
    ModuleId.DAILY_WORK_LOG,
    ModuleId.OVER_SERVICE,
    ModuleId.FOLLOW_UP,
    ModuleId.POLICIES,
    ModuleId.TRAINING,
    ModuleId.NOTIFICATIONS,
    ModuleId.AI_ASSISTANT
  ],

  [UserRole.MARKETING_EXECUTIVE]: [
    ModuleId.DASHBOARD,
    ModuleId.CLIENTS,
    ModuleId.POLICIES,
    ModuleId.TRAINING,
    ModuleId.WHATSAPP,
    ModuleId.NOTIFICATIONS
  ],

  [UserRole.FRANCHISE_COORDINATOR]: [
    ModuleId.DASHBOARD,
    ModuleId.CLIENTS,
    ModuleId.TICKETS,
    ModuleId.POLICIES,
    ModuleId.TRAINING,
    ModuleId.NOTIFICATIONS
  ],

  [UserRole.FINANCE]: [
    ModuleId.DASHBOARD,
    ModuleId.CLIENTS,
    ModuleId.REPORTS,
    ModuleId.POLICIES,
    ModuleId.NOTIFICATIONS
  ],

  [UserRole.CEO]: ALL_MODULE_IDS,
};

// Retrieve configured or default role permissions
export const getRoleModulePermissions = (): Record<UserRole, ModuleId[]> => {
  if (typeof window === 'undefined') return DEFAULT_ROLE_MODULE_ACCESS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults so no roles or newly added modules are lost
      const merged: Record<UserRole, ModuleId[]> = { ...DEFAULT_ROLE_MODULE_ACCESS, ...parsed };
      // Directors, COOs, and Operation Managers always have 100% full access
      merged[UserRole.DIRECTOR] = ALL_MODULE_IDS;
      merged[UserRole.COO] = ALL_MODULE_IDS;
      merged[UserRole.OPERATION_MANAGER] = ALL_MODULE_IDS;
      merged[UserRole.AI_ADMINISTRATOR] = ALL_MODULE_IDS;
      // Ensure Support Manager has Over Service and does not have Daily Work Log by default unless explicitly re-checked
      if (merged[UserRole.SUPPORT_MANAGER]) {
        if (!merged[UserRole.SUPPORT_MANAGER].includes(ModuleId.OVER_SERVICE)) {
          merged[UserRole.SUPPORT_MANAGER].push(ModuleId.OVER_SERVICE);
        }
        if (!merged[UserRole.SUPPORT_MANAGER].includes(ModuleId.COO_DASHBOARD)) {
          merged[UserRole.SUPPORT_MANAGER].push(ModuleId.COO_DASHBOARD);
        }
        if (!merged[UserRole.SUPPORT_MANAGER].includes(ModuleId.USER_MANAGEMENT)) {
          merged[UserRole.SUPPORT_MANAGER].push(ModuleId.USER_MANAGEMENT);
        }
        merged[UserRole.SUPPORT_MANAGER] = merged[UserRole.SUPPORT_MANAGER].filter(m => m !== ModuleId.DAILY_WORK_LOG);
      }
      // Ensure Support Executive has user-specified modules
      if (merged[UserRole.SUPPORT_EXECUTIVE]) {
        if (!merged[UserRole.SUPPORT_EXECUTIVE].includes(ModuleId.MY_CLIENTS)) {
          merged[UserRole.SUPPORT_EXECUTIVE].push(ModuleId.MY_CLIENTS);
        }
        if (!merged[UserRole.SUPPORT_EXECUTIVE].includes(ModuleId.PAYROLL)) {
          merged[UserRole.SUPPORT_EXECUTIVE].push(ModuleId.PAYROLL);
        }
        // Strictly exclude Team Management and Reports/Export per requirement #4
        merged[UserRole.SUPPORT_EXECUTIVE] = merged[UserRole.SUPPORT_EXECUTIVE].filter(
          m => m !== ModuleId.USER_MANAGEMENT && m !== ModuleId.REPORTS && m !== ModuleId.CLIENT_ACTIVATION
        );
      }
      return merged;
    }
  } catch (e) {
    console.error('Failed to load role module permissions', e);
  }
  return DEFAULT_ROLE_MODULE_ACCESS;
};

// Save updated permissions to localStorage and notify the system
export const saveRoleModulePermissions = (rules: Record<UserRole, ModuleId[]>): void => {
  if (typeof window === 'undefined') return;
  try {
    // Ensure Director, COO and AI Admin always retain all modules
    const validatedRules = {
      ...rules,
      [UserRole.DIRECTOR]: ALL_MODULE_IDS,
      [UserRole.COO]: ALL_MODULE_IDS,
      [UserRole.AI_ADMINISTRATOR]: ALL_MODULE_IDS,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validatedRules));
    window.dispatchEvent(new Event('tedos_permissions_updated'));
    // Asynchronously sync to Node.js server so all devices share the rules
    fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validatedRules)
    }).catch(err => console.warn('[RBAC] Server roles sync notice:', err));
  } catch (e) {
    console.error('Failed to save role module permissions', e);
  }
};

export const can = (role: UserRole | undefined, permission: Permission): boolean => {
  if (!role) return false;
  if (role === UserRole.DIRECTOR || role === UserRole.COO || role === UserRole.OPERATION_MANAGER || role === UserRole.AI_ADMINISTRATOR) {
    return true;
  }
  // Basic capability checks
  if (role === UserRole.SUPPORT_EXECUTIVE) {
    if (permission === Permission.MANAGE_USERS || permission === Permission.MANAGE_SETTINGS || permission === Permission.DELETE_CLIENT || permission === Permission.CREATE_CLIENT) {
      return false;
    }
  }
  if (role === UserRole.SUPPORT_MANAGER) {
    if (permission === Permission.MANAGE_SETTINGS || permission === Permission.DELETE_CLIENT) {
      return false;
    }
  }
  return true;
};

// Check if a role has access to a specific module
export const canAccessModule = (role: UserRole | undefined, moduleId: ModuleId): boolean => {
  if (!role) return false;
  if (moduleId === ModuleId.LOGIN) return true;
  
  // AI Administrator retains unrestricted access to the entire software
  if (role === UserRole.AI_ADMINISTRATOR) {
    return true;
  }

  // Check custom/configured module permissions for the specific role
  const permissions = getRoleModulePermissions();
  const allowedModules = permissions[role] || DEFAULT_ROLE_MODULE_ACCESS[role];
  if (!allowedModules) return false;

  return allowedModules.includes(moduleId);
};
