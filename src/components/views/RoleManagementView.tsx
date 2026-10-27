/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, ModuleId } from '../../types';
import { MaterialCard } from '../common/MaterialCard';
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
  FileSpreadsheet,
  Plus,
  Eye,
  Edit3,
  Trash2,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  X,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ALL_CONFIGURABLE_MODULES,
  getRoleModulePermissions,
  saveRoleModulePermissions,
  DEFAULT_ROLE_MODULE_ACCESS
} from '../../utils/rbac';

interface RoleRecord {
  id: string;
  name: string;
  createdOn: string;
  createdBy: string;
  updatedOn: string;
  updatedBy: string;
}

interface GranularPermissionItem {
  id: string;
  title: string;
  actions: string[]; // e.g. ['add', 'update', 'delete', 'review', 'listview', 'action', 'print', 'upload', 'approval', 'download', 'remarks']
}

interface ModuleSection {
  id: string;
  name: string;
  items: GranularPermissionItem[];
}

const MODULE_PERMISSIONS_TREE: ModuleSection[] = [
  {
    id: 'student_diary',
    name: 'Student Diary & updates',
    items: [
      { id: 'diary_main', title: 'Student Diary & Updates', actions: ['review', 'listview', 'action'] }
    ]
  },
  {
    id: 'fees_details',
    name: 'Fees Details',
    items: [
      { id: 'fees_one', title: 'Fees One', actions: ['review', 'print'] },
      { id: 'fees_two', title: 'Fees Two', actions: ['review', 'print'] },
      { id: 'fees_three', title: 'Fees Three', actions: ['review', 'print'] },
      { id: 'fees_four', title: 'Fees Four', actions: ['review', 'print'] },
      { id: 'fees_five', title: 'Fees Five', actions: ['review', 'print'] },
      { id: 'fees_six', title: 'Fees Six', actions: ['review', 'print'] },
      { id: 'fees_seven', title: 'Fees Seven', actions: ['review', 'print'] },
      { id: 'fees_due_month', title: 'Fees Due As Per Month', actions: ['add', 'update', 'delete', 'review', 'listview', 'action', 'print'] },
      { id: 'fees_category', title: 'Fees Category', actions: ['add', 'update', 'delete', 'review', 'listview', 'action', 'print'] },
      { id: 'sponsorship_needed', title: 'Sponsorship Needed', actions: ['add', 'print'] },
      { id: 'discounts', title: 'Discounts', actions: ['add', 'print'] }
    ]
  },
  {
    id: 'exams',
    name: 'Exams',
    items: [
      { id: 'manage_exam', title: 'Manage Exam', actions: ['add', 'edit', 'delete', 'review', 'download', 'listview', 'print', 'remarks', 'approval', 'upload', 'specific1'] },
      { id: 'marksheet', title: 'Marksheet', actions: ['add', 'update', 'delete', 'review', 'listview', 'action', 'remarks', 'upload', 'specific1', 'specific2'] }
    ]
  },
  {
    id: 'student_profile_master',
    name: 'Student Profile Master',
    items: [
      { id: 'student_cat', title: 'Student Category', actions: ['add', 'update', 'delete', 'review', 'listview', 'action', 'remarks', 'upload', 'specific4'] },
      { id: 'class_cat', title: 'Class Category', actions: ['add', 'update', 'review', 'listview', 'action'] },
      { id: 'other_q_cat', title: 'Other Question Category', actions: ['add', 'update', 'review', 'listview', 'action'] },
      { id: 'other_q', title: 'Other Questions', actions: ['add', 'update', 'review', 'listview', 'action'] },
      { id: 'id_card_tmpl', title: 'ID Card Template', actions: ['add', 'update', 'delete', 'review', 'listview', 'action', 'remarks', 'upload', 'specific4'] }
    ]
  },
  {
    id: 'master_management',
    name: 'Master Management',
    items: [
      { id: 'academic_year', title: 'Academic Year', actions: ['add', 'update', 'review', 'action'] },
      { id: 'batch', title: 'Batch', actions: ['add', 'update', 'review', 'listview'] },
      { id: 'course', title: 'Course', actions: ['add', 'update', 'review', 'listview', 'specific1'] },
      { id: 'qurbani_area', title: 'Qurbani Area Allotment', actions: ['add', 'edit', 'update', 'delete', 'listview', 'print', 'share', 'action', 'remarks'] },
      { id: 'financial_year', title: 'Financial Year', actions: ['add', 'update', 'review', 'action'] },
      { id: 'country', title: 'Country', actions: ['add', 'update', 'review', 'listview', 'action'] },
      { id: 'state', title: 'State', actions: ['add', 'update', 'review', 'listview', 'action'] },
      { id: 'district', title: 'District', actions: ['add', 'update', 'review', 'listview', 'action'] },
      { id: 'blood_type', title: 'Blood Type', actions: ['review'] },
      { id: 'org_cat', title: 'Organization Category', actions: ['add', 'update', 'review', 'listview', 'action'] },
      { id: 'org', title: 'Organization', actions: ['add', 'update', 'review', 'action', 'specific1'] },
      { id: 'upload_logo', title: 'Upload Logo', actions: ['add', 'update', 'review', 'listview', 'action', 'upload'] },
      { id: 'donation_type', title: 'Donation Type', actions: ['add', 'update', 'review', 'listview', 'action'] },
      { id: 'profession', title: 'Profession', actions: ['add', 'update', 'review', 'listview', 'action'] },
      { id: 'payment_type', title: 'Payment Type', actions: ['add', 'update', 'review', 'listview', 'action'] }
    ]
  },
  {
    id: 'tedos_operations',
    name: 'TEDOS Support & Operations (Ultimate Sheet Modules)',
    items: [
      { id: 'daily_worklog_mod', title: 'Daily Work Log & Session Duration', actions: ['add', 'update', 'delete', 'review', 'listview', 'action', 'print', 'export'] },
      { id: 'tickets_mod', title: 'Ticket Center & Ticket Rase Tab', actions: ['add', 'edit', 'delete', 'review', 'approval', 'action', 'export'] },
      { id: 'clients_mod', title: 'Clients Roster & Software URLs', actions: ['add', 'edit', 'delete', 'review', 'listview', 'action', 'export'] },
      { id: 'billing_usage_mod', title: 'Client Details & Usage (Billing & AMC)', actions: ['add', 'edit', 'delete', 'review', 'listview', 'action', 'export', 'print'] },
      { id: 'followups_mod', title: 'Follow-Ups Tracker', actions: ['add', 'update', 'delete', 'review', 'listview', 'action', 'export'] },
      { id: 'training_mod', title: 'Training Sessions & Google Meet Proofs', actions: ['add', 'edit', 'review', 'approval', 'upload', 'action'] },
      { id: 'payroll_mod', title: 'Payroll Portal & KPI Incentives', actions: ['review', 'listview', 'action', 'export', 'print'] },
      { id: 'messages_mod', title: 'Internal Team Messages & Directives', actions: ['add', 'delete', 'review', 'listview', 'action'] },
      { id: 'roles_users_mod', title: 'User & Role Management', actions: ['add', 'update', 'delete', 'review', 'listview', 'action'] }
    ]
  }
];

const INITIAL_ROLES_LIST: RoleRecord[] = [
  {
    id: 'role-1',
    name: '1-COO',
    createdOn: '2026-04-08 10:50:00',
    createdBy: 'Techno Admin',
    updatedOn: '-',
    updatedBy: '-'
  },
  {
    id: 'role-2',
    name: '2-CEO',
    createdOn: '2026-04-08 10:54:21',
    createdBy: 'Techno Admin',
    updatedOn: '-',
    updatedBy: '-'
  },
  {
    id: 'role-3',
    name: '3-Accountant',
    createdOn: '2026-04-08 11:14:03',
    createdBy: 'Techno Admin',
    updatedOn: '2026-10-12 12:14:42',
    updatedBy: 'A-002-Umar Farooq'
  },
  {
    id: 'role-4',
    name: '4-Software Manager',
    createdOn: '2026-08-17 11:56:24',
    createdBy: 'Techno Admin',
    updatedOn: '-',
    updatedBy: '-'
  },
  {
    id: 'role-5',
    name: '5-Support Manager',
    createdOn: '2026-04-08 11:30:00',
    createdBy: 'Techno Admin',
    updatedOn: '2026-10-25 15:20:10',
    updatedBy: 'Khaja Shareef (COO)'
  },
  {
    id: 'role-6',
    name: '6-Support Executive',
    createdOn: '2026-04-08 11:45:00',
    createdBy: 'Techno Admin',
    updatedOn: '2026-10-26 09:12:30',
    updatedBy: 'Syed (Support Manager)'
  },
  {
    id: 'role-7',
    name: '7-Operation Manager',
    createdOn: '2026-05-01 10:00:00',
    createdBy: 'Techno Admin',
    updatedOn: '-',
    updatedBy: '-'
  },
  {
    id: 'role-8',
    name: '8-Director',
    createdOn: '2026-01-01 09:00:00',
    createdBy: 'System Root',
    updatedOn: '-',
    updatedBy: '-'
  }
];

export const RoleManagementView: React.FC<{ id?: string }> = ({ id }) => {
  const { language, currentUser, openSheetSyncModal } = useApp();
  const isUrdu = language === 'ur';

  // Screen View: 'LIST' (Role Assignment table) vs 'UPDATE_ROLE' (Granular permissions tree)
  const [currentScreen, setCurrentScreen] = useState<'LIST' | 'UPDATE_ROLE'>('LIST');

  // Roles list
  const [roles, setRoles] = useState<RoleRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tedos_roles_assignment_list_v2');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_ROLES_LIST;
  });

  // Currently editing role
  const [selectedRoleRecord, setSelectedRoleRecord] = useState<RoleRecord>(INITIAL_ROLES_LIST[3]); // 4-Software Manager default
  const [roleNameInput, setRoleNameInput] = useState('Software Manager');

  // Granular checked permissions: Map of key `${item.id}:${action}` -> boolean
  const [checkedPermissions, setCheckedPermissions] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tedos_granular_role_permissions_v1');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    // Default checked permissions for full functional operation
    const defaults: Record<string, boolean> = {};
    MODULE_PERMISSIONS_TREE.forEach(section => {
      section.items.forEach(item => {
        item.actions.forEach(act => {
          defaults[`${item.id}:${act}`] = true;
        });
      });
    });
    return defaults;
  });

  // Table filter & search
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [saveToast, setSaveToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync roles list to storage
  useEffect(() => {
    try {
      localStorage.setItem('tedos_roles_assignment_list_v2', JSON.stringify(roles));
    } catch {}
  }, [roles]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setSaveToast({ type, text });
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleEditRole = (role: RoleRecord) => {
    setSelectedRoleRecord(role);
    setRoleNameInput(role.name.replace(/^\d+-/, ''));
    setCurrentScreen('UPDATE_ROLE');
  };

  const handleCreateNewRole = () => {
    const nextNum = roles.length + 1;
    const newRecord: RoleRecord = {
      id: `role-${Date.now()}`,
      name: `${nextNum}-New Role`,
      createdOn: new Date().toISOString().replace('T', ' ').slice(0, 19),
      createdBy: currentUser?.name || 'Techno Admin',
      updatedOn: '-',
      updatedBy: '-'
    };
    setSelectedRoleRecord(newRecord);
    setRoleNameInput('New Role');
    setCurrentScreen('UPDATE_ROLE');
  };

  const handleDeleteRole = (roleId: string) => {
    setRoles(prev => prev.filter(r => r.id !== roleId));
    showToast('success', isUrdu ? 'رول حذف کر دیا گیا۔' : 'Role removed successfully.');
  };

  const handleTogglePermission = (itemId: string, action: string) => {
    const key = `${itemId}:${action}`;
    setCheckedPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleToggleSectionAll = (section: ModuleSection) => {
    // Check if all actions in this section are currently true
    const allChecked = section.items.every(item =>
      item.actions.every(act => Boolean(checkedPermissions[`${item.id}:${act}`]))
    );

    setCheckedPermissions(prev => {
      const next = { ...prev };
      section.items.forEach(item => {
        item.actions.forEach(act => {
          next[`${item.id}:${act}`] = !allChecked;
        });
      });
      return next;
    });
  };

  const handleSaveAssignedRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleNameInput.trim()) {
      showToast('error', isUrdu ? 'برائے مہربانی رول کا نام درج کریں۔' : 'Please enter Role Name.');
      return;
    }

    // Save permissions
    try {
      localStorage.setItem('tedos_granular_role_permissions_v1', JSON.stringify(checkedPermissions));
      window.dispatchEvent(new Event('tedos_permissions_updated'));
    } catch {}

    // Update role list
    setRoles(prev => {
      const existingIdx = prev.findIndex(r => r.id === selectedRoleRecord.id);
      const updatedRecord: RoleRecord = {
        ...selectedRoleRecord,
        name: roleNameInput.trim(),
        updatedOn: new Date().toISOString().replace('T', ' ').slice(0, 19),
        updatedBy: currentUser?.name || 'Techno Admin'
      };

      if (existingIdx >= 0) {
        const nextList = [...prev];
        nextList[existingIdx] = updatedRecord;
        return nextList;
      }
      return [...prev, updatedRecord];
    });

    showToast(
      'success',
      isUrdu
        ? `رول "${roleNameInput}" اور ماڈیولز کے اجازت نامے کامیابی سے اپ ڈیٹ ہو گئے!`
        : `Role "${roleNameInput}" permissions updated successfully across all modules!`
    );
    setCurrentScreen('LIST');
  };

  const filteredRoles = useMemo(() => {
    return roles.filter(r => {
      const q = searchTerm.toLowerCase().trim();
      return !q || r.name.toLowerCase().includes(q) || r.createdBy.toLowerCase().includes(q);
    });
  }, [roles, searchTerm]);

  return (
    <div id={id || 'tedos-role-assignment-view'} className="space-y-6 pb-12">
      {/* Toast Alert */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold ${
              saveToast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{saveToast.text}</span>
            </div>
            <button onClick={() => setSaveToast(null)} className="text-[10px] underline cursor-pointer">
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCREEN 1: ROLE ASSIGNMENT TABLE VIEW (Matches Screenshot 2026-10-27 4.01.49 PM.png) */}
      {currentScreen === 'LIST' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h1 className="text-2xl font-black text-[#0f3460] dark:text-blue-400">
                {isUrdu ? 'رول تفویض و اجازت نامے (Role Assignment)' : 'Role Assignment'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isUrdu
                  ? 'سپر ایڈمن آئی ڈی سے ہر ماڈیول کا پیج ایکسیس الگ الگ تفویض کریں اور مکمل اختیارات کنٹرول کریں۔'
                  : 'Manage granular access roles, divide modules into specific sub-pages, and assign access per user.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openSheetSyncModal}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <FileSpreadsheet size={15} />
                <span>{isUrdu ? 'شیٹ سنک' : 'Sheet Sync'}</span>
              </button>
              <button
                type="button"
                onClick={handleCreateNewRole}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <Plus size={16} />
                <span>{isUrdu ? '+ نیا رول شامل کریں' : '+ Add New Role'}</span>
              </button>
            </div>
          </div>

          <MaterialCard variant="elevated" className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            {/* Show Entries & Search controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span>Show</span>
                <select
                  value={entriesPerPage}
                  onChange={e => setEntriesPerPage(Number(e.target.value))}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>entries</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Search:</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search role..."
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Role Assignment Data Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left rtl:text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-[#244b7a] text-white font-black text-xs">
                    <th className="py-3 px-4 w-24">Action ⇅</th>
                    <th className="py-3 px-4">Role Name ⇅</th>
                    <th className="py-3 px-4">Created On ⇅</th>
                    <th className="py-3 px-4">Created By</th>
                    <th className="py-3 px-4">Updated On ⇅</th>
                    <th className="py-3 px-4">Updated By ⇅</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredRoles.slice(0, entriesPerPage).map(r => (
                    <tr key={r.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <button
                            type="button"
                            onClick={() => handleEditRole(r)}
                            className="p-1 hover:text-blue-600 transition cursor-pointer"
                            title="View Role Permissions"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditRole(r)}
                            className="p-1 hover:text-amber-600 transition cursor-pointer"
                            title="Edit Role Permissions"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(r.id)}
                            className="p-1 hover:text-red-600 transition cursor-pointer"
                            title="Delete Role"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#0f3460] dark:text-blue-300">
                        {r.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {r.createdOn}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {r.createdBy}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {r.updatedOn}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {r.updatedBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2 pt-2">
              <span>Showing 1 to {filteredRoles.length} of {roles.length} entries</span>
              <div className="flex items-center gap-1">
                <button className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 cursor-not-allowed">
                  Previous
                </button>
                <button className="px-3 py-1 rounded-md bg-blue-600 text-white font-bold">
                  1
                </button>
                <button className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 cursor-not-allowed">
                  Next
                </button>
              </div>
            </div>
          </MaterialCard>

          {/* Floating Round Blue + Button (Matches Screenshot 2026-10-27 4.01.49 PM.png) */}
          <button
            type="button"
            onClick={handleCreateNewRole}
            className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/40 flex items-center justify-center z-40 transition-transform active:scale-95 cursor-pointer"
            title="Add New Role Assignment"
          >
            <Plus size={28} />
          </button>
        </div>
      )}

      {/* SCREEN 2: UPDATE ASSIGNED ROLE TREE (Matches Screenshot 2026-10-27 4.02.18 PM.png) */}
      {currentScreen === 'UPDATE_ROLE' && (
        <form onSubmit={handleSaveAssignedRole} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-300 dark:border-slate-700 shadow-sm space-y-6">
            {/* Header: Update Assigned Role + Top Right Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentScreen('LIST')}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer transition"
                  title="Back to Role Assignment List"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 className="text-xl font-black text-[#0f3460] dark:text-blue-400">
                    {isUrdu ? 'تفویض شدہ رول اپ ڈیٹ کریں (Update Assigned Role)' : 'Update Assigned Role'}
                  </h1>
                  <span className="text-xs text-slate-400">
                    Fine-grained granular access permissions per module & action
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('LIST')}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Role Name Input */}
            <div className="max-w-md space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Role Name *
              </label>
              <input
                type="text"
                required
                value={roleNameInput}
                onChange={e => setRoleNameInput(e.target.value)}
                placeholder="e.g. Software Manager / Accountant / Support Executive"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Modules Hierarchy Tree (Matches Screenshot 2026-10-27 4.02.18 PM.png) */}
            <div className="space-y-6 pt-3">
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Modules
              </h2>

              <div className="space-y-5 text-xs">
                {MODULE_PERMISSIONS_TREE.map(section => {
                  const sectionAllChecked = section.items.every(item =>
                    item.actions.every(act => Boolean(checkedPermissions[`${item.id}:${act}`]))
                  );

                  return (
                    <div
                      key={section.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3"
                    >
                      {/* Section Header with Select All button */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/60">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={sectionAllChecked}
                            onChange={() => handleToggleSectionAll(section)}
                            className="rounded text-blue-600 focus:ring-0 shrink-0"
                          />
                          <span className="font-black text-slate-900 dark:text-white text-xs">
                            {section.name}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleSectionAll(section)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] hover:bg-blue-700 transition cursor-pointer"
                        >
                          {sectionAllChecked ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>

                      {/* Items & Actions in this section */}
                      <div className="space-y-2.5 pl-4 rtl:pr-4">
                        {section.items.map(item => (
                          <div key={item.id} className="space-y-1">
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] block">
                              • {item.title}
                            </span>
                            <div className="flex items-center gap-3.5 flex-wrap pl-3 rtl:pr-3">
                              {item.actions.map(act => {
                                const key = `${item.id}:${act}`;
                                const isChecked = Boolean(checkedPermissions[key]);

                                return (
                                  <label
                                    key={act}
                                    className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition select-none"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleTogglePermission(item.id, act)}
                                      className="rounded text-blue-600 focus:ring-0 shrink-0"
                                    />
                                    <span className="capitalize text-[11px]">{act}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentScreen('LIST')}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
              >
                Update Assigned Role
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
