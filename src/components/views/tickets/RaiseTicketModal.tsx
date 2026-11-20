/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Ticket, SupportClient, User } from '../../../types';
import { VoiceDictationButton } from '../../common/VoiceDictationButton';
import { Ticket as TicketIcon, X, Database } from 'lucide-react';
import { motion } from 'motion/react';

interface RaiseTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: SupportClient[];
  allClients: SupportClient[];
  users: User[];
  currentUser: User | null;
  isUrdu: boolean;
  addTicket: (
    ticket: Omit<
      Ticket,
      'id' | 'createdDate' | 'updatedDate' | 'timeline' | 'workLogs' | 'followUps' | 'whatsappLogs' | 'trainingLogs' | 'attachments'
    >
  ) => Promise<Ticket> | void;
  onCreatedSuccess: (message: string) => void;
}

export const RaiseTicketModal: React.FC<RaiseTicketModalProps> = ({
  isOpen,
  onClose,
  clients,
  allClients,
  users,
  currentUser,
  isUrdu,
  addTicket,
  onCreatedSuccess
}) => {
  const [newTicketClient, setNewTicketClient] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('Technical Escalation');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');
  const [newTicketExecutive, setNewTicketExecutive] = useState(currentUser?.name || 'Umar Farooq');
  const [newTicketFrom, setNewTicketFrom] = useState(
    currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Umar Farooq (Support Executive)'
  );
  const [newTicketTo, setNewTicketTo] = useState('COO (Chief Operating Officer)');
  const [newTicketAttachmentUrl, setNewTicketAttachmentUrl] = useState('');
  const [newTicketGoogleFormUrl, setNewTicketGoogleFormUrl] = useState(() => {
    try {
      return localStorage.getItem('tedos_ticket_google_form_url') || '';
    } catch {
      return '';
    }
  });
  const [modalErrors, setModalErrors] = useState<string[]>([]);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  if (!isOpen) return null;

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];
    if (!newTicketClient) errors.push(isUrdu ? 'برائے مہربانی سپورٹ کلائنٹ منتخب کریں۔' : 'Please select a valid support client.');
    if (!newTicketCategory.trim()) errors.push(isUrdu ? 'مسئلے کی نوعیت / کیٹیگری درج کریں۔' : 'Please specify the support issue category.');
    if (!newTicketDescription.trim()) errors.push(isUrdu ? 'مسئلے کی مختصر تفصیل درج کریں۔' : 'Please enter a brief issue description.');

    if (errors.length > 0) {
      setModalErrors(errors);
      return;
    }

    setIsSubmittingTicket(true);
    setModalErrors([]);

    try {
      const clientPool = allClients && allClients.length > 0 ? allClients : clients;
      const clientObj = clientPool.find(
        c => c.id === newTicketClient || c.teId === newTicketClient || c.name === newTicketClient
      );
      const clientId = clientObj?.id || newTicketClient;
      const clientName = clientObj?.company || clientObj?.name || newTicketClient;
      const clientTeId = clientObj?.teId || clientObj?.id || 'TE-101';

      const assignedUser = users.find(u => u.name === newTicketExecutive);
      const assignedTeId =
        assignedUser?.employeeId || (currentUser?.name === newTicketExecutive ? currentUser.employeeId : clientTeId);
      const fromStr = newTicketFrom || `${currentUser?.name || 'Support Manager'} (${currentUser?.role || 'Support Manager'})`;
      const toStr = newTicketTo || 'COO (Chief Operating Officer)';
      const response1Summary = `[ULTIMATE RESPONSE 1] Raised FROM: ${fromStr} -> TO: ${toStr} | Issue: ${newTicketCategory} - ${newTicketDescription} | Attachment: ${newTicketAttachmentUrl || 'None'} | Status: Open`;

      if (newTicketGoogleFormUrl.trim()) {
        try {
          localStorage.setItem('tedos_ticket_google_form_url', newTicketGoogleFormUrl.trim());
        } catch {}
      }

      await addTicket({
        teId: assignedTeId || 'TE-101',
        clientId,
        clientName,
        issueCategory: newTicketCategory,
        issueDescription: newTicketDescription,
        priority: newTicketPriority,
        status: 'In Progress',
        assignedExecutive: newTicketExecutive,
        createdBy: currentUser?.name || 'Support Manager',
        raisedFrom: fromStr,
        raisedTo: toStr,
        attachmentUrl: newTicketAttachmentUrl.trim() || undefined,
        ultimateResponse1: response1Summary,
        googleFormUrl: newTicketGoogleFormUrl.trim() || undefined
      } as any);

      onCreatedSuccess(
        isUrdu
          ? "ٹکٹ کامیابی سے درج ہو گیا اور گوگل شیٹ 'Ticket Rase' ٹیب میں خودکار محفوظ ہو گیا!"
          : "Ticket successfully raised and synchronized to Google Sheet ('Ticket Rase') & Ultimate Control!"
      );

      setNewTicketClient('');
      setNewTicketCategory('Technical Escalation');
      setNewTicketDescription('');
      setNewTicketAttachmentUrl('');
      setNewTicketPriority('High');
      setModalErrors([]);
      onClose();
    } catch (err: any) {
      setModalErrors([err?.message || (isUrdu ? 'ٹکٹ محفوظ کرتے وقت خرابی پیش آئی۔' : 'Failed to save ticket')]);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-md-surface-container-lowest border border-md-surface-variant rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center pb-4 border-b border-md-surface-variant">
          <h2 className="text-base font-black text-md-on-surface flex items-center gap-2">
            <TicketIcon className="text-md-primary" size={18} />
            {isUrdu ? 'نیا انٹرپرائز سپورٹ ٹکٹ درج کریں' : 'Raise Enterprise Support Ticket'}
          </h2>
          <button
            onClick={() => {
              setModalErrors([]);
              onClose();
            }}
            className="p-1 rounded-full hover:bg-md-surface-variant text-md-on-surface-variant cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleCreateTicketSubmit} className="space-y-4 mt-4">
          {modalErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl space-y-1">
              {modalErrors.map((err, idx) => <p key={idx}>{err}</p>)}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-500/5 p-3.5 rounded-xl border border-blue-500/20">
            <div>
              <label className="block text-xs font-bold text-blue-600 uppercase mb-1">FROM (Ticket Raised By) *</label>
              <input
                type="text"
                required
                value={newTicketFrom}
                onChange={e => setNewTicketFrom(e.target.value)}
                placeholder="e.g. Support Manager / Executive"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-purple-600 uppercase mb-1">TO (Target Recipient / Authority) *</label>
              <select
                value={newTicketTo}
                onChange={e => setNewTicketTo(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
              >
                <option value="COO (Chief Operating Officer)">COO (Chief Operating Officer)</option>
                <option value="Operation Manager">Operation Manager</option>
                <option value="Support Manager">Support Manager</option>
                <option value="Technical Team">Technical Team</option>
                <option value="Director">Director</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">
              {isUrdu ? 'کلائنٹ ورک اسپیس منتخب کریں' : 'Target Client Workspace'}
            </label>
            <select
              value={newTicketClient}
              onChange={e => setNewTicketClient(e.target.value)}
              className="w-full bg-md-surface-container-low border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden"
            >
              <option value="">{isUrdu ? '-- کلائنٹ منتخب کریں --' : '-- Select Client Workspace --'}</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">
              Ticket Attachment Link / Screenshot URL (Synced to Ultimate Response 1)
            </label>
            <input
              type="text"
              value={newTicketAttachmentUrl}
              onChange={e => setNewTicketAttachmentUrl(e.target.value)}
              placeholder="https://drive.google.com/... or screenshot/document link..."
              className="w-full bg-md-surface-container-low border border-md-surface-variant rounded-xl px-3 py-2 text-xs font-mono"
            />
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
            <Database size={16} className="text-emerald-600 shrink-0" />
            <div className="space-y-0.5">
              <span className="font-bold block">
                {isUrdu ? "گوگل شیٹ 'Ticket Rase' ٹیب سنک" : "Ultimate Control Sheet -> Tab 'Ticket Rase' Sync"}
              </span>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                {isUrdu
                  ? "یہ ٹکٹ سافٹ ویئر کے ساتھ ساتھ آپ کی Ultimate Support Control Sheet کی 'Ticket Rase' ٹیب میں خودکار محفوظ ہو گا۔"
                  : "This ticket will automatically log to the 'Ticket Rase' tab in your Ultimate Support Control Sheet."}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-md-outline uppercase mb-1.5 flex items-center justify-between">
              <span>{isUrdu ? 'گوگل فارم لنک (ٹکٹ ریز فارم)' : 'Google Form Link (Ticket Raise Form)'}</span>
              <span className="text-[10px] text-emerald-600 font-bold font-mono">
                {newTicketGoogleFormUrl ? 'Saved & Synced' : 'Auto-Fill & Sheet Sync'}
              </span>
            </label>
            <input
              type="url"
              value={newTicketGoogleFormUrl}
              onChange={e => {
                const val = e.target.value;
                setNewTicketGoogleFormUrl(val);
                try {
                  localStorage.setItem('tedos_ticket_google_form_url', val.trim());
                } catch {}
              }}
              placeholder="https://docs.google.com/forms/d/e/.../viewform or form response URL"
              className="w-full bg-md-surface-container-low border border-md-surface-variant rounded-xl px-3 py-2 text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? 'مسئلے کی نوعیت / کیٹیگری' : 'Issue Category'}</label>
              <input
                type="text"
                placeholder={isUrdu ? 'مثال: ڈیٹا بیس تعطل، پرنٹر ایشو...' : 'e.g. Database Freeze'}
                value={newTicketCategory}
                onChange={e => setNewTicketCategory(e.target.value)}
                className="w-full bg-md-surface-container-low border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden focus:ring-1 focus:ring-md-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? 'ترجیحی درجہ' : 'Priority Level'}</label>
              <select
                value={newTicketPriority}
                onChange={e => setNewTicketPriority(e.target.value as any)}
                className="w-full bg-md-surface-container-low border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden"
              >
                <option value="Low">{isUrdu ? 'معمولی (Low)' : 'Low'}</option>
                <option value="Medium">{isUrdu ? 'درمیانی (Medium)' : 'Medium'}</option>
                <option value="High">{isUrdu ? 'زیادہ (High)' : 'High'}</option>
                <option value="Critical">{isUrdu ? 'انتہائی اہم (Critical)' : 'Critical'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">{isUrdu ? 'تفویض کردہ سپورٹ ایگزیکٹو' : 'Assign Support Executive'}</label>
            <select
              value={newTicketExecutive}
              onChange={e => setNewTicketExecutive(e.target.value)}
              className="w-full bg-md-surface-container-low border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden"
            >
              {currentUser && (
                <option value={currentUser.name}>{currentUser.name} ({currentUser.employeeId || 'Current User'})</option>
              )}
              {users
                .filter(u => u.name !== currentUser?.name)
                .map(u => <option key={u.id} value={u.name}>{u.name} ({u.employeeId || u.role})</option>)}
              {users.length === 0 && !currentUser && <option value="Support Executive">Support Executive (TE-101)</option>}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-md-outline uppercase">{isUrdu ? 'مسئلے کی تفصیلی وضاحت' : 'Detailed Issue Description'}</label>
              <VoiceDictationButton
                onTranscript={text => setNewTicketDescription(prev => (prev ? prev + ' ' + text : text))}
                defaultLang="ur-PK"
              />
            </div>
            <textarea
              placeholder={isUrdu ? 'مسئلے کی مکمل تفصیلات، سسٹم لاگ پیغامات اور متعلقہ معلومات درج کریں...' : 'Provide precise details regarding the client system failure, log alerts, hardware configuration, etc...'}
              value={newTicketDescription}
              onChange={e => setNewTicketDescription(e.target.value)}
              rows={4}
              className="w-full bg-md-surface-container-low border border-md-surface-variant rounded-xl p-3 text-xs font-medium outline-hidden resize-none focus:ring-1 focus:ring-md-primary"
            />
          </div>

          <div className="pt-2 border-t border-md-surface-variant flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-md-surface-container-high text-md-on-surface-variant hover:bg-md-surface-variant/40 py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition cursor-pointer"
            >
              {isUrdu ? 'منسوخ کریں' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmittingTicket}
              className="w-full bg-md-primary hover:bg-md-primary/95 text-md-on-primary py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmittingTicket ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isUrdu ? 'گوگل شیٹ میں محفوظ ہو رہا ہے...' : 'Syncing to Google Sheet...'}</span>
                </>
              ) : (
                <span>{isUrdu ? 'ٹکٹ درج کریں' : 'Raise Ticket'}</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
