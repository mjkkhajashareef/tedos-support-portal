/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MaterialCard } from '../common/MaterialCard';
import {
  Inbox,
  Send,
  Plus,
  MessageSquare,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Reply,
  Check,
  Trash2,
  Search,
  Filter,
  Sparkles,
  Building2,
  Ticket,
  ChevronRight,
  RefreshCw,
  X,
  Radio,
  Users,
  Megaphone,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InternalMessage, UserRole } from '../../types';
import { messageService } from '../../utils/messageService';
import { VoiceDictationButton } from '../common/VoiceDictationButton';

interface ExecutiveInboxViewProps {
  id?: string;
}

type TabType = 'inbox' | 'compose' | 'sent' | 'remarks';

export const ExecutiveInboxView: React.FC<ExecutiveInboxViewProps> = ({ id }) => {
  const {
    currentUser,
    users,
    clients,
    workLogs,
    tickets,
    internalMessages,
    sendInternalMessage,
    markInternalMessageAsRead,
    deleteInternalMessage,
    refreshInternalMessages,
    unreadMessagesCount,
    updateWorkLogFields,
    addNotification,
    language
  } = useApp();

  const isUrdu = language === 'ur';

  // Requirement #2: Support team cannot delete internal messages (restricted to managers & leadership)
  const canDeleteMessage = currentUser?.role !== UserRole.SUPPORT_EXECUTIVE;

  // Navigation tab
  const [activeTab, setActiveTab] = useState<TabType>('inbox');

  // Search & filter for inbox
  const [searchQuery, setSearchQuery] = useState('');
  const [inboxFilter, setInboxFilter] = useState<'all' | 'unread' | 'urgent' | 'broadcast'>('all');
  const [selectedMessage, setSelectedMessage] = useState<InternalMessage | null>(null);

  // Compose form state
  const [recipientType, setRecipientType] = useState<'individual' | 'role' | 'all'>('individual');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>(UserRole.SUPPORT_MANAGER);
  const [subject, setSubject] = useState<string>('');
  const [priority, setPriority] = useState<'Normal' | 'Important' | 'Urgent'>('Normal');
  const [body, setBody] = useState<string>('');
  const [linkedClientId, setLinkedClientId] = useState<string>('');
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [composeSuccess, setComposeSuccess] = useState(false);
  const [composeError, setComposeError] = useState('');

  // Remarks state for WorkLog supervisor remarks
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({});
  const [remarksTab, setRemarksTab] = useState<'all' | 'manager' | 'coo'>('all');
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());

  // Filter inbox messages for current user
  const inboxList = useMemo(() => {
    const list = messageService.filterInbox(internalMessages, currentUser);
    return list.filter(m => {
      // Query filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.subject.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q) ||
        m.recipientName.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Status filter
      if (inboxFilter === 'unread') {
        const myId = currentUser?.id || currentUser?.employeeId || '';
        return !m.read && !(m.readBy || []).includes(myId);
      }
      if (inboxFilter === 'urgent') {
        return m.priority === 'Urgent' || m.priority === 'Important';
      }
      if (inboxFilter === 'broadcast') {
        return m.recipientType === 'all' || m.recipientType === 'role';
      }
      return true;
    });
  }, [internalMessages, currentUser, searchQuery, inboxFilter]);

  // Filter sent messages for current user
  const sentList = useMemo(() => {
    return messageService.filterSent(internalMessages, currentUser);
  }, [internalMessages, currentUser]);

  // WorkLog supervisor remarks (preserved capability)
  const remarkItems = useMemo(() => {
    const items: Array<{
      id: string;
      logId: string;
      source: 'WorkLog' | 'Ticket';
      clientName: string;
      teId: string;
      date: string;
      summary: string;
      senderRole: 'Support Manager' | 'COO / Leadership' | 'Manager';
      senderName: string;
      remarkType: 'Special Manager Remark' | 'Manager Remark' | 'COO Remark';
      remarkText: string;
      executiveReply?: string;
      isAcknowledged: boolean;
    }> = [];

    workLogs.forEach(log => {
      const isMyLog =
        !currentUser ||
        (log.executiveName || '').toLowerCase().includes((currentUser.name || '').toLowerCase()) ||
        (currentUser.employeeId && log.teId === currentUser.employeeId);

      const specialRemark = log.specialManagerRemark || log.saadNote;
      if (specialRemark && specialRemark.trim()) {
        items.push({
          id: `${log.id}-special`,
          logId: log.id,
          source: 'WorkLog',
          clientName: log.clientName,
          teId: log.teId,
          date: log.date,
          summary: log.details,
          senderRole: 'Manager',
          senderName: 'Saad (Support Manager)',
          remarkType: 'Special Manager Remark',
          remarkText: specialRemark,
          executiveReply: log.executiveReply,
          isAcknowledged: acknowledgedIds.has(`${log.id}-special`)
        });
      }

      if (log.managerRemark && log.managerRemark.trim() && log.managerRemark !== specialRemark) {
        items.push({
          id: `${log.id}-manager`,
          logId: log.id,
          source: 'WorkLog',
          clientName: log.clientName,
          teId: log.teId,
          date: log.date,
          summary: log.details,
          senderRole: 'Support Manager',
          senderName: 'Management Desk',
          remarkType: 'Manager Remark',
          remarkText: log.managerRemark,
          executiveReply: log.executiveReply,
          isAcknowledged: acknowledgedIds.has(`${log.id}-manager`)
        });
      }

      if (log.cooRemark && log.cooRemark.trim()) {
        items.push({
          id: `${log.id}-coo`,
          logId: log.id,
          source: 'WorkLog',
          clientName: log.clientName,
          teId: log.teId,
          date: log.date,
          summary: log.details,
          senderRole: 'COO / Leadership',
          senderName: 'COO Operational Desk',
          remarkType: 'COO Remark',
          remarkText: log.cooRemark,
          executiveReply: log.executiveReply,
          isAcknowledged: acknowledgedIds.has(`${log.id}-coo`)
        });
      }
    });

    return items;
  }, [workLogs, currentUser, acknowledgedIds]);

  const filteredRemarkItems = useMemo(() => {
    if (remarksTab === 'manager') {
      return remarkItems.filter(i => i.remarkType === 'Special Manager Remark' || i.remarkType === 'Manager Remark');
    }
    if (remarksTab === 'coo') {
      return remarkItems.filter(i => i.remarkType === 'COO Remark');
    }
    return remarkItems;
  }, [remarkItems, remarksTab]);

  // Reply trigger from an inbox message
  const handleReplyToMessage = (msg: InternalMessage) => {
    setRecipientType('individual');
    setSelectedUserId(msg.senderId);
    setSubject(msg.subject.startsWith('Re: ') ? msg.subject : `Re: ${msg.subject}`);
    setPriority(msg.priority);
    setReplyToMessageId(msg.id);
    setBody('');
    setActiveTab('compose');
  };

  // Send message handler
  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setComposeError('');

    if (!subject.trim()) {
      setComposeError(isUrdu ? 'برائے مہربانی پیغام کا عنوان (Subject) درج کریں۔' : 'Please enter a Subject.');
      return;
    }
    if (!body.trim()) {
      setComposeError(isUrdu ? 'برائے مہربانی پیغام کی تفصیل (Message body) درج کریں۔' : 'Please enter message content.');
      return;
    }

    let recipientId = 'ALL';
    let recipientName = 'All Team';
    let recRole: string | undefined = undefined;
    let targetUser = undefined as any;

    if (recipientType === 'individual') {
      targetUser = users.find(u => u.id === selectedUserId || u.employeeId === selectedUserId);
      if (!targetUser) {
        setComposeError(isUrdu ? 'براہ کرم وصول کنندہ (Recipient) منتخب کریں۔' : 'Please select a recipient user.');
        return;
      }
      recipientId = targetUser.id || targetUser.employeeId;
      recipientName = targetUser.name;
      recRole = targetUser.role;
    } else if (recipientType === 'role') {
      recipientId = `role-${selectedRole}`;
      recipientName = `All ${selectedRole}s (${selectedRole} ٹیم)`;
      recRole = selectedRole;
    } else {
      recipientId = 'ALL';
      recipientName = isUrdu ? 'تمام ٹیم ممبران (All Staff)' : 'All Staff Members';
    }

    const clientObj = clients.find(c => c.id === linkedClientId);

    setIsSending(true);
    try {
      await sendInternalMessage({
        senderId: currentUser?.employeeId || currentUser?.id || 'user-unknown',
        senderName: currentUser?.name || 'Support Executive',
        senderRole: currentUser?.role || UserRole.SUPPORT_EXECUTIVE,
        recipientId,
        recipientName,
        recipientRole: recRole,
        recipientType,
        recipientEmployeeId: targetUser?.employeeId,
        recipientEmail: targetUser?.email,
        subject: subject.trim(),
        body: body.trim(),
        priority,
        clientId: clientObj?.id,
        clientName: clientObj?.name,
        replyToId: replyToMessageId || undefined
      } as any);

      setComposeSuccess(true);
      setSubject('');
      setBody('');
      setLinkedClientId('');
      setReplyToMessageId(null);

      setTimeout(() => {
        setComposeSuccess(false);
        setActiveTab('sent');
      }, 1200);
    } catch (err: any) {
      setComposeError(err?.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  // Remark reply handler
  const handleSendRemarkReply = async (logId: string, itemId: string) => {
    const text = (replyInputs[itemId] || '').trim();
    if (!text) return;
    setSubmittingIds(prev => ({ ...prev, [itemId]: true }));
    try {
      updateWorkLogFields(logId, {
        executiveReply: text,
        executiveReplyTimestamp: new Date().toISOString()
      });
      addNotification({
        title: isUrdu ? 'جواب کامیابی سے ارسال ہو گیا' : 'Reply Sent to Management',
        message: `Reply to note: "${text}"`,
        type: 'success'
      });
      setReplyInputs(prev => ({ ...prev, [itemId]: '' }));
    } finally {
      setSubmittingIds(prev => ({ ...prev, [itemId]: false }));
    }
  };

  return (
    <div
      id={id || 'tedos-communication-hub-view'}
      className="space-y-6 animate-fade-in pb-16 min-h-[90vh] -mx-1 sm:-mx-3 px-3 sm:px-6 py-5 rounded-3xl bg-gradient-to-b from-slate-100/90 via-slate-50 to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border border-slate-200/60 dark:border-slate-800/60 shadow-xs"
    >
      {/* Top Header Card */}
      <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <MessageSquare size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white">
                  {isUrdu ? 'انٹرنل کمیونیکیشن و میسجنگ سینٹر' : 'Team Communication & Internal Messages'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                  {unreadMessagesCount > 0 ? `${unreadMessagesCount} ${isUrdu ? 'نئے پیغامات' : 'Unread'}` : 'All Read'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isUrdu
                  ? 'ٹیم ممبران سے براہ راست پیغامات، رول براڈکاسٹ، ان باکس، اور ارسال کردہ میسجز کا مکمل نظام'
                  : 'Direct team communication, role broadcasts, private messages, inbox, and sent message archives'}
              </p>
            </div>
          </div>

          {/* Quick Tab Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('inbox')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'inbox'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Inbox size={14} />
              <span>{isUrdu ? 'ان باکس' : 'Inbox'}</span>
              {unreadMessagesCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-mono">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('compose')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'compose'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Plus size={14} />
              <span>{isUrdu ? 'نیا پیغام (Compose)' : 'Create Message'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sent')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'sent'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Send size={14} />
              <span>{isUrdu ? 'ارسال کردہ (Sent)' : 'Sent Messages'}</span>
              <span className="text-[10px] opacity-75 font-mono">({sentList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('remarks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'remarks'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <ShieldCheck size={14} />
              <span>{isUrdu ? 'مینیجر ریمارکس' : 'Supervisor Notes'}</span>
              <span className="text-[10px] opacity-75 font-mono">({remarkItems.length})</span>
            </button>
          </div>
        </div>
      </MaterialCard>

      {/* TAB 1: INBOX */}
      {activeTab === 'inbox' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isUrdu ? 'عنوان، بھیجنے والے یا پیغام سے تلاش کریں...' : 'Search inbox by subject, sender, or content...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl ltr:pl-9 rtl:pr-9 ltr:pr-3 rtl:pl-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setInboxFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    inboxFilter === 'all' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {isUrdu ? 'تمام' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={() => setInboxFilter('unread')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    inboxFilter === 'unread' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {isUrdu ? 'غیر پڑھے' : 'Unread'}
                </button>
                <button
                  type="button"
                  onClick={() => setInboxFilter('urgent')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    inboxFilter === 'urgent' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {isUrdu ? 'ارجنٹ' : 'Urgent'}
                </button>
                <button
                  type="button"
                  onClick={() => setInboxFilter('broadcast')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    inboxFilter === 'broadcast' ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {isUrdu ? 'براڈکاسٹ' : 'Broadcasts'}
                </button>
              </div>

              <button
                type="button"
                onClick={refreshInternalMessages}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
                title="Refresh Messages"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* Inbox Messages List */}
          {inboxList.length === 0 ? (
            <MaterialCard variant="outlined" className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 space-y-3">
              <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                {isUrdu ? 'ان باکس میں کوئی نیا پیغام نہیں ہے' : 'Your Inbox is Up-to-Date'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isUrdu
                  ? 'آپ کے لیے اس وقت کوئی زیر التواء پیغام موجود نہیں ہے۔ نیا پیغام بھیجنے کے لیے Create Message ٹیب پر کلک کریں۔'
                  : 'No incoming messages matching your filter. Click "Create Message" to start a conversation.'}
              </p>
            </MaterialCard>
          ) : (
            <div className="space-y-3">
              {inboxList.map(msg => {
                const myId = currentUser?.id || currentUser?.employeeId || '';
                const isUnread = !msg.read && !(msg.readBy || []).includes(myId);

                return (
                  <motion.div
                    key={msg.id}
                    layoutId={`msg-${msg.id}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isUnread
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        )}
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {msg.senderName}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                          {msg.senderRole}
                        </span>
                        {msg.recipientType === 'all' && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                            <Megaphone size={10} />
                            <span>{isUrdu ? 'تمام ٹیم' : 'All Staff'}</span>
                          </span>
                        )}
                        {msg.recipientType === 'role' && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                            <Users size={10} />
                            <span>{msg.recipientRole} Broadcast</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            msg.priority === 'Urgent'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : msg.priority === 'Important'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {msg.priority}
                        </span>
                        <Clock size={12} />
                        <span>{msg.time || 'Today'} • {msg.date}</span>
                      </div>
                    </div>

                    {/* Subject & Body */}
                    <div className="pt-2.5 space-y-1.5">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {msg.subject}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {msg.body}
                      </p>

                      {msg.clientName && (
                        <div className="pt-1 flex items-center gap-1 text-[11px] text-blue-600 font-mono">
                          <Building2 size={12} />
                          <span>Client: {msg.clientName}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReplyToMessage(msg)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        >
                          <Reply size={13} />
                          <span>{isUrdu ? 'جواب دیں (Reply)' : 'Reply'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => markInternalMessageAsRead(msg.id)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <CheckCheck size={13} className={!isUnread ? 'text-emerald-500' : ''} />
                          <span>{!isUnread ? (isUrdu ? 'پڑھ لیا گیا' : 'Read') : (isUrdu ? 'پڑھا ہوا نشان لگائیں' : 'Mark as Read')}</span>
                        </button>
                      </div>

                      {canDeleteMessage && (
                        <button
                          type="button"
                          onClick={() => deleteInternalMessage(msg.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                          title="Delete Message"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMPOSE / CREATE MESSAGE */}
      {activeTab === 'compose' && (
        <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <form onSubmit={handleSendMessageSubmit} className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  <Send size={16} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {isUrdu ? 'نیا داخلی پیغام بنائیں (Create Team Message)' : 'Create New Team Message'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isUrdu
                      ? 'کسی خاص ساتھی، یا پورے ڈیپارٹمنٹ کو فوری پیغام یا نوٹس ارسال کریں'
                      : 'Send direct message to a team member or broadcast to an entire role'}
                  </p>
                </div>
              </div>

              {replyToMessageId && (
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
                  Replying to message
                </span>
              )}
            </div>

            {composeError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{composeError}</span>
              </div>
            )}

            {composeSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{isUrdu ? 'پیغام کامیابی سے ارسال ہو گیا!' : 'Message sent successfully!'}</span>
              </div>
            )}

            {/* Recipient Mode Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                1. {isUrdu ? 'وصول کنندہ کی نوعیت (Recipient Target):' : 'Recipient Target:'}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label
                  className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                    recipientType === 'individual'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="recType"
                    checked={recipientType === 'individual'}
                    onChange={() => setRecipientType('individual')}
                    className="accent-blue-600"
                  />
                  <User size={15} className="text-blue-600" />
                  <span className="text-xs">{isUrdu ? 'خاص ساتھی (Individual User)' : 'Individual User'}</span>
                </label>

                <label
                  className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                    recipientType === 'role'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="recType"
                    checked={recipientType === 'role'}
                    onChange={() => setRecipientType('role')}
                    className="accent-blue-600"
                  />
                  <Users size={15} className="text-blue-600" />
                  <span className="text-xs">{isUrdu ? 'رول براڈکاسٹ (Role Broadcast)' : 'Role Broadcast'}</span>
                </label>

                <label
                  className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                    recipientType === 'all'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="recType"
                    checked={recipientType === 'all'}
                    onChange={() => setRecipientType('all')}
                    className="accent-blue-600"
                  />
                  <Megaphone size={15} className="text-blue-600" />
                  <span className="text-xs">{isUrdu ? 'تمام اسٹاف (All Staff)' : 'All Staff Members'}</span>
                </label>
              </div>
            </div>

            {/* Recipient Dropdown */}
            {recipientType === 'individual' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isUrdu ? 'ساتھی منتخب کریں (Select Team Member):' : 'Select Team Member:'}
                </label>
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                  required
                >
                  <option value="">{isUrdu ? '-- ٹیم ممبر منتخب کریں --' : '-- Choose User --'}</option>
                  {users
                    .filter(u => u.id !== currentUser?.id)
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.role} ({u.employeeId})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {recipientType === 'role' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isUrdu ? 'ڈیپارٹمنٹ / رول منتخب کریں (Select Role):' : 'Select Target Role:'}
                </label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value={UserRole.SUPPORT_EXECUTIVE}>Support Executives (سپورٹ ایگزیکٹوز)</option>
                  <option value={UserRole.SUPPORT_MANAGER}>Support Managers (سپورٹ مینیجرز)</option>
                  <option value={UserRole.OPERATION_MANAGER}>Operation Managers (آپریشن مینیجرز)</option>
                  <option value={UserRole.COO}>COO / Executive Leadership</option>
                  <option value={UserRole.TECHNICAL_TEAM}>Technical Team (ٹیکنیکل ٹیم)</option>
                  <option value={UserRole.FINANCE}>Finance Department (فنانس)</option>
                </select>
              </div>
            )}

            {/* Subject and Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  2. {isUrdu ? 'میسج کا عنوان (Subject):' : 'Message Subject:'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Client portal issue, shift handover, urgent notice..."
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isUrdu ? 'ترجیح (Priority):' : 'Priority:'}
                </label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="Normal">Normal (معمولی)</option>
                  <option value="Important">Important (اہم)</option>
                  <option value="Urgent">Urgent (انتہائی فوری)</option>
                </select>
              </div>
            </div>

            {/* Quick Subject Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Quick Topics:</span>
              <button
                type="button"
                onClick={() => setSubject('Urgent: Client Software Escalation')}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold cursor-pointer"
              >
                Client Software Escalation
              </button>
              <button
                type="button"
                onClick={() => setSubject('Daily Shift Handover & Log Notes')}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold cursor-pointer"
              >
                Shift Handover
              </button>
              <button
                type="button"
                onClick={() => setSubject('Follow-up Assistance Required')}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold cursor-pointer"
              >
                Follow-up Assistance
              </button>
              <button
                type="button"
                onClick={() => setSubject('Meeting & SOP Compliance Reminder')}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold cursor-pointer"
              >
                SOP Reminder
              </button>
            </div>

            {/* Message Body with Voice Dictation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  3. {isUrdu ? 'پیغام کی تفصیل (Message Body):' : 'Message Body:'}
                </label>
                <div className="flex items-center gap-2">
                  <VoiceDictationButton
                    onTranscript={txt => setBody(prev => (prev ? `${prev} ${txt}` : txt))}
                    currentText={body}
                    lang="ur-PK"
                  />
                  <span className="text-[10px] text-slate-400">{isUrdu ? 'آواز سے بولیں' : 'Voice note'}</span>
                </div>
              </div>

              <textarea
                rows={5}
                placeholder={isUrdu ? 'اپنا پیغام یہاں لکھیں... (اردو یا انگریزی دونوں میں لکھ سکتے ہیں)' : 'Type your internal message here...'}
                value={body}
                onChange={e => setBody(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs leading-relaxed text-slate-900 dark:text-white placeholder-slate-400 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            {/* Optional Client Attachment */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {isUrdu ? 'متعلقہ کلائنٹ (اختیاری):' : 'Optional Linked Client:'}
              </label>
              <select
                value={linkedClientId}
                onChange={e => setLinkedClientId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-300"
              >
                <option value="">{isUrdu ? '-- کوئی کلائنٹ نہیں (None) --' : '-- No Linked Client --'}</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.teId || c.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Toolbar */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubject('');
                  setBody('');
                  setActiveTab('inbox');
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {isUrdu ? 'منسوخ کریں' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSending}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Send size={14} />
                <span>{isSending ? (isUrdu ? 'ارسال ہو رہا ہے...' : 'Sending...') : (isUrdu ? 'پیغام بھیجیں (Send Message)' : 'Send Message')}</span>
              </button>
            </div>
          </form>
        </MaterialCard>
      )}

      {/* TAB 3: SENT MESSAGES */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Send size={16} className="text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isUrdu ? `آپ کے بھیجے گئے پیغامات (${sentList.length})` : `Messages Sent by You (${sentList.length})`}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('compose')}
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} />
              <span>{isUrdu ? 'نیا پیغام' : 'New Message'}</span>
            </button>
          </div>

          {sentList.length === 0 ? (
            <MaterialCard variant="outlined" className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 space-y-2">
              <Send size={32} className="text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">
                {isUrdu ? 'آپ نے ابھی تک کوئی پیغام ارسال نہیں کیا۔' : 'No sent messages recorded yet.'}
              </p>
            </MaterialCard>
          ) : (
            <div className="space-y-3">
              {sentList.map(msg => (
                <div
                  key={msg.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">To:</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {msg.recipientName}
                      </span>
                      {msg.recipientRole && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          {msg.recipientRole}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {msg.priority}
                      </span>
                      <span>{msg.date} • {msg.time}</span>
                      <CheckCheck size={14} className="text-blue-500" title="Delivered" />
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">{msg.subject}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {msg.body}
                  </p>

                  {msg.clientName && (
                    <div className="text-[10px] text-blue-600 font-mono pt-1">
                      🔗 Client: {msg.clientName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SUPERVISOR REMARKS (Existing WorkLog & Ticket Remarks) */}
      {activeTab === 'remarks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isUrdu ? 'مینیجر و لیڈرشپ کے تحریر کردہ خصوصی ریمارکس' : 'Manager & Leadership Directives on Client Work'}
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRemarksTab('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  remarksTab === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setRemarksTab('manager')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  remarksTab === 'manager' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => setRemarksTab('coo')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  remarksTab === 'coo' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                COO
              </button>
            </div>
          </div>

          {filteredRemarkItems.length === 0 ? (
            <MaterialCard variant="outlined" className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 space-y-2">
              <CheckCircle2 size={32} className="text-emerald-500 mx-auto" />
              <p className="text-xs text-slate-500">
                {isUrdu ? 'کوئی زیر التواء ریمارک یا نوٹس نہیں ہے۔' : 'No supervisor remarks pending.'}
              </p>
            </MaterialCard>
          ) : (
            <div className="space-y-3">
              {filteredRemarkItems.map(item => {
                const replyVal = replyInputs[item.id] || '';
                const isSubmitting = submittingIds[item.id];

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{item.clientName}</span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                          {item.teId}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          {item.remarkType}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{item.date}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-700 dark:text-amber-400 mb-1">
                        From: {item.senderName} ({item.senderRole})
                      </span>
                      <p className="leading-relaxed font-medium">{item.remarkText}</p>
                    </div>

                    {item.executiveReply ? (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-700 dark:text-emerald-400 mb-0.5">
                          Your Reply:
                        </span>
                        <p>{item.executiveReply}</p>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          placeholder={isUrdu ? 'مینیجر کے ریمارک کا جواب لکھیں...' : 'Reply to manager remark...'}
                          value={replyVal}
                          onChange={e => setReplyInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          disabled={isSubmitting || !replyVal.trim()}
                          onClick={() => handleSendRemarkReply(item.logId, item.id)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                        >
                          <Reply size={12} />
                          <span>{isSubmitting ? '...' : isUrdu ? 'جواب ارسال کریں' : 'Send Reply'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
