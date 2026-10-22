/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppLanguage = 'en' | 'ur';

export interface TranslationDictionary {
  // Navigation & Modules
  dashboard: string;
  cooOperations: string;
  executiveWorkspace: string;
  ticketCenter: string;
  clients: string;
  activateClient: string;
  dailyWorkLog: string;
  followUps: string;
  policiesNotice: string;
  trainingResources: string;
  whatsappAutomation: string;
  reportsAnalytics: string;
  notifications: string;
  aiAssistant: string;
  userManagement: string;
  systemSettings: string;
  payrollPortal: string;
  
  // Login View
  welcomeTitle: string;
  welcomeSubtitle: string;
  selectRole: string;
  loginButton: string;
  payrollNotice: string;
  markAttendanceFirst: string;
  
  // Daily Work Log
  logFormTitle: string;
  clientLabel: string;
  executiveLabel: string;
  logDateLabel: string;
  durationLabel: string;
  summaryLabel: string;
  proofLinkLabel: string;
  softwareUsageLabel: string;
  submitLogBtn: string;
  submittingBtn: string;
  duplicateWarning: string;
  
  // User Management
  addUserBtn: string;
  resetPasswordBtn: string;
  deleteUserBtn: string;
  deactivateBtn: string;
  activeStatus: string;
  inactiveStatus: string;
  searchUsersPlaceholder: string;
  confirmDeleteUser: string;
  
  // General Actions
  save: string;
  cancel: string;
  logout: string;
  viewAll: string;
  search: string;
  status: string;
  actions: string;
  role: string;
  name: string;
  email: string;
}

export const TRANSLATIONS: Record<AppLanguage, TranslationDictionary> = {
  en: {
    dashboard: 'Overview Dashboard',
    cooOperations: 'COO Operations & Productivity',
    executiveWorkspace: 'Executive Workspace',
    ticketCenter: 'Ticket Center',
    clients: 'Clients Directory',
    activateClient: 'Activate Client',
    dailyWorkLog: 'Daily Work Log',
    followUps: 'Follow-ups',
    policiesNotice: '28-Rule TE Operational Policies',
    trainingResources: 'Training & Resources',
    whatsappAutomation: 'WhatsApp Automation',
    reportsAnalytics: 'Reports & Analytics',
    notifications: 'System Notifications',
    aiAssistant: 'Gemini AI Guide & Demo',
    userManagement: 'Team User Management',
    systemSettings: 'System Settings',
    payrollPortal: 'Payroll & Attendance Portal ↗',
    
    welcomeTitle: 'Techno Evident Support',
    welcomeSubtitle: 'Secure digital operating portal for Philsof & Techno Evident',
    selectRole: 'Select an operational account to log in:',
    loginButton: 'Enter Workspace',
    payrollNotice: 'Notice: Please mark your daily attendance on Techno Evident Payroll Portal before logging support tasks.',
    markAttendanceFirst: 'Open Payroll Portal (technoevident.xyz)',
    
    logFormTitle: 'Submit Daily Support Work Log',
    clientLabel: 'Select Client',
    executiveLabel: 'Support Executive',
    logDateLabel: 'Log Date & Time',
    durationLabel: 'Duration (Minutes)',
    summaryLabel: 'Detailed Work Summary & Resolution',
    proofLinkLabel: 'Proof Link (Google Drive / Meet / Screenshot)',
    softwareUsageLabel: 'Client Software Usage Status',
    submitLogBtn: 'Commit Work Log to Database',
    submittingBtn: 'Submitting to Sheets...',
    duplicateWarning: '⚠️ Duplicate Proof Link: This link was already submitted in an earlier log.',
    
    addUserBtn: '+ Add Support Member',
    resetPasswordBtn: 'Reset Password',
    deleteUserBtn: 'Delete Member',
    deactivateBtn: 'Deactivate',
    activeStatus: 'Active',
    inactiveStatus: 'Inactive',
    searchUsersPlaceholder: 'Search team by name, email or employee ID...',
    confirmDeleteUser: 'Are you sure you want to remove this team member permanently?',
    
    save: 'Save Changes',
    cancel: 'Cancel',
    logout: 'Logout Session',
    viewAll: 'View All',
    search: 'Search...',
    status: 'Status',
    actions: 'Actions',
    role: 'Role',
    name: 'Name',
    email: 'Email',
  },
  ur: {
    dashboard: 'ڈیش بورڈ جائزہ',
    cooOperations: 'سی او او آپریشنز اور نگرانی',
    executiveWorkspace: 'ایگزیکٹو ورک اسپیس',
    ticketCenter: 'ٹکٹ سینٹر',
    clients: 'کلائنٹس لسٹ',
    activateClient: 'نیا کلائنٹ رجسٹر کریں',
    dailyWorkLog: 'روزانہ ورک لاگ (Daily Work Log)',
    followUps: 'فالو اپس (Follow-ups)',
    policiesNotice: 'ٹیکنو ایویڈنٹ 28 آپریشنل اصول و پالیسیز',
    trainingResources: 'تربیت و وسائل',
    whatsappAutomation: 'واٹس ایپ آٹومیشن',
    reportsAnalytics: 'رپورٹس اور تجزیات',
    notifications: 'اطلاعات و نوٹیفیکیشنز',
    aiAssistant: 'Gemini AI گائیڈ و ڈیمو',
    userManagement: 'ٹیم ممبرز مینیجمنٹ',
    systemSettings: 'سسٹم سیٹنگز',
    payrollPortal: 'پے رول و حاضری پورٹل ↗',
    
    welcomeTitle: 'ٹیکنو ایویڈنٹ سپورٹ سسٹم',
    welcomeSubtitle: 'محفوظ سپورٹ ڈیجیٹل سسٹم برائے فل سافٹ اور ٹیکنو ایویڈنٹ',
    selectRole: 'لاگ ان کرنے کے لیے کردار منتخب کریں:',
    loginButton: 'سسٹم میں داخل ہوں',
    payrollNotice: 'اہم اطلاع: سپورٹ ورک لاگ درج کرنے سے پہلے پے رول پورٹل پر اپنی حاضری (Attendance) ضرور درج کریں۔',
    markAttendanceFirst: 'حاضری پورٹل کھولیں (technoevident.xyz)',
    
    logFormTitle: 'روزانہ سپورٹ ورک لاگ اندراج',
    clientLabel: 'کلائنٹ منتخب کریں',
    executiveLabel: 'سپورٹ ایگزیکٹو',
    logDateLabel: 'تاریخ اور وقت',
    durationLabel: 'کام کا دورانیہ (منٹ)',
    summaryLabel: 'کام کی مکمل تفصیل اور حل (Summary)',
    proofLinkLabel: 'کام کا ثبوت لنک (گوگل ڈرائیو / میٹنگ لنک)',
    softwareUsageLabel: 'کلائنٹ کا سافٹ ویئر استعمال کا اسٹیٹس',
    submitLogBtn: 'ورک لاگ سسٹم میں محفوظ کریں',
    submittingBtn: 'محفوظ ہو رہا ہے...',
    duplicateWarning: '⚠️ انتباہ: یہ پروف لنک پہلے سے کسی لاگ میں استعمال ہو چکا ہے۔',
    
    addUserBtn: '+ نیا سپورٹ ممبر شامل کریں',
    resetPasswordBtn: 'پاس ورڈ ری سیٹ کریں',
    deleteUserBtn: 'ممبر ڈیلیٹ کریں',
    deactivateBtn: 'غیر فعال کریں',
    activeStatus: 'فعال (Active)',
    inactiveStatus: 'غیر فعال (Inactive)',
    searchUsersPlaceholder: 'نام، ای میل یا آئی ڈی سے تلاش کریں...',
    confirmDeleteUser: 'کیا آپ واقعی اس صارف کو ہمیشہ کے لیے ڈیلیٹ کرنا چاہتے ہیں؟',
    
    save: 'محفوظ کریں',
    cancel: 'منسوخ کریں',
    logout: 'لاگ آؤٹ',
    viewAll: 'تمام دیکھیں',
    search: 'تلاش کریں...',
    status: 'حیثیت (Status)',
    actions: 'اقدامات',
    role: 'عہدہ (Role)',
    name: 'نام',
    email: 'ای میل',
  },
};
