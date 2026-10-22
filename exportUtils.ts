/**
 * Export and Import Utilities for TEDOS
 * Supports:
 * - Module-specific CSV generation
 * - Printable Daily Work Log Report
 * - Full System JSON Backup & Restore
 */

import { WorkLogEntry, Ticket, SupportClient, FollowUpTracker, User } from '../types';

/**
 * Trigger browser file download
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert objects to CSV string with UTF-8 BOM for Urdu/Arabic Excel compatibility
 */
function convertToCSV<T extends Record<string, any>>(headers: { key: keyof T | string; label: string }[], rows: T[]): string {
  // UTF-8 BOM so Excel opens Urdu text correctly
  let csv = '\uFEFF';
  
  // Header row
  csv += headers.map(h => `"${String(h.label).replace(/"/g, '""')}"`).join(',') + '\r\n';
  
  // Data rows
  rows.forEach(row => {
    const line = headers.map(h => {
      const val = row[h.key];
      if (val === undefined || val === null) return '""';
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
    csv += line + '\r\n';
  });
  
  return csv;
}

/**
 * Export Work Logs to CSV
 */
export function exportWorkLogsToCSV(workLogs: WorkLogEntry[], filenamePrefix: string = 'TEDOS_WorkLogs') {
  const headers = [
    { key: 'date', label: 'تاریخ (Date)' },
    { key: 'clientName', label: 'کلائنٹ کا نام (Client)' },
    { key: 'category', label: 'زمرہ (Category)' },
    { key: 'durationMinutes', label: 'دورانیہ منٹ (Duration)' },
    { key: 'details', label: 'کام کی تفصیل (Task Details)' },
    { key: 'proofLink', label: 'گوگل میٹ / ڈرائیو لنک (Proof Link)' },
    { key: 'status', label: 'حالت (Status)' },
    { key: 'approvalStatus', label: 'منظوری کی حالت (COO Approval)' },
    { key: 'executiveName', label: 'سپورٹ ایگزیکٹو (Executive)' }
  ];

  const formattedRows = workLogs.map(log => ({
    date: log.date || (log.timestamp ? new Date(log.timestamp).toLocaleDateString('en-CA') : ''),
    clientName: log.clientName || 'General',
    category: log.category || 'General',
    durationMinutes: log.durationMinutes || 0,
    details: log.details || '',
    proofLink: log.proofLink || 'N/A',
    status: log.status || 'Completed',
    approvalStatus: log.approvalStatus || 'Pending',
    executiveName: log.executiveName || 'Support Executive'
  }));

  const csv = convertToCSV(headers, formattedRows);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(csv, `${filenamePrefix}_${dateStr}.csv`);
}

/**
 * Export Tickets to CSV
 */
export function exportTicketsToCSV(tickets: Ticket[], filenamePrefix: string = 'TEDOS_Tickets') {
  const headers = [
    { key: 'id', label: 'ٹکٹ آئی ڈی (Ticket ID)' },
    { key: 'clientName', label: 'کلائنٹ (Client)' },
    { key: 'issueType', label: 'مسئلے کی قسم (Issue Type)' },
    { key: 'priority', label: 'ترجیح (Priority)' },
    { key: 'status', label: 'اسٹیٹس (Status)' },
    { key: 'createdDate', label: 'تاریخ تخلیق (Created Date)' },
    { key: 'closedDate', label: 'تاریخ اختتام (Closed Date)' },
    { key: 'slaExpiry', label: 'ایس ایل اے ڈیڈ لائن (SLA Expiry)' },
    { key: 'assignedExecutive', label: 'نامزد ایگزیکٹو (Assigned Executive)' },
    { key: 'issueDescription', label: 'تفصیل (Description)' }
  ];

  const formattedRows = tickets.map(t => ({
    id: t.id,
    clientName: t.clientName,
    issueType: t.issueType || 'General Inquiry',
    priority: t.priority,
    status: t.status,
    createdDate: t.createdDate,
    closedDate: t.closedDate || 'N/A',
    slaExpiry: t.slaExpiry || 'Standard',
    assignedExecutive: t.assignedExecutive || 'Unassigned',
    issueDescription: t.issueDescription || ''
  }));

  const csv = convertToCSV(headers, formattedRows);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(csv, `${filenamePrefix}_${dateStr}.csv`);
}

/**
 * Export Clients to CSV
 */
export function exportClientsToCSV(clients: SupportClient[], filenamePrefix: string = 'TEDOS_Clients') {
  const headers = [
    { key: 'id', label: 'کلائنٹ کوڈ (Client ID)' },
    { key: 'name', label: 'کاروبار / فرم (Business Name)' },
    { key: 'company', label: 'کمپنی (Company)' },
    { key: 'phone', label: 'فون نمبر (Phone)' },
    { key: 'email', label: 'ای میل (Email)' },
    { key: 'status', label: 'حالت (Status)' },
    { key: 'healthStatus', label: 'ہیلتھ انڈیکس (Health %)' },
    { key: 'assignedExecutive', label: 'تفویض کردہ (Assigned)' },
    { key: 'recentActivityTimestamp', label: 'آخری سرگرمی (Recent Activity)' }
  ];

  const formattedRows = clients.map(c => ({
    id: c.id,
    name: c.name,
    company: c.company || c.name,
    phone: c.phone || '',
    email: c.email || '',
    status: c.status,
    healthStatus: `${c.healthStatus || 100}%`,
    assignedExecutive: c.assignedExecutive || 'Unassigned',
    recentActivityTimestamp: c.recentActivityTimestamp || 'Recent'
  }));

  const csv = convertToCSV(headers, formattedRows);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(csv, `${filenamePrefix}_${dateStr}.csv`);
}

/**
 * Export Follow-ups to CSV
 */
export function exportFollowUpsToCSV(followUps: FollowUpTracker[], filenamePrefix: string = 'TEDOS_FollowUps') {
  const headers = [
    { key: 'id', label: 'آئی ڈی (ID)' },
    { key: 'clientName', label: 'کلائنٹ (Client)' },
    { key: 'scheduledDate', label: 'مقررہ تاریخ (Scheduled Date)' },
    { key: 'reason', label: 'وجہ (Reason)' },
    { key: 'priority', label: 'ترجیح (Priority)' },
    { key: 'status', label: 'اسٹیٹس (Status)' },
    { key: 'callOutcome', label: 'کال کا نتیجہ (Call Outcome)' }
  ];

  const formattedRows = followUps.map(f => ({
    id: f.id,
    clientName: f.clientName,
    scheduledDate: f.scheduledDate,
    reason: f.reason,
    priority: f.priority,
    status: f.status,
    callOutcome: (f as any).callOutcome || 'Pending'
  }));

  const csv = convertToCSV(headers, formattedRows);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(csv, `${filenamePrefix}_${dateStr}.csv`);
}

/**
 * Print Professional Daily Work Log Report
 */
export function printDailyWorkLogReport(
  workLogs: WorkLogEntry[],
  date: string,
  executiveName: string = 'Support Executive'
) {
  const totalMinutes = workLogs.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const targetAchieved = totalMinutes >= 420;

  const html = `
    <!DOCTYPE html>
    <html lang="ur" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <title>یومیہ ورک لاگ سمری رپورٹ - ${date}</title>
      <style>
        body {
          font-family: 'Jameel Noori Nastaleeq', 'Segoe UI', Tahoma, Arial, sans-serif;
          margin: 20px;
          color: #1e293b;
          direction: rtl;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #0062a3;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #0062a3;
        }
        .meta-box {
          display: flex;
          gap: 20px;
          background: #f1f5f9;
          padding: 12px 18px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        .metric-badge {
          font-weight: bold;
          color: ${targetAchieved ? '#059669' : '#d97706'};
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 8px 10px;
          text-align: right;
        }
        th {
          background-color: #e2e8f0;
          color: #0f172a;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px dashed #94a3b8;
          font-size: 12px;
          display: flex;
          justify-content: space-between;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">ٹیکنو ایویڈنٹ - یومیہ ورک لاگ سمری رپورٹ</div>
          <div style="font-size: 13px; color: #64748b;">Technoevident Daily Operations System (TEDOS)</div>
        </div>
        <div style="text-align: left; font-size: 13px; font-weight: bold;">
          تاریخ: ${date}<br />
          ملازم: ${executiveName}
        </div>
      </div>

      <div class="meta-box">
        <div><strong>کل لاگز درج:</strong> ${workLogs.length}</div>
        <div><strong>کل لاگ شدہ وقت:</strong> ${totalMinutes} منٹ (${totalHours} گھنٹے)</div>
        <div><strong>یومیہ ٹارگٹ (420 منٹ):</strong> <span class="metric-badge">${targetAchieved ? '✓ مکمل (Target Achieved)' : '⚠ نامکمل'}</span></div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px;">نمبر</th>
            <th style="width: 160px;">کلائنٹ کا نام</th>
            <th style="width: 120px;">زمرہ (Category)</th>
            <th style="width: 80px;">دورانیہ</th>
            <th>کام کی تفصیلی نوعیت و کارروائی</th>
            <th style="width: 160px;">گوگل میٹ / ڈرائیو لنک</th>
            <th style="width: 80px;">منظوری</th>
          </tr>
        </thead>
        <tbody>
          ${workLogs.map((log, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><strong>${log.clientName || 'General'}</strong></td>
              <td>${log.category || 'General'}</td>
              <td style="font-family: monospace; font-weight: bold;">${log.durationMinutes} منٹ</td>
              <td>${log.details}</td>
              <td style="font-size: 11px; word-break: break-all;">${log.proofLink && log.proofLink !== 'N/A' ? `<a href="${log.proofLink}" target="_blank">${log.proofLink}</a>` : 'موجود نہیں'}</td>
              <td>${log.approvalStatus || 'Pending'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <div>COO آپریشنز دستخط: _____________________</div>
        <div>سپورٹ ایگزیکٹو دستخط: _____________________</div>
        <div>پرنٹ تاریخ: ${new Date().toLocaleString()}</div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

/**
 * Export Complete System State as JSON
 */
export function exportFullSystemJSON(data: {
  clients: SupportClient[];
  workLogs: WorkLogEntry[];
  tickets: Ticket[];
  followUps: FollowUpTracker[];
  users: User[];
}) {
  const payload = {
    app: 'TEDOS_OPERATIONS_SYSTEM',
    version: '1.0.0',
    exportTimestamp: new Date().toISOString(),
    data: {
      clients: data.clients,
      workLogs: data.workLogs,
      tickets: data.tickets,
      followUps: data.followUps,
      users: data.users.map(u => ({
        id: u.id,
        employeeId: u.employeeId,
        name: u.name,
        email: u.email,
        mobile: u.mobile,
        role: u.role,
        department: u.department,
        status: u.status
      }))
    }
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(jsonStr, `TEDOS_FULL_BACKUP_${dateStr}.json`, 'application/json;charset=utf-8;');
}

/**
 * Validate and Parse System Backup JSON
 */
export function parseSystemBackupJSON(jsonStr: string): {
  success: boolean;
  message: string;
  data?: {
    clients: SupportClient[];
    workLogs: WorkLogEntry[];
    tickets: Ticket[];
    followUps: FollowUpTracker[];
    users?: User[];
  };
} {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, message: 'غلط فائل فارمیٹ: JSON فائل درست نہیں ہے۔' };
    }

    const payload = parsed.data || parsed;
    if (!payload.clients && !payload.workLogs && !payload.tickets) {
      return { success: false, message: 'بیک اپ فائل میں TEDOS ڈیٹا (کلائنٹس، ورک لاگز یا ٹکٹس) موجود نہیں ہے۔' };
    }

    return {
      success: true,
      message: 'بیک اپ فائل کی کامیابی سے توثیق ہو گئی۔',
      data: {
        clients: Array.isArray(payload.clients) ? payload.clients : [],
        workLogs: Array.isArray(payload.workLogs) ? payload.workLogs : [],
        tickets: Array.isArray(payload.tickets) ? payload.tickets : [],
        followUps: Array.isArray(payload.followUps) ? payload.followUps : [],
        users: Array.isArray(payload.users) ? payload.users : []
      }
    };
  } catch (err: any) {
    return {
      success: false,
      message: `فائل کو پڑھنے میں خرابی: ${err?.message || 'نامعلوم غلطی'}`
    };
  }
}
