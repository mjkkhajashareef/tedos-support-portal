import { Ticket, TicketStatus, TransitionHistoryEntry, User, UserRole } from '../types';
import { can, Permission } from '../utils/rbac';
import { AuthAudit } from '../utils/authAudit';

// Simplified state machine
const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.NEW]: [TicketStatus.ASSIGNED, TicketStatus.CANCELLED],
  [TicketStatus.ASSIGNED]: [TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED, TicketStatus.ESCALATED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.WAITING_FOR_CUSTOMER, TicketStatus.RESOLVED, TicketStatus.ESCALATED, TicketStatus.ON_HOLD],
  [TicketStatus.WAITING_FOR_CUSTOMER]: [TicketStatus.IN_PROGRESS, TicketStatus.FOLLOW_UP_SCHEDULED, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  [TicketStatus.FOLLOW_UP_SCHEDULED]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.REOPENED],
  [TicketStatus.CLOSED]: [TicketStatus.REOPENED],
  [TicketStatus.REOPENED]: [TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS],
  [TicketStatus.ON_HOLD]: [TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
  [TicketStatus.ESCALATED]: [TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED],
  [TicketStatus.CANCELLED]: [],
};

export const TicketWorkflowService = {
  canTransition: (currentStatus: TicketStatus, nextStatus: TicketStatus): boolean => {
    return VALID_TRANSITIONS[currentStatus].includes(nextStatus);
  },

  transitionTicket: async (
    ticket: Ticket,
    nextStatus: TicketStatus,
    user: User,
    notes: string
  ): Promise<Ticket> => {
    if (!TicketWorkflowService.canTransition(ticket.status, nextStatus)) {
      throw new Error(`Invalid transition from ${ticket.status} to ${nextStatus}`);
    }

    if (!can(user.role, Permission.MANAGE_TICKETS)) {
      throw new Error('Unauthorized');
    }

    const transitionEntry: TransitionHistoryEntry = {
      id: `hist-${Date.now()}`,
      fromStatus: ticket.status,
      toStatus: nextStatus,
      timestamp: new Date().toISOString(),
      performedBy: user.id,
      notes,
    };

    // Audit integration (using AuthAudit to log workflow events)
    AuthAudit.logEvent('LOGIN', user, `WORKFLOW_TRANSITION: Ticket ${ticket.id}: ${ticket.status} -> ${nextStatus}`, 'MANAGE_TICKETS');

    return {
      ...ticket,
      status: nextStatus,
      history: [...ticket.history, transitionEntry],
      updatedDate: new Date().toISOString().split('T')[0],
      timeline: [
        ...ticket.timeline,
        {
          id: `time-${Date.now()}`,
          type: 'Ticket Created', // placeholder for specific transition events
          timestamp: new Date().toISOString(),
          performedBy: user.name,
          notes: `Status changed to ${nextStatus}: ${notes}`,
        }
      ]
    };
  },
};
