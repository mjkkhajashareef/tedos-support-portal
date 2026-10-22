/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ModuleId, SupportClient, UserRole } from '../../types';
import { MaterialCard } from '../common/MaterialCard';
import {
  Users,
  Search,
  ExternalLink,
  Phone,
  MessageCircle,
  MapPin,
  ClipboardPen,
  Building2,
  Copy,
  Check,
  ShieldCheck,
  Globe,
  Filter,
  Briefcase,
  AlertCircle,
  FileSpreadsheet,
  User
} from 'lucide-react';
import { motion } from 'motion/react';

interface MyClientsViewProps {
  id?: string;
}

export const MyClientsView: React.FC<MyClientsViewProps> = ({ id }) => {
  const {
    clients,
    allClients,
    currentUser,
    setSelectedClientId,
    setCurrentModule,
    setIsBlankWorkspace,
    openSheetSyncModal,
    language
  } = useApp();

  const isUrdu = language === 'ur';
  const isSupportExecutive = currentUser?.role === UserRole.SUPPORT_EXECUTIVE;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLoginId, setCopiedLoginId] = useState<string | null>(null);
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);

  // Clients pool: Support Executive gets only their assigned/visible clients
  const activePool = isSupportExecutive ? clients : allClients;

  const handleCopyTeId = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyLogin = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLoginId(id);
    setTimeout(() => setCopiedLoginId(null), 2000);
  };

  const handleCopyUrl = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrlId(id);
    setTimeout(() => setCopiedUrlId(null), 2000);
  };

  const departments = useMemo(() => {
    const set = new Set<string>();
    activePool.forEach(c => {
      if (c.department) set.add(c.department);
    });
    return ['ALL', ...Array.from(set)];
  }, [activePool]);

  const filteredClients = useMemo(() => {
    return activePool.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.teId || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        String(c.clientContact || '').includes(q) ||
        (c.department || '').toLowerCase().includes(q) ||
        (c.url || '').toLowerCase().includes(q);

      const matchesDept = selectedDept === 'ALL' || c.department === selectedDept;
      const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [activePool, searchQuery, selectedDept, selectedStatus]);

  const handleOpenWorkLog = (clientId: string) => {
    setSelectedClientId(clientId);
    setIsBlankWorkspace(false);
    setCurrentModule(ModuleId.DAILY_WORK_LOG);
  };

  const handleOpenWorkspace = (clientId: string) => {
    setSelectedClientId(clientId);
    setIsBlankWorkspace(false);
    setCurrentModule(ModuleId.CLIENT_WORKSPACE);
  };

  const formatCleanUrl = (url?: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  return (
    <div id={id || 'tedos-my-clients-view'} className="space-y-6 animate-fade-in pb-12">
      {/* Top Header Card */}
      <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white">
                  {isUrdu ? 'میرے تفویض کردہ کلائنٹس (My Assigned Clients)' : 'My Assigned Clients'}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                  {filteredClients.length} {isUrdu ? 'کلائنٹس' : 'Clients'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isUrdu
                  ? `گوگل شیٹ سپورٹ ٹیب کا مکمل ریکارڈ • لائیو سافٹ ویئر یو آر ایل، فون، اور واٹس ایپ تک فوری رسائی (${currentUser?.name})`
                  : `Master Google Sheet Roster • Live Client Software URLs, Contacts & Instant Daily Work Log for ${currentUser?.name}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={openSheetSyncModal}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer select-none"
              title="Sync Sheet Column O (URL) & P (Login)"
            >
              <FileSpreadsheet size={14} />
              <span>{isUrdu ? 'کالم O و P سنک' : 'Sync Column O & P'}</span>
            </button>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-mono font-bold flex items-center gap-1.5">
              <ShieldCheck size={14} />
              <span>{currentUser?.employeeId || 'TE-ID'} • {currentUser?.name}</span>
            </span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-slate-100 dark:border-slate-800 mt-5">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isUrdu ? 'کلائنٹ کا نام، TE ID یا موبائل نمبر تلاش کریں...' : 'Search by Name, TE-ID, URL or Phone...'}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              {departments.map(d => (
                <option key={d} value={d}>
                  {d === 'ALL' ? (isUrdu ? 'تمام شعبہ جات (All Departments)' : 'All Departments') : `🏢 ${d}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">{isUrdu ? 'تمام اسٹیٹس (All Status)' : 'All Status'}</option>
              <option value="Active">🟢 Active / Connected</option>
              <option value="Warning">🟡 Warning / Not Answering</option>
              <option value="Critical">🔴 Critical / Pending</option>
              <option value="Inactive">⚪ Inactive</option>
            </select>
          </div>
        </div>
      </MaterialCard>

      {/* Clients Cards Grid */}
      {filteredClients.length === 0 ? (
        <MaterialCard variant="outlined" className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 space-y-3">
          <AlertCircle size={36} className="text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            {isUrdu ? 'کوئی کلائنٹ نہیں ملا' : 'No Clients Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isUrdu
              ? 'آپ کی تلاش یا فلٹر کے مطابق کوئی ریکارڈ دستیاب نہیں ہے۔'
              : 'No clients match your filter or search query. Check your assigned list.'}
          </p>
        </MaterialCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const cleanUrl = formatCleanUrl(client.url || client.deploymentUrl);
            const rawPhone = String(client.clientContact || client.phone || '').replace(/\D/g, '');
            const waNumber = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                {/* Header: TE ID & Status */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {client.teId || client.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyTeId(client.teId || client.id, client.id)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        title="Copy TE-ID"
                      >
                        {copiedId === client.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        client.status === 'Active' || client.status === 'Connected'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : client.status === 'Warning' || client.status === 'Not Answering'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {client.status || 'Active'}
                    </span>
                  </div>

                  {/* Client Name */}
                  <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                    {client.name}
                  </h3>

                  {/* Department & Plan */}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                    {client.department && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                        🏢 {client.department}
                      </span>
                    )}
                    {client.plan && (
                      <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 font-bold text-purple-700 dark:text-purple-300">
                        📦 {client.plan}
                      </span>
                    )}
                    {client.assignedSupport && (
                      <span className="text-[10px] font-mono text-slate-400">
                        👤 {client.assignedSupport}
                      </span>
                    )}
                  </div>

                  {/* Contacts */}
                  <div className="space-y-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    {(client.clientContact || client.phone) && (
                      <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span className="text-[11px] text-slate-400">📞 Phone:</span>
                        <div className="flex items-center gap-2 font-mono font-bold">
                          <a href={`tel:${client.clientContact || client.phone}`} className="hover:text-blue-600 hover:underline">
                            {client.clientContact || client.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {client.operatorContact && (
                      <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span className="text-[11px] text-slate-400">👤 Operator:</span>
                        <a href={`tel:${client.operatorContact}`} className="font-mono text-[11px] hover:text-blue-600 hover:underline">
                          {client.operatorContact}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* SPECIAL MANAGER REMARK (Requirement #3) */}
                  {(client.noteSaad || (client as any).specialManagerRemark) && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-700 dark:text-amber-400">
                        📌 {isUrdu ? 'خصوصی مینیجر ریمارک (Special Manager Remark)' : 'Special Manager Remark:'}
                      </span>
                      <p className="text-[11px] font-medium mt-0.5 leading-snug">
                        {client.noteSaad || (client as any).specialManagerRemark}
                      </p>
                    </div>
                  )}

                  {/* CLIENT SOFTWARE LOGIN (Column P) */}
                  {(client.softwareLogin || (client.email && !client.email.includes('@technoevident.com'))) && (
                    <div className="mt-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User size={12} className="text-blue-500 shrink-0" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{isUrdu ? 'لاگ ان:' : 'Login:'}</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                          {client.softwareLogin || client.email}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyLogin(client.softwareLogin || client.email, client.id)}
                        className="p-1 text-slate-400 hover:text-blue-600 transition shrink-0 cursor-pointer"
                        title="Copy Login"
                      >
                        {copiedLoginId === client.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                  )}

                  {/* CLIENT SOFTWARE / PORTAL URL (Column O) */}
                  <div className="mt-2.5">
                    {cleanUrl ? (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={cleanUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-between gap-1.5 shadow-sm transition active:scale-95"
                          title="Click to Open Client Software Portal"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Globe size={13} className="shrink-0" />
                            <span className="truncate font-mono">{cleanUrl}</span>
                          </div>
                          <ExternalLink size={12} className="shrink-0" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(cleanUrl, client.id)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition shrink-0 cursor-pointer"
                          title="Copy Software URL"
                        >
                          {copiedUrlId === client.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-center text-[11px] font-mono flex items-center justify-between gap-2">
                        <span>🌐 {isUrdu ? 'کالم O یو آر ایل پینڈنگ ہے' : 'Column O URL Pending'}</span>
                        <button
                          type="button"
                          onClick={openSheetSyncModal}
                          className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[10px] font-bold cursor-pointer"
                        >
                          {isUrdu ? 'سنک کریں' : 'Sync'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-2">
                    {waNumber && (
                      <a
                        href={`https://wa.me/${waNumber}?text=Hello%20${encodeURIComponent(client.name)}%2C%20this%20is%20${encodeURIComponent(currentUser?.name || 'Techno Evident Support')}%20from%20TEDOS%20Support.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <MessageCircle size={13} />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    <a
                      href={client.googleMapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <MapPin size={13} />
                      <span>{isUrdu ? 'نقشہ (Maps)' : 'Google Map'}</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenWorkLog(client.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <ClipboardPen size={13} />
                      <span>{isUrdu ? 'ورک لاگ درج کریں' : 'Start Daily Work Log'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenWorkspace(client.id)}
                      className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer"
                      title="Open Full Client Workspace"
                    >
                      <Briefcase size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
