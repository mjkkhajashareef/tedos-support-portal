/**
 * Utility functions for WhatsApp Web and Interakt WhatsApp Business API
 * Supporting:
 * - Interakt API integration (Single Central Business Number for all clients)
 * - TaleemPro (100% Urdu messages)
 * - Edsof (100% English messages, "Your Edsof")
 * - Philsof (Philsof Solutions branding)
 * - NO generic "TEDOS ERP v4.5"
 */

export type ClientSoftwareBrand = 'TALEEMPRO' | 'EDSOF' | 'PHILSOF';

export interface InteraktConfig {
  enabled: boolean;
  apiKey: string;
  senderNumber: string;
  companyDisplayName: string;
  defaultLanguageMode: 'auto' | 'ur' | 'en';
  lastTestedAt?: string | null;
  lastTestStatus?: 'idle' | 'success' | 'failed';
  lastTestMessage?: string;
}

export const DEFAULT_INTERAKT_CONFIG: InteraktConfig = {
  enabled: true,
  apiKey: '',
  senderNumber: '+92 300 0000000',
  companyDisplayName: 'Techno Evident / TaleemPro Official',
  defaultLanguageMode: 'auto',
  lastTestedAt: null,
  lastTestStatus: 'idle',
  lastTestMessage: ''
};

/**
 * Detect client brand from client profile:
 * - If department/plan/notes/name contains 'edsof' => EDSOF
 * - If contains 'philsof' => PHILSOF
 * - Default for school management in Pakistan => TALEEMPRO
 */
export function detectClientBrand(client?: {
  name?: string;
  company?: string;
  department?: string;
  plan?: string;
  notes?: string;
}): ClientSoftwareBrand {
  if (!client) return 'TALEEMPRO';
  const combined = `${client.department || ''} ${client.plan || ''} ${client.name || ''} ${client.company || ''} ${client.notes || ''}`.toLowerCase();

  if (combined.includes('edsof') || combined.includes('ed-sof') || combined.includes('ed sof')) {
    return 'EDSOF';
  }
  if (combined.includes('philsof') || combined.includes('phil-sof') || combined.includes('phil sof')) {
    return 'PHILSOF';
  }
  return 'TALEEMPRO';
}

export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // Replace leading 0 with 92 (Pakistan)
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.substring(1);
  }
  
  // 10 digits starting with 3 -> 92 + 3...
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    cleaned = '92' + cleaned;
  }
  
  return cleaned;
}

export function formatInteraktPhone(rawPhone: string): { countryCode: string; phoneNumber: string; fullNumber: string } {
  const cleaned = sanitizePhoneNumber(rawPhone);
  let countryCode = '+92';
  let phoneNumber = cleaned;

  if (cleaned.startsWith('92')) {
    countryCode = '+92';
    phoneNumber = cleaned.substring(2);
  } else if (cleaned.startsWith('91')) {
    countryCode = '+91';
    phoneNumber = cleaned.substring(2);
  } else if (cleaned.startsWith('966')) {
    countryCode = '+966';
    phoneNumber = cleaned.substring(3);
  }

  return {
    countryCode,
    phoneNumber,
    fullNumber: countryCode + phoneNumber
  };
}

export function normalizeIndianPhone(phone?: string): string {
  return sanitizePhoneNumber(phone || '');
}

export interface BrandedMessageOptions {
  client?: {
    name?: string;
    company?: string;
    department?: string;
    plan?: string;
    phone?: string;
    googleMapLink?: string;
  };
  type: 
    | 'review_link_only' 
    | 'review_with_feedback' 
    | 'support_followup' 
    | 'ticket_alert' 
    | 'letterpad'
    | 'training_scheduled'
    | 'backup_verified'
    | 'quick_checkin';
  executiveName?: string;
  customNotes?: string;
  pagesUsed?: string; // e.g. "Fee Collection, Student Admission, Accounts"
  ticketInfo?: { id: string; status: string; issue: string };
  mapUrl?: string;
  forceLanguage?: 'ur' | 'en';
}

/**
 * Builds branded WhatsApp messages:
 * - TaleemPro => 100% Pure Urdu
 * - Edsof => 100% Pure English (Your Edsof)
 * - Philsof => Philsof Branding
 * - NEVER mentions "TEDOS ERP v4.5"
 */
export function buildBrandedWhatsAppMessage(options: BrandedMessageOptions): string {
  const brand = detectClientBrand(options.client);
  const clientName = options.client?.company || options.client?.name || (brand === 'TALEEMPRO' ? 'محترم کلائنٹ' : 'Valued Client');
  const exec = options.executiveName || (brand === 'TALEEMPRO' ? 'سپورٹ ایگزیکٹو' : 'Support Executive');
  const mapLink = options.mapUrl || options.client?.googleMapLink || 'https://www.google.com/maps/search/?api=1&query=Techno+Evident+Software+Solutions';
  const pagesUr = options.pagesUsed || 'فیس، داخلہ، حاضری و اکاؤنٹس ماڈیولز';
  const pagesEn = options.pagesUsed || 'Fee, Admissions, Attendance & Accounts Modules';

  // 1. TaleemPro (Pure Urdu)
  if (brand === 'TALEEMPRO' && options.forceLanguage !== 'en') {
    switch (options.type) {
      case 'review_link_only':
        return `السلام علیکم ورحمۃ اللہ، محترم ${clientName}!
تعلیم پرو (TaleemPro) کسٹمر سپورٹ ٹیم سے رابطہ کرنے کا شکریہ۔
برائے مہربانی ہمارے گوگل میپ پر اپنا قیمتی ریویو اور فیڈبیک ضرور شیئر فرمائیں:
🌐 ریویو لنک: ${mapLink}
آپ کے تعاون اور اعتماد کے لیے ہم تہہ دل سے شکر گزار ہیں!
— تعلیم پرو کسٹمر سپورٹ ٹیم (${exec})`;

      case 'review_with_feedback':
        return `السلام علیکم ورحمۃ اللہ، محترم ${clientName}!
امید ہے آپ بخیریت ہوں گے۔ آپ نے تعلیم پرو سافٹ ویئر کے ماڈیولز (${pagesUr}) کا جائزہ لیا اور کسٹمر سپورٹ حاصل کی۔
اگر آپ ہماری خدمات سے مطمئن ہیں تو برائے مہربانی یہ ریویو گوگل میپ پر پوسٹ فرما دیں:
⭐⭐⭐⭐⭐
"تعلیم پرو اسکول مینجمنٹ سافٹ ویئر اور ان کی کسٹمر سپورٹ ٹیم بہت شاندار ہے۔ ہمارے تمام مسائل اور سوالات کا فوری حل فراہم کیا گیا!"
🌐 گوگل میپ ریویو لنک: ${mapLink}
— تعلیم پرو کسٹمر سپورٹ ٹیم`;

      case 'ticket_alert':
        return `السلام علیکم، محترم ${clientName}!
تعلیم پرو (TaleemPro) سپورٹ پورٹل پر آپ کا ٹکٹ #${options.ticketInfo?.id || ''} درج کر لیا گیا ہے۔
📋 عنوان / مسئلہ: ${options.ticketInfo?.issue || options.customNotes || 'تکنیکی معاونت'}
📌 اسٹیٹس: ${options.ticketInfo?.status || 'زیرِ کارروائی (In Progress)'}
ہماری ٹیکنیکل ٹیم اس کو ترجیحی بنیاد پر حل کر رہی ہے۔
— تعلیم پرو کسٹمر کیئر`;

      case 'training_scheduled':
        return `السلام علیکم ورحمۃ اللہ، محترم ${clientName}!
تعلیم پرو (TaleemPro) اسکول مینجمنٹ سافٹ ویئر کے لیے آپ کا اسٹاف ٹریننگ سیشن آج گوگل میٹ کے ذریعے شیڈول ہے۔
برائے مہربانی اپنے متعلقہ اسٹاف کے ہمراہ وقت پر تشریف لائیں۔
تفصیلات / موضوع: ${options.customNotes || 'نئے فیچرز اور فیس و داخلہ ٹریننگ'}
— تعلیم پرو ٹریننگ ڈیپارٹمنٹ (${exec})`;

      case 'backup_verified':
        return `السلام علیکم ورحمۃ اللہ، محترم ${clientName}!
تعلیم پرو (TaleemPro) سپورٹ ٹیم کی جانب سے اطلاع دی جاتی ہے کہ آپ کے اسکول سافٹ ویئر کا یومیہ کلاؤڈ بیک اپ اور ڈیٹا کی صحت کامیابی سے تصدیق کر لی گئی ہے۔ تمام ماڈیولز محفوظ اور درست فعال ہیں۔
— تعلیم پرو ٹیکنیکل آپریشنز`;

      case 'letterpad':
        return `بخدمت جناب ایڈمنسٹریٹر، ${clientName}
عنوان: تعلیم پرو (TaleemPro) تکنیکی معائنہ و سروس رپورٹ
السلام علیکم ورحمۃ اللہ!
آپ کے ادارے میں تعلیم پرو اسکول مینجمنٹ سافٹ ویئر کی کارکردگی اور ڈیٹا کا تکنیکی معائنہ مکمل کر لیا گیا ہے۔
خلاصہ: ${options.customNotes || 'سسٹم معمول کے مطابق مکمل فعال اور محفوظ ہے۔'}
کسی بھی مزید رہنمائی یا ٹریننگ کے لیے ہم ہر وقت حاضر ہیں۔
— مخلص: تعلیم پرو کسٹمر سروس ڈیپارٹمنٹ`;

      case 'quick_checkin':
      case 'support_followup':
      default:
        return `السلام علیکم ورحمۃ اللہ، محترم ${clientName}!
امید ہے آپ بخیریت ہوں گے۔ تعلیم پرو (TaleemPro) سپورٹ ٹیم کی جانب سے یہ فالو اپ رابطہ ہے۔
کیا سافٹ ویئر میں تمام امور، فیس کلیکشن اور حاضری کے ماڈیولز بالکل درست چل رہے ہیں؟
اگر کسی بھی ماڈیول میں ٹریننگ یا معاونت درکار ہو تو مطلع فرمائیں۔
— تعلیم پرو کسٹمر سپورٹ ٹیم (${exec})`;
    }
  }

  // 2. Edsof (Pure English - "Your Edsof")
  if (brand === 'EDSOF' || options.forceLanguage === 'en') {
    switch (options.type) {
      case 'review_link_only':
        return `Hello ${clientName}!
Thank you for connecting with your Edsof Support Team.
Could you please take 30 seconds to share your valuable rating and review on our Google Maps profile?
🌐 Review Link: ${mapLink}
We sincerely appreciate your partnership and trust in Edsof!
— Your Edsof Customer Support Team (${exec})`;

      case 'review_with_feedback':
        return `Hello ${clientName}!
Thank you for using Edsof software solutions (${pagesEn}). If you are satisfied with our technical assistance, here is a quick draft you can share on Google:
⭐⭐⭐⭐⭐
"Edsof software solutions and their support team provide outstanding assistance. Fast response times and dependable features!"
🌐 Google Map Link: ${mapLink}
— Your Edsof Support Team`;

      case 'ticket_alert':
        return `Dear ${clientName},
Your support ticket #${options.ticketInfo?.id || ''} has been registered with your Edsof Support Desk.
Subject / Issue: ${options.ticketInfo?.issue || options.customNotes || 'Technical Assistance'}
Status: ${options.ticketInfo?.status || 'In Progress'}
Our senior engineering team is resolving this with high priority.
— Your Edsof Customer Care`;

      case 'training_scheduled':
        return `Hello ${clientName}!
Your staff training session for Edsof is scheduled for today via Google Meet.
Topic: ${options.customNotes || 'Core Modules & Operations Training'}
Please join with your team at the scheduled time.
— Your Edsof Training Team (${exec})`;

      case 'backup_verified':
        return `Hello ${clientName}!
Your Edsof Support Team here. We have verified your daily cloud backup and system database health status. Everything is running smoothly and fully secured.
— Your Edsof Technical Operations`;

      case 'letterpad':
        return `OFFICIAL SERVICE REPORT — EDSOF SOLUTIONS
To: The Management, ${clientName}
Subject: Technical Support & Software Operations Summary
We have inspected and verified your Edsof system operations.
Summary: ${options.customNotes || 'All operational modules verified and functioning properly.'}
For further queries, please reach out to your assigned account executive.
— Your Edsof Customer Success Team`;

      case 'quick_checkin':
      case 'support_followup':
      default:
        return `Hello ${clientName}!
This is a follow-up check-in from your Edsof Support Team.
Is everything running smoothly with your system today? Please let us know if you require any assistance, reports, or staff training.
— Your Edsof Support Team (${exec})`;
    }
  }

  // 3. Philsof (Philsof Branding)
  switch (options.type) {
    case 'review_link_only':
      return `Hello ${clientName}!
Thank you for using Philsof Enterprise Software.
We would truly appreciate your rating and feedback on our Google profile:
🌐 Google Map Link: ${mapLink}
Thank you for choosing Philsof!
— Philsof Technical Support (${exec})`;

    case 'review_with_feedback':
      return `Hello ${clientName}!
Thank you for reviewing your Philsof system operations (${pagesEn}). Here is a draft review for your convenience:
⭐⭐⭐⭐⭐
"Philsof software and customer support are highly dependable. Outstanding service and user-friendly modules!"
🌐 Review Link: ${mapLink}
— Philsof Software Support`;

    case 'ticket_alert':
      return `Dear ${clientName},
Philsof Ticket #${options.ticketInfo?.id || ''} is currently ${options.ticketInfo?.status || 'In Progress'}.
Issue: ${options.ticketInfo?.issue || options.customNotes || 'System Support'}
— Philsof Client Desk`;

    case 'training_scheduled':
      return `Hello ${clientName}!
Your staff training session for Philsof Enterprise Software is scheduled for today via Google Meet.
— Philsof Training Team`;

    case 'backup_verified':
      return `Hello ${clientName}!
Philsof Operations here. We have verified your daily cloud backup and system database health status.
— Philsof Technical Operations`;

    case 'letterpad':
      return `OFFICIAL MEMORANDUM — PHILSOF SOFTWARE
To: ${clientName}
Subject: Philsof Enterprise System Operations Check
Summary: ${options.customNotes || 'All modules inspected and functioning as designed.'}
— Philsof Technical Department`;

    case 'quick_checkin':
    case 'support_followup':
    default:
      return `Hello ${clientName}!
This is a routine follow-up from Philsof Support Team.
Please let us know if you need any assistance with billing, reports, or operations.
— Philsof Support Desk (${exec})`;
  }
}

/**
 * Open direct WhatsApp Web (fallback or personal direct chat)
 */
export function openWhatsAppChat(
  phoneOrOptions: string | { phone?: string; message?: string },
  textArg?: string
): boolean {
  let phone = '';
  let text = '';

  if (typeof phoneOrOptions === 'object' && phoneOrOptions !== null) {
    phone = phoneOrOptions.phone || '';
    text = phoneOrOptions.message || '';
  } else if (typeof phoneOrOptions === 'string') {
    phone = phoneOrOptions;
    text = textArg || '';
  }

  const cleanPhone = sanitizePhoneNumber(phone);
  const encodedText = encodeURIComponent(text.trim());
  
  let url = '';
  if (cleanPhone) {
    url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
  } else {
    url = `https://wa.me/?text=${encodedText}`;
  }
  
  try {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    return !!newWindow;
  } catch (err) {
    console.warn('Failed to open WhatsApp window:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Interakt WhatsApp Business API Client Helpers
// ---------------------------------------------------------------------------

/**
 * Fetch Interakt API configuration from server
 */
export async function fetchInteraktConfig(): Promise<InteraktConfig> {
  try {
    const res = await fetch('/api/interakt/config');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.config) {
        localStorage.setItem('TEDOS_INTERAKT_CONFIG', JSON.stringify(data.config));
        return data.config;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch Interakt config from server, checking local cache:', err);
  }

  try {
    const cached = localStorage.getItem('TEDOS_INTERAKT_CONFIG');
    if (cached) return JSON.parse(cached);
  } catch {}

  return DEFAULT_INTERAKT_CONFIG;
}

/**
 * Save Interakt API configuration to server & local cache
 */
export async function saveInteraktConfig(incoming: Partial<InteraktConfig>): Promise<InteraktConfig> {
  try {
    const res = await fetch('/api/interakt/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incoming)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.config) {
        localStorage.setItem('TEDOS_INTERAKT_CONFIG', JSON.stringify(data.config));
        return data.config;
      }
    }
  } catch (err) {
    console.warn('Failed to save Interakt config to server:', err);
  }

  const merged = { ...DEFAULT_INTERAKT_CONFIG, ...incoming };
  localStorage.setItem('TEDOS_INTERAKT_CONFIG', JSON.stringify(merged));
  return merged;
}

/**
 * Test Interakt connection with API Key
 */
export async function testInteraktConnection(
  apiKey: string,
  testPhone?: string
): Promise<{ success: boolean; message: string; status?: number; data?: any }> {
  try {
    const res = await fetch('/api/interakt/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, testPhone })
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network error while testing Interakt API connection.'
    };
  }
}

export interface InteraktSendParams {
  phoneNumber: string;
  message: string;
  clientName?: string;
  clientBrand?: ClientSoftwareBrand;
  templateName?: string;
  templateValues?: string[];
}

export interface InteraktSendResult {
  success: boolean;
  messageId?: string;
  senderNumber?: string;
  channel?: 'INTERAKT_CENTRAL_WABA' | 'FALLBACK_WHATSAPP_WEB';
  fallbackUrl?: string;
  message?: string;
  error?: string;
}

/**
 * Dispatch message via Interakt Central Number API
 */
export async function sendInteraktMessage(params: InteraktSendParams): Promise<InteraktSendResult> {
  try {
    const res = await fetch('/api/interakt/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    const cleanDigits = sanitizePhoneNumber(params.phoneNumber);
    return {
      success: false,
      error: err?.message || 'Failed to dispatch via Interakt API',
      fallbackUrl: `https://wa.me/${cleanDigits}?text=${encodeURIComponent(params.message)}`
    };
  }
}
