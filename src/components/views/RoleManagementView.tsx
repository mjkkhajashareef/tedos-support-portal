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
  ShieldCheck,
  CheckSquare,
  Square,
  RotateCcw,
  CheckCircle2,
  Lock,
  Search,
  Filter,
  Save,
  Sliders,
  UserCheck,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RoleManagementViewProps {
  id?: string;
}

export const RoleManagementView: React.FC<RoleManagementViewProps> = ({ id }) => {
  const { language, currentUser, openSheetSyncModal } = useApp();
  const isUrdu = language === 'ur';

  const [rulesConfig, setRulesConfig] = useState<Record<UserRole, ModuleId[]>>(() => getRoleModulePermissions());
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.SUPPORT_EXECUTIVE);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    setRulesConfig(getRoleModulePermissions());
  }, []);

  const isAdminRole =
    selectedRole === UserRole.DIRECTOR ||
    selectedRole === UserRole.COO ||
    selectedRole === UserRole.AI_ADMINISTRATOR;

  const currentRoleAllowed = rulesConfig[selectedRole] || [];

  const handleToggleModule = (moduleId: ModuleId) => {
    setRulesConfig(prev => {
      const currentList = prev[selectedRole] || [];
      const updated = currentList.includes(moduleId)
        ? currentList.filter(id => id !== moduleId)
        : [...currentList, moduleId];
      return {
        ...prev,
        [selectedRole]: updated
      };
    });
  };

  const handleSelectAll = () => {
    setRulesConfig(prev => ({
      ...prev,
      [selectedRole]: ALL_CONFIGURABLE_MODULES.map(m => m.id)
    }));
  };

  const handleDeselectAll = () => {
    setRulesConfig(prev => ({
      ...prev,
      [selectedRole]: [ModuleId.DASHBOARD] // Retain dashboard as minimum anchor
    }));
  };

  const handleResetDefaults = () => {
    setRulesConfig(prev => ({
      ...prev,
      [selectedRole]: DEFAULT_ROLE_MODULE_ACCESS[selectedRole] || [ModuleId.DASHBOARD]
    }));
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveRoleModulePermissions(rulesConfig);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3500);
  };

  const categories = ['ALL', ...Array.from(new Set(ALL_CONFIGURABLE_MODULES.map(m => m.category)))];

  const filteredModules = ALL_CONFIGURABLE_MODULES.filter(mod => {
    const q = searchFilter.toLowerCase().trim();
    const matchesSearch =
      !q ||
      mod.labelEn.toLowerCase().includes(q) ||
      mod.labelUr.toLowerCase().includes(q) ||
      mod.id.toLowerCase().includes(q);

    const matchesCat = selectedCategory === 'ALL' || mod.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div id={id || 'tedos-role-management-view'} className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner */}
      <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                {isUrdu ? 'رول و پرمیشن مینیجمنٹ (Rule & Permission Management)' : 'Rule & Permission Management Matrix'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isUrdu
                  ? 'ہر ماڈیول اور فیچر کا الگ چیک باکس • صرف منتخب ماڈیولز کا ہی ایکسیس ملے گا • ایڈمن مکمل بااختیار ہے'
                  : 'Granular Module Checkbox Permissions • Strictly controls sidebar & quick links per role • Multi-device server synced'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="admin-rules-sync-sheet-btn"
              onClick={openSheetSyncModal}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              title={isUrdu ? 'گوگل شیٹ ابھی سنک کریں (کالم O اور P سمیت تمام ڈیٹا)' : 'Sync Google Sheet Now (Columns O & P)'}
            >
              <FileSpreadsheet size={15} />
              <span>{isUrdu ? 'ابھی گوگل شیٹ سنک کریں' : 'Sync Google Sheet Now'}</span>
            </button>
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-mono font-bold flex items-center gap-1.5">
              <Lock size={14} />
              <span>{currentUser?.role || 'Admin'} Protected</span>
            </span>
          </div>
        </div>

        {/* Success Alert */}
        <AnimatePresence>
          {saveSuccessNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>
                {isUrdu
                  ? `رول (${selectedRole}) کے اجازت نامے کامیابی سے محفوظ ہو گئے اور تمام سسٹمز پر لاگو کر دیے گئے!`
                  : `Role permissions for ${selectedRole} saved and broadcast across the entire system!`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </MaterialCard>

      {/* Main Configuration Card */}
      <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <form onSubmit={handleSaveSubmit} className="space-y-6">
          {/* Step 1: Select Role */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase block">
              {isUrdu ? '1. رول منتخب کریں (Select Role to Configure):' : '1. Select User Role to Configure:'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {Object.values(UserRole).map(role => {
                const isSelected = selectedRole === role;
                const roleCount = (rulesConfig[role] || []).length;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`p-3 rounded-2xl border text-left rtl:text-right transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <span className="text-xs font-black block truncate">{role}</span>
                    <span className={`text-[10px] font-mono mt-0.5 block ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {roleCount} modules
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role Status Note */}
          {isAdminRole && (
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-200 text-xs font-bold flex items-center gap-2">
              <Lock size={15} className="shrink-0" />
              <span>
                {isUrdu
                  ? `${selectedRole} ایڈمنسٹریشن رول ہے جسے تمام ${ALL_CONFIGURABLE_MODULES.length} ماڈیولز اور فیچرز کا 100% مستقل ایکسیس حاصل ہے۔`
                  : `${selectedRole} is an administrative leadership role with 100% full access to all ${ALL_CONFIGURABLE_MODULES.length} modules.`}
              </span>
            </div>
          )}

          {/* Quick Action Toolbar for Checkboxes */}
          {!isAdminRole && (
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <CheckSquare size={13} />
                  <span>{isUrdu ? 'سب منتخب کریں' : 'Select All'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Square size={13} />
                  <span>{isUrdu ? 'سب ان چیک کریں' : 'Deselect All'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>{isUrdu ? 'ڈیفالٹ پر ری سیٹ' : 'Reset Defaults'}</span>
                </button>
              </div>

              <span className="text-xs font-mono font-bold text-blue-600">
                {currentRoleAllowed.length} / {ALL_CONFIGURABLE_MODULES.length} Modules Active
              </span>
            </div>
          )}

          {/* Search & Category Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Search modules..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none"
              />
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'ALL' ? 'All Categories' : `📂 ${cat}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Checkbox Matrix Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredModules.map(mod => {
              const isChecked = isAdminRole ? true : currentRoleAllowed.includes(mod.id);
              return (
                <div
                  key={mod.id}
                  onClick={() => handleToggleModule(mod.id)}
                  className={`p-3.5 rounded-2xl border transition-all select-none cursor-pointer flex items-start gap-3 ${
                    isChecked
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-400/60 dark:border-blue-800'
                      : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-65 hover:opacity-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isAdminRole}
                    onChange={() => handleToggleModule(mod.id)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {isUrdu ? mod.labelUr : mod.labelEn}
                      </span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {mod.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                      {isUrdu ? mod.labelEn : mod.labelUr} ({mod.id})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500">
              {isUrdu
                ? 'سبمٹ کرنے پر تمام ڈیوائسز اور سسٹمز پر ایکسیس فوری اپ ڈیٹ ہو جائے گا۔'
                : 'Clicking submit applies role permissions and updates authorized links instantly.'}
            </span>

            <button
              type="submit"
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition cursor-pointer"
            >
              <Save size={15} />
              <span>{isUrdu ? 'سبمٹ و رولز محفوظ کریں (Save Rule Matrix)' : 'Submit & Save Rule Permissions'}</span>
            </button>
          </div>
        </form>
      </MaterialCard>
    </div>
  );
};
