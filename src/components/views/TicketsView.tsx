/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  TimelineEntryType,
  WorkLogEntry,
  FollowUpTracker,
  WhatsAppLogMetadata,
  TrainingLogEntry,
  SupportClient,
  UserRole
} from '../../types';
import { can, Permission } from '../../utils/rbac';
import { MaterialCard } from '../common/MaterialCard';
import {
  Ticket as TicketIcon,
  Search,
  Plus,
  Clock,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Sparkles,
  Database,
  ArrowRight,
  Info,
  CalendarClock,
  MessageSquareCode,
  GraduationCap,
  Paperclip,
  TrendingDown,
  AlertCircle,
  FileText,
  FileImage,
  FileCode,
  ExternalLink,
  ChevronRight,
  History,
  Check,
  Send,
  X,
  Download,
  Star,
  Phone,
  Globe,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportTicketsToCSV } from '../../utils/exportUtils';
import { openWhatsAppChat, buildBrandedWhatsAppMessage, sendInteraktMessage, fetchInteraktConfig, InteraktConfig } from '../../utils/whatsappUtils';
import { VoiceDictationButton } from '../common/VoiceDictationButton';

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

  // 1. Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('ALL');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // 2. Tab navigation in detail panel
  const [activeTab, setActiveTab] = useState<'timeline' | 'worklog' | 'followup' | 'whatsapp' | 'training' | 'attachments'>('timeline');

  // 3. New Ticket Modal State (Req #20 & Op Manager #6, #7: FROM -> TO, Attachment, Ultimate Response 1)
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicketClient, setNewTicketClient] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('Technical Escalation');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');
  const [newTicketExecutive, setNewTicketExecutive] = useState(currentUser?.name || 'Umar Farooq');
  const [newTicketFrom, setNewTicketFrom] = useState(currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Umar Farooq (Support Executive)');
  const [newTicketTo, setNewTicketTo] = useState('COO (Chief Operating Officer)');
  const [newTicketAttachmentUrl, setNewTicketAttachmentUrl] = useState('');
  const [newTicketGoogleFormUrl, setNewTicketGoogleFormUrl] = useState(() => {
    try {
      return localStorage.getItem('tedos_ticket_google_form_url') || '';
    } catch {
      return '';
    }
  });
  const [modalErrors, setModalErrors] = useState<string[]>([]);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketToast, setTicketToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 4. Quick Action Form States
  // A. Work Log State
  const [wlCategory, setWlCategory] = useState('Phone Call');
  const [wlStatus, setWlStatus] = useState('Completed');
  const [wlDuration, setWlDuration] = useState<number>(15);
  const [wlSummary, setWlSummary] = useState('');
  const [wlRemarks, setWlRemarks] = useState('');
  const [wlFollowUpDate, setWlFollowUpDate] = useState('');
  const [wlIsPolishing, setWlIsPolishing] = useState(false);
  const [wlFormError, setWlFormError] = useState('');
  const [wlSuccess, setWlSuccess] = useState(false);

  // B. Follow-up State
  const [fReason, setFReason] = useState('');
  const [fAction, setFAction] = useState('');
  const [fDate, setFDate] = useState('');
  const [fTime, setFTime] = useState('11:00');
  const [fPriority, setFPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [fFormError, setFFormError] = useState('');
  const [fSuccess, setFSuccess] = useState(false);

  // C. WhatsApp State
  const [waTemplate, setWaTemplate] = useState('technician_outreach');
  const [waPhone, setWaPhone] = useState('');
  const [waSuccess, setWaSuccess] = useState(false);

  // D. Training State
  const [tTopic, setTTopic] = useState('POS Checkout Operations');
  const [tDuration, setTDuration] = useState<number>(20);
  const [tAttendees, setTAttendees] = useState<number>(2);
  const [tNotes, setTNotes] = useState('');
  const [tSuccess, setTSuccess] = useState(false);

  // E. Attachments State
  const [attSuccess, setAttSuccess] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [editingUrlInput, setEditingUrlInput] = useState('');

  const isSupportExecutive = currentUser?.role === UserRole.SUPPORT_EXECUTIVE;

  // Requirement: "support team ku unka ticket batana sab Ka Nhi, ayse hi har cheez unki unku batana"
  const scopedTickets = useMemo(() => {
    if (!isSupportExecutive || !currentUser) return tickets;
    const myName = (currentUser.name || '').trim().toLowerCase();
    const firstToken = myName.split(' ')[0];
    const assignedClientIds = new Set(currentUser.assignedClients || []);

    return tickets.filter(ticket => {
      // 1. Assigned to me
      const assignedTo = ((ticket as any).assignedExecutive || (ticket as any).assignedTo || '').trim().toLowerCase();
      if (assignedTo === myName || (firstToken && assignedTo.includes(firstToken))) return true;

      // 2. Raised by or from me
      const raisedBy = (ticket.raisedBy || (ticket as any).raisedFrom || ticket.createdBy || '').trim().toLowerCase();
      if (raisedBy === myName || (firstToken && raisedBy.includes(firstToken))) return true;

      // 3. Client belongs to this support executive
      if (ticket.clientId && assignedClientIds.has(ticket.clientId)) return true;
      const isMyClient = clients.some(c => {
        const cExec = (c.assignedExecutive || c.assignedSupport || '').trim().toLowerCase();
        const matchesClient = c.id === ticket.clientId || c.name === ticket.clientName;
        return matchesClient && (cExec === myName || (firstToken && cExec.includes(firstToken)));
      });
      return isMyClient;
    });
  }, [tickets, isSupportExecutive, currentUser, clients]);

  // Set default selected ticket on load
  useEffect(() => {
    if (scopedTickets.length > 0 && (!selectedTicketId || !scopedTickets.some(t => t.id === selectedTicketId))) {
      setSelectedTicketId(scopedTickets[0].id);
    }
  }, [scopedTickets, selectedTicketId]);

  // Handle autofilling active client data when switching tickets
  const selectedTicket = scopedTickets.find(t => t.id === selectedTicketId) || scopedTickets[0];
  const clientPool = allClients && allClients.length > 0 ? allClients : clients;
  const selectedClient = clientPool.find(c => c.id === selectedTicket?.clientId || c.name === selectedTicket?.clientName || c.teId === selectedTicket?.teId) || clients.find(c => c.id === selectedTicket?.clientId);
  const clientSoftwareUrl = selectedClient?.url || selectedClient?.deploymentUrl || '';

  useEffect(() => {
    if (selectedTicket) {
      // Clear success overlays
      setWlSuccess(false);
      setFSuccess(false);
      setWaSuccess(false);
      setTSuccess(false);
      setAttSuccess(false);
      setEditingUrlInput('');
      
      // Default phone
      if (selectedClient) {
        setWaPhone(selectedClient.phone);
      }
      
      // Default dates
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setWlFollowUpDate(tomorrow.toISOString().split('T')[0]);
      setFDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [selectedTicketId, selectedClient]);

  // Categories for work types
  const workTypes = [
    'Phone Call',
    'WhatsApp',
    'Google Meet Training',
    'Installation',
    'Follow-up',
    'Issue Resolution',
    'Setup',
    'Data Import',
    'Configuration',
    'Other'
  ];

  const statusOptions = [
    'Connected',
    'Completed',
    'Pending',
    'Not Answering',
    'Rescheduled',
    'Escalated',
    'Cancelled'
  ];

  const waTemplates = [
    { id: 'technician_outreach', name: 'Technician outreach update', text: 'Dear customer, our techno-expert is heading to your store location shortly to configure your local POS margins. Please ensure server availability.' },
    { id: 'issue_resolution', name: 'Ticket resolution ping', text: 'Hi! The database lock issue you reported is now resolved. Please test the checkout lane and send back confirmation.' },
    { id: 'daily_health_check', name: 'Standard backup follow-up', text: 'Greetings from Techno Evident! This is a proactive check to confirm your daily backup logs were uploaded successfully.' },
    { id: 'subscription_warning', name: 'License renewal alarm', text: 'Important: Your TEDOS standard software suite license expires shortly. Please complete the subscription payment to avoid billing freezes.' }
  ];

  // Filters logic
  const filteredTickets = scopedTickets.filter(ticket => {
    const matchesSearch =
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.issueCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.issueDescription.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === 'ALL' || ticket.status === selectedStatusFilter;

    const matchesPriority =
      selectedPriorityFilter === 'ALL' || ticket.priority === selectedPriorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Modal creation handler
  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];
    if (!newTicketClient) errors.push(isUrdu ? 'برائے مہربانی سپورٹ کلائنٹ منتخب کریں۔' : 'Please select a valid support client.');
    if (!newTicketCategory.trim()) errors.push(isUrdu ? 'مسئلے کی نوعیت / کیٹیگری درج کریں۔' : 'Please specify the support issue category.');
    if (!newTicketDescription.trim()) errors.push(isUrdu ? 'مسئلے کی مختصر تفصیل درج کریں۔' : 'Please enter a brief issue description.');

    if (errors.length > 0) {
      setModalErrors(errors);
      return;
    }

    setIsSubmittingTicket(true);
    setModalErrors([]);

    try {
      const clientPool = allClients && allClients.length > 0 ? allClients : clients;
      const clientObj = clientPool.find(c => c.id === newTicketClient || c.teId === newTicketClient || c.name === newTicketClient);
      const clientId = clientObj?.id || newTicketClient;
      const clientName = clientObj?.company || clientObj?.name || newTicketClient;
      const clientTeId = clientObj?.teId || clientObj?.id || 'TE-101';

      const assignedUser = users.find(u => u.name === newTicketExecutive);
      const assignedTeId = assignedUser?.employeeId || (currentUser?.name === newTicketExecutive ? currentUser.employeeId : clientTeId);
      const fromStr = newTicketFrom || `${currentUser?.name || 'Support Manager'} (${currentUser?.role || 'Support Manager'})`;
      const toStr = newTicketTo || 'COO (Chief Operating Officer)';
      const response1Summary = `[ULTIMATE RESPONSE 1] Raised FROM: ${fromStr} -> TO: ${toStr} | Issue: ${newTicketCategory} - ${newTicketDescription} | Attachment: ${newTicketAttachmentUrl || 'None'} | Status: Open`;

      if (newTicketGoogleFormUrl.trim()) {
        try {
          localStorage.setItem('tedos_ticket_google_form_url', newTicketGoogleFormUrl.trim());
        } catch {}
      }

      await addTicket({
        teId: assignedTeId || 'TE-101',
        clientId: clientId,
        clientName: clientName,
        issueCategory: newTicketCategory,
        issueDescription: newTicketDescription,
        priority: newTicketPriority,
        status: 'In Progress',
        assignedExecutive: newTicketExecutive,
        createdBy: currentUser?.name || 'Support Manager',
        raisedFrom: fromStr,
        raisedTo: toStr,
        attachmentUrl: newTicketAttachmentUrl.trim() || undefined,
        ultimateResponse1: response1Summary,
        googleFormUrl: newTicketGoogleFormUrl.trim() || undefined
      } as any);

      setTicketToast({
        type: 'success',
        message: isUrdu
          ? `ٹکٹ کامیابی سے درج ہو گیا اور گوگل شیٹ 'Ticket Rase' ٹیب میں خودکار محفوظ ہو گیا!`
          : `Ticket successfully raised and synchronized to Google Sheet ('Ticket Rase') & Ultimate Control!`
      });
      setTimeout(() => setTicketToast(null), 6000);

      // Reset and close
      setNewTicketClient('');
      setNewTicketCategory('Technical Escalation');
      setNewTicketDescription('');
      setNewTicketAttachmentUrl('');
      setNewTicketPriority('High');
      setModalErrors([]);
      setIsNewTicketOpen(false);
    } catch (err: any) {
      setModalErrors([err?.message || (isUrdu ? 'ٹکٹ محفوظ کرتے وقت خرابی پیش آئی۔' : 'Failed to save ticket')]);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Quick Work Log Submission
  const handleQuickWorkLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wlSummary.trim()) {
      setWlFormError('Please summarize the work performed.');
      return;
    }

    addTicketWorkLog(selectedTicket.id, {
      clientId: selectedTicket.clientId,
      clientName: selectedTicket.clientName,
      executiveName: currentUser?.name || 'Asad',
      teId: selectedTicket.teId,
      category: wlCategory,
      details: wlSummary,
      status: wlStatus,
      nextFollowUpDate: wlFollowUpDate,
      priority: selectedTicket.priority,
      durationMinutes: wlDuration,
      remarks: wlRemarks
    });

    setWlSummary('');
    setWlRemarks('');
    setWlFormError('');
    setWlSuccess(true);
    setTimeout(() => setWlSuccess(false), 3000);
  };

  // AI summary polish (Works immediately!)
  const handleAIPolishSummary = () => {
    const raw = wlSummary.trim();
    if (!raw) {
      setWlSummary(
        `✅ [${wlCategory}] Connected with ${selectedTicket?.clientName || 'Client'}. Diagnosed issue (${selectedTicket?.issueCategory}), verified database & printer setup, and confirmed smooth operation. Status: ${wlStatus}.`
      );
      return;
    }
    setWlSummary(
      `✅ [${wlCategory} - ${wlStatus}] ${raw.charAt(0).toUpperCase() + raw.slice(1)}${raw.endsWith('.') ? '' : '.'} Verified with ${selectedTicket?.clientName}.`
    );
  };

  // Quick Follow-up submission
  const handleQuickFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fReason.trim()) {
      setFFormError('Please specify the follow-up callback reason.');
      return;
    }

    addTicketFollowUp(selectedTicket.id, {
      clientId: selectedTicket.clientId,
      clientName: selectedTicket.clientName,
      teId: selectedTicket.teId,
      executiveName: currentUser?.name || 'Asad',
      scheduledDate: fDate || new Date().toISOString().split('T')[0],
      scheduledTime: fTime,
      priority: fPriority,
      lastContactDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      reason: fReason,
      remarks: '',
      nextAction: fAction || 'Callback verification'
    });

    setFReason('');
    setFAction('');
    setFFormError('');
    setFSuccess(true);
    setTimeout(() => setFSuccess(false), 3000);
  };

  // Quick WhatsApp template outreach metadata simulation
  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waPhone.trim()) return;

    const matchedTemp = waTemplates.find(t => t.id === waTemplate);
    if (!matchedTemp) return;

    addTicketWhatsAppLog(selectedTicket.id, {
      templateId: waTemplate,
      templateName: matchedTemp.name,
      recipientPhone: waPhone,
      text: matchedTemp.text
    });

    setWaSuccess(true);
    setTimeout(() => setWaSuccess(false), 3000);
  };

  // Quick Training logging
  const handleTrainingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTopic.trim()) return;

    addTicketTrainingLog(selectedTicket.id, {
      topic: tTopic,
      date: new Date().toISOString().split('T')[0],
      durationMinutes: tDuration,
      attendeesCount: tAttendees,
      conductedBy: currentUser?.name || 'Asad',
      notes: tNotes || 'Conducted standard checkout suite guide session'
    });

    setTNotes('');
    setTSuccess(true);
    setTimeout(() => setTSuccess(false), 3000);
  };

  // Attachments Architecture Mock uploader
  const handleMockAttachmentUpload = (type: 'log' | 'pdf' | 'img') => {
    let mockFile = { id: `att-${Date.now()}`, name: 'screen_diagnostics.txt', sizeBytes: 4210, fileType: 'Document', uploadedAt: new Date().toISOString(), uploadedBy: currentUser?.name || 'Asad' };
    
    if (type === 'pdf') {
      mockFile = { id: `att-${Date.now()}`, name: 'alignment_profile.pdf', sizeBytes: 154090, fileType: 'PDF', uploadedAt: new Date().toISOString(), uploadedBy: currentUser?.name || 'Asad' };
    } else if (type === 'img') {
      mockFile = { id: `att-${Date.now()}`, name: 'crash_stacktrace.png', sizeBytes: 824500, fileType: 'Image', uploadedAt: new Date().toISOString(), uploadedBy: currentUser?.name || 'Asad' };
    }

    const updatedTimeline = [
      ...selectedTicket.timeline,
      {
        id: `tl-${Date.now()}`,
        type: 'Assigned' as TimelineEntryType, // fallback for timeline structural mapping
        timestamp: new Date().toISOString(),
        performedBy: currentUser?.name || 'Asad',
        notes: `Attachment registered to database archive: ${mockFile.name} (${Math.round(mockFile.sizeBytes / 1024)} KB)`
      }
    ];

    const updatedTicket = {
      ...selectedTicket,
      attachments: [...selectedTicket.attachments, mockFile],
      timeline: updatedTimeline,
      updatedDate: new Date().toISOString().split('T')[0]
    };

    updateTicket(selectedTicket.id, updatedTicket);
    setAttSuccess(true);
    setTimeout(() => setAttSuccess(false), 3000);
  };

  // Ticket Status helpers
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'Assigned':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300';
      case 'In Progress':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
      case 'Waiting for Client':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
      case 'Rescheduled':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300';
      case 'Escalated':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'Closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-500 text-white';
      case 'High':
        return 'bg-orange-500 text-white';
      case 'Medium':
        return 'bg-blue-500 text-white';
      case 'Low':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & Stats Indicators */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-md-on-background flex items-center gap-2">
            <TicketIcon className="text-md-primary" /> {isUrdu ? "ٹکٹ ورک فلو سینٹر" : "Ticket Workflow Center"}
          </h1>
          <p className="text-sm text-md-outline font-medium mt-1">
            {isUrdu 
              ? "سپورٹ ٹکٹس، سرگرمیوں کی مکمل ٹائم لائن، ورک لاگز اور شیڈول فالو اپس کا مرکزی نظام۔"
              : "Centrally manage support lifecycles, chronological activity timelines, work logs, and outbound callbacks."}
          </p>
        </div>
        <button
          onClick={() => setIsNewTicketOpen(true)}
          className="flex items-center gap-2 bg-md-primary hover:bg-md-primary/90 text-md-on-primary py-2.5 px-5 rounded-xl text-sm font-semibold tracking-wide shadow-sm cursor-pointer shrink-0"
        >
          <Plus size={18} /> {isUrdu ? "نیا سپورٹ ٹکٹ درج کریں" : "Raise Support Ticket"}
        </button>
      </div>

      {/* Success / Error Notification Toast */}
      {ticketToast && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold border shadow-sm animate-fade-in ${
          ticketToast.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
            : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'
        }`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{ticketToast.message}</span>
          </div>
          <button
            onClick={() => setTicketToast(null)}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-500"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 2. Search & Filters Bar */}
      <div className="bg-md-surface-container-low border border-md-surface-variant p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute ltr:left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 text-md-outline" />
          <input
            type="text"
            placeholder={isUrdu ? "ٹکٹ آئی ڈی، کلائنٹ یا کیٹیگری سے تلاش کریں..." : "Search tickets by ID, client, or category..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl ltr:pl-11 ltr:pr-4 rtl:pr-11 rtl:pl-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-md-primary outline-hidden transition"
          />
        </div>
        
        {/* Status Filter */}
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full md:w-44 bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2.5 text-sm font-medium outline-hidden"
          >
            <option value="ALL">{isUrdu ? "تمام صورتحال (All)" : "All Statuses"}</option>
            <option value="In Progress">{isUrdu ? "جاری ہے (In Progress)" : "In Progress"}</option>
            <option value="Escalated">{isUrdu ? "آگے بھیجا گیا (Escalated)" : "Escalated"}</option>
            <option value="Resolved">{isUrdu ? "حل شدہ (Resolved)" : "Resolved"}</option>
            <option value="Closed">{isUrdu ? "بند (Closed)" : "Closed"}</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriorityFilter}
            onChange={(e) => setSelectedPriorityFilter(e.target.value)}
            className="w-full md:w-40 bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2.5 text-sm font-medium outline-hidden"
          >
            <option value="ALL">{isUrdu ? "تمام ترجیحات (All)" : "All Priorities"}</option>
            <option value="Critical">{isUrdu ? "اہم ترین (Critical)" : "Critical"}</option>
            <option value="High">{isUrdu ? "زیادہ (High)" : "High"}</option>
            <option value="Medium">{isUrdu ? "درمیانی (Medium)" : "Medium"}</option>
            <option value="Low">{isUrdu ? "معمولی (Low)" : "Low"}</option>
          </select>

          {/* Export Tickets to CSV */}
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

      {/* 3. Main Workflow Split Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Tickets Queue List (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-3 max-h-[75vh] overflow-y-auto pr-1">
          <div className="flex justify-between items-center px-1 mb-1">
            <span className="text-xs font-bold tracking-widest text-md-outline uppercase">
              {isUrdu ? `ٹکٹس کی قطار (${filteredTickets.length})` : `TICKETS QUEUE (${filteredTickets.length})`}
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredTickets.length === 0 ? (
              <div className="bg-md-surface-container-lowest border border-dashed border-md-outline/30 rounded-2xl p-8 text-center text-sm text-md-outline font-medium">
                {isUrdu ? "کوئی ٹکٹ نہیں ملا۔" : "No tickets matches filters."}
              </div>
            ) : (
              filteredTickets.map(ticket => {
                const isActive = ticket.id === selectedTicketId;
                return (
                  <motion.div
                    key={ticket.id}
                    layoutId={`ticket-card-${ticket.id}`}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`cursor-pointer rounded-2xl border text-left p-4 transition-all duration-200 ${
                      isActive
                        ? 'bg-md-primary-container/40 border-md-primary ring-1 ring-md-primary'
                        : 'bg-md-surface-container-lowest border-md-surface-variant hover:bg-md-surface-container-low/55'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="text-xs font-mono font-bold tracking-tight text-md-primary">{ticket.id}</span>
                      <div className="flex gap-1">
                        <span className={`text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full ${getStatusStyle(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getPriorityStyle(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-md-on-surface truncate">{ticket.clientName}</h3>
                    <p className="text-xs font-medium text-md-primary mt-1">{ticket.issueCategory}</p>
                    <p className="text-xs text-md-outline font-medium mt-1 line-clamp-2">{ticket.issueDescription}</p>

                    {(() => {
                      const cObj = clientPool.find(c => c.id === ticket.clientId || c.name === ticket.clientName || c.teId === ticket.teId);
                      const u = cObj?.url || cObj?.deploymentUrl;
                      return u ? (
                        <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-[10px] font-mono text-blue-700 dark:text-blue-300 font-bold">
                          <Globe size={11} className="shrink-0 text-blue-500" />
                          <span className="truncate">{u}</span>
                        </div>
                      ) : null;
                    })()}

                    <div className="mt-3 pt-3 border-t border-md-surface-variant/70 flex items-center justify-between text-[10px] font-medium text-md-outline">
                      <span className="flex items-center gap-1"><User size={12} /> {ticket.assignedExecutive}</span>
                      <span>{isUrdu ? "اپ ڈیٹ: " : "Updated: "}{ticket.updatedDate}</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Master Ticket detailed workspace (lg:col-span-8) */}
        <div className="lg:col-span-8">
          {selectedTicket ? (
            <div className="space-y-6">
              
              {/* Core Details Panel */}
              <MaterialCard className="p-6 space-y-4">
                
                {/* Visual Status Bar Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-md-surface-variant">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-md-primary-container text-md-on-primary-container">
                      <TicketIcon size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-black tracking-tight text-md-on-surface">{selectedTicket.id}</h2>
                        <span className="text-xs font-bold text-md-outline">|</span>
                        <span className="text-xs font-mono font-bold text-md-outline uppercase bg-md-surface-container-high px-2 py-0.5 rounded">{selectedTicket.teId}</span>
                      </div>
                      <p className="text-xs text-md-outline font-medium">
                        {isUrdu 
                          ? `تاریخ ایجاد: ${selectedTicket.createdDate} بذریعہ ${selectedTicket.createdBy}` 
                          : `Created on ${selectedTicket.createdDate} by ${selectedTicket.createdBy}`}
                      </p>
                    </div>
                  </div>

                  {/* Operational controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status dropdown */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-md-outline uppercase tracking-wider">
                        {isUrdu ? "اسٹیٹس:" : "Status:"}
                      </span>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => {
                          const newSt = e.target.value as any;
                          const solver = (newSt === 'Resolved' || newSt === 'Closed') ? (currentUser?.name || 'Support Team') : selectedTicket.solvedBy;
                          const resp1 = `[ULTIMATE RESPONSE 1] Ticket ${selectedTicket.id} | FROM: ${selectedTicket.raisedFrom || selectedTicket.createdBy} -> TO: ${selectedTicket.raisedTo || 'COO'} | Status: ${newSt}${solver ? ` | Solved By: ${solver}` : ''}`;
                          updateTicket(selectedTicket.id, {
                            status: newSt,
                            solvedBy: solver,
                            ultimateResponse1: resp1
                          });
                        }}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border border-md-surface-variant outline-hidden cursor-pointer ${getStatusStyle(selectedTicket.status)}`}
                      >
                        <option value="New">{isUrdu ? "نیا (New)" : "New"}</option>
                        <option value="Assigned">{isUrdu ? "تفویض شدہ (Assigned)" : "Assigned"}</option>
                        <option value="In Progress">{isUrdu ? "جاری ہے (In Progress)" : "In Progress"}</option>
                        <option value="Waiting for Client">{isUrdu ? "کلائنٹ کا انتظار (Waiting for Client)" : "Waiting for Client"}</option>
                        <option value="Rescheduled">{isUrdu ? "دوبارہ شیڈول (Rescheduled)" : "Rescheduled"}</option>
                        <option value="Escalated">{isUrdu ? "آگے بھیجا گیا (Escalated)" : "Escalated"}</option>
                        <option value="Resolved">{isUrdu ? "حل شدہ (Resolved)" : "Resolved"}</option>
                        <option value="Closed">{isUrdu ? "بند (Closed)" : "Closed"}</option>
                      </select>
                    </div>

                    {/* Priority Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-md-outline uppercase tracking-wider">
                        {isUrdu ? "ترجیح:" : "Priority:"}
                      </span>
                      <select
                        value={selectedTicket.priority}
                        onChange={(e) => updateTicket(selectedTicket.id, { priority: e.target.value as any })}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border border-md-surface-variant outline-hidden cursor-pointer ${getPriorityStyle(selectedTicket.priority)}`}
                      >
                        <option value="Low">{isUrdu ? "معمولی (Low)" : "Low"}</option>
                        <option value="Medium">{isUrdu ? "درمیانی (Medium)" : "Medium"}</option>
                        <option value="High">{isUrdu ? "زیادہ (High)" : "High"}</option>
                        <option value="Critical">{isUrdu ? "انتہائی اہم (Critical)" : "Critical"}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Info block: client & issue details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-md-surface-container-lowest border border-md-surface-variant p-4 rounded-2xl">
                  <div>
                    <h4 className="text-[10px] font-bold text-md-outline uppercase tracking-widest mb-1">
                      {isUrdu ? "کلائنٹ ورک اسپیس معلومات" : "CLIENT WORKSPACE TARGET"}
                    </h4>
                    <span className="text-sm font-bold text-md-on-surface">{selectedTicket.clientName}</span>
                    <p className="text-xs text-md-outline font-medium mt-0.5">{selectedClient?.company}</p>
                    {selectedClient && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                          {isUrdu ? `صحت: ${selectedClient.healthStatus}%` : `Health: ${selectedClient.healthStatus}%`}
                        </span>
                        <span className="text-xs font-medium text-md-outline">{selectedClient.phone}</span>

                        {/* Direct WhatsApp Chat Action */}
                        {/* Branded WhatsApp Chat Action (TaleemPro Urdu / Edsof English) */}
                        {selectedClient.phone && (
                          <button
                            type="button"
                            onClick={() => {
                              const ticketMsg = buildBrandedWhatsAppMessage({
                                client: selectedClient,
                                type: 'ticket_alert',
                                ticketInfo: {
                                  id: selectedTicket.id,
                                  status: selectedTicket.status,
                                  issue: selectedTicket.issueDescription || selectedTicket.title
                                }
                              });
                              openWhatsAppChat({
                                phone: selectedClient.phone,
                                message: ticketMsg
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer select-none"
                            title={isUrdu ? 'واٹس ایپ پر رابطہ کریں' : 'Chat via WhatsApp'}
                          >
                            <Phone size={11} />
                            <span>WhatsApp</span>
                          </button>
                        )}

                        {/* Request Google Maps Review Action */}
                        <button
                          type="button"
                          onClick={() => openGoogleReviewModal(selectedClient)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer select-none"
                          title={isUrdu ? 'گوگل میپس 5 اسٹار فیڈ بیک اور ریویو حاصل کریں' : 'Request 5-Star Google Maps Review'}
                        >
                          <Star size={11} className="text-amber-500 fill-amber-500" />
                          <span>{isUrdu ? 'گوگل ریویو لیں' : 'Google Review'}</span>
                        </button>
                      </div>
                    )}

                    {/* CLIENT SOFTWARE / PORTAL URL (Requirement #1) */}
                    <div className="mt-3 pt-3 border-t border-md-surface-variant/60 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-md-outline uppercase tracking-wider flex items-center gap-1">
                          <Globe size={12} className="text-blue-600 dark:text-blue-400" />
                          <span>{isUrdu ? 'کلائنٹ سافٹ ویئر لنک (Software URL)' : 'Client Software Portal URL'}</span>
                        </span>
                        {clientSoftwareUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(clientSoftwareUrl);
                              setCopiedUrl(true);
                              setTimeout(() => setCopiedUrl(false), 2000);
                            }}
                            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {copiedUrl ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                            <span>{copiedUrl ? (isUrdu ? 'کاپی ہو گیا!' : 'Copied!') : (isUrdu ? 'لنک کاپی کریں' : 'Copy URL')}</span>
                          </button>
                        )}
                      </div>

                      {clientSoftwareUrl ? (
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <a
                            href={clientSoftwareUrl.startsWith('http') ? clientSoftwareUrl : `https://${clientSoftwareUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-between gap-2 shadow-xs transition active:scale-95"
                            title={isUrdu ? 'کلائنٹ کا سافٹ ویئر براہ راست اوپن کریں' : 'Launch Client Software Portal in new tab'}
                          >
                            <span className="truncate font-mono">{clientSoftwareUrl}</span>
                            <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold shrink-0 flex items-center gap-1">
                              <span>{isUrdu ? 'اوپن سافٹ ویئر' : 'Open Portal'}</span>
                              <ExternalLink size={11} />
                            </span>
                          </a>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-300 dark:border-amber-700/60 text-xs space-y-2">
                          <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-200 text-[11px] font-medium">
                            <AlertCircle size={13} className="text-amber-600 shrink-0" />
                            <span>{isUrdu ? 'اس کلائنٹ کا سافٹ ویئر لنک درج نہیں ہے۔ لنک درج کر کے محفوظ کریں:' : 'No software link found. Save software URL directly:'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="url"
                              placeholder="https://client.technoevident.com"
                              value={editingUrlInput}
                              onChange={(e) => setEditingUrlInput(e.target.value)}
                              className="flex-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg px-2.5 py-1 text-xs font-mono text-md-on-surface"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                const targetId = selectedClient?.id || selectedTicket.clientId || selectedTicket.clientName;
                                if (editingUrlInput.trim() && targetId) {
                                  await updateClientUrl(targetId, editingUrlInput.trim());
                                  setEditingUrlInput('');
                                }
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                            >
                              {isUrdu ? 'محفوظ کریں' : 'Save URL'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-md-outline uppercase tracking-widest mb-1">
                      {isUrdu ? "مسئلے کی کیٹیگری اور تفصیل" : "TICKET FOCUS, FROM/TO & ULTIMATE RESPONSE 1"}
                    </h4>
                    <span className="text-sm font-bold text-md-primary">{selectedTicket.issueCategory}</span>
                    <p className="text-xs text-md-outline font-medium mt-1 italic">"{selectedTicket.issueDescription}"</p>
                    <div className="mt-2 pt-2 border-t border-md-surface-variant/60 space-y-1 text-[11px] font-mono">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-bold">
                          FROM: {selectedTicket.raisedFrom || selectedTicket.createdBy}
                        </span>
                        <span>→</span>
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 font-bold">
                          TO: {selectedTicket.raisedTo || 'COO / Technical Team'}
                        </span>
                        {selectedTicket.solvedBy && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 font-bold">
                            ✅ Solved By: {selectedTicket.solvedBy}
                          </span>
                        )}
                      </div>
                      {selectedTicket.attachmentUrl && (
                        <a
                          href={selectedTicket.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline flex items-center gap-1"
                        >
                          <Paperclip size={11} /> Attachment: {selectedTicket.attachmentUrl}
                        </a>
                      )}
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[10px] text-amber-800 dark:text-amber-300">
                        <strong>Ultimate Sheet [Response 1]:</strong>{' '}
                        {selectedTicket.ultimateResponse1 ||
                          `Raised by ${selectedTicket.createdBy} -> Assigned to ${selectedTicket.assignedExecutive} (${selectedTicket.status})`}
                      </div>
                    </div>
                  </div>
                </div>
              </MaterialCard>

              {/* Requirement #21: Clear Guide Explaining Add Work Log, Schedule Callback, WhatsApp Ping, Training Log & Attachments */}
              <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-[11px] grid grid-cols-1 sm:grid-cols-5 gap-2">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <strong className="text-blue-600 block">1. + Add Work Log</strong>
                  <span className="text-slate-500 text-[10px]">Record call/support duration & summary directly to Daily Work Log sheet.</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <strong className="text-purple-600 block">2. Schedule Callback</strong>
                  <span className="text-slate-500 text-[10px]">Set next follow-up date & time; auto-syncs to Follow-Up & Ultimate sheet.</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <strong className="text-emerald-600 block">3. WhatsApp Ping</strong>
                  <span className="text-slate-500 text-[10px]">Send 1-click WhatsApp template update to client & log WhatsApp KPI.</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <strong className="text-teal-600 block">4. Training Log</strong>
                  <span className="text-slate-500 text-[10px]">Record client staff training topic, duration & attendees count.</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <strong className="text-amber-600 block">5. Attachments</strong>
                  <span className="text-slate-500 text-[10px]">Attach screenshots, error logs, PDFs or Google Drive links to the ticket.</span>
                </div>
              </div>

              {/* 4. Tabs switcher panel */}
              <div className="border-b border-md-surface-variant flex overflow-x-auto gap-2">
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`py-2 px-4 text-xs font-bold tracking-wide uppercase shrink-0 border-b-2 transition cursor-pointer ${
                    activeTab === 'timeline'
                      ? 'border-md-primary text-md-primary'
                      : 'border-transparent text-md-outline hover:text-md-on-background'
                  }`}
                >
                  {isUrdu ? "سرگرمیوں کی ٹائم لائن" : "Chronicle Timeline"}
                </button>
                <button
                  onClick={() => setActiveTab('worklog')}
                  className={`py-2 px-4 text-xs font-bold tracking-wide uppercase shrink-0 border-b-2 transition cursor-pointer ${
                    activeTab === 'worklog'
                      ? 'border-md-primary text-md-primary'
                      : 'border-transparent text-md-outline hover:text-md-on-background'
                  }`}
                >
                  {isUrdu ? "+ ورک لاگ درج کریں" : "+ Add Work Log"}
                </button>
                <button
                  onClick={() => setActiveTab('followup')}
                  className={`py-2 px-4 text-xs font-bold tracking-wide uppercase shrink-0 border-b-2 transition cursor-pointer ${
                    activeTab === 'followup'
                      ? 'border-md-primary text-md-primary'
                      : 'border-transparent text-md-outline hover:text-md-on-background'
                  }`}
                >
                  {isUrdu ? "فالو اپ کال شیڈول" : "Schedule Callback"}
                </button>
                <button
                  onClick={() => setActiveTab('whatsapp')}
                  className={`py-2 px-4 text-xs font-bold tracking-wide uppercase shrink-0 border-b-2 transition cursor-pointer ${
                    activeTab === 'whatsapp'
                      ? 'border-md-primary text-md-primary'
                      : 'border-transparent text-md-outline hover:text-md-on-background'
                  }`}
                >
                  {isUrdu ? "واٹس ایپ ٹیمپلیٹ" : "WhatsApp ping"}
                </button>
                <button
                  onClick={() => setActiveTab('training')}
                  className={`py-2 px-4 text-xs font-bold tracking-wide uppercase shrink-0 border-b-2 transition cursor-pointer ${
                    activeTab === 'training'
                      ? 'border-md-primary text-md-primary'
                      : 'border-transparent text-md-outline hover:text-md-on-background'
                  }`}
                >
                  {isUrdu ? "ٹریننگ سیشن" : "Training Log"}
                </button>
                <button
                  onClick={() => setActiveTab('attachments')}
                  className={`py-2 px-4 text-xs font-bold tracking-wide uppercase shrink-0 border-b-2 transition cursor-pointer ${
                    activeTab === 'attachments'
                      ? 'border-md-primary text-md-primary'
                      : 'border-transparent text-md-outline hover:text-md-on-background'
                  }`}
                >
                  {isUrdu ? "دستاویزات و فائلز" : "Attachments"}
                </button>
              </div>

              {/* 5. Tab Panels Display */}
              <div className="min-h-[400px]">
                
                {/* Tab: Chronicle Timeline */}
                {activeTab === 'timeline' && (
                  <MaterialCard className="p-6 space-y-6">
                    <div className="flex justify-between items-center pb-2 border-b border-md-surface-variant/60">
                      <h3 className="text-sm font-bold text-md-on-surface flex items-center gap-2">
                        <History size={16} className="text-md-primary" /> {isUrdu ? "سرگرمیوں کا مکمل ریکارڈ (Audit Log)" : "Chronicle Activity Audit Log"}
                      </h3>
                      <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded uppercase">
                        {isUrdu ? "تصدیق شدہ و محفوظ" : "Verified Secure"}
                      </span>
                    </div>

                    <div className="relative border-l-2 border-md-surface-variant ml-3 pl-6 space-y-6">
                      {selectedTicket.timeline.map((entry, idx) => {
                        // Color mapper for timeline nodes
                        let iconColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
                        let IconNode = Info;

                        if (entry.type === 'Ticket Created') {
                          iconColor = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
                          IconNode = TicketIcon;
                        } else if (entry.type === 'Work Log Added') {
                          iconColor = 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
                          IconNode = Clock;
                        } else if (entry.type === 'Follow-up Scheduled') {
                          iconColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
                          IconNode = CalendarClock;
                        } else if (entry.type === 'WhatsApp Sent') {
                          iconColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
                          IconNode = MessageSquareCode;
                        } else if (entry.type === 'Training Conducted') {
                          iconColor = 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
                          IconNode = GraduationCap;
                        } else if (entry.type === 'Resolved' || entry.type === 'Closed') {
                          iconColor = 'bg-emerald-500 text-white';
                          IconNode = CheckCircle2;
                        } else if (entry.type === 'Issue Escalated') {
                          iconColor = 'bg-red-500 text-white';
                          IconNode = AlertTriangle;
                        }

                        return (
                          <div key={entry.id || idx} className="relative">
                            {/* Icon pill */}
                            <span className={`absolute -left-[37px] top-0.5 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-md-background ${iconColor}`}>
                              <IconNode size={12} />
                            </span>

                            <div className="flex items-center justify-between gap-4">
                              <span className="text-xs font-bold text-md-on-surface">{entry.type}</span>
                              <span className="text-[10px] text-md-outline font-medium font-mono">{new Date(entry.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-xs font-medium text-md-outline mt-1 font-mono uppercase">
                              {isUrdu ? "بذریعہ: " : "Performed By: "}{entry.performedBy}
                            </p>
                            <p className="text-xs font-medium text-md-on-surface-variant/90 bg-md-surface-container-lowest border border-md-surface-variant/40 p-2.5 rounded-xl mt-1.5">{entry.notes}</p>
                          </div>
                        );
                      })}
                    </div>
                  </MaterialCard>
                )}

                {/* Tab: Work Log Form */}
                {activeTab === 'worklog' && (
                  <MaterialCard className="p-6">
                    <form onSubmit={handleQuickWorkLogSubmit} className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-md-surface-variant/60">
                        <h3 className="text-sm font-bold text-md-on-surface flex items-center gap-2">
                          <Clock size={16} className="text-md-primary" /> {isUrdu ? "فوری سپورٹ ورک لاگ اندراج" : "Log Ticket activity in 30 Seconds"}
                        </h3>
                        <span className="text-[10px] text-md-outline font-medium">
                          {isUrdu ? "براہ راست ٹائم لائن سے منسلک" : "Direct Timeline Sync"}
                        </span>
                      </div>

                      {wlSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600" /> {isUrdu ? "ورک لاگ کامیابی سے ٹکٹ ٹائم لائن میں شامل ہو گیا!" : "Work Log registered successfully onto ticket timeline!"}
                        </div>
                      )}

                      {wlFormError && (
                        <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
                          <AlertCircle size={16} className="text-red-600" /> {wlFormError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Auto Field Info */}
                        <div className="bg-md-surface-container-lowest border border-md-surface-variant/60 p-3 rounded-xl flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-md-outline uppercase">{isUrdu ? "سپورٹ ایگزیکٹو" : "Logged Executive"}</span>
                          <span className="text-xs font-bold text-md-on-surface flex items-center gap-1.5 mt-0.5"><User size={13} /> {currentUser?.name || 'Asad'}</span>
                        </div>

                        <div className="bg-md-surface-container-lowest border border-md-surface-variant/60 p-3 rounded-xl flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-md-outline uppercase">{isUrdu ? "تاریخ / وقت" : "Date / Time"}</span>
                          <span className="text-xs font-bold text-md-on-surface flex items-center gap-1.5 mt-0.5"><Calendar size={13} /> {new Date().toLocaleDateString()}</span>
                        </div>

                        <div className="bg-md-surface-container-lowest border border-md-surface-variant/60 p-3 rounded-xl flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-md-outline uppercase">{isUrdu ? "فعال ٹکٹ آئی ڈی" : "Active ID link"}</span>
                          <span className="text-xs font-mono font-bold text-md-primary mt-0.5">{selectedTicket.id}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? "کام کی نوعیت" : "Work Type"}</label>
                          <select
                            value={wlCategory}
                            onChange={(e) => setWlCategory(e.target.value)}
                            className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden"
                          >
                            {workTypes.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? "سرگرمی کا اسٹیٹس" : "Activity Status"}</label>
                          <select
                            value={wlStatus}
                            onChange={(e) => setWlStatus(e.target.value)}
                            className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden"
                          >
                            {statusOptions.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? "اگلی فالو اپ تاریخ" : "Follow-up Date"}</label>
                          <input
                            type="date"
                            value={wlFollowUpDate}
                            onChange={(e) => setWlFollowUpDate(e.target.value)}
                            className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2 text-xs font-medium outline-hidden"
                          />
                        </div>
                      </div>

                      {/* Duration helper */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-xs font-bold text-md-outline uppercase">{isUrdu ? "کام کا دورانیہ (منٹ)" : "Duration (Minutes)"}</label>
                          <span className="text-xs font-mono text-md-primary font-bold">{wlDuration} {isUrdu ? "منٹ" : "Minutes"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="5"
                            max="120"
                            step="5"
                            value={wlDuration}
                            onChange={(e) => setWlDuration(Number(e.target.value))}
                            className="flex-1 accent-md-primary"
                          />
                          <div className="flex gap-1">
                            {[10, 15, 30, 45, 60].map(mins => (
                              <button
                                type="button"
                                key={mins}
                                onClick={() => setWlDuration(mins)}
                                className={`px-2 py-1 text-[10px] rounded font-bold border transition cursor-pointer ${
                                  wlDuration === mins
                                    ? 'bg-md-primary text-md-on-primary border-md-primary'
                                    : 'bg-md-surface-container-lowest text-md-on-surface-variant border-md-surface-variant hover:bg-md-surface-variant/20'
                                }`}
                              >
                                {mins}{isUrdu ? " منٹ" : "m"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Summary with AI Polish & Voice Note */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5 flex-wrap gap-2">
                          <label className="block text-xs font-bold text-md-outline uppercase">{isUrdu ? "کام کی تفصیل اور حل" : "Activity Summary"}</label>
                          <div className="flex items-center gap-1.5">
                            <VoiceDictationButton
                              onTranscript={(text) => setWlSummary(prev => (prev ? prev + ' ' + text : text))}
                              defaultLang="ur-PK"
                            />
                            <button
                              type="button"
                              onClick={handleAIPolishSummary}
                              className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 py-1 px-2.5 rounded hover:bg-emerald-100 transition cursor-pointer"
                            >
                              <Sparkles size={11} /> {isUrdu ? "AI کے ذریعے درست کریں" : "✨ AI Polish Summary"}
                            </button>
                          </div>
                        </div>
                        <textarea
                          placeholder={isUrdu ? "آپ نے کیا کام کیا؟ تفصیلی نوٹس یہاں لکھیں..." : "What did you do? Write notes or press AI Polish..."}
                          value={wlSummary}
                          onChange={(e) => setWlSummary(e.target.value)}
                          rows={3}
                          className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl p-3 text-xs font-medium outline-hidden resize-none focus:ring-1 focus:ring-md-primary"
                        />
                      </div>

                      {/* Remarks */}
                      <div>
                        <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? "اندرونی دفتری ریمارکس" : "Remarks / Internal notes"}</label>
                        <input
                          type="text"
                          placeholder={isUrdu ? "اختیاری اندرونی دفتری ریمارکس..." : "Optional internal executive notes..."}
                          value={wlRemarks}
                          onChange={(e) => setWlRemarks(e.target.value)}
                          className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden focus:ring-1 focus:ring-md-primary"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-md-primary hover:bg-md-primary/95 text-md-on-primary py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition cursor-pointer flex justify-center items-center gap-2"
                      >
                        {isUrdu ? "ورک لاگ ٹکٹ میں محفوظ کریں" : "Submit 30s Work Log"}
                      </button>
                    </form>
                  </MaterialCard>
                )}

                {/* Tab: Schedule Follow-up */}
                {activeTab === 'followup' && (
                  <MaterialCard className="p-6">
                    <form onSubmit={handleQuickFollowUpSubmit} className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-md-surface-variant/60">
                        <h3 className="text-sm font-bold text-md-on-surface flex items-center gap-2">
                          <CalendarClock size={16} className="text-md-primary" /> {isUrdu ? "فالو اپ کال شیڈول کریں" : "Schedule Callback Follow-up"}
                        </h3>
                        <span className="text-[10px] text-md-outline font-medium">{isUrdu ? "ٹیکنو ایویڈنٹ SOP" : "Techno Evident Support SOP"}</span>
                      </div>

                      {fSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600" /> {isUrdu ? "فالو اپ کال کامیابی سے ٹکٹ ٹائم لائن میں درج ہو گئی!" : "Follow-up callback registered onto ticket timeline!"}
                        </div>
                      )}

                      {fFormError && (
                        <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
                          <AlertCircle size={16} className="text-red-600" /> {fFormError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? "شیڈول تاریخ" : "Scheduled Date"}</label>
                          <input
                            type="date"
                            value={fDate}
                            onChange={(e) => setFDate(e.target.value)}
                            className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2 text-xs font-medium outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? "شیڈول وقت" : "Scheduled Time"}</label>
                          <input
                            type="time"
                            value={fTime}
                            onChange={(e) => setFTime(e.target.value)}
                            className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2 text-xs font-medium outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? "ترجیح" : "Priority"}</label>
                          <select
                            value={fPriority}
                            onChange={(e) => setFPriority(e.target.value as any)}
                            className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden"
                          >
                            <option value="Low">{isUrdu ? "معمولی ترجیح (Low)" : "Low Priority"}</option>
                            <option value="Medium">{isUrdu ? "درمیانی ترجیح (Medium)" : "Medium Priority"}</option>
                            <option value="High">{isUrdu ? "زیادہ ترجیح (High)" : "High Priority"}</option>
                            <option value="Critical">{isUrdu ? "انتہائی اہم ترجیح (Critical)" : "Critical Priority"}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? "اگلا ہدف / اقدام" : "Target Next Action"}</label>
                          <input
                            type="text"
                            placeholder={isUrdu ? "مثال: پرنٹر مارجن تصدیق کے لیے کال..." : "e.g. Printer margin alignment validation"}
                            value={fAction}
                            onChange={(e) => setFAction(e.target.value)}
                            className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden focus:ring-1 focus:ring-md-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? "فالو اپ کال کا مقصد" : "Callback Follow-up Purpose"}</label>
                        <textarea
                          placeholder={isUrdu ? "کلائنٹ کو دوبارہ رابطہ کرنے کا مقصد درج کریں..." : "State the objective of the followup callback call..."}
                          value={fReason}
                          onChange={(e) => setFReason(e.target.value)}
                          rows={3}
                          className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl p-3 text-xs font-medium outline-hidden resize-none focus:ring-1 focus:ring-md-primary"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-md-primary hover:bg-md-primary/95 text-md-on-primary py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition cursor-pointer flex justify-center items-center gap-2"
                      >
                        {isUrdu ? "فالو اپ کال محفوظ کریں" : "Schedule Support Callback"}
                      </button>
                    </form>
                  </MaterialCard>
                )}

                {/* Tab: WhatsApp Templates Log */}
                {activeTab === 'whatsapp' && (
                  <MaterialCard className="p-6">
                    <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-md-surface-variant/60">
                        <h3 className="text-sm font-bold text-md-on-surface flex items-center gap-2">
                          <MessageSquareCode size={16} className="text-md-primary" /> {isUrdu ? "واٹس ایپ سپورٹ ٹیمپلیٹس" : "WhatsApp Outreach Templates"}
                        </h3>
                        <span className="text-[10px] text-md-outline font-medium">{isUrdu ? "ٹیکنو SOP مواصلات" : "Techno SOP Communications"}</span>
                      </div>

                      {waSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600" /> {isUrdu ? "واٹس ایپ میسج لاگ کامیابی سے درج ہو گیا!" : "WhatsApp Template alert registered in Ticket activity audit!"}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? "وصول کنندہ کا فون نمبر" : "Recipient Phone"}</label>
                          <input
                            type="text"
                            value={waPhone}
                            onChange={(e) => setWaPhone(e.target.value)}
                            placeholder="+91..."
                            className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden focus:ring-1 focus:ring-md-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? "منظور شدہ ٹیمپلیٹ منتخب کریں" : "Select Approved SOP Template"}</label>
                          <select
                            value={waTemplate}
                            onChange={(e) => setWaTemplate(e.target.value)}
                            className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden"
                          >
                            {waTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Display Template body */}
                      <div className="bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 p-4 rounded-xl">
                        <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block mb-1">
                          {isUrdu ? "پیغام کا متن:" : "Approved Template SMS Body"}
                        </span>
                        <p className="text-xs text-md-on-surface-variant font-medium">
                          {waTemplates.find(t => t.id === waTemplate)?.text}
                        </p>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition cursor-pointer flex justify-center items-center gap-2"
                      >
                        <Send size={14} /> {isUrdu ? "واٹس ایپ پیغام بھیجیں اور لاگ کریں" : "Send Outbound Template ping"}
                      </button>
                    </form>
                  </MaterialCard>
                )}

                {/* Tab: Training Record */}
                {activeTab === 'training' && (
                  <MaterialCard className="p-6">
                    <form onSubmit={handleTrainingSubmit} className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-md-surface-variant/60">
                        <h3 className="text-sm font-bold text-md-on-surface flex items-center gap-2">
                          <GraduationCap size={16} className="text-md-primary" /> {isUrdu ? "کلائنٹ ٹریننگ سیشن درج کریں" : "Register Client Training Session"}
                        </h3>
                        <span className="text-[10px] text-md-outline font-medium">{isUrdu ? "صلاحیت اور ہیلتھ میں بہتری" : "Improve health metrics"}</span>
                      </div>

                      {tSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600" /> {isUrdu ? "ٹریننگ سیشن کامیابی سے ٹائم لائن میں درج ہو گیا!" : "Training Session registered in activity timeline!"}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? "ٹریننگ کا موضوع" : "Training Topic"}</label>
                          <input
                            type="text"
                            value={tTopic}
                            onChange={(e) => setTTopic(e.target.value)}
                            placeholder={isUrdu ? "مثال: بلنگ اور انوینٹری کا استعمال..." : "e.g. Automated Backup administration"}
                            className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden focus:ring-1 focus:ring-md-primary"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? "دورانیہ (منٹ)" : "Duration"}</label>
                            <input
                              type="number"
                              value={tDuration}
                              onChange={(e) => setTDuration(Number(e.target.value))}
                              className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2 text-xs font-medium outline-hidden focus:ring-1 focus:ring-md-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? "شرکاء کی تعداد" : "Attendees"}</label>
                            <input
                              type="number"
                              value={tAttendees}
                              onChange={(e) => setTAttendees(Number(e.target.value))}
                              className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2 text-xs font-medium outline-hidden focus:ring-1 focus:ring-md-primary"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? "ٹریننگ نوٹس" : "Training Notes"}</label>
                        <textarea
                          placeholder={isUrdu ? "ٹریننگ سیشن میں کلائنٹ کو کیا سکھایا گیا؟..." : "What features were taught during the training session?..."}
                          value={tNotes}
                          onChange={(e) => setTNotes(e.target.value)}
                          rows={3}
                          className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl p-3 text-xs font-medium outline-hidden resize-none focus:ring-1 focus:ring-md-primary"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-md-primary hover:bg-md-primary/95 text-md-on-primary py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition cursor-pointer flex justify-center items-center gap-2"
                      >
                        {isUrdu ? "ٹریننگ لاگ محفوظ کریں" : "Submit Training Log"}
                      </button>
                    </form>
                  </MaterialCard>
                )}

                {/* Tab: Attachments Architecture */}
                {activeTab === 'attachments' && (
                  <MaterialCard className="p-6 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-md-surface-variant/60">
                      <h3 className="text-sm font-bold text-md-on-surface flex items-center gap-2">
                        <Paperclip size={16} className="text-md-primary" /> {isUrdu ? "تشخیصی فائلز و دستاویزات" : "Diagnostic Attachments Vault"}
                      </h3>
                      <span className="text-[10px] text-md-outline font-medium">{isUrdu ? "محفوظ اسٹوریج" : "Enterprise secure storage"}</span>
                    </div>

                    {attSuccess && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600" /> {isUrdu ? "فائل کامیابی سے منسلک ہو گئی!" : "Mock attachment registered to ticket audit trace!"}
                      </div>
                    )}

                    {/* Quick Mock upload triggers */}
                    <div className="bg-md-surface-container-lowest border border-md-surface-variant/80 p-4 rounded-2xl">
                      <span className="text-[10px] font-bold text-md-outline uppercase tracking-wider block mb-2">
                        {isUrdu ? "سپورٹ فائلز اپ لوڈ کا تخمینہ:" : "Simulate upload of support files:"}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleMockAttachmentUpload('log')}
                          className="bg-md-surface-container-low hover:bg-md-surface-variant text-md-on-surface-variant border border-md-surface-variant py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileCode size={13} className="text-indigo-600" /> + Stacktrace.log
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMockAttachmentUpload('pdf')}
                          className="bg-md-surface-container-low hover:bg-md-surface-variant text-md-on-surface-variant border border-md-surface-variant py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText size={13} className="text-red-600" /> + Config_Profile.pdf
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMockAttachmentUpload('img')}
                          className="bg-md-surface-container-low hover:bg-md-surface-variant text-md-on-surface-variant border border-md-surface-variant py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileImage size={13} className="text-amber-600" /> + Screen_Freeze_capture.png
                        </button>
                      </div>
                    </div>

                    {/* List Attachments */}
                    <div className="space-y-2">
                      {selectedTicket.attachments.length === 0 ? (
                        <div className="text-center py-6 text-xs text-md-outline font-medium bg-md-surface-container-lowest rounded-xl border border-dashed border-md-outline/20">
                          {isUrdu ? "اس ٹکٹ کے ساتھ کوئی فائل منسلک نہیں ہے۔" : "No diagnostic attachments loaded for this ticket."}
                        </div>
                      ) : (
                        selectedTicket.attachments.map(att => (
                          <div
                            key={att.id}
                            className="flex items-center justify-between p-3.5 bg-md-surface-container-lowest border border-md-surface-variant rounded-2xl"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl bg-md-primary-container text-md-on-primary-container">
                                {att.fileType === 'Document' ? <FileCode size={16} /> : att.fileType === 'PDF' ? <FileText size={16} /> : <FileImage size={16} />}
                              </div>
                              <div className="text-left">
                                <span className="text-xs font-bold text-md-on-surface truncate block max-w-[200px] sm:max-w-xs">{att.name}</span>
                                <span className="text-[10px] text-md-outline block font-medium">
                                  {isUrdu ? "اپ لوڈ بذریعہ: " : "Uploaded by "}{att.uploadedBy} • {Math.round(att.sizeBytes / 1024)} KB
                                </span>
                              </div>
                            </div>

                            <a
                              href="#download"
                              onClick={(e) => e.preventDefault()}
                              className="text-xs font-bold text-md-primary flex items-center gap-1 hover:underline"
                            >
                              {isUrdu ? "ڈاؤن لوڈ" : "Download"} <ExternalLink size={12} />
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  </MaterialCard>
                )}

              </div>

            </div>
          ) : (
            <div className="bg-md-surface-container-low border border-dashed border-md-outline/40 rounded-2xl p-16 text-center space-y-4">
              <div className="p-4 bg-md-surface-container-high text-md-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <TicketIcon size={32} />
              </div>
              <h3 className="text-lg font-bold text-md-on-surface">
                {isUrdu ? "کوئی ٹکٹ منتخب نہیں ہے" : "No Ticket Selected"}
              </h3>
              <p className="text-sm text-md-outline max-w-md mx-auto">
                {isUrdu
                  ? "کلائنٹ کی تفصیلات، سرگرمیوں کی ٹائم لائن، واٹس ایپ پیغامات اور فوری ورک لاگ درج کرنے کے لیے بائیں جانب کی فہرست سے کوئی ٹکٹ منتخب کریں۔"
                  : "Select a support ticket from the active queue to view client parameters, chronicle audit logs, WhatsApp alerts, and submit rapid work logs."}
              </p>
            </div>
          )}
        </div>

      </div>

      {/* 6. Raise Support Ticket Modal */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-md-surface-container-lowest border border-md-surface-variant rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center pb-4 border-b border-md-surface-variant">
              <h2 className="text-base font-black text-md-on-surface flex items-center gap-2">
                <TicketIcon className="text-md-primary" size={18} /> 
                {isUrdu ? "نیا انٹرپرائز سپورٹ ٹکٹ درج کریں" : "Raise Enterprise Support Ticket"}
              </h2>
              <button
                onClick={() => {
                  setModalErrors([]);
                  setIsNewTicketOpen(false);
                }}
                className="p-1 rounded-full hover:bg-md-surface-variant text-md-on-surface-variant cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-4 mt-4">
              {modalErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl space-y-1">
                  {modalErrors.map((err, idx) => <p key={idx}>{err}</p>)}
                </div>
              )}

              {/* FROM and TO fields (Req #20: "Ticket race agar from hai to TO hona hai") */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-500/5 p-3.5 rounded-xl border border-blue-500/20">
                <div>
                  <label className="block text-xs font-bold text-blue-600 uppercase mb-1">
                    FROM (Ticket Raised By) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTicketFrom}
                    onChange={e => setNewTicketFrom(e.target.value)}
                    placeholder="e.g. Support Manager / Executive"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-600 uppercase mb-1">
                    TO (Target Recipient / Authority) *
                  </label>
                  <select
                    value={newTicketTo}
                    onChange={e => setNewTicketTo(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="COO (Chief Operating Officer)">COO (Chief Operating Officer)</option>
                    <option value="Operation Manager">Operation Manager</option>
                    <option value="Support Manager">Support Manager</option>
                    <option value="Technical Team">Technical Team</option>
                    <option value="Director">Director</option>
                  </select>
                </div>
              </div>

              {/* Target Client selection */}
              <div>
                <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">
                  {isUrdu ? "کلائنٹ ورک اسپیس منتخب کریں" : "Target Client Workspace"}
                </label>
                <select
                  value={newTicketClient}
                  onChange={(e) => setNewTicketClient(e.target.value)}
                  className="w-full bg-md-surface-container-low border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden"
                >
                  <option value="">{isUrdu ? "-- کلائنٹ منتخب کریں --" : "-- Select Client Workspace --"}</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
                </select>
              </div>

              {/* Attachment URL / Proof Option (Op Manager Req #7: "Ticket race kar rahe hai uske attachment ka option") */}
              <div>
                <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">
                  📎 Ticket Attachment Link / Screenshot URL (Synced to Ultimate Response 1)
                </label>
                <input
                  type="text"
                  value={newTicketAttachmentUrl}
                  onChange={e => setNewTicketAttachmentUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or screenshot/document link..."
                  className="w-full bg-md-surface-container-low border border-md-surface-variant rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              {/* Google Sheet "Ticket Rase" Tab Notice */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                <Database size={16} className="text-emerald-600 shrink-0" />
                <div className="space-y-0.5">
                  <span className="font-bold block">
                    {isUrdu ? "گوگل شیٹ 'Ticket Rase' ٹیب سنک" : "Ultimate Control Sheet -> Tab 'Ticket Rase' Sync"}
                  </span>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    {isUrdu 
                      ? "یہ ٹکٹ سافٹ ویئر کے ساتھ ساتھ آپ کی Ultimate Support Control Sheet کی 'Ticket Rase' ٹیب میں خودکار محفوظ ہو گا۔"
                      : "This ticket will automatically log to the 'Ticket Rase' tab in your Ultimate Support Control Sheet."}
                  </p>
                </div>
              </div>

              {/* Google Form Link Input */}
              <div>
                <label className="block text-xs font-bold text-md-outline uppercase mb-1.5 flex items-center justify-between">
                  <span>{isUrdu ? "گوگل فارم لنک (ٹکٹ ریز فارم)" : "Google Form Link (Ticket Raise Form)"}</span>
                  <span className="text-[10px] text-emerald-600 font-bold font-mono">
                    {newTicketGoogleFormUrl ? "✓ Saved & Synced" : "Auto-Fill & Sheet Sync"}
                  </span>
                </label>
                <input
                  type="url"
                  value={newTicketGoogleFormUrl}
                  onChange={e => {
                    const val = e.target.value;
                    setNewTicketGoogleFormUrl(val);
                    try {
                      localStorage.setItem('tedos_ticket_google_form_url', val.trim());
                    } catch {}
                  }}
                  placeholder="https://docs.google.com/forms/d/e/.../viewform or form response URL"
                  className="w-full bg-md-surface-container-low border border-md-surface-variant rounded-xl px-3 py-2 text-xs font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {isUrdu
                    ? "جب آپ یہاں فارم کا لنک درج کریں گے تو سافٹ ویئر میں ٹکٹ ریز ہوتے ہی ڈیٹا خودکار طور پر اس فارم اور Ultimate Support Control Sheet کی 'Ticket Rase' ٹیب دونوں میں پہنچ جائے گا۔"
                    : "Entering your Google Form link here ensures ticket data submits to both the form and the 'Ticket Rase' tab in your Ultimate Support Control Sheet."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">
                    {isUrdu ? "مسئلے کی نوعیت / کیٹیگری" : "Issue Category"}
                  </label>
                  <input
                    type="text"
                    placeholder={isUrdu ? "مثال: ڈیٹا بیس تعطل، پرنٹر ایشو..." : "e.g. Database Freeze"}
                    value={newTicketCategory}
                    onChange={(e) => setNewTicketCategory(e.target.value)}
                    className="w-full bg-md-surface-container-low border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden focus:ring-1 focus:ring-md-primary"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">
                    {isUrdu ? "ترجیحی درجہ" : "Priority Level"}
                  </label>
                  <select
                    value={newTicketPriority}
                    onChange={(e) => setNewTicketPriority(e.target.value as any)}
                    className="w-full bg-md-surface-container-low border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden"
                  >
                    <option value="Low">{isUrdu ? "معمولی (Low)" : "Low"}</option>
                    <option value="Medium">{isUrdu ? "درمیانی (Medium)" : "Medium"}</option>
                    <option value="High">{isUrdu ? "زیادہ (High)" : "High"}</option>
                    <option value="Critical">{isUrdu ? "انتہائی اہم (Critical)" : "Critical"}</option>
                  </select>
                </div>
              </div>

              {/* Executive assignment */}
              <div>
                <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">
                  {isUrdu ? "تفویض کردہ سپورٹ ایگزیکٹو" : "Assign Support Executive"}
                </label>
                <select
                  value={newTicketExecutive}
                  onChange={(e) => setNewTicketExecutive(e.target.value)}
                  className="w-full bg-md-surface-container-low border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden"
                >
                  {currentUser && (
                    <option value={currentUser.name}>
                      {currentUser.name} ({currentUser.employeeId || 'Current User'})
                    </option>
                  )}
                  {users
                    .filter(u => u.name !== currentUser?.name)
                    .map(u => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.employeeId || u.role})
                      </option>
                    ))}
                  {users.length === 0 && !currentUser && (
                    <option value="Support Executive">Support Executive (TE-101)</option>
                  )}
                </select>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-md-outline uppercase">
                    {isUrdu ? "مسئلے کی تفصیلی وضاحت" : "Detailed Issue Description"}
                  </label>
                  <VoiceDictationButton
                    onTranscript={(text) => setNewTicketDescription(prev => (prev ? prev + ' ' + text : text))}
                    defaultLang="ur-PK"
                  />
                </div>
                <textarea
                  placeholder={isUrdu ? "مسئلے کی مکمل تفصیلات، سسٹم لاگ پیغامات اور متعلقہ معلومات درج کریں..." : "Provide precise details regarding the client system failure, log alerts, hardware configuration, etc..."}
                  value={newTicketDescription}
                  onChange={(e) => setNewTicketDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-md-surface-container-low border border-md-surface-variant rounded-xl p-3 text-xs font-medium outline-hidden resize-none focus:ring-1 focus:ring-md-primary"
                />
              </div>

              <div className="pt-2 border-t border-md-surface-variant flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="w-full bg-md-surface-container-high text-md-on-surface-variant hover:bg-md-surface-variant/40 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition cursor-pointer"
                >
                  {isUrdu ? "منسوخ کریں" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="w-full bg-md-primary hover:bg-md-primary/95 text-md-on-primary py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingTicket ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{isUrdu ? "گوگل شیٹ میں محفوظ ہو رہا ہے..." : "Syncing to Google Sheet..."}</span>
                    </>
                  ) : (
                    <span>{isUrdu ? "ٹکٹ درج کریں" : "Raise Ticket"}</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};
