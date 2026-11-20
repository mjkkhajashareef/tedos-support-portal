/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Ticket, SupportClient } from '../../../types';
import { Globe, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getTicketStatusStyle, getTicketPriorityStyle } from './ticketStyleUtils';

interface TicketQueueSidebarProps {
  filteredTickets: Ticket[];
  selectedTicketId: string | null;
  onSelectTicket: (id: string) => void;
  clientPool: SupportClient[];
  isUrdu: boolean;
}

export const TicketQueueSidebar: React.FC<TicketQueueSidebarProps> = ({
  filteredTickets,
  selectedTicketId,
  onSelectTicket,
  clientPool,
  isUrdu
}) => {
  return (
    <div className="lg:col-span-4 space-y-3 max-h-[75vh] overflow-y-auto pr-1">
      <div className="flex justify-between items-center px-1 mb-1">
        <span className="text-xs font-bold tracking-widest text-md-outline uppercase">
          {isUrdu ? `ٹکٹس کی قطار (${filteredTickets.length})` : `TICKETS QUEUE (${filteredTickets.length})`}
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        {filteredTickets.length === 0 ? (
          <div className="bg-md-surface-container-lowest border border-dashed border-md-outline/30 rounded-2xl p-8 text-center text-sm text-md-outline font-medium">
            {isUrdu ? 'کوئی ٹکٹ نہیں ملا۔' : 'No tickets matches filters.'}
          </div>
        ) : (
          filteredTickets.map(ticket => {
            const isActive = ticket.id === selectedTicketId;
            const cObj = clientPool.find(
              c => c.id === ticket.clientId || c.name === ticket.clientName || c.teId === ticket.teId
            );
            const u = cObj?.url || cObj?.deploymentUrl;

            return (
              <motion.div
                key={ticket.id}
                layoutId={`ticket-card-${ticket.id}`}
                onClick={() => onSelectTicket(ticket.id)}
                className={`cursor-pointer rounded-2xl border text-left p-4 transition-all duration-200 ${
                  isActive
                    ? 'bg-md-primary-container/40 border-md-primary ring-1 ring-md-primary'
                    : 'bg-md-surface-container-lowest border-md-surface-variant hover:bg-md-surface-container-low/55'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="text-xs font-mono font-bold tracking-tight text-md-primary">{ticket.id}</span>
                  <div className="flex gap-1">
                    <span className={`text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full ${getTicketStatusStyle(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getTicketPriorityStyle(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-md-on-surface truncate">{ticket.clientName}</h3>
                <p className="text-xs font-medium text-md-primary mt-1">{ticket.issueCategory}</p>
                <p className="text-xs text-md-outline font-medium mt-1 line-clamp-2">{ticket.issueDescription}</p>

                {u && (
                  <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-[10px] font-mono text-blue-700 dark:text-blue-300 font-bold">
                    <Globe size={11} className="shrink-0 text-blue-500" />
                    <span className="truncate">{u}</span>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-md-surface-variant/70 flex items-center justify-between text-[10px] font-medium text-md-outline">
                  <span className="flex items-center gap-1">
                    <User size={12} /> {ticket.assignedExecutive}
                  </span>
                  <span>
                    {isUrdu ? 'اپ ڈیٹ: ' : 'Updated: '}
                    {ticket.updatedDate}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </div>
  );
};
