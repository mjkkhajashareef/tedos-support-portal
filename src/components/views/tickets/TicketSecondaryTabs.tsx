/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Ticket,
  SupportClient,
  User,
  WhatsAppLogMetadata,
  TrainingLogEntry,
  TimelineEntryType
} from '../../../types';
import { MaterialCard } from '../../common/MaterialCard';
import { getLocalDateString } from '../../../utils/helpers';
import { TICKET_WA_TEMPLATES } from './ticketStyleUtils';
import {
  MessageSquareCode,
  GraduationCap,
  Paperclip,
  CheckCircle2,
  Send,
  FileCode,
  FileText,
  FileImage,
  ExternalLink
} from 'lucide-react';

interface TicketSecondaryTabsProps {
  activeTab: 'whatsapp' | 'training' | 'attachments';
  selectedTicket: Ticket;
  selectedClient?: SupportClient;
  currentUser: User | null;
  isUrdu: boolean;
  addTicketWhatsAppLog: (
    ticketId: string,
    log: Omit<WhatsAppLogMetadata, 'id' | 'timestamp' | 'status'>
  ) => void;
  addTicketTrainingLog: (ticketId: string, log: Omit<TrainingLogEntry, 'id'>) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
}

export const TicketSecondaryTabs: React.FC<TicketSecondaryTabsProps> = ({
  activeTab,
  selectedTicket,
  selectedClient,
  currentUser,
  isUrdu,
  addTicketWhatsAppLog,
  addTicketTrainingLog,
  updateTicket
}) => {
  const [waTemplate, setWaTemplate] = useState('technician_outreach');
  const [waPhone, setWaPhone] = useState(selectedClient?.phone || '');
  const [waSuccess, setWaSuccess] = useState(false);

  const [tTopic, setTTopic] = useState('POS Checkout Operations');
  const [tDuration, setTDuration] = useState<number>(20);
  const [tAttendees, setTAttendees] = useState<number>(2);
  const [tNotes, setTNotes] = useState('');
  const [tSuccess, setTSuccess] = useState(false);

  const [attSuccess, setAttSuccess] = useState(false);

  useEffect(() => {
    setWaSuccess(false);
    setTSuccess(false);
    setAttSuccess(false);
    if (selectedClient) setWaPhone(selectedClient.phone);
  }, [selectedTicket.id, selectedClient]);

  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waPhone.trim()) return;
    const matchedTemp = TICKET_WA_TEMPLATES.find(t => t.id === waTemplate);
    if (!matchedTemp) return;
    addTicketWhatsAppLog(selectedTicket.id, {
      templateId: waTemplate,
      templateName: matchedTemp.name,
      recipientPhone: waPhone,
      text: matchedTemp.text
    });
    setWaSuccess(true);
    setTimeout(() => setWaSuccess(false), 3000);
  };

  const handleTrainingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTopic.trim()) return;
    addTicketTrainingLog(selectedTicket.id, {
      topic: tTopic,
      date: getLocalDateString(),
      durationMinutes: tDuration,
      attendeesCount: tAttendees,
      conductedBy: currentUser?.name || 'Support Executive',
      notes: tNotes || 'Conducted standard checkout suite guide session'
    });
    setTNotes('');
    setTSuccess(true);
    setTimeout(() => setTSuccess(false), 3000);
  };

  const handleMockAttachmentUpload = (type: 'log' | 'pdf' | 'img') => {
    const execNameFallback = currentUser?.name || 'Support Executive';
    let mockFile = {
      id: `att-${Date.now()}`,
      name: 'screen_diagnostics.txt',
      sizeBytes: 4210,
      fileType: 'Document',
      uploadedAt: new Date().toISOString(),
      uploadedBy: execNameFallback
    };
    if (type === 'pdf') {
      mockFile = {
        id: `att-${Date.now()}`,
        name: 'alignment_profile.pdf',
        sizeBytes: 154090,
        fileType: 'PDF',
        uploadedAt: new Date().toISOString(),
        uploadedBy: execNameFallback
      };
    } else if (type === 'img') {
      mockFile = {
        id: `att-${Date.now()}`,
        name: 'crash_stacktrace.png',
        sizeBytes: 824500,
        fileType: 'Image',
        uploadedAt: new Date().toISOString(),
        uploadedBy: execNameFallback
      };
    }

    const updatedTimeline = [
      ...selectedTicket.timeline,
      {
        id: `tl-${Date.now()}`,
        type: 'Assigned' as TimelineEntryType,
        timestamp: new Date().toISOString(),
        performedBy: execNameFallback,
        notes: `Attachment registered to database archive: ${mockFile.name} (${Math.round(mockFile.sizeBytes / 1024)} KB)`
      }
    ];

    updateTicket(selectedTicket.id, {
      ...selectedTicket,
      attachments: [...selectedTicket.attachments, mockFile],
      timeline: updatedTimeline,
      updatedDate: getLocalDateString()
    });
    setAttSuccess(true);
    setTimeout(() => setAttSuccess(false), 3000);
  };

  if (activeTab === 'whatsapp') {
    return (
      <MaterialCard className="p-6">
        <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-md-surface-variant/60">
            <h3 className="text-sm font-bold text-md-on-surface flex items-center gap-2">
              <MessageSquareCode size={16} className="text-md-primary" />{' '}
              {isUrdu ? 'واٹس ایپ سپورٹ ٹیمپلیٹس' : 'WhatsApp Outreach Templates'}
            </h3>
            <span className="text-[10px] text-md-outline font-medium">
              {isUrdu ? 'ٹیکنو SOP مواصلات' : 'Techno SOP Communications'}
            </span>
          </div>

          {waSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />{' '}
              {isUrdu ? 'واٹس ایپ میسج لاگ کامیابی سے درج ہو گیا!' : 'WhatsApp Template alert registered in Ticket activity audit!'}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">
                {isUrdu ? 'وصول کنندہ کا فون نمبر' : 'Recipient Phone'}
              </label>
              <input
                type="text"
                value={waPhone}
                onChange={e => setWaPhone(e.target.value)}
                placeholder="+91..."
                className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden focus:ring-1 focus:ring-md-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">
                {isUrdu ? 'منظور شدہ ٹیمپلیٹ منتخب کریں' : 'Select Approved SOP Template'}
              </label>
              <select
                value={waTemplate}
                onChange={e => setWaTemplate(e.target.value)}
                className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden"
              >
                {TICKET_WA_TEMPLATES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 p-4 rounded-xl">
            <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block mb-1">
              {isUrdu ? 'پیغام کا متن:' : 'Approved Template SMS Body'}
            </span>
            <p className="text-xs text-md-on-surface-variant font-medium">
              {TICKET_WA_TEMPLATES.find(t => t.id === waTemplate)?.text}
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition cursor-pointer flex justify-center items-center gap-2"
          >
            <Send size={14} /> {isUrdu ? 'واٹس ایپ پیغام بھیجیں اور لاگ کریں' : 'Send Outbound Template ping'}
          </button>
        </form>
      </MaterialCard>
    );
  }

  if (activeTab === 'training') {
    return (
      <MaterialCard className="p-6">
        <form onSubmit={handleTrainingSubmit} className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-md-surface-variant/60">
            <h3 className="text-sm font-bold text-md-on-surface flex items-center gap-2">
              <GraduationCap size={16} className="text-md-primary" />{' '}
              {isUrdu ? 'کلائنٹ ٹریننگ سیشن درج کریں' : 'Register Client Training Session'}
            </h3>
            <span className="text-[10px] text-md-outline font-medium">
              {isUrdu ? 'صلاحیت اور ہیلتھ میں بہتری' : 'Improve health metrics'}
            </span>
          </div>

          {tSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />{' '}
              {isUrdu ? 'ٹریننگ سیشن کامیابی سے ٹائم لائن میں درج ہو گیا!' : 'Training Session registered in activity timeline!'}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">
                {isUrdu ? 'ٹریننگ کا موضوع' : 'Training Topic'}
              </label>
              <input
                type="text"
                value={tTopic}
                onChange={e => setTTopic(e.target.value)}
                placeholder={isUrdu ? 'مثال: بلنگ اور انوینٹری کا استعمال...' : 'e.g. Automated Backup administration'}
                className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2.5 text-xs font-medium outline-hidden focus:ring-1 focus:ring-md-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">
                  {isUrdu ? 'دورانیہ (منٹ)' : 'Duration'}
                </label>
                <input
                  type="number"
                  value={tDuration}
                  onChange={e => setTDuration(Number(e.target.value))}
                  className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2 text-xs font-medium outline-hidden focus:ring-1 focus:ring-md-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">
                  {isUrdu ? 'شرکاء کی تعداد' : 'Attendees'}
                </label>
                <input
                  type="number"
                  value={tAttendees}
                  onChange={e => setTAttendees(Number(e.target.value))}
                  className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl px-3 py-2 text-xs font-medium outline-hidden focus:ring-1 focus:ring-md-primary"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-md-outline uppercase mb-1.5">
              {isUrdu ? 'ٹریننگ نوٹس' : 'Training Notes'}
            </label>
            <textarea
              placeholder={isUrdu ? 'ٹریننگ سیشن میں کلائنٹ کو کیا سکھایا گیا؟...' : 'What features were taught during the training session?...'}
              value={tNotes}
              onChange={e => setTNotes(e.target.value)}
              rows={3}
              className="w-full bg-md-surface-container-lowest border border-md-surface-variant rounded-xl p-3 text-xs font-medium outline-hidden resize-none focus:ring-1 focus:ring-md-primary"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-md-primary hover:bg-md-primary/95 text-md-on-primary py-2.5 rounded-xl text-xs font-bold tracking-wide uppercase transition cursor-pointer flex justify-center items-center gap-2"
          >
            {isUrdu ? 'ٹریننگ لاگ محفوظ کریں' : 'Submit Training Log'}
          </button>
        </form>
      </MaterialCard>
    );
  }

  return (
    <MaterialCard className="p-6 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-md-surface-variant/60">
        <h3 className="text-sm font-bold text-md-on-surface flex items-center gap-2">
          <Paperclip size={16} className="text-md-primary" />{' '}
          {isUrdu ? 'تشخیصی فائلز و دستاویزات' : 'Diagnostic Attachments Vault'}
        </h3>
        <span className="text-[10px] text-md-outline font-medium">
          {isUrdu ? 'محفوظ اسٹوریج' : 'Enterprise secure storage'}
        </span>
      </div>

      {attSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />{' '}
          {isUrdu ? 'فائل کامیابی سے منسلک ہو گئی!' : 'Mock attachment registered to ticket audit trace!'}
        </div>
      )}

      <div className="bg-md-surface-container-lowest border border-md-surface-variant/80 p-4 rounded-2xl">
        <span className="text-[10px] font-bold text-md-outline uppercase tracking-wider block mb-2">
          {isUrdu ? 'سپورٹ فائلز اپ لوڈ کا تخمینہ:' : 'Simulate upload of support files:'}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleMockAttachmentUpload('log')}
            className="bg-md-surface-container-low hover:bg-md-surface-variant text-md-on-surface-variant border border-md-surface-variant py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <FileCode size={13} className="text-indigo-600" /> + Stacktrace.log
          </button>
          <button
            type="button"
            onClick={() => handleMockAttachmentUpload('pdf')}
            className="bg-md-surface-container-low hover:bg-md-surface-variant text-md-on-surface-variant border border-md-surface-variant py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <FileText size={13} className="text-red-600" /> + Config_Profile.pdf
          </button>
          <button
            type="button"
            onClick={() => handleMockAttachmentUpload('img')}
            className="bg-md-surface-container-low hover:bg-md-surface-variant text-md-on-surface-variant border border-md-surface-variant py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <FileImage size={13} className="text-amber-600" /> + Screen_Freeze_capture.png
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {selectedTicket.attachments.length === 0 ? (
          <div className="text-center py-6 text-xs text-md-outline font-medium bg-md-surface-container-lowest rounded-xl border border-dashed border-md-outline/20">
            {isUrdu ? 'اس ٹکٹ کے ساتھ کوئی فائل منسلک نہیں ہے۔' : 'No diagnostic attachments loaded for this ticket.'}
          </div>
        ) : (
          selectedTicket.attachments.map(att => (
            <div
              key={att.id}
              className="flex items-center justify-between p-3.5 bg-md-surface-container-lowest border border-md-surface-variant rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-md-primary-container text-md-on-primary-container">
                  {att.fileType === 'Document' ? <FileCode size={16} /> : att.fileType === 'PDF' ? <FileText size={16} /> : <FileImage size={16} />}
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-md-on-surface truncate block max-w-[200px] sm:max-w-xs">{att.name}</span>
                  <span className="text-[10px] text-md-outline block font-medium">
                    {isUrdu ? 'اپ لوڈ بذریعہ: ' : 'Uploaded by '}
                    {att.uploadedBy} • {Math.round(att.sizeBytes / 1024)} KB
                  </span>
                </div>
              </div>
              <a href="#download" onClick={e => e.preventDefault()} className="text-xs font-bold text-md-primary flex items-center gap-1 hover:underline">
                {isUrdu ? 'ڈاؤن لوڈ' : 'Download'} <ExternalLink size={12} />
              </a>
            </div>
          ))
        )}
      </div>
    </MaterialCard>
  );
};
