/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Copy,
  Check,
  MessageSquare,
  ExternalLink,
  MapPin,
  Send,
  Sparkles,
  Phone,
  Building2,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { normalizeIndianPhone } from '../../utils/whatsappUtils';

export const TEDOS_GOOGLE_REVIEW_LINK = 'https://www.google.com/maps/search/?api=1&query=Techno+Evident+Software+Solutions';

export const GoogleReviewModal: React.FC = () => {
  const {
    isGoogleReviewModalOpen,
    setGoogleReviewModalOpen,
    reviewModalClient,
    googleReviewTargetClient,
    clients,
    language,
    addNotification
  } = useApp();

  const isUrdu = language === 'ur';
  const effectiveTargetClient = reviewModalClient || googleReviewTargetClient;

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [customPhone, setCustomPhone] = useState<string>('');
  const [customClientName, setCustomClientName] = useState<string>('');
  const [customMapUrl, setCustomMapUrl] = useState<string>('');
  const [reviewUrl, setReviewUrl] = useState<string>(TEDOS_GOOGLE_REVIEW_LINK);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  useEffect(() => {
    if (effectiveTargetClient) {
      setSelectedClientId(effectiveTargetClient.id);
      setCustomPhone(effectiveTargetClient.phone || '');
      setCustomClientName(effectiveTargetClient.company || effectiveTargetClient.name || '');
      const defaultMap =
        effectiveTargetClient.googleMapLink ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          effectiveTargetClient.company || effectiveTargetClient.name || 'Techno Evident'
        )}`;
      setCustomMapUrl(defaultMap);
    } else if (clients.length > 0 && !selectedClientId) {
      const first = clients[0];
      setSelectedClientId(first.id);
      setCustomPhone(first.phone || '');
      setCustomClientName(first.company || first.name || '');
      setCustomMapUrl(
        first.googleMapLink ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            first.company || first.name || 'Techno Evident'
          )}`
      );
    }
  }, [effectiveTargetClient, clients, isGoogleReviewModalOpen]);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const found = clients.find(c => c.id === clientId);
    if (found) {
      setCustomPhone(found.phone || '');
      setCustomClientName(found.name || '');
      setCustomMapUrl(
        found.googleMapLink ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            found.company || found.name || 'Techno Evident'
          )}`
      );
    }
  };

  if (!isGoogleReviewModalOpen) return null;

  const activeName = customClientName || (isUrdu ? 'محترم کلائنٹ' : 'Valued Partner');
  const activeMapLink =
    customMapUrl.trim() ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeName)}`;
  const activeReviewLink = reviewUrl.trim() || activeMapLink;

  const reviewMessageUr = `السلام علیکم *${activeName}*! 🌟\n\nامید ہے آپ کا سافٹ ویئر بہترین چل رہا ہے اور آپ ہماری سپورٹ سروس سے مطمئن ہیں۔\n\nبرائے مہربانی نیچے دیے گئے گوگل ریویو لنک پر کلک کر کے ہمیں *5 اسٹار ریٹنگ (⭐⭐⭐⭐⭐)* اور اپنی قیمتی رائے سے نوازیں:\n\n📍 *Google Review Link:*\n${activeReviewLink}\n\n🗺️ *Company Google Map:*\n${activeMapLink}\n\nآپ کے تعاون کا بے حد شکریہ!\n— *ٹیکنو ایویڈنٹ سپورٹ ٹیم (TEDOS)*`;

  const reviewMessageEn = `Hello *${activeName}*! 🌟\n\nWe hope your software operations are running smoothly and our support team resolved your queries.\n\nPlease take 30 seconds to give us a *5-Star Rating (⭐⭐⭐⭐⭐)* on Google:\n\n📍 *Google Review Link:*\n${activeReviewLink}\n\n🗺️ *Company Google Map:*\n${activeMapLink}\n\nThank you for your continued trust!\n— *Techno Evident Support Team*`;

  const activeMessage = isUrdu ? reviewMessageUr : reviewMessageEn;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(activeReviewLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(customPhone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } catch {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const normalizedPhone = normalizeIndianPhone(customPhone);
  const whatsappHref = normalizedPhone
    ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(activeMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(activeMessage)}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-md-surface border border-md-surface-variant rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Gradient Header */}
          <div className="p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <MapPin size={22} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-black tracking-tight">
                    {isUrdu ? 'گوگل میپ ریویو، واٹس ایپ اور کلائنٹ رابطہ' : 'Google Review, Client WhatsApp & Map Hub'}
                  </h2>
                  <Sparkles size={14} className="text-yellow-200 animate-pulse" />
                </div>
                <p className="text-xs text-white/90 font-medium">
                  {isUrdu
                    ? 'کلائنٹ واٹس ایپ، موبائل نمبر، کمپنی گوگل میپ لنک اور ڈائریکٹ ریویو'
                    : 'Client WhatsApp, Mobile No., Company Google Map Link & Direct Review'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setGoogleReviewModalOpen(false)}
              className="p-2 rounded-full bg-black/15 hover:bg-black/25 text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Client Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-md-outline uppercase mb-1">
                  {isUrdu ? 'کلائنٹ منتخب کریں' : 'Select Client'}
                </label>
                <select
                  value={selectedClientId}
                  onChange={e => handleClientSelect(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-md-surface-container border border-md-surface-variant text-xs font-bold text-md-on-surface focus:outline-none focus:border-amber-500"
                >
                  <option value="">{isUrdu ? '-- کسٹم کلائنٹ --' : '-- Custom Client --'}</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-md-outline uppercase mb-1">
                  {isUrdu ? 'کلائنٹ موبائل نمبر (Mobile No.)' : 'Client Mobile No. / WhatsApp'}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="tel"
                    value={customPhone}
                    onChange={e => setCustomPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="flex-1 p-2.5 rounded-xl bg-md-surface-container border border-md-surface-variant text-xs font-mono font-bold text-md-on-surface focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    title="Copy Mobile Number"
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 cursor-pointer"
                  >
                    {copiedPhone ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                  {customPhone && (
                    <a
                      href={`tel:${customPhone}`}
                      title="Call Client Mobile"
                      className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                    >
                      <Phone size={14} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Company Google Map Link Box */}
            <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Navigation size={13} />
                  {isUrdu ? 'کمپنی گوگل میپ لنک (Company Google Map Link):' : 'Company Google Map Link:'}
                </span>
                <a
                  href={activeMapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-2xs"
                >
                  <MapPin size={12} />
                  <span>{isUrdu ? 'گوگل میپ کھولیں' : 'Open Google Map'}</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <input
                type="url"
                value={customMapUrl}
                onChange={e => setCustomMapUrl(e.target.value)}
                placeholder="https://www.google.com/maps/..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-500/30 text-xs font-mono text-slate-700 dark:text-slate-200 focus:outline-none"
              />
            </div>

            {/* Direct Review URL & Copy */}
            <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  {isUrdu ? 'ڈائریکٹ گوگل ریویو لنک:' : 'Direct Google Review Link:'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      copiedLink ? 'bg-emerald-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedLink ? (isUrdu ? 'کاپی ہو گیا!' : 'Copied!') : (isUrdu ? 'لنک کاپی کریں' : 'Copy Link')}</span>
                  </button>
                  <a
                    href={activeReviewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold shadow-2xs"
                  >
                    <span>{isUrdu ? 'ڈائریکٹ ریویو کھولیں' : 'Open Review Direct'}</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
              <input
                type="url"
                value={reviewUrl}
                onChange={e => setReviewUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/30 text-xs font-mono text-slate-700 dark:text-slate-200 focus:outline-none"
              />
            </div>

            {/* Preview Box */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-md-outline uppercase tracking-wider">
                {isUrdu ? 'واٹس ایپ ریویو میسج پریویو' : 'WhatsApp Review Request Preview'}
              </span>
              <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-md-on-surface whitespace-pre-wrap leading-relaxed font-sans max-h-32 overflow-y-auto">
                {activeMessage}
              </div>
            </div>

            {/* Action Buttons (Using native <a> tags so browser never blocks popup) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  addNotification({
                    title: isUrdu ? 'واٹس ایپ ریویو لنک بھیجا گیا' : 'WhatsApp Review Link Opened',
                    message: `${activeName} (${customPhone})`,
                    type: 'success'
                  })
                }
                className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/20"
              >
                <Send size={15} />
                <span>{isUrdu ? 'واٹس ایپ پر بھیجیں' : 'Send via WhatsApp'}</span>
              </a>

              <a
                href={activeMapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-blue-600/20"
              >
                <MapPin size={15} />
                <span>{isUrdu ? 'کمپنی گوگل میپ' : 'Company Google Map'}</span>
              </a>

              <a
                href={activeReviewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-amber-500/20"
              >
                <ExternalLink size={15} />
                <span>{isUrdu ? 'ڈائریکٹ ریویو کھولیں' : 'Open Review Direct'}</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
