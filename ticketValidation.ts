import { TicketCreate, TicketUpdate } from '../types';

export const validateTicket = (ticket: TicketCreate | TicketUpdate): string[] => {
  const errors: string[] = [];
  if (!ticket.clientId) errors.push('Client ID is required');
  if (!ticket.productId) errors.push('Product ID is required');
  if (!ticket.issueCategory) errors.push('Issue Category is required');
  if (!ticket.issueDescription) errors.push('Issue Description is required');
  return errors;
};
