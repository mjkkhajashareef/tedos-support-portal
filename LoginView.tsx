/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MaterialCard } from '../common/MaterialCard';
import { syncUsersWithServer } from '../../utils/userDirectory';
import { 
  Lock, 
  Mail, 
  Phone,
  Eye, 
  EyeOff, 
  LogIn, 
  ExternalLink, 
  AlertCircle, 
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Compass,
  Globe,
  Headphones
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrandLogo } from '../common/BrandLogo';
import { LanguageToggle } from '../common/LanguageToggle';
import { TRANSLATIONS } from '../../i18n/translations';

interface LoginViewProps {
  id?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ id }) => {
  const { loginWithCredentials, openDemoForModule, language } = useApp();
  const t = TRANSLATIONS[language];

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<{ en: string; ur: string } | null>(null);

  useEffect(() => {
    // Proactively sync cross-device directory from server on login view load
    syncUsersWithServer().catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage({
        en: 'Please enter your Employee ID or Email Address.',
        ur: 'برائے مہربانی اپنا ای میل یا ملازم آئی ڈی درج کریں۔'
      });
      return;
    }

    if (!password) {
      setErrorMessage({
        en: 'Please enter your password.',
        ur: 'برائے مہربانی اپنا پاس ورڈ درج کریں۔'
      });
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithCredentials(identifier.trim(), password);
      if (!res.success) {
        setErrorMessage(res.error || {
          en: 'Invalid credentials. Please verify your Email/ID and Password.',
          ur: 'غلط لاگ ان تفصیلات! برائے مہربانی درست ای میل یا ملازم آئی ڈی اور پاس ورڈ درج کریں۔'
        });
      }
    } catch (err: any) {
      setErrorMessage({
        en: err?.message || 'Authentication error. Please try again.',
        ur: 'لاگ ان کے دوران خرابی پیش آئی۔ برائے مہربانی دوبارہ کوشش کریں۔'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id={id || 'tedos-login-view'}
      className="min-h-[85vh] w-full max-w-md mx-auto my-4 sm:my-8 flex flex-col items-center justify-center px-4 animate-slide-up"
    >
      {/* Top Bar with Language Toggle & Demo Guide */}
      <div className="w-full flex items-center justify-between mb-4 flex-wrap gap-2">
        <LanguageToggle />

        <div className="flex items-center gap-2">
          {/* Demo Guide Button on Login Screen */}
          <button
            type="button"
            onClick={() => openDemoForModule()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-600/20 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-600/20 transition-all select-none shadow-sm cursor-pointer"
            title={language === 'ur' ? 'سافٹ ویئر ڈیمو و استعمال کی گائیڈ' : 'Software Tour & Demo'}
          >
            <Compass size={14} className="text-blue-600 dark:text-blue-400 animate-spin-slow" />
            <span>{language === 'ur' ? 'سافٹ ویئر گائیڈ' : 'Demo Tour'}</span>
          </button>
        </div>
      </div>

      {/* Brand Header */}
      <div className="text-center mb-6 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="p-3 bg-white dark:bg-slate-900 rounded-3xl shadow-md border border-slate-200 dark:border-slate-800 mb-3"
        >
          <BrandLogo size="lg" />
        </motion.div>
        
        <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
          {language === 'ur' ? 'ٹیکنو ایویڈنٹ سیکیور پورٹل' : 'Techno Evident Operations System'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed mt-1">
          {language === 'ur' 
            ? 'اپنا ای میل / آئی ڈی اور پاس ورڈ درج کر کے لاگ ان کریں' 
            : 'Enter your credentials to access your designated workspace'}
        </p>
      </div>

      {/* Standard Email / Password Login Card */}
      <MaterialCard variant="elevated" className="w-full p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Error Banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span className="leading-snug">
                  {language === 'ur' ? errorMessage.ur : errorMessage.en}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email / Employee ID Field */}
          <div className="space-y-1.5">
            <label 
              htmlFor="tedos-login-identifier"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              {language === 'ur' ? 'ای میل یا ملازم آئی ڈی (Email / User ID)' : 'Email or Employee ID'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={16} />
              </div>
              <input
                id="tedos-login-identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={language === 'ur' ? 'اپنی ای میل یا ایمپلائی آئی ڈی درج کریں' : 'Enter your Email or Employee ID'}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-sans"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label 
                htmlFor="tedos-login-password"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                {language === 'ur' ? 'پاس ورڈ (Password)' : 'Password'}
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </div>
              <input
                id="tedos-login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-mono"
              />
              <button
                type="button"
                id="tedos-toggle-password-visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>{language === 'ur' ? 'مجھے یاد رکھیں (Remember me)' : 'Remember me'}</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="tedos-login-submit-btn"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{language === 'ur' ? 'تصدیق ہو رہی ہے...' : 'Verifying...'}</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>{language === 'ur' ? 'لاگ ان کریں (Sign In)' : 'Sign In to TEDOS'}</span>
              </>
            )}
          </button>
        </form>
      </MaterialCard>

      {/* Support & Contact Help Desk (Per specification: support@philsof.com | 9063807153) */}
      <div className="w-full mt-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
        <div className="text-center">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            {language === 'ur' ? 'مدد اور تکنیکی سپورٹ کے لیے رابطہ کریں:' : 'Need Help or Technical Support?'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <a
            href="mailto:support@philsof.com"
            className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/20 flex items-center justify-center gap-2 font-bold transition"
            title="Email Technical Support"
          >
            <Mail size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">support@philsof.com</span>
          </a>
          <a
            href="https://wa.me/919063807153?text=Hello%20Support%20Team%2C%20I%20need%20assistance%20with%20TEDOS%20login."
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center justify-center gap-2 font-bold transition"
            title="WhatsApp or Call Support"
          >
            <Phone size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>9063807153 (Call / WA)</span>
          </a>
        </div>
      </div>

      {/* Security & Version Footnote */}
      <div className="mt-5 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
        <ShieldCheck size={14} className="text-emerald-500" />
        <span>Enterprise 256-bit AES Authenticated • RBAC Protected</span>
      </div>
    </div>
  );
};
