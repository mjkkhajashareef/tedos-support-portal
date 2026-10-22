import React, { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  Printer, 
  FileSpreadsheet, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw,
  FileText,
  Users,
  Briefcase,
  Ticket as TicketIcon,
  PhoneCall
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ModuleId } from '../../types';
import { 
  exportWorkLogsToCSV, 
  exportTicketsToCSV, 
  exportClientsToCSV, 
  exportFollowUpsToCSV, 
  printDailyWorkLogReport, 
  exportFullSystemJSON, 
  parseSystemBackupJSON 
} from '../../utils/exportUtils';
import { offlineDb } from '../../utils/indexedDb';
import { motion } from 'motion/react';

interface DataBackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultModule?: ModuleId;
}

export const DataBackupRestoreModal: React.FC<DataBackupRestoreModalProps> = ({
  isOpen,
  onClose,
  defaultModule
}) => {
  const { 
    workLogs, 
    tickets, 
    clients, 
    followUps, 
    users, 
    currentUser, 
    language,
    refreshClients,
    refreshUsers
  } = useApp();
  const isUrdu = language === 'ur';

  const [activeTab, setActiveTab] = useState<'modules' | 'backup' | 'restore'>('modules');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<{
    clients: number;
    workLogs: number;
    tickets: number;
    followUps: number;
  } | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [restoreStatus, setRestoreStatus] = useState<{ type: 'success' | 'error' | 'idle'; message: string }>({
    type: 'idle',
    message: ''
  });
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFile(file);
    setRestoreStatus({ type: 'idle', message: '' });

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = parseSystemBackupJSON(content);
      if (result.success && result.data) {
        setParsedData(result.data);
        setRestorePreview({
          clients: result.data.clients.length,
          workLogs: result.data.workLogs.length,
          tickets: result.data.tickets.length,
          followUps: result.data.followUps.length
        });
        setRestoreStatus({
          type: 'idle',
          message: isUrdu ? 'فائل کی توثیق کامیاب۔ ری اسٹور کرنے کے لیے نیچے بٹن دبائیں۔' : 'File validated. Click Restore below to proceed.'
        });
      } else {
        setRestorePreview(null);
        setParsedData(null);
        setRestoreStatus({
          type: 'error',
          message: result.message
        });
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!parsedData) return;
    setIsRestoring(true);
    try {
      // Save items into indexedDb
      if (parsedData.clients && parsedData.clients.length > 0) {
        for (const c of parsedData.clients) {
          await offlineDb.saveClient(c);
        }
      }
      if (parsedData.workLogs && parsedData.workLogs.length > 0) {
        for (const w of parsedData.workLogs) {
          await offlineDb.saveWorkLog(w);
        }
      }
      if (parsedData.tickets && parsedData.tickets.length > 0) {
        for (const t of parsedData.tickets) {
          await offlineDb.saveTicket(t);
        }
      }

      setRestoreStatus({
        type: 'success',
        message: isUrdu 
          ? 'تمام ڈیٹا کامیابی سے ری اسٹور ہو گیا ہے۔ براؤزر میموری اپ ڈیٹ ہو چکی ہے۔' 
          : 'System data successfully restored into local database.'
      });

      // Trigger refreshes
      await refreshClients();
      await refreshUsers();
    } catch (err: any) {
      setRestoreStatus({
        type: 'error',
        message: isUrdu ? `ری اسٹور کے دوران خرابی: ${err.message}` : `Restore error: ${err.message}`
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Database className="text-blue-300" size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {isUrdu ? 'ڈیٹا ایکسپورٹ، بیک اپ و رپورٹنگ سینٹر' : 'Data Export, Backup & Reports Center'}
              </h2>
              <p className="text-xs text-blue-200">
                {isUrdu 
                  ? 'مختلف ماڈیولز کا CSV/Excel ڈیٹا، پرنٹ ایبل رپورٹس اور مکمل بیک اپ' 
                  : 'Module-specific CSV exports, printable daily reports & JSON full backups'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('modules')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'modules'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet size={15} />
            <span>{isUrdu ? 'ماڈیول وائز ایکسپورٹ (CSV / Reports)' : 'Module Exports'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Download size={15} />
            <span>{isUrdu ? 'مکمل بیک اپ (Full Backup JSON)' : 'Full JSON Backup'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('restore')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'restore'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload size={15} />
            <span>{isUrdu ? 'ڈیٹا ری اسٹور (Restore Backup)' : 'Restore Data'}</span>
          </button>
        </div>

        {/* Tab 1: Module-specific Exports */}
        {activeTab === 'modules' && (
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            <p className="text-xs text-slate-500">
              {isUrdu 
                ? 'ہر ماڈیول کا مکمل ڈیٹا مائیکروسافٹ ایکسل (Excel) اور گوگل شیٹس کے مطابق ڈاؤن لوڈ کریں۔' 
                : 'Export module-specific records into formatted UTF-8 CSV sheets compatible with Microsoft Excel and Google Sheets.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Daily Work Logs Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="text-blue-600" size={18} />
                    <span className="font-bold text-xs">{isUrdu ? 'ڈیلی ورک لاگ (Work Logs)' : 'Work Logs'}</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono font-bold">
                    {workLogs.length} لاگز
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportWorkLogsToCSV(workLogs)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Download size={13} />
                    <span>{isUrdu ? 'ایکسپورٹ CSV' : 'Export CSV'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => printDailyWorkLogReport(workLogs, todayStr, currentUser?.name)}
                    className="py-1.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title={isUrdu ? 'پرنٹ ایبل سمری رپورٹ' : 'Printable Daily Report'}
                  >
                    <Printer size={13} className="text-slate-600" />
                    <span>{isUrdu ? 'پرنٹ' : 'Print'}</span>
                  </button>
                </div>
              </div>

              {/* Tickets Center Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TicketIcon className="text-amber-600" size={18} />
                    <span className="font-bold text-xs">{isUrdu ? 'ٹکٹ سینٹر (Tickets)' : 'Tickets'}</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono font-bold">
                    {tickets.length} ٹکٹس
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => exportTicketsToCSV(tickets)}
                  className="w-full py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Download size={13} />
                  <span>{isUrdu ? 'ٹکٹس ڈیٹا CSV ڈاؤن لوڈ' : 'Export Tickets CSV'}</span>
                </button>
              </div>

              {/* Clients Directory Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="text-emerald-600" size={18} />
                    <span className="font-bold text-xs">{isUrdu ? 'کلائنٹس ڈائریکٹری (Clients)' : 'Clients Directory'}</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                    {clients.length} کلائنٹس
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => exportClientsToCSV(clients)}
                  className="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Download size={13} />
                  <span>{isUrdu ? 'کلائنٹس لسٹ CSV ڈاؤن لوڈ' : 'Export Clients CSV'}</span>
                </button>
              </div>

              {/* Follow-up Tracker Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="text-purple-600" size={18} />
                    <span className="font-bold text-xs">{isUrdu ? 'فالو اپ شیڈول (Follow-ups)' : 'Follow-up Tracker'}</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono font-bold">
                    {followUps.length} فالو اپس
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => exportFollowUpsToCSV(followUps)}
                  className="w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Download size={13} />
                  <span>{isUrdu ? 'فالو اپ ڈیٹا CSV ڈاؤن لوڈ' : 'Export Follow-ups CSV'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Full System JSON Backup */}
        {activeTab === 'backup' && (
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <Database size={16} />
                <span>{isUrdu ? 'مکمل سسٹم سنیپ شاٹ (Full Database Snapshot)' : 'Full Database Snapshot'}</span>
              </div>
              <p>
                {isUrdu 
                  ? 'اس بیک اپ میں تمام کلائنٹس، ورک لاگز، ٹکٹس، فالو اپ شیڈولز اور یوزر اکاؤنٹس ایک محفوظ JSON فائل میں ڈاؤن لوڈ ہو جائیں گے تاکہ کسی بھی ڈیوائس پر منتقل کیے جا سکیں۔' 
                  : 'This packages your entire system state into an encrypted/portable JSON file that can be restored on any device or after browser clearing.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="font-bold text-slate-700 dark:text-slate-300">{isUrdu ? 'موجودہ بیک اپ کا خلاصہ:' : 'Current System Statistics:'}</div>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                <li>• {isUrdu ? 'کل رجسٹرڈ کلائنٹس:' : 'Registered Clients:'} <strong>{clients.length}</strong></li>
                <li>• {isUrdu ? 'کل ڈیلی ورک لاگز:' : 'Work Logs:'} <strong>{workLogs.length}</strong></li>
                <li>• {isUrdu ? 'کل سپورٹ ٹکٹس:' : 'Tickets:'} <strong>{tickets.length}</strong></li>
                <li>• {isUrdu ? 'کل فالو اپ شیڈول:' : 'Follow-ups:'} <strong>{followUps.length}</strong></li>
                <li>• {isUrdu ? 'ملازمین کے پروفائلز:' : 'User Profiles:'} <strong>{users.length}</strong></li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => exportFullSystemJSON({ clients, workLogs, tickets, followUps, users })}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition cursor-pointer"
            >
              <Download size={16} />
              <span>{isUrdu ? 'پورے سسٹم کا بیک اپ ڈاؤن لوڈ کریں (Download Full JSON Backup)' : 'Download Full JSON Backup'}</span>
            </button>
          </div>
        )}

        {/* Tab 3: Restore Backup */}
        {activeTab === 'restore' && (
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle size={16} className="text-amber-600" />
                <span>{isUrdu ? 'احتیاط برائے ری اسٹور (Restore Warning)' : 'Restore Warning'}</span>
              </div>
              <p>
                {isUrdu 
                  ? 'بیک اپ فائل اپ لوڈ کرنے سے اس کے ریکارڈز آپ کے سسٹم ڈیٹا بیس میں محفوظ اور ضم (Merge) ہو جائیں گے۔' 
                  : 'Uploading a backup file will validate and merge records into your active offline database.'}
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition"
            >
              <Upload size={28} className="text-slate-400 group-hover:text-blue-600" />
              <div className="font-bold text-xs text-slate-700 dark:text-slate-300">
                {restoreFile 
                  ? `${restoreFile.name} (${(restoreFile.size / 1024).toFixed(1)} KB)`
                  : (isUrdu ? 'TEDOS بیک اپ فائل (.json) منتخب کریں' : 'Choose TEDOS backup .json file')}
              </div>
              <span className="text-[11px] text-slate-400">
                {isUrdu ? 'کلک کریں یا فائل یہاں ڈراپ کریں' : 'Click to browse files'}
              </span>
            </button>

            {restorePreview && (
              <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-xs space-y-2">
                <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 size={16} />
                  <span>{isUrdu ? 'فائل میں پائے جانے والے ریکارڈز:' : 'Records Found in Backup:'}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800">
                    <div className="font-bold text-sm text-emerald-600">{restorePreview.clients}</div>
                    <div className="text-[10px] text-slate-500">{isUrdu ? 'کلائنٹس' : 'Clients'}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800">
                    <div className="font-bold text-sm text-blue-600">{restorePreview.workLogs}</div>
                    <div className="text-[10px] text-slate-500">{isUrdu ? 'ورک لاگز' : 'Work Logs'}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800">
                    <div className="font-bold text-sm text-amber-600">{restorePreview.tickets}</div>
                    <div className="text-[10px] text-slate-500">{isUrdu ? 'ٹکٹس' : 'Tickets'}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800">
                    <div className="font-bold text-sm text-purple-600">{restorePreview.followUps}</div>
                    <div className="text-[10px] text-slate-500">{isUrdu ? 'فالو اپس' : 'Follow-ups'}</div>
                  </div>
                </div>
              </div>
            )}

            {restoreStatus.message && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                restoreStatus.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : restoreStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                {restoreStatus.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
                <span>{restoreStatus.message}</span>
              </div>
            )}

            {parsedData && restoreStatus.type !== 'success' && (
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isRestoring ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                <span>{isUrdu ? 'ابھی سسٹم میں ری اسٹور کریں (Confirm Restore)' : 'Confirm Restore to System'}</span>
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
