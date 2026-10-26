/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ModuleId, SupportClient, UserRole } from '../../types';
import { can, Permission } from '../../utils/rbac';
import { extractWebUrl } from '../../utils/helpers';
import { MaterialCard } from '../common/MaterialCard';
import {
  Search,
  FolderOpen,
  Phone,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  ExternalLink,
  MapPin,
  FileText,
  UserCheck,
  RefreshCw,
  Copy,
  Check,
  LayoutList,
  LayoutGrid,
  ShieldCheck,
  Building2,
  Clock,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  User
} from 'lucide-react';
import { exportClientsToCSV } from '../../utils/exportUtils';
import { openWhatsAppChat, buildBrandedWhatsAppMessage } from '../../utils/whatsappUtils';

interface ClientsViewProps {
  id?: string;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ id }) => {
  const {
    clients,
    setCurrentModule,
    setSelectedClientId,
    selectedRole,
    currentUser,
    language,
    openGoogleReviewModal,
    refreshClients,
    openSheetSyncModal,
    setIsBlankWorkspace,
    workLogs
  } = useApp();

  const isUrdu = language === 'ur';
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Critical' | 'Warning' | 'Active' | 'Inactive'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);
  const [copiedTeId, setCopiedTeId] = useState<string | null>(null);
  const [copiedLoginId, setCopiedLoginId] = useState<string | null>(null);
  const [inspectLogsClient, setInspectLogsClient] = useState<SupportClient | null>(null);
  const itemsPerPage = 10;

  const userRole = currentUser?.role || selectedRole;
  const isSupportExecutive = userRole === UserRole.SUPPORT_EXECUTIVE;

  // Scoped clients: Support executive gets strictly their assigned clients across all tabs (All to Inactive)
  const strictlyScopedClients = useMemo(() => {
    const base = clients.filter(c => !/zigma|apollo/i.test(c.name || ''));
    if (!isSupportExecutive || !currentUser) return base;
    const myName = (currentUser.name || '').trim().toLowerCase();
    const firstToken = myName.split(' ')[0];
    const assignedSet = new Set(currentUser.assignedClients || []);
    return base.filter(c => {
      if (assignedSet.has(c.id) || (c.teId && assignedSet.has(c.teId))) return true;
      const exec = (c.assignedExecutive || c.assignedSupport || '').trim().toLowerCase();
      if (!exec) return false;
      return exec === myName || exec.includes(firstToken) || firstToken.includes(exec);
    });
  }, [clients, isSupportExecutive, currentUser]);

  const filteredClients = useMemo(() => {
    return strictlyScopedClients.filter(client => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        client.name.toLowerCase().includes(q) ||
        client.company.toLowerCase().includes(q) ||
        (client.department || '').toLowerCase().includes(q) ||
        (client.assignedExecutive || '').toLowerCase().includes(q) ||
        (client.assignedSupport || '').toLowerCase().includes(q) ||
        (client.teId || client.id || '').toLowerCase().includes(q) ||
        (client.phone || '').includes(q) ||
        (client.url || '').toLowerCase().includes(q);

      const matchesFilter = statusFilter === 'All' || client.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [strictlyScopedClients, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / itemsPerPage));
  const paginatedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenWorkspace = (clientId: string) => {
    setSelectedClientId(clientId);
    setIsBlankWorkspace(false);
    setCurrentModule(ModuleId.CLIENT_WORKSPACE);
  };

  const handleOpenWorkLog = (clientId: string) => {
    setSelectedClientId(clientId);
    setIsBlankWorkspace(false);
    setCurrentModule(ModuleId.DAILY_WORK_LOG);
  };

  const handleCopy = (text: string, id: string, type: 'url' | 'teId' | 'login') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrlId(id);
      setTimeout(() => setCopiedUrlId(null), 2000);
    } else if (type === 'login') {
      setCopiedLoginId(id);
      setTimeout(() => setCopiedLoginId(null), 2000);
    } else {
      setCopiedTeId(id);
      setTimeout(() => setCopiedTeId(null), 2000);
    }
  };

  const canCreateClient = !isSupportExecutive && can(userRole, Permission.CREATE_CLIENT);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Critical':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            {isUrdu ? 'اہم ترین' : 'Critical'}
          </span>
        );
      case 'Warning':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            {isUrdu ? 'انتباہ' : 'Warning'}
          </span>
        );
      case 'Active':
      case 'Connected':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {isUrdu ? 'فعال' : 'Active'}
          </span>
        );
      case 'Inactive':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {isUrdu ? 'غیر فعال' : 'Inactive'}
          </span>
        );
    }
  };

  const formatCleanUrlOnly = (rawUrl?: string) => {
    if (!rawUrl) return '';
    return extractWebUrl(rawUrl);
  };

  return (
    <div id={id || 'tedos-clients-directory-view'} className="space-y-5 max-w-7xl mx-auto animate-slide-up pb-12">
      {/* Scope Indicator Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {isUrdu ? 'کلائنٹس ڈائریکٹری (Clients Directory)' : 'Clients Directory'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {filteredClients.length} {isUrdu ? 'کلائنٹس' : 'Clients'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isSupportExecutive
                ? isUrdu
                  ? `صرف آپ کے تفویض کردہ کلائنٹس (${currentUser?.name}) دکھائے جا رہے ہیں — All سے Inactive تک`
                  : `Showing strictly your assigned clients (${currentUser?.name}) across All to Inactive tabs`
                : isUrdu
                  ? `تمام کلائنٹس کا مکمل ریکارڈ • لائیو ویب سافٹ ویئر یو آر ایل، کانٹیکٹ و فالو اپس`
                  : `Master Client Directory • Live Software URLs, Direct Contacts & Special Manager Remarks`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* View mode toggle (Table / Grid Cards) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <LayoutList size={15} />
              <span className="hidden sm:inline text-[11px]">{isUrdu ? 'ٹیبل' : 'Table'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline text-[11px]">{isUrdu ? 'کارڈز' : 'Cards'}</span>
            </button>
          </div>

          {/* Sync Clients with Google Sheet */}
          <button
            type="button"
            onClick={async () => {
              setIsSyncing(true);
              try {
                await refreshClients();
              } finally {
                setIsSyncing(false);
              }
            }}
            disabled={isSyncing}
            className="px-3 py-2 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            title="Sync with Google Sheets"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin text-blue-600' : 'text-blue-600'} />
            <span className="hidden sm:inline">{isSyncing ? (isUrdu ? 'سنک...' : 'Syncing...') : (isUrdu ? 'شیٹ سنک' : 'Sync')}</span>
          </button>

          {/* Export to CSV (Only for Managers / Leadership) */}
          {!isSupportExecutive && (
            <button
              type="button"
              onClick={() => exportClientsToCSV(filteredClients)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
              title="Export Clients CSV"
            >
              <Download size={14} className="text-emerald-600" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          )}

          {canCreateClient && (
            <button
              onClick={() => {
                setCurrentModule(ModuleId.CLIENT_ACTIVATION);
              }}
              className="bg-blue-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
            >
              {isUrdu ? '+ نیا کلائنٹ' : '+ Add Client'}
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              isUrdu
                ? 'کمپنی، کلائنٹ کا نام، TE-ID، یو آر ایل یا موبائل سے تلاش کریں...'
                : 'Search by client name, company, TE-ID, URL, or mobile...'
            }
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0">
          {(['All', 'Active', 'Warning', 'Critical', 'Inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => {
                setStatusFilter(f);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all border ${
                statusFilter === f
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {f === 'All'
                ? isUrdu
                  ? isSupportExecutive
                    ? 'تمام (میرے کلائنٹس)'
                    : 'تمام'
                  : isSupportExecutive
                  ? 'All (My Clients)'
                  : 'All'
                : f === 'Critical'
                ? isUrdu
                  ? 'اہم ترین'
                  : 'Critical'
                : f === 'Warning'
                ? isUrdu
                  ? 'انتباہ'
                  : 'Warning'
                : f === 'Active'
                ? isUrdu
                  ? 'فعال'
                  : 'Active'
                : isUrdu
                ? 'غیر فعال'
                : 'Inactive'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredClients.length === 0 ? (
        <MaterialCard variant="outlined" className="text-center py-14 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <AlertCircle size={36} className="text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {isUrdu ? 'کوئی کلائنٹ نہیں ملا' : 'No Clients Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isUrdu
              ? 'آپ کی تلاش یا فلٹر کے مطابق کوئی ریکارڈ دستیاب نہیں ہے۔'
              : 'No client records match your current search query or status filter.'}
          </p>
        </MaterialCard>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW: Professional, clean, and organized */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">TE-ID</th>
                  <th className="py-3 px-4">Company & Client</th>
                  <th className="py-3 px-4">Assigned Support</th>
                  <th className="py-3 px-4">Software Access URL</th>
                  <th className="py-3 px-4">Phone / WhatsApp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Special Manager Remark</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {paginatedClients.map(client => {
                  const cleanUrl = formatCleanUrlOnly(client.url || client.deploymentUrl);
                  const rawPhone = String(client.clientContact || client.phone || '').replace(/\D/g, '');
                  const waNumber = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* TE-ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-[11px] px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {client.teId || client.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(client.teId || client.id, client.id, 'teId')}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
                            title="Copy TE-ID"
                          >
                            {copiedTeId === client.id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </td>

                      {/* Company & Client Name */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-black text-slate-900 dark:text-white truncate">
                          {client.company || client.name}
                        </div>
                        {client.company && client.name && client.company !== client.name && (
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            👤 {client.name}
                          </div>
                        )}
                        {client.department && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            🏢 {client.department}
                          </div>
                        )}
                      </td>

                      {/* Assigned Support Executive */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                          👤 {client.assignedExecutive || client.assignedSupport || 'Unassigned'}
                        </span>
                      </td>

                      {/* Software Access URL */}
                      <td className="py-3.5 px-4 max-w-sm">
                        {cleanUrl ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={cleanUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 truncate max-w-[200px]"
                              title={`Open ${cleanUrl}`}
                            >
                              <span className="truncate">{cleanUrl}</span>
                              <ExternalLink size={11} className="shrink-0" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopy(cleanUrl, client.id, 'url')}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer shrink-0"
                              title="Copy Software URL"
                            >
                              {copiedUrlId === client.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Phone / WhatsApp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {(client.clientContact || client.phone) ? (
                            <>
                              <a
                                href={`tel:${client.clientContact || client.phone}`}
                                className="font-mono font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 text-xs"
                              >
                                {client.clientContact || client.phone}
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  openWhatsAppChat({
                                    phone: waNumber,
                                    message: buildBrandedWhatsAppMessage({
                                      client,
                                      type: 'quick_checkin'
                                    })
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 transition cursor-pointer"
                                title="Open WhatsApp Chat"
                              >
                                <Phone size={13} />
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(client.status)}
                      </td>

                      {/* Special Manager Remark */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 font-medium truncate">
                          {client.specialManagerRemark || client.noteSaad || 'Standard monitoring'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenWorkLog(client.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition cursor-pointer"
                            title="Log Work Call for this Client"
                          >
                            <FileText size={12} />
                            <span>{isUrdu ? 'ورک لاگ' : 'Work Log'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenWorkspace(client.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                            title="Open Full Workspace"
                          >
                            <FolderOpen size={12} />
                            <span>{isUrdu ? 'ورک اسپیس' : 'Workspace'}</span>
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
        /* CARDS VIEW: Clean, modern, and uncluttered cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedClients.map(client => {
            const cleanUrl = formatCleanUrlOnly(client.url || client.deploymentUrl);
            const rawPhone = String(client.clientContact || client.phone || '').replace(/\D/g, '');
            const waNumber = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

            return (
              <div
                key={client.id}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  {/* Top Bar: TE-ID, Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-[11px] px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {client.teId || client.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(client.teId || client.id, client.id, 'teId')}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        title="Copy TE-ID"
                      >
                        {copiedTeId === client.id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                      </button>
                    </div>

                    {getStatusBadge(client.status)}
                  </div>

                  {/* Company & Client Name */}
                  <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                    {client.company || client.name}
                  </h3>
                  {client.company && client.name && client.company !== client.name && (
                    <p className="text-xs text-slate-500 mt-0.5">👤 {client.name}</p>
                  )}

                  {/* Assigned Executive & Department */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                      👤 {client.assignedExecutive || client.assignedSupport || 'Unassigned'}
                    </span>
                    {client.department && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                        🏢 {client.department}
                      </span>
                    )}
                  </div>

                  {/* Software URL Box */}
                  <div className="mt-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                    <span className="text-[9px] font-mono uppercase text-slate-400 font-bold block">
                      {isUrdu ? 'کلائنٹ سافٹ ویئر یو آر ایل' : 'Client Software URL'}
                    </span>
                    {cleanUrl ? (
                      <div className="flex items-center justify-between gap-2">
                        <a
                          href={cleanUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline truncate text-xs flex items-center gap-1"
                          title={cleanUrl}
                        >
                          <span className="truncate">{cleanUrl}</span>
                          <ExternalLink size={11} className="shrink-0" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy(cleanUrl, client.id, 'url')}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition cursor-pointer shrink-0"
                          title="Copy URL"
                        >
                          {copiedUrlId === client.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No URL configured</span>
                    )}
                  </div>

                  {/* Special Manager Remark */}
                  <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px]">
                    <span className="text-[9px] font-mono uppercase text-amber-700 dark:text-amber-400 font-bold block">
                      {isUrdu ? 'اسپیشل مینیجر ریمارک' : 'Special Manager Remark'}
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 line-clamp-2 mt-0.5">
                      {client.specialManagerRemark || client.noteSaad || 'Standard monitoring'}
                    </p>
                  </div>
                </div>

                {/* Bottom Bar: Contact & Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {(client.clientContact || client.phone) && (
                      <button
                        type="button"
                        onClick={() => {
                          openWhatsAppChat({
                            phone: waNumber,
                            message: buildBrandedWhatsAppMessage({
                              client,
                              type: 'quick_checkin'
                            })
                          });
                        }}
                        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 transition cursor-pointer"
                        title="WhatsApp Client"
                      >
                        <Phone size={14} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenWorkLog(client.id)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                    >
                      <FileText size={12} />
                      <span>{isUrdu ? 'ورک لاگ' : 'Work Log'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenWorkspace(client.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <FolderOpen size={12} />
                      <span>{isUrdu ? 'ورک اسپیس' : 'Workspace'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 font-mono">
            {isUrdu ? `صفحہ ${currentPage} از ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
