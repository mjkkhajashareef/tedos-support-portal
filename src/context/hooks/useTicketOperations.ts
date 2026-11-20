/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Ticket,
  TicketStatus,
  TimelineEntryType,
  WorkLogEntry,
  FollowUpTracker,
  WhatsAppLogMetadata,
  TrainingLogEntry,
  AttachmentArchitecture,
  SupportClient,
  User,
  UserRole,
  AppNotification
} from '../../types';
import { offlineDb } from '../../utils/indexedDb';
import { getLocalDateString } from '../../utils/helpers';
import { syncNewTicketToServer, syncUpdatedTicketToServerAndGas } from './ticketSyncHelpers';

interface UseTicketOperationsParams {
  currentUser: User | null;
  setClients: React.Dispatch<React.SetStateAction<SupportClient[]>>;
  visibleClients: SupportClient[];
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
}

export function useTicketOperations({
  currentUser,
  setClients,
  visibleClients,
  addNotification
}: UseTicketOperationsParams) {
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('tedos_tickets_v4');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    if (tickets.length > 0) {
      try {
        localStorage.setItem('tedos_tickets_v4', JSON.stringify(tickets));
      } catch {}
    }
  }, [tickets]);

  const addTicket = async (
    ticket: Omit<
      Ticket,
      'id' | 'createdDate' | 'updatedDate' | 'timeline' | 'workLogs' | 'followUps' | 'whatsappLogs' | 'trainingLogs' | 'attachments'
    >
  ): Promise<Ticket> => {
    const todayStr = getLocalDateString();
    const newId = `TKT-${new Date().getFullYear()}-${String(tickets.length + 1).padStart(3, '0')}`;
    const raisedBy = ticket.raisedBy || currentUser?.name || ticket.createdBy || 'Support Manager';
    const fromRole = ticket.fromRole || currentUser?.role || UserRole.SUPPORT_MANAGER;
    const assignedToRole =
      ticket.assignedToRole || (fromRole === UserRole.SUPPORT_MANAGER ? UserRole.COO : 'Technical / COO');
    const response1String =
      ticket.ultimateResponse1 ||
      `[TICKET ${newId}] FROM: ${raisedBy} (${fromRole}) -> TO: ${assignedToRole} (${ticket.assignedExecutive || 'COO'}) | Issue: ${ticket.issueCategory} | Status: ${ticket.status}${ticket.attachmentUrl ? ` | Attachment: ${ticket.attachmentUrl}` : ''}`;

    const initialAttachments: AttachmentArchitecture[] = ticket.attachmentUrl
      ? [
          {
            id: `att-${Date.now()}`,
            name: ticket.attachmentUrl,
            sizeBytes: 204800,
            fileType: 'Document',
            uploadedAt: new Date().toISOString(),
            uploadedBy: raisedBy
          }
        ]
      : [];

    const newTicket: Ticket = {
      ...ticket,
      id: newId,
      raisedBy,
      fromRole,
      assignedToRole,
      ultimateResponse1: response1String,
      createdDate: todayStr,
      updatedDate: todayStr,
      timeline: [
        {
          id: `tl-${Date.now()}-1`,
          type: 'Ticket Created',
          timestamp: new Date().toISOString(),
          performedBy: raisedBy,
          notes: `Ticket Raised [FROM: ${raisedBy} -> TO: ${assignedToRole}]: ${ticket.issueCategory}`
        }
      ],
      workLogs: [],
      followUps: [],
      history: [],
      whatsappLogs: [],
      trainingLogs: [],
      attachments: initialAttachments
    };

    if (ticket.assignedExecutive) {
      newTicket.timeline.push({
        id: `tl-${Date.now()}-2`,
        type: 'Assigned',
        timestamp: new Date().toISOString(),
        performedBy: raisedBy,
        notes: `Ticket routed TO: ${assignedToRole} (${ticket.assignedExecutive})`
      });
    }

    setTickets(prev => [newTicket, ...prev]);
    setClients(prev =>
      prev.map(c =>
        c.id === ticket.clientId || c.name === ticket.clientName
          ? { ...c, ultimateResponse1: response1String }
          : c
      )
    );

    const syncedOk = await syncNewTicketToServer(newTicket);
    offlineDb.saveTicket(newTicket).catch(err => {
      console.error('[TEDOS Db] Failed to save ticket to IndexedDB', err);
    });

    if (syncedOk) {
      addNotification({
        title: `Ticket Raised (${raisedBy} -> ${assignedToRole})`,
        message: `Ticket ${newId} for ${ticket.clientName} synced to Google Sheet ("Ticket Rase") & Ultimate Response 1.`,
        type: 'success'
      });
    }

    return newTicket;
  };

  const updateTicket = (id: string, updates: Partial<Ticket>) => {
    setTickets(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const isSolved = updates.status === TicketStatus.RESOLVED || updates.status === TicketStatus.CLOSED;
        const solvedByPerson = isSolved ? updates.solvedBy || currentUser?.name || 'COO / Tech Team' : t.solvedBy;
        const updatedResponse1 =
          updates.ultimateResponse1 ||
          `[TICKET ${t.id}] FROM: ${t.raisedBy || t.createdBy} -> TO: ${updates.assignedToRole || t.assignedToRole || 'COO'} | Status: ${updates.status || t.status}${solvedByPerson ? ` | Solved By: ${solvedByPerson}` : ''}${updates.resolutionSummary ? ` | Resolution: ${updates.resolutionSummary}` : ''}${updates.attachmentUrl || t.attachmentUrl ? ` | Attachment: ${updates.attachmentUrl || t.attachmentUrl}` : ''}`;

        const updated: Ticket = {
          ...t,
          ...updates,
          solvedBy: solvedByPerson,
          ultimateResponse1: updatedResponse1,
          updatedDate: getLocalDateString()
        };

        syncUpdatedTicketToServerAndGas(updated, solvedByPerson, currentUser?.name, updatedResponse1);

        if (updates.status && updates.status !== t.status) {
          let timelineType: TimelineEntryType = 'Assigned';
          if (updates.status === 'Escalated') timelineType = 'Issue Escalated';
          else if (updates.status === 'Resolved') timelineType = 'Resolved';
          else if (updates.status === 'Closed') timelineType = 'Closed';

          updated.timeline = [
            ...updated.timeline,
            {
              id: `tl-${Date.now()}`,
              type: timelineType,
              timestamp: new Date().toISOString(),
              performedBy: solvedByPerson || currentUser?.name || 'System',
              notes:
                `Status changed from ${t.status} to ${updates.status} (Synced to Ultimate Response 1).` +
                (updates.resolutionSummary ? ` Resolution: ${updates.resolutionSummary}` : '')
            }
          ];

          addNotification({
            title: `Ticket ${updates.status} (${id})`,
            message: `Ticket ${id} is now ${updates.status} by ${solvedByPerson || currentUser?.name || 'System'} [Ultimate Response 1 Updated].`,
            type: updates.status === 'Escalated' ? 'error' : 'success'
          });
        }

        offlineDb.saveTicket(updated).catch(err => {
          console.error('[TEDOS Db] Failed to save ticket updates to IndexedDB', err);
        });
        return updated;
      })
    );
  };

  const addTicketTimelineEntry = (ticketId: string, type: TimelineEntryType, notes: string) => {
    setTickets(prev =>
      prev.map(t => {
        if (t.id !== ticketId) return t;
        const updated = {
          ...t,
          timeline: [
            ...t.timeline,
            {
              id: `tl-${Date.now()}`,
              type,
              timestamp: new Date().toISOString(),
              performedBy: currentUser?.name || 'System',
              notes
            }
          ],
          updatedDate: getLocalDateString()
        };
        offlineDb.saveTicket(updated).catch(() => {});
        return updated;
      })
    );
  };

  const addTicketWorkLog = (
    ticketId: string,
    log: Omit<WorkLogEntry, 'id' | 'ticketId' | 'timestamp' | 'date' | 'time' | 'syncStatus'>
  ) => {
    const executiveName = log.executiveName || currentUser?.name || 'Support Executive';
    const teId = log.teId || currentUser?.employeeId || 'TE-101';
    const todayStr = getLocalDateString();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const newLog: WorkLogEntry = {
      ...log,
      id: `wl-${Date.now()}`,
      ticketId,
      timestamp: new Date().toISOString(),
      date: todayStr,
      time: timeStr,
      executiveName,
      teId,
      syncStatus: 'Synchronized'
    };

    setTickets(prev =>
      prev.map(t => {
        if (t.id !== ticketId) return t;
        const updated = {
          ...t,
          workLogs: [newLog, ...t.workLogs],
          timeline: [
            ...t.timeline,
            {
              id: `tl-${Date.now()}`,
              type: 'Work Log Added' as TimelineEntryType,
              timestamp: new Date().toISOString(),
              performedBy: executiveName,
              notes: `Work Log added: ${log.category} (${log.durationMinutes} mins). Details: ${log.details}`
            }
          ],
          updatedDate: todayStr
        };
        offlineDb.saveTicket(updated).catch(() => {});
        return updated;
      })
    );
  };

  const addTicketFollowUp = (
    ticketId: string,
    followUp: Omit<FollowUpTracker, 'id' | 'ticketId' | 'syncStatus'>
  ) => {
    const executiveName = followUp.executiveName || currentUser?.name || 'Support Executive';
    const teId = followUp.teId || currentUser?.employeeId || 'TE-101';
    const todayStr = getLocalDateString();
    const newFollowUp: FollowUpTracker = {
      ...followUp,
      id: `f-${Date.now()}`,
      ticketId,
      teId,
      executiveName,
      syncStatus: 'Synchronized'
    };

    setTickets(prev =>
      prev.map(t => {
        if (t.id !== ticketId) return t;
        const updated = {
          ...t,
          followUps: [newFollowUp, ...t.followUps],
          timeline: [
            ...t.timeline,
            {
              id: `tl-${Date.now()}`,
              type: 'Follow-up Scheduled' as TimelineEntryType,
              timestamp: new Date().toISOString(),
              performedBy: executiveName,
              notes: `Scheduled Follow-up for ${followUp.scheduledDate} at ${followUp.scheduledTime}. Purpose: ${followUp.reason}`
            }
          ],
          updatedDate: todayStr
        };
        offlineDb.saveTicket(updated).catch(() => {});
        return updated;
      })
    );
  };

  const addTicketWhatsAppLog = (
    ticketId: string,
    log: Omit<WhatsAppLogMetadata, 'id' | 'timestamp' | 'status'>
  ) => {
    const todayStr = getLocalDateString();
    const newLog: WhatsAppLogMetadata = {
      ...log,
      id: `wa-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'Sent'
    };

    setTickets(prev =>
      prev.map(t => {
        if (t.id !== ticketId) return t;
        const updated = {
          ...t,
          whatsappLogs: [newLog, ...t.whatsappLogs],
          timeline: [
            ...t.timeline,
            {
              id: `tl-${Date.now()}`,
              type: 'WhatsApp Sent' as TimelineEntryType,
              timestamp: new Date().toISOString(),
              performedBy: currentUser?.name || 'System',
              notes: `WhatsApp broadcast outbound to ${log.recipientPhone} (Template: ${log.templateName}). Msg: "${log.text}"`
            }
          ],
          updatedDate: todayStr
        };
        offlineDb.saveTicket(updated).catch(() => {});
        return updated;
      })
    );
  };

  const addTicketTrainingLog = (ticketId: string, log: Omit<TrainingLogEntry, 'id'>) => {
    const todayStr = getLocalDateString();
    const newLog: TrainingLogEntry = { ...log, id: `trn-${Date.now()}` };

    setTickets(prev =>
      prev.map(t => {
        if (t.id !== ticketId) return t;
        const updated = {
          ...t,
          trainingLogs: [newLog, ...t.trainingLogs],
          timeline: [
            ...t.timeline,
            {
              id: `tl-${Date.now()}`,
              type: 'Training Conducted' as TimelineEntryType,
              timestamp: new Date().toISOString(),
              performedBy: log.conductedBy,
              notes: `Conducted training on topic "${log.topic}" for ${log.attendeesCount} staff. Duration: ${log.durationMinutes} mins.`
            }
          ],
          updatedDate: todayStr
        };
        offlineDb.saveTicket(updated).catch(() => {});
        return updated;
      })
    );
  };

  const visibleTickets = useMemo(() => {
    const clean = tickets.filter(t => !/zigma|apollo/i.test(t.clientName || ''));
    if (!currentUser || currentUser.role !== UserRole.SUPPORT_EXECUTIVE) return clean;
    const execNameLower = (currentUser.name || '').trim().toLowerCase();
    const firstToken = execNameLower.split(' ')[0];
    const myClientIds = new Set(visibleClients.map(c => c.id));
    const myClientNames = new Set(visibleClients.map(c => (c.name || '').toLowerCase()));
    return clean.filter(t => {
      const tExec = (t.assignedExecutive || t.raisedBy || '').trim().toLowerCase();
      if (tExec && (tExec === execNameLower || tExec.includes(firstToken) || firstToken.includes(tExec))) return true;
      return myClientIds.has(t.clientId) || myClientNames.has((t.clientName || '').toLowerCase());
    });
  }, [tickets, currentUser, visibleClients]);

  return {
    tickets,
    setTickets,
    visibleTickets,
    addTicket,
    updateTicket,
    addTicketTimelineEntry,
    addTicketWorkLog,
    addTicketFollowUp,
    addTicketWhatsAppLog,
    addTicketTrainingLog
  };
}
