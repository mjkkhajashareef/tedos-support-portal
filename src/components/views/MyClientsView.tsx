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
  User,
  LayoutGrid,
  LayoutList,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { extractWebUrl } from '../../utils/helpers';
import { openWhatsAppChat, buildBrandedWhatsAppMessage } from '../../utils/whatsappUtils';

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
  const [viewMode, setViewMode] = useState<'boxes' | 'table' | 'cards'>('boxes');
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

        {/* View Mode Toggle: Small Boxes vs Table vs Detailed Cards */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {isUrdu ? 'ڈسپلے اسٹائل:' : 'Display View:'}
            </span>
            <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400">
              {viewMode === 'boxes'
                ? (isUrdu ? '🔲 چھوٹے باکسز (Small Boxes - Recommended)' : '🔲 Small Boxes (Recommended)')
                : viewMode === 'table'
                ? (isUrdu ? '📋 ٹیبل لسٹ (Table List)' : '📋 Table List')
                : (isUrdu ? '📄 تفصیلی کارڈز (Full Cards)' : '📄 Full Cards')}
            </span>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('boxes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'boxes'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
              }`}
              title="Small Compact Boxes"
            >
              <LayoutGrid size={14} />
              <span>{isUrdu ? 'چھوٹے باکسز (Small Boxes)' : 'Small Boxes'}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
              }`}
              title="Table View"
            >
              <LayoutList size={14} />
              <span>{isUrdu ? 'ٹیبل (Table)' : 'Table'}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
              }`}
              title="Detailed Cards"
            >
              <Layers size={14} />
              <span>{isUrdu ? 'تفصیلی (Detailed)' : 'Detailed'}</span>
            </button>
          </div>
        </div>
      </MaterialCard>

      {/* Main Clients Rendering */}
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
      ) : viewMode === 'boxes' ? (
        /* MODE 1: SMALL COMPACT BOXES (HIGH-DENSITY GRID) */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredClients.map((client) => {
            const cleanUrl = extractWebUrl(client.url || client.deploymentUrl || client.softwareUrl);
            const rawPhone = String(client.clientContact || client.phone || '').replace(/\D/g, '');
            const waNumber = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
            const isCritical = client.status === 'Critical' || client.status === 'Pending';
            const isWarning = client.status === 'Warning' || client.status === 'Not Answering';

            return (
              <div
                key={client.id}
                className="group relative p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/70 hover:shadow-md transition-all flex flex-col justify-between gap-2.5 text-xs"
              >
                {/* Top Row: TE-ID and Status Dot */}
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 truncate">
                    {client.teId || client.id}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isCritical
                          ? 'bg-rose-500 ring-2 ring-rose-200 dark:ring-rose-950'
                          : isWarning
                          ? 'bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-950'
                          : 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-950'
                      }`}
                      title={`Status: ${client.status || 'Active'}`}
                    />
                    <span className="text-[9px] font-bold text-slate-500 truncate max-w-[60px]">
                      {client.status || 'Active'}
                    </span>
                  </div>
                </div>

                {/* Client Company & Name */}
                <div className="min-w-0">
                  <h4
                    className="font-black text-[12px] text-slate-900 dark:text-white truncate leading-snug group-hover:text-blue-600 transition"
                    title={client.company || client.name}
                  >
                    {client.company || client.name}
                  </h4>
                  {client.department && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block mt-0.5 font-medium">
                      🏢 {client.department}
                    </span>
                  )}
                </div>

                {/* Quick Action Toolbar in Small Box */}
                <div className="flex items-center gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                  {cleanUrl && (
                    <a
                      href={cleanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 transition cursor-pointer shrink-0"
                      title={`Open Client Software: ${cleanUrl}`}
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}

                  {rawPhone && (
                    <>
                      <a
                        href={`tel:${rawPhone}`}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer shrink-0"
                        title={`Call ${rawPhone}`}
                      >
                        <Phone size={12} />
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          openWhatsAppChat({
                            phone: waNumber,
                            message: buildBrandedWhatsAppMessage({ client, type: 'quick_checkin' })
                          });
                        }}
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400 transition cursor-pointer shrink-0"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle size={12} />
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenWorkLog(client.id)}
                    className="flex-1 py-1 px-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow-2xs transition cursor-pointer"
                    title="Start Daily Work Log"
                  >
                    <ClipboardPen size={11} />
                    <span>{isUrdu ? 'لاگ' : 'Log'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenWorkspace(client.id)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition cursor-pointer shrink-0"
                    title="Open Workspace"
                  >
                    <Briefcase size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'table' ? (
        /* MODE 2: TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono uppercase text-slate-500">
                  <th className="py-3 px-4">TE-ID</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Software URL</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredClients.map((client) => {
                  const cleanUrl = extractWebUrl(client.url || client.deploymentUrl || client.softwareUrl);
                  return (
                    <tr key={client.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-600">{client.teId || client.id}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{client.company || client.name}</td>
                      <td className="py-2.5 px-4 text-slate-500">{client.department || '—'}</td>
                      <td className="py-2.5 px-4">
                        {cleanUrl ? (
                          <a href={cleanUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-blue-600 hover:underline flex items-center gap-1">
                            <span className="truncate max-w-[150px]">{cleanUrl}</span>
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono">{client.clientContact || client.phone || '—'}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          client.status === 'Critical' ? 'bg-rose-100 text-rose-700' :
                          client.status === 'Warning' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {client.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenWorkLog(client.id)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <ClipboardPen size={11} />
                            <span>{isUrdu ? 'لاگ' : 'Log'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenWorkspace(client.id)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                            title="Workspace"
                          >
                            <Briefcase size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* MODE 3: FULL DETAILED CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const cleanUrl = extractWebUrl(client.url || client.deploymentUrl || client.softwareUrl);
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
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {client.teId || client.id}
                    </span>
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

                  <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                    {client.company || client.name}
                  </h3>

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[11px] text-slate-500">
                    {client.department && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                        🏢 {client.department}
                      </span>
                    )}
                    {cleanUrl && (
                      <a href={cleanUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 font-mono">
                        <Globe size={11} />
                        <span className="truncate max-w-[150px]">{cleanUrl}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleOpenWorkLog(client.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <ClipboardPen size={13} />
                    <span>{isUrdu ? 'ورک لاگ درج کریں' : 'Start Daily Work Log'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenWorkspace(client.id)}
                    className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer"
                    title="Open Full Workspace"
                  >
                    <Briefcase size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
