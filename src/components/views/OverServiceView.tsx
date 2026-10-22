/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { OverServiceEntry, UserRole } from '../../types';
import { MaterialCard } from '../common/MaterialCard';
import {
  Rocket,
  MessageSquare,
  CreditCard,
  Smartphone,
  Plus,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Building2,
  UserCheck,
  Edit3,
  Download
} from 'lucide-react';

export const OverServiceView: React.FC<{ id?: string }> = ({ id }) => {
  const {
    overServices,
    addOverService,
    updateOverService,
    allClients,
    clients,
    users,
    currentUser,
    language
  } = useApp();

  const isUrdu = language === 'ur';
  const sourceClients = allClients && allClients.length > 0 ? allClients : clients;

  const [selectedClientId, setSelectedClientId] = useState<string>(sourceClients[0]?.id || '');
  const [executiveName, setExecutiveName] = useState<string>(currentUser?.name || 'Asad');
  const [dltSms, setDltSms] = useState<string>('Active - Entity & Template Verified');
  const [dltEntityId, setDltEntityId] = useState<string>('');
  const [paymentGateway, setPaymentGateway] = useState<string>('Active - Live Merchant Connected');
  const [paymentMerchantId, setPaymentMerchantId] = useState<string>('');
  const [whatsappApi, setWhatsappApi] = useState<string>('Connected - Meta Cloud WABA Verified');
  const [whatsappWabaNumber, setWhatsappWabaNumber] = useState<string>('');
  const [overServiceDetails, setOverServiceDetails] = useState<string>('');
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Completed');
  const [remarks, setRemarks] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [execFilter, setExecFilter] = useState<string>('ALL');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const supportTeamNames = useMemo(() => {
    const names = new Set<string>(['Umar Farooq', 'Sumayya', 'Farman', 'Haneef', 'Khaja Shareef', 'Techno Admin']);
    users
      .filter(u => u.role === UserRole.SUPPORT_EXECUTIVE || u.role === UserRole.SUPPORT_MANAGER)
      .forEach(u => {
        if (u.name) names.add(u.name.trim());
      });
    sourceClients.forEach(c => {
      if (c.assignedExecutive) names.add(c.assignedExecutive.trim());
    });
    return Array.from(names).filter(Boolean);
  }, [users, sourceClients]);

  const handleClientSelect = (cid: string) => {
    setSelectedClientId(cid);
    const found = sourceClients.find(c => c.id === cid);
    if (found) {
      if (found.assignedExecutive) setExecutiveName(found.assignedExecutive);
      if (found.dltSmsStatus) setDltSms(found.dltSmsStatus);
      if (found.paymentGatewayStatus) setPaymentGateway(found.paymentGatewayStatus);
      if (found.whatsappApiStatus) setWhatsappApi(found.whatsappApiStatus);
      if (found.phone) setWhatsappWabaNumber(found.phone);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clientObj = sourceClients.find(c => c.id === selectedClientId);
    const clientName = clientObj?.name || clientObj?.company || 'Enterprise Client';

    addOverService({
      clientId: selectedClientId || `CLI-${Date.now()}`,
      clientName,
      date: new Date().toISOString().split('T')[0],
      executiveName: executiveName || currentUser?.name || 'Asad',
      dltSms,
      dltEntityId,
      paymentGateway,
      paymentMerchantId,
      whatsappApi,
      whatsappWabaNumber,
      overServiceDetails:
        overServiceDetails.trim() ||
        `DLT SMS (${dltSms}) + Payment Gateway (${paymentGateway}) + WhatsApp API (${whatsappApi})`,
      status,
      remarks
    });

    setOverServiceDetails('');
    setRemarks('');
    setSavedNotice(
      isUrdu
        ? `اوور سروس ریکارڈ (${clientName}) کامیابی سے محفوظ ہو گیا!`
        : `Over Service record for ${clientName} saved successfully!`
    );
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const filteredOverServices = useMemo(() => {
    return overServices.filter(entry => {
      if (execFilter !== 'ALL' && entry.executiveName.toLowerCase() !== execFilter.toLowerCase()) {
        return false;
      }
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        entry.clientName.toLowerCase().includes(q) ||
        entry.executiveName.toLowerCase().includes(q) ||
        entry.dltSms.toLowerCase().includes(q) ||
        entry.paymentGateway.toLowerCase().includes(q) ||
        entry.whatsappApi.toLowerCase().includes(q) ||
        (entry.overServiceDetails || '').toLowerCase().includes(q)
      );
    });
  }, [overServices, execFilter, searchQuery]);

  const handleExportOverServicesCSV = () => {
    const headers = [
      'ID',
      'Date',
      'Client Name',
      'Support Executive',
      'DLT SMS',
      'DLT Entity ID',
      'Payment Gateway',
      'Merchant ID',
      'WhatsApp API',
      'WABA Number',
      'Over Service Summary',
      'Status',
      'Remarks'
    ];
    const rows = filteredOverServices.map(o => [
      o.id,
      o.date,
      `"${(o.clientName || '').replace(/"/g, '""')}"`,
      `"${(o.executiveName || '').replace(/"/g, '""')}"`,
      `"${(o.dltSms || '').replace(/"/g, '""')}"`,
      `"${(o.dltEntityId || '').replace(/"/g, '""')}"`,
      `"${(o.paymentGateway || '').replace(/"/g, '""')}"`,
      `"${(o.paymentMerchantId || '').replace(/"/g, '""')}"`,
      `"${(o.whatsappApi || '').replace(/"/g, '""')}"`,
      `"${(o.whatsappWabaNumber || '').replace(/"/g, '""')}"`,
      `"${(o.overServiceDetails || '').replace(/"/g, '""')}"`,
      o.status,
      `"${(o.remarks || '').replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TEDOS_Over_Service_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id={id || 'over-service-view'} className="space-y-6 max-w-6xl mx-auto pb-12 animate-slide-up">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-amber-300 shrink-0">
            <Rocket size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                COO • Director • Support Manager • Operation Manager
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30">
                3-Gateway Over Service Hub
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-1">
              {isUrdu
                ? 'اوور سروس حب — (a) DLT SMS (b) Payment Gateway (c) WhatsApp API'
                : 'Over Service Hub — (a) DLT SMS • (b) Payment Gateway • (c) WhatsApp API'}
            </h1>
            <p className="text-xs text-blue-100/90 mt-1 max-w-2xl">
              {isUrdu
                ? 'سپورٹ مینیجر، آپریشن مینیجر، سی او او اور ڈائریکٹر کے لیے خصوصی ماڈیول جہاں ہر کلائنٹ کی DLT SMS، پیمنٹ گیٹ وے اور واٹس ایپ API کنفیگریشن اور اوور سروس ریکارڈ منظم کیا جاتا ہے۔'
                : 'Dedicated module replacing Daily Work Log for Support Manager & Leadership to track (a) DLT SMS, (b) Payment Gateway, and (c) WhatsApp API integrations across all clients.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportOverServicesCSV}
          className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 hover:bg-blue-50 text-xs font-black flex items-center gap-2 shadow-md cursor-pointer self-start lg:self-auto shrink-0"
        >
          <Download size={15} className="text-blue-600" />
          <span>{isUrdu ? 'ایکسپورٹ CSV رپورٹ' : 'Export Over Service CSV'}</span>
        </button>
      </div>

      {savedNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* 3-Pillar Form Card */}
      <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Plus size={18} className="text-blue-600" />
              <span>
                {isUrdu
                  ? 'نئی اوور سروس انٹری شامل کریں (DLT SMS • Payment Gateway • WhatsApp API)'
                  : 'Add / Update Over Service Entry (DLT SMS • Payment Gateway • WhatsApp API)'}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Client Selector */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {isUrdu ? 'کلائنٹ منتخب کریں (Select Client) *' : 'Select Client *'}
              </label>
              <select
                value={selectedClientId}
                onChange={e => handleClientSelect(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              >
                {sourceClients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.teId || c.id}) — {c.assignedExecutive || 'Assigned'}
                  </option>
                ))}
              </select>
            </div>

            {/* Support Executive Selector */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {isUrdu ? 'سپورٹ ایگزیکٹو (Support Team Member)' : 'Assigned Support Executive'}
              </label>
              <select
                value={executiveName}
                onChange={e => setExecutiveName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              >
                {supportTeamNames.map(name => (
                  <option key={name} value={name}>
                    👤 {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {isUrdu ? 'اوور سروس اسٹیٹس (Status)' : 'Over Service Status'}
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              >
                <option value="Completed">✅ Completed & Live</option>
                <option value="In Progress">⏳ In Progress</option>
                <option value="Pending">🕒 Pending KYC / Approval</option>
              </select>
            </div>
          </div>

          {/* The 3 Mandatory Fields: (a) DLT SMS, (b) Payment Gateway, (c) WhatsApp API */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* (a) DLT SMS */}
            <div className="p-4 rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase font-black text-blue-600 block">
                    Field (a)
                  </span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    (a) DLT SMS Integration
                  </h3>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  DLT SMS Status & Operator
                </label>
                <select
                  value={dltSms}
                  onChange={e => setDltSms(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 font-bold"
                >
                  <option value="Active - Entity & Template Verified">✅ Active - Entity & Template Verified</option>
                  <option value="Jio / Airtel DLT Header Approved">📡 Jio / Airtel DLT Header Approved</option>
                  <option value="Pending Template Approval">⏳ Pending Template Approval</option>
                  <option value="KYC Submitted - Awaiting Entity ID">🕒 KYC Submitted - Awaiting Entity ID</option>
                  <option value="Not Configured">❌ Not Configured</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  DLT Principal Entity ID / Header
                </label>
                <input
                  type="text"
                  value={dltEntityId}
                  onChange={e => setDltEntityId(e.target.value)}
                  placeholder="e.g. 120115900012345 (6-Char Header)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
            </div>

            {/* (b) Payment Gateway */}
            <div className="p-4 rounded-2xl border-2 border-purple-500/30 bg-purple-500/5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-600 text-white">
                  <CreditCard size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase font-black text-purple-600 block">
                    Field (b)
                  </span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    (b) Payment Gateway
                  </h3>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Payment Gateway Provider & Status
                </label>
                <select
                  value={paymentGateway}
                  onChange={e => setPaymentGateway(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-900 font-bold"
                >
                  <option value="Active - Live Merchant Connected">✅ Active - Live Merchant Connected</option>
                  <option value="Razorpay Live API Integrated">💳 Razorpay Live API Integrated</option>
                  <option value="PayU / Cashfree Webhook Active">💳 PayU / Cashfree Webhook Active</option>
                  <option value="PhonePe / UPI Dynamic QR Active">📱 PhonePe / UPI Dynamic QR Active</option>
                  <option value="Pending Bank KYC Verification">⏳ Pending Bank KYC Verification</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Merchant ID / Webhook Reference
                </label>
                <input
                  type="text"
                  value={paymentMerchantId}
                  onChange={e => setPaymentMerchantId(e.target.value)}
                  placeholder="e.g. MID-RZP-99201"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
            </div>

            {/* (c) WhatsApp API */}
            <div className="p-4 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-600 text-white">
                  <Smartphone size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase font-black text-emerald-600 block">
                    Field (c)
                  </span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    (c) WhatsApp API
                  </h3>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  WhatsApp Cloud / WABA Status
                </label>
                <select
                  value={whatsappApi}
                  onChange={e => setWhatsappApi(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 font-bold"
                >
                  <option value="Connected - Meta Cloud WABA Verified">✅ Connected - Meta Cloud WABA Verified</option>
                  <option value="Automated Invoice PDF & Ledger Active">📄 Automated Invoice PDF & Ledger Active</option>
                  <option value="Green Tick / Business Manager Verified">🟢 Green Tick / Business Manager Verified</option>
                  <option value="Template Approval In Progress">⏳ Template Approval In Progress</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Connected WhatsApp Business Number
                </label>
                <input
                  type="text"
                  value={whatsappWabaNumber}
                  onChange={e => setWhatsappWabaNumber(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {isUrdu ? 'اوور سروس کی تفصیل (Over Service Details)' : 'Over Service Scope & Details'}
              </label>
              <input
                type="text"
                value={overServiceDetails}
                onChange={e => setOverServiceDetails(e.target.value)}
                placeholder="e.g. Custom ERP Automated Billing + DLT SMS + Razorpay + WhatsApp API..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {isUrdu ? 'مینیجر / سی او او ریمارکس (Remarks)' : 'Manager / COO Audit Remarks'}
              </label>
              <input
                type="text"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Verification remark or compliance note..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer"
          >
            {isUrdu
              ? '+ اوور سروس ریکارڈ محفوظ کریں (Save Over Service Record)'
              : '+ Save Over Service Configuration (DLT SMS • Payment Gateway • WhatsApp API)'}
          </button>
        </form>
      </MaterialCard>

      {/* Existing Over Service Records Table */}
      <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
            {isUrdu ? `تمام کلائنٹس کا اوور سروس ریکارڈ (${filteredOverServices.length})` : `Active Over Service Registry (${filteredOverServices.length})`}
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={execFilter}
              onChange={e => setExecFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              <option value="ALL">All Support Executives</option>
              {supportTeamNames.map(n => (
                <option key={n} value={n}>
                  👤 {n}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search client or gateway..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono uppercase text-slate-400">
                <th className="py-2.5 px-3">Client & Executive</th>
                <th className="py-2.5 px-3">(a) DLT SMS</th>
                <th className="py-2.5 px-3">(b) Payment Gateway</th>
                <th className="py-2.5 px-3">(c) WhatsApp API</th>
                <th className="py-2.5 px-3">Over Service Summary</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOverServices.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3">
                    <div className="font-black text-slate-900 dark:text-white">{item.clientName}</div>
                    <div className="text-[10px] text-indigo-600 font-bold">
                      👤 {item.executiveName} • {item.date}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-blue-700 dark:text-blue-300">{item.dltSms}</div>
                    {item.dltEntityId && (
                      <div className="text-[10px] font-mono text-slate-500">ID: {item.dltEntityId}</div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-purple-700 dark:text-purple-300">{item.paymentGateway}</div>
                    {item.paymentMerchantId && (
                      <div className="text-[10px] font-mono text-slate-500">MID: {item.paymentMerchantId}</div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-emerald-700 dark:text-emerald-300">{item.whatsappApi}</div>
                    {item.whatsappWabaNumber && (
                      <div className="text-[10px] font-mono text-slate-500">WABA: {item.whatsappWabaNumber}</div>
                    )}
                  </td>
                  <td className="py-3 px-3 max-w-xs">
                    <div className="text-slate-700 dark:text-slate-200 font-medium">{item.overServiceDetails}</div>
                    {item.remarks && <div className="text-[10px] text-slate-400 mt-0.5">Note: {item.remarks}</div>}
                  </td>
                  <td className="py-3 px-3">
                    <select
                      value={item.status}
                      onChange={e => updateOverService(item.id, { status: e.target.value as any })}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                        item.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                          : item.status === 'In Progress'
                            ? 'bg-blue-500/10 text-blue-700 border-blue-500/30'
                            : 'bg-amber-500/10 text-amber-700 border-amber-500/30'
                      }`}
                    >
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MaterialCard>
    </div>
  );
};
