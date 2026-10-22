/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MaterialCard } from '../common/MaterialCard';
import {
  Sparkles,
  MessageSquare,
  Copy,
  Check,
  Send,
  Star,
  FileText,
  MapPin,
  Building2,
  RefreshCw,
  Phone,
  Layers,
  CheckCircle2,
  Share2
} from 'lucide-react';
import {
  detectClientBrand,
  buildBrandedWhatsAppMessage,
  openWhatsAppChat,
  sendInteraktMessage,
  fetchInteraktConfig,
  InteraktConfig,
  ClientSoftwareBrand
} from '../../utils/whatsappUtils';

interface AIMessageStudioViewProps {
  id?: string;
}

const SOFTWARE_MODULES_LIST = [
  { id: 'fees', nameEn: 'Fee Collection & Vouchers', nameUr: 'فیس کلیکشن اور واؤچرز' },
  { id: 'admissions', nameEn: 'Student Admissions & Bio-data', nameUr: 'طلباء داخلہ و بائیو ڈیٹا' },
  { id: 'attendance', nameEn: 'Biometric Attendance & Leaves', nameUr: 'بائیو میٹرک حاضری اور چھٹیاں' },
  { id: 'exams', nameEn: 'Exams & Automated Report Cards', nameUr: 'امتحانات اور رزلٹ کارڈز' },
  { id: 'accounts', nameEn: 'Accounts, Cashbook & Expenses', nameUr: 'اکاؤنٹس، کیش بک اور اخراجات' },
  { id: 'letterpad', nameEn: 'Letterhead, Character Certificates & ID Cards', nameUr: 'لیٹر پیڈ، اسناد اور کارڈز پرنٹنگ' },
  { id: 'payroll', nameEn: 'Staff Payroll & Salary Slips', nameUr: 'اسٹاف تنخواہ و پے رول سلپس' },
  { id: 'sms_whatsapp', nameEn: 'SMS & WhatsApp Broadcast Alerts', nameUr: 'ایس ایم ایس اور واٹس ایپ الرٹس' }
];

export const AIMessageStudioView: React.FC<AIMessageStudioViewProps> = ({ id }) => {
  const { clients, currentUser, language } = useApp();
  const isUrdu = language === 'ur';

  const [selectedClientId, setSelectedClientId] = useState<string>(() => clients[0]?.id || '');
  const [selectedModules, setSelectedModules] = useState<string[]>(['fees', 'admissions']);
  const [messageType, setMessageType] = useState<'review_feedback' | 'letterpad' | 'whatsapp_checkin' | 'map_only'>('review_feedback');
  const [generatedText, setGeneratedText] = useState<string>('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');

  const activeClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || clients[0] || null;
  }, [clients, selectedClientId]);

  const clientBrand: ClientSoftwareBrand = useMemo(() => {
    return detectClientBrand(activeClient || undefined);
  }, [activeClient]);

  const brandDisplayName = clientBrand === 'TALEEMPRO' ? 'تعلیم پرو (TaleemPro)' : clientBrand === 'EDSOF' ? 'Edsof ERP' : 'Philsof Solutions';

  // Toggle module chip
  const handleToggleModule = (modId: string) => {
    setSelectedModules(prev =>
      prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]
    );
  };

  // Build the module names string
  const getSelectedModulesString = () => {
    const list = SOFTWARE_MODULES_LIST.filter(m => selectedModules.includes(m.id));
    if (list.length === 0) return isUrdu ? 'تمام اہم ماڈیولز' : 'Core System Modules';
    return list.map(m => (isUrdu ? m.nameUr : m.nameEn)).join('، ');
  };

  // Generate standard template
  const generateBaseTemplate = (type = messageType): string => {
    const modulesStr = getSelectedModulesString();
    const mapUrl = activeClient?.googleMapLink || 'https://www.google.com/maps/search/?api=1&query=Techno+Evident+Software+Solutions';

    if (type === 'map_only') {
      return buildBrandedWhatsAppMessage({
        client: activeClient || undefined,
        type: 'review_link_only',
        executiveName: currentUser?.name || 'Support Executive',
        mapUrl
      });
    }

    if (type === 'review_feedback') {
      return buildBrandedWhatsAppMessage({
        client: activeClient || undefined,
        type: 'review_with_feedback',
        executiveName: currentUser?.name || 'Support Executive',
        pagesUsed: modulesStr,
        mapUrl
      });
    }

    if (type === 'letterpad') {
      return buildBrandedWhatsAppMessage({
        client: activeClient || undefined,
        type: 'letterpad',
        executiveName: currentUser?.name || 'Support Executive',
        customNotes: `${modulesStr} - معائنہ و ٹریننگ مکمل`
      });
    }

    return buildBrandedWhatsAppMessage({
      client: activeClient || undefined,
      type: 'support_followup',
      executiveName: currentUser?.name || 'Support Executive',
      pagesUsed: modulesStr
    });
  };

  // Initialize text on mount or when client/type changes if empty
  React.useEffect(() => {
    setGeneratedText(generateBaseTemplate(messageType));
  }, [selectedClientId, messageType, selectedModules]);

  // ✨ AI Polish via Gemini API
  const handleAIPolish = async () => {
    setIsPolishing(true);
    const modulesStr = getSelectedModulesString();
    const clientName = activeClient?.company || activeClient?.name || 'Client';

    const prompt = `You are a professional customer support communications specialist.
Generate a distinctive, fresh, polite message for a client.
Client Name: "${clientName}"
Brand/Software: "${clientBrand}"
Client Used These Pages/Modules: "${modulesStr}"
Message Type: "${messageType}"
Custom Notes: "${customInstructions || 'Customer was pleased with quick resolution'}"
Requirements:
1. If Brand is TALEEMPRO: Generate in pure, natural, respectful Urdu (Nastaleeq tone) referring to TaleemPro school management.
2. If Brand is EDSOF: Generate in professional English referring to Edsof ERP.
3. If Brand is PHILSOF: Generate in polished business English referring to Philsof Software.
4. If Type is "review_feedback": Include a unique 5-star customer review draft praising the specific modules used (${modulesStr}) followed by the Google Map link.
5. If Type is "letterpad": Format as a formal corporate inspection/feedback certificate letter suitable for official letterhead.
6. If Type is "whatsapp_checkin": Short, warm, engaging message checking in on their experience.
Return ONLY the final ready-to-send text without preambles or explanations.`;

    try {
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
          setGeneratedText(data.reply.trim());
          return;
        }
      }
      throw new Error('Fallback required');
    } catch {
      // High quality dynamic fallback variations
      const variations = [
        generateBaseTemplate(messageType),
        `${generateBaseTemplate(messageType)}\n\n✨ نوٹ: آپ کی قیمتی رائے ہماری خدمات کو مزید بہتر بنانے کے لیے بہت اہم ہے۔`,
        `محترم ${clientName}! سافٹ ویئر (${modulesStr}) کے حوالے سے آپ کی سپورٹ تسلی بخش رہی۔\n${generateBaseTemplate(messageType)}`
      ];
      setGeneratedText(variations[Math.floor(Math.random() * variations.length)]);
    } finally {
      setIsPolishing(false);
    }
  };

  const [interaktConfig, setInteraktConfig] = useState<InteraktConfig | null>(null);
  const [isSendingInterakt, setIsSendingInterakt] = useState(false);
  const [interaktAlert, setInteraktAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    fetchInteraktConfig().then(cfg => setInteraktConfig(cfg));
  }, []);

  const handleCopy = () => {
    if (!generatedText) return;
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsAppWeb = () => {
    openWhatsAppChat({
      phone: activeClient?.phone || '',
      message: generatedText
    });
  };

  const handleSendInterakt = async () => {
    if (!activeClient?.phone || !generatedText.trim()) return;
    setIsSendingInterakt(true);
    setInteraktAlert(null);

    const res = await sendInteraktMessage({
      phoneNumber: activeClient.phone,
      message: generatedText,
      clientName: activeClient.name,
      clientBrand
    });

    setIsSendingInterakt(false);

    if (res.success && res.channel === 'INTERAKT_CENTRAL_WABA') {
      setInteraktAlert({
        type: 'success',
        text: `پیغام مرکزی سرکاری واٹس ایپ نمبر (${res.senderNumber || interaktConfig?.senderNumber}) سے کامیابی سے ڈیلیور ہو گیا!`
      });
      setTimeout(() => setInteraktAlert(null), 6000);
    } else {
      if (res.fallbackUrl) {
        window.open(res.fallbackUrl, '_blank', 'noopener,noreferrer');
      } else {
        openWhatsAppChat({ phone: activeClient.phone, message: generatedText });
      }
      setInteraktAlert({
        type: 'success',
        text: 'واٹس ایپ چیٹ ونڈو کھول دی گئی ہے۔'
      });
      setTimeout(() => setInteraktAlert(null), 4000);
    }
  };

  return (
    <div id={id || 'tedos-ai-message-studio'} className="space-y-6 animate-fade-in pb-16">
      {/* Header Banner */}
      <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white">
                  {isUrdu ? 'اے آئی پالش اور ریڈی میڈ پیغامات (AI Polish & Ready Messages)' : 'AI Polish & Branded Message Studio'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                  {clientBrand}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isUrdu
                  ? 'تعلیم پرو (اردو) • ایڈسوف (انگلش) • فل سوف • گوگل میپ 5-اسٹار ریویو • لیٹر پیڈ و واٹس ایپ پیغامات'
                  : 'TaleemPro (Urdu) • Edsof (English) • Philsof • Google Maps 5-Star Reviews • Letterhead & WhatsApp'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAIPolish}
              disabled={isPolishing}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black flex items-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <Sparkles size={14} className={isPolishing ? 'animate-spin' : ''} />
              <span>{isPolishing ? (isUrdu ? 'نیا مضمون تیار ہو رہا ہے...' : 'AI Polishing...') : (isUrdu ? '✨ نیا مضمون تیار کریں' : '✨ AI Polish / New Draft')}</span>
            </button>
          </div>
        </div>
      </MaterialCard>

      {/* Main Grid: Controls on Left / Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Client & Config */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Client Picker */}
          <MaterialCard variant="elevated" className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase flex items-center gap-2">
              <Building2 size={14} className="text-purple-600" />
              <span>{isUrdu ? '1. کلائنٹ کا انتخاب کریں:' : '1. Select Client:'}</span>
            </label>

            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.company || c.name} ({c.teId || c.id}) — {c.department || 'TaleemPro'}
                </option>
              ))}
            </select>

            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-purple-900 dark:text-purple-200 block">
                  {brandDisplayName}
                </span>
                <span className="text-[10px] text-purple-700 dark:text-purple-300">
                  {clientBrand === 'TALEEMPRO' ? 'اردو زبان میں خودکار میسج' : 'Standard English format'}
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400">
                📞 {activeClient?.phone || 'No Phone'}
              </span>
            </div>
          </MaterialCard>

          {/* 2. Message Category Tabs */}
          <MaterialCard variant="elevated" className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase flex items-center gap-2">
              <MessageSquare size={14} className="text-blue-600" />
              <span>{isUrdu ? '2. پیغام کی قسم منتخب کریں:' : '2. Message Category:'}</span>
            </label>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setMessageType('map_only')}
                className={`p-3 rounded-2xl border text-center font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                  messageType === 'map_only'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <MapPin size={16} />
                <span>{isUrdu ? 'صرف گوگل میپ لنک' : 'Map Link Only'}</span>
                <span className="text-[9px] opacity-80">{isUrdu ? 'ڈیفالٹ دوستانہ دعوت' : 'Direct Invitation'}</span>
              </button>

              <button
                type="button"
                onClick={() => setMessageType('review_feedback')}
                className={`p-3 rounded-2xl border text-center font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                  messageType === 'review_feedback'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Star size={16} />
                <span>{isUrdu ? '5-اسٹار ریویو ڈرافٹ' : '5-Star Review Draft'}</span>
                <span className="text-[9px] opacity-80">{isUrdu ? 'ماڈیولز کے مطابق ریویو' : 'Customised on Modules'}</span>
              </button>

              <button
                type="button"
                onClick={() => setMessageType('whatsapp_checkin')}
                className={`p-3 rounded-2xl border text-center font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                  messageType === 'whatsapp_checkin'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Share2 size={16} />
                <span>{isUrdu ? 'واٹس ایپ فالو اپ' : 'WhatsApp Check-in'}</span>
                <span className="text-[9px] opacity-80">{isUrdu ? 'سپورٹ رابطہ میسج' : 'Support Follow-up'}</span>
              </button>

              <button
                type="button"
                onClick={() => setMessageType('letterpad')}
                className={`p-3 rounded-2xl border text-center font-bold transition cursor-pointer flex flex-col items-center gap-1 ${
                  messageType === 'letterpad'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <FileText size={16} />
                <span>{isUrdu ? 'لیٹر پیڈ فارمیٹ' : 'Official Letterhead'}</span>
                <span className="text-[9px] opacity-80">{isUrdu ? 'باضابطہ تصدیقی رپورٹ' : 'Formal Service Memo'}</span>
              </button>
            </div>
          </MaterialCard>

          {/* 3. Software Modules / Pages Checked by Client */}
          <MaterialCard variant="elevated" className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase flex items-center gap-2">
                <Layers size={14} className="text-indigo-600" />
                <span>{isUrdu ? '3. کلائنٹ نے کون سے پیجز استعمال کیے؟' : '3. Software Pages Used by Client:'}</span>
              </label>
              <span className="text-[10px] text-slate-500 font-bold">
                {selectedModules.length} {isUrdu ? 'منتخب' : 'Selected'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SOFTWARE_MODULES_LIST.map(mod => {
                const isSelected = selectedModules.includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => handleToggleModule(mod.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 text-indigo-900 dark:text-indigo-200 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 size={13} className={isSelected ? 'text-indigo-600' : 'text-slate-300 dark:text-slate-600'} />
                    <span className="truncate">{isUrdu ? mod.nameUr : mod.nameEn}</span>
                  </button>
                );
              })}
            </div>
          </MaterialCard>
        </div>

        {/* Right Column: Generated Message Preview, AI Polish, WhatsApp Sharing */}
        <div className="lg:col-span-7 space-y-5">
          <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase">
                  {isUrdu ? 'تیار شدہ میسج کا لائیو پیش منظر (Ready Message Preview)' : 'Generated Ready Message Preview'}
                </span>
                <p className="text-[11px] text-slate-400">
                  {clientBrand === 'TALEEMPRO' ? 'Urdu Jameel Nastaleeq Typography' : 'Clean Latin Professional Font'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAIPolish}
                  disabled={isPolishing}
                  className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  title="Generate Fresh Mazmoon via Gemini AI"
                >
                  <RefreshCw size={13} className={isPolishing ? 'animate-spin' : ''} />
                  <span>{isPolishing ? '...' : isUrdu ? 'نیا انداز' : 'Regenerate'}</span>
                </button>
              </div>
            </div>

            {/* Editable Textarea for Customization */}
            <div className="flex-1 min-h-[300px]">
              <textarea
                value={generatedText}
                onChange={e => setGeneratedText(e.target.value)}
                rows={12}
                className={`w-full h-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-xs leading-relaxed ${
                  clientBrand === 'TALEEMPRO' ? 'font-urdu text-sm leading-loose' : 'font-sans'
                }`}
                placeholder="Message will appear here..."
              />
            </div>

            {/* Interakt Channel Notification Banner */}
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {isUrdu 
                    ? `مرکزی بزنس واٹس ایپ: ${interaktConfig?.senderNumber || '+92 300 0000000'} (تمام ملازمین ایک ہی نمبر سے بھیجیں گے)`
                    : `Official Business WhatsApp: ${interaktConfig?.senderNumber || '+92 300 0000000'} (Single Verified Number)`}
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-white dark:bg-slate-900 border font-mono font-bold text-slate-700 dark:text-slate-300">
                {clientBrand === 'TALEEMPRO' ? 'اردو ٹیمپلیٹ' : 'English Template'}
              </span>
            </div>

            {interaktAlert && (
              <div className={`p-3 rounded-xl font-bold text-xs flex items-center gap-2 animate-fade-in shadow-sm ${
                interaktAlert.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}>
                <CheckCircle2 size={16} />
                <span>{interaktAlert.text}</span>
              </div>
            )}

            {/* Action Buttons: Copy & WhatsApp Options */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copied ? (isUrdu ? 'کاپی ہو گیا!' : 'Copied!') : (isUrdu ? 'میسج کاپی کریں' : 'Copy Message')}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                {/* Official Interakt Business Number Send */}
                <button
                  type="button"
                  onClick={handleSendInterakt}
                  disabled={isSendingInterakt || !activeClient?.phone}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
                  title="Send from Company Central Official WhatsApp Number via Interakt API"
                >
                  {isSendingInterakt ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>
                    {isUrdu 
                      ? 'مرکزی بزنس نمبر سے بھیجیں (Interakt API)' 
                      : 'Send via Central Official Number (Interakt)'}
                  </span>
                </button>

                {/* Direct WhatsApp Web Fallback */}
                <button
                  type="button"
                  onClick={handleSendWhatsAppWeb}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
                  title="Open direct in WhatsApp Web"
                >
                  <Phone size={13} />
                  <span>{isUrdu ? 'واٹس ایپ ویب' : 'WhatsApp Web'}</span>
                </button>
              </div>
            </div>
          </MaterialCard>
        </div>
      </div>
    </div>
  );
};
