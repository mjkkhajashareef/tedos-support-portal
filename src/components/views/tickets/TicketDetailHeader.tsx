/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Ticket, SupportClient, User } from '../../../types';
import { MaterialCard } from '../../common/MaterialCard';
import { openWhatsAppChat, buildBrandedWhatsAppMessage } from '../../../utils/whatsappUtils';
import { getTicketStatusStyle, getTicketPriorityStyle } from './ticketStyleUtils';
import {
  Ticket as TicketIcon,
  Phone,
  Star,
  Globe,
  Check,
  Copy,
  ExternalLink,
  AlertCircle,
  Paperclip
} from 'lucide-react';

interface TicketDetailHeaderProps {
  selectedTicket: Ticket;
  selectedClient?: SupportClient;
  clientSoftwareUrl: string;
  currentUser: User | null;
  isUrdu: boolean;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  openGoogleReviewModal: (client?: SupportClient | null) => void;
  updateClientUrl: (identifier: string, newUrl: string, login?: string, remarks?: string) => Promise<void>;
}

export const TicketDetailHeader: React.FC<TicketDetailHeaderProps> = ({
  selectedTicket,
  selectedClient,
  clientSoftwareUrl,
  currentUser,
  isUrdu,
  updateTicket,
  openGoogleReviewModal,
  updateClientUrl
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [editingUrlInput, setEditingUrlInput] = useState('');

  return (
    <>
      <MaterialCard className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-md-surface-variant">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-md-primary-container text-md-on-primary-container">
              <TicketIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-md-on-surface">{selectedTicket.id}</h2>
                <span className="text-xs font-bold text-md-outline">|</span>
                <span className="text-xs font-mono font-bold text-md-outline uppercase bg-md-surface-container-high px-2 py-0.5 rounded">
                  {selectedTicket.teId}
                </span>
              </div>
              <p className="text-xs text-md-outline font-medium">
                {isUrdu
                  ? `تاریخ ایجاد: ${selectedTicket.createdDate} بذریعہ ${selectedTicket.createdBy}`
                  : `Created on ${selectedTicket.createdDate} by ${selectedTicket.createdBy}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-md-outline uppercase tracking-wider">
                {isUrdu ? 'اسٹیٹس:' : 'Status:'}
              </span>
              <select
                value={selectedTicket.status}
                onChange={e => {
                  const newSt = e.target.value as any;
                  const solver =
                    newSt === 'Resolved' || newSt === 'Closed'
                      ? currentUser?.name || 'Support Team'
                      : selectedTicket.solvedBy;
                  const resp1 = `[ULTIMATE RESPONSE 1] Ticket ${selectedTicket.id} | FROM: ${selectedTicket.raisedFrom || selectedTicket.createdBy} -> TO: ${selectedTicket.raisedTo || 'COO'} | Status: ${newSt}${solver ? ` | Solved By: ${solver}` : ''}`;
                  updateTicket(selectedTicket.id, { status: newSt, solvedBy: solver, ultimateResponse1: resp1 });
                }}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border border-md-surface-variant outline-hidden cursor-pointer ${getTicketStatusStyle(selectedTicket.status)}`}
              >
                <option value="New">{isUrdu ? 'نیا (New)' : 'New'}</option>
                <option value="Assigned">{isUrdu ? 'تفویض شدہ (Assigned)' : 'Assigned'}</option>
                <option value="In Progress">{isUrdu ? 'جاری ہے (In Progress)' : 'In Progress'}</option>
                <option value="Waiting for Client">{isUrdu ? 'کلائنٹ کا انتظار (Waiting for Client)' : 'Waiting for Client'}</option>
                <option value="Rescheduled">{isUrdu ? 'دوبارہ شیڈول (Rescheduled)' : 'Rescheduled'}</option>
                <option value="Escalated">{isUrdu ? 'آگے بھیجا گیا (Escalated)' : 'Escalated'}</option>
                <option value="Resolved">{isUrdu ? 'حل شدہ (Resolved)' : 'Resolved'}</option>
                <option value="Closed">{isUrdu ? 'بند (Closed)' : 'Closed'}</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-md-outline uppercase tracking-wider">
                {isUrdu ? 'ترجیح:' : 'Priority:'}
              </span>
              <select
                value={selectedTicket.priority}
                onChange={e => updateTicket(selectedTicket.id, { priority: e.target.value as any })}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border border-md-surface-variant outline-hidden cursor-pointer ${getTicketPriorityStyle(selectedTicket.priority)}`}
              >
                <option value="Low">{isUrdu ? 'معمولی (Low)' : 'Low'}</option>
                <option value="Medium">{isUrdu ? 'درمیانی (Medium)' : 'Medium'}</option>
                <option value="High">{isUrdu ? 'زیادہ (High)' : 'High'}</option>
                <option value="Critical">{isUrdu ? 'انتہائی اہم (Critical)' : 'Critical'}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-md-surface-container-lowest border border-md-surface-variant p-4 rounded-2xl">
          <div>
            <h4 className="text-[10px] font-bold text-md-outline uppercase tracking-widest mb-1">
              {isUrdu ? 'کلائنٹ ورک اسپیس معلومات' : 'CLIENT WORKSPACE TARGET'}
            </h4>
            <span className="text-sm font-bold text-md-on-surface">{selectedTicket.clientName}</span>
            <p className="text-xs text-md-outline font-medium mt-0.5">{selectedClient?.company}</p>
            {selectedClient && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                  {isUrdu ? `صحت: ${selectedClient.healthStatus}%` : `Health: ${selectedClient.healthStatus}%`}
                </span>
                <span className="text-xs font-medium text-md-outline">{selectedClient.phone}</span>

                {selectedClient.phone && (
                  <button
                    type="button"
                    onClick={() => {
                      const ticketMsg = buildBrandedWhatsAppMessage({
                        client: selectedClient,
                        type: 'ticket_alert',
                        ticketInfo: {
                          id: selectedTicket.id,
                          status: selectedTicket.status,
                          issue: selectedTicket.issueDescription || selectedTicket.title
                        }
                      });
                      openWhatsAppChat({ phone: selectedClient.phone, message: ticketMsg });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer select-none"
                    title={isUrdu ? 'واٹس ایپ پر رابطہ کریں' : 'Chat via WhatsApp'}
                  >
                    <Phone size={11} />
                    <span>WhatsApp</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => openGoogleReviewModal(selectedClient)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer select-none"
                  title={isUrdu ? 'گوگل میپس 5 اسٹار فیڈ بیک اور ریویو حاصل کریں' : 'Request 5-Star Google Maps Review'}
                >
                  <Star size={11} className="text-amber-500 fill-amber-500" />
                  <span>{isUrdu ? 'گوگل ریویو لیں' : 'Google Review'}</span>
                </button>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-md-surface-variant/60 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-md-outline uppercase tracking-wider flex items-center gap-1">
                  <Globe size={12} className="text-blue-600 dark:text-blue-400" />
                  <span>{isUrdu ? 'کلائنٹ سافٹ ویئر لنک (Software URL)' : 'Client Software Portal URL'}</span>
                </span>
                {clientSoftwareUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(clientSoftwareUrl);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedUrl ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    <span>{copiedUrl ? (isUrdu ? 'کاپی ہو گیا!' : 'Copied!') : (isUrdu ? 'لنک کاپی کریں' : 'Copy URL')}</span>
                  </button>
                )}
              </div>

              {clientSoftwareUrl ? (
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <a
                    href={clientSoftwareUrl.startsWith('http') ? clientSoftwareUrl : `https://${clientSoftwareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-between gap-2 shadow-xs transition active:scale-95"
                  >
                    <span className="truncate font-mono">{clientSoftwareUrl}</span>
                    <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold shrink-0 flex items-center gap-1">
                      <span>{isUrdu ? 'اوپن سافٹ ویئر' : 'Open Portal'}</span>
                      <ExternalLink size={11} />
                    </span>
                  </a>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-300 dark:border-amber-700/60 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-200 text-[11px] font-medium">
                    <AlertCircle size={13} className="text-amber-600 shrink-0" />
                    <span>{isUrdu ? 'اس کلائنٹ کا سافٹ ویئر لنک درج نہیں ہے۔ لنک درج کر کے محفوظ کریں:' : 'No software link found. Save software URL directly:'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="url"
                      placeholder="https://client.technoevident.com"
                      value={editingUrlInput}
                      onChange={e => setEditingUrlInput(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg px-2.5 py-1 text-xs font-mono text-md-on-surface"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const targetId = selectedClient?.id || selectedTicket.clientId || selectedTicket.clientName;
                        if (editingUrlInput.trim() && targetId) {
                          await updateClientUrl(targetId, editingUrlInput.trim());
                          setEditingUrlInput('');
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                    >
                      {isUrdu ? 'محفوظ کریں' : 'Save URL'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-md-outline uppercase tracking-widest mb-1">
              {isUrdu ? 'مسئلے کی کیٹیگری اور تفصیل' : 'TICKET FOCUS, FROM/TO & ULTIMATE RESPONSE 1'}
            </h4>
            <span className="text-sm font-bold text-md-primary">{selectedTicket.issueCategory}</span>
            <p className="text-xs text-md-outline font-medium mt-1 italic">"{selectedTicket.issueDescription}"</p>
            <div className="mt-2 pt-2 border-t border-md-surface-variant/60 space-y-1 text-[11px] font-mono">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-bold">
                  FROM: {selectedTicket.raisedFrom || selectedTicket.createdBy}
                </span>
                <span>→</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 font-bold">
                  TO: {selectedTicket.raisedTo || 'COO / Technical Team'}
                </span>
                {selectedTicket.solvedBy && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 font-bold">
                    Solved By: {selectedTicket.solvedBy}
                  </span>
                )}
              </div>
              {selectedTicket.attachmentUrl && (
                <a
                  href={selectedTicket.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline flex items-center gap-1"
                >
                  <Paperclip size={11} /> Attachment: {selectedTicket.attachmentUrl}
                </a>
              )}
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[10px] text-amber-800 dark:text-amber-300">
                <strong>Ultimate Sheet [Response 1]:</strong>{' '}
                {selectedTicket.ultimateResponse1 ||
                  `Raised by ${selectedTicket.createdBy} -> Assigned to ${selectedTicket.assignedExecutive} (${selectedTicket.status})`}
              </div>
            </div>
          </div>
        </div>
      </MaterialCard>

      <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-[11px] grid grid-cols-1 sm:grid-cols-5 gap-2">
        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <strong className="text-blue-600 block">1. + Add Work Log</strong>
          <span className="text-slate-500 text-[10px]">Record call/support duration & summary directly to Daily Work Log sheet.</span>
        </div>
        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <strong className="text-purple-600 block">2. Schedule Callback</strong>
          <span className="text-slate-500 text-[10px]">Set next follow-up date & time; auto-syncs to Follow-Up & Ultimate sheet.</span>
        </div>
        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <strong className="text-emerald-600 block">3. WhatsApp Ping</strong>
          <span className="text-slate-500 text-[10px]">Send 1-click WhatsApp template update to client & log WhatsApp KPI.</span>
        </div>
        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <strong className="text-teal-600 block">4. Training Log</strong>
          <span className="text-slate-500 text-[10px]">Record client staff training topic, duration & attendees count.</span>
        </div>
        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <strong className="text-amber-600 block">5. Attachments</strong>
          <span className="text-slate-500 text-[10px]">Attach screenshots, error logs, PDFs or Google Drive links to the ticket.</span>
        </div>
      </div>
    </>
  );
};
