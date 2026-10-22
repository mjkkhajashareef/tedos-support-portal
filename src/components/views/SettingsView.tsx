/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ModuleId, UserRole } from '../../types';
import { MaterialCard } from '../common/MaterialCard';
import {
  ALL_CONFIGURABLE_MODULES,
  getRoleModulePermissions,
  saveRoleModulePermissions,
  DEFAULT_ROLE_MODULE_ACCESS
} from '../../utils/rbac';
import {
  Settings,
  ShieldCheck,
  CheckSquare,
  Square,
  RotateCcw,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
  Database,
  Smartphone,
  Laptop,
  AlertTriangle,
  Info,
  Sliders,
  Sparkles,
  Users,
  Search,
  Filter,
  MessageSquare,
  Key,
  PhoneCall,
  Save,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SHARED_TEST_URL, DEV_TEST_URL } from '../common/ShareTestUrlModal';
import {
  fetchInteraktConfig,
  saveInteraktConfig,
  testInteraktConnection,
  InteraktConfig,
  DEFAULT_INTERAKT_CONFIG
} from '../../utils/whatsappUtils';

interface SettingsViewProps {
  id?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ id }) => {
  const { language, currentUser } = useApp();
  const isUrdu = language === 'ur';

  // Active Tab: 'rules' | 'sheets' | 'interakt'
  const [activeTab, setActiveTab] = useState<'rules' | 'sheets' | 'interakt'>('rules');

  // Interakt Settings State
  const [interaktConfig, setInteraktConfig] = useState<InteraktConfig>(DEFAULT_INTERAKT_CONFIG);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('03001234567');
  const [isTestingInterakt, setIsTestingInterakt] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveInteraktSuccess, setSaveInteraktSuccess] = useState(false);

  useEffect(() => {
    fetchInteraktConfig().then(cfg => setInteraktConfig(cfg));
  }, []);

  // RBAC Matrix State
  const [rulesConfig, setRulesConfig] = useState<Record<UserRole, ModuleId[]>>(() => getRoleModulePermissions());
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.SUPPORT_EXECUTIVE);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // URL Copy states
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    setRulesConfig(getRoleModulePermissions());
  }, []);

  const isDirectorOrCoo = selectedRole === UserRole.DIRECTOR || selectedRole === UserRole.COO || selectedRole === UserRole.AI_ADMINISTRATOR;

  // Toggle individual module checkbox for selected role
  const handleToggleModuleCheckbox = (role: UserRole, moduleId: ModuleId) => {
    if (isDirectorOrCoo) return; // Full access immutable for Director & COO

    setRulesConfig(prev => {
      const currentList = prev[role] || [];
      const updated = currentList.includes(moduleId)
        ? currentList.filter(id => id !== moduleId)
        : [...currentList, moduleId];

      return {
        ...prev,
        [role]: updated
      };
    });
  };

  // Select all modules for current role
  const handleSelectAll = (role: UserRole) => {
    if (isDirectorOrCoo) return;
    setRulesConfig(prev => ({
      ...prev,
      [role]: ALL_CONFIGURABLE_MODULES.map(m => m.id)
    }));
  };

  // Deselect all modules for current role
  const handleDeselectAll = (role: UserRole) => {
    if (isDirectorOrCoo) return;
    // Always keep Dashboard at minimum so they have a landing page
    setRulesConfig(prev => ({
      ...prev,
      [role]: [ModuleId.DASHBOARD]
    }));
  };

  // Reset to system defaults
  const handleResetDefaults = (role: UserRole) => {
    if (isDirectorOrCoo) return;
    setRulesConfig(prev => ({
      ...prev,
      [role]: DEFAULT_ROLE_MODULE_ACCESS[role] || [ModuleId.DASHBOARD]
    }));
  };

  // Save rules permanently
  const handleSaveRules = () => {
    saveRoleModulePermissions(rulesConfig);
    setSaveSuccessNotice(true);
    setTimeout(() => {
      setSaveSuccessNotice(false);
    }, 3500);
  };

  const handleCopyTestUrl = async () => {
    try {
      await navigator.clipboard.writeText(SHARED_TEST_URL);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  const handleSaveInterakt = async () => {
    await saveInteraktConfig(interaktConfig);
    setSaveInteraktSuccess(true);
    setTimeout(() => setSaveInteraktSuccess(false), 3000);
  };

  const handleTestInterakt = async () => {
    setIsTestingInterakt(true);
    setTestResult(null);
    const res = await testInteraktConnection(interaktConfig.apiKey, testPhoneNumber);
    setIsTestingInterakt(false);
    setTestResult({
      success: res.success,
      message: res.message
    });
  };

  // Categories list
  const categories = ['ALL', ...Array.from(new Set(ALL_CONFIGURABLE_MODULES.map(m => m.category)))];

  // Filter modules
  const currentRoleAllowed = rulesConfig[selectedRole] || [];
  const filteredModules = ALL_CONFIGURABLE_MODULES.filter(mod => {
    const q = searchFilter.toLowerCase().trim();
    const matchesSearch = 
      !q || 
      mod.labelEn.toLowerCase().includes(q) || 
      mod.labelUr.includes(q) || 
      mod.id.toLowerCase().includes(q) ||
      mod.category.toLowerCase().includes(q);

    const matchesCategory = categoryFilter === 'ALL' || mod.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id={id || 'settings-view'} className="space-y-6 max-w-6xl mx-auto pb-16 animate-slide-up">
      
      {/* Settings Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {isUrdu ? 'سسٹم سیٹنگز و رول مینیجمنٹ' : 'System Settings & Role Management'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isUrdu 
                ? 'ہر رول کے لیے ماڈیول چیک باکسز کے ذریعے اختیارات کا تعین کریں۔' 
                : 'Configure individual module authority checkboxes for roles & inspect Google Sheets synchronization.'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-none text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'rules'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck size={16} />
          <span>{isUrdu ? 'رول مینیجمنٹ (ماڈیول چیک باکسز)' : 'Rule Management (Module Checkboxes)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sheets')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'sheets'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Database size={16} />
          <span>{isUrdu ? 'گوگل شیٹس و ڈیٹا بیس سنک' : 'Google Sheets & Database'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('interakt')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'interakt'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare size={16} />
          <span>{isUrdu ? 'انٹریکٹ واٹس ایپ (ایک مرکزی کمپنی نمبر)' : 'Interakt WhatsApp (Central Number)'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ROLE MANAGEMENT WITH MODULE-BY-MODULE CHECKBOXES                  */}
      {/* ========================================================================= */}
      {activeTab === 'rules' && (
        <div className="space-y-6">

          {/* Policy Banner */}
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
            <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <span className="font-bold block">
                {isUrdu ? 'ماڈیول سلیکٹ چیک باکسز کی تفصیلی رہنمائی:' : 'Module Authority Checkbox Instructions:'}
              </span>
              <p>
                {isUrdu
                  ? 'یہاں جس جس ماڈیول پر آپ چیک باکس (✓) لگائیں گے، اس رول کے ملازمین کو مین پیج کے فوری لنکس (Quick Links) اور سائیڈبار مینو میں صرف وہی ماڈیول نظر آئیں گے۔ اگر کسی ماڈیول کا چیک باکس ان چیک کر دیں تو اس کی رسائی بند ہو جائے گی۔ تبدیلیاں کرنے کے بعد "اصول محفوظ کریں" کا بٹن دبائیں۔'
                  : 'Check the box (✓) next to each module you wish to authorize for this role. Authorized modules automatically appear on the Home page Quick Links and navigation. Unchecked modules are strictly hidden. Click "Save Access Rules" to apply changes immediately.'}
              </p>
            </div>
          </div>

          {/* Success Save Banner */}
          <AnimatePresence>
            {saveSuccessNotice && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 font-bold text-xs flex items-center gap-3 shadow-md"
              >
                <CheckCircle2 size={20} className="text-emerald-600" />
                <span>
                  {isUrdu
                    ? 'اصول اور اختیارات کامیابی سے محفوظ ہو گئے ہیں! مین پیج کے کوئیک لنکس اور مینو فوری اپ ڈیٹ ہو چکے ہیں۔'
                    : 'Access rules saved successfully! Home page Quick Links and application menus updated immediately.'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Role Picker Card */}
          <MaterialCard variant="elevated" className="p-5 border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                {isUrdu ? '1. وہ کردار منتخب کریں جس کے ماڈیول اختیارات تبدیل کرنے ہیں:' : '1. Select Role to Configure Module Authority:'}
              </span>

              <div className="flex flex-wrap gap-2">
                {[
                  UserRole.SUPPORT_EXECUTIVE,
                  UserRole.SUPPORT_MANAGER,
                  UserRole.OPERATION_MANAGER,
                  UserRole.TECHNICAL_TEAM,
                  UserRole.MARKETING_EXECUTIVE,
                  UserRole.FRANCHISE_COORDINATOR,
                  UserRole.FINANCE,
                  UserRole.COO,
                  UserRole.DIRECTOR
                ].map((role) => {
                  const isSelected = selectedRole === role;
                  const allowedCount = isDirectorOrCoo && (role === UserRole.DIRECTOR || role === UserRole.COO) 
                    ? ALL_CONFIGURABLE_MODULES.length 
                    : (rulesConfig[role] || []).length;

                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-102'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{role}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {allowedCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Role Summary & Fast Controls */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {isUrdu ? `منتخب کردہ رول: ${selectedRole}` : `Active Role: ${selectedRole}`}
                </span>
                {isDirectorOrCoo ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                    {isUrdu ? 'مکمل رسائی (غیر محدود)' : 'Unrestricted Full Access'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                    {isUrdu 
                      ? `${currentRoleAllowed.length} ماڈیولز منتخب ہیں` 
                      : `${currentRoleAllowed.length} of ${ALL_CONFIGURABLE_MODULES.length} Modules Checked`}
                  </span>
                )}
              </div>

              {!isDirectorOrCoo && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(selectedRole)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckSquare size={14} className="text-blue-600" />
                    <span>{isUrdu ? 'تمام منتخب کریں' : 'Check All'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeselectAll(selectedRole)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Square size={14} className="text-slate-400" />
                    <span>{isUrdu ? 'تمام ان چیک کریں' : 'Uncheck All'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResetDefaults(selectedRole)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw size={13} />
                    <span>{isUrdu ? 'ڈیفالٹ' : 'Defaults'}</span>
                  </button>
                </div>
              )}
            </div>
          </MaterialCard>

          {/* Module Filtering & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
              {categories.map((cat) => {
                const isSelected = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat === 'ALL' ? (isUrdu ? 'تمام کیٹیگریز' : 'All Categories') : cat}
                  </button>
                );
              })}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search size={14} className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isUrdu ? 'ماڈیول تلاش کریں...' : 'Search modules...'}
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Module Checkbox Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredModules.map((mod) => {
              const isChecked = isDirectorOrCoo ? true : currentRoleAllowed.includes(mod.id);

              return (
                <div
                  key={mod.id}
                  onClick={() => !isDirectorOrCoo && handleToggleModuleCheckbox(selectedRole, mod.id)}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 select-none ${
                    isDirectorOrCoo
                      ? 'border-purple-500/30 bg-purple-50/20 dark:bg-purple-950/20 cursor-default'
                      : isChecked
                      ? 'border-blue-500/60 bg-blue-50/40 dark:bg-blue-950/30 shadow-xs cursor-pointer'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 opacity-60 cursor-pointer'
                  }`}
                >
                  {/* Real Accessible Checkbox Input + Stylized Visual */}
                  <div className="pt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      id={`module-checkbox-${mod.id}`}
                      checked={isChecked}
                      disabled={isDirectorOrCoo}
                      onChange={() => handleToggleModuleCheckbox(selectedRole, mod.id)}
                      className="sr-only"
                    />
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${
                        isChecked
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {isChecked && <Check size={16} strokeWidth={3} className="text-white" />}
                    </div>
                  </div>

                  {/* Module Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {isUrdu ? mod.labelUr : mod.labelEn}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                        {mod.category}
                      </span>
                    </div>

                    {isUrdu && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                        {mod.labelEn}
                      </span>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
                      <span className="font-mono text-slate-400">
                        ID: {mod.id}
                      </span>
                      <span className={`font-bold ${isChecked ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                        {isChecked ? (isUrdu ? 'اختیار فعال ہے ✓' : 'Authorized ✓') : (isUrdu ? 'غیر فعال' : 'Hidden')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Save Rules Action Bar */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {isUrdu ? 'تبدیلیاں نافذ کرنے کے لیے بٹن دبائیں:' : 'Save changes to update live system:'}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isUrdu
                  ? 'محفوظ کرنے کے بعد مین پیج کے فوری لنکس (Quick Links) اور سائیڈبار مینو فوراً اپ ڈیٹ ہو جائیں گے۔'
                  : 'Changes take effect immediately across all sessions and Home page Quick Links.'}
              </p>
            </div>

            <button
              type="button"
              id="save-settings-rules-btn"
              onClick={handleSaveRules}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-xs shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check size={18} />
              <span>{isUrdu ? 'اصول محفوظ کریں (Save Access Rules)' : 'Save Access Rules'}</span>
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GOOGLE SHEETS & DATABASE                                          */}
      {/* ========================================================================= */}
      {activeTab === 'sheets' && (
        <div className="space-y-6">
          <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-white dark:bg-slate-900 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              {isUrdu ? 'گوگل شیٹس اور ایپس اسکرپٹ انٹیگریشن' : 'Google Sheets & Apps Script Architecture'}
            </span>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">
                  {isUrdu ? 'مطلوبہ اسپریڈ شیٹ آئی ڈی (Google Sheets ID)' : 'Target Spreadsheet ID'}
                </label>
                <input
                  type="text"
                  readOnly
                  value="1tA_vE_pRoDuCtIoN_sHeEtS_iD_mApPeR_xXyZ"
                  className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-500 select-all"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  {isUrdu ? 'آف لائن ڈیٹا بیس و بفر کیش' : 'Offline IndexedDB Buffer Cache'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                  Active / فعال
                </span>
              </div>
            </div>
          </MaterialCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INTERAKT WHATSAPP BUSINESS API (SINGLE CENTRAL NUMBER)            */}
      {/* ========================================================================= */}
      {activeTab === 'interakt' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Banner */}
          <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      {isUrdu ? 'انٹریکٹ واٹس ایپ بزنس API (ایک مرکزی کمپنی نمبر)' : 'Interakt WhatsApp Business API'}
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                      interaktConfig.enabled && interaktConfig.apiKey
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                    }`}>
                      {interaktConfig.enabled && interaktConfig.apiKey ? 'Active / فعال' : 'Setup Required'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isUrdu
                      ? 'کلائنٹس کو الگ الگ سپورٹ ٹیم کے ذاتی نمبرز کے بجائے کمپنی کے صرف ایک ہی مرکزی واٹس ایپ نمبر سے تمام پیغامات جائیں گے۔'
                      : 'All WhatsApp messages dispatch from ONE central verified company number instead of individual personal numbers.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveInterakt}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {saveInteraktSuccess ? <Check size={15} /> : <Save size={15} />}
                  <span>{saveInteraktSuccess ? (isUrdu ? 'محفوظ ہو گیا!' : 'Saved!') : (isUrdu ? 'سیٹنگز محفوظ کریں' : 'Save Settings')}</span>
                </button>
              </div>
            </div>
          </MaterialCard>

          {/* Configuration Form & Live Status */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: Form */}
            <div className="lg:col-span-7 space-y-5">
              <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Key size={16} className="text-emerald-600" />
                  <span>{isUrdu ? 'انٹریکٹ API اسناد و کنفیگریشن' : 'Interakt API Credentials & Routing'}</span>
                </h3>

                {/* Enable Toggle */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      {isUrdu ? 'مرکزی واٹس ایپ نمبر سسٹم فعال کریں' : 'Enable Central Official Number Routing'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isUrdu 
                        ? 'فعال ہونے پر تمام ملازمین کے بھیجے گئے پیغامات خودبخود انٹریکٹ API کے ذریعے جائیں گے۔' 
                        : 'Routes all messages through Interakt WABA so clients only see your official business number.'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interaktConfig.enabled}
                      onChange={e => setInteraktConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Interakt Secret API Key */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isUrdu ? 'انٹریکٹ سیکریٹ کی (Interakt Secret API Key):' : 'Interakt Secret API Key:'}
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={interaktConfig.apiKey}
                      onChange={e => setInteraktConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="e.g. bG1VUWp... or paste your key from app.interakt.ai"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showApiKey ? 'Hide Key' : 'Show Key'}
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {isUrdu 
                      ? 'یہ کی آپ کو app.interakt.ai کے Settings -> Developer Settings سے ملے گی۔' 
                      : 'Obtain from app.interakt.ai -> Settings -> Developer Settings -> Secret Key.'}
                  </span>
                </div>

                {/* Central Verified WhatsApp Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isUrdu ? 'کمپنی کا تصدیق شدہ مرکزی واٹس ایپ نمبر:' : 'Company Official Central WhatsApp Number:'}
                  </label>
                  <input
                    type="text"
                    value={interaktConfig.senderNumber}
                    onChange={e => setInteraktConfig(prev => ({ ...prev, senderNumber: e.target.value }))}
                    placeholder="+92 300 0000000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {isUrdu 
                      ? 'کلائنٹس کو یہی نمبر ان کے واٹس ایپ پر نظر آئے گا۔' 
                      : 'Clients will only see this single official company number.'}
                  </span>
                </div>

                {/* Sender Display Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isUrdu ? 'کمپنی / برانڈ ڈسپلے نام:' : 'Company Display Name / Brand:'}
                  </label>
                  <input
                    type="text"
                    value={interaktConfig.companyDisplayName}
                    onChange={e => setInteraktConfig(prev => ({ ...prev, companyDisplayName: e.target.value }))}
                    placeholder="Techno Evident / TaleemPro Official"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {/* Language Strategy Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isUrdu ? 'پیغامات کی زبان کا اصول (Language Rule):' : 'Language Rule for Messages:'}
                  </label>
                  <select
                    value={interaktConfig.defaultLanguageMode}
                    onChange={e => setInteraktConfig(prev => ({ ...prev, defaultLanguageMode: e.target.value as any }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-bold"
                  >
                    <option value="auto">
                      {isUrdu ? 'آٹو سلیکشن (تعلیم پرو: خالص اردو • ایڈسوف: خالص انگریزی)' : 'Auto-Select (TaleemPro: Urdu • Edsof: English)'}
                    </option>
                    <option value="ur">
                      {isUrdu ? 'تمام کلائنٹس کے لیے صرف اردو (اردو نستعلیق)' : 'Force Urdu for all clients'}
                    </option>
                    <option value="en">
                      {isUrdu ? 'تمام کلائنٹس کے لیے صرف انگلش (English)' : 'Force English for all clients'}
                    </option>
                  </select>
                </div>

                {/* Special Directive Clarification Box */}
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                    <span>{isUrdu ? 'لازمی برانڈنگ اصول (Brand Policy):' : 'Strict Branding Policy:'}</span>
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    {isUrdu
                      ? 'پیغامات میں "TEDOS ERP v4.5" کا ذکر بالکل نہیں آئے گا۔ تعلیم پرو (TaleemPro) کے کلائنٹس کو خالص اردو میں "تعلیم پرو سپورٹ ٹیم" اور ایڈسوف کے کلائنٹس کو انگریزی میں "Your Edsof Support Team" کے نام سے میسج جائے گا۔'
                      : 'Messages will NEVER mention "TEDOS ERP v4.5". Instead, TaleemPro clients receive Urdu messages as "تعلیم پرو سپورٹ ٹیم" and Edsof clients receive English as "Your Edsof Support Team".'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveInterakt}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Save size={14} />
                  <span>{saveInteraktSuccess ? (isUrdu ? 'محفوظ ہو گیا!' : 'Saved Successfully!') : (isUrdu ? 'تبدیلیاں محفوظ کریں' : 'Save Interakt Configuration')}</span>
                </button>
              </MaterialCard>
            </div>

            {/* Right 5 Columns: Diagnostic Test Sandbox & Instructions */}
            <div className="lg:col-span-5 space-y-5">
              {/* Test Sandbox */}
              <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <PhoneCall size={16} className="text-emerald-600" />
                  <span>{isUrdu ? 'انٹریکٹ کنکشن ٹیسٹ سینڈ باکس' : 'Interakt Connection Test'}</span>
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isUrdu
                    ? 'یہاں ٹیسٹ موبائل نمبر درج کر کے اپنے انٹریکٹ API کنکشن کی تصدیق کریں۔'
                    : 'Enter a test mobile phone number to test Interakt WhatsApp Business API connection.'}
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isUrdu ? 'ٹیسٹ فون نمبر:' : 'Test Phone Number:'}
                  </label>
                  <input
                    type="text"
                    value={testPhoneNumber}
                    onChange={e => setTestPhoneNumber(e.target.value)}
                    placeholder="03001234567"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTestInterakt}
                  disabled={isTestingInterakt}
                  className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isTestingInterakt ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>{isTestingInterakt ? (isUrdu ? 'API چیک ہو رہی ہے...' : 'Pinging Interakt...') : (isUrdu ? 'API کنکشن ٹیسٹ کریں' : 'Test API Connection')}</span>
                </button>

                {testResult && (
                  <div className={`p-3.5 rounded-2xl text-xs space-y-1 animate-fade-in border ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-900 dark:text-rose-200'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold">
                      {testResult.success ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertTriangle size={16} className="text-rose-600" />}
                      <span>{testResult.success ? 'کامیاب رابطہ (Connected!)' : 'کنکشن کی جانچ (Notice)'}</span>
                    </div>
                    <p className="text-[11px]">{testResult.message}</p>
                  </div>
                )}
              </MaterialCard>

              {/* Instructions Guide */}
              <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Info size={14} className="text-blue-600" />
                  <span>{isUrdu ? 'انٹریکٹ سیٹ اپ کی آسان رہنمائی' : 'Quick Interakt Setup Guide'}</span>
                </h4>
                <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>{isUrdu ? 'app.interakt.ai پر اپنے کمپنی اکاؤنٹ میں لاگ ان کریں۔' : 'Log in to your account at app.interakt.ai'}</li>
                  <li>{isUrdu ? 'Settings میں جا کر Developer Settings پر کلک کریں۔' : 'Navigate to Settings -> Developer Settings'}</li>
                  <li>{isUrdu ? 'وہاں سے اپنی Secret API Key کاپی کریں۔' : 'Copy your Secret API Key'}</li>
                  <li>{isUrdu ? 'کی کو اوپر والے خانے میں پیسٹ کر کے "سیٹنگز محفوظ کریں" دبائیں۔' : 'Paste the key above and click Save Settings'}</li>
                  <li>{isUrdu ? 'اب سپورٹ ٹیم کا ہر ایگزیکٹو جب بھی پیغام بھیجے گا تو کلائنٹ کو کمپنی کے ایک ہی تصدیق شدہ نمبر سے میسج موصول ہوگا۔' : 'All support messages now automatically dispatch from your single central business number!'}</li>
                </ol>
              </MaterialCard>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
