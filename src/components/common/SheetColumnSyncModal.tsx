/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  FileSpreadsheet,
  Check,
  Copy,
  Globe,
  User,
  ExternalLink,
  Code2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Database,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SAMPLE_ROW = `100026B254\tRH Public School Yaqutpura Hyd TG\t8801916306\t\tUmar Farooq\tEdsof\tmonthly\tConnected\t\t\t2026-10-03\tNot Answering\t\t\t https://rh.edsof.com/user\trh@edsof.com\t\t\tI have been trying to call since last week, but he isn't picking up the phone.\tHappy\t03/10/2026\t\t\t\tSyeda  Shahiya Tahniyath\t`;

const GAS_UPDATED_CODE = `/**
 * Google Apps Script - Automated Column O (URL) & Column P (Login) Sync
 * Deploy this in Extensions > Apps Script to auto-sync all client software links!
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'getClients';
  
  if (action === 'getClients') {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    // Read from "ultimate support control" or first sheet
    var sheet = ss.getSheetByName("ultimate support control") || 
                ss.getSheetByName("Support Clients") || 
                ss.getSheets()[0];
                
    var values = sheet.getDataRange().getValues();
    var clients = [];
    
    // Skip header row 0, iterate all data rows
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (!row[0] && !row[1]) continue;
      
      clients.push({
        teId: String(row[0] || '').trim(),                 // Column A: TE ID
        name: String(row[1] || '').trim(),                 // Column B: School/Client Name
        clientContact: row[2] || '',                       // Column C: Client Contact
        operatorContact: row[3] || '',                     // Column D: Operator Contact
        assignedSupport: row[4] || '',                     // Column E: Assigned Executive
        department: row[5] || '',                          // Column F: Department (Edsof/TaleemPro/Philsof)
        plan: row[6] || '',                                // Column G: Subscription Plan
        status: row[7] || 'Active',                        // Column H: Status
        
        // ⭐ CRITICAL URL & LOGIN (COLUMNS O, P & S) ⭐
        url: String(row[14] || '').trim(),                 // Column O (Index 14): Software URL
        softwareUrl: String(row[14] || '').trim(),
        login: String(row[15] || '').trim(),               // Column P (Index 15): Login / Email
        softwareLogin: String(row[15] || '').trim(),
        specialManagerRemark: String(row[18] || '').trim(),// Column S (Index 18): Notes/Remarks
        noteSaad: String(row[18] || '').trim(),
        satisfaction: String(row[19] || '').trim(),        // Column T: Client State
        nextFollowUpDate: String(row[20] || '').trim(),    // Column U: Next Follow-up
        executive: String(row[24] || '').trim()            // Column Y: Created By
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      count: clients.length,
      clients: clients
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "API Live" }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

export const SheetColumnSyncModal: React.FC = () => {
  const {
    isSheetSyncModalOpen,
    setSheetSyncModalOpen,
    importSheetRowData,
    refreshClients,
    language
  } = useApp();

  const isUrdu = language === 'ur';
  const [activeTab, setActiveTab] = useState<'paste' | 'gas'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ count: number; names: string[] } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Parse preview of pasted data in real time
  const previewItems = React.useMemo(() => {
    if (!pastedText.trim()) return [];
    const lines = pastedText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parsed: Array<{
      teId: string;
      name: string;
      url: string;
      login: string;
      phone: string;
      assigned: string;
      dept: string;
      remarks: string;
    }> = [];

    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length < 2) continue;
      parsed.push({
        teId: (parts[0] || '').trim(),
        name: (parts[1] || '').trim(),
        phone: (parts[2] || '').trim(),
        assigned: parts.length > 4 ? (parts[4] || '').trim() : '',
        dept: parts.length > 5 ? (parts[5] || '').trim() : '',
        url: parts.length > 14 ? (parts[14] || '').trim() : '',
        login: parts.length > 15 ? (parts[15] || '').trim() : '',
        remarks: parts.length > 18 ? (parts[18] || '').trim() : ''
      });
    }
    return parsed;
  }, [pastedText]);

  const handleApply = async () => {
    if (!pastedText.trim()) return;
    setIsProcessing(true);
    try {
      const result = await importSheetRowData(pastedText);
      setSuccessInfo({ count: result.count, names: result.importedClients });
      setTimeout(() => {
        refreshClients();
      }, 500);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyGasCode = () => {
    navigator.clipboard.writeText(GAS_UPDATED_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  if (!isSheetSyncModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black">
                  {isUrdu ? 'گوگل شیٹ کالم O (URL) اور P (Login) سنک ٹول' : 'Google Sheet Column O & P Sync Tool'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
                  Real Data
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                {isUrdu
                  ? 'شیٹ سے اصل سافٹ ویئر URL اور Login ID فوری لوڈ کریں • کوئی غلط یا رینڈم لنک نہیں'
                  : 'Import exact Software URLs & Login IDs from "ultimate support control" sheet tab'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSheetSyncModalOpen(false)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 pt-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'paste'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles size={14} />
            <span>{isUrdu ? '1. فوری شیٹ ڈیٹا پیسٹ کریں (Instant Paste)' : '1. Instant Paste Sheet Rows'}</span>
            {previewItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                {previewItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gas')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'gas'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Code2 size={14} />
            <span>{isUrdu ? '2. گوگل ایپس اسکرپٹ خودکار کوڈ (Permanent Auto-Sync)' : '2. Permanent Apps Script Code'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {activeTab === 'paste' ? (
            <div className="space-y-4">
              {/* Informative explanation banner */}
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
                  <AlertCircle size={15} />
                  <span>{isUrdu ? 'کیسے کام کرتا ہے؟' : 'How this works:'}</span>
                </div>
                <p className="leading-relaxed">
                  {isUrdu
                    ? 'آپ اپنی گوگل شیٹ کے "ultimate support control" ٹیب سے ایک یا تمام قطاریں (Rows) سلیکٹ کر کے کاپی کریں اور نیچے باکس میں پیسٹ کریں۔ سسٹم خود بخود Column O سے سافٹ ویئر کا URL اور Column P سے Login نکال کر محفوظ کر دے گا۔'
                    : 'Select one or multiple rows from your Google Sheet "ultimate support control" tab, copy (Ctrl+C), and paste directly below. The system automatically reads Column O (Software URL) and Column P (Login ID) and assigns them to each client.'}
                </p>
                <div className="pt-1 flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPastedText(SAMPLE_ROW)}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] hover:bg-blue-700 transition cursor-pointer"
                  >
                    {isUrdu ? 'RH Public School کا نمونہ ڈیٹا لوڈ کریں' : 'Load RH Public School Sample'}
                  </button>
                  {pastedText && (
                    <button
                      type="button"
                      onClick={() => setPastedText('')}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] hover:bg-slate-300 transition cursor-pointer"
                    >
                      {isUrdu ? 'صاف کریں (Clear)' : 'Clear Box'}
                    </button>
                  )}
                </div>
              </div>

              {/* Paste Input Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isUrdu ? 'گوگل شیٹ کا کاپی شدہ ڈیٹا یہاں پیسٹ کریں:' : 'Paste Copied Rows from Google Sheet below:'}
                </label>
                <textarea
                  rows={4}
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  placeholder={`100026B254\tRH Public School Yaqutpura Hyd TG\t8801916306\t\tUmar Farooq\tEdsof\tmonthly\tConnected\t\t\t2026-10-03\tNot Answering\t\t\t https://rh.edsof.com/user\trh@edsof.com\t...`}
                  className="w-full p-3 font-mono text-xs rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Live Preview */}
              {previewItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Database size={13} className="text-emerald-600" />
                      <span>{isUrdu ? `پہچانے گئے کلائنٹس (${previewItems.length}):` : `Detected Client Records (${previewItems.length}):`}</span>
                    </span>
                  </div>

                  <div className="max-h-52 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                    {previewItems.map((item, idx) => (
                      <div key={idx} className="p-3 bg-white dark:bg-slate-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[11px]">
                              {item.teId || `Row #${idx + 1}`}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </span>
                            {item.dept && (
                              <span className="text-[10px] text-slate-500 font-bold">
                                🏢 {item.dept}
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                            {item.url ? (
                              <span className="text-blue-600 dark:text-blue-400 font-mono font-bold flex items-center gap-1">
                                <Globe size={11} />
                                <span className="truncate max-w-xs">{item.url}</span>
                              </span>
                            ) : (
                              <span className="text-amber-600 italic">No URL (Col O empty)</span>
                            )}

                            {item.login && (
                              <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
                                <User size={11} />
                                <span>{item.login}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {item.url && (
                          <a
                            href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold text-[11px] hover:bg-blue-100 transition flex items-center gap-1 shrink-0"
                          >
                            <span>Open URL</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Notification */}
              {successInfo && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-3 animate-fade-in">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-bold">
                      {isUrdu ? 'ڈیٹا کامیابی سے محفوظ ہو گیا!' : 'Successfully Imported & Saved!'}
                    </h4>
                    <p className="mt-0.5 text-[11px]">
                      {isUrdu
                        ? `${successInfo.count} کلائنٹ ریکارڈز کے لیے Column O اور Column P مستقل محفوظ کر دیے گئے ہیں۔`
                        : `Successfully updated ${successInfo.count} client software URLs and credentials across the system.`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                  <AlertCircle size={15} />
                  <span>{isUrdu ? 'مسئلے کی اصل وجہ اور مستقل حل' : 'Root Cause & Permanent Fix:'}</span>
                </div>
                <p className="leading-relaxed">
                  {isUrdu
                    ? 'آپ کی موجودہ Google Apps Script میں doGet صرف پہلے 8 کالمز (A سے H تک) ریٹرن کر رہی تھی۔ اس لیے Column O (URL) اور Column P (Login) سافٹ ویئر میں نہیں آ رہے تھے۔ نیچے دیے گئے کوڈ کو اپنی شیٹ کے Apps Script میں لگا دیں تو ہر کلائنٹ کا لنک خود بخود لائیو آئے گا۔'
                    : 'The Google Apps Script deployed in your Google Sheet only loops up to column index 7 (Columns A to H), omitting Column O (index 14) and Column P (index 15). Updating the Apps Script code with the snippet below permanently provides full real-time Column O & P sync.'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Code2 size={14} className="text-blue-600" />
                    <span>{isUrdu ? 'گوگل ایپس اسکرپٹ اپڈیٹ کوڈ:' : 'Updated Google Apps Script Code:'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyGasCode}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedCode ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
                    <span>{copiedCode ? (isUrdu ? 'کاپی ہو گیا!' : 'Copied!') : (isUrdu ? 'کوڈ کاپی کریں' : 'Copy Apps Script Code')}</span>
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 text-slate-200 font-mono text-[11px] max-h-60 overflow-y-auto border border-slate-800">
                  <pre>{GAS_UPDATED_CODE}</pre>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <span className="font-bold">{isUrdu ? 'آسان 4 قدم:' : 'Easy 4-Step Instructions:'}</span>
                <ol className="list-decimal list-inside space-y-1 text-[11px]">
                  <li>{isUrdu ? 'اپنی گوگل شیٹ میں Extensions > Apps Script اوپن کریں۔' : 'In your Google Sheet, open Extensions > Apps Script.'}</li>
                  <li>{isUrdu ? 'Code.gs کے اندر پرانے doGet کو ہٹا کر یہ کوڈ پیسٹ کریں۔' : 'Replace the doGet function in Code.gs with this code.'}</li>
                  <li>{isUrdu ? 'اوپر Deploy > Manage Deployments پر کلک کر کے New Version منتخب کر کے Deploy کریں۔' : 'Click Deploy > Manage Deployments > Edit > Version: New Version > Deploy.'}</li>
                  <li>{isUrdu ? 'بس! تمام کلائنٹس کے Column O اور P لنکس ہمیشہ کے لیے سافٹ ویئر میں لائیو ہو جائیں گے۔' : 'Done! All Column O & P values will now sync directly in real time.'}</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setSheetSyncModalOpen(false)}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {isUrdu ? 'بند کریں (Close)' : 'Close'}
          </button>

          {activeTab === 'paste' && (
            <button
              type="button"
              onClick={handleApply}
              disabled={isProcessing || previewItems.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <span>{isUrdu ? 'محفوظ کیا جا رہا ہے...' : 'Saving...'}</span>
              ) : (
                <>
                  <Check size={14} />
                  <span>{isUrdu ? `محفوظ کریں (${previewItems.length} کلائنٹس)` : `Apply & Save (${previewItems.length} Clients)`}</span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
