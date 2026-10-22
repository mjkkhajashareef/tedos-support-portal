import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Copy,
  Check,
  MessageSquare,
  ExternalLink,
  MapPin,
  Sparkles,
  CheckCircle2,
  Phone,
  Navigation,
  Send,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  normalizeIndianPhone,
  openWhatsAppChat,
  buildBrandedWhatsAppMessage,
  sendInteraktMessage,
  fetchInteraktConfig,
  InteraktConfig,
  detectClientBrand
} from '../../utils/whatsappUtils';
import { SupportClient, ModuleId } from '../../types';
import { useApp } from '../../context/AppContext';

export const TEDOS_GOOGLE_REVIEW_LINK = 'https://www.google.com/maps/search/?api=1&query=Techno+Evident+Software+Solutions';

export interface GoogleReviewFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClient?: SupportClient | null;
  clientName?: string;
  clientPhone?: string;
  clientCompany?: string;
  clientMapLink?: string;
  language?: 'en' | 'ur';
}

const FEEDBACK_SUGGESTIONS = [
  {
    id: 'f1',
    titleUr: 'بہترین اور فوری سپورٹ',
    titleEn: 'Fast & Excellent Support',
    textEn: 'Excellent software and super fast customer support by the Techno Evident team! They resolved our issue on Google Meet within minutes. Highly recommended! ⭐⭐⭐⭐⭐',
    textUr: 'ٹیکنو ایویڈنٹ کا سافٹ ویئر اور کسٹمر سپورٹ بہت شاندار ہے! ہماری مشکل چند منٹوں میں حل کر دی گئی۔ ⭐⭐⭐⭐⭐'
  },
  {
    id: 'f2',
    titleUr: 'مکمل ٹریننگ اور رہنمائی',
    titleEn: 'Great Software Training',
    textEn: 'Very helpful training session! The support executive explained all billing, inventory, and reporting features clearly. Best ERP software experience! ⭐⭐⭐⭐⭐',
    textUr: 'بہترین ٹریننگ سیشن! سپورٹ ایگزیکٹو نے تمام فیچرز بہت آسان الفاظ میں سمجھائے۔ ⭐⭐⭐⭐⭐'
  },
  {
    id: 'f3',
    titleUr: 'قابلِ اعتماد سافٹ ویئر',
    titleEn: 'Reliable Business Software',
    textEn: 'We have been using Techno Evident software for our daily operations and it runs smoothly. Their dedicated support team is always available when needed. ⭐⭐⭐⭐⭐',
    textUr: 'ہم اپنے کاروبار کے لیے ٹیکنو ایویڈنٹ سافٹ ویئر استعمال کر رہے ہیں اور ان کی سپورٹ ٹیم ہمیشہ مدد کے لیے تیار رہتی ہے۔ ⭐⭐⭐⭐⭐'
  }
];

export const GoogleReviewFeedbackModal: React.FC<GoogleReviewFeedbackModalProps> = ({
  isOpen,
  onClose,
  defaultClient,
  clientName,
  clientPhone,
  clientCompany,
  clientMapLink,
  language: propLang
}) => {
  const { clients, language: ctxLang, setCurrentModule } = useApp();
  const language = propLang || ctxLang || 'ur';
  const isUrdu = language === 'ur';

  // Requirement #4: By default, share direct map link only without ready-made text
  const [reviewMode, setReviewMode] = useState<'link_only' | 'draft_message'>('link_only');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string>('f1');
  const [customFeedback, setCustomFeedback] = useState<string>(FEEDBACK_SUGGESTIONS[0].textEn);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [mapLinkInput, setMapLinkInput] = useState('');
  const [reviewLinkInput, setReviewLinkInput] = useState(TEDOS_GOOGLE_REVIEW_LINK);
  const [interaktConfig, setInteraktConfig] = useState<InteraktConfig | null>(null);
  const [isSendingInterakt, setIsSendingInterakt] = useState(false);
  const [interaktSuccessAlert, setInteraktSuccessAlert] = useState<string | null>(null);

  useEffect(() => {
    fetchInteraktConfig().then(cfg => setInteraktConfig(cfg));
  }, []);

  const handleSendViaInterakt = async () => {
    if (!phoneInput) return;
    setIsSendingInterakt(true);
    setInteraktSuccessAlert(null);

    const clientObj = clients.find(c => c.id === selectedClientId) || defaultClient;
    const brand = detectClientBrand(clientObj || undefined);

    const res = await sendInteraktMessage({
      phoneNumber: phoneInput,
      message: whatsappMessage,
      clientName: clientObj?.name || clientName || 'Client',
      clientBrand: brand
    });

    setIsSendingInterakt(false);

    if (res.success && res.channel === 'INTERAKT_CENTRAL_WABA') {
      setInteraktSuccessAlert(`ریویو لنک مرکزی بزنس نمبر (${res.senderNumber || interaktConfig?.senderNumber}) سے بھیج دیا گیا!`);
      setTimeout(() => setInteraktSuccessAlert(null), 5000);
    } else {
      if (res.fallbackUrl) {
        window.open(res.fallbackUrl, '_blank', 'noopener,noreferrer');
      } else {
        openWhatsAppChat({ phone: phoneInput, message: whatsappMessage });
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const targetClient =
      defaultClient ||
      clients.find(c => c.id === selectedClientId) ||
      (clientName ? clients.find(c => c.name === clientName || c.company === clientCompany) : clients[0]) ||
      null;

    if (targetClient) {
      setSelectedClientId(targetClient.id);
      setPhoneInput(targetClient.phone || clientPhone || '');
      const defaultMap =
        targetClient.googleMapLink ||
        clientMapLink ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          targetClient.company || targetClient.name || 'Techno Evident'
        )}`;
      setMapLinkInput(defaultMap);
    } else {
      setPhoneInput(clientPhone || '');
      const defaultMap =
        clientMapLink ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          clientCompany || clientName || 'Techno Evident'
        )}`;
      setMapLinkInput(defaultMap);
    }
  }, [defaultClient, clientPhone, clientCompany, clientName, clientMapLink, isOpen]);

  const handleClientSelectChange = (newId: string) => {
    setSelectedClientId(newId);
    const found = clients.find(c => c.id === newId);
    if (found) {
      setPhoneInput(found.phone || '');
      setMapLinkInput(
        found.googleMapLink ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(found.company || found.name)}`
      );
    }
  };

  if (!isOpen) return null;

  const currentClientObj = clients.find(c => c.id === selectedClientId) || defaultClient;
  const activeName =
    currentClientObj?.company ||
    currentClientObj?.name ||
    clientCompany ||
    clientName ||
    (isUrdu ? 'محترم کلائنٹ' : 'Valued Client');

  const activeMapUrl =
    mapLinkInput.trim() ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeName)}`;
  const activeReviewUrl = reviewLinkInput.trim() || activeMapUrl;

  const handleSelectSuggestion = (item: typeof FEEDBACK_SUGGESTIONS[0]) => {
    setSelectedFeedbackId(item.id);
    setCustomFeedback(item.textEn);
  };

  const handleCopyFeedbackAndLink = async () => {
    const payload = `${customFeedback}\n\n📍 Google Review Link: ${activeReviewUrl}\n🗺️ Company Google Map: ${activeMapUrl}`;
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      // fallback
    }
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCopyReviewLinkOnly = async () => {
    try {
      await navigator.clipboard.writeText(activeReviewUrl);
    } catch {
      // fallback
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(phoneInput);
    } catch {
      // fallback
    }
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const activeClientObj = clients.find(c => c.id === selectedClientId) || defaultClient || undefined;

  const whatsappMessage = reviewMode === 'link_only'
    ? buildBrandedWhatsAppMessage({
        client: activeClientObj,
        type: 'review_link_only',
        mapUrl: activeReviewUrl
      })
    : buildBrandedWhatsAppMessage({
        client: activeClientObj,
        type: 'review_with_feedback',
        mapUrl: activeReviewUrl,
        customNotes: customFeedback
      });

  const normalizedPhone = normalizeIndianPhone(phoneInput);
  const whatsappHref = normalizedPhone
    ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-zinc-900 border border-amber-500/30 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <MapPin size={22} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-black tracking-tight">
                    {isUrdu ? 'لائیو سپورٹ کے دوران کلائنٹ سے گوگل میپس پر 5-اسٹار ریویو حاصل کریں' : 'Live Client Google Maps 5-Star Review Hub'}
                  </h2>
                  <Sparkles size={14} className="text-yellow-100 animate-pulse" />
                </div>
                <p className="text-xs text-white/90 font-medium">
                  {isUrdu
                    ? `لائیو سپورٹ ٹیم کے ساتھ کلائنٹ (${activeName}) سے گوگل میپ پر 5-اسٹار ریویو اور فیڈ بیک لائیو حاصل کرنے کا سسٹم`
                    : `Get live Google Maps 5-Star Review from client (${activeName}) while on live support session`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-black/15 hover:bg-black/25 text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Mode Switcher Banner (Requirement #4: By default share map link only, without readymade messages) */}
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setReviewMode('link_only')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  reviewMode === 'link_only'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-zinc-700'
                }`}
              >
                <MapPin size={13} />
                <span>{isUrdu ? 'صرف میپ لنک شیئر کریں (ڈیفالٹ)' : 'Direct Map Link Only'}</span>
              </button>

              <button
                type="button"
                onClick={() => setReviewMode('draft_message')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  reviewMode === 'draft_message'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-zinc-700'
                }`}
              >
                <Star size={13} />
                <span>{isUrdu ? 'تیار شدہ میسج (کلائنٹ مانگے تو)' : 'Ready-made Review Draft'}</span>
              </button>
            </div>

            {/* AI Polish Studio Quick Jump */}
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-purple-600 shrink-0" />
                <span className="text-purple-900 dark:text-purple-200 font-bold">
                  {isUrdu ? 'مختلف ماڈیولز کے مطابق نیا مضمون چاہئے؟' : 'Need fresh customized feedback text?'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setCurrentModule(ModuleId.AI_MESSAGE_STUDIO);
                }}
                className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition cursor-pointer"
              >
                {isUrdu ? 'AI Polish کھولیں ✨' : 'Open AI Polish ✨'}
              </button>
            </div>
            {/* Client Selector Dropdown */}
            {clients.length > 0 && (
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                  <Users size={12} />
                  <span>{isUrdu ? 'کلائنٹ منتخب کریں (Select Client):' : 'Select Client for Review & Map:'}</span>
                </label>
                <select
                  value={selectedClientId}
                  onChange={e => handleClientSelectChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-white"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.company || c.name} ({c.teId || c.id}) — 📞 {c.phone}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Client Contact, WhatsApp & Company Google Map Bar (Req #11) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mobile No. */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    {isUrdu ? 'کلائنٹ موبائل نمبر (Mobile No.)' : 'Client Mobile No. / WhatsApp'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={e => setPhoneInput(e.target.value)}
                      placeholder="Mobile No."
                      className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                      title="Copy Mobile No."
                    >
                      {copiedPhone ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                    {phoneInput && (
                      <a
                        href={`tel:${phoneInput}`}
                        className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                        title="Call Mobile"
                      >
                        <Phone size={14} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Quick Direct WhatsApp & Map Buttons */}
                <div className="flex flex-col justify-end gap-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-500">
                    {isUrdu ? 'فوری رابطہ اور لوکیشن' : 'Direct WhatsApp & Map'}
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => openWhatsAppChat({ phone: phoneInput, message: whatsappMessage })}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <MessageSquare size={13} />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href={activeMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Navigation size={13} />
                      <span>Google Map</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Company Google Map Link Input */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 mb-1">
                  {isUrdu ? 'کمپنی گوگل میپ لنک (Company Google Map Link)' : 'Company Google Map Link'}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={mapLinkInput}
                    onChange={e => setMapLinkInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-blue-500/30 text-xs font-mono text-slate-700 dark:text-slate-200"
                  />
                  <a
                    href={activeMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    <MapPin size={12} />
                    <span>{isUrdu ? 'میپ کھولیں' : 'Open Map'}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Direct Google Review Link Bar */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Star size={14} className="text-amber-500 fill-amber-500 shrink-0" />
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    {isUrdu ? 'گوگل ریویو ڈائریکٹ لنک:' : 'Direct Google Review URL:'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyReviewLinkOnly}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                  >
                    {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedLink ? (isUrdu ? 'کاپی ہو گیا!' : 'Copied!') : (isUrdu ? 'لنک کاپی کریں' : 'Copy Link')}</span>
                  </button>
                  <a
                    href={activeReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleCopyReviewLinkOnly}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-bold flex items-center gap-1 shrink-0"
                  >
                    <span>{isUrdu ? 'ڈائریکٹ ریویو کھولیں' : 'Open Review Direct'}</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
              <input
                type="url"
                value={reviewLinkInput}
                onChange={e => setReviewLinkInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-amber-500/30 text-xs font-mono text-slate-700 dark:text-slate-200"
              />
            </div>

            {/* Ready-made Feedback Suggestions */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300">
                {isUrdu
                  ? '1. ریڈی میڈ کسٹمر فیڈ بیک منتخب کریں:'
                  : '1. Select a Ready-Made 5-Star Feedback Suggestion:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {FEEDBACK_SUGGESTIONS.map(item => {
                  const isSelected = selectedFeedbackId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                          : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-black">
                          {isUrdu ? item.titleUr : item.titleEn}
                        </span>
                        {isSelected && <CheckCircle2 size={13} className="text-amber-600 shrink-0" />}
                      </div>
                      <span className="text-[10px] opacity-75 line-clamp-2">{item.textEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editable Feedback Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                  {isUrdu ? '2. فیڈ بیک میسج:' : '2. Review Feedback Text:'}
                </label>
                <button
                  type="button"
                  onClick={handleCopyFeedbackAndLink}
                  className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                >
                  {copiedText ? <Check size={12} /> : <Copy size={12} />}
                  <span>
                    {copiedText
                      ? isUrdu
                        ? 'فیڈ بیک اور لنک کاپی ہو گیا!'
                        : 'Copied Feedback & Link!'
                      : isUrdu
                        ? 'فیڈ بیک + لنک کاپی کریں'
                        : 'Copy Feedback + Link'}
                  </span>
                </button>
              </div>
              <textarea
                rows={3}
                value={customFeedback}
                onChange={e => setCustomFeedback(e.target.value)}
                className="w-full p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {interaktSuccessAlert && (
              <div className="p-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 animate-fade-in shadow-sm">
                <CheckCircle2 size={16} />
                <span>{interaktSuccessAlert}</span>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={handleSendViaInterakt}
                disabled={isSendingInterakt || !phoneInput}
                className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-600/20 cursor-pointer"
                title="Send from verified company WhatsApp business number"
              >
                <Send size={15} />
                <span>
                  {isUrdu ? 'مرکزی نمبر (Interakt API)' : 'Official Interakt WABA'}
                </span>
              </button>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => openWhatsAppChat({ phone: phoneInput, message: whatsappMessage })}
                className="py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-300 dark:border-zinc-700"
              >
                <MessageSquare size={14} />
                <span>
                  {isUrdu ? 'واٹس ایپ ویب' : 'WhatsApp Web'}
                </span>
              </a>

              <a
                href={activeReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleCopyReviewLinkOnly}
                className="py-3 px-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-amber-500/20"
              >
                <ExternalLink size={14} />
                <span>
                  {isUrdu ? 'گوگل ریویو کھولیں' : 'Google Review'}
                </span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
