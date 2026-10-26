/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ACTIVE_CONFIG, ACTIVE_ENV, CONFIG } from '../config/appConfig';
import { SupportClient, ClientLifecycleStatus } from '../types';

/**
 * ----------------------------------------------------
 * 1. UNIFORM ERROR HANDLER SYSTEM
 * ----------------------------------------------------
 */
export class AppError extends Error {
  public code: string;
  public status: number;
  public isOperational: boolean;

  constructor(message: string, code = 'SYSTEM_ERROR', status = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.isOperational = true;

    // Maintain clean stack trace for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Parses any caught exception into a standardized AppError
 */
export const parseError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof Error) {
    return new AppError(error.message, 'UNEXPECTED_ERROR', 500);
  }
  return new AppError(String(error), 'UNKNOWN_ERROR', 500);
};

/**
 * ----------------------------------------------------
 * 2. STRUCTURED TELEMETRY LOGGER
 * ----------------------------------------------------
 */
export const Logger = {
  debug: (context: string, message: string, data?: unknown) => {
    if (ACTIVE_ENV === 'development') {
      console.log(`%c[DEBUG] [${context}] ${message}`, 'color: #757780;', data ?? '');
    }
  },
  info: (context: string, message: string, data?: unknown) => {
    if (ACTIVE_ENV !== 'production' || ACTIVE_CONFIG.security.enableActivityAudit) {
      console.log(`%c[INFO] [${context}] ${message}`, 'color: #0F52BA; font-weight: bold;', data ?? '');
    }
  },
  warn: (context: string, message: string, data?: unknown) => {
    console.warn(`[WARN] [${context}] ${message}`, data ?? '');
  },
  error: (context: string, message: string, error?: unknown) => {
    console.error(`[ERROR] [${context}] ${message}`, error ?? '');
  },
};

/**
 * ----------------------------------------------------
 * 3. DATE & TIME FORMATTERS
 * ----------------------------------------------------
 */

/**
 * Formats an ISO date string to a human-readable display date
 * Example: "2026-07-08T04:01:15" -> "July 8, 2026"
 */
export const formatDate = (isoString: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  try {
    const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return new Intl.DateTimeFormat(ACTIVE_CONFIG.localization.currency.locale, options ?? {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch (err) {
    Logger.error('Helpers.formatDate', 'Formatting failed', err);
    return 'Invalid Date';
  }
};

/**
 * Formats an ISO date string to localized short format
 * Example: "2026-07-08T04:01:15" -> "08/07/2026"
 */
export const formatShortDate = (isoString: string | Date): string => {
  try {
    const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
    if (isNaN(date.getTime())) return 'N/A';
    
    return new Intl.DateTimeFormat(ACTIVE_CONFIG.localization.currency.locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return 'N/A';
  }
};

/**
 * Formats an ISO date string to localized time
 * Example: "2026-07-08T04:01:15" -> "4:01 AM"
 */
export const formatTime = (isoString: string | Date): string => {
  try {
    const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
    if (isNaN(date.getTime())) return 'Invalid Time';

    return new Intl.DateTimeFormat(ACTIVE_CONFIG.localization.currency.locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return 'Invalid Time';
  }
};

/**
 * Dynamic Relative Time Formatter
 * Example: "2026-07-08T02:00:00" -> "2 hours ago" or "in 3 days"
 */
export const formatRelativeTime = (isoString: string | Date): string => {
  try {
    const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
    if (isNaN(date.getTime())) return 'Invalid Time';

    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSecs = Math.round(diffMs / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (Math.abs(diffSecs) < 45) return 'just now';
    if (Math.abs(diffMins) < 45) {
      return diffMins > 0 ? `in ${diffMins}m` : `${Math.abs(diffMins)}m ago`;
    }
    if (Math.abs(diffHours) < 22) {
      return diffHours > 0 ? `in ${diffHours}h` : `${Math.abs(diffHours)}h ago`;
    }
    if (Math.abs(diffDays) < 26) {
      return diffDays > 0 ? `in ${diffDays}d` : `${Math.abs(diffDays)}d ago`;
    }

    return formatDate(date);
  } catch {
    return 'Invalid Time';
  }
};

/**
 * ----------------------------------------------------
 * 4. STRING & NUMERIC FORMATTERS
 * ----------------------------------------------------
 */

/**
 * Truncates string values gracefully with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Standardizes international numbers to E.164 phone formats
 * Example: "09876543210" with default +91 -> "+919876543210"
 */
export const formatE164Phone = (rawPhone: string, defaultPrefix = '+91'): string => {
  const cleaned = rawPhone.replace(/\D/g, '');
  
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  
  if (cleaned.length === 10) {
    return `${defaultPrefix}${cleaned}`;
  }
  
  if (rawPhone.startsWith('+')) {
    return '+' + cleaned;
  }
  
  return rawPhone; // Fallback
};

/**
 * Localized Currency Formatter
 */
export const formatCurrency = (amount: number): string => {
  try {
    return new Intl.NumberFormat(ACTIVE_CONFIG.localization.currency.locale, {
      style: 'currency',
      currency: ACTIVE_CONFIG.localization.currency.code,
    }).format(amount);
  } catch {
    return `${ACTIVE_CONFIG.localization.currency.symbol}${amount}`;
  }
};

/**
 * ----------------------------------------------------
 * 5. VALIDATORS
 * ----------------------------------------------------
 */
export const Validators = {
  isValidEmail: (email: string): boolean => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  },
  
  isValidE164Phone: (phone: string): boolean => {
    // International E.164 regex format matches +[1-9]\d{1,14}$
    const re = /^\+[1-9]\d{1,14}$/;
    return re.test(phone);
  },

  isRequired: (val: string): boolean => {
    return val !== undefined && val !== null && val.trim().length > 0;
  }
};

/**
 * ----------------------------------------------------
 * 6. ENTROPY ID GENERATOR
 * ----------------------------------------------------
 */
/**
 * Generates a collision-resistant unique system identifier with prefixing
 * Example: generateId('client') -> "client_f87a9bc2"
 */
export const generateId = (prefix = 'id'): string => {
  const randomSegment = Math.random().toString(36).substring(2, 10);
  const timestampSegment = Date.now().toString(36).substring(4);
  return `${prefix}_${randomSegment}${timestampSegment}`;
};

/**
 * ----------------------------------------------------
 * 7. RETRYABLE SECURE API CLIENT WRAPPER
 * ----------------------------------------------------
 */
interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
}

export const secureFetch = async <T>(url: string, options: FetchOptions = {}): Promise<T> => {
  const { timeoutMs = ACTIVE_CONFIG.api.timeoutMs, retries = 3, ...fetchParams } = options;
  
  let attempt = 0;
  
  while (attempt < retries) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      Logger.debug('secureFetch', `Dispatching to ${url} [Attempt ${attempt + 1}/${retries}]`, fetchParams);
      
      // Setup dynamic full base URL if relative path provided
      const absoluteUrl = url.startsWith('http') ? url : `${ACTIVE_CONFIG.api.baseUrl}${url}`;
      
      const response = await fetch(absoluteUrl, {
        ...fetchParams,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-TEDOS-Environment': ACTIVE_ENV,
          'X-TEDOS-Client-Version': ACTIVE_CONFIG.app.version,
          ...(fetchParams.headers || {}),
        },
      });

      clearTimeout(id);

      if (!response.ok) {
        throw new AppError(
          `API returned unsuccessful status: ${response.status}`,
          'API_HTTP_ERROR',
          response.status
        );
      }

      const jsonResult = await response.json();
      return jsonResult as T;
    } catch (err) {
      clearTimeout(id);
      attempt++;
      Logger.warn('secureFetch', `Attempt ${attempt} failed for ${url}. Error:`, err);
      
      if (attempt >= retries) {
        throw parseError(err);
      }
      
      // Exponential backoff before retry
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 300));
    }
  }
  
  throw new AppError('Max request retry limits breached.', 'RETRY_EXCEEDED', 504);
};

/**
 * ----------------------------------------------------
 * 8. GOOGLE APPS SCRIPT SYNC & WORK LOG INTEGRATION
 * ----------------------------------------------------
 */

export interface GasClientRaw {
  teId: string;
  name: string;
  clientContact: number | string;
  operatorContact: number | string;
  assignedSupport: string;
  department: string;
  plan: string;
  status: string;
  url?: string;
  URL?: string;
  noteSaad?: string;
  'Note Saad'?: string;
  monthlyIncentive?: string | number;
  'Monthly Incentive'?: string | number;
  lastWorkSummary?: string;
  clientSatisfactionKpi?: string;
  coPilotNote?: string;
  ultimateColumnS?: string;
  ultimateResponse1?: string;
  'Response 1'?: string;
  googleMapLink?: string;
}

export interface GasClientsResponse {
  success: boolean;
  clients: GasClientRaw[];
}

export interface AddWorkLogPayload {
  action: 'addWorkLog' | 'updateWorkLogProof' | 'syncUltimateFollowUp' | 'syncTicketResponse1' | 'raiseTicket' | string;
  id?: string;
  date: string;
  supportName: string;
  issueCategory: string;
  teId: string;
  clientName: string;
  workType: string;
  status: string;
  summary: string;
  proofLink?: string;
  'Proof Link'?: string;
  'Proof_Link'?: string;
  'proof_link'?: string;
  startTime: string;
  endTime: string;
  duration: string;
  remarksClient?: string;
  softwareUsage?: string;
  nextFollowUpDate?: string;
  'Next Follow-up Date'?: string;
  followUpDate?: string;
  internalNote?: string;
  'Internal Executive Remark'?: string;
  managerRemark?: string;
  'Manager Remark'?: string;
  cooRemark?: string;
  'COO Remark'?: string;
  saadNote?: string;
  'Note Saad'?: string;
  lastWorkSummary?: string;
  clientSatisfactionKpi?: string;
  monthlyIncentive?: string | number;
  coPilotNote?: string;
  ultimateColumnS?: string;
  Column_S?: string;
  ultimateResponse1?: string;
  'Response 1'?: string;
  approvalStatus?: string;
  approvalRemark?: string;
  isProofPending?: boolean;
  updateExistingOnly?: boolean;
  executiveName?: string;
  [key: string]: any;
}

export type SoftwareUsageTag = 'Regular User' | 'Not Using' | 'Need Training';

/**
 * Automatically detects software usage status from summary text keywords:
 * - Regular User: using, working, regular, practice, entries, chal raha, seekh, استعمال, پریکٹس
 * - Not Using: not using, band, close, refund, issue, error, masla, time nahi, busy, no operator, operator nahi
 * - Need Training: training, session, seekhna, guide
 */
export const detectSoftwareUsage = (summary: string): SoftwareUsageTag | null => {
  if (!summary || !summary.trim()) return null;
  const lower = summary.toLowerCase();

  const notUsingKeywords = [
    'not using', 'band', 'close', 'closed', 'refund', 'issue', 'error', 'masla',
    'time nahi', 'busy', 'no operator', 'operator nahi', 'نہیں', 'بند', 'مسئلہ', 'خراب'
  ];
  const needTrainingKeywords = [
    'training', 'session', 'seekhna', 'guide', 'traning', 'train', 'demonstration',
    'تربیت', 'سیکھنا', 'رہنمائی'
  ];
  const regularUserKeywords = [
    'using', 'working', 'regular', 'practice', 'entries', 'chal raha', 'seekh',
    'استعمال', 'پریکٹس', 'چل رہا', 'اینٹریز', 'daily'
  ];

  for (const kw of notUsingKeywords) {
    if (lower.includes(kw)) return 'Not Using';
  }
  for (const kw of needTrainingKeywords) {
    if (lower.includes(kw)) return 'Need Training';
  }
  for (const kw of regularUserKeywords) {
    if (lower.includes(kw)) return 'Regular User';
  }
  return null;
};

/**
 * Validates whether a proof link is a valid Google Drive or Google Meet link.
 * Used for sessions exceeding 5 minutes.
 */
export const isValidProofLink = (link?: string): boolean => {
  if (!link || typeof link !== 'string') return false;
  const trimmed = link.trim().toLowerCase();
  if (!trimmed || trimmed === 'pending' || trimmed === 'none' || trimmed === 'n/a' || trimmed === 'nahi' || trimmed === 'no') {
    return false;
  }
  // Must be at least a valid URL or meet/drive string
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = url.hostname.toLowerCase();
    return host.length > 3 && (host.includes('.') || host === 'localhost');
  } catch {
    return (
      trimmed.includes('meet.google.com') ||
      trimmed.includes('drive.google.com') ||
      trimmed.includes('loom.com') ||
      trimmed.includes('zoom.us') ||
      (trimmed.startsWith('http') && trimmed.includes('.'))
    );
  }
};

/**
 * Parses time string to total seconds handling 12h AM/PM or 24h formats
 */
export const parseTimeToSeconds = (timeStr: string): number => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const isPM = /pm/i.test(timeStr);
  const isAM = /am/i.test(timeStr);
  const clean = timeStr.replace(/[^0-9:]/g, '').trim();
  const parts = clean.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0;
  let h = parts[0];
  const m = parts[1];
  const s = parts[2] || 0;
  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;
  return h * 3600 + m * 60 + s;
};

/**
 * Returns formatted 24-hour time "HH:mm:ss"
 */
export const formatTimeHHMMSS = (d: Date = new Date()): string => {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

/**
 * Returns formatted 24-hour time "HH:mm"
 */
export const formatTimeHHMM = (d: Date = new Date()): string => {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

/**
 * Auto-calculates duration string ("HH:mm:ss") and minutes from start and end times ("HH:mm" or "HH:mm:ss").
 */
export const calculateDurationFromTimes = (
  startTime: string,
  endTime: string
): { durationMinutes: number; durationFormatted: string } => {
  if (!startTime || !endTime) {
    return { durationMinutes: 15, durationFormatted: '00:15:00' };
  }
  try {
    const startSecs = parseTimeToSeconds(startTime);
    const endSecs = parseTimeToSeconds(endTime);
    let diffSecs = endSecs - startSecs;
    if (diffSecs < 0) {
      diffSecs += 24 * 3600; // Cross-midnight
    }
    const hours = Math.floor(diffSecs / 3600);
    const mins = Math.floor((diffSecs % 3600) / 60);
    const secs = diffSecs % 60;
    const durationMinutes = Math.max(1, Math.round(diffSecs / 60));
    const durationFormatted = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return { durationMinutes, durationFormatted };
  } catch {
    return { durationMinutes: 15, durationFormatted: '00:15:00' };
  }
};

/**
 * Checks if the entry time is after 10:20 AM for late login verification.
 */
export const isLateLogin = (timeStr?: string): boolean => {
  try {
    let hours = 0;
    let minutes = 0;
    if (timeStr && timeStr.includes(':')) {
      const parts = timeStr.split(':').map(Number);
      hours = parts[0];
      minutes = parts[1];
    } else {
      const now = new Date();
      hours = now.getHours();
      minutes = now.getMinutes();
    }
    return hours > 10 || (hours === 10 && minutes > 20);
  } catch {
    return false;
  }
};

/**
 * Helper to resolve a property from raw data across multiple case-insensitive key candidates
 */
const resolveRawProp = (raw: any, candidates: string[]): string => {
  if (!raw || typeof raw !== 'object') return '';
  for (const c of candidates) {
    if (raw[c] !== undefined && raw[c] !== null && String(raw[c]).trim() !== '') {
      return String(raw[c]).trim();
    }
  }
  const rawKeys = Object.keys(raw);
  for (const c of candidates) {
    const cleanCand = c.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matchedKey = rawKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanCand);
    if (matchedKey && raw[matchedKey] !== undefined && raw[matchedKey] !== null && String(raw[matchedKey]).trim() !== '') {
      return String(raw[matchedKey]).trim();
    }
  }
  return '';
};

/**
 * Robustly extracts a clean web/software URL from any string
 */
export const extractWebUrl = (val: string): string => {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed || trimmed === '-' || trimmed === 'N/A' || /^\d+$/.test(trimmed)) return '';
  if (trimmed.includes('google.com/maps') || trimmed.includes('meet.google.com') || trimmed.includes('drive.google.com') || trimmed.includes('script.google.com')) return '';
  // Match complete http/https URLs including ports and paths
  const httpMatch = trimmed.match(/https?:\/\/[^\s"',;<>]+/i);
  if (httpMatch) return httpMatch[0].trim();
  // Match domain names like rhps.school.edsof.com or demo.technoevident.com:8080/user
  if (!trimmed.includes('@')) {
    const domainMatch = trimmed.match(/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:[0-9]+)?(\/[^\s"',;<>]*)?/i);
    if (domainMatch) {
      return `https://${domainMatch[0].trim()}`;
    }
  }
  return '';
};

/**
 * Validates if a string looks like a valid website / software portal URL
 */
export const isLikelyWebUrl = (val: string): boolean => {
  return extractWebUrl(val).length > 0;
};

/**
 * Maps raw client objects returned by Google Apps Script to the internal SupportClient model
 */
export const mapGasClientToSupportClient = (raw: GasClientRaw, index: number): SupportClient => {
  const teId = resolveRawProp(raw, ['teId', 'TEID', 'id', 'ID']) || `TE-CL-${index + 1}`;
  const companyName = resolveRawProp(raw, ['name', 'Name', 'company', 'Company', 'clientName', 'ClientName', 'Client']) || `Client ${teId}`;
  
  // Notice: In the Google Sheet, the URL column is sometimes returned under 'status' while 'url' contains student count/fee like '600'
  const rawStatusField = resolveRawProp(raw, ['status', 'Status']);
  const rawUsage = resolveRawProp(raw, ['softwareUsage', 'Software Usage', 'software_usage', 'callStatus', 'workStatus']);
  
  // Extract client URL from all sheet column possibilities, prioritizing valid web URLs over numeric cells
  let detectedUrl = '';
  const urlCandidates = [
    rawStatusField, // Check first in case status column contains the URL (e.g. https://rh.edsof.com/user)
    resolveRawProp(raw, ['softwareUrl', 'Software URL', 'SoftwareUrl', 'Software_URL', 'Software Url', 'software_url', 'software_link', 'Software Link']),
    resolveRawProp(raw, ['columnO', 'Column O', 'Column_O', 'colO', 'Col O', 'column_o', 'col_o', 'col15', 'Col15']),
    resolveRawProp(raw, ['url', 'URL', 'Url', 'clientUrl', 'Client URL', 'ClientUrl', 'Client_URL', 'Client Url', 'client_url']),
    resolveRawProp(raw, ['website', 'Website', 'link', 'Link', 'portalUrl', 'Portal URL', 'PortalUrl', 'portal_url', 'portal_link', 'Portal Link']),
    resolveRawProp(raw, ['deploymentUrl', 'Deployment URL', 'DeploymentUrl', 'deployment_url', 'webAppUrl', 'Web App URL', 'appUrl', 'App URL'])
  ];

  for (const cand of urlCandidates) {
    const extracted = extractWebUrl(cand);
    if (extracted) {
      detectedUrl = extracted;
      break;
    }
  }

  // Extract client login / username from sheet column possibilities (Column P in Google Sheet)
  let detectedLogin = resolveRawProp(raw, [
    'login', 'Login', 'softwareLogin', 'Software Login', 'software_login',
    'columnP', 'Column P', 'Column_P', 'colP', 'Col P', 'column_p', 'col_p', 'col16', 'Col16',
    'email', 'Email', 'clientEmail', 'portalLogin', 'user', 'User', 'username', 'Username'
  ]);

  // If not found in known headers, scan for web URL in any property of raw
  if (!detectedUrl) {
    for (const [_, val] of Object.entries(raw)) {
      if (typeof val === 'string') {
        const extracted = extractWebUrl(val);
        if (extracted) {
          detectedUrl = extracted;
          break;
        }
      }
    }
  }

  // Determine actual lifecycle status: if rawStatusField is a URL, use softwareUsage/callStatus instead
  const effectiveStatusText = (isLikelyWebUrl(rawStatusField) ? rawUsage : rawStatusField || rawUsage || '').toLowerCase();
  let status: 'Critical' | 'Warning' | 'Active' | 'Inactive' = 'Active';
  if (effectiveStatusText.includes('critical')) status = 'Critical';
  else if (effectiveStatusText.includes('not answering') || effectiveStatusText.includes('pending') || effectiveStatusText.includes('warning')) status = 'Warning';
  else if (effectiveStatusText.includes('deactivated') || effectiveStatusText.includes('removed')) status = 'Inactive';

  const phone = resolveRawProp(raw, ['clientContact', 'ClientContact', 'operatorContact', 'OperatorContact', 'phone', 'Phone', 'mobile', 'Mobile']);

  let saadNote = resolveRawProp(raw, [
    'specialManagerRemark', 'Special Manager Remark', 'special_manager_remark',
    'columnS', 'Column S', 'Column_S', 'colS', 'Col S', 'column_s', 'col_s', 'col19', 'Col19',
    'noteSaad', 'Note Saad', 'saadNote', 'Saad Note', 'note_saad', 'remarks', 'Remarks'
  ]);

  // Check global client URLs & logins cache (stored from manual entry, sheet TSV paste, or server sync)
  if (typeof window !== 'undefined') {
    const cachedUrlsStr = localStorage.getItem('tedos_client_urls');
    if (cachedUrlsStr) {
      try {
        const cachedMap = JSON.parse(cachedUrlsStr);
        const cachedEntry =
          cachedMap[teId] ||
          cachedMap[companyName] ||
          cachedMap[teId.toUpperCase()] ||
          cachedMap[teId.toLowerCase()] ||
          cachedMap[companyName.toLowerCase()] ||
          null;
        if (typeof cachedEntry === 'string') {
          if (!detectedUrl && isLikelyWebUrl(cachedEntry)) detectedUrl = cachedEntry;
        } else if (cachedEntry && typeof cachedEntry === 'object') {
          const entryUrl = cachedEntry.url || cachedEntry.softwareUrl;
          if (!detectedUrl && entryUrl && isLikelyWebUrl(entryUrl)) {
            detectedUrl = entryUrl;
          }
          if (!detectedLogin && (cachedEntry.login || cachedEntry.softwareLogin || cachedEntry.email)) {
            detectedLogin = cachedEntry.login || cachedEntry.softwareLogin || cachedEntry.email;
          }
          if (!saadNote && (cachedEntry.remarks || cachedEntry.specialManagerRemark || cachedEntry.noteSaad)) {
            saadNote = cachedEntry.remarks || cachedEntry.specialManagerRemark || cachedEntry.noteSaad;
          }
        }
      } catch {}
    }
  }

  // Format detected URL cleanly - DO NOT FABRICATE RANDOM URLS!
  // If URL is not in sheet, it stays empty so support team can see it is pending/empty.
  if (detectedUrl && !detectedUrl.startsWith('http://') && !detectedUrl.startsWith('https://') && detectedUrl.includes('.')) {
    detectedUrl = `https://${detectedUrl.trim()}`;
  }

  const incentive = resolveRawProp(raw, ['monthlyIncentive', 'Monthly Incentive', 'incentive', 'Incentive', 'monthly_incentive']);
  const lastWork = resolveRawProp(raw, ['lastWorkSummary', 'Last Work Summary', 'workSummary', 'last_work_summary']);
  const satisfactionKpi = resolveRawProp(raw, ['clientSatisfactionKpi', 'Satisfaction', 'kpi', 'KPI', 'satisfaction']) || 'Satisfied';
  const coPilot = resolveRawProp(raw, ['coPilotNote', 'ultimateColumnS', 'Column S', 'Column_S', 'colS', 'co_pilot_note']);
  const resp1 = resolveRawProp(raw, ['ultimateResponse1', 'Response 1', 'response1', 'response_1']);
  const mapLink = resolveRawProp(raw, ['googleMapLink', 'Google Map Link', 'mapLink', 'google_map_link']) ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(companyName)}`;
  const planVal = resolveRawProp(raw, ['plan', 'Plan']);
  const deptVal = resolveRawProp(raw, ['department', 'Department']);
  const assignedSup = resolveRawProp(raw, ['assignedSupport', 'AssignedSupport', 'assignedExecutive', 'supportName']);

  return {
    id: teId,
    name: companyName,
    company: companyName,
    phone: phone ? formatE164Phone(phone) : '+91 90000 00000',
    email: detectedLogin || `${teId.toLowerCase().replace(/[^a-z0-9]/g, '')}@technoevident.com`,
    softwareLogin: detectedLogin || '',
    softwareUrl: detectedUrl || '',
    url: detectedUrl || '',
    deploymentUrl: detectedUrl || '',
    status,
    lifecycleStatus: status === 'Inactive' ? ClientLifecycleStatus.SUSPENDED : ClientLifecycleStatus.ACTIVE,
    subscriptions: planVal ? [{
      id: `sub_${teId}`,
      plan: planVal,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2027-12-31',
      status: 'Active'
    }] : [],
    products: deptVal ? [{
      id: `prod_${deptVal}`,
      name: deptVal,
      features: ['Core Support', 'Operations Portal']
    }] : [],
    assignments: assignedSup ? [{
      userId: assignedSup,
      role: 'Support Executive',
      assignedDate: new Date().toISOString().split('T')[0]
    }] : [],
    enterpriseHooks: [],
    assignedExecutive: assignedSup || 'Unassigned',
    softwareDetails: {
      version: 'v4.2.0',
      licenseType: planVal || 'Standard',
      expiryDate: '2027-12-31',
      lastBackupDate: new Date().toISOString().split('T')[0]
    },
    healthStatus: effectiveStatusText.includes('connected') || effectiveStatusText.includes('compet') ? 95 : effectiveStatusText.includes('not answering') ? 65 : 85,
    recentActivityTimestamp: new Date().toISOString(),
    teId,
    clientContact: phone,
    operatorContact: phone,
    assignedSupport: assignedSup,
    department: deptVal,
    plan: planVal,
    noteSaad: saadNote || '',
    specialManagerRemark: saadNote || '',
    monthlyIncentive: incentive,
    lastWorkSummary: lastWork,
    clientSatisfactionKpi: satisfactionKpi,
    coPilotNote: coPilot,
    ultimateResponse1: resp1,
    googleMapLink: mapLink
  };
};

/**
 * Fetches clients from Google Apps Script Web App
 * Endpoint: `${CONFIG.apiEndpoint}?action=getClients`
 */
export const fetchClientsFromGAS = async (endpoint = CONFIG.apiEndpoint): Promise<SupportClient[]> => {
  const targetUrl = `${endpoint}?action=getClients`;
  Logger.info('fetchClientsFromGAS', `Fetching clients from ${targetUrl}`);
  
  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script returned HTTP ${response.status}`);
    }

    const data: GasClientsResponse = await response.json();
    if (!data.success || !Array.isArray(data.clients)) {
      Logger.warn('fetchClientsFromGAS', 'Unexpected response payload from GAS', data);
      return [];
    }

    // Map and deduplicate by client ID and filter out deleted Zigma / Apollo clients
    const seenIds = new Set<string>();
    const mappedClients: SupportClient[] = [];

    data.clients.forEach((rawClient, index) => {
      const mapped = mapGasClientToSupportClient(rawClient, index);
      const lowerName = (mapped.name || '').toLowerCase();
      if (lowerName.includes('zigma') || lowerName.includes('apollo')) {
        return; // Deleted per requirement #22
      }
      if (seenIds.has(mapped.id)) {
        return; // Skip duplicate IDs to prevent duplicate entries
      }
      seenIds.add(mapped.id);
      mappedClients.push(mapped);
    });

    Logger.info('fetchClientsFromGAS', `Loaded ${mappedClients.length} clients from Google Apps Script`);
    return mappedClients;
  } catch (err) {
    Logger.error('fetchClientsFromGAS', 'Failed to fetch clients from GAS', err);
    throw err;
  }
};

const recentGasPostCache = new Map<string, number>();
const synchronizedLogIds = new Set<string>();

/**
 * Dispatches a work log entry to Google Apps Script via POST with strict deduplication
 * Prevents double entries in Google Sheet backend even when pending link is added later.
 */
export const postWorkLogToGAS = async (
  payload: AddWorkLogPayload,
  endpoint = CONFIG.apiEndpoint
): Promise<{ success: boolean; message?: string }> => {
  const logId = payload.id || '';

  // If this log was already inserted and action is addWorkLog, change action to updateWorkLogProof
  // so the Google Sheet updates the existing row instead of creating a double entry!
  const effectivePayload = { ...payload };
  if (logId && synchronizedLogIds.has(logId)) {
    if (effectivePayload.action === 'addWorkLog') {
      Logger.info('postWorkLogToGAS', `Log ID ${logId} already inserted. Converting addWorkLog to updateWorkLogProof to prevent double entry.`);
      effectivePayload.action = 'updateWorkLogProof';
      effectivePayload.updateExistingOnly = true;
    }
  }

  // Normalize all executive name property aliases so Google Apps Script never receives empty name or defaults to 'Executive'
  const effectiveExecName =
    effectivePayload.supportName ||
    effectivePayload.executiveName ||
    (effectivePayload as any)['Executive Name'] ||
    (effectivePayload as any)['Executive'] ||
    (effectivePayload as any)['Support Name'] ||
    (effectivePayload as any)['Support Executive'] ||
    '';

  if (effectiveExecName) {
    effectivePayload.supportName = effectiveExecName;
    effectivePayload.executiveName = effectiveExecName;
    (effectivePayload as any)['supportName'] = effectiveExecName;
    (effectivePayload as any)['executiveName'] = effectiveExecName;
    (effectivePayload as any)['Support Name'] = effectiveExecName;
    (effectivePayload as any)['Executive Name'] = effectiveExecName;
    (effectivePayload as any)['Executive'] = effectiveExecName;
    (effectivePayload as any)['Support Executive'] = effectiveExecName;
    (effectivePayload as any)['support_name'] = effectiveExecName;
    (effectivePayload as any)['executive_name'] = effectiveExecName;
    (effectivePayload as any)['executive'] = effectiveExecName;
  }

  // Normalize summary and details aliases
  const effectiveSummary =
    effectivePayload.summary ||
    (effectivePayload as any).details ||
    (effectivePayload as any)['Summary'] ||
    (effectivePayload as any)['Summary Notes'] ||
    '';
  if (effectiveSummary) {
    effectivePayload.summary = effectiveSummary;
    (effectivePayload as any).details = effectiveSummary;
    (effectivePayload as any)['Summary'] = effectiveSummary;
    (effectivePayload as any)['Summary Notes'] = effectiveSummary;
    (effectivePayload as any)['Work Summary'] = effectiveSummary;
  }

  // Normalize all proof link property aliases so Google Apps Script & Ultimate Sheet receives it regardless of header case
  const effectiveProofLink = effectivePayload.proofLink || (effectivePayload as any)['Proof Link'] || (effectivePayload as any)['proof_link'] || '';
  if (effectiveProofLink) {
    effectivePayload.proofLink = effectiveProofLink;
    (effectivePayload as any)['Proof Link'] = effectiveProofLink;
    (effectivePayload as any)['Proof_Link'] = effectiveProofLink;
    (effectivePayload as any)['proof_link'] = effectiveProofLink;
    (effectivePayload as any)['Proof'] = effectiveProofLink;
    (effectivePayload as any)['proof'] = effectiveProofLink;
    (effectivePayload as any)['Recording Link'] = effectiveProofLink;
    (effectivePayload as any)['Google Meet Link'] = effectiveProofLink;
  }

  // 10-Minute Proof Policy:
  // Calls <= 10 mins do not require proof and must NOT be marked PENDING in sheet!
  const durationMins = Number(effectivePayload.durationMinutes) || 0;
  if (durationMins > 0 && durationMins <= 10) {
    if (effectivePayload.proofLink === 'PENDING' || !effectivePayload.proofLink) {
      effectivePayload.proofLink = '';
      (effectivePayload as any)['Proof Link'] = '';
      (effectivePayload as any)['Proof_Link'] = '';
      (effectivePayload as any)['proof_link'] = '';
      (effectivePayload as any)['Proof'] = '';
    }
  }

  // If Manager/COO has approved, ensure proofLink column shows approval action instead of PENDING
  if (effectivePayload.approvalStatus === 'Approved' && (effectivePayload.proofLink === 'PENDING' || !effectivePayload.proofLink)) {
    const remark = effectivePayload.managerRemark || effectivePayload.cooRemark || effectivePayload.approvalRemark || 'Approved by Manager';
    effectivePayload.proofLink = remark;
    (effectivePayload as any)['Proof Link'] = remark;
    (effectivePayload as any)['Proof_Link'] = remark;
    (effectivePayload as any)['proof_link'] = remark;
  }

  const fingerprint = `${effectivePayload.action}|${logId}|${effectivePayload.teId}|${effectivePayload.clientName}|${effectivePayload.date}|${effectiveProofLink}`;
  const now = Date.now();
  const lastPostTime = recentGasPostCache.get(fingerprint);
  if (lastPostTime && now - lastPostTime < 8000) {
    Logger.info('postWorkLogToGAS', `Skipped duplicate GAS post within 8s for ${effectivePayload.clientName} (${logId})`);
    return { success: true, message: 'Already synchronized (Duplicate prevented)' };
  }
  recentGasPostCache.set(fingerprint, now);

  // In browser environments, proxy through /api/proxy to completely prevent CORS blocking by Google Apps Script
  const endpointsToTry =
    typeof window !== 'undefined' && endpoint.includes('script.google.com')
      ? ['/api/proxy', endpoint]
      : [endpoint];

  let lastError: any = null;

  for (const currentEndpoint of endpointsToTry) {
    try {
      const isProxy = currentEndpoint === '/api/proxy';
      const response = await fetch(currentEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': isProxy ? 'application/json' : 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(effectivePayload),
        redirect: 'follow'
      });

      let result: any = { success: true };
      try {
        const text = await response.text();
        try {
          result = JSON.parse(text);
        } catch {
          result = { success: response.ok, message: 'Dispatched to Google Sheet', raw: text };
        }
      } catch {
        result = { success: response.ok };
      }

      if (logId && (result.success || response.ok)) {
        synchronizedLogIds.add(logId);
      }
      Logger.info('postWorkLogToGAS', `Google Apps Script response from ${currentEndpoint}:`, result);
      return result;
    } catch (err) {
      lastError = err;
      Logger.warn('postWorkLogToGAS', `Attempt failed on ${currentEndpoint}, trying next:`, err);
    }
  }

  Logger.error('postWorkLogToGAS', 'Failed to submit work log to Google Apps Script on all endpoints', lastError);
  return { success: false, message: (lastError as any)?.message || 'Sync queued' };
};
