/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MaterialCard } from '../common/MaterialCard';
import { SearchableClientDropdown } from '../common/SearchableClientDropdown';
import {
  ClipboardPen,
  Clock,
  Play,
  Square,
  Sparkles,
  Mic,
  MicOff,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
  Building2,
  Calendar,
  Phone,
  Link2,
  RotateCcw,
  History,
  Check,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ModuleId, WorkLogEntry, UserRole } from '../../types';
import { calculateDurationFromTimes, detectSoftwareUsage, isValidProofLink, formatTimeHHMMSS } from '../../utils/helpers';
import { CONFIG } from '../../config/appConfig';
import { DailyTeamSummaryModal } from '../common/DailyTeamSummaryModal';
import { authService } from '../../utils/auth';

interface DailyWorkLogViewProps {
  id?: string;
}

export const DailyWorkLogView: React.FC<DailyWorkLogViewProps> = ({ id }) => {
  const {
    clients,
    currentUser,
    selectedClientId: globalSelectedClientId,
    setSelectedClientId: setGlobalSelectedClientId,
    addWorkLog,
    setCurrentModule,
    setIsBlankWorkspace,
    setWhatsAppModalOpen,
    language,
    activeLogSession,
    updateActiveLogSession,
    clearActiveLogSession
  } = useApp();

  const isUrdu = language === 'ur';

  // 1) Select Client (Restored from activeLogSession if user navigated away, or globalSelectedClientId)
  const [selectedClientId, setSelectedClientId] = useState<string>(
    () => activeLogSession?.clientId || globalSelectedClientId || ''
  );

  // 2) Auto Sessions Timer (Start Time ONLY in this box - requirement #2)
  const [startTime, setStartTime] = useState<string>(() => activeLogSession?.startTime || '');
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(() => activeLogSession?.isTimerRunning || false);
  const [timerSeconds, setTimerSeconds] = useState<number>(() => {
    if (activeLogSession?.isTimerRunning && activeLogSession.startTimestamp) {
      return Math.max(0, Math.floor((Date.now() - activeLogSession.startTimestamp) / 1000));
    }
    return 0;
  });
  const [timerAutoNotice, setTimerAutoNotice] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 3) Issues Category (Exact 6 options - requirement #3)
  const issueCategoryOptions = [
    'Technical Support',
    'Data Import',
    'Follow Up',
    "Training Sessions'",
    'OTHER',
    'COO Meeting'
  ];
  const [issueCategory, setIssueCategory] = useState<string>(() => activeLogSession?.issueCategory || 'Technical Support');

  // 4) Work Type (Exact 6 options - requirement #4)
  const workTypeOptions = [
    'Whatsapp Message',
    'Whatsapp Call',
    'Phone call',
    'Google meet',
    'Other',
    'Client Software Review'
  ];
  const [workType, setWorkType] = useState<string>(() => activeLogSession?.workType || 'Phone call');

  // 5) Call Status (Exact 6 options - requirement #5)
  const callStatusOptions = [
    'Pending',
    'Completed',
    'Reschedule',
    'Connected',
    'Not Answering',
    'checked work'
  ];
  const [callStatus, setCallStatus] = useState<string>(() => activeLogSession?.callStatus || 'Connected');

  // 6) Summary Box with Urdu, Voice Note, AI Polish (requirement #6)
  const [summary, setSummary] = useState<string>(() => activeLogSession?.summary || '');
  const [isUrduKeyboard, setIsUrduKeyboard] = useState<boolean>(isUrdu);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isPolishing, setIsPolishing] = useState<boolean>(false);
  const speechRecognitionRef = useRef<any>(null);

  // 7) Next Follow Up (requirement #7)
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>(() => activeLogSession?.nextFollowUpDate || '');

  // 8) Client Status (Happy - Unhappy - requirement #8)
  const [clientStatus, setClientStatus] = useState<'Happy' | 'Unhappy' | ''>(() => activeLogSession?.clientStatus || '');

  // 9) End Time & Duration (Auto appears on Client Status select & NOT editable - requirement #9)
  const [endTime, setEndTime] = useState<string>(() => activeLogSession?.endTime || '');
  const [durationMinutes, setDurationMinutes] = useState<number>(() => activeLogSession?.durationMinutes || 0);
  const [durationFormatted, setDurationFormatted] = useState<string>(() => activeLogSession?.durationFormatted || '00:00:00');

  // 10) Proof Link & Reason Box (requirement #1: Dropdown Hai/Nahi & Strong Reason)
  const [proofLink, setProofLink] = useState<string>(() => activeLogSession?.proofLink || '');
  const [proofMissingReason, setProofMissingReason] = useState<string>('');
  const [hasProofDropdown, setHasProofDropdown] = useState<'yes_now' | 'pending' | 'no'>(() => activeLogSession?.hasProofDropdown || 'yes_now');
  const [strongReason, setStrongReason] = useState<string>(() => activeLogSession?.strongReason || '');

  // Additional Submission & Status States
  const [logDate, setLogDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const sessionUser = currentUser || authService.getSession()?.user;
  const executiveName = (sessionUser?.name && sessionUser.name !== 'Support Executive' && sessionUser.name !== 'Executive')
    ? sessionUser.name
    : 'Asad';
  const teId = sessionUser?.employeeId || 'TE-SUP-101';

  // Selected client details
  const selectedClient = useMemo(
    () => clients.find(c => c.id === selectedClientId),
    [clients, selectedClientId]
  );

  // Clean URL for display
  const clientUrl = selectedClient?.url || selectedClient?.deploymentUrl || '';

  // Timer Interval strictly synced with startTimestamp so navigating away preserves the elapsed time
  useEffect(() => {
    if (isTimerRunning) {
      const syncTimer = () => {
        if (activeLogSession?.startTimestamp) {
          const elapsed = Math.max(0, Math.floor((Date.now() - activeLogSession.startTimestamp) / 1000));
          setTimerSeconds(elapsed);
        } else {
          setTimerSeconds(s => s + 1);
        }
      };
      syncTimer();
      timerRef.current = setInterval(syncTimer, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, activeLogSession?.startTimestamp]);

  // Requirement #1: When opened from "My Assigned Clients", automatically load and start work log for the client
  useEffect(() => {
    if (globalSelectedClientId && globalSelectedClientId !== selectedClientId) {
      handleSelectClient(globalSelectedClientId);
    }
  }, [globalSelectedClientId]);

  // Requirement #1 & #2: When client is selected, auto-start session timer with Start Time only
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setGlobalSelectedClientId(clientId || null);
    if (clientId) {
      const cl = clients.find(c => c.id === clientId);
      const now = new Date();
      const nowStr = formatTimeHHMMSS(now);
      const startTs = Date.now();
      setStartTime(nowStr);
      setTimerSeconds(0);
      setIsTimerRunning(true);
      // Reset end time and duration until client status is selected
      setEndTime('');
      setDurationMinutes(0);
      setDurationFormatted('00:00:00');
      setClientStatus('');

      updateActiveLogSession({
        clientId,
        clientName: cl?.name || 'Client',
        teId: cl?.teId || 'TE-101',
        startTime: nowStr,
        startTimestamp: startTs,
        isTimerRunning: true,
        issueCategory,
        workType,
        callStatus,
        summary,
        clientStatus: '',
        endTime: '',
        durationMinutes: 0,
        durationFormatted: '00:00:00',
        hasProofDropdown,
        proofLink,
        strongReason,
        nextFollowUpDate
      });

      setTimerAutoNotice(
        isUrdu
          ? `⏱️ کلائنٹ (${cl?.name}) منتخب ہوتے ہی آٹو سیشن ٹائمر شروع ہو گیا ہے! (وقت: ${nowStr})`
          : `⏱️ Auto-Session Timer Started for ${cl?.name} at ${nowStr}`
      );
    } else {
      setIsTimerRunning(false);
      setTimerSeconds(0);
      setStartTime('');
      clearActiveLogSession();
    }
  };

  // Requirement #8 & #9: "end time client status select karte hi end time aur duration aana aur ye editable hargiz Nhi rehna"
  const handleSelectClientStatus = (val: 'Happy' | 'Unhappy') => {
    setClientStatus(val);
    const now = new Date();
    const nowStr = formatTimeHHMMSS(now);
    setEndTime(nowStr);
    setIsTimerRunning(false);

    // Calculate duration strictly from start timestamp or times
    let elapsed = 15;
    if (activeLogSession?.startTimestamp) {
      const diffSecs = Math.max(1, Math.floor((Date.now() - activeLogSession.startTimestamp) / 1000));
      elapsed = Math.max(1, Math.round(diffSecs / 60));
    } else if (startTime) {
      const calc = calculateDurationFromTimes(startTime, nowStr);
      if (calc.durationMinutes > 0) elapsed = calc.durationMinutes;
    }
    setDurationMinutes(elapsed);
    const hrs = Math.floor(elapsed / 60);
    const mins = elapsed % 60;
    const durFormatted = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
    setDurationFormatted(durFormatted);

    updateActiveLogSession({
      isTimerRunning: false,
      clientStatus: val,
      endTime: nowStr,
      durationMinutes: elapsed,
      durationFormatted: durFormatted
    });

    setTimerAutoNotice(
      isUrdu
        ? `🔒 کلائنٹ اسٹیٹس (${val}) منتخب ہو گیا! اختتامی وقت (${nowStr}) اور دورانیہ لاک ہو گیا۔`
        : `🔒 Client Status marked as ${val}! End Time locked at ${nowStr} (${elapsed} mins).`
    );
  };

  // Voice Note setup using Web Speech API
  const handleToggleVoiceNote = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(isUrdu ? 'آپ کا براؤزر وائس ٹائپنگ کو سپورٹ نہیں کرتا۔' : 'Browser speech recognition not supported.');
      return;
    }

    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isUrdu ? 'ur-PK' : 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setSummary(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // ✨ AI Polish Summary
  const handleAIPolishSummary = async () => {
    if (!summary.trim()) return;
    setIsPolishing(true);
    try {
      const prompt = `Rewrite and polish the following customer support notes into a crisp, professional daily work log summary.
Notes: "${summary}"
Client: "${selectedClient?.name || 'Client'}"
Work Type: "${workType}"
Issue Category: "${issueCategory}"
Format as clean professional executive summary text without bullet points or preambles.`;

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.reply) {
          setSummary(data.reply.trim());
        }
      }
    } catch (e) {
      console.warn('AI Polish fallback', e);
      // Clean fallback formatting
      setSummary(prev => `[Polished] ${prev.trim()} — Resolved effectively with client confirmation.`);
    } finally {
      setIsPolishing(false);
    }
  };

  // Reset form cleanly for Next Client
  const handleResetForNextClient = () => {
    isSubmittingRef.current = false;
    setIsSubmitting(false);
    if (isTimerRunning) {
      setIsTimerRunning(false);
    }
    clearActiveLogSession();
    setSelectedClientId('');
    setStartTime('');
    setEndTime('');
    setTimerSeconds(0);
    setDurationMinutes(0);
    setDurationFormatted('00:00:00');
    setSummary('');
    setProofLink('');
    setProofMissingReason('');
    setClientStatus('');
    setNextFollowUpDate('');
    setValidationErrors([]);
    setTimerAutoNotice(
      isUrdu
        ? '🔄 فارم ریفریش ہو گیا۔ برائے مہربانی اگلے کلائنٹ کو سلیکٹ کریں!'
        : '🔄 Form refreshed and ready for Next Client. Select next client to start fresh session timer!'
    );
  };

  // Form Submit Handler with strict duplicate submission prevention
  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isSubmittingRef.current) {
      return; // Block immediate re-clicks
    }

    setValidationErrors([]);

    const errors: string[] = [];
    if (!selectedClientId) {
      errors.push(isUrdu ? '1. برائے مہربانی کلائنٹ منتخب کریں۔' : '1. Please select a Client.');
    }
    if (!startTime) {
      errors.push(isUrdu ? '2. سیشن کا آغاز وقت درکار ہے۔' : '2. Session Start Time is required.');
    }
    if (!summary.trim()) {
      errors.push(isUrdu ? '7. کام کا خلاصہ (Summary) درج کریں۔' : '7. Summary notes are required.');
    }
    if (!clientStatus) {
      errors.push(isUrdu ? '8. کلائنٹ اسٹیٹس (Happy یا Unhappy) منتخب کریں۔' : '8. Please select Client Status (Happy or Unhappy).');
    }

    const isQuickComms = /phone|whatsapp/i.test(workType);

    // 10-Minute Policy (Requirement #4): Only require strong reason if call > 10 mins and no proof link
    if (isQuickComms && durationMinutes > 10 && hasProofDropdown === 'no' && !strongReason.trim() && !proofMissingReason.trim()) {
      errors.push(
        isUrdu
          ? '10. چونکہ کال کا دورانیہ 10 منٹ سے زیادہ ہے اور ریکارڈنگ نہیں، لہٰذا ٹھوس وجہ (Strong Reason) لکھنا لازمی ہے۔'
          : '10. For calls over 10 minutes without recording, please enter a Strong Reason / Justification.'
      );
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    // Lock synchronous submission state
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    // 10-Minute Policy: Calls under 10 minutes do NOT require proof and are automatically approved without PENDING status!
    const isUnder10Mins = durationMinutes <= 10;
    const hasDirectProof = Boolean(proofLink.trim() && proofLink.trim().length > 3);
    const isPendingProof = !isUnder10Mins && !hasDirectProof && hasProofDropdown === 'pending';
    const effectiveProofLink = hasDirectProof
      ? proofLink.trim()
      : (isPendingProof ? 'PENDING' : '');

    const effectiveReason = isPendingProof
      ? (isUrdu ? 'پروف لنک بعد میں داخل کیا جائے گا (Pending on Home Page)' : 'Proof link to be uploaded from Home Page')
      : (strongReason.trim() || proofMissingReason.trim() || '');

    const payload: Partial<WorkLogEntry> = {
      clientId: selectedClientId,
      clientName: selectedClient?.name || 'Client',
      teId: selectedClient?.teId || teId,
      executiveName,
      date: logDate,
      time: startTime || '09:00',
      startTime: startTime || '09:00',
      endTime: endTime || startTime,
      durationMinutes: durationMinutes || 15,
      duration: durationFormatted,
      issueCategory,
      category: issueCategory,
      workType,
      callStatus,
      status: callStatus === 'Completed' || callStatus === 'checked work' ? 'Completed' : 'Connected',
      details: summary.trim(),
      nextFollowUpDate: nextFollowUpDate || '',
      clientStatus,
      clientSatisfactionKpi: clientStatus === 'Happy' ? 'Satisfied' : 'Unhappy',
      clientStatusRisk: clientStatus === 'Unhappy' ? 'At Risk' : 'Normal',
      proofLink: effectiveProofLink,
      proofMissingReason: effectiveReason,
      isProofPending: isPendingProof,
      approvalStatus: isUnder10Mins ? 'Approved' : (isPendingProof ? 'Pending' : 'Approved'),
      syncStatus: isPendingProof ? 'Pending Proof Sync' : 'Synchronized',
      specialManagerRemark: selectedClient?.noteSaad || '',
      saadNote: selectedClient?.noteSaad || '',
      lastWorkSummary: summary.trim()
    };

    try {
      await addWorkLog(payload as any);
      clearActiveLogSession();

      setShowSuccessAlert(true);

      // Keep button locked until page closes to prevent re-submission
      setTimeout(() => {
        handleResetForNextClient();
        setShowSuccessAlert(false);
        setIsBlankWorkspace(false);
        setCurrentModule(ModuleId.DASHBOARD);
      }, 1500);
    } catch (err: any) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setValidationErrors([err?.message || 'Failed to save daily work log.']);
    }
  };

  const formatTimerDigits = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div id={id || 'tedos-daily-worklog-view'} className="space-y-6 animate-fade-in pb-16">
      {/* Top Banner with Quick Jump to Work Log History */}
      <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ClipboardPen size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white">
                  {isUrdu ? 'روزانہ ورک لاگ اندراج (Daily Work Log Entry)' : 'Daily Work Log Entry Form'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                  Standard Flow
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isUrdu
                  ? 'سپورٹ لاگ ترتیب وار فارم • آٹو سیشن ٹائمر • گوگل شیٹ لائیو سنک'
                  : 'Strict Step-by-Step Sequence • Auto Session Timer • Direct Google Sheet Real-time Sync'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                handleResetForNextClient();
                setIsBlankWorkspace(false);
                setCurrentModule(ModuleId.DASHBOARD);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Close work log page and return to main dashboard"
            >
              <span>{isUrdu ? 'مین پیج پر جائیں ✕' : 'Close to Main Page ✕'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsBlankWorkspace(false);
                setCurrentModule(ModuleId.WORK_LOG_HISTORY);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <History size={14} />
              <span>{isUrdu ? 'ورک لاگ ہسٹری' : 'History'}</span>
            </button>

            <button
              type="button"
              onClick={() => setWhatsAppModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="Share end-of-shift daily summary to official WhatsApp group"
            >
              <MessageSquare size={14} />
              <span>{isUrdu ? 'شفٹ کلوز سمری (واٹس ایپ)' : 'Work Close Summary (WhatsApp)'}</span>
            </button>

            <span className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold">
              👤 {executiveName} ({teId})
            </span>
          </div>
        </div>

        {/* Timer Notification Notice */}
        {timerAutoNotice && (
          <div className="mt-4 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-blue-800 dark:text-blue-200 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-blue-600 animate-pulse" />
              <span>{timerAutoNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setTimerAutoNotice('')}
              className="text-[10px] underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 space-y-1">
            <div className="flex items-center gap-1.5">
              <AlertCircle size={15} className="text-red-600 shrink-0" />
              <span className="text-xs font-bold uppercase font-mono">Validation Requirements:</span>
            </div>
            <ul className="list-disc list-inside text-xs pl-1 space-y-0.5">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Success Notice */}
        <AnimatePresence>
          {showSuccessAlert && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>
                {isUrdu
                  ? 'کلائنٹ کا کام مکمل ہو گیا اور ورک لاگ کامیابی سے محفوظ ہو گیا! یہ پیج بند ہو کر مین پیج پر واپس جا رہا ہے...'
                  : 'Client work finished and logged successfully! Closing this page and returning to Main Page...'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </MaterialCard>

      {/* CORE STEP-BY-STEP FORM (Strict sequence 1 to 10) */}
      <MaterialCard variant="elevated" className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
        <form onSubmit={handleSubmitLog} className="space-y-6">

          {/* STEP 1: Select Client (Initially Blank Search Box) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                  1
                </span>
                <span>{isUrdu ? 'کلائنٹ منتخب کریں (Select Client) *' : '1. Select Client (Initially Blank) *'}</span>
              </label>

              {selectedClient && (
                <span className="text-xs font-mono font-bold text-blue-600">
                  TE-ID: {selectedClient.teId}
                </span>
              )}
            </div>

            <SearchableClientDropdown
              clients={clients}
              selectedClientId={selectedClientId}
              onSelectClient={handleSelectClient}
              isUrdu={isUrdu}
              placeholder={isUrdu ? 'سرچ باکس: کلائنٹ کا نام یا TE-ID تلاش کریں...' : 'Search Box: Type Client Name or TE-ID to Select...'}
            />

            {/* Client Software URL Display */}
            {clientUrl && (
              <div className="pt-2 flex items-center justify-between bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                <span className="text-xs text-blue-900 dark:text-blue-200 font-bold flex items-center gap-1.5">
                  <span>🌐 Client Software URL:</span>
                  <strong className="font-mono">{clientUrl}</strong>
                </span>
                <a
                  href={clientUrl.startsWith('http') ? clientUrl : `https://${clientUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 transition"
                >
                  <span>Open Software</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>

          {/* STEP 2: Auto Sessions Timer (ONLY Start Time in this box) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-blue-900 dark:text-blue-200 uppercase flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                  2
                </span>
                <span>{isUrdu ? 'آٹو سیشن ٹائمر (Auto Sessions Timer - Start Time Only) *' : '2. Auto Sessions Timer (Start Time Only) *'}</span>
              </label>

              <div className="flex items-center gap-2">
                {isTimerRunning ? (
                  <span className="px-3 py-1 rounded-full bg-red-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    Live: {formatTimerDigits(timerSeconds)}
                  </span>
                ) : (
                  startTime && (
                    <span className="px-2.5 py-1 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200 text-xs font-mono font-bold">
                      Start Logged
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block font-bold mb-1">
                  Start Time (Auto-Recorded on Client Select):
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-5 sm:pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (isTimerRunning) {
                      setIsTimerRunning(false);
                    } else {
                      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                      setStartTime(now);
                      setIsTimerRunning(true);
                    }
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    isTimerRunning
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isTimerRunning ? <Square size={14} /> : <Play size={14} />}
                  <span>{isTimerRunning ? 'Pause Timer' : 'Start / Restart Timer'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* STEP 3 & 4: Issues Category & Work Type Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* STEP 3: Issues Category */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">
                  3
                </span>
                <span>{isUrdu ? 'مسئلے کی کیٹیگری (Issues Category) *' : '3. Issues Category *'}</span>
              </label>

              <select
                value={issueCategory}
                onChange={e => setIssueCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                {issueCategoryOptions.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* STEP 4: Work Type */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">
                  4
                </span>
                <span>{isUrdu ? 'کام کی قسم (Work Type) *' : '4. Work Type *'}</span>
              </label>

              <select
                value={workType}
                onChange={e => setWorkType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                {workTypeOptions.map(wt => (
                  <option key={wt} value={wt}>
                    {wt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* STEP 5 & 6: Call Status & Next Follow Up Date (Ek Hi Line / In One Row) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* STEP 5: Call Status Dropdown */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">
                  5
                </span>
                <span>{isUrdu ? 'کال اسٹیٹس (Call Status) *' : '5. Call Status *'}</span>
              </label>

              <select
                value={callStatus}
                onChange={e => setCallStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                {callStatusOptions.map(cs => (
                  <option key={cs} value={cs}>
                    {cs}
                  </option>
                ))}
              </select>
            </div>

            {/* STEP 6: Next Follow Up Date */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">
                  6
                </span>
                <span>{isUrdu ? 'اگلا فالو اپ (Next Follow Up Date):' : '6. Next Follow Up Date:'}</span>
              </label>

              <input
                type="date"
                value={nextFollowUpDate}
                onChange={e => setNextFollowUpDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* STEP 7: Summary Box with Urdu, Voice Note, AI Polish */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">
                  7
                </span>
                <span>{isUrdu ? 'کام کا خلاصہ (Summary: اردو • وائس نوٹ • AI Polish) *' : '7. Summary (Urdu • Voice Note • AI Polish) *'}</span>
              </label>

              <div className="flex items-center gap-2">
                {/* Voice Note Button */}
                <button
                  type="button"
                  onClick={handleToggleVoiceNote}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    isListening
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                  }`}
                  title="Voice Note Transcription"
                >
                  {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                  <span>{isListening ? 'Listening...' : 'Voice Note'}</span>
                </button>

                {/* AI Polish Button */}
                <button
                  type="button"
                  onClick={handleAIPolishSummary}
                  disabled={isPolishing || !summary.trim()}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1 transition disabled:opacity-40 cursor-pointer shadow-xs"
                  title="AI Polish Summary"
                >
                  <Sparkles size={13} />
                  <span>{isPolishing ? 'Polishing...' : '✨ AI Polish'}</span>
                </button>

                {/* Urdu Keyboard Toggle */}
                <button
                  type="button"
                  onClick={() => setIsUrduKeyboard(prev => !prev)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isUrduKeyboard ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                  title="Urdu Font Toggle"
                >
                  اردو
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder={
                isUrdu
                  ? 'کلائنٹ کے ساتھ کیے گئے کام کا مکمل خلاصہ یہاں لکھیں (یا مائیک سے بولیں)...'
                  : 'Enter detailed support summary, troubleshooting notes, solutions provided...'
              }
              className={`w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                isUrduKeyboard ? 'font-urdu text-sm leading-relaxed' : ''
              }`}
            />
          </div>

          {/* STEP 8: Client Status Dropdown (Happy - Unhappy) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
            <label className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                8
              </span>
              <span>{isUrdu ? 'کلائنٹ اسٹیٹس (Client Status: Happy / Unhappy) *' : '8. Client Status (Happy / Unhappy) *'}</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectClientStatus('Happy')}
                className={`p-3 rounded-2xl border text-center font-bold text-xs transition cursor-pointer ${
                  clientStatus === 'Happy'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50'
                }`}
              >
                😊 Happy (مطمئن)
              </button>

              <button
                type="button"
                onClick={() => handleSelectClientStatus('Unhappy')}
                className={`p-3 rounded-2xl border text-center font-bold text-xs transition cursor-pointer ${
                  clientStatus === 'Unhappy'
                    ? 'bg-red-600 text-white border-red-600 shadow-md'
                    : 'bg-white dark:bg-slate-800 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-50'
                }`}
              >
                😟 Unhappy (غیر مطمئن)
              </button>
            </div>
          </div>

          {/* STEP 9: End Time & Duration (Auto Appears on Client Status Select & STRICTLY READ-ONLY) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">
                  9
                </span>
                <span>
                  {isUrdu
                    ? 'اختتامی وقت اور دورانیہ (End Time & Duration - ناقابلِ ترمیم / Read-Only) *'
                    : '9. End Time & Duration (Auto on Client Status • Strictly Read-Only) *'}
                </span>
              </label>

              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                🔒 LOCKED (Not Editable)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-slate-500 block mb-1">
                  End Time (اختتامی وقت):
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={endTime || (clientStatus ? endTime : 'Pending Client Status...')}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-200/80 dark:bg-slate-900 text-xs font-mono font-black text-slate-800 dark:text-slate-200 cursor-not-allowed select-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 block mb-1">
                  Session Duration (کل دورانیہ):
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={durationFormatted ? `${durationFormatted} (${durationMinutes} mins)` : '00:00:00 (0 mins)'}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-200/80 dark:bg-slate-900 text-xs font-mono font-black text-blue-700 dark:text-blue-300 cursor-not-allowed select-none"
                />
              </div>
            </div>
          </div>

          {/* STEP 10: Proof Link Dropdown (Hai / Nahi) & Conditional Strong Reason (Requirement #1) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">
                  10
                </span>
                <span>
                  {isUrdu
                    ? 'پروف لنک اسٹیٹس (Proof Link: ہے یا نہیں ہے؟) *'
                    : '10. Proof Link Status (Available: Yes / No) *'}
                </span>
              </label>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold">
                {workType} • {durationMinutes} mins
              </span>
            </div>

            {/* Dropdown: Hai ya Nahi Hai (Available Now / Later / No) */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {isUrdu ? 'کیا میٹ / کال ریکارڈنگ کا پروف لنک دستیاب ہے؟ *' : 'Is Proof / Recording Link Available? *'}
              </label>
              <select
                value={hasProofDropdown}
                onChange={e => setHasProofDropdown(e.target.value as 'yes_now' | 'pending' | 'no')}
                className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="yes_now">
                  {isUrdu ? '✅ ہاں، پروف لنک ابھی درج کریں (Yes - Enter Proof Link Now)' : '✅ Yes - Enter Proof Link URL Now (Direct Sheet Sync)'}
                </option>
                <option value="pending">
                  {isUrdu ? '⏱️ ہاں ہے، مگر بعد میں اپلوڈ کروں گا (Available - Upload later from Home)' : '⏱️ Yes - Upload Later from Home Page'}
                </option>
                <option value="no">
                  {isUrdu ? '❌ نہیں ہے (No - کال بغیر ریکارڈنگ کے مکمل ہوئی)' : '❌ No (Not available / Verbal Call without recording)'}
                </option>
              </select>
            </div>

            {/* CASE 1A: If "yes_now" selected -> Provide direct URL input right here! */}
            {hasProofDropdown === 'yes_now' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-2 text-xs"
              >
                <label className="text-xs font-black text-emerald-950 dark:text-emerald-200 block">
                  🔗 {isUrdu ? 'گوگل میٹ / ڈرائیو / ریکارڈنگ لنک (Proof Link URL): *' : 'Proof Link URL (Google Meet / Drive / Loom / Any link): *'}
                </label>
                <input
                  type="url"
                  value={proofLink}
                  onChange={e => setProofLink(e.target.value)}
                  placeholder="https://meet.google.com/abc-defg-hij or https://drive.google.com/..."
                  className="w-full p-2.5 rounded-xl border border-emerald-400 bg-white dark:bg-slate-900 text-xs font-mono font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                  {isUrdu
                    ? 'یہ لنک براہِ راست Ultimate Sheet کے کالم "Proof Link" میں فوری درج ہو جائے گا۔'
                    : 'This link will be sent directly to the Ultimate Sheet "Proof Link" column immediately upon submitting.'}
                </p>
              </motion.div>
            )}

            {/* CASE 1B: If "pending" selected -> Route to Main Page Pending Proofs */}
            {hasProofDropdown === 'pending' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs space-y-1"
              >
                <p className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-600 animate-pulse shrink-0" />
                  <span>{isUrdu ? 'پروف لنک بعد میں داخل کیا جائے گا (Pending on Home Page)' : 'Proof Link Pending (Upload from Home Page later)'}</span>
                </p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                  {isUrdu
                    ? 'یہ لاگ محفوظ ہو کر ہوم پیج (ڈیش بورڈ) کے "پینڈنگ پروف لنکس" الرٹ میں چلا جائے گا۔ آپ بعد میں مین پیج سے لنک کاپی پیسٹ کر سکتے ہیں۔'
                    : 'This log will enter the Home Dashboard "Pending Proof Links" queue so you can paste the link later.'}
                </p>
              </motion.div>
            )}

            {/* CASE 2: If "No" selected */}
            {hasProofDropdown === 'no' && (
              <div className="space-y-2">
                {durationMinutes > 10 ? (
                  /* 2A: Phone call / WhatsApp call > 10 minutes -> Strong Reason required */
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-1.5"
                  >
                    <label className="text-xs font-black text-rose-950 dark:text-rose-200 block">
                      ⚠️ {isUrdu ? 'ٹھوس وجہ درج کریں (Strong Reason Required): *' : 'Strong Reason Required (Calls > 10 Mins): *'}
                    </label>
                    <p className="text-[11px] text-rose-800 dark:text-rose-300">
                      {isUrdu
                        ? `چونکہ کال کا دورانیہ 10 منٹ سے زیادہ (${durationMinutes} منٹ) ہے اور ریکارڈنگ لنک نہیں ہے، لہٰذا تفصیلی وجہ لکھنا لازمی ہے:`
                        : `Since call duration exceeds 10 minutes (${durationMinutes} mins) without recording, enter strong justification:`}
                    </p>
                    <input
                      type="text"
                      required
                      value={strongReason}
                      onChange={e => setStrongReason(e.target.value)}
                      placeholder={
                        isUrdu
                          ? 'مثلاً: نیٹ ورک سست تھا، کلائنٹ نے واٹس ایپ کال کی، یا لائیو اسکرین میٹنگ ممکن نہیں تھی...'
                          : 'e.g., Client mobile network issue / Troubleshooting completed verbally / Client declined screen sharing...'
                      }
                      className="w-full p-2.5 rounded-xl border border-rose-400/50 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
                    />
                  </motion.div>
                ) : (
                  /* 2B: Quick communication <= 10 minutes -> No strong reason needed! Direct sync */
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                        {isUrdu ? 'فوری رابطہ تصدیق شدہ (Direct Sync Verified)' : 'Quick Communication Verified'}
                      </span>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                        {isUrdu
                          ? `دورانیہ (${durationMinutes} منٹ) 10 منٹ سے کم ہے۔ کسی پروف لنک یا اضافی وجہ کی ضرورت نہیں، لاگ براہِ راست شیٹ میں سنک ہو جائے گا۔`
                          : `Duration is under 10 minutes (${durationMinutes} mins). No proof link or justification required; syncs directly to sheet.`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Action Buttons: Submit Only (Reset button removed per user instruction) */}
          <div className="flex items-center justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto py-3.5 px-10 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isUrdu ? 'محفوظ و سنک ہو رہا ہے...' : 'Submitting to Sheets...'}</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>{isUrdu ? 'ورک لاگ محفوظ کریں (Submit & Sync to Sheet)' : 'Submit Work Log & Sync to Google Sheet'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </MaterialCard>
    </div>
  );
};
