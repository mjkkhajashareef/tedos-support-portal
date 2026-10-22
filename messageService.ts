/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InternalMessage, User, UserRole } from '../types';

const STORAGE_KEY = 'tedos_internal_messages';

const INITIAL_MESSAGES: InternalMessage[] = [
  {
    id: 'msg-welcome-001',
    senderId: 'usr-director-philsof',
    senderName: 'Techno Admin',
    senderRole: 'Director',
    recipientId: 'ALL',
    recipientName: 'All Support Staff (تمام ملازمین)',
    recipientType: 'all',
    subject: 'Welcome to TEDOS Support Portal & Client Software Workflow',
    body: 'السلام علیکم تمام سپورٹ ٹیم ممبران! تمام کلائنٹس کے سافٹ ویئر پورٹل لنکس ڈائریکٹری اور ڈیلی ورک لاگ میں لائیو کر دیے گئے ہیں۔ کال یا میٹنگ لاگ کرتے وقت کلائنٹ سافٹ ویئر کا معائنہ لازمی کریں اور سیشن کے بعد شفٹ سمری واٹس ایپ گروپ میں شیئر کریں۔',
    priority: 'Important',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    read: false,
    readBy: []
  },
  {
    id: 'msg-mgr-002',
    senderId: 'usr-mgr-saad',
    senderName: 'Saad (Support Manager)',
    senderRole: 'Support Manager',
    recipientId: 'role-support-exec',
    recipientName: 'All Support Executives (سپورٹ ایگزیکٹوز)',
    recipientRole: UserRole.SUPPORT_EXECUTIVE,
    recipientType: 'role',
    subject: 'Daily Calling Target & Proof Link Compliance',
    body: 'تمام ایگزیکٹوز توجہ فرمائیں: ہر کال کے دوران اگر 5 منٹ سے زیادہ سیشن ہو تو گوگل میٹ یا ڈرائیو ریکارڈنگ پروف لنک لازمی شامل کریں۔ اگر کوئی کلائنٹ رسپانس نہ دے تو دوبارہ فالو اپ شیڈول کریں اور لاگ آؤٹ کرتے وقت واٹس ایپ گروپ میں شفٹ سمری اور لاگ آؤٹ کا میسج ضرور بھیجیں۔',
    priority: 'Urgent',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    date: new Date().toISOString().split('T')[0],
    time: '11:15',
    read: false,
    readBy: []
  }
];

export const messageService = {
  getStoredMessages(): InternalMessage[] {
    if (typeof window === 'undefined') return INITIAL_MESSAGES;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading stored messages:', e);
    }
    // Default fallback
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MESSAGES));
    return INITIAL_MESSAGES;
  },

  async syncWithServer(): Promise<InternalMessage[]> {
    try {
      const res = await fetch('/api/messages');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.messages)) {
          const serverList: InternalMessage[] = json.messages.filter((m: any) => m && m.subject && m.body);
          const local = this.getStoredMessages();
          const map = new Map<string, InternalMessage>();
          serverList.forEach(m => map.set(m.id, m));
          local.forEach(m => {
            if (!map.has(m.id)) {
              map.set(m.id, m);
            }
          });
          const combined = Array.from(map.values()).sort(
            (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
          );
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
            window.dispatchEvent(new Event('tedos_messages_updated'));
          }
          return combined;
        }
      }
    } catch {
      // offline silent fallback
    }
    return this.getStoredMessages();
  },

  async sendMessage(msg: Omit<InternalMessage, 'id' | 'timestamp' | 'read' | 'readBy'>): Promise<InternalMessage> {
    const fullMsg: InternalMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      date: msg.date || new Date().toISOString().split('T')[0],
      time: msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      readBy: []
    };

    const current = this.getStoredMessages();
    const updated = [fullMsg, ...current];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('tedos_messages_updated'));
    }

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullMsg)
      });
    } catch (e) {
      console.warn('Server sync error for message:', e);
    }

    return fullMsg;
  },

  async markAsRead(messageId: string, userId: string): Promise<void> {
    const current = this.getStoredMessages();
    const updated = current.map(m => {
      if (m.id === messageId) {
        const readBy = new Set(m.readBy || []);
        readBy.add(userId);
        return { ...m, read: true, readBy: Array.from(readBy) };
      }
      return m;
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('tedos_messages_updated'));
    }

    try {
      await fetch(`/api/messages/${messageId}/read`, { method: 'PATCH' });
    } catch {}
  },

  async deleteMessage(messageId: string): Promise<void> {
    const current = this.getStoredMessages();
    const updated = current.filter(m => m.id !== messageId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('tedos_messages_updated'));
    }
  },

  filterInbox(messages: InternalMessage[], currentUser: User | null): InternalMessage[] {
    if (!currentUser) return messages;
    const myName = (currentUser.name || '').trim().toLowerCase();
    const firstToken = myName.split(' ')[0];
    const myRole = currentUser.role;
    const myEmpId = (currentUser.employeeId || '').toLowerCase().trim();
    const myId = (currentUser.id || '').toLowerCase().trim();
    const myEmail = (currentUser.email || '').toLowerCase().trim();

    return messages.filter(m => {
      // Don't show messages sent by myself in Inbox (those belong to Sent)
      const senderIdLower = (m.senderId || '').toLowerCase().trim();
      const senderNameLower = (m.senderName || '').toLowerCase().trim();
      const isSender =
        senderIdLower === myId ||
        senderIdLower === myEmpId ||
        (senderNameLower && senderNameLower === myName);

      if (isSender && m.recipientType !== 'all') return false;

      // Broadcast to All
      if (m.recipientType === 'all' || m.recipientId === 'ALL') return true;

      // Broadcast to My Role
      if (m.recipientType === 'role' && m.recipientRole === myRole) return true;

      // Addressed directly to me (Multi-identifier matching across laptops)
      if (m.recipientType === 'individual') {
        const recId = (m.recipientId || '').toLowerCase().trim();
        const recEmpId = ((m as any).recipientEmployeeId || '').toLowerCase().trim();
        const recEmail = ((m as any).recipientEmail || '').toLowerCase().trim();

        if (
          recId === myId ||
          recId === myEmpId ||
          recId === myEmail ||
          (recEmpId && recEmpId === myEmpId) ||
          (recEmail && recEmail === myEmail)
        ) {
          return true;
        }

        const recName = (m.recipientName || '').toLowerCase().trim();
        if (recName && (recName === myName || recName.includes(myName) || (firstToken && recName.includes(firstToken)))) {
          return true;
        }
      }

      return false;
    });
  },

  filterSent(messages: InternalMessage[], currentUser: User | null): InternalMessage[] {
    if (!currentUser) return [];
    const myName = (currentUser.name || '').trim().toLowerCase();
    const firstToken = myName.split(' ')[0];
    const myEmpId = (currentUser.employeeId || '').toLowerCase().trim();
    const myId = (currentUser.id || '').toLowerCase().trim();

    return messages.filter(m => {
      const senderId = (m.senderId || '').toLowerCase().trim();
      const senderName = (m.senderName || '').toLowerCase().trim();
      return (
        senderId === myId ||
        senderId === myEmpId ||
        (senderName && (senderName === myName || senderName.includes(myName) || (firstToken && senderName.includes(firstToken))))
      );
    });
  },

  getUnreadCount(messages: InternalMessage[], currentUser: User | null): number {
    const inbox = this.filterInbox(messages, currentUser);
    const myId = currentUser?.id || currentUser?.employeeId || '';
    return inbox.filter(m => !m.read && !(m.readBy || []).includes(myId)).length;
  }
};
