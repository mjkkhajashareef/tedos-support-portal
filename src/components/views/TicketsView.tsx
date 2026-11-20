/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { exportTicketsToCSV } from '../../utils/exportUtils';
import { TicketQueueSidebar } from './tickets/TicketQueueSidebar';
import { TicketDetailHeader } from './tickets/TicketDetailHeader';
import { TicketActivityTabs } from './tickets/TicketActivityTabs';
import { TicketSecondaryTabs } from './tickets/TicketSecondaryTabs';
import { RaiseTicketModal } from './tickets/RaiseTicketModal';
import { Ticket as TicketIcon, Search, Plus, CheckCircle2, X, Download } from 'lucide-react';

export const TicketsView: React.FC = () => {
  const {
    tickets,
    clients,
    allClients,
    users,
    currentUser,
    addTicket,
    updateTicket,
    addTicketWorkLog,
    addTicketFollowUp,
    addTicketWhatsAppLog,
    addTicketTrainingLog,
    openGoogleReviewModal,
    updateClientUrl,
    language
  } = useApp();

  const isUrdu = language === 'ur';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('ALL');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'worklog' | 'followup' | 'whatsapp' | 'training' | 'attachments'>('timeline');
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [ticketToast, setTicketToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isSupportExecutive = currentUser?.role === UserRole.SUPPORT_EXECUTIVE;

  const scopedTickets = useMemo(() => {
    if (!isSupportExecutive || !currentUser) return tickets;
    const myName = (currentUser.name || '').trim().toLowerCase();
    const firstToken = myName.split(' ')[0];
    const assignedClientIds = new Set(currentUser.assignedClients || []);

    return tickets.filter(ticket => {
      const assignedTo = ((ticket as any).assignedExecutive || (ticket as any).assignedTo || '').trim().toLowerCase();
      if (assignedTo === myName || (firstToken && assignedTo.includes(firstToken))) return true;

      const raisedBy = (ticket.raisedBy || (ticket as any).raisedFrom || ticket.createdBy || '').trim().toLowerCase();
      if (raisedBy === myName || (firstToken && raisedBy.includes(firstToken))) return true;

      if (ticket.clientId && assignedClientIds.has(ticket.clientId)) return true;
      return clients.some(c => {
        const cExec = (c.assignedExecutive || c.assignedSupport || '').trim().toLowerCase();
        const matchesClient = c.id === ticket.clientId || c.name === ticket.clientName;
        return matchesClient && (cExec === myName || (firstToken && cExec.includes(firstToken)));
      });
    });
  }, [tickets, isSupportExecutive, currentUser, clients]);

  useEffect(() => {
    if (scopedTickets.length > 0 && (!selectedTicketId || !scopedTickets.some(t => t.id === selectedTicketId))) {
      setSelectedTicketId(scopedTickets[0].id);
    }
  }, [scopedTickets, selectedTicketId]);

  const selectedTicket = scopedTickets.find(t => t.id === selectedTicketId) || scopedTickets[0];
  const clientPool = allClients && allClients.length > 0 ? allClients : clients;
  const selectedClient =
    clientPool.find(
      c => c.id === selectedTicket?.clientId || c.name === selectedTicket?.clientName || c.teId === selectedTicket?.teId
    ) || clients.find(c => c.id === selectedTicket?.clientId);
  const clientSoftwareUrl = selectedClient?.url || selectedClient?.deploymentUrl || '';

  const filteredTickets = scopedTickets.filter(ticket => {
    const matchesSearch =
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.issueCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.issueDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatusFilter === 'ALL' || ticket.status === selectedStatusFilter;
    const matchesPriority = selectedPriorityFilter === 'ALL' || ticket.priority === selectedPriorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const tabs: Array<{ id: typeof activeTab; label: string }> = [
    { id: 'timeline', label: isUrdu ? 'سرگرمیوں کی ٹائم لائن' : 'Chronicle Timeline' },
    { id: 'worklog', label: isUrdu ? '+ ورک لاگ درج کریں' : '+ Add Work Log' },
    { id: 'followup', label: isUrdu ? 'فالو اپ کال شیڈول' : 'Schedule Callback' },
    { id: 'whatsapp', label: isUrdu ? 'واٹس ایپ ٹیمپلیٹ' : 'WhatsApp ping' },
    { id: 'training', label: isUrdu ? 'ٹریننگ سیشن' : 'Training Log' },
    { id: 'attachments', label: isUrdu ? 'دستاویزات و فائلز' : 'Attachments' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-md-on-background flex items-center gap-2">
            <TicketIcon className="text-md-primary" /> {isUrdu ? 'ٹکٹ ورک فلو سینٹر' : 'Ticket Workflow Center'}
          </h1>
          <p className="text-sm text-md-outline font-medium mt-1">
            {isUrdu
              ? 'سپورٹ ٹکٹس، سرگرمیوں کی مکمل ٹائم لائن، ورک لاگز اور شیڈول فالو اپس کا مرکزی نظام۔'
              : 'Centrally manage support lifecycles, chronological activity timelines, work logs, and outbound callbacks.'}
          </p>
        </div>
        <button
          onClick={() => setIsNewTicketOpen(true)}
          className="flex items-center gap-2 bg-md-primary hover:bg-md-primary/90 text-md-on-primary py-2.5 px-5 rounded-xl text-sm font-semibold tracking-wide shadow-sm cursor-pointer shrink-0"
        >
          <Plus size={18} /> {isUrdu ? 'نیا سپورٹ ٹکٹ درج کریں' : 'Raise Support Ticket'}
        </button>
      </div>

      {ticketToast && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold border shadow-sm animate-fade-in ${
            ticketToast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{ticketToast.message}</span>
          </div>
          <button onClick={() => setTicketToast(null)} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-500">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bg-md-surface-container-low border border-md-surface-variant p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute ltr:left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 text-md-outline" />
          <input
            type="text"
            placeholder={isUrdu ? 'ٹکٹ آئی ڈی، کلائنٹ یا کیٹیگری سے تلاش کریں...' : 'Search tickets by ID, client, or category...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl ltr:pl-11 ltr:pr-4 rtl:pr-11 rtl:pl-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-md-primary outline-hidden transition"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="w-full md:w-44 bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2.5 text-sm font-medium outline-hidden"
          >
            <option value="ALL">{isUrdu ? 'تمام صورتحال (All)' : 'All Statuses'}</option>
            <option value="In Progress">{isUrdu ? 'جاری ہے (In Progress)' : 'In Progress'}</option>
            <option value="Escalated">{isUrdu ? 'آگے بھیجا گیا (Escalated)' : 'Escalated'}</option>
            <option value="Resolved">{isUrdu ? 'حل شدہ (Resolved)' : 'Resolved'}</option>
            <option value="Closed">{isUrdu ? 'بند (Closed)' : 'Closed'}</option>
          </select>

          <select
            value={selectedPriorityFilter}
            onChange={e => setSelectedPriorityFilter(e.target.value)}
            className="w-full md:w-40 bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2.5 text-sm font-medium outline-hidden"
          >
            <option value="ALL">{isUrdu ? 'تمام ترجیحات (All)' : 'All Priorities'}</option>
            <option value="Critical">{isUrdu ? 'اہم ترین (Critical)' : 'Critical'}</option>
            <option value="High">{isUrdu ? 'زیادہ (High)' : 'High'}</option>
            <option value="Medium">{isUrdu ? 'درمیانی (Medium)' : 'Medium'}</option>
            <option value="Low">{isUrdu ? 'معمولی (Low)' : 'Low'}</option>
          </select>

          <button
            type="button"
            onClick={() => exportTicketsToCSV(tickets)}
            className="px-3 py-2.5 rounded-xl border border-md-surface-variant bg-md-surface-container-lowest hover:bg-md-surface-variant/40 text-xs font-bold text-md-on-surface flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
            title={isUrdu ? 'ٹکٹس ڈیٹا CSV ڈاؤن لوڈ کریں' : 'Export Tickets to CSV'}
          >
            <Download size={15} className="text-amber-600" />
            <span className="hidden sm:inline">{isUrdu ? 'ایکسپورٹ CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <TicketQueueSidebar
          filteredTickets={filteredTickets}
          selectedTicketId={selectedTicketId}
          onSelectTicket={setSelectedTicketId}
          clientPool={clientPool}
          isUrdu={isUrdu}
        />

        <div className="lg:col-span-8">
          {selectedTicket ? (
            <div className="space-y-6">
              <TicketDetailHeader
                selectedTicket={selectedTicket}
                selectedClient={selectedClient}
                clientSoftwareUrl={clientSoftwareUrl}
                currentUser={currentUser}
                isUrdu={isUrdu}
                updateTicket={updateTicket}
                openGoogleReviewModal={openGoogleReviewModal}
                updateClientUrl={updateClientUrl}
              />

              <div className="border-b border-md-surface-variant flex overflow-x-auto gap-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-4 text-xs font-bold tracking-wide uppercase shrink-0 border-b-2 transition cursor-pointer ${
                      activeTab === tab.id
                        ? 'border-md-primary text-md-primary'
                        : 'border-transparent text-md-outline hover:text-md-on-background'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="min-h-[400px]">
                {(activeTab === 'timeline' || activeTab === 'worklog' || activeTab === 'followup') && (
                  <TicketActivityTabs
                    activeTab={activeTab}
                    selectedTicket={selectedTicket}
                    currentUser={currentUser}
                    isUrdu={isUrdu}
                    addTicketWorkLog={addTicketWorkLog}
                    addTicketFollowUp={addTicketFollowUp}
                  />
                )}
                {(activeTab === 'whatsapp' || activeTab === 'training' || activeTab === 'attachments') && (
                  <TicketSecondaryTabs
                    activeTab={activeTab}
                    selectedTicket={selectedTicket}
                    selectedClient={selectedClient}
                    currentUser={currentUser}
                    isUrdu={isUrdu}
                    addTicketWhatsAppLog={addTicketWhatsAppLog}
                    addTicketTrainingLog={addTicketTrainingLog}
                    updateTicket={updateTicket}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="bg-md-surface-container-low border border-dashed border-md-outline/40 rounded-2xl p-16 text-center space-y-4">
              <div className="p-4 bg-md-surface-container-high text-md-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <TicketIcon size={32} />
              </div>
              <h3 className="text-lg font-bold text-md-on-surface">{isUrdu ? 'کوئی ٹکٹ منتخب نہیں ہے' : 'No Ticket Selected'}</h3>
              <p className="text-sm text-md-outline max-w-md mx-auto">
                {isUrdu
                  ? 'کلائنٹ کی تفصیلات، سرگرمیوں کی ٹائم لائن، واٹس ایپ پیغامات اور فوری ورک لاگ درج کرنے کے لیے بائیں جانب کی فہرست سے کوئی ٹکٹ منتخب کریں۔'
                  : 'Select a support ticket from the active queue to view client parameters, chronicle audit logs, WhatsApp alerts, and submit rapid work logs.'}
              </p>
            </div>
          )}
        </div>
      </div>

      <RaiseTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        clients={clients}
        allClients={allClients}
        users={users}
        currentUser={currentUser}
        isUrdu={isUrdu}
        addTicket={addTicket}
        onCreatedSuccess={msg => {
          setTicketToast({ type: 'success', message: msg });
          setTimeout(() => setTicketToast(null), 6000);
        }}
      />
    </div>
  );
};
