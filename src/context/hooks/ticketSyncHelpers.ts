/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Ticket } from '../../types';
import { CONFIG } from '../../config/appConfig';
import { postWorkLogToGAS } from '../../utils/helpers';
import { emitSystemToast } from '../../components/common/SystemToastStack';

export function syncNewTicketToServer(newTicket: Ticket): Promise<boolean> {
  return fetch('/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newTicket)
  })
    .then(res => res.json().catch(() => ({})))
    .then(json => {
      if (json.sheetSynced === false) {
        emitSystemToast({
          title: 'Ticket Saved Locally (Sheet Retry Queued)',
          message: json.sheetMessage || `Ticket ${newTicket.id} stored on server.`,
          type: 'warning'
        });
        return false;
      }
      return true;
    })
    .catch(e => {
      console.warn('[AppContext] Ultimate Sheet Ticket Rase tab sync warning:', e);
      return false;
    });
}

export function syncUpdatedTicketToServerAndGas(
  updated: Ticket,
  solvedByPerson: string | undefined,
  currentUserName: string | undefined,
  updatedResponse1: string
) {
  fetch(`/api/tickets/${encodeURIComponent(updated.id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated)
  })
    .then(r => r.json())
    .then(json => {
      if (json.sheetSynced === false) {
        emitSystemToast({
          title: 'Ticket Updated on Server',
          message: json.sheetMessage || 'Google Sheet sync pending.',
          type: 'warning'
        });
      }
    })
    .catch(() => {});

  postWorkLogToGAS(
    {
      action: 'syncTicketResponse1',
      id: updated.id,
      date: updated.updatedDate,
      supportName: solvedByPerson || currentUserName || updated.assignedExecutive,
      issueCategory: updated.issueCategory,
      teId: updated.teId || updated.clientId,
      clientName: updated.clientName,
      workType: `Ticket ${updated.status}`,
      status: updated.status,
      summary: updated.resolutionSummary || updated.issueDescription,
      proofLink: updated.attachmentUrl || '',
      startTime: '09:00',
      endTime: '09:15',
      duration: '00:15:00',
      ultimateResponse1: updatedResponse1,
      'Response 1': updatedResponse1
    },
    CONFIG.apiEndpoint
  ).catch(() => {});
}
