/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ModuleId } from '../../types';
import { 
  Compass, 
  X, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  FileText, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  Bot,
  Layers,
  Users,
  CheckSquare,
  ShieldAlert,
  CalendarCheck,
  ChevronRight,
  HelpCircle,
  PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PageGuideData {
  moduleId: ModuleId | 'activation' | 'payroll';
  titleUrdu: string;
  titleEn: string;
  badgeUrdu: string;
  badgeEn: string;
  overviewUrdu: string;
  overviewEn: string;
  formFields: {
    nameUrdu: string;
    nameEn: string;
    required: boolean;
    sampleValue: string;
    instructionsUrdu: string;
    instructionsEn: string;
  }[];
  criticalRulesUrdu: string[];
  criticalRulesEn: string[];
  geminiPrompt: string;
}

const PAGE_GUIDES: PageGuideData[] = [
  {
    moduleId: ModuleId.DASHBOARD,
    titleUrdu: 'مین آپریشنل ڈیش بورڈ (Dashboard)',
    titleEn: 'Main Operational Dashboard',
    badgeUrdu: 'مرکزی کنٹرول',
    badgeEn: 'Control Hub',
    overviewUrdu: 'یہ آپ کا مرکزی ہوم پیج ہے۔ یہاں آپ کو روزانہ کی مجموعی کارکردگی، زیر التواء فالو اپس، اوپن ٹکٹس، اور ہنگامی کلائنٹس کی لائیو معلومات ملتی ہیں۔',
    overviewEn: 'The central overview screen showing your daily workload metrics, active tickets, overdue follow-ups, and urgent clients requiring immediate attention.',
    formFields: [
      {
        nameUrdu: 'تلاش بار (Search Filter)',
        nameEn: 'Global Search Bar',
        required: false,
        sampleValue: 'Al-Madina Stores',
        instructionsUrdu: 'کسی بھی کلائنٹ، ٹکٹ یا ملازم کو تلاش کرنے کے لیے نام یا آئی ڈی ٹائپ کریں۔',
        instructionsEn: 'Type client name, phone number, or ticket ID to filter records instantly.'
      },
      {
        nameUrdu: 'کوئیک ایکشن لانچرز',
        nameEn: 'Quick Action Launchers',
        required: false,
        sampleValue: 'Add Work Log, Clients, Follow-up',
        instructionsUrdu: 'ڈیش بورڈ کے بٹن دبا کر سیدھا ورک لاگ، ٹکٹ یا واٹس ایپ پر جائیں۔',
        instructionsEn: 'Click action tiles to jump straight into daily logging, client directory, or outreach.'
      }
    ],
    criticalRulesUrdu: [
      'صبح لاگ ان ہوتے ہی ڈیش بورڈ پر موجود "Urgent Clients" اور تاخیر شدہ فالو اپس کا جائزہ لیں۔',
      'ڈیش بورڈ کے اوپر دیے گئے حاضری پورٹل لنک سے اپنی روزانہ حاضری لازمی مارک کریں۔'
    ],
    criticalRulesEn: [
      'Check Urgent Clients and Overdue follow-up counters immediately after morning login.',
      'Ensure daily attendance is marked via the Payroll Attendance Portal link in the top bar.'
    ],
    geminiPrompt: 'ڈیش بورڈ کا مکمل تعارف اور اس کی تمام میٹرکس کی تفصیل سمجھائیں۔'
  },
  {
    moduleId: ModuleId.DAILY_WORK_LOG,
    titleUrdu: 'روزانہ ورک لاگ (Daily Work Log)',
    titleEn: 'Daily Work Log & Remote Sessions',
    badgeUrdu: '7 گھنٹے کوٹہ لازمی',
    badgeEn: '7-Hour Quota Mandatory',
    overviewUrdu: 'یہ TEDOS کا سب سے اہم ماڈیول ہے۔ ہر سپورٹ ایگزیکٹو کو روزانہ کلائنٹس کے ساتھ کی گئی تمام کالز، اینی ڈیسک ریموٹ سیشنز اور مسائل کا حل یہاں لاگ کرنا ہوتا ہے۔',
    overviewEn: 'The core productivity engine where executives log every customer support call, remote AnyDesk session, software setup, and bug fix.',
    formFields: [
      {
        nameUrdu: 'کلائنٹ کا نام (Client Name)',
        nameEn: 'Client Name',
        required: true,
        sampleValue: 'Al-Madina Supermarket',
        instructionsUrdu: 'فہرست میں سے رجسٹرڈ کلائنٹ منتخب کریں یا نیا نام ٹائپ کریں۔',
        instructionsEn: 'Select from the registered clients dropdown or type an unregistered custom company name.'
      },
      {
        nameUrdu: 'سیشن / کال کی قسم (Session Type)',
        nameEn: 'Session Type',
        required: true,
        sampleValue: 'Remote AnyDesk / Inbound Call',
        instructionsUrdu: 'ان باؤنڈ کال، آؤٹ باؤنڈ کال، اینی ڈیسک ریموٹ سیشن، یا آن سائٹ وزٹ منتخب کریں۔',
        instructionsEn: 'Choose Inbound Call, Outbound Outreach, AnyDesk Remote, Onsite Visit, or Query/Guidance.'
      },
      {
        nameUrdu: 'مسئلے کی قسم (Issue Category)',
        nameEn: 'Issue Category',
        required: true,
        sampleValue: 'Printing & Invoicing / Tally Setup',
        instructionsUrdu: 'مسئلے کی نوعیت منتخب کریں (مثلاً پرنٹنگ، سافٹ ویئر انسٹالیشن، بیک اپ، یا بلنگ)۔',
        instructionsEn: 'Select category: Installation, Setup, Hardware, Printing & Invoicing, Backup, Query, or Bug.'
      },
      {
        nameUrdu: 'مسئلے کی تفصیل و حل (Details & Resolution)',
        nameEn: 'Issue Details & Resolution Steps',
        required: true,
        sampleValue: 'POS receipt thermal printer margin reset and barcode scanner speed adjusted.',
        instructionsUrdu: 'گاہک کا کیا مسئلہ تھا اور آپ نے اسے کس طرح حل کیا، واضح انداز میں درج کریں۔',
        instructionsEn: 'Write clear diagnostic details and exact technical steps executed to fix the problem.'
      },
      {
        nameUrdu: 'دورانیہ منٹوں میں (Duration Minutes)',
        nameEn: 'Duration in Minutes',
        required: true,
        sampleValue: '35',
        instructionsUrdu: 'شروع اور ختم ہونے کا وقت منتخب کریں، یا لائیو اسٹاپ واچ ٹائمر کا استعمال کریں۔',
        instructionsEn: 'Input duration in minutes, or use start/end time selectors, or trigger the live stopwatch.'
      },
      {
        nameUrdu: 'گوگل میٹ / ڈرائیو پروف لنک (MANDATORY PROOF LINK)',
        nameEn: 'Proof Link (Google Meet / Drive URL)',
        required: true,
        sampleValue: 'https://meet.google.com/abc-defg-hij',
        instructionsUrdu: '⚠️ اگر دورانیہ 5 منٹ سے زیادہ ہو تو گوگل میٹ یا گوگل ڈرائیو کا اسکرین شاٹ / ریکارڈنگ لنک لازمی درج کریں۔ پرانا لنک قبول نہیں ہوگا۔',
        instructionsEn: 'Mandatory if duration > 5 mins! Must be a valid meet.google.com or drive.google.com URL.'
      }
    ],
    criticalRulesUrdu: [
      'اصول نمبر 2: ہر ایگزیکٹو کو روزانہ کم از کم 420 منٹ (7 گھنٹے) کا کام لاگ کرنا لازمی ہے۔',
      'اصول نمبر 14: 5 منٹ سے زیادہ دورانیے پر گوگل میٹ یا ڈرائیو کا درست لنک لازمی ہے، ورنہ لاگ فلگ ہو کر مسترد ہو جائے گا۔',
      'انٹرنیٹ نہ ہونے کی صورت میں بھی لاگ محفوظ ہوتا ہے اور آن لائن ہوتے ہی گوگل شیٹ میں سنک ہو جاتا ہے۔'
    ],
    criticalRulesEn: [
      'Policy #2: Minimum 420 verified logged minutes (7 hours) required every working day.',
      'Policy #14: Any session over 5 minutes without a valid Meet/Drive proof link is flagged red and subject to rejection.',
      'Works completely offline via local IndexedDB storage and auto-syncs when internet resumes.'
    ],
    geminiPrompt: 'ورک لاگ میں 420 منٹ کوٹہ اور 5 منٹ کے دورانیے پر گوگل میٹ پروف لنک کی لازمی شرط اور اصول سمجھائیں۔'
  },
  {
    moduleId: ModuleId.TICKETS,
    titleUrdu: 'ٹکٹ سینٹر و ایس ایل اے (Tickets Center & SLA)',
    titleEn: 'Incident Ticket Center & SLA Engine',
    badgeUrdu: 'شکایات کا باضابطہ حل',
    badgeEn: 'SLA Managed Resolution',
    overviewUrdu: 'کلائنٹس کی طرف سے آنے والی تمام پیچیدہ شکایات یا ٹیکنیکل ایشوز کا باضابطہ ٹریکنگ سسٹم۔ ہر ٹکٹ کے ساتھ حل کا الٹی گنتی ٹائمر (SLA Timer) چلتا ہے۔',
    overviewEn: 'Full incident lifecycle system tracking customer grievances from report to resolution with automated priority SLA countdown timers.',
    formFields: [
      {
        nameUrdu: 'ٹکٹ کا عنوان (Ticket Subject)',
        nameEn: 'Ticket Title / Subject',
        required: true,
        sampleValue: 'Tally Multi-user gateway unreachable on Server node',
        instructionsUrdu: 'مسئلے کا مختصر اور جامع عنوان لکھیں۔',
        instructionsEn: 'Short descriptive title of the technical breakdown or customer inquiry.'
      },
      {
        nameUrdu: 'ترجیح (Priority)',
        nameEn: 'Priority Level',
        required: true,
        sampleValue: 'Critical (2 Hours) / High (4 Hours)',
        instructionsUrdu: 'اہمیت منتخب کریں: Critical (2 گھنٹے SLA)، High (4 گھنٹے SLA)، Medium (8 گھنٹے SLA)۔',
        instructionsEn: 'Select Low, Medium, High, or Critical. Priority sets the automated countdown SLA timer.'
      },
      {
        nameUrdu: 'منسلک کلائنٹ (Target Client)',
        nameEn: 'Assigned Client',
        required: true,
        sampleValue: 'Bismillah Traders',
        instructionsUrdu: 'جس کلائنٹ کی شکایت ہے اسے لسٹ میں سے منتخب کریں۔',
        instructionsEn: 'Choose the customer account reporting the issue.'
      },
      {
        nameUrdu: 'تفصیلی تفصیلات (Incident Details)',
        nameEn: 'Incident Details',
        required: true,
        sampleValue: 'Server system rebooted, port 9000 blocked by firewall rule.',
        instructionsUrdu: 'مسئلے کی تمام تفاصیل اور کسٹمر کا بیان درج کریں۔',
        instructionsEn: 'Detailed problem description, error numbers, and software context.'
      }
    ],
    criticalRulesUrdu: [
      'ہنگامی ٹکٹ (Critical) کو 2 گھنٹوں کے اندر حل کرنا کمپنی کی لازمی پالیسی ہے۔',
      'ٹکٹ کے اندر ہی "ورک لاگ شامل کریں" یا "فالو اپ شیڈول کریں" کے ذریعے تمام متعلقہ سرگرمیاں لنک کریں۔',
      'مسئلہ حل ہونے کے بعد ٹکٹ کا اسٹیٹس Resolved اور کسٹمر تصدیق کے بعد Closed پر تبدیل کریں۔'
    ],
    criticalRulesEn: [
      'Critical priority tickets must be resolved within strict 2-hour SLA window.',
      'Link all call logs, remote sessions, and callbacks directly to the ticket record.',
      'Transition ticket to Resolved after testing, and Closed after customer sign-off.'
    ],
    geminiPrompt: 'ٹکٹ سینٹر میں نیا ٹکٹ بنانے، ترجیحات (SLA) سیٹ کرنے اور ٹکٹ میں ورک لاگ جوڑنے کا طریقہ بتائیں۔'
  },
  {
    moduleId: ModuleId.CLIENTS,
    titleUrdu: 'کلائنٹس ڈائریکٹری و ورک اسپیس (Clients & Workspace)',
    titleEn: 'Clients Directory & Master Workspace',
    badgeUrdu: 'ہیلتھ اسکور و لائسنس',
    badgeEn: 'Health Score & Licenses',
    overviewUrdu: 'تمام رجسٹرڈ تجارتی اداروں اور دکانوں کا تفصیلی ریکارڈ۔ ہر کلائنٹ کے سافٹ ویئر کا ماڈل، لائسنس کی تجدید کی تاریخ، اور ہیلتھ اسکور (0 سے 100 فیصد) یہاں دیکھا جا سکتا ہے۔',
    overviewEn: 'Master customer directory showing business profile, installed software modules (Tally, Marg ERP, POS), AMC validity, and dynamic Health Score.',
    formFields: [
      {
        nameUrdu: 'کلائنٹ کی تلاش (Search Bar)',
        nameEn: 'Search & City Filter',
        required: false,
        sampleValue: 'Karachi, Retail POS',
        instructionsUrdu: 'شہر، سافٹ ویئر ماڈل یا کمپنی کے نام سے فلٹر کریں۔',
        instructionsEn: 'Filter clients by city, software category, or company name.'
      },
      {
        nameUrdu: 'کلائنٹ ورک اسپیس (Client Workspace)',
        nameEn: 'Workspace Deep Dive',
        required: false,
        sampleValue: 'Open Workspace Button',
        instructionsUrdu: 'کسی بھی کلائنٹ پر کلک کر کے اس کے سابقہ تمام ٹکٹس، ورک لاگز اور کالز کا ریکارڈ دیکھیں۔',
        instructionsEn: 'Click client row to open full workspace with contact tabs, license dates, and history.'
      }
    ],
    criticalRulesUrdu: [
      'اگر کسی کلائنٹ کا ہیلتھ اسکور 50 فیصد سے کم ہو تو وہ سرخ رنگ میں ہنگامی توجہ کا متقاضی ہوتا ہے۔',
      'کلائنٹ ورک اسپیس سے براہ راست واٹس ایپ میسج بھیجا جا سکتا ہے اور ٹریننگ چیک لسٹ مکمل کی جا سکتی ہے۔'
    ],
    criticalRulesEn: [
      'Clients with Health Score < 50% are marked Critical (Red) and require urgent proactive outreach.',
      'Direct WhatsApp scripts, AMC renewals, and training onboarding checklists can be completed from the workspace.'
    ],
    geminiPrompt: 'کلائنٹ ڈائریکٹری اور کلائنٹ ورک اسپیس کا مکمل ڈیمو دیں اور ہیلتھ اسکور کیسے بنتا ہے بتائیں۔'
  },
  {
    moduleId: ModuleId.FOLLOW_UP,
    titleUrdu: 'فالو اپ ٹریکر و واٹس ایپ (Follow-up Tracker)',
    titleEn: 'Follow-up Tracker & WhatsApp Outreach',
    badgeUrdu: 'کالز اور پیغامات',
    badgeEn: 'Outreach & Callbacks',
    overviewUrdu: 'کلائنٹس کو شیڈول کالز، یاددہانی پیغامات، اور سروس فالو اپ کرنے کا ذہین نظام۔ اس میں واٹس ایپ کے بنے بنائے ٹیمپلیٹس بھی شامل ہیں۔',
    overviewEn: 'Dedicated callback queue and communication system to execute scheduled client check-ins, renewal reminders, and WhatsApp template scripts.',
    formFields: [
      {
        nameUrdu: 'کلائنٹ کا انتخاب (Target Client)',
        nameEn: 'Support Client *',
        required: true,
        sampleValue: 'Gulshan Medical Store',
        instructionsUrdu: 'جس کلائنٹ کو کال یا میسج کرنا ہے اسے منتخب کریں۔',
        instructionsEn: 'Select the customer account for the scheduled check-in.'
      },
      {
        nameUrdu: 'رابطے کی وجہ (Purpose / Reason)',
        nameEn: 'Purpose / Reason *',
        required: true,
        sampleValue: 'Printer margin alignment verification after upgrade',
        instructionsUrdu: 'رابطے کا مقصد واضح لکھیں۔',
        instructionsEn: 'Provide concrete context for the callback.'
      },
      {
        nameUrdu: 'تاریخ و وقت (Due Date & Time)',
        nameEn: 'Due Date & Time *',
        required: true,
        sampleValue: 'Tomorrow, 11:30 AM',
        instructionsUrdu: 'وہ تاریخ اور وقت سیٹ کریں جب رابطہ کرنا ہے۔',
        instructionsEn: 'Set scheduled date and time for the follow-up reminder.'
      },
      {
        nameUrdu: 'کال لاگ اور نتیجہ (Call Outcome)',
        nameEn: 'Call Outcome Selection',
        required: true,
        sampleValue: 'Answered & Resolved',
        instructionsUrdu: 'کال ختم ہونے پر نتیجہ منتخب کریں (اٹینڈ ہوئی، مصروف، یا جواب نہیں ملا)۔',
        instructionsEn: 'One-touch outcome selector: Answered & Resolved, Busy, No Answer, or Disconnected.'
      }
    ],
    criticalRulesUrdu: [
      'آج کے تمام فالو اپس کو اسی دن شام تک مکمل کرنا ضروری ہے۔ تاخیر شدہ فالو اپس سرخ ہو جاتے ہیں۔',
      'اگر کلائنٹ سے رابطہ نہ ہو سکے تو "نیا وقت (Reschedule)" کا بٹن دبا کر نیا وقت سیٹ کریں۔'
    ],
    criticalRulesEn: [
      'All scheduled follow-ups for today must be cleared or rescheduled before shift end.',
      'Use the One-Touch Reschedule button to set a new retry time if client is unavailable.'
    ],
    geminiPrompt: 'فالو اپ ٹریکر میں نیا فالو اپ شیڈول کرنے اور واٹس ایپ ٹیمپلیٹس استعمال کرنے کا طریقہ بتائیں۔'
  },
  {
    moduleId: ModuleId.COO_DASHBOARD,
    titleUrdu: 'سی او او کنٹرول روم و کوٹہ (COO Dashboard)',
    titleEn: 'COO Operations Command Room',
    badgeUrdu: 'انتظامی جائزہ و منظوری',
    badgeEn: 'Executive Audit & Approvals',
    overviewUrdu: 'آپریشنز ہیڈ اور سی او او کے لیے خصوصی سکرین۔ یہاں تمام ملازمین کی پروڈکٹیوٹی، 420 منٹ کوٹہ کی تکمیل، اور فلگ شدہ ورک لاگز کی منظوری یا مستردگی ہوتی ہے۔',
    overviewEn: 'Executive command room providing workforce productivity ranking, 420-minute daily quota compliance, and work log approval queue.',
    formFields: [
      {
        nameUrdu: 'ورک لاگ منظوری / مستردگی',
        nameEn: 'Log Approval / Rejection Queue',
        required: false,
        sampleValue: 'Approve or Reject with Remarks',
        instructionsUrdu: 'لاگز کے ثبوت (گوگل میٹ لنک) چیک کر کے منظور (Approve) یا ریمارکس کے ساتھ مسترد (Reject) کریں۔',
        instructionsEn: 'Audit work session proof links and approve or reject with disciplinary feedback.'
      },
      {
        nameUrdu: 'کارکردگی رینکنگ فلٹر',
        nameEn: 'Productivity Ranking Filter',
        required: false,
        sampleValue: 'Today / This Week / This Month',
        instructionsUrdu: 'ملازمین کی کارکردگی اور کل منٹ دیکھنے کے لیے مدت منتخب کریں۔',
        instructionsEn: 'Switch time windows to view staff quota fulfillment and SLA compliance rates.'
      }
    ],
    criticalRulesUrdu: [
      'سی او او پورٹل سے کسی بھی غیر تصدیق شدہ یا جعلی ورک لاگ کو فوری طور پر مسترد کیا جا سکتا ہے۔',
      'جو ایگزیکٹو 420 منٹ سے کم کام کرے گا وہ انتباہی زون میں نظر آئے گا۔'
    ],
    criticalRulesEn: [
      'COO has unilateral authority to approve or reject deficient or unverified work sessions.',
      'Executives logging under 420 minutes are highlighted in warning thresholds.'
    ],
    geminiPrompt: 'سی او او ڈیش بورڈ میں لاگز کی منظوری، کوٹہ آڈٹ اور ٹیم کی کارکردگی کا جائزہ کیسے لیا جاتا ہے؟'
  },
  {
    moduleId: ModuleId.USER_MANAGEMENT,
    titleUrdu: 'یوزر مینجمنٹ و اختیارات (User Management & Access)',
    titleEn: 'User Management & Role Permissions',
    badgeUrdu: 'صارفین اور رسائی کے اصول',
    badgeEn: 'RBAC Access Rules',
    overviewUrdu: 'پورٹل میں نئے ملازمین کا اندراج، ان کے پاس ورڈ ری سیٹ کرنا، اور مختلف رولز (سپورٹ ایگزیکٹو، ٹیکنیکل لیڈ، سی او او) کے ماڈیول اختیارات (Access Rules) آن یا آف کرنا۔',
    overviewEn: 'Manage staff accounts, employee IDs, status, passwords, and configure granular role-based access rules (RBAC).',
    formFields: [
      {
        nameUrdu: 'ملازم کا نام (Employee Name)',
        nameEn: 'Full Name *',
        required: true,
        sampleValue: 'Muhammad Ali',
        instructionsUrdu: 'ملازم کا مکمل نام درج کریں۔',
        instructionsEn: 'Official employee full name.'
      },
      {
        nameUrdu: 'ای میل / یوزر آئی ڈی (Email / ID)',
        nameEn: 'Email Address / Staff ID *',
        required: true,
        sampleValue: 'ali@technoevident.com / TE-105',
        instructionsUrdu: 'کمپنی کا سرکاری ای میل یا ملازم آئی ڈی درج کریں۔',
        instructionsEn: 'Corporate email address or employee identifier.'
      },
      {
        nameUrdu: 'ملازم کا عہدہ (Designation Role)',
        nameEn: 'Role Selection *',
        required: true,
        sampleValue: 'Support Executive / Technical Lead / COO',
        instructionsUrdu: 'ملازم کا رول منتخب کریں جس کے مطابق اسے پورٹل میں اختیارات ملیں گے۔',
        instructionsEn: 'Assign permission tier: Support Executive, Technical Lead, COO, or Admin.'
      },
      {
        nameUrdu: 'رسائی کے اصول (Access Rules Toggles)',
        nameEn: 'Module Permission Toggles',
        required: false,
        sampleValue: 'Tickets, Work Log, Clients, COO',
        instructionsUrdu: 'ہر ماڈیول کا بٹن آن یا آف کر کے اس رول کے لیے پیج کی رسائی کو کنٹرول کریں۔',
        instructionsEn: 'Toggle switches to enable or disable specific modules for each role.'
      }
    ],
    criticalRulesUrdu: [
      'ایڈمن کے علاوہ کوئی بھی صارف رسائی کے اصولوں (Access Rules) میں ردوبدل نہیں کر سکتا۔',
      'کسی ملازم کی رخصتی پر اسے فوری طور پر Deactivate کیا جانا چاہیے۔'
    ],
    criticalRulesEn: [
      'Access rules can only be edited by authorized Super Admin / Director accounts.',
      'Departing staff members must be promptly marked Inactive to revoke system access.'
    ],
    geminiPrompt: 'یوزر مینجمنٹ میں نیا ملازم بنانے اور ماڈیولز کے رسائی اصول (RBAC) تبدیل کرنے کا طریقہ بتائیں۔'
  },
  {
    moduleId: ModuleId.POLICIES,
    titleUrdu: '28 آپریشنل قواعد و ضوابط (Policies & Rules)',
    titleEn: '28 Operational Rules & Violation Engine',
    badgeUrdu: 'کمپنی کی لازمی پالیسیز',
    badgeEn: 'Compliance & Notices',
    overviewUrdu: 'ٹیکنو ایویڈنٹ کے تمام 28 لازمی آپریشنل قوانین کی مکمل گائیڈ اور باضابطہ تنبیہی نوٹس جنریٹر۔ یہاں سے ملازمین کے لیے فوری شوکاز یا وارننگ نوٹس تیار کر کے پرنٹ یا واٹس ایپ کیا جا سکتا ہے۔',
    overviewEn: 'Master repository of 28 operational standards and automated violation notice generator for non-compliance and unverified logs.',
    formFields: [
      {
        nameUrdu: 'پالیسی تلاش و فلٹر (Policy Filter)',
        nameEn: 'Category Filter (A, B, C, D)',
        required: false,
        sampleValue: 'A: Attendance, B: Proof, C: Etiquette, D: Sync',
        instructionsUrdu: 'مطلوبہ قانون پڑھنے کے لیے کیٹیگری کا انتخاب کریں۔',
        instructionsEn: 'Filter rules by Attendance, Proof & Logs, Etiquette, or Systems.'
      },
      {
        nameUrdu: 'تنبیہی نوٹس جنریٹر (Notice Generator)',
        nameEn: 'Violation Parameters',
        required: false,
        sampleValue: 'Select Executive, Rule #14, Written Warning',
        instructionsUrdu: 'ملازم کا نام اور خلاف ورزی شدہ رول منتخب کر کے فوری طور پر باضابطہ نوٹس بنائیں۔',
        instructionsEn: 'Configure staff name, violated rule ID, and penalty tier to generate bilingual notice.'
      }
    ],
    criticalRulesUrdu: [
      'تمام ٹیکنیکل ملازمین ان 28 اصولوں کی مکمل پابندی کے پابند ہیں۔',
      'کسی بھی اصول کی خلاف ورزی پر نوٹس جنریٹر سے باضابطہ نوٹس 12 گھنٹوں کے اندر متعلقہ ملازم کو جاری کیا جاتا ہے۔'
    ],
    criticalRulesEn: [
      'All staff members are legally bound to adhere to the 28 operational rules.',
      'Violations generate official bilingual notices with 12-hour response deadlines.'
    ],
    geminiPrompt: 'کمپنی کے 28 آپریشنل اصولوں کا مکمل خلاصہ اور نوٹس بنانے کا طریقہ سمجھائیں۔'
  },
  {
    moduleId: 'payroll',
    titleUrdu: 'پے رول و حاضری پورٹل (Payroll Portal)',
    titleEn: 'Official Payroll & Attendance Portal',
    badgeUrdu: 'بیرونی سرکاری لنک',
    badgeEn: 'technoevident.xyz',
    overviewUrdu: 'ٹیکنو ایویڈنٹ کا مرکزی پے رول اور بائیو میٹرک حاضری پورٹل۔ تمام ملازمین کے لیے روزانہ شفٹ شروع کرتے وقت اور ختم کرتے وقت اس پورٹل پر لاگ ان ہونا اور حاضری مارک کرنا لازمی ہے۔',
    overviewEn: 'The central corporate attendance and payroll management portal at technoevident.xyz for daily clock-in and clock-out.',
    formFields: [
      {
        nameUrdu: 'سرکاری پورٹل لنک (URL)',
        nameEn: 'Direct Web Portal Link',
        required: true,
        sampleValue: 'https://technoevident.xyz/',
        instructionsUrdu: 'ہیڈر کے بٹن پر کلک کر کے پے رول پورٹل کھولیں اور اپنی حاضری درج کریں۔',
        instructionsEn: 'Click the link in the top bar to access the external payroll portal.'
      }
    ],
    criticalRulesUrdu: [
      'صبح 10:00 بجے تک پے رول پورٹل پر حاضری لگانا لازمی ہے۔ 10:20 کے بعد کی انٹری تاخیر شمار ہوگی۔',
      'مہینے میں 3 لیٹ انٹریز پر نصف دن کی تنخواہ میں کٹوتی کی جاتی ہے۔'
    ],
    criticalRulesEn: [
      'Must clock in on technoevident.xyz by 10:00 AM daily.',
      'Three late clock-ins within a month result in a half-day salary deduction.'
    ],
    geminiPrompt: 'پے رول پورٹل کیا ہے اور اس پر حاضری مارک کرنے کی کیا شرائط اور اوقات ہیں؟'
  }
];

export const InteractiveDemoGuide: React.FC = () => {
  const { 
    isDemoGuideOpen, 
    setDemoGuideOpen, 
    demoActiveModule, 
    setCurrentModule, 
    language 
  } = useApp();

  const isUrdu = language === 'ur';

  // State
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [walkthroughActive, setWalkthroughActive] = useState(false);

  // Sync selected index when demoActiveModule changes
  useEffect(() => {
    if (demoActiveModule) {
      const idx = PAGE_GUIDES.findIndex(p => p.moduleId === demoActiveModule);
      if (idx !== -1) {
        setSelectedIndex(idx);
      }
    }
  }, [demoActiveModule]);

  if (!isDemoGuideOpen) return null;

  const currentGuide = PAGE_GUIDES[selectedIndex] || PAGE_GUIDES[0];

  const handleNext = () => {
    if (selectedIndex < PAGE_GUIDES.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else {
      setSelectedIndex(0);
    }
  };

  const handlePrev = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else {
      setSelectedIndex(PAGE_GUIDES.length - 1);
    }
  };

  const handleJumpToPage = (moduleId: ModuleId | 'activation' | 'payroll') => {
    setDemoGuideOpen(false);
    if (moduleId === 'payroll') {
      window.open('https://technoevident.xyz/', '_blank');
      return;
    }
    if (moduleId === 'activation') {
      setCurrentModule(ModuleId.CLIENTS);
      return;
    }
    setCurrentModule(moduleId as ModuleId);
  };

  const handleAskGemini = (prompt: string) => {
    setDemoGuideOpen(false);
    setCurrentModule(ModuleId.AI_ASSISTANT);
    // Note: Can emit event or localStorage prompt
    try {
      localStorage.setItem('tedos_pending_gemini_prompt', prompt);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fade-in">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-4xl max-h-[92vh] bg-md-surface rounded-3xl border border-md-surface-variant shadow-2xl flex flex-col overflow-hidden text-md-on-surface"
      >
        {/* HEADER BAR */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shadow-md select-none shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-xs shadow-inner">
              <Compass size={24} className="text-amber-300 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide">
                  {isUrdu ? "سافٹ ویئر ڈیمو و استعمال کی گائیڈ" : "TEDOS Interactive Software Tour & Guide"}
                </h2>
                <span className="bg-amber-400 text-slate-900 font-bold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                  {isUrdu ? "مکمل ٹریننگ" : "Live Walkthrough"}
                </span>
              </div>
              <p className="text-[11px] text-blue-100/90 font-medium">
                {isUrdu 
                  ? "کونسے پیج پر کیا کام ہے، اسے کیسے استعمال کریں، اور فارم میں کیا کیا فل کرنا ہے؟" 
                  : "Step-by-step master walkthrough: What is on every screen and how to fill all forms."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWalkthroughActive(!walkthroughActive)}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                walkthroughActive 
                  ? 'bg-amber-400 text-slate-900 shadow-sm' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <PlayCircle size={14} />
              <span>{walkthroughActive ? (isUrdu ? 'ٹور موڈ فعال ہے' : 'Tour Active') : (isUrdu ? 'اسٹیپ بائی اسٹیپ ٹور' : 'Step Tour')}</span>
            </button>

            <button
              onClick={() => setDemoGuideOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer"
              title={isUrdu ? "بند کریں" : "Close"}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MAIN BODY LAYOUT */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* SIDEBAR: PAGE NAVIGATION PILLS */}
          <div className="w-full md:w-64 bg-md-surface-container-low border-b md:border-b-0 md:border-r border-md-surface-variant p-2 sm:p-3 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-1.5 shrink-0 select-none">
            <span className="hidden md:block text-[10px] font-mono font-black text-md-outline uppercase tracking-wider px-2 py-1">
              {isUrdu ? "تمام صفحات کی فہرست" : "Software Modules & Pages"}
            </span>

            {PAGE_GUIDES.map((guide, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={guide.titleEn}
                  onClick={() => setSelectedIndex(idx)}
                  className={`px-3 py-2.5 rounded-2xl text-xs font-bold text-left transition-all flex items-center justify-between shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-md-on-surface-variant hover:bg-md-surface-variant/40'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-md-surface-variant text-md-outline'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="truncate">{isUrdu ? guide.titleUrdu.split('(')[0] : guide.titleEn}</span>
                  </div>

                  <ChevronRight size={12} className={`hidden md:block shrink-0 ${isSelected ? 'text-white' : 'text-md-outline/60'}`} />
                </button>
              );
            })}
          </div>

          {/* CONTENT AREA: ACTIVE PAGE GUIDE DETAILS */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Page Title & Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-md-surface-variant pb-3 select-none">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-md bg-blue-600/10 text-blue-700 dark:text-blue-300 border border-blue-600/20">
                    {isUrdu ? `صفحہ ${selectedIndex + 1} از ${PAGE_GUIDES.length}` : `Step ${selectedIndex + 1} of ${PAGE_GUIDES.length}`}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    {isUrdu ? currentGuide.badgeUrdu : currentGuide.badgeEn}
                  </span>
                </div>
                <h3 className="text-lg font-black text-md-on-surface mt-1">
                  {isUrdu ? currentGuide.titleUrdu : currentGuide.titleEn}
                </h3>
              </div>

              {/* Jump directly to page action */}
              <button
                onClick={() => handleJumpToPage(currentGuide.moduleId)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
              >
                <span>{isUrdu ? "اس پیج پر جائیں ↗" : "Open Page Now ↗"}</span>
              </button>
            </div>

            {/* 1. OVERVIEW: WHAT THIS PAGE DOES */}
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 space-y-1.5">
              <h4 className="text-xs font-black text-blue-800 dark:text-blue-300 flex items-center gap-1.5 uppercase tracking-wide">
                <Compass size={15} />
                <span>{isUrdu ? "اس پیج کا کیا کام ہے اور یہ کیوں ہے؟" : "What is this page for?"}</span>
              </h4>
              <p className="text-xs leading-relaxed text-blue-950 dark:text-blue-100 font-medium">
                {isUrdu ? currentGuide.overviewUrdu : currentGuide.overviewEn}
              </p>
            </div>

            {/* 2. FORM FIELDS: WHAT TO FILL */}
            <div className="space-y-3">
              <div className="flex items-center justify-between select-none">
                <h4 className="text-xs font-black text-md-on-surface flex items-center gap-1.5 uppercase tracking-wider">
                  <FileText size={15} className="text-amber-500" />
                  <span>{isUrdu ? "فارم میں کیا کیا فل کرنا ہے؟ (فیلڈ گائیڈ)" : "What to fill in this form (Field Instructions)"}</span>
                </h4>
                <span className="text-[10px] text-md-outline font-semibold">
                  {isUrdu ? "* ستارے والی فیلڈز لازمی ہیں" : "* Required fields marked with asterisk"}
                </span>
              </div>

              <div className="space-y-2.5">
                {currentGuide.formFields.map((field, fIdx) => (
                  <div 
                    key={field.nameEn}
                    className="p-3.5 rounded-2xl bg-md-surface-container border border-md-surface-variant space-y-1.5 hover:border-blue-400/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-blue-600/10 text-blue-700 dark:text-blue-300 font-mono font-bold text-[10px] flex items-center justify-center">
                          {fIdx + 1}
                        </span>
                        <h5 className="text-xs font-bold text-md-on-surface">
                          {isUrdu ? field.nameUrdu : field.nameEn}
                        </h5>
                        {field.required ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            {isUrdu ? "لازمی *" : "Required *"}
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded-full bg-slate-500/10 text-slate-500">
                            {isUrdu ? "اختیاری" : "Optional"}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-mono text-md-outline bg-md-surface-container-high px-2 py-0.5 rounded-lg border border-md-outline/10">
                        {isUrdu ? "مثال: " : "e.g. "} {field.sampleValue}
                      </span>
                    </div>

                    <p className="text-[11px] text-md-on-surface-variant font-medium leading-relaxed">
                      {isUrdu ? field.instructionsUrdu : field.instructionsEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. CRITICAL RULES & SOPS */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 select-none">
              <h4 className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                <AlertCircle size={15} className="text-amber-600" />
                <span>{isUrdu ? "اہم کمپنی قواعد و ایس او پی شرائط (Strict SOP Rules)" : "Critical SOP Rules & Guidelines"}</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-amber-950 dark:text-amber-100 font-medium">
                {(isUrdu ? currentGuide.criticalRulesUrdu : currentGuide.criticalRulesEn).map((rule, rIdx) => (
                  <li key={rIdx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-amber-600 font-bold shrink-0 mt-0.5">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. ASK GEMINI CO-PILOT CARD */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-xs">
                  <Bot size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-md-on-surface">
                    {isUrdu ? "Gemini AI کو پائلٹ سے تفصیلی گائیڈ لیں" : "Need more help? Ask Gemini AI Co-pilot"}
                  </h4>
                  <p className="text-[11px] text-md-outline">
                    {isUrdu ? "پورٹل اور اس صفحے کے بارے میں کوئی بھی سوال لائیو پوچھیں" : "Gemini is fully trained on this entire software and ready to answer."}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleAskGemini(currentGuide.geminiPrompt)}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
              >
                <Sparkles size={13} />
                <span>{isUrdu ? "Gemini سے رہنمائی لیں" : "Ask Gemini AI"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER BAR: STEP CONTROLS */}
        <div className="p-3 sm:p-4 bg-md-surface-container-low border-t border-md-surface-variant flex items-center justify-between gap-3 select-none shrink-0">
          <button
            onClick={handlePrev}
            className="px-4 py-2.5 rounded-xl border border-md-surface-variant hover:bg-md-surface-variant/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>{isUrdu ? "پچھلا صفحہ" : "Previous Page"}</span>
          </button>

          <div className="flex items-center gap-1">
            {PAGE_GUIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  selectedIndex === idx ? 'w-6 bg-blue-600' : 'bg-md-outline/30 hover:bg-md-outline/60'
                }`}
                title={`Page ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>{isUrdu ? "اگلا صفحہ" : "Next Page"}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
