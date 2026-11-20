/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const TICKET_WORK_TYPES = [
  'Phone Call',
  'WhatsApp',
  'Google Meet Training',
  'Installation',
  'Follow-up',
  'Issue Resolution',
  'Setup',
  'Data Import',
  'Configuration',
  'Other'
];

export const TICKET_STATUS_OPTIONS = [
  'Connected',
  'Completed',
  'Pending',
  'Not Answering',
  'Rescheduled',
  'Escalated',
  'Cancelled'
];

export const TICKET_WA_TEMPLATES = [
  {
    id: 'technician_outreach',
    name: 'Technician outreach update',
    text: 'Dear customer, our techno-expert is heading to your store location shortly to configure your local POS margins. Please ensure server availability.'
  },
  {
    id: 'issue_resolution',
    name: 'Ticket resolution ping',
    text: 'Hi! The database lock issue you reported is now resolved. Please test the checkout lane and send back confirmation.'
  },
  {
    id: 'daily_health_check',
    name: 'Standard backup follow-up',
    text: 'Greetings from Techno Evident! This is a proactive check to confirm your daily backup logs were uploaded successfully.'
  },
  {
    id: 'subscription_warning',
    name: 'License renewal alarm',
    text: 'Important: Your TEDOS standard software suite license expires shortly. Please complete the subscription payment to avoid billing freezes.'
  }
];

export const getTicketStatusStyle = (status: string): string => {
  switch (status) {
    case 'New':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    case 'Assigned':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300';
    case 'In Progress':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
    case 'Waiting for Client':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
    case 'Rescheduled':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300';
    case 'Escalated':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    case 'Resolved':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
    case 'Closed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getTicketPriorityStyle = (priority: string): string => {
  switch (priority) {
    case 'Critical':
      return 'bg-red-500 text-white';
    case 'High':
      return 'bg-orange-500 text-white';
    case 'Medium':
      return 'bg-blue-500 text-white';
    case 'Low':
      return 'bg-gray-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};
