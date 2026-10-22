/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FallbackClient {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  status: 'Critical' | 'Warning' | 'Active' | 'Inactive';
  lifecycleStatus: string;
  subscriptions: any[];
  products: any[];
  assignments: any[];
  enterpriseHooks: any[];
  assignedExecutive: string;
  softwareDetails: {
    version: string;
    licenseType: string;
    expiryDate: string;
    lastBackupDate: string;
  };
  healthStatus: number;
  recentActivityTimestamp: string;
  teId: string;
  clientContact: string;
  operatorContact: string;
  assignedSupport: string;
  department: string;
  plan: string;
}

export const FALLBACK_CLIENTS: FallbackClient[] = [
  {
    id: 'TE-101',
    teId: 'TE-101',
    name: 'Al-Madina Supermarket',
    company: 'Al-Madina Supermarket & Wholesale',
    phone: '+91 98480 12345',
    email: 'madina.retail@technoevident.com',
    status: 'Active',
    lifecycleStatus: 'Active',
    subscriptions: [{ id: 'sub_1', plan: 'Marg ERP Enterprise', startDate: '2025-01-01', endDate: '2026-12-31', status: 'Active' }],
    products: [{ id: 'prod_1', name: 'Marg Retail POS', features: ['Barcode', 'Inventory', 'GST Billing'] }],
    assignments: [{ userId: 'usr-exec-1', role: 'Support Executive', assignedDate: '2025-01-01' }],
    enterpriseHooks: [],
    assignedExecutive: 'Syed Imran',
    softwareDetails: {
      version: 'Marg v9.3 Enterprise',
      licenseType: 'Multi-User Gold',
      expiryDate: '2026-12-31',
      lastBackupDate: new Date().toISOString().split('T')[0]
    },
    healthStatus: 94,
    recentActivityTimestamp: new Date().toISOString(),
    clientContact: '9848012345',
    operatorContact: '9848054321',
    assignedSupport: 'Syed Imran',
    department: 'Retail & Billing',
    plan: 'Marg ERP Enterprise'
  },
  {
    id: 'TE-102',
    teId: 'TE-102',
    name: 'Apex Pharmaceuticals',
    company: 'Apex Pharma & Healthcare Distributors',
    phone: '+91 91600 88888',
    email: 'apex.pharma@technoevident.com',
    status: 'Active',
    lifecycleStatus: 'Active',
    subscriptions: [{ id: 'sub_2', plan: 'TallyPrime Gold Multi-User', startDate: '2025-02-01', endDate: '2026-12-31', status: 'Active' }],
    products: [{ id: 'prod_2', name: 'TallyPrime Server', features: ['Batch Expiry', 'Drug License Audit', 'E-Invoicing'] }],
    assignments: [{ userId: 'usr-exec-2', role: 'Support Executive', assignedDate: '2025-02-01' }],
    enterpriseHooks: [],
    assignedExecutive: 'Ahmed Raza',
    softwareDetails: {
      version: 'TallyPrime Release 4.1',
      licenseType: 'Gold Multi-User',
      expiryDate: '2026-12-31',
      lastBackupDate: new Date().toISOString().split('T')[0]
    },
    healthStatus: 88,
    recentActivityTimestamp: new Date().toISOString(),
    clientContact: '9160088888',
    operatorContact: '9160099999',
    assignedSupport: 'Ahmed Raza',
    department: 'Pharma & Chemist',
    plan: 'TallyPrime Gold'
  },
  {
    id: 'TE-103',
    teId: 'TE-103',
    name: 'Deccan Steel Traders',
    company: 'Deccan Steel & Building Supplies Pvt Ltd',
    phone: '+91 98490 55555',
    email: 'deccan.steel@technoevident.com',
    status: 'Warning',
    lifecycleStatus: 'Active',
    subscriptions: [{ id: 'sub_3', plan: 'Busy Accounting Enterprise', startDate: '2024-06-01', endDate: '2026-06-30', status: 'Active' }],
    products: [{ id: 'prod_3', name: 'Busy ERP', features: ['Multi-Godown', 'Weighbridge Link', 'E-Way Bill'] }],
    assignments: [{ userId: 'usr-exec-1', role: 'Support Executive', assignedDate: '2024-06-01' }],
    enterpriseHooks: [],
    assignedExecutive: 'Syed Imran',
    softwareDetails: {
      version: 'Busy 21 Release 7.2',
      licenseType: 'Enterprise Edition',
      expiryDate: '2026-06-30',
      lastBackupDate: new Date().toISOString().split('T')[0]
    },
    healthStatus: 68,
    recentActivityTimestamp: new Date().toISOString(),
    clientContact: '9849055555',
    operatorContact: '9849066666',
    assignedSupport: 'Syed Imran',
    department: 'Manufacturing & Steel',
    plan: 'Busy Enterprise'
  },
  {
    id: 'TE-104',
    teId: 'TE-104',
    name: 'Metro Hypermarket Charminar',
    company: 'Metro Retail Outlets LLP',
    phone: '+91 93944 19813',
    email: 'metro.charminar@technoevident.com',
    status: 'Active',
    lifecycleStatus: 'Active',
    subscriptions: [{ id: 'sub_4', plan: 'Techno Evident POS Suite', startDate: '2025-01-10', endDate: '2027-01-10', status: 'Active' }],
    products: [{ id: 'prod_4', name: 'Cloud POS Terminal', features: ['Multi-Cashier', 'Sync', 'Loyalty Rewards'] }],
    assignments: [{ userId: 'usr-exec-2', role: 'Support Executive', assignedDate: '2025-01-10' }],
    enterpriseHooks: [],
    assignedExecutive: 'Ahmed Raza',
    softwareDetails: {
      version: 'TE-POS Pro v5.0',
      licenseType: 'Enterprise Chain',
      expiryDate: '2027-01-10',
      lastBackupDate: new Date().toISOString().split('T')[0]
    },
    healthStatus: 98,
    recentActivityTimestamp: new Date().toISOString(),
    clientContact: '9394419813',
    operatorContact: '9160633333',
    assignedSupport: 'Ahmed Raza',
    department: 'Supermarkets',
    plan: 'POS Cloud Suite'
  },
  {
    id: 'TE-105',
    teId: 'TE-105',
    name: 'Royal Jewellers & Gold House',
    company: 'Royal Jewellers Wholesale Ltd',
    phone: '+91 97000 11223',
    email: 'royal.jewels@technoevident.com',
    status: 'Critical',
    lifecycleStatus: 'Active',
    subscriptions: [{ id: 'sub_5', plan: 'Marg Jewellery ERP', startDate: '2024-03-01', endDate: '2025-03-01', status: 'Expired' }],
    products: [{ id: 'prod_5', name: 'Jewellery POS', features: ['Hallmark Tagging', 'Karat Calculator', 'GST'] }],
    assignments: [{ userId: 'usr-exec-1', role: 'Support Executive', assignedDate: '2024-03-01' }],
    enterpriseHooks: [],
    assignedExecutive: 'Syed Imran',
    softwareDetails: {
      version: 'Marg Jewellery v8.8',
      licenseType: 'Standard',
      expiryDate: '2025-03-01',
      lastBackupDate: '2025-02-28'
    },
    healthStatus: 42,
    recentActivityTimestamp: new Date().toISOString(),
    clientContact: '9700011223',
    operatorContact: '9700022334',
    assignedSupport: 'Syed Imran',
    department: 'Jewellery',
    plan: 'Marg Jewellery ERP'
  }
];

export const FALLBACK_TICKETS = [
  {
    id: 'TCK-2026-001',
    teId: 'TE-101',
    clientId: 'TE-101',
    clientName: 'Al-Madina Supermarket',
    issueCategory: 'Printing & Invoicing',
    issueDescription: 'Thermal barcode printer margin cutting off price labels during peak checkout.',
    priority: 'High',
    status: 'In Progress',
    assignedExecutive: 'Syed Imran',
    createdBy: 'Philsof Admin',
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
    timeline: [],
    workLogs: [],
    followUps: [],
    whatsappLogs: [],
    trainingLogs: [],
    attachments: []
  },
  {
    id: 'TCK-2026-002',
    teId: 'TE-105',
    clientId: 'TE-105',
    clientName: 'Royal Jewellers & Gold House',
    issueCategory: 'Setup & AMC',
    issueDescription: 'AMC License expired; need renewal invoice and multi-godown valuation sync.',
    priority: 'Critical',
    status: 'New',
    assignedExecutive: 'Syed Imran',
    createdBy: 'Mohammed Khaja Shareef',
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
    timeline: [],
    workLogs: [],
    followUps: [],
    whatsappLogs: [],
    trainingLogs: [],
    attachments: []
  }
];

export const FALLBACK_WORK_LOGS = [
  {
    id: 'WL-1001',
    clientId: 'TE-101',
    clientName: 'Al-Madina Supermarket',
    executiveId: 'usr-director-philsof',
    executiveName: 'Syed Imran',
    category: 'Printing & Invoicing',
    details: 'Configured thermal barcode printer paper size and test printed 10 item tags successfully.',
    durationMinutes: 18,
    status: 'Completed',
    proofLink: 'https://meet.google.com/abc-defg-hij',
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    time: '11:15 AM',
    approvalStatus: 'Approved',
    syncStatus: 'synced'
  }
];

export const FALLBACK_FOLLOW_UPS = [
  {
    id: 'FU-201',
    clientId: 'TE-105',
    clientName: 'Royal Jewellers & Gold House',
    reason: 'Follow-up regarding AMC Gold package renewal payment and activation key handover.',
    priority: 'Critical',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '03:30 PM',
    status: 'Pending',
    assignedExecutive: 'Syed Imran',
    syncStatus: 'synced'
  }
];

export const FALLBACK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'TEDOS System Online',
    message: 'Techno Evident Operational System connected with resilient local synchronization.',
    timestamp: new Date().toISOString(),
    read: false,
    type: 'info' as const
  }
];

// In-memory data store for CRUD persistence on dev server
export const memoryDb = {
  clients: [...FALLBACK_CLIENTS],
  tickets: [...FALLBACK_TICKETS],
  workLogs: [...FALLBACK_WORK_LOGS],
  followUps: [...FALLBACK_FOLLOW_UPS],
  notifications: [...FALLBACK_NOTIFICATIONS]
};
