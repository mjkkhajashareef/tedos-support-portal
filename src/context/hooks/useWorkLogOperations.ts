/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  WorkLogEntry,
  FollowUpTracker,
  Ticket,
  SupportClient,
  User,
  UserRole,
  ActiveWorkLogSession,
  AppNotification
} from '../../types';
import { CONFIG } from '../../config/appConfig';
import { offlineDb } from '../../utils/indexedDb';
import { postWorkLogToGAS, getLocalDateString } from '../../utils/helpers';
import { authService } from '../../utils/auth';
import { emitSystemToast } from '../../components/common/SystemToastStack';
import {
  hydrateStoresFromIndexedDb,
  pollServerWorkLogs,
  buildCompleteWorkLogEntry,
  buildNewWorkLogGasPayload,
  syncUpdatedWorkLogFieldsToGAS,
  performWorkLogProofLinkUpdate,
  checkMorningPendingProofSLA
} from './workLogSyncHelpers';

const recentAppWorkLogCache = new Map<string, number>();

interface UseWorkLogOperationsParams {
  currentUser: User | null;
  language: 'en' | 'ur';
  clients: SupportClient[];
  setClients: React.Dispatch<React.SetStateAction<SupportClient[]>>;
  visibleClients: SupportClient[];
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  setFollowUps: React.Dispatch<React.SetStateAction<FollowUpTracker[]>>;
  addFollowUp: (
    followUp: Partial<FollowUpTracker> & Pick<FollowUpTracker, 'clientId' | 'clientName' | 'reason' | 'priority'>,
    options?: { skipGasSync?: boolean }
  ) => void;
  setPendingProofModalOpen: (open: boolean) => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
}

export function useWorkLogOperations({
  currentUser,
  language,
  clients,
  setClients,
  visibleClients,
  tickets,
  setTickets,
  setFollowUps,
  addFollowUp,
  setPendingProofModalOpen,
  addNotification
}: UseWorkLogOperationsParams) {
  const [workLogs, setWorkLogs] = useState<WorkLogEntry[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('tedos_worklogs_v4');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  });

  const [activeLogSession, setActiveLogSessionState] = useState<ActiveWorkLogSession | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tedos_active_worklog_session');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  const updateActiveLogSession = (updates: Partial<ActiveWorkLogSession> | null) => {
    setActiveLogSessionState(prev => {
      if (updates === null) {
        try {
          localStorage.removeItem('tedos_active_worklog_session');
        } catch {}
        return null;
      }
      const next = prev ? { ...prev, ...updates } : (updates as ActiveWorkLogSession);
      try {
        localStorage.setItem('tedos_active_worklog_session', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clearActiveLogSession = () => {
    setActiveLogSessionState(null);
    try {
      localStorage.removeItem('tedos_active_worklog_session');
    } catch {}
  };

  useEffect(() => {
    const derivedLogsMap = new Map<string, WorkLogEntry>();
    const derivedFollowUpsMap = new Map<string, FollowUpTracker>();
    tickets.forEach(ticket => {
      if (/zigma|apollo/i.test(ticket.clientName || '')) return;
      (ticket.workLogs || []).forEach(wl => {
        if (/zigma|apollo/i.test(wl.clientName || '')) return;
        derivedLogsMap.set(wl.id, { ...wl, ticketId: ticket.id });
      });
      (ticket.followUps || []).forEach(f => {
        if (/zigma|apollo/i.test(f.clientName || '')) return;
        derivedFollowUpsMap.set(f.id, { ...f, ticketId: ticket.id });
      });
    });
    setWorkLogs(prev => {
      prev.forEach(l => {
        if (!/zigma|apollo/i.test(l.clientName || '') && !derivedLogsMap.has(l.id)) {
          derivedLogsMap.set(l.id, l);
        }
      });
      return Array.from(derivedLogsMap.values());
    });
    setFollowUps(prev => {
      prev.forEach(f => {
        if (!/zigma|apollo/i.test(f.clientName || '') && !derivedFollowUpsMap.has(f.id)) {
          derivedFollowUpsMap.set(f.id, f);
        }
      });
      return Array.from(derivedFollowUpsMap.values());
    });
  }, [tickets]);

  useEffect(() => {
    hydrateStoresFromIndexedDb({ setTickets, setWorkLogs, setFollowUps });
    const interval = setInterval(() => pollServerWorkLogs(setWorkLogs), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (workLogs.length > 0) {
      try {
        localStorage.setItem('tedos_worklogs_v4', JSON.stringify(workLogs));
      } catch {}
    }
  }, [workLogs]);

  useEffect(() => {
    const morningInterval = setInterval(
      () =>
        checkMorningPendingProofSLA({
          workLogs,
          tickets,
          currentUser,
          language,
          setPendingProofModalOpen,
          addNotification
        }),
      5 * 60 * 1000
    );
    return () => clearInterval(morningInterval);
  }, [workLogs, tickets, language, currentUser]);

  const addWorkLog = async (
    log: Partial<WorkLogEntry> & Pick<WorkLogEntry, 'clientId' | 'clientName' | 'category' | 'details' | 'durationMinutes' | 'status'>
  ): Promise<{ success: boolean; message?: string }> => {
    const sessionUser = currentUser || authService.getSession()?.user;
    const resolvedName =
      sessionUser?.name && sessionUser.name !== 'Executive' && sessionUser.name !== 'Support Executive'
        ? sessionUser.name
        : '';
    const executiveName =
      log.executiveName && log.executiveName !== 'Executive' && log.executiveName !== 'Support Executive'
        ? log.executiveName
        : resolvedName || 'Support Executive';

    let teId = log.teId || '';
    if (!teId) {
      const matchedClient = clients.find(c => c.id === log.clientId || c.name === log.clientName);
      teId = matchedClient?.teId || matchedClient?.id || 'TE-101';
    }

    const unifiedLogId = log.id || `wl-${Date.now()}`;
    const todayStr = log.date || getLocalDateString();
    const timeStr = log.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const hours = Math.floor((log.durationMinutes || 15) / 60);
    const mins = (log.durationMinutes || 15) % 60;
    const durationFormatted = log.duration || `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;

    const dedupeSignature = `${todayStr}|${teId}|${(log.clientName || '').trim().toLowerCase()}|${(log.details || '').trim().toLowerCase().slice(0, 80)}`;
    const lastSubTime = recentAppWorkLogCache.get(dedupeSignature);
    if (lastSubTime && Date.now() - lastSubTime < 30000) {
      return { success: true, message: 'Already recorded (duplicate prevented)' };
    }
    recentAppWorkLogCache.set(dedupeSignature, Date.now());

    let gasResult: { success: boolean; message?: string } = { success: true, message: 'Saved locally' };
    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        const gasPayload = buildNewWorkLogGasPayload({
          id: unifiedLogId,
          date: todayStr,
          executiveName,
          teId,
          durationFormatted,
          log
        });
        gasResult = await postWorkLogToGAS(gasPayload, CONFIG.apiEndpoint);
      } catch (err: any) {
        gasResult = { success: false, message: err?.message || 'Failed to post to Google Sheets' };
      }
    }

    setClients(prev =>
      prev.map(c =>
        c.id === log.clientId || c.name === log.clientName
          ? {
              ...c,
              lastWorkSummary: log.details || c.lastWorkSummary,
              coPilotNote: log.coPilotNote || c.coPilotNote,
              noteSaad: log.saadNote || c.noteSaad,
              clientSatisfactionKpi: log.clientSatisfactionKpi || c.clientSatisfactionKpi,
              monthlyIncentive: log.monthlyIncentive || c.monthlyIncentive,
              recentActivityTimestamp: 'Just now'
            }
          : c
      )
    );

    if (log.nextFollowUpDate && log.nextFollowUpDate.trim() !== '') {
      addFollowUp(
        {
          clientId: log.clientId,
          clientName: log.clientName,
          executiveName,
          teId,
          scheduledDate: log.nextFollowUpDate,
          scheduledTime: '11:00',
          priority: log.priority || 'High',
          lastContactDate: todayStr,
          status: 'Pending',
          reason: log.details || `Follow-up scheduled from Daily Work Log (${log.category})`,
          remarks: log.internalNote || log.remarks || ''
        },
        { skipGasSync: true }
      );
    }

    const completeLogEntry = buildCompleteWorkLogEntry({
      unifiedLogId,
      todayStr,
      timeStr,
      executiveName,
      teId,
      durationFormatted,
      log
    });

    setWorkLogs(prev => [completeLogEntry, ...prev.filter(l => l.id !== unifiedLogId)]);
    offlineDb.saveWorkLog(completeLogEntry).catch(() => {});

    fetch('/api/worklogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...completeLogEntry, skipGas: true })
    }).catch(() => {});

    const activeTicket =
      tickets.find(t => t.id === (log as any).ticketId) ||
      tickets.find(t => t.clientId === log.clientId && t.status !== 'Closed' && t.status !== 'Resolved') ||
      tickets.find(t => t.clientId === log.clientId);

    if (activeTicket) {
      setTickets(prev =>
        prev.map(t => {
          if (t.id !== activeTicket.id) return t;
          const updated = {
            ...t,
            workLogs: [{ ...completeLogEntry, ticketId: t.id }, ...(t.workLogs || []).filter(w => w.id !== unifiedLogId)],
            updatedDate: todayStr
          };
          offlineDb.saveTicket(updated).catch(() => {});
          return updated;
        })
      );
    }

    emitSystemToast({
      title: gasResult.success
        ? language === 'ur' ? 'ورک لاگ شیٹ میں محفوظ' : 'Work Log Synced to Sheet'
        : language === 'ur' ? 'ورک لاگ مقامی طور پر محفوظ' : 'Saved Locally (Sheet Retry)',
      message: gasResult.message || `${log.clientName} (${log.durationMinutes}m)`,
      type: gasResult.success ? 'success' : 'warning'
    });

    return gasResult;
  };

  const updateWorkLogFields = (logId: string, updates: Partial<WorkLogEntry>) => {
    const currentLog =
      workLogs.find(l => l.id === logId) || tickets.flatMap(t => t.workLogs || []).find(l => l.id === logId);

    const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));

    if (cleanUpdates.approvalStatus === 'Approved') {
      cleanUpdates.isProofPending = false;
      cleanUpdates.syncStatus = 'Synchronized';
      cleanUpdates.flagReason = undefined;
      if (!currentLog?.proofLink || currentLog.proofLink === 'PENDING') {
        cleanUpdates.proofLink =
          cleanUpdates.approvalRemark || cleanUpdates.managerRemark || cleanUpdates.cooRemark || 'Approved by Manager';
      }
    }

    const targetLog: WorkLogEntry = currentLog
      ? { ...currentLog, ...cleanUpdates }
      : ({
          id: logId,
          clientId: 'Unknown',
          clientName: 'Client',
          date: getLocalDateString(),
          time: '09:00',
          durationMinutes: 15,
          category: 'Support',
          status: 'Completed',
          details: 'Updated',
          ...cleanUpdates
        } as WorkLogEntry);

    setWorkLogs(prev => prev.map(l => (l.id === logId ? { ...l, ...cleanUpdates } : l)));
    offlineDb.saveWorkLog(targetLog).catch(() => {});

    setTickets(prev =>
      prev.map(ticket => {
        if (!(ticket.workLogs || []).some(l => l.id === logId)) return ticket;
        const updatedTicket = {
          ...ticket,
          workLogs: ticket.workLogs.map(l => (l.id === logId ? { ...l, ...cleanUpdates } : l)),
          updatedDate: getLocalDateString()
        };
        offlineDb.saveTicket(updatedTicket).catch(() => {});
        return updatedTicket;
      })
    );

    if (updates.executiveReply) {
      addNotification({
        title: `Support Team Reply from ${targetLog.executiveName}`,
        message: `[Client: ${targetLog.clientName}] Reply: "${updates.executiveReply}"`,
        type: 'info'
      });
    }

    if (updates.managerRemark || updates.cooRemark) {
      addNotification({
        title: `Leadership Remark on ${targetLog.clientName}`,
        message: `${currentUser?.name || 'Leadership'}: "${updates.managerRemark || updates.cooRemark}"`,
        type: 'warning'
      });
    }

    fetch('/api/worklogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...targetLog, skipGas: true })
    }).catch(() => {});

    const isLeadershipAction = Boolean(
      updates.managerRemark !== undefined ||
        updates.cooRemark !== undefined ||
        updates.approvalRemark !== undefined ||
        updates.approvalStatus !== undefined ||
        updates.status !== undefined ||
        updates.proofLink !== undefined
    );

    if (isLeadershipAction) {
      syncUpdatedWorkLogFieldsToGAS(logId, targetLog, updates);
    }
  };

  const updateWorkLogApproval = (
    logId: string,
    approvalStatus: 'Approved' | 'Rejected',
    remark?: string
  ) => {
    updateWorkLogFields(logId, {
      approvalStatus,
      approvalRemark: remark,
      cooRemark: currentUser?.role === UserRole.COO || currentUser?.role === UserRole.DIRECTOR ? remark : undefined,
      managerRemark:
        currentUser?.role === UserRole.SUPPORT_MANAGER || currentUser?.role === UserRole.OPERATION_MANAGER
          ? remark
          : undefined
    });
  };

  const updateWorkLogProofLink = (logId: string, proofUrl: string): Promise<boolean> =>
    performWorkLogProofLinkUpdate({
      logId,
      proofUrl,
      workLogs,
      language,
      setTickets,
      setWorkLogs,
      addNotification
    });

  const visibleWorkLogs = useMemo(() => {
    const cleanLogs = workLogs.filter(l => !/zigma|apollo/i.test(l.clientName || ''));
    if (!currentUser || currentUser.role !== UserRole.SUPPORT_EXECUTIVE) return cleanLogs;
    const execNameLower = (currentUser.name || '').trim().toLowerCase();
    const firstToken = execNameLower.split(' ')[0];
    const myClientIds = new Set(visibleClients.map(c => c.id));
    const myClientNames = new Set(visibleClients.map(c => (c.name || '').toLowerCase()));
    const myEmpId = (currentUser.employeeId || '').trim().toLowerCase();
    return cleanLogs.filter(l => {
      const logExec = (l.executiveName || l.supportName || '').trim().toLowerCase();
      if (logExec && (logExec === execNameLower || logExec.includes(firstToken) || firstToken.includes(logExec))) return true;
      if (myEmpId && l.teId && l.teId.trim().toLowerCase() === myEmpId) return true;
      return myClientIds.has(l.clientId) || myClientNames.has((l.clientName || '').toLowerCase());
    });
  }, [workLogs, currentUser, visibleClients]);

  return {
    workLogs,
    setWorkLogs,
    visibleWorkLogs,
    activeLogSession,
    updateActiveLogSession,
    clearActiveLogSession,
    addWorkLog,
    updateWorkLogApproval,
    updateWorkLogFields,
    updateWorkLogProofLink
  };
}
