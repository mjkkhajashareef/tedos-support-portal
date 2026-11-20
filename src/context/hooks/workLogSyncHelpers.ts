/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FollowUpTracker, Ticket, WorkLogEntry, AppNotification, User } from '../../types';
import { CONFIG } from '../../config/appConfig';
import { offlineDb } from '../../utils/indexedDb';
import { postWorkLogToGAS, AddWorkLogPayload, getLocalDateString, isLogPendingProof } from '../../utils/helpers';

export async function hydrateStoresFromIndexedDb(params: {
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  setWorkLogs: React.Dispatch<React.SetStateAction<WorkLogEntry[]>>;
  setFollowUps: React.Dispatch<React.SetStateAction<FollowUpTracker[]>>;
}) {
  const { setTickets, setWorkLogs, setFollowUps } = params;
  try {
    const [storedTickets, storedLogs, storedFollowUps] = await Promise.all([
      offlineDb.getTickets(),
      offlineDb.getWorkLogs(),
      offlineDb.getFollowUps()
    ]);
    if (storedTickets && storedTickets.length > 0) {
      const clean = storedTickets.filter(t => !/zigma|apollo/i.test(t.clientName || ''));
      setTickets(prev => {
        const map = new Map<string, Ticket>();
        [...clean, ...prev].forEach(t => map.set(t.id, t));
        return Array.from(map.values());
      });
    }
    if (storedLogs && storedLogs.length > 0) {
      const cleanLogs = storedLogs.filter(l => !/zigma|apollo/i.test(l.clientName || ''));
      setWorkLogs(prev => {
        const map = new Map<string, WorkLogEntry>();
        [...cleanLogs, ...prev].forEach(item => map.set(item.id, item));
        return Array.from(map.values());
      });
    }
    if (storedFollowUps && storedFollowUps.length > 0) {
      const cleanF = storedFollowUps.filter(f => !/zigma|apollo/i.test(f.clientName || ''));
      setFollowUps(prev => {
        const map = new Map<string, FollowUpTracker>();
        [...cleanF, ...prev].forEach(item => map.set(item.id, item));
        return Array.from(map.values());
      });
    }
  } catch (err) {
    console.error('[TEDOS Sync] IndexedDB load failed, using local fallback', err);
  }
}

export async function pollServerWorkLogs(
  setWorkLogs: React.Dispatch<React.SetStateAction<WorkLogEntry[]>>
) {
  try {
    const res = await fetch('/api/worklogs');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.workLogs) && json.workLogs.length > 0) {
        setWorkLogs(prev => {
          const map = new Map<string, WorkLogEntry>();
          prev.forEach(l => map.set(l.id, l));
          json.workLogs.forEach((l: WorkLogEntry) => {
            if (l && l.id && !/zigma|apollo/i.test(l.clientName || '')) {
              const existing = map.get(l.id);
              map.set(l.id, existing ? { ...existing, ...l } : l);
            }
          });
          return Array.from(map.values()).sort(
            (a, b) =>
              new Date(b.date || b.timestamp || 0).getTime() -
              new Date(a.date || a.timestamp || 0).getTime()
          );
        });
      }
    }
  } catch {}
}

export function buildCompleteWorkLogEntry(params: {
  unifiedLogId: string;
  todayStr: string;
  timeStr: string;
  executiveName: string;
  teId: string;
  durationFormatted: string;
  log: Partial<WorkLogEntry> &
    Pick<WorkLogEntry, 'clientId' | 'clientName' | 'category' | 'details' | 'durationMinutes' | 'status'>;
}): WorkLogEntry {
  const { unifiedLogId, todayStr, timeStr, executiveName, teId, durationFormatted, log } = params;
  return {
    id: unifiedLogId,
    ticketId: (log as any).ticketId,
    clientId: log.clientId,
    clientName: log.clientName,
    timestamp: new Date().toISOString(),
    date: todayStr,
    time: timeStr,
    executiveName,
    teId,
    category: log.category,
    issueCategory: log.issueCategory || log.category,
    workType: log.workType || log.category,
    details: log.details,
    status: log.status,
    nextFollowUpDate: log.nextFollowUpDate || '',
    priority: log.priority || 'Medium',
    durationMinutes: log.durationMinutes,
    duration: durationFormatted,
    proofLink: log.proofLink || '',
    startTime: log.startTime,
    endTime: log.endTime,
    remarksClient: log.remarksClient || log.remarks || '',
    remarks: log.remarks || '',
    syncStatus: log.syncStatus || 'Synchronized',
    isProofPending: log.isProofPending,
    proofPendingDate: log.proofPendingDate,
    approvalStatus: log.approvalStatus || 'Pending',
    approvalRemark: log.approvalRemark,
    flagReason: log.flagReason,
    softwareUsage: log.softwareUsage,
    internalNote: log.internalNote || log.remarks || '',
    managerRemark: log.managerRemark || '',
    cooRemark: log.cooRemark || '',
    executiveReply: log.executiveReply || '',
    saadNote: log.specialManagerRemark || log.saadNote || '',
    specialManagerRemark: log.specialManagerRemark || log.saadNote || '',
    proofMissingReason: log.proofMissingReason || '',
    clientStatus: log.clientStatus,
    lastWorkSummary: log.lastWorkSummary || log.details || '',
    clientSatisfactionKpi: log.clientSatisfactionKpi || '',
    monthlyIncentive: log.monthlyIncentive || '',
    coPilotNote: log.coPilotNote || '',
    callStatus: log.callStatus || log.status,
    workStatus: log.workStatus || 'Completed',
    clientStatusRisk: log.clientStatusRisk || 'Normal'
  };
}

export function buildNewWorkLogGasPayload(params: {
  id: string;
  date: string;
  executiveName: string;
  teId: string;
  durationFormatted: string;
  log: Partial<WorkLogEntry> &
    Pick<WorkLogEntry, 'clientId' | 'clientName' | 'category' | 'details' | 'durationMinutes' | 'status'>;
}): AddWorkLogPayload {
  const { id, date, executiveName, teId, durationFormatted, log } = params;
  return {
    action: 'addWorkLog',
    id,
    date,
    supportName: executiveName,
    executiveName,
    'Support Name': executiveName,
    'Executive Name': executiveName,
    Executive: executiveName,
    'Support Executive': executiveName,
    support_name: executiveName,
    executive_name: executiveName,
    issueCategory: log.issueCategory || log.category || 'General',
    teId,
    clientName: log.clientName || 'Unknown Client',
    workType: log.workType || log.category || 'Inbound Support Call',
    status: log.status || 'Connected',
    summary: log.details || '',
    details: log.details || '',
    Summary: log.details || '',
    'Summary Notes': log.details || '',
    proofLink: log.proofLink || '',
    'Proof Link': log.proofLink || '',
    Proof_Link: log.proofLink || '',
    proof_link: log.proofLink || '',
    Proof: log.proofLink || '',
    startTime: log.startTime || '09:00',
    endTime: log.endTime || '09:15',
    duration: durationFormatted,
    remarksClient: log.remarksClient || log.remarks || '',
    softwareUsage: log.softwareUsage,
    nextFollowUpDate: log.nextFollowUpDate || '',
    'Next Follow-up Date': log.nextFollowUpDate || '',
    followUpDate: log.nextFollowUpDate || '',
    internalNote: log.internalNote || log.remarks || '',
    'Internal Executive Remark': log.internalNote || log.remarks || '',
    managerRemark: log.managerRemark || '',
    'Manager Remark': log.managerRemark || '',
    cooRemark: log.cooRemark || '',
    'COO Remark': log.cooRemark || '',
    saadNote: log.saadNote || '',
    'Note Saad': log.saadNote || '',
    lastWorkSummary: log.lastWorkSummary || log.details || '',
    clientSatisfactionKpi: log.clientSatisfactionKpi || 'Satisfied',
    monthlyIncentive: log.monthlyIncentive || '',
    coPilotNote: log.coPilotNote || '',
    ultimateColumnS: log.coPilotNote || '',
    Column_S: log.coPilotNote || ''
  };
}

export function syncUpdatedWorkLogFieldsToGAS(
  logId: string,
  targetLog: WorkLogEntry,
  updates: Partial<WorkLogEntry>
) {
  const activeRemark =
    updates.managerRemark ||
    updates.cooRemark ||
    updates.approvalRemark ||
    targetLog.managerRemark ||
    targetLog.cooRemark ||
    (updates.approvalStatus ? `Status updated to ${updates.approvalStatus}` : '');

  return postWorkLogToGAS({
    action: 'updateWorkLogProof',
    id: logId,
    updateExistingOnly: true,
    searchKey: targetLog.teId,
    matchTeId: targetLog.teId,
    matchClientName: targetLog.clientName,
    matchDate: targetLog.date,
    matchSummary: targetLog.details,
    matchSupportName: targetLog.executiveName,
    date: targetLog.date,
    supportName: targetLog.executiveName,
    executiveName: targetLog.executiveName,
    'Support Name': targetLog.executiveName,
    'Executive Name': targetLog.executiveName,
    Executive: targetLog.executiveName,
    'Support Executive': targetLog.executiveName,
    issueCategory: targetLog.issueCategory || targetLog.category || 'General',
    teId: targetLog.teId || 'TE-101',
    clientName: targetLog.clientName,
    workType: targetLog.workType || targetLog.category || 'Support',
    status: updates.status || targetLog.status || 'Completed',
    summary: targetLog.details || '',
    details: targetLog.details || '',
    Summary: targetLog.details || '',
    proofLink: updates.proofLink || targetLog.proofLink || '',
    'Proof Link': updates.proofLink || targetLog.proofLink || '',
    managerRemark: activeRemark,
    'Manager Remark': activeRemark,
    specialManagerRemark: activeRemark,
    'Special Manager Remark': activeRemark,
    cooRemark: updates.cooRemark || targetLog.cooRemark || '',
    'COO Remark': updates.cooRemark || targetLog.cooRemark || '',
    saadNote: updates.saadNote || activeRemark,
    'Note Saad': updates.saadNote || activeRemark,
    remarks: activeRemark,
    Remarks: activeRemark,
    approvalStatus: updates.approvalStatus || targetLog.approvalStatus || 'Approved',
    approvalRemark: updates.approvalRemark || activeRemark,
    startTime: targetLog.startTime || '09:00',
    endTime: targetLog.endTime || '09:15',
    duration: targetLog.duration || '00:15:00'
  }).catch(() => {});
}

export function syncUpdatedProofToGAS(logId: string, updatedEntry: WorkLogEntry, proofUrl: string) {
  return postWorkLogToGAS(
    {
      action: 'updateWorkLogProof',
      id: logId,
      updateExistingOnly: true,
      searchKey: updatedEntry.teId,
      matchTeId: updatedEntry.teId,
      matchClientName: updatedEntry.clientName,
      matchDate: updatedEntry.date,
      matchSummary: updatedEntry.details,
      date: updatedEntry.date,
      supportName: updatedEntry.executiveName,
      executiveName: updatedEntry.executiveName,
      'Support Name': updatedEntry.executiveName,
      'Executive Name': updatedEntry.executiveName,
      Executive: updatedEntry.executiveName,
      'Support Executive': updatedEntry.executiveName,
      issueCategory: updatedEntry.issueCategory || updatedEntry.category || 'General',
      teId: updatedEntry.teId || 'TE-101',
      clientName: updatedEntry.clientName,
      workType: updatedEntry.workType || updatedEntry.category || 'Support',
      status: updatedEntry.status || 'Completed',
      summary: updatedEntry.details || '',
      details: updatedEntry.details || '',
      proofLink: proofUrl,
      'Proof Link': proofUrl,
      Proof_Link: proofUrl,
      proof_link: proofUrl,
      Proof: proofUrl,
      startTime: updatedEntry.startTime || '09:00',
      endTime: updatedEntry.endTime || '09:15',
      duration: updatedEntry.duration || '00:15:00',
      nextFollowUpDate: updatedEntry.nextFollowUpDate || '',
      'Next Follow-up Date': updatedEntry.nextFollowUpDate || '',
      followUpDate: updatedEntry.nextFollowUpDate || '',
      managerRemark: updatedEntry.managerRemark || '',
      'Manager Remark': updatedEntry.managerRemark || '',
      specialManagerRemark: updatedEntry.specialManagerRemark || updatedEntry.managerRemark || '',
      'Special Manager Remark': updatedEntry.specialManagerRemark || updatedEntry.managerRemark || '',
      remarksClient: updatedEntry.remarksClient || updatedEntry.remarks || '',
      lastWorkSummary: updatedEntry.lastWorkSummary || updatedEntry.details || ''
    },
    CONFIG.apiEndpoint
  ).catch(() => {});
}

export async function performWorkLogProofLinkUpdate(params: {
  logId: string;
  proofUrl: string;
  workLogs: WorkLogEntry[];
  language: 'en' | 'ur';
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  setWorkLogs: React.Dispatch<React.SetStateAction<WorkLogEntry[]>>;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
}): Promise<boolean> {
  const { logId, proofUrl, workLogs, language, setTickets, setWorkLogs, addNotification } = params;
  let updatedEntry: WorkLogEntry | undefined;

  setTickets(prev =>
    prev.map(ticket => {
      if (!ticket.workLogs.some(l => l.id === logId)) return ticket;
      const updatedLogs = ticket.workLogs.map(l => {
        if (l.id !== logId) return l;
        const up: WorkLogEntry = {
          ...l,
          proofLink: proofUrl,
          isProofPending: false,
          proofUpdatedAt: new Date().toISOString(),
          approvalStatus: 'Approved',
          syncStatus: 'Synchronized',
          flagReason: undefined
        };
        updatedEntry = up;
        return up;
      });
      const updatedTicket = { ...ticket, workLogs: updatedLogs, updatedDate: getLocalDateString() };
      offlineDb.saveTicket(updatedTicket).catch(() => {});
      return updatedTicket;
    })
  );

  setWorkLogs(prev =>
    prev.map(l => {
      if (l.id !== logId) return l;
      const updated: WorkLogEntry = {
        ...l,
        proofLink: proofUrl,
        isProofPending: false,
        proofUpdatedAt: new Date().toISOString(),
        approvalStatus: 'Approved',
        syncStatus: 'Synchronized',
        flagReason: undefined
      };
      updatedEntry = updated;
      offlineDb.saveWorkLog(updated).catch(() => {});
      return updated;
    })
  );

  if (!updatedEntry) {
    const existing = workLogs.find(l => l.id === logId);
    if (existing) {
      updatedEntry = {
        ...existing,
        proofLink: proofUrl,
        isProofPending: false,
        proofUpdatedAt: new Date().toISOString(),
        approvalStatus: 'Approved',
        syncStatus: 'Synchronized'
      };
    }
  }

  if (updatedEntry) {
    fetch('/api/worklogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updatedEntry, skipGas: true })
    }).catch(() => {});
    syncUpdatedProofToGAS(logId, updatedEntry, proofUrl);
  }

  addNotification({
    title: language === 'ur' ? 'پروف لنک اپ ڈیٹ ہو گیا (بغیر ڈبل انٹری)' : 'Proof Link Updated (Single Entry)',
    message:
      language === 'ur'
        ? 'گوگل میٹ ریکارڈنگ لنک اسی ریکارڈ میں کامیابی سے اپ ڈیٹ ہو گیا ہے۔'
        : 'Google Meet recording link updated on existing record without duplicate entry.',
    type: 'success'
  });

  return true;
}

export function checkMorningPendingProofSLA(params: {
  workLogs: WorkLogEntry[];
  tickets: Ticket[];
  currentUser: User | null;
  language: 'en' | 'ur';
  setPendingProofModalOpen: (open: boolean) => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
}) {
  const { workLogs, tickets, currentUser, language, setPendingProofModalOpen, addNotification } = params;
  const hours = new Date().getHours();
  if (hours < 10 || hours >= 11) return;

  const allLogsFromTickets = tickets.flatMap(t => t.workLogs || []);
  const combined = new Map<string, WorkLogEntry>();
  [...workLogs, ...allLogsFromTickets].forEach(log => {
    if (log && log.id && !combined.has(log.id)) combined.set(log.id, log);
  });
  const pending = Array.from(combined.values()).filter(l => isLogPendingProof(l, currentUser));
  if (pending.length === 0) return;

  setPendingProofModalOpen(true);
  addNotification({
    title: language === 'ur' ? 'صبح 10 تا 11 SLA: پینڈنگ پروف لنکس الرٹ' : 'Morning 10-11 SLA: Pending Proof Links',
    message:
      language === 'ur'
        ? `کل کے کام کے ${pending.length} پینڈنگ پروف لنکس باقی ہیں۔`
        : `${pending.length} pending proof links from yesterday require link attachment or Manager Remark.`,
    type: 'warning'
  });
}

