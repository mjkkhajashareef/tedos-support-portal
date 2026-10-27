/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit3,
  Key,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Mail,
  Phone,
  Building2,
  Lock,
  Trash2,
  Eye,
  EyeOff,
  Sliders,
  Briefcase,
  DollarSign,
  ExternalLink,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, UserRole, UserStatus, UserCreate, ModuleId } from '../../types';
import { MaterialCard } from '../common/MaterialCard';
import { motion, AnimatePresence } from 'motion/react';
import { extractWebUrl } from '../../utils/helpers';

export const UserManagementView: React.FC<{ id?: string }> = ({ id }) => {
  const {
    users,
    clients,
    allClients,
    addUser,
    updateUser,
    deactivateUser,
    deleteUser,
    resetUserPassword,
    currentUser,
    setCurrentModule,
    setSelectedClientId,
    language
  } = useApp();

  const isUrdu = language === 'ur';

  const isLeadershipOrManager =
    currentUser?.role === UserRole.DIRECTOR ||
    currentUser?.role === UserRole.COO ||
    currentUser?.role === UserRole.OPERATION_MANAGER ||
    currentUser?.role === UserRole.SUPPORT_MANAGER ||
    currentUser?.role === UserRole.AI_ADMINISTRATOR ||
    currentUser?.email?.toLowerCase() === 'support@philsof.com';

  // Requirement: "User ID password change aur update authority ham main admin rule wale ku rehna aur update bhi hona"
  const isMainAdmin =
    currentUser?.role === UserRole.DIRECTOR ||
    currentUser?.role === UserRole.COO ||
    currentUser?.role === UserRole.CEO ||
    currentUser?.role === UserRole.OPERATION_MANAGER ||
    currentUser?.role === UserRole.SUPPORT_MANAGER ||
    currentUser?.role === UserRole.AI_ADMINISTRATOR ||
    currentUser?.email?.toLowerCase() === 'support@philsof.com' ||
    currentUser?.email?.toLowerCase() === 'coo@technoevident.com' ||
    currentUser?.email?.toLowerCase() === 'om@philsof.com' ||
    currentUser?.email?.toLowerCase() === 'manager@technoevident.com';

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordInModal, setShowPasswordInModal] = useState(false);

  // Copy states
  const [copiedEmpId, setCopiedEmpId] = useState<string | null>(null);
  const [copiedCredentialId, setCopiedCredentialId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState<
    UserCreate & {
      id?: string;
      baseSalary?: number;
      monthlyIncentive?: number;
      isFreelancer?: boolean;
      assignedClients?: string[];
    }
  >({
    employeeId: '',
    name: '',
    designation: 'Support Executive',
    email: '',
    mobile: '',
    role: UserRole.SUPPORT_EXECUTIVE,
    department: 'Customer Support',
    reportingManager: 'Support Manager',
    assignedRegion: 'All India',
    joiningDate: new Date().toISOString().split('T')[0],
    password: '',
    baseSalary: 22000,
    monthlyIncentive: 2500,
    isFreelancer: false,
    assignedClients: []
  });

  const showToast = (type: 'success' | 'error', text: string) => {
    setActionAlert({ type, text });
    setTimeout(() => setActionAlert(null), 4500);
  };

  const normalizeMobile = (raw?: string) => {
    const digits = (raw || '').replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  // Copy Employee ID helper (Requirement #1: "Team user management me employee ID copy nahi ho rahi hai")
  const handleCopyEmployeeId = async (empId: string, userId: string) => {
    const textToCopy = (empId || '').trim();
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = textToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedEmpId(userId);
    showToast(
      'success',
      isUrdu
        ? `ایمپلائی آئی ڈی (${textToCopy}) کاپی ہو گئی!`
        : `Employee ID (${textToCopy}) copied to clipboard!`
    );
    setTimeout(() => setCopiedEmpId(null), 2500);
  };

  // Get assigned clients for any user
  const getAssignedClientsForUser = (user: User) => {
    const sourceClients = allClients && allClients.length > 0 ? allClients : clients;
    const uname = (user.name || '').trim().toLowerCase();
    const firstToken = uname.split(' ')[0];
    const explicitIds = new Set(user.assignedClients || []);
    return sourceClients.filter(c => {
      if (explicitIds.has(c.id) || (c.teId && explicitIds.has(c.teId))) return true;
      const exec = (c.assignedExecutive || c.assignedSupport || '').trim().toLowerCase();
      if (!exec) return false;
      return exec === uname || exec.includes(firstToken) || firstToken.includes(exec);
    });
  };

  // ============================================================================
  // SUPPORT EXECUTIVE VIEW: Own Profile + Assigned Clients Roster (Req #15 & #16)
  // ============================================================================
  if (!isLeadershipOrManager && currentUser) {
    const myAssignedClients = getAssignedClientsForUser(currentUser);

    return (
      <div id={id || 'user-management-exec-view'} className="space-y-6 max-w-6xl mx-auto pb-12">
        {actionAlert && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{actionAlert.text}</span>
          </div>
        )}

        {/* Executive Personal Profile & Employee ID Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-slate-900 dark:text-white">
                  {currentUser.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  {currentUser.role}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  ID: {currentUser.employeeId}
                  <button
                    type="button"
                    onClick={() => handleCopyEmployeeId(currentUser.employeeId, currentUser.id)}
                    className="ml-1 p-1 rounded hover:bg-blue-500/10 text-blue-600 cursor-pointer"
                    title="Copy Employee ID"
                  >
                    {copiedEmpId === currentUser.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>
                </span>
                <span>📧 {currentUser.email}</span>
                <span>📞 {currentUser.mobile}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-[10px] font-mono uppercase text-emerald-700 dark:text-emerald-400 block font-bold">
                {isUrdu ? 'میرے تفویض کردہ کلائنٹس' : 'My Assigned Clients'}
              </span>
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {myAssignedClients.length}
              </span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
              <span className="text-[10px] font-mono uppercase text-blue-700 dark:text-blue-400 block font-bold">
                {isUrdu ? 'ماہانہ تنخواہ + انعام' : 'Salary + Incentive KPI'}
              </span>
              <span className="text-lg font-black text-blue-700 dark:text-blue-300">
                ₹{(currentUser.baseSalary || 22000).toLocaleString()} + ₹{(currentUser.monthlyIncentive || 2500).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Executive's Assigned Clients Table */}
        <MaterialCard variant="elevated" className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-blue-600" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {isUrdu
                  ? `میرے تفویض کردہ کلائنٹس (${currentUser.name})`
                  : `Clients Assigned to ${currentUser.name} (Strict Roster)`}
              </h2>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-3 py-1 rounded-full">
              {isUrdu ? 'صرف آپ کے کلائنٹس' : 'Only Your Assigned Clients'}
            </span>
          </div>

          {myAssignedClients.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              {isUrdu ? 'ابھی آپ کو کوئی کلائنٹ تفویض نہیں کیا گیا۔' : 'No clients currently assigned to your ID.'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
              {myAssignedClients.map(client => {
                const cleanUrl = extractWebUrl(client.url || client.deploymentUrl || client.softwareUrl);
                const isCritical = client.status === 'Critical' || client.status === 'Pending';
                const isWarning = client.status === 'Warning' || client.status === 'Not Answering';

                return (
                  <div
                    key={client.id}
                    className="p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500/70 hover:shadow-md transition-all flex flex-col justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 truncate">
                          {client.teId || client.id}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isCritical
                              ? 'bg-rose-500 ring-2 ring-rose-200'
                              : isWarning
                              ? 'bg-amber-500 ring-2 ring-amber-200'
                              : 'bg-emerald-500 ring-2 ring-emerald-200'
                          }`}
                          title={client.status || 'Active'}
                        />
                      </div>
                      <h4 className="font-extrabold text-[12px] text-slate-900 dark:text-white truncate" title={client.name}>
                        {client.name}
                      </h4>
                      {client.department && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          🏢 {client.department}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                      {cleanUrl && (
                        <a
                          href={cleanUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900 transition"
                          title="Open Software"
                        >
                          <ExternalLink size={11} />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClientId(client.id);
                          setCurrentModule(ModuleId.DAILY_WORK_LOG);
                        }}
                        className="flex-1 py-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold cursor-pointer transition"
                      >
                        {isUrdu ? 'لاگ' : 'Log'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClientId(client.id);
                          setCurrentModule(ModuleId.CLIENT_WORKSPACE);
                        }}
                        className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer transition"
                        title="Workspace"
                      >
                        <Briefcase size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </MaterialCard>
      </div>
    );
  }

  // ============================================================================
  // LEADERSHIP & MANAGER VIEW: Full Team User Management, Copy/Edit ID & Clients
  // ============================================================================
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
        (u.mobile && u.mobile.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      employeeId: `TE-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      designation: 'Support Executive',
      email: '',
      mobile: '',
      role: UserRole.SUPPORT_EXECUTIVE,
      department: 'Customer Support',
      reportingManager: 'Support Manager',
      assignedRegion: 'All India',
      joiningDate: new Date().toISOString().split('T')[0],
      password: 'Admin@123',
      baseSalary: 22000,
      monthlyIncentive: 2500,
      isFreelancer: false,
      assignedClients: []
    });
    setShowPasswordInModal(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    const userClients = getAssignedClientsForUser(user).map(c => c.id);
    setEditingUser(user);
    setFormData({
      id: user.id,
      employeeId: user.employeeId || '',
      name: user.name,
      designation: user.designation || user.role,
      email: user.email,
      mobile: user.mobile || '',
      role: user.role,
      department: user.department || 'Customer Support',
      reportingManager: user.reportingManager || 'Support Manager',
      assignedRegion: user.assignedRegion || 'All India',
      joiningDate: user.joiningDate || new Date().toISOString().split('T')[0],
      password: user.password || 'Admin@123',
      baseSalary: user.baseSalary || 22000,
      monthlyIncentive: user.monthlyIncentive || 2500,
      isFreelancer: user.isFreelancer || false,
      assignedClients: userClients
    });
    setShowPasswordInModal(false);
    setIsModalOpen(true);
  };

  const handleToggleAssignClient = (clientId: string) => {
    setFormData(prev => {
      const currentList = prev.assignedClients || [];
      const nextList = currentList.includes(clientId)
        ? currentList.filter(id => id !== clientId)
        : [...currentList, clientId];
      return { ...prev, assignedClients: nextList };
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.employeeId.trim()) {
      showToast('error', isUrdu ? 'برائے مہربانی نام، ایمپلائی آئی ڈی اور ای میل درج کریں۔' : 'Please fill in Name, Employee ID, and Email.');
      return;
    }

    // Check unique mobile rule ("Ek mobile no. Ki ek hi ID banni chahiye")
    const cleanPhone = normalizeMobile(formData.mobile);
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('error', isUrdu ? 'برائے مہربانی درست 10 ہندسوں کا موبائل نمبر درج کریں۔' : 'Please enter a valid 10-digit mobile number.');
      return;
    }

    const duplicateMobileUser = users.find(
      u => u.id !== editingUser?.id && normalizeMobile(u.mobile) === cleanPhone
    );
    if (duplicateMobileUser) {
      showToast(
        'error',
        isUrdu
          ? `ایک موبائل نمبر کی ایک ہی آئی ڈی بن سکتی ہے! یہ نمبر پہلے سے ${duplicateMobileUser.name} (${duplicateMobileUser.employeeId}) کے نام پر موجود ہے۔`
          : `Ek mobile no. ki ek hi ID banni chahiye! Mobile ${cleanPhone} is already registered to ${duplicateMobileUser.name} (${duplicateMobileUser.employeeId}).`
      );
      return;
    }

    const duplicateEmpIdUser = users.find(
      u => u.id !== editingUser?.id && (u.employeeId || '').trim().toLowerCase() === formData.employeeId.trim().toLowerCase()
    );
    if (duplicateEmpIdUser) {
      showToast(
        'error',
        isUrdu
          ? `ایمپلائی آئی ڈی ${formData.employeeId} پہلے سے ${duplicateEmpIdUser.name} کو دی گئی ہے۔`
          : `Employee ID "${formData.employeeId}" is already assigned to ${duplicateEmpIdUser.name}.`
      );
      return;
    }

    // Requirement: "User ID password change aur update authority ham main admin rule wale ku rehna aur update bhi hona"
    if (editingUser && !isMainAdmin) {
      const isIdChanged = formData.employeeId.trim().toLowerCase() !== (editingUser.employeeId || '').trim().toLowerCase();
      const isEmailChanged = formData.email.trim().toLowerCase() !== (editingUser.email || '').trim().toLowerCase();
      const isPassChanged = formData.password && formData.password !== editingUser.password;

      if (isIdChanged || isEmailChanged || isPassChanged) {
        showToast(
          'error',
          isUrdu
            ? 'یوزر آئی ڈی اور پاس ورڈ تبدیل کرنے کا اختیار صرف مین ایڈمن (Director / support@philsof.com) کے پاس ہے۔'
            : 'User ID and Password change authority is strictly restricted to Main Admin (Director / support@philsof.com).'
        );
        return;
      }
    }

    try {
      if (editingUser) {
        await updateUser({
          ...editingUser,
          employeeId: formData.employeeId.trim(),
          name: formData.name.trim(),
          designation: formData.designation,
          email: formData.email.trim().toLowerCase(),
          mobile: formData.mobile.trim(),
          role: formData.role,
          department: formData.department,
          reportingManager: formData.reportingManager,
          assignedRegion: formData.assignedRegion,
          password: formData.password || editingUser.password || 'Admin@123',
          baseSalary: Number(formData.baseSalary) || 22000,
          monthlyIncentive: Number(formData.monthlyIncentive) || 2500,
          isFreelancer: Boolean(formData.isFreelancer),
          assignedClients: formData.assignedClients || []
        });
        showToast(
          'success',
          isUrdu
            ? `${formData.name} کی ایمپلائی آئی ڈی (${formData.employeeId}) اور تفصیلات اپ ڈیٹ ہو گئیں!`
            : `Updated ${formData.name} (Employee ID: ${formData.employeeId}) successfully!`
        );
      } else {
        await addUser({
          ...formData,
          employeeId: formData.employeeId.trim(),
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          mobile: formData.mobile.trim(),
          password: formData.password || 'Admin@123'
        });
        showToast(
          'success',
          isUrdu
            ? `نیا اکاؤنٹ ${formData.name} (${formData.employeeId}) کامیابی سے بن گیا!`
            : `Created account for ${formData.name} (${formData.employeeId})!`
        );
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to save user.');
    }
  };

  const handleCopyCredentials = async (user: User) => {
    const pass = user.password || 'Admin@123';
    const text = `TEDOS Login\nEmployee ID: ${user.employeeId}\nName: ${user.name}\nRole: ${user.role}\nEmail: ${user.email}\nPassword: ${pass}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
    }
    setCopiedCredentialId(user.id);
    showToast('success', isUrdu ? 'مکمل لاگ ان تفصیلات کاپی ہو گئیں!' : 'Credentials copied to clipboard!');
    setTimeout(() => setCopiedCredentialId(null), 2500);
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const sourceAllClients = allClients && allClients.length > 0 ? allClients : clients;

  return (
    <div id={id || 'user-management-view'} className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <Users size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isUrdu ? 'ٹیم یوزر مینیجمنٹ، ایمپلائی آئی ڈی اور کلائنٹ تفویض' : 'Team User Management, Employee ID & Client Roster'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                1 Mobile = 1 Unique ID
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {isUrdu
                ? 'ہر ملازم کی ایمپلائی آئی ڈی کاپی یا ایڈٹ کریں، تنخواہ اور کے پی آئی مقرر کریں، اور ہر ایگزیکٹو کے کلائنٹس تفویض کریں۔ ایک موبائل نمبر پر صرف ایک ہی آئی ڈی بن سکتی ہے۔'
                : 'Copy or edit Employee IDs, manage salaries/freelancer KPIs, and assign clients per executive. Strictly enforces 1 Mobile Number = 1 ID.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCurrentModule(ModuleId.SETTINGS)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs transition-all cursor-pointer"
          >
            <Sliders size={16} />
            <span>{isUrdu ? 'رول چیک باکسز (Settings)' : 'Role Module Checkboxes'}</span>
          </button>

          <button
            type="button"
            id="create-new-user-btn"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <UserPlus size={16} />
            <span>{isUrdu ? '+ نیا ممبر / آئی ڈی بنائیں' : '+ Add New Team Member'}</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      <AnimatePresence>
        {actionAlert && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold ${
              actionAlert.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionAlert.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{actionAlert.text}</span>
            </div>
            <button onClick={() => setActionAlert(null)} className="text-[10px] underline cursor-pointer">
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Role Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={
              isUrdu
                ? 'نام، ایمپلائی آئی ڈی، موبائل نمبر یا رول سے تلاش کریں...'
                : 'Search by Name, Employee ID, Mobile No., Email or Role...'
            }
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="ALL">{isUrdu ? 'تمام کردار (All Roles)' : 'All Roles'}</option>
            {Object.values(UserRole).map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <MaterialCard variant="elevated" className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">{isUrdu ? 'ایمپلائی آئی ڈی (کاپی / ایڈٹ)' : 'Employee ID (Copy / Edit)'}</th>
                <th className="py-3.5 px-4">{isUrdu ? 'ممبر اور موبائل نمبر' : 'Team Member & Mobile'}</th>
                <th className="py-3.5 px-4">{isUrdu ? 'عہدہ / تنخواہ و کے پی آئی' : 'Role & Salary KPI'}</th>
                <th className="py-3.5 px-4">{isUrdu ? 'تفویض کردہ کلائنٹس' : 'Assigned Clients Roster'}</th>
                <th className="py-3.5 px-4">{isUrdu ? 'لاگ ان آئی ڈی اور پاس ورڈ' : 'Login Credentials'}</th>
                <th className="py-3.5 px-4 text-right">{isUrdu ? 'ایڈٹ / ایکشن' : 'Edit / Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs">
              {filteredUsers.map(user => {
                const isMasterAdmin = user.email.toLowerCase() === 'support@philsof.com';
                const showPass = visiblePasswords[user.id] || false;
                const userClients = getAssignedClientsForUser(user);

                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors ${
                      !user.active ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Column 1: Employee ID with 1-Click Copy + Direct Edit */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/25">
                        <span className="font-mono font-black text-xs text-blue-700 dark:text-blue-300 select-all">
                          {user.employeeId || 'TE-001'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyEmployeeId(user.employeeId || 'TE-001', user.id)}
                          className={`p-1 rounded-lg transition cursor-pointer ${
                            copiedEmpId === user.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white dark:bg-slate-800 text-blue-600 hover:bg-blue-600 hover:text-white'
                          }`}
                          title={isUrdu ? 'ایمپلائی آئی ڈی کاپی کریں' : 'Copy Employee ID'}
                        >
                          {copiedEmpId === user.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(user)}
                          className="p-1 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-500 hover:text-white transition cursor-pointer"
                          title={isUrdu ? 'ایمپلائی آئی ڈی ایڈٹ کریں' : 'Edit Employee ID & Profile'}
                        >
                          <Edit3 size={12} />
                        </button>
                      </div>
                    </td>

                    {/* Column 2: Member Name & Unique Mobile No. */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {user.isFreelancer && (
                              <span className="px-1.5 py-0.5 text-[9px] rounded bg-amber-500/15 text-amber-600 font-bold">
                                Freelancer
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone size={11} className="text-emerald-600" />
                            <span>{user.mobile || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 3: Role & Salary / Incentive KPI */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {user.role}
                      </span>
                      <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 mt-1">
                        💰 Base: <strong>₹{(user.baseSalary || 20000).toLocaleString()}</strong> | KPI: <strong>+₹{(user.monthlyIncentive || 2000).toLocaleString()}</strong>
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                        ⭐ 80% Happy Clients: +₹2,000 Incentive
                      </span>
                    </td>

                    {/* Column 4: Assigned Clients Roster (Small Boxes Display) */}
                    <td className="py-3.5 px-4">
                      {userClients.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(user)}
                          className="px-2.5 py-1 rounded-lg border border-dashed border-blue-400 text-[11px] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 font-bold transition cursor-pointer"
                        >
                          {isUrdu ? '+ کلائنٹس تفویض کریں' : '+ Assign Clients'}
                        </button>
                      ) : (
                        <div className="space-y-1.5 max-w-[280px]">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-mono font-bold text-[10px] flex items-center gap-1">
                              <Building2 size={11} />
                              {userClients.length} {isUrdu ? 'کلائنٹس' : 'Clients'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(user)}
                              className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition cursor-pointer"
                              title="Edit Assigned Clients"
                            >
                              <Edit3 size={10} />
                            </button>
                          </div>
                          {/* Compact Small Boxes Grid */}
                          <div className="grid grid-cols-2 gap-1">
                            {userClients.slice(0, 4).map(c => (
                              <div
                                key={c.id}
                                className="px-1.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-[9px] font-bold truncate hover:border-blue-400 transition"
                                title={`${c.name} (${c.teId || c.id})`}
                              >
                                <span className="block truncate">🔲 {c.name}</span>
                              </div>
                            ))}
                          </div>
                          {userClients.length > 4 && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(user)}
                              className="text-[9px] font-mono font-bold text-blue-600 hover:underline cursor-pointer block"
                            >
                              +{userClients.length - 4} {isUrdu ? 'مزید کلائنٹس...' : 'more clients...'}
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Column 5: Login Email & Password */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                          <Mail size={12} className="text-slate-400" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Lock size={12} className="text-slate-400" />
                          <span>{showPass ? user.password || 'Admin@123' : '••••••••'}</span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="p-0.5 hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            {showPass ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyCredentials(user)}
                            className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-slate-600 dark:text-slate-300 cursor-pointer"
                            title="Copy Full Login Credentials"
                          >
                            {copiedCredentialId === user.id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Column 6: Explicit Edit Button + Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(user)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition cursor-pointer"
                          title={isUrdu ? 'ایمپلائی آئی ڈی اور پروفائل ایڈٹ کریں' : 'Edit Employee ID, Mobile & Assigned Clients'}
                        >
                          <Edit3 size={12} />
                          <span>{isUrdu ? 'ایڈٹ (Edit)' : 'Edit'}</span>
                        </button>

                        {!isMasterAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => deactivateUser(user.id)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                user.active
                                  ? 'border-slate-200 dark:border-slate-700 hover:bg-rose-50 text-slate-600 hover:text-rose-600'
                                  : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              }`}
                              title={user.active ? 'Deactivate' : 'Activate'}
                            >
                              {user.active ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteUser(user.id)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </MaterialCard>

      {/* Create / Edit User & Client Roster Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            >
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-600 text-white">
                    {editingUser ? <Edit3 size={18} /> : <UserPlus size={18} />}
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white">
                      {editingUser
                        ? isUrdu
                          ? 'ایمپلائی آئی ڈی، پروفائل اور کلائنٹس ایڈٹ کریں'
                          : `Edit Team Member & Employee ID (${editingUser.name})`
                        : isUrdu
                          ? 'نیا ٹیم ممبر شامل کریں'
                          : 'Create New Team Member Account'}
                    </h2>
                    <span className="text-[10px] text-emerald-600 font-bold">
                      {isUrdu ? 'اصول: ایک موبائل نمبر کی صرف ایک ہی آئی ڈی بنے گی' : 'Rule: 1 Mobile Number = 1 Unique Employee ID'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs overflow-y-auto">
                {/* Main Admin Authority Notice (Requirement: "User ID password change aur update authority ham main admin rule wale ku rehna aur update bhi hona") */}
                {editingUser && !isMainAdmin ? (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center gap-2.5">
                    <Lock size={16} className="text-amber-600 shrink-0" />
                    <div>
                      <span>
                        {isUrdu
                          ? 'اختیار محدود ہے: یوزر آئی ڈی (Employee ID / Email) اور پاس ورڈ تبدیل کرنے کا اختیار صرف مین ایڈمن (Director / support@philsof.com) کے پاس ہے۔'
                          : 'Authority Restricted: User ID (Employee ID / Email) and Password can only be changed by Main Admin (Director / support@philsof.com).'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                    <span>
                      {isUrdu
                        ? 'مین ایڈمن اختیار فعال: آپ ملازمین کی یوزر آئی ڈی اور پاس ورڈ تبدیل کر سکتے ہیں جو تمام سسٹمز پر فوری اپ ڈیٹ ہو جائے گا۔'
                        : 'Main Admin Authority: You can update User ID, Email and Passwords across all systems.'}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Editable Employee ID + Copy button right inside modal */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>{isUrdu ? 'ایمپلائی آئی ڈی (Employee ID) *' : 'Employee ID (User ID) *'}</span>
                      {editingUser && !isMainAdmin && (
                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 font-mono">
                          <Lock size={10} /> Locked
                        </span>
                      )}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        required
                        disabled={Boolean(editingUser && !isMainAdmin)}
                        value={formData.employeeId}
                        onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                        placeholder="TE-SUP-101"
                        className={`flex-1 px-3 py-2 rounded-xl border-2 font-mono font-bold focus:outline-none ${
                          editingUser && !isMainAdmin
                            ? 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700 cursor-not-allowed'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-blue-500/40 focus:border-blue-600'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyEmployeeId(formData.employeeId, editingUser?.id || 'modal')}
                        className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 cursor-pointer shrink-0"
                        title="Copy Employee ID"
                      >
                        <Copy size={13} />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isUrdu ? 'مکمل نام (Full Name) *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Umar Farooq / Farman"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isUrdu ? 'موبائل نمبر (1 Mobile = 1 ID) *' : 'Mobile No. (1 Mobile = 1 Unique ID) *'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="10-digit Mobile Number"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>{isUrdu ? 'لاگ ان ای میل (Login Email) *' : 'Login Email *'}</span>
                      {editingUser && !isMainAdmin && (
                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 font-mono">
                          <Lock size={10} /> Locked
                        </span>
                      )}
                    </label>
                    <input
                      type="email"
                      required
                      disabled={Boolean(editingUser && !isMainAdmin)}
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="member@technoevident.com"
                      className={`w-full px-3 py-2 rounded-xl border font-mono ${
                        editingUser && !isMainAdmin
                          ? 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700 cursor-not-allowed'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isUrdu ? 'سسٹم رول (System Role) *' : 'System Role *'}
                    </label>
                    <select
                      value={formData.role}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          role: e.target.value as UserRole,
                          designation: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    >
                      {Object.values(UserRole).map(role => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>{isUrdu ? 'پاس ورڈ (Password) *' : 'Account Password *'}</span>
                      {editingUser && !isMainAdmin && (
                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 font-mono">
                          <Lock size={10} /> Admin Only
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswordInModal ? 'text' : 'password'}
                        required
                        disabled={Boolean(editingUser && !isMainAdmin)}
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className={`w-full px-3 py-2 pr-9 rounded-xl border font-mono ${
                          editingUser && !isMainAdmin
                            ? 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700 cursor-not-allowed'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showPasswordInModal ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Salary & Incentive KPI */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isUrdu ? 'بنیادی تنخواہ (Base Salary ₹)' : 'Monthly Base Salary (₹)'}
                    </label>
                    <input
                      type="number"
                      value={formData.baseSalary || 20000}
                      onChange={e => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isUrdu ? 'ماہانہ انعام (80% Happy کلائنٹس پر ₹2,000)' : 'Monthly KPI Incentive (₹2,000 for 80% Happy Clients)'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.monthlyIncentive || 2000}
                        onChange={e => setFormData({ ...formData, monthlyIncentive: Number(e.target.value) })}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                      <label className="flex items-center gap-1.5 cursor-pointer font-bold text-amber-600 shrink-0">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.isFreelancer)}
                          onChange={e => setFormData({ ...formData, isFreelancer: e.target.checked })}
                        />
                        <span>Freelancer</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Assign Clients to this Executive (Req #15 & #16 - Small Boxes View) */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-800 dark:text-slate-200">
                      {isUrdu
                        ? 'اس ایگزیکٹو کے کلائنٹس منتخب کریں (Small Boxes):'
                        : 'Select Assigned Clients (Small Boxes):'}
                    </label>
                    <span className="text-[10px] font-mono font-bold text-blue-600">
                      {(formData.assignedClients || []).length} Selected
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    {sourceAllClients.map(client => {
                      const isChecked = (formData.assignedClients || []).includes(client.id);
                      return (
                        <label
                          key={client.id}
                          className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition select-none ${
                            isChecked
                              ? 'border-blue-500 bg-blue-500/10 text-blue-900 dark:text-blue-200 font-bold shadow-2xs'
                              : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleAssignClient(client.id)}
                            className="rounded text-blue-600 focus:ring-0 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="block truncate text-[11px] font-semibold">{client.name}</span>
                            <span className="block text-[9px] text-slate-400 font-mono truncate">
                              {client.teId || client.id}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    {isUrdu ? 'منسوخ کریں' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    {editingUser ? (isUrdu ? 'تبدیلیاں محفوظ کریں' : 'Save Changes') : (isUrdu ? 'اکاؤنٹ بنائیں' : 'Create Account')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
