/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  FollowUpTracker,
  OverServiceEntry,
  Ticket,
  SupportClient,
  User,
  UserRole
} from '../../types';
import { CONFIG } from '../../config/appConfig';
import { offlineDb } from '../../utils/indexedDb';
import { postWorkLogToGAS, getLocalDateString } from '../../utils/helpers';
import { emitSystemToast } from '../../components/common/SystemToastStack';

interface UseFollowUpOperationsParams {
  currentUser: User | null;
  clients: SupportClient[];
  visibleClients: SupportClient[];
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
}

export function useFollowUpOperations({
  currentUser,
  clients,
  visibleClients,
  tickets,
  setTickets
}: UseFollowUpOperationsParams) {
  const [followUps, setFollowUps] = useState<FollowUpTracker[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('tedos_followups_v4');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  });

  const [overServices, setOverServices] = useState<OverServiceEntry[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('tedos_over_services');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed.filter(o => !/supermart|apex/i.test(o.clientName || ''));
          }
        }
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    if (followUps.length > 0) {
      try {
        localStorage.setItem('tedos_followups_v4', JSON.stringify(followUps));
      } catch {}
    }
  }, [followUps]);

  const addOverService = (entry: Omit<OverServiceEntry, 'id'>) => {
    const newEntry: OverServiceEntry = { ...entry, id: `OVS-${Date.now().toString().slice(-5)}` };
    setOverServices(prev => {
      const updated = [newEntry, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('tedos_over_services', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const updateOverService = (id: string, updates: Partial<OverServiceEntry>) => {
    setOverServices(prev => {
      const updated = prev.map(item => (item.id === id ? { ...item, ...updates } : item));
      if (typeof window !== 'undefined') {
        localStorage.setItem('tedos_over_services', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const addFollowUp = (
    followUp: Partial<FollowUpTracker> & Pick<FollowUpTracker, 'clientId' | 'clientName' | 'reason' | 'priority'>,
    options?: { skipGasSync?: boolean }
  ) => {
    const todayStr = getLocalDateString();
    const executiveName = followUp.executiveName || currentUser?.name || 'Support Executive';
    const matchedClient = clients.find(c => c.id === followUp.clientId || c.name === followUp.clientName);
    const teId = followUp.teId || matchedClient?.teId || matchedClient?.id || 'TE-101';
    const newFollowUpId = followUp.id || `f-${Date.now()}`;

    const newFollowUp: FollowUpTracker = {
      id: newFollowUpId,
      ticketId: (followUp as any).ticketId,
      clientId: followUp.clientId,
      clientName: followUp.clientName,
      teId,
      executiveName,
      scheduledDate: followUp.scheduledDate || todayStr,
      scheduledTime: followUp.scheduledTime || '11:00',
      priority: followUp.priority || 'High',
      lastContactDate: followUp.lastContactDate || todayStr,
      status: followUp.status || 'Pending',
      reason: followUp.reason,
      remarks: followUp.remarks || '',
      nextAction: followUp.nextAction || '',
      syncStatus: 'Synchronized'
    };

    setFollowUps(prev => {
      const filtered = prev.filter(
        f => !(f.clientId === newFollowUp.clientId && f.scheduledDate === newFollowUp.scheduledDate && f.reason === newFollowUp.reason)
      );
      const nextList = [newFollowUp, ...filtered];
      try {
        localStorage.setItem('tedos_followups_v4', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });
    offlineDb.saveFollowUp(newFollowUp).catch(() => {});

    fetch('/api/follow-ups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newFollowUp, skipGas: Boolean(options?.skipGasSync) })
    })
      .then(r => r.json())
      .then(json => {
        if (!options?.skipGasSync && json.sheetSynced === false) {
          emitSystemToast({
            title: 'Follow-Up Saved Locally',
            message: json.sheetMessage || 'Sheet sync will retry automatically.',
            type: 'warning'
          });
        }
      })
      .catch(() => {});

    if (!options?.skipGasSync) {
      postWorkLogToGAS(
        {
          action: 'syncUltimateFollowUp',
          id: newFollowUpId,
          date: todayStr,
          supportName: executiveName,
          issueCategory: 'Follow-up',
          teId,
          clientName: followUp.clientName,
          workType: 'Follow-up Scheduled',
          status: newFollowUp.status,
          summary: followUp.reason,
          startTime: newFollowUp.scheduledTime,
          endTime: newFollowUp.scheduledTime,
          duration: '00:15:00',
          nextFollowUpDate: newFollowUp.scheduledDate,
          'Next Follow-up Date': newFollowUp.scheduledDate,
          followUpDate: newFollowUp.scheduledDate,
          remarksClient: followUp.remarks || ''
        },
        CONFIG.apiEndpoint
      ).catch(e => console.warn('[AppContext] Ultimate Sheet follow-up sync warning:', e));
    }

    const activeTicket =
      tickets.find(t => t.id === (followUp as any).ticketId) ||
      tickets.find(t => t.clientId === followUp.clientId && t.status !== 'Closed' && t.status !== 'Resolved') ||
      tickets.find(t => t.clientId === followUp.clientId);

    if (activeTicket) {
      setTickets(prev =>
        prev.map(t => {
          if (t.id !== activeTicket.id) return t;
          const updated = {
            ...t,
            followUps: [{ ...newFollowUp, ticketId: t.id }, ...(t.followUps || []).filter(f => f.id !== newFollowUpId)],
            updatedDate: todayStr
          };
          offlineDb.saveTicket(updated).catch(() => {});
          return updated;
        })
      );
    }
  };

  const updateFollowUp = (id: string, updates: Partial<FollowUpTracker>) => {
    setFollowUps(prev => {
      const next = prev.map(f => {
        if (f.id === id) {
          const updated = { ...f, ...updates };
          offlineDb.saveFollowUp(updated).catch(() => {});
          return updated;
        }
        return f;
      });
      try {
        localStorage.setItem('tedos_followups_v4', JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch(`/api/follow-ups/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
      .then(r => r.json())
      .then(json => {
        if (json.sheetSynced === false) {
          emitSystemToast({
            title: 'Follow-Up Updated on Server',
            message: json.sheetMessage || 'Sheet sync pending.',
            type: 'warning'
          });
        }
      })
      .catch(() => {});

    setTickets(prev =>
      prev.map(t => {
        if (!(t.followUps || []).some(f => f.id === id)) return t;
        const updatedTicket = {
          ...t,
          followUps: (t.followUps || []).map(f => (f.id === id ? { ...f, ...updates } : f)),
          updatedDate: getLocalDateString()
        };
        offlineDb.saveTicket(updatedTicket).catch(() => {});
        return updatedTicket;
      })
    );
  };

  const visibleFollowUps = useMemo(() => {
    const clean = followUps.filter(f => !/zigma|apollo/i.test(f.clientName || ''));
    if (!currentUser || currentUser.role !== UserRole.SUPPORT_EXECUTIVE) return clean;
    const execNameLower = (currentUser.name || '').trim().toLowerCase();
    const firstToken = execNameLower.split(' ')[0];
    const myClientIds = new Set(visibleClients.map(c => c.id));
    const myClientNames = new Set(visibleClients.map(c => (c.name || '').toLowerCase()));
    return clean.filter(f => {
      const fExec = (f.executiveName || '').trim().toLowerCase();
      if (fExec && (fExec === execNameLower || fExec.includes(firstToken) || firstToken.includes(fExec))) return true;
      return myClientIds.has(f.clientId) || myClientNames.has((f.clientName || '').toLowerCase());
    });
  }, [followUps, currentUser, visibleClients]);

  return {
    followUps,
    setFollowUps,
    overServices,
    addOverService,
    updateOverService,
    visibleFollowUps,
    addFollowUp,
    updateFollowUp
  };
}
