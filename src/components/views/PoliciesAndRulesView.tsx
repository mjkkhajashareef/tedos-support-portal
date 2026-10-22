/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MaterialCard } from '../common/MaterialCard';
import {
  BookOpen,
  FileWarning,
  Check,
  Copy,
  Share2,
  Printer,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Link2,
  Users,
  Database,
  Sparkles,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export interface PolicyRule {
  id: string;
  ruleNumber: number;
  category: 'A: Attendance & Login' | 'B: Call Logs & Proof' | 'C: Client Engagement' | 'D: System & Sync';
  titleEn: string;
  titleUrdu: string;
  descriptionEn: string;
  descriptionUrdu: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  standardPenalty: string;
}

export const TE_POLICIES_28: PolicyRule[] = [
  // CATEGORY A: Attendance & Working Hours
  {
    id: 'P01',
    ruleNumber: 1,
    category: 'A: Attendance & Login',
    titleEn: '10:00 AM Punctual Login',
    titleUrdu: 'صبح 10:00 بجے لاگ ان کی پابندی',
    descriptionEn: 'All Technical Support Executives must log in by 10:00 AM. Any entry recorded after 10:20 AM is marked as a Late Entry and subject to disciplinary deduction.',
    descriptionUrdu: 'تمام ٹیکنیکل ایگزیکٹوز کے لیے صبح 10:00 بجے تک لاگ ان ہونا لازمی ہے۔ 10:20 کے بعد کی انٹری لیٹ شمار ہوگی۔',
    severity: 'Medium',
    standardPenalty: 'First: Verbal warning; 3 Late logins in a month = 1 Half-day salary deduction.'
  },
  {
    id: 'P02',
    ruleNumber: 2,
    category: 'A: Attendance & Login',
    titleEn: '7-Hour (420 Minutes) Daily Support Quota',
    titleUrdu: 'روزانہ 7 گھنٹے (420 منٹ) پروڈکٹیوٹی کوٹہ',
    descriptionEn: 'Every executive must achieve a minimum of 420 logged and verified minutes of client interaction or software maintenance each working day.',
    descriptionUrdu: 'ہر ایگزیکٹو کے لیے روزانہ کم از کم 420 منٹ تصدیق شدہ کسٹمر سپورٹ یا کام لاگ کرنا لازمی ہے۔',
    severity: 'Critical',
    standardPenalty: 'Logs below 240 mins count as unexcused deficient performance; subject to COO review.'
  },
  {
    id: 'P03',
    ruleNumber: 3,
    category: 'A: Attendance & Login',
    titleEn: 'Workstation Responsiveness',
    titleUrdu: 'ورک اسٹیشن پر موجودگی اور جواب دہی',
    descriptionEn: 'Executives must be active at their workstation and respond to client inquiries and COO directives within 5 minutes during shift hours.',
    descriptionUrdu: 'ڈیوٹی اوقات کے دوران کلائنٹ یا منیجمنٹ کی کال پر 5 منٹ کے اندر فوری جواب دینا لازمی ہے۔',
    severity: 'Medium',
    standardPenalty: 'Official warning letter on repeated unresponsiveness.'
  },
  {
    id: 'P04',
    ruleNumber: 4,
    category: 'A: Attendance & Login',
    titleEn: 'Prior Leave Submission (24 Hours)',
    titleUrdu: 'چھٹی کی 24 گھنٹے قبل پیشگی اطلاع',
    descriptionEn: 'Planned absences must be submitted in the portal at least 24 hours prior to shift commencement for COO approval.',
    descriptionUrdu: 'پلان شدہ چھٹی کی درخواست کم از کم 24 گھنٹے پہلے پورٹل میں جمع کرانا ضروری ہے۔',
    severity: 'Medium',
    standardPenalty: 'Unapproved absence marked as Leave Without Pay (LWP).'
  },
  {
    id: 'P05',
    ruleNumber: 5,
    category: 'A: Attendance & Login',
    titleEn: 'Emergency Absence Protocol',
    titleUrdu: 'ہنگامی چھٹی کی فوری اطلاع',
    descriptionEn: 'In case of medical or family emergency, the executive must inform the Operations Lead or COO by 09:30 AM via WhatsApp.',
    descriptionUrdu: 'ہنگامی مجبوری کی صورت میں صبح 9:30 سے قبل واٹس ایپ پر COO یا لیڈ کو مطلع کرنا لازمی ہے۔',
    severity: 'Medium',
    standardPenalty: 'Unnotified emergency leads to marked absent.'
  },
  {
    id: 'P06',
    ruleNumber: 6,
    category: 'A: Attendance & Login',
    titleEn: 'End-of-Shift Handover',
    titleUrdu: 'شفٹ کے اختتام پر زیرِ التواء کام کی تفصیل',
    descriptionEn: 'All unresolved tickets or pending callbacks must be assigned with comprehensive handover notes prior to signing off.',
    descriptionUrdu: 'شفٹ ختم ہونے سے پہلے تمام نامکمل ٹکٹس اور کال بیکس کے تفصیلی نوٹس درج کرنا ضروری ہے۔',
    severity: 'Low',
    standardPenalty: 'Verbal warning and mandate to resolve pending queue next morning.'
  },
  {
    id: 'P07',
    ruleNumber: 7,
    category: 'A: Attendance & Login',
    titleEn: 'Authorized Overtime & Weekend Support',
    titleUrdu: 'منظور شدہ اوور ٹائم اور ویک اینڈ سپورٹ',
    descriptionEn: 'Any overtime or weekend client emergency support must be pre-authorized by the COO and logged into the system within 60 minutes.',
    descriptionUrdu: 'ویک اینڈ پر ایمرجنسی سپورٹ کی پیشگی منظوری اور ایک گھنٹے کے اندر لاگ انٹری لازمی ہے۔',
    severity: 'Low',
    standardPenalty: 'Unverified weekend logs will not be credited.'
  },

  // CATEGORY B: Call Logging & Proof Mandates
  {
    id: 'P08',
    ruleNumber: 8,
    category: 'B: Call Logs & Proof',
    titleEn: 'Real-Time Logging within 15 Minutes',
    titleUrdu: 'کال ختم ہونے کے 15 منٹ میں لاگ کا اندراج',
    descriptionEn: 'Every call or support intervention must be submitted into the work log within 15 minutes of conclusion. Batch end-of-day logging is prohibited.',
    descriptionUrdu: 'ہر سپورٹ کال یا سیشن کا اندراج کال ختم ہونے کے 15 منٹ کے اندر کرنا لازمی ہے۔ دن کے آخر میں ایک ساتھ اندراج ممنوع ہے۔',
    severity: 'High',
    standardPenalty: 'Delayed logs flagged for manual audit by COO.'
  },
  {
    id: 'P09',
    ruleNumber: 9,
    category: 'B: Call Logs & Proof',
    titleEn: 'Mandatory 5-Minute Proof Rule',
    titleUrdu: '5 منٹ سے بڑی کال پر گوگل ڈرائیو یا میٹ لنک کی پابندی',
    descriptionEn: 'Any session or phone call exceeding 5 minutes (00:05:00) strictly requires a valid Google Drive or Google Meet proof link.',
    descriptionUrdu: 'اگر کال کا دورانیہ 5 منٹ سے زیادہ ہو تو گوگل ڈرائیو یا میٹ ریکارڈنگ کا فعال لنک دینا قانوناً لازمی ہے۔',
    severity: 'Critical',
    standardPenalty: 'Unverified logs >5m are rejected and deducted from daily 420-min total.'
  },
  {
    id: 'P10',
    ruleNumber: 10,
    category: 'B: Call Logs & Proof',
    titleEn: 'Recording Quality & Screen Capture',
    titleUrdu: 'ریکارڈنگ کا واضح ہونا اور اسکرین شیئرنگ ثبوت',
    descriptionEn: 'Meeting recordings must capture the software screen and resolution steps clearly. Blank or muted recordings are rejected.',
    descriptionUrdu: 'ریکارڈنگ میں سافٹ ویئر اسکرین اور کام کا طریقہ کار واضح نظر آنا چاہیے۔ خالی لنک مسترد ہوگا۔',
    severity: 'High',
    standardPenalty: 'Rejection of logged time; re-training mandated.'
  },
  {
    id: 'P11',
    ruleNumber: 11,
    category: 'B: Call Logs & Proof',
    titleEn: 'Approved Domain Links Only',
    titleUrdu: 'صرف منظور شدہ گوگل ڈرائیو یا میٹ ڈومین لنکس',
    descriptionEn: 'Only links hosted on drive.google.com or meet.google.com are permitted as proof URLs. Third-party cloud lockers are blocked.',
    descriptionUrdu: 'صرف drive.google.com اور meet.google.com لنکس قابلِ قبول ہیں۔ غیر متعلقہ ویب لنکس ممنوع ہیں۔',
    severity: 'High',
    standardPenalty: 'System blocks form submission for invalid domains.'
  },
  {
    id: 'P12',
    ruleNumber: 12,
    category: 'B: Call Logs & Proof',
    titleEn: 'Time Integrity & No Exaggeration',
    titleUrdu: 'اوقات کی درستگی اور دورانیہ میں سچائی',
    descriptionEn: 'Start and end times must correspond exactly to actual duration. Inflating a 2-minute call to 20 minutes constitutes fraud.',
    descriptionUrdu: 'کال کا دورانیہ درست درج کریں۔ کم دورانیے کو زیادہ ظاہر کرنا سنگین خلاف ورزی شمار ہوگا۔',
    severity: 'Critical',
    standardPenalty: 'Immediate disciplinary charge and salary deduction.'
  },
  {
    id: 'P13',
    ruleNumber: 13,
    category: 'B: Call Logs & Proof',
    titleEn: 'Zero Fabricated Logs Policy',
    titleUrdu: 'جعلی لاگ انٹری پر سخت کارروائی',
    descriptionEn: 'Logging fictitious calls or ghost clients will result in immediate termination and financial penalty.',
    descriptionUrdu: 'بغیر کال کیے فرضی انٹری ڈالنے پر فوری برخاستگی اور قانونی کارروائی عمل میں لائی جائے گی۔',
    severity: 'Critical',
    standardPenalty: 'Immediate termination / Show Cause Notice.'
  },
  {
    id: 'P14',
    ruleNumber: 14,
    category: 'B: Call Logs & Proof',
    titleEn: 'Prohibition of Duplicate Proof Links',
    titleUrdu: 'ایک ہی لنک کو بار بار استعمال کرنے کی ممانعت',
    descriptionEn: 'Reusing previously submitted Google Drive or Meet links across multiple work log entries is strictly prohibited unless pre-authorized.',
    descriptionUrdu: 'پرانے ریکارڈنگ لنک کو نئی کال میں دوبارہ استعمال کرنا سخت ممنوع ہے۔ سسٹم ڈپلیکیٹ ڈیٹیکٹ کرے گا۔',
    severity: 'Critical',
    standardPenalty: 'Duplicate logs automatically blocked or queued for COO rejection.'
  },

  // CATEGORY C: Client Engagement & Status Tagging
  {
    id: 'P15',
    ruleNumber: 15,
    category: 'C: Client Engagement',
    titleEn: 'Mandatory Software Usage Status Tagging',
    titleUrdu: 'کلائنٹ کے سافٹ ویئر استعمال کی صورتحال کا اندراج',
    descriptionEn: 'Executives must inquire and record whether the client is a "Regular User", "Not Using", or "Need Training" on every call.',
    descriptionUrdu: 'ہر کال پر کلائنٹ سے پوچھ کر تصدیق کریں کہ وہ سافٹ ویئر باقاعدہ استعمال کر رہے ہیں یا بند پڑا ہے۔',
    severity: 'High',
    standardPenalty: 'Incomplete client records returned for mandatory update.'
  },
  {
    id: 'P16',
    ruleNumber: 16,
    category: 'C: Client Engagement',
    titleEn: 'Courteous & Polite Client Communication',
    titleUrdu: 'شائستہ، بااخلاق اور پیشہ ورانہ گفتگو',
    descriptionEn: 'Executives must maintain utmost patience and professional courtesy. Arguing with clients or rude tone is intolerable.',
    descriptionUrdu: 'کلائنٹ سے ہمیشہ شائستگی اور نرمی سے بات کریں۔ بدتمیزی یا بحث کسی صورت برداشت نہیں کی جائے گی۔',
    severity: 'Critical',
    standardPenalty: 'Formal written warning and client apology required.'
  },
  {
    id: 'P17',
    ruleNumber: 17,
    category: 'C: Client Engagement',
    titleEn: '24-Hour Follow-Up Guarantee',
    titleUrdu: '24 گھنٹے میں فالو اپ کال کا وعدہ پورا کرنا',
    descriptionEn: 'Any pending or unresolved client issue must be followed up within 24 hours without fail.',
    descriptionUrdu: 'نامکمل مسئلہ کی صورت میں اگلے 24 گھنٹوں کے اندر کلائنٹ سے فالو اپ کرنا لازمی ہے۔',
    severity: 'Medium',
    standardPenalty: 'Ticket escalation to Operations Lead.'
  },
  {
    id: 'P18',
    ruleNumber: 18,
    category: 'C: Client Engagement',
    titleEn: 'Critical Issue Escalation (30 Mins)',
    titleUrdu: 'سنگین مسئلے کی 30 منٹ میں COO کو اطلاع',
    descriptionEn: 'System crashes, data corruption, or agitated clients threatening refund must be escalated to COO within 30 minutes.',
    descriptionUrdu: 'سافٹ ویئر کریش، ڈیٹا خرابی یا ناراض کلائنٹ کی فوری اطلاع 30 منٹ میں COO کو دیں۔',
    severity: 'High',
    standardPenalty: 'Explanation call for failing to escalate critical risks.'
  },
  {
    id: 'P19',
    ruleNumber: 19,
    category: 'C: Client Engagement',
    titleEn: 'Remote Access (AnyDesk) Safety Protocol',
    titleUrdu: 'ریموٹ کنکشن (AnyDesk) کے دوران رازداری',
    descriptionEn: 'Always inform the client before initiating AnyDesk/TeamViewer. Never access private personal folders or unapproved files.',
    descriptionUrdu: 'ریموٹ کنٹرول سے پہلے کلائنٹ کی اجازت لیں۔ کسی بھی غیر متعلقہ فولڈر یا فائل کو نہ کھولیں۔',
    severity: 'Critical',
    standardPenalty: 'Immediate suspension for unauthorized file tampering.'
  },
  {
    id: 'P20',
    ruleNumber: 20,
    category: 'C: Client Engagement',
    titleEn: 'Training Verification & Client Sign-Off',
    titleUrdu: 'ٹریننگ مکمل ہونے پر کلائنٹ کی تسلی',
    descriptionEn: 'During training sessions, confirm client understanding of sale invoice, inventory, and ledger before completing the call.',
    descriptionUrdu: 'ٹریننگ کال کے دوران کلائنٹ کو خود اینٹری کروا کر تسلی کرائیں اور سیشن کا خلاصہ لکھیں۔',
    severity: 'Medium',
    standardPenalty: 'Follow-up training required if client reports no comprehension.'
  },
  {
    id: 'P21',
    ruleNumber: 21,
    category: 'C: Client Engagement',
    titleEn: 'Official WhatsApp Formatting Protocol',
    titleUrdu: 'سرکاری واٹس ایپ پیغامات کے معیار کی پابندی',
    descriptionEn: 'Only official TEDOS templates may be used when sending setup links or invoices via WhatsApp. No casual slang.',
    descriptionUrdu: 'کلائنٹ کو واٹس ایپ پر صرف آفیشل فارمیٹ میں میسج بھیجیں۔ غیر ضروری باتیں نہ کریں۔',
    severity: 'Low',
    standardPenalty: 'Template correction notice.'
  },

  // CATEGORY D: System & Sheet Hygiene
  {
    id: 'P22',
    ruleNumber: 22,
    category: 'D: System & Sync',
    titleEn: 'Master Google Sheets Sync Protocol',
    titleUrdu: 'گوگل شیٹس ماسٹر ڈیٹا کے ساتھ بروقت سنک',
    descriptionEn: 'Logs stored offline on local devices must be synchronized to Google Sheets immediately upon network restoration.',
    descriptionUrdu: 'انٹرنیٹ بحال ہوتے ہی تمام آف لائن لاگز کو فوری طور پر سینٹرل گوگل شیٹ پر سنک کریں۔',
    severity: 'High',
    standardPenalty: 'Discrepancy flag if unsynced logs remain past 12 hours.'
  },
  {
    id: 'P23',
    ruleNumber: 23,
    category: 'D: System & Sync',
    titleEn: 'Non-Destructive Record Protection',
    titleUrdu: 'کلائنٹ ریکارڈز کو ضائع یا ڈیلیٹ نہ کرنے کی پابندی',
    descriptionEn: 'Executives must never delete historical tickets or client notes. All changes must follow audit trails.',
    descriptionUrdu: 'پرانے ٹکٹس، کلائنٹ ڈیٹا یا لاگز کو ضائع کرنا ممنوع ہے۔ ہر تبدیلی کا لاگ بنتا ہے۔',
    severity: 'Critical',
    standardPenalty: 'System access revoked for unauthorized deletion.'
  },
  {
    id: 'P24',
    ruleNumber: 24,
    category: 'D: System & Sync',
    titleEn: 'Confidential Client Data Protection',
    titleUrdu: 'کلائنٹ کے کاروباری ڈیٹا اور پاس ورڈز کی رازداری',
    descriptionEn: 'Client sales figures, profit margins, and software license keys must remain strictly confidential.',
    descriptionUrdu: 'کلائنٹ کا سیلز ڈیٹا اور پاس ورڈز کسی بھی تیسرے شخص کو شیئر کرنا سخت جرم ہے۔',
    severity: 'Critical',
    standardPenalty: 'Legal and financial liability alongside immediate termination.'
  },
  {
    id: 'P25',
    ruleNumber: 25,
    category: 'D: System & Sync',
    titleEn: 'Daily EOD WhatsApp Summary Submission',
    titleUrdu: 'دن کے اختتام پر واٹس ایپ سمری رپورٹ جمع کرانا',
    descriptionEn: 'Every executive must generate and send their bilingual Daily Work Summary to the official management group before sign-off.',
    descriptionUrdu: 'شفٹ ختم ہونے سے پہلے پورٹل سے ڈیلی سمری تیار کر کے آفیشل واٹس ایپ گروپ میں بھیجنا لازمی ہے۔',
    severity: 'Medium',
    standardPenalty: 'Daily attendance marked incomplete if summary not posted.'
  },
  {
    id: 'P26',
    ruleNumber: 26,
    category: 'D: System & Sync',
    titleEn: 'Workstation & Credential Security',
    titleUrdu: 'لاگ ان پاس ورڈز اور کمپیوٹر کی حفاظت',
    descriptionEn: 'Login credentials must not be shared between executives. Systems must be locked when away from desk.',
    descriptionUrdu: 'اپنا یوزر پاس ورڈ کسی دوسرے ملازم کو نہ دیں۔ سیٹ سے اٹھتے وقت اسکرین لاک کریں۔',
    severity: 'Medium',
    standardPenalty: 'Password reset and security warning.'
  },
  {
    id: 'P27',
    ruleNumber: 27,
    category: 'D: System & Sync',
    titleEn: '12-Hour Audit Flag Reconciliation',
    titleUrdu: 'سی او او آڈٹ نوٹس کا 12 گھنٹے میں ازالہ',
    descriptionEn: 'If a log is flagged by the COO for missing proof, the executive must furnish valid evidence within 12 hours.',
    descriptionUrdu: 'اگر کسی انٹری پر اعتراض لگے تو اگلے 12 گھنٹوں میں درست ریکارڈنگ فراہم کرنا لازمی ہے۔',
    severity: 'High',
    standardPenalty: 'Unresolved flagged logs permanently marked non-billable.'
  },
  {
    id: 'P28',
    ruleNumber: 28,
    category: 'D: System & Sync',
    titleEn: 'Continuous Knowledge Base Updates',
    titleUrdu: 'مسائل کے نئے حل نالج بیس میں درج کرنا',
    descriptionEn: 'Newly encountered software bugs or setup tricks must be documented in the shared technical solution repository.',
    descriptionUrdu: 'کسی بھی نئے مسئلے کا حل معلوم ہونے پر اسے مشترکہ نالج بیس میں درج کریں تاکہ باقی ٹیم بھی مستفید ہو۔',
    severity: 'Low',
    standardPenalty: 'Monthly KPI deduction for zero knowledge contributions.'
  }
];

export const PoliciesAndRulesView: React.FC = () => {
  const { users, currentUser, language } = useApp();
  const isUrdu = language === 'ur';

  const [activeTab, setActiveTab] = useState<'repository' | 'generator'>('repository');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Notice Generator State
  const [selectedExecutiveId, setSelectedExecutiveId] = useState<string>(users[0]?.id || '');
  const [selectedRuleId, setSelectedRuleId] = useState<string>('P09');
  const [violationType, setViolationType] = useState<'First Written Warning' | 'Second Warning with Fine' | 'Half-Day Deduction' | 'Final Show Cause Notice'>('First Written Warning');
  const [incidentDate, setIncidentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [incidentDetails, setIncidentDetails] = useState<string>('Work log exceeded 5 minutes without required Google Drive/Meet proof link.');
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Filtered policies
  const filteredPolicies = useMemo(() => {
    return TE_POLICIES_28.filter((policy) => {
      const matchCat = selectedCategory === 'All' || policy.category.startsWith(selectedCategory);
      const q = searchQuery.toLowerCase();
      const matchQuery =
        policy.titleEn.toLowerCase().includes(q) ||
        policy.titleUrdu.toLowerCase().includes(q) ||
        policy.descriptionEn.toLowerCase().includes(q) ||
        policy.id.toLowerCase().includes(q) ||
        policy.standardPenalty.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [searchQuery, selectedCategory]);

  // Selected Rule object for Notice Generator
  const selectedRule = useMemo(() => {
    return TE_POLICIES_28.find((p) => p.id === selectedRuleId) || TE_POLICIES_28[0];
  }, [selectedRuleId]);

  const targetExecutive = useMemo(() => {
    return users.find((u) => u.id === selectedExecutiveId) || users[0];
  }, [users, selectedExecutiveId]);

  // Generated Official Notice Text
  const generatedNoticeText = useMemo(() => {
    const execName = targetExecutive?.name || 'Support Executive';
    const execId = targetExecutive?.id || 'TE-ID';

    return `*TEDOS MANAGEMENT & OPERATIONS COMPLIANCE NOTICE*
*باضابطہ انتظامی تنبیہی نوٹس*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reference: TEDOS/HR/COMP/${new Date().getFullYear()}/${selectedRule.id}-${Math.floor(1000 + Math.random() * 9000)}
Date: ${incidentDate}
To: ${execName} (ID: ${execId})
Designation: Technical Support Executive
Issued By: Office of the Chief Operating Officer (COO)

*SUBJECT: OFFICIAL NOTICE - VIOLATION OF TE OPERATIONAL POLICY #${selectedRule.ruleNumber}*
*موضوع: پالیسی رول نمبر ${selectedRule.ruleNumber} کی خلاف ورزی کا نوٹس*

Dear ${execName},

This is an official communication regarding compliance non-adherence observed on ${incidentDate}:

📌 *Violated Policy / خلاف ورزی شدہ رول:*
• Policy ID: ${selectedRule.id} - ${selectedRule.titleEn}
• اردو عنوان: ${selectedRule.titleUrdu}
• Category: ${selectedRule.category}

📝 *Incident Summary / واقعے کی تفصیل:*
${incidentDetails}

⚖️ *Action & Penalty Tier / انتظامی کارروائی:*
• Action Level: *${violationType}*
• Standard Policy Penalty: ${selectedRule.standardPenalty}

⚠️ *Compliance Mandate / آئندہ کے لیے ہدایت:*
All Technical Executives are bound by the 28 TEDOS Operational Standard Operating Procedures. You are required to submit an explanation or rectify the record within 12 hours. Continued violations will result in salary deductions and formal service review.

آپ کو ہدایت کی جاتی ہے کہ فوری طور پر ریکارڈ درست کریں یا 12 گھنٹوں میں وضاحت پیش کریں۔ بار بار خلاف ورزی کی صورت میں تنخواہ میں کٹوتی اور تادیبی کارروائی کی جائے گی۔

━━━━━━━━━━━━━━━━━━━━━━━━━━━
_TEDOS Software Solutions - Internal Operations Compliance_`;
  }, [targetExecutive, selectedRule, violationType, incidentDate, incidentDetails]);

  const handleCopyNotice = () => {
    navigator.clipboard.writeText(generatedNoticeText);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  const handleShareWhatsAppNotice = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(generatedNoticeText)}`;
    window.open(url, '_blank');
  };

  const handlePrintNotice = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-md-surface p-5 rounded-2xl border border-md-surface-variant shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-md-on-surface">
              {isUrdu ? "28 آپریشنل قواعد و ضوابط اور نوٹس سسٹم" : "28-Rule TE Operational Policy & Notice Engine"}
            </h1>
            <p className="text-xs text-md-outline">
              {isUrdu 
                ? "ٹیکنیکل سپورٹ ایگزیکٹوز کے لیے لازمی ہدایات، تصدیقی معیارات اور تنبیہی نوٹس جنریٹر"
                : "Comprehensive Technical Executive Governance, Verification Standards & Warning Notice Generator"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('repository')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'repository'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-md-surface-container-low text-md-outline hover:text-md-on-surface'
            }`}
          >
            {isUrdu ? "پالیسی ڈائریکٹری (28 اصول)" : "Policy Repository (28 Rules)"}
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'generator'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-md-surface-container-low text-md-outline hover:text-md-on-surface'
            }`}
          >
            <FileWarning size={14} />
            <span>{isUrdu ? "تنبیہی نوٹس جنریٹر" : "Violation Notice Generator"}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: POLICY REPOSITORY */}
      {activeTab === 'repository' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-md-surface p-3.5 rounded-2xl border border-md-surface-variant">
            <div className="relative flex-1">
              <Search size={16} className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-md-outline" />
              <input
                type="text"
                placeholder={isUrdu ? "پالیسی تلاش کریں (جیسے لاگ ان، 420 منٹ، ڈرائیو لنک، کال لاگ)..." : "Search policies by keyword, number, or Urdu title (e.g. proof, 10:00 AM, ڈرائیو)..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-md-surface-container-low ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs rounded-xl border border-md-surface-variant text-md-on-surface focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
              <span className="text-md-outline text-[11px] font-semibold flex items-center gap-1 shrink-0">
                <Filter size={12} />
                <span>{isUrdu ? "کیٹیگری:" : "Category:"}</span>
              </span>
              {[
                { id: 'All', labelEn: 'All (28)', labelUr: 'تمام (28)' },
                { id: 'A', labelEn: 'A: Attendance', labelUr: 'A: حاضری و اوقات' },
                { id: 'B', labelEn: 'B: Proof & Logs', labelUr: 'B: لاگ و پروف' },
                { id: 'C', labelEn: 'C: Client Etiquette', labelUr: 'C: کلائنٹ اخلاقیات' },
                { id: 'D', labelEn: 'D: System & Sync', labelUr: 'D: سسٹم و سنک' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all ${
                    selectedCategory === c.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-md-surface-container-low text-md-outline hover:text-md-on-surface'
                  }`}
                >
                  {isUrdu ? c.labelUr : c.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Policy Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredPolicies.map((rule) => {
              const severityColor =
                rule.severity === 'Critical'
                  ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                  : rule.severity === 'High'
                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300';

              const sevLabel = isUrdu 
                ? (rule.severity === 'Critical' ? 'نازک / لازمی' : rule.severity === 'High' ? 'اہم' : rule.severity === 'Medium' ? 'درمیانہ' : 'معمولی')
                : rule.severity;

              return (
                <MaterialCard
                  key={rule.id}
                  elevation="flat"
                  className="p-4 rounded-2xl border border-md-surface-variant flex flex-col justify-between space-y-3 hover:border-blue-400/50 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 font-bold text-xs flex items-center justify-center font-mono border border-blue-200">
                          #{rule.ruleNumber}
                        </span>
                        <div>
                          <h3 className="text-xs font-bold text-md-on-surface">{isUrdu ? rule.titleUrdu : rule.titleEn}</h3>
                          <span className="text-[10px] text-blue-600 font-medium font-mono">{rule.category}</span>
                        </div>
                      </div>

                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${severityColor}`}>
                        {sevLabel}
                      </span>
                    </div>

                    <p className="text-xs text-md-outline leading-relaxed">{isUrdu ? rule.descriptionUrdu : rule.descriptionEn}</p>

                    <div className="p-2.5 rounded-xl bg-md-surface-container-low border border-md-surface-variant/80 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block font-mono">
                        {isUrdu ? "اردو رہنمائی:" : "English Guideline:"}
                      </span>
                      <p className="text-xs text-md-on-surface leading-relaxed font-medium">
                        {isUrdu ? rule.descriptionUrdu : rule.descriptionEn}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-md-surface-variant flex items-center justify-between text-[10px]">
                    <span className="text-md-outline font-semibold">
                      {isUrdu ? "مقررہ سزا / ایکشن: " : "Standard Penalty: "} 
                      <span className="text-rose-600 font-medium">{rule.standardPenalty}</span>
                    </span>

                    <button
                      onClick={() => {
                        setSelectedRuleId(rule.id);
                        setActiveTab('generator');
                      }}
                      className="text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <span>{isUrdu ? "نوٹس بنائیں" : "Generate Notice"}</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </MaterialCard>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: NOTICE GENERATOR */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Controls Form */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-md-surface p-4 rounded-2xl border border-md-surface-variant space-y-3.5">
              <h3 className="text-sm font-bold text-md-on-surface flex items-center gap-1.5">
                <FileWarning size={16} className="text-amber-600" />
                <span>{isUrdu ? "خلاف ورزی پیرامیٹرز سیٹ کریں" : "Configure Violation Parameters"}</span>
              </h3>

              {/* Target Executive */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-md-outline uppercase block">
                  {isUrdu ? "ملازم / ایگزیکٹو کا انتخاب *" : "Select Executive *"}
                </label>
                <select
                  value={selectedExecutiveId}
                  onChange={(e) => setSelectedExecutiveId(e.target.value)}
                  className="w-full bg-md-surface-container-low border border-md-surface-variant rounded-xl p-2.5 text-xs text-md-on-surface font-semibold"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}) - {u.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Policy Rule */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-md-outline uppercase block">
                  {isUrdu ? "پالیسی رول منتخب کریں (1–28) *" : "Select Policy Rule (1–28) *"}
                </label>
                <select
                  value={selectedRuleId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedRuleId(id);
                    const r = TE_POLICIES_28.find((p) => p.id === id);
                    if (r) {
                      setIncidentDetails(isUrdu 
                        ? `پالیسی رول #${r.ruleNumber} (${r.titleUrdu}) کی خلاف ورزی نوٹ کی گئی۔`
                        : `Non-compliance observed regarding rule #${r.ruleNumber}: ${r.titleEn}.`);
                    }
                  }}
                  className="w-full bg-md-surface-container-low border border-md-surface-variant rounded-xl p-2.5 text-xs text-md-on-surface font-semibold"
                >
                  {TE_POLICIES_28.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.ruleNumber}: {isUrdu ? p.titleUrdu : p.titleEn} ({p.category.split(':')[0]})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Level */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-md-outline uppercase block">
                  {isUrdu ? "ایکشن کا درجہ / سزا کا درجہ" : "Action & Penalty Tier"}
                </label>
                <select
                  value={violationType}
                  onChange={(e) => setViolationType(e.target.value as any)}
                  className="w-full bg-md-surface-container-low border border-md-surface-variant rounded-xl p-2.5 text-xs text-md-on-surface font-semibold"
                >
                  <option value="First Written Warning">{isUrdu ? "پہلی تحریری تنبیہ (پہلی غلطی)" : "First Written Warning (1st Offense)"}</option>
                  <option value="Second Warning with Fine">{isUrdu ? "دوسری تنبیہ بمعہ جرمانہ (دوسری غلطی)" : "Second Warning with Fine (2nd Offense)"}</option>
                  <option value="Half-Day Deduction">{isUrdu ? "نصف دن کی تنخواہ کٹوتی (تیسری غلطی)" : "Half-Day Salary Deduction (3rd Offense)"}</option>
                  <option value="Final Show Cause Notice">{isUrdu ? "حتمی شوکاز نوٹس (سنگین خلاف ورزی)" : "Final Show Cause Notice (Critical Breach)"}</option>
                </select>
              </div>

              {/* Incident Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-md-outline uppercase block">
                  {isUrdu ? "تاریخ وقوعہ" : "Incident Date"}
                </label>
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full bg-md-surface-container-low border border-md-surface-variant rounded-xl p-2.5 text-xs text-md-on-surface font-semibold font-mono"
                />
              </div>

              {/* Specific Incident Remarks */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-md-outline uppercase block">
                  {isUrdu ? "خلاف ورزی کی مختصر تفصیل *" : "Specific Violation Summary *"}
                </label>
                <textarea
                  rows={3}
                  value={incidentDetails}
                  onChange={(e) => setIncidentDetails(e.target.value)}
                  placeholder={isUrdu ? "ورک لاگ یا کسٹمر سیشن کی خلاف ورزی کی تفصیل..." : "Details of the non-compliant work log, timing discrepancy, or client issue..."}
                  className="w-full bg-md-surface-container-low border border-md-surface-variant rounded-xl p-2.5 text-xs text-md-on-surface"
                />
              </div>
            </div>
          </div>

          {/* Generated Notice Live Preview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-md-surface p-4 rounded-2xl border border-md-surface-variant space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-bold text-md-on-surface flex items-center gap-1.5">
                  <Sparkles size={16} className="text-blue-600" />
                  <span>{isUrdu ? "باضابطہ نوٹس کا لائیو پیش منظر" : "Bilingual Official Notice Preview"}</span>
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyNotice}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                      copiedNotice
                        ? 'bg-emerald-600 text-white'
                        : 'bg-md-surface-container-low border border-md-surface-variant text-md-on-surface hover:bg-md-surface'
                    }`}
                  >
                    {copiedNotice ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedNotice ? (isUrdu ? 'کاپی ہو گیا' : 'Copied') : (isUrdu ? 'کاپی کریں' : 'Copy')}</span>
                  </button>

                  <button
                    onClick={handleShareWhatsAppNotice}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-all"
                  >
                    <Share2 size={12} />
                    <span>{isUrdu ? "واٹس ایپ" : "WhatsApp"}</span>
                  </button>

                  <button
                    onClick={handlePrintNotice}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-900 text-white flex items-center gap-1 transition-all"
                  >
                    <Printer size={12} />
                    <span>{isUrdu ? "پرنٹ" : "Print"}</span>
                  </button>
                </div>
              </div>

              {/* Letterhead Preview Box */}
              <div className="bg-zinc-900 text-zinc-100 p-4 rounded-xl border border-zinc-700 font-mono text-[11px] whitespace-pre-wrap max-h-[520px] overflow-y-auto leading-relaxed shadow-inner">
                {generatedNoticeText}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
