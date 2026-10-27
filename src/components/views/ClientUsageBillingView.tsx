/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  HardDrive,
  Users,
  Building2,
  FileSpreadsheet,
  Calendar,
  Send,
  MessageCircle,
  TrendingUp,
  CreditCard,
  ShieldAlert,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClientUsageBillingEntry, OFFICIAL_DEPARTMENTS, OfficialDepartment, ModuleId, UserRole } from '../../types';
import { MaterialCard } from '../common/MaterialCard';
import { motion, AnimatePresence } from 'motion/react';

const STORAGE_KEY = 'tedos_client_usage_billing_v1';

const INITIAL_BILLING_DATA: ClientUsageBillingEntry[] = [
  {
    id: 'bil-001',
    teId: '100026B254',
    clientName: 'RH Public School Yaqutpura Hyd TG',
    department: 'TaleemPro',
    softwareUrl: 'https://rhps.taleempro.com',
    plan: 'Enterprise',
    studentCount: 1450,
    storageUsageGb: 34.5,
    billingFrequency: 'Yearly',
    amcAmount: 48000,
    paymentStatus: 'Paid',
    lastPaymentDate: '2026-04-10',
    nextRenewalDate: '2027-04-10',
    operationsStatus: 'Active',
    activeModules: ['Attendance', 'Fees', 'Exams', 'SMS', 'Accounts', 'Library'],
    remarks: 'Full ERP annual subscription renewed',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'bil-002',
    teId: '1000M00002',
    clientName: 'MMFI (Hyd TG)',
    department: 'EdSof',
    softwareUrl: 'https://mmfi.edsof.com',
    plan: 'Standard',
    studentCount: 820,
    storageUsageGb: 18.2,
    billingFrequency: 'Yearly',
    amcAmount: 28000,
    paymentStatus: 'Pending',
    lastPaymentDate: '2025-10-15',
    nextRenewalDate: '2026-10-15',
    operationsStatus: 'Active',
    activeModules: ['Fees', 'Student Diary', 'Reports'],
    remarks: 'Payment reminder dispatched on WhatsApp',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'bil-003',
    teId: '1000M00003',
    clientName: 'Aao ek neki kare trust (Hyd TG)',
    department: 'PhilSof',
    softwareUrl: 'https://aaoekneki.philsof.com',
    plan: 'Non-Profit Pro',
    studentCount: 350,
    storageUsageGb: 8.4,
    billingFrequency: 'Quarterly',
    amcAmount: 7500,
    paymentStatus: 'Paid',
    lastPaymentDate: '2026-09-01',
    nextRenewalDate: '2026-12-01',
    operationsStatus: 'Active',
    activeModules: ['Donations', 'Beneficiaries', 'Accounts Billing'],
    remarks: 'Trust charity subscription',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'bil-004',
    teId: '1000M00005',
    clientName: 'Madrasa Arabia Talimul Islam (Malkapur MH)',
    department: 'EdSof',
    softwareUrl: 'https://mati.edsof.com',
    plan: 'Pro',
    studentCount: 620,
    storageUsageGb: 12.0,
    billingFrequency: 'Yearly',
    amcAmount: 22000,
    paymentStatus: 'Overdue',
    lastPaymentDate: '2025-08-20',
    nextRenewalDate: '2026-08-20',
    operationsStatus: 'Active',
    activeModules: ['Hifz Tracker', 'Fees Details', 'Exams', 'Hostel'],
    remarks: 'Overdue by 60 days. Followup call required.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'bil-005',
    teId: '1000M00007',
    clientName: 'Zaytoonah Madrasa Rahmania (Karnataka Bengaluru)',
    department: 'TaleemPro',
    softwareUrl: 'https://zaytoonah.taleempro.com',
    plan: 'Enterprise',
    studentCount: 1100,
    storageUsageGb: 28.0,
    billingFrequency: 'Yearly',
    amcAmount: 42000,
    paymentStatus: 'Paid',
    lastPaymentDate: '2026-06-15',
    nextRenewalDate: '2027-06-15',
    operationsStatus: 'Active',
    activeModules: ['Attendance', 'Fees', 'Exams', 'Accounts', 'Staff Payroll'],
    remarks: 'Annual billing cleared via Bank Transfer',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'bil-006',
    teId: '1000M00009',
    clientName: 'Wifaq al Makatib (Hyd TG)',
    department: 'Website',
    softwareUrl: 'https://wifaqalmakatib.org',
    plan: 'Custom Portal',
    studentCount: 2500,
    storageUsageGb: 65.0,
    billingFrequency: 'Yearly',
    amcAmount: 65000,
    paymentStatus: 'Paid',
    lastPaymentDate: '2026-05-01',
    nextRenewalDate: '2027-05-01',
    operationsStatus: 'Active',
    activeModules: ['Central Maktab Portal', 'Certificates', 'Exams Central'],
    remarks: 'Central federation management',
    updatedAt: new Date().toISOString()
  }
];

export const ClientUsageBillingView: React.FC<{ id?: string }> = ({ id }) => {
  const { clients, language, currentUser } = useApp();
  const isUrdu = language === 'ur';

  const [records, setRecords] = useState<ClientUsageBillingEntry[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return INITIAL_BILLING_DATA;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTsvImportOpen, setIsTsvImportOpen] = useState(false);
  const [tsvText, setTsvText] = useState('');
  const [editingRecord, setEditingRecord] = useState<ClientUsageBillingEntry | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<ClientUsageBillingEntry, 'id' | 'updatedAt'>>({
    teId: '',
    clientName: '',
    department: 'TaleemPro',
    softwareUrl: '',
    plan: 'Standard',
    studentCount: 500,
    storageUsageGb: 10,
    billingFrequency: 'Yearly',
    amcAmount: 25000,
    paymentStatus: 'Paid',
    lastPaymentDate: new Date().toISOString().split('T')[0],
    nextRenewalDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    operationsStatus: 'Active',
    activeModules: ['Fees', 'Attendance', 'Exams'],
    remarks: ''
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {}
  }, [records]);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.clientName.toLowerCase().includes(q) ||
        r.teId.toLowerCase().includes(q) ||
        (r.department && r.department.toLowerCase().includes(q)) ||
        (r.plan && r.plan.toLowerCase().includes(q));

      const matchesDept = departmentFilter === 'ALL' || r.department === departmentFilter;
      const matchesStatus = statusFilter === 'ALL' || r.paymentStatus === statusFilter;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [records, searchTerm, departmentFilter, statusFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalClients = records.length;
    const totalRevenue = records.reduce((sum, r) => sum + (Number(r.amcAmount) || 0), 0);
    const pendingAmount = records
      .filter(r => r.paymentStatus === 'Pending' || r.paymentStatus === 'Overdue')
      .reduce((sum, r) => sum + (Number(r.amcAmount) || 0), 0);
    const totalStudents = records.reduce((sum, r) => sum + (Number(r.studentCount) || 0), 0);
    const totalStorage = records.reduce((sum, r) => sum + (Number(r.storageUsageGb) || 0), 0);

    return { totalClients, totalRevenue, pendingAmount, totalStudents, totalStorage };
  }, [records]);

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setFormData({
      teId: '',
      clientName: '',
      department: 'TaleemPro',
      softwareUrl: '',
      plan: 'Standard',
      studentCount: 500,
      storageUsageGb: 10,
      billingFrequency: 'Yearly',
      amcAmount: 25000,
      paymentStatus: 'Paid',
      lastPaymentDate: new Date().toISOString().split('T')[0],
      nextRenewalDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      operationsStatus: 'Active',
      activeModules: ['Fees', 'Attendance'],
      remarks: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ClientUsageBillingEntry) => {
    setEditingRecord(item);
    setFormData({
      teId: item.teId,
      clientName: item.clientName,
      department: item.department,
      softwareUrl: item.softwareUrl || '',
      plan: item.plan,
      studentCount: item.studentCount,
      storageUsageGb: item.storageUsageGb,
      billingFrequency: item.billingFrequency,
      amcAmount: item.amcAmount,
      paymentStatus: item.paymentStatus,
      lastPaymentDate: item.lastPaymentDate,
      nextRenewalDate: item.nextRenewalDate,
      operationsStatus: item.operationsStatus,
      activeModules: item.activeModules || [],
      remarks: item.remarks || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim()) {
      showAlert('error', isUrdu ? 'کلائنٹ کا نام درج کریں۔' : 'Please enter Client Name.');
      return;
    }

    if (editingRecord) {
      setRecords(prev =>
        prev.map(r =>
          r.id === editingRecord.id
            ? { ...r, ...formData, updatedAt: new Date().toISOString() }
            : r
        )
      );
      showAlert('success', isUrdu ? 'بلنگ و استعمال کی تفصیلات اپ ڈیٹ ہو گئیں!' : 'Client billing record updated successfully!');
    } else {
      const newEntry: ClientUsageBillingEntry = {
        ...formData,
        id: `bil-${Date.now()}`,
        updatedAt: new Date().toISOString()
      };
      setRecords(prev => [newEntry, ...prev]);
      showAlert('success', isUrdu ? 'نیا کلائنٹ بلنگ ریکارڈ کامیابی سے شامل ہو گیا!' : 'New billing & usage record added!');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    showAlert('success', isUrdu ? 'ریکارڈ حذف کر دیا گیا۔' : 'Billing record deleted.');
  };

  const handleTsvImport = () => {
    if (!tsvText.trim()) return;
    const lines = tsvText.split(/\r?\n/).filter(l => l.trim().length > 0);
    const newItems: ClientUsageBillingEntry[] = [];

    lines.forEach((line, idx) => {
      const p = line.split('\t').map(c => c.trim());
      if (p.length < 2) return;
      newItems.push({
        id: `bil-imp-${Date.now()}-${idx}`,
        teId: p[0] || `TE-${idx + 100}`,
        clientName: p[1] || `Client ${idx + 1}`,
        department: p[2] || 'TaleemPro',
        plan: p[3] || 'Standard',
        studentCount: Number(p[4]) || 500,
        storageUsageGb: Number(p[5]) || 10,
        billingFrequency: (p[6] as any) || 'Yearly',
        amcAmount: Number(p[7]) || 25000,
        paymentStatus: (p[8] as any) || 'Paid',
        lastPaymentDate: p[9] || new Date().toISOString().split('T')[0],
        nextRenewalDate: p[10] || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        operationsStatus: 'Active',
        activeModules: ['Core ERP'],
        softwareUrl: p[11] || '',
        remarks: p[12] || 'Imported from sheet',
        updatedAt: new Date().toISOString()
      });
    });

    if (newItems.length > 0) {
      setRecords(prev => [...newItems, ...prev]);
      showAlert('success', isUrdu ? `${newItems.length} ریکارڈز شیٹ سے کامیابی سے امپورٹ ہو گئے!` : `Imported ${newItems.length} records from sheet data!`);
      setTsvText('');
      setIsTsvImportOpen(false);
    }
  };

  const handleSendWhatsAppReminder = (record: ClientUsageBillingEntry) => {
    const text = `السلام علیکم! محترم ${record.clientName} صاحب، آپ کا ${record.department} سافٹ ویئر بلنگ و تجدید (${record.plan}) کا اسٹیٹس: ${record.paymentStatus} ہے۔ سالانہ AMC واجب الادا رقم: ₹${record.amcAmount.toLocaleString()} ہے۔ آخری تاریخ تجدید: ${record.nextRenewalDate} ہے۔ برائے رابطہ: ٹیکنو ایویڈنٹ بلنگ شعبہ۔ شکریہ!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div id={id || 'client-usage-billing-view'} className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20">
            <Receipt size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isUrdu ? 'کلائنٹ تفصیلات، بلنگ و استعمال (Client Details & Usage)' : 'Client Details, Billing & Usage Management'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Billing & Operations Sheet Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {isUrdu
                ? 'ہر ادارے کا شعبہ، پلان، طلبہ کی تعداد، کلاؤڈ اسٹوریج، سالانہ بلنگ (AMC) اور تجدید کی تاریخ۔ شیٹ سے ڈائریکٹ سنک اور واٹس ایپ بلنگ یاد دہانی۔'
                : 'Central operations & billing registry tracking student counts, cloud storage GB, annual AMC amounts, payment renewal cycles, and sheet synchronization.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsTsvImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition cursor-pointer"
          >
            <FileSpreadsheet size={16} />
            <span>{isUrdu ? 'شیٹ ڈیٹا پیسٹ / امپورٹ' : 'Import Sheet TSV'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 active:scale-95 transition cursor-pointer"
          >
            <Plus size={16} />
            <span>{isUrdu ? '+ نیا بلنگ ریکارڈ بنائیں' : '+ Add Client Billing'}</span>
          </button>
        </div>
      </div>

      {/* Alert Notice */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold ${
              alert.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {alert.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{alert.text}</span>
            </div>
            <button onClick={() => setAlert(null)} className="text-[10px] underline cursor-pointer">
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <MaterialCard variant="elevated" className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">{isUrdu ? 'کل ادارے (Clients)' : 'Total Clients'}</span>
            <Building2 size={16} className="text-blue-600" />
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white">{metrics.totalClients}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{isUrdu ? 'فعال سافٹ ویئر کلائنٹس' : 'Active Registry'}</span>
        </MaterialCard>

        <MaterialCard variant="elevated" className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">{isUrdu ? 'سالانہ ریوینیو (AMC)' : 'Annual AMC'}</span>
            <DollarSign size={16} className="text-emerald-600" />
          </div>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            ₹{metrics.totalRevenue.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{isUrdu ? 'کل سالانہ معاہدات' : 'Total Contracts'}</span>
        </MaterialCard>

        <MaterialCard variant="elevated" className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">{isUrdu ? 'واجب الادا بقایا' : 'Pending / Overdue'}</span>
            <CreditCard size={16} className="text-amber-600" />
          </div>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400">
            ₹{metrics.pendingAmount.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{isUrdu ? 'تجدید یاد دہانی درکار' : 'Followup Needed'}</span>
        </MaterialCard>

        <MaterialCard variant="elevated" className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">{isUrdu ? 'کل طلبہ و اساتذہ' : 'Students / Users'}</span>
            <Users size={16} className="text-indigo-600" />
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white">
            {metrics.totalStudents.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{isUrdu ? 'سسٹم میں فعال یوزرز' : 'Active Users'}</span>
        </MaterialCard>

        <MaterialCard variant="elevated" className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">{isUrdu ? 'کلاؤڈ اسٹوریج استعمال' : 'Cloud Storage'}</span>
            <HardDrive size={16} className="text-purple-600" />
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white">
            {metrics.totalStorage.toFixed(1)} GB
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{isUrdu ? 'ڈیٹا و بیک اپ سائز' : 'Cloud DB & Files'}</span>
        </MaterialCard>
      </div>

      {/* Filter and Search Bar */}
      <MaterialCard variant="elevated" className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={isUrdu ? 'کلائنٹ کا نام، TE-ID یا پلان تلاش کریں...' : 'Search Client, TE-ID, Plan...'}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Department Filter with all 11 departments requested by user */}
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">{isUrdu ? 'تمام شعبہ جات (All Departments)' : 'All Departments'}</option>
            {OFFICIAL_DEPARTMENTS.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Payment Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">{isUrdu ? 'تمام اسٹیٹس (All Statuses)' : 'All Payment Statuses'}</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
            <option value="Grace Period">Grace Period</option>
          </select>

          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 px-2">
            {filteredRecords.length} {isUrdu ? 'کلائنٹس' : 'Records'}
          </span>
        </div>
      </MaterialCard>

      {/* Registry Table */}
      <MaterialCard variant="elevated" className="overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                <th className="py-3.5 px-4">{isUrdu ? 'کلائنٹ اور آئی ڈی' : 'Client & TE-ID'}</th>
                <th className="py-3.5 px-4">{isUrdu ? 'شعبہ و پلان' : 'Department & Plan'}</th>
                <th className="py-3.5 px-4">{isUrdu ? 'استعمال (طلبہ و اسٹوریج)' : 'Usage (Students • Storage)'}</th>
                <th className="py-3.5 px-4">{isUrdu ? 'بلنگ رقم و فریکوئنسی' : 'Billing Amount (AMC)'}</th>
                <th className="py-3.5 px-4">{isUrdu ? 'اسٹیٹس و تجدید تاریخ' : 'Payment & Renewal'}</th>
                <th className="py-3.5 px-4 text-right">{isUrdu ? 'ایکشن' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    {isUrdu ? 'کوئی بلنگ ریکارڈ دستیاب نہیں ہے۔' : 'No client usage & billing records found.'}
                  </td>
                </tr>
              ) : (
                filteredRecords.map(item => {
                  const isPaid = item.paymentStatus === 'Paid';
                  const isOverdue = item.paymentStatus === 'Overdue';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      {/* Client info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{item.clientName}</span>
                          {item.softwareUrl && (
                            <a
                              href={item.softwareUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-500 hover:text-blue-600 transition"
                              title="Open Client Software URL"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                          {item.teId || 'N/A'}
                        </span>
                      </td>

                      {/* Department & Plan */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          🏢 {item.department}
                        </span>
                        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-1">
                          Package: <strong>{item.plan}</strong>
                        </div>
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          <span className="flex items-center gap-1">
                            <Users size={12} className="text-blue-500" />
                            {item.studentCount.toLocaleString()} Users
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <HardDrive size={12} className="text-purple-500" />
                            {item.storageUsageGb} GB
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {(item.activeModules || []).slice(0, 3).map((mod, idx) => (
                            <span key={idx} className="px-1.5 py-0.2 rounded text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                              {mod}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Billing Amount */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-sm text-slate-900 dark:text-white font-mono">
                          ₹{(item.amcAmount || 0).toLocaleString()}
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold block">
                          Cycle: {item.billingFrequency}
                        </span>
                      </td>

                      {/* Payment Status & Renewal Date */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : isOverdue
                              ? 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {item.paymentStatus}
                        </span>
                        <div className="text-[11px] font-mono text-slate-500 mt-1 flex items-center gap-1">
                          <Calendar size={11} className="text-slate-400" />
                          <span>Renew: <strong>{item.nextRenewalDate}</strong></span>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppReminder(item)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition cursor-pointer"
                            title="Send WhatsApp Billing Reminder"
                          >
                            <MessageCircle size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition cursor-pointer"
                            title="Edit Client Billing"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition cursor-pointer"
                            title="Delete Billing Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </MaterialCard>

      {/* Add / Edit Billing Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-600 text-white">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      {editingRecord
                        ? (isUrdu ? `کلائنٹ بلنگ ایڈٹ کریں (${editingRecord.clientName})` : `Edit Client Billing (${editingRecord.clientName})`)
                        : (isUrdu ? 'نیا کلائنٹ بلنگ و استعمال ریکارڈ' : 'New Client Billing & Usage Record')}
                    </h2>
                    <span className="text-[10px] text-slate-400">
                      Client Details & Usage Sheet Management
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="p-6 space-y-4 text-xs overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isUrdu ? 'کلائنٹ کا نام (Client Name) *' : 'Client Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.clientName}
                      onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                      placeholder="e.g. RH Public School"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isUrdu ? 'ٹیکنو آئی ڈی (TE-ID)' : 'Techno Client ID (TE-ID)'}
                    </label>
                    <input
                      type="text"
                      value={formData.teId}
                      onChange={e => setFormData({ ...formData, teId: e.target.value })}
                      placeholder="e.g. 100026B254"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  {/* Department with all 11 departments requested by user */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isUrdu ? 'شعبہ / ڈپارٹمنٹ (Department) *' : 'Department *'}
                    </label>
                    <select
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    >
                      {OFFICIAL_DEPARTMENTS.map(d => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isUrdu ? 'پیکیج / پلان (Plan)' : 'Software Plan'}
                    </label>
                    <input
                      type="text"
                      value={formData.plan}
                      onChange={e => setFormData({ ...formData, plan: e.target.value })}
                      placeholder="Enterprise / Standard / Pro"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isUrdu ? 'طلبہ / یوزرز کی تعداد' : 'Students / User Count'}
                    </label>
                    <input
                      type="number"
                      value={formData.studentCount}
                      onChange={e => setFormData({ ...formData, studentCount: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isUrdu ? 'کلاؤڈ اسٹوریج (GB)' : 'Storage Usage (GB)'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.storageUsageGb}
                      onChange={e => setFormData({ ...formData, storageUsageGb: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isUrdu ? 'بلنگ رقم / سالانہ AMC (₹) *' : 'AMC Billing Amount (₹) *'}
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.amcAmount}
                      onChange={e => setFormData({ ...formData, amcAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isUrdu ? 'بلنگ سائیکل (Billing Cycle)' : 'Billing Frequency'}
                    </label>
                    <select
                      value={formData.billingFrequency}
                      onChange={e => setFormData({ ...formData, billingFrequency: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="Yearly">Yearly (Annual AMC)</option>
                      <option value="Half-Yearly">Half-Yearly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isUrdu ? 'ادائیگی اسٹیٹس (Payment Status)' : 'Payment Status'}
                    </label>
                    <select
                      value={formData.paymentStatus}
                      onChange={e => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Grace Period">Grace Period</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isUrdu ? 'اگلی تاریخ تجدید (Next Renewal Date)' : 'Next Renewal Date'}
                    </label>
                    <input
                      type="date"
                      value={formData.nextRenewalDate}
                      onChange={e => setFormData({ ...formData, nextRenewalDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isUrdu ? 'سافٹ ویئر یو آر ایل (Software URL)' : 'Software Deployment URL'}
                  </label>
                  <input
                    type="url"
                    value={formData.softwareUrl}
                    onChange={e => setFormData({ ...formData, softwareUrl: e.target.value })}
                    placeholder="https://client.edsof.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isUrdu ? 'ریمارکس / بلنگ نوٹس (Remarks)' : 'Remarks & Notes'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.remarks}
                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="e.g. Bank transfer reference, followup status..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    {isUrdu ? 'منسوخ کریں' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    {editingRecord ? (isUrdu ? 'تبدیلیاں محفوظ کریں' : 'Save Changes') : (isUrdu ? 'ریکارڈ شامل کریں' : 'Create Record')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TSV Import Modal */}
      <AnimatePresence>
        {isTsvImportOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet size={22} className="text-emerald-600" />
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isUrdu ? 'شیٹ سے ڈیٹا امپورٹ کریں (Client Details & Usage TSV)' : 'Import Sheet TSV (Client Details & Usage)'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsTsvImportOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isUrdu
                  ? 'گوگل شیٹ کے کالم کاپی کر کے نیچے پیسٹ کریں۔ (TE-ID • Name • Department • Plan • Users • Storage • Cycle • AMC • Status • LastPay • Renewal • URL • Remarks)'
                  : 'Copy rows directly from your Google Sheet and paste below. Tab-separated values will be automatically mapped into the system.'}
              </p>

              <textarea
                rows={8}
                value={tsvText}
                onChange={e => setTsvText(e.target.value)}
                placeholder="100026B254	RH Public School	TaleemPro	Enterprise	1450	35	Yearly	48000	Paid	2026-04-10	2027-04-10"
                className="w-full p-3 font-mono text-xs rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTsvImportOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                >
                  {isUrdu ? 'منسوخ' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleTsvImport}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                >
                  {isUrdu ? 'امپورٹ مکمل کریں' : 'Import Rows'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
