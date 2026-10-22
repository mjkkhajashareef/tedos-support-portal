/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Globe, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Smartphone, 
  Laptop, 
  X, 
  KeyRound, 
  Users, 
  Lock,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../../types';

export const SHARED_TEST_URL = 'https://ais-pre-m77ggeul6v5snk4pqgqrwc-519351464367.asia-southeast1.run.app';
export const DEV_TEST_URL = 'https://ais-dev-m77ggeul6v5snk4pqgqrwc-519351464367.asia-southeast1.run.app';

interface ShareTestUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareTestUrlModal: React.FC<ShareTestUrlModalProps> = ({ isOpen, onClose }) => {
  const { language, loginWithCredentials, currentUser } = useApp();
  const isUrdu = language === 'ur';

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDevLink, setCopiedDevLink] = useState(false);
  const [selectedRoleTest, setSelectedRoleTest] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyLink = async (url: string, isDev = false) => {
    try {
      await navigator.clipboard.writeText(url);
      if (isDev) {
        setCopiedDevLink(true);
        setTimeout(() => setCopiedDevLink(false), 2500);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      if (isDev) {
        setCopiedDevLink(true);
        setTimeout(() => setCopiedDevLink(false), 2500);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    }
  };

  const handleQuickLoginTest = async (email: string, roleName: string) => {
    setSelectedRoleTest(roleName);
    await loginWithCredentials(email, 'Admin@123');
    setTimeout(() => {
      setSelectedRoleTest(null);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-start justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-white/15 backdrop-blur-md">
                <Globe size={20} className="text-white animate-pulse" />
              </span>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-blue-200 block font-bold">
                  {isUrdu ? 'لائیو ٹیسٹنگ اینڈ شیئر لنک' : 'Live Software Testing & Share URL'}
                </span>
                <h3 className="text-lg sm:text-xl font-black">
                  {isUrdu ? 'براہ راست ٹیسٹنگ لنک (URL)' : 'Isolated Test URL for Reviewers'}
                </h3>
              </div>
            </div>
            <p className="text-xs text-blue-100/90 leading-relaxed max-w-md pt-1">
              {isUrdu
                ? 'یہ لنک آپ موبائل، لیپ ٹاپ یا اپنی ٹیم کے ساتھ شیئر کر سکتے ہیں۔ اس میں کوڈنگ ایڈیٹر نہیں ہوتا، اس لیے کوڈ خراب ہونے کا کوئی خطرہ نہیں!'
                : 'Share this direct URL with testers, executives, or team members. It runs pure software without code editors or IDE panes!'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0 relative z-10"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300">
          
          {/* Primary Recommended URL Box */}
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border-2 border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-blue-600" />
                {isUrdu ? 'محفوظ کلین ٹیسٹنگ لنک (تجویز کردہ):' : 'Pre-Release Safe Testing URL (Recommended):'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white font-mono">
                No Code / Clean App
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={SHARED_TEST_URL}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-800 dark:text-slate-200 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleCopyLink(SHARED_TEST_URL, false)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0 ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                }`}
              >
                {copiedLink ? <Check size={15} /> : <Copy size={15} />}
                <span>{copiedLink ? (isUrdu ? 'کاپی ہو گیا!' : 'Copied!') : (isUrdu ? 'لنک کاپی کریں' : 'Copy URL')}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Smartphone size={13} />
                <Laptop size={13} />
                {isUrdu ? 'موبائل اور کمپیوٹر دونوں پر مکمل کام کرتا ہے' : 'Works seamlessly on Mobile & Desktop'}
              </span>
              <a
                href={SHARED_TEST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
              >
                <span>{isUrdu ? 'نئی ٹیب میں کھولیں' : 'Open in New Tab'}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Safe Testing Guarantee Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-bold block">
                {isUrdu ? 'کوڈنگ میں خرابی کا کوئی خطرہ نہیں:' : 'Safe For Tomorrow’s Testing:'}
              </span>
              <p className="text-[11px]">
                {isUrdu 
                  ? 'جب آپ یہ لنک کسی کو دیں گے، تو وہ صرف تیار شدہ سافٹ ویئر استعمال کر سکے گا۔ وہاں کوئی کوڈ، ایڈیٹر یا کنسول نہیں دکھے گا، لہٰذا کوڈنگ میں کسی خرابی یا تبدیلی کا کوئی امکان نہیں۔'
                  : 'Testers and team members opening this URL get only the user interface. Source code, file editors, and build tools remain completely locked and invisible.'}
              </p>
            </div>
          </div>

          {/* Test Accounts & Credentials */}
          <div className="space-y-2">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              {isUrdu ? 'ٹیسٹنگ لاگ ان اکاؤنٹس (ڈیمو ٹیسٹ):' : 'Pre-configured Test Accounts:'}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Director */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Director / Admin</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">Full Access</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">support@philsof.com</div>
                  <div className="text-[10px] font-mono text-slate-400">Pass: Admin@123</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickLoginTest('support@philsof.com', 'Director')}
                  className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] transition cursor-pointer"
                >
                  {isUrdu ? 'بطور ڈائریکٹر ٹیسٹ' : 'Test as Director'}
                </button>
              </div>

              {/* Support Executive */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Support Executive</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">Configured Rules</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">support@technoevident.com</div>
                  <div className="text-[10px] font-mono text-slate-400">Pass: Admin@123</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickLoginTest('support@technoevident.com', 'Support Executive')}
                  className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition cursor-pointer"
                >
                  {isUrdu ? 'بطور سپورٹ ایگزیکٹو ٹیسٹ' : 'Test as Executive'}
                </button>
              </div>

              {/* COO */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">COO Operations</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">Audit & Control</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">coo@technoevident.com</div>
                  <div className="text-[10px] font-mono text-slate-400">Pass: Admin@123</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickLoginTest('coo@technoevident.com', 'COO')}
                  className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition cursor-pointer"
                >
                  {isUrdu ? 'بطور سی او او ٹیسٹ' : 'Test as COO'}
                </button>
              </div>
            </div>
          </div>

          {/* Development Endpoint Collapsible */}
          <details className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 text-[11px] border border-slate-200 dark:border-slate-800">
            <summary className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {isUrdu ? 'ڈویلپمنٹ ایڈوانس لنک (Dev URL)' : 'Secondary Development Sandbox URL'}
            </summary>
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={DEV_TEST_URL}
                className="flex-1 bg-white dark:bg-slate-900 px-2 py-1.5 rounded text-[10px] font-mono border border-slate-300 dark:border-slate-700"
              />
              <button
                type="button"
                onClick={() => handleCopyLink(DEV_TEST_URL, true)}
                className="px-2.5 py-1.5 rounded bg-slate-700 hover:bg-slate-800 text-white text-[10px] font-bold"
              >
                {copiedDevLink ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </details>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {isUrdu ? 'کل کے ٹیسٹ کے لیے یہ لنک بالکل تیار ہے' : 'Ready for tomorrow’s live product testing.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold text-xs text-slate-800 dark:text-slate-200 transition cursor-pointer"
          >
            {isUrdu ? 'بند کریں' : 'Close'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
