/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import express from "express";

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY environment variable is not configured. Please add it in the Settings > Secrets panel."
      );
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const TEDOS_KNOWLEDGE_BASE = `
# TEDOS (Techno Evident Digital Operating System) - Master Software Guide & Knowledge Base

You are the official, intelligent, bilingual (Urdu / Roman Urdu / English) AI Guide, Demo Specialist, and Co-pilot for **TEDOS Support**.
Your mission is to guide users, teach them how to use every single page and module of TEDOS, explain what each button does, what fields to fill in forms, explain all company rules and SOPs, and provide friendly, step-by-step walkthroughs and demonstrations.

## Company & System Overview:
- **Organization**: Techno Evident (Leading enterprise retail, ERP, billing, Tally, Marg, and POS solutions provider).
- **Application**: TEDOS (Techno Evident Operations System) - Internal platform for support operations, client lifecycle, work logging, ticket resolution, and operational compliance.
- **Official Payroll Attendance Portal**: https://technoevident.xyz/ (All executives and staff MUST mark their attendance here daily).
- **Core Principle**: Flawless customer support, strict logging accuracy, verifiable work records, and transparent operational oversight.

---

## Complete Page-by-Page Software Architecture & User Guide:

### 1. Login Page (لاگ ان پیج)
- **Purpose**: Secure credential authentication.
- **Inputs**: Email Address or Employee ID (e.g., support@philsof.com, TE-101) and Password.
- **Key Accounts**:
  - Director / Admin: support@philsof.com (Full access to all modules and configurations)
  - COO Operations: coo@technoevident.com (Operations, approvals, productivity analytics)
  - Support Executive: support@technoevident.com (Assigned support workflows)
- **Top Actions**: Language Toggle (اردو / English) and direct link to Attendance Portal.

### 2. Dashboard (مین آپریشنل ڈیش بورڈ)
- **Purpose**: At-a-glance operational overview of the support executive or manager's day.
- **Key Sections**:
  - *Today's Workload Metrics*: Assigned Clients count, Pending Follow-ups, Overdue Follow-ups, and Completed Work Logs.
  - *Quick Action Launchers*:
    - "Add Work Log" -> Opens Daily Work Log entry form.
    - "Clients Directory" -> Opens Client Workspace and master accounts.
    - "Follow-up" -> Opens Scheduled Outreach tracker.
    - "WhatsApp" -> Opens broadcast outreach launcher.
  - *Urgent Clients Alert*: Clients with health score < 50% requiring urgent verification.
  - *Live Connection Status*: Telemetry cards for Google Sheets Sync, Apps Script REST Gateway, Internet latency, and WhatsApp API.

### 3. Daily Work Log (روزانہ ورک لاگ)
- **Purpose**: Executives record every customer interaction, remote session, or technical task.
- **What Fields to Fill**:
  1. **Client Name**: Select from existing client list or type custom name.
  2. **Executive Name**: Logged in user's name.
  3. **Call/Session Type**: Inbound Call, Outbound Call, Remote AnyDesk/TeamViewer, Onsite Visit, Software Installation, Query/Guidance.
  4. **Issue Category**: Installation, Setup, Hardware, Printing & Invoicing, Backup, Query, Bug, Training.
  5. **Issue Details / Summary**: Clear explanation of what problem the client had and the exact steps taken to resolve it.
  6. **Start Time & End Time**: Duration is automatically calculated in minutes (or use the live stopwatch timer).
  7. **CRITICAL MANDATORY PROOF LINK (TE Policy #14)**:
     - IF duration is > 5 minutes, a valid Google Meet (meet.google.com) or Google Drive (drive.google.com) recording/screenshot link is strictly MANDATORY.
     - If omitted, the work log is flagged red in the COO approval queue!
     - Duplicate links from previous calls are automatically rejected.
  8. **Next Follow-up Date**: If the problem requires re-verification, set follow-up date and reason.
- **Offline Capability**: Even if internet drops, the log is saved to local device storage (IndexedDB) with an "Offline" badge and automatically syncs to Google Sheets once reconnected.

### 4. Tickets Center (ٹکٹ سینٹر)
- **Purpose**: Complete incident lifecycle management from complaint receipt to resolution.
- **Key Concepts**:
  - **Statuses**: Open, In Progress, In Review, Resolved, Closed.
  - **Priorities**: Low, Medium, High, Critical.
  - **SLA Countdown Timer**:
    - Critical Priority: 2-hour resolution SLA.
    - High Priority: 4-hour resolution SLA.
    - Medium Priority: 8-hour resolution SLA.
- **Inside a Ticket**:
  - "Add Work Log": Attach a call or troubleshooting session directly to this ticket.
  - "Follow-up Callback": Schedule callback for this ticket.
  - "WhatsApp Alert": Send status update to customer.
  - "Timeline": Immutable audit trail of every status transition and note.

### 5. Clients Directory & Client Workspace (کلائنٹس ڈائریکٹری و ورک اسپیس)
- **Purpose**: Central database of all business customers and their technical setup.
- **Features**:
  - Global Search: Search by company name, owner, city, or software type.
  - Health Score (0 - 100%):
    - 80-100%: Healthy (Green)
    - 50-79%: Warning (Amber)
    - < 50%: Critical Risk (Red)
  - **Client Workspace View**:
    - Software Details: Installed ERP (Tally, Marg ERP, Busy, POS, Retail), version, release number, license serial number, AMC expiry date.
    - Contact Card: Primary owner, accounts manager, IT contact, phone numbers, email.
    - Activity Tabs: Tickets history, past work logs, scheduled follow-ups, and customer satisfaction rating.

### 6. Client Activation Wizard (نیا کلائنٹ شامل کریں)
- **Purpose**: Step-by-step guided wizard for onboarding a newly signed client.
- **4 Steps**:
  1. *Company Profile*: Business name, GST number, address, city, primary contact.
  2. *Software Architecture*: Product name, version, single-user/multi-user license, installation date, renewal terms.
  3. *Technical Checklist*: Database setup, printer configuration, barcode scanner setup, nightly automated backup path configured.
  4. *Confirmation & Handover*: Assign dedicated Support Executive, set initial health score to 100%, send welcome WhatsApp.

### 7. Follow-Up Tracker (فالو اپ ٹریکر)
- **Purpose**: Scheduled proactive outreach and callback reminders.
- **Tabs**: Today's Calls, Overdue Calls (marked red), Upcoming Calls, Completed.
- **Actions on Each Item**:
  - **Log Call Outcome**:
    - "Answered & Resolved" (Moves to completed)
    - "Call Back Later / Busy" (Prompts for new time)
    - "No Answer / Unreachable" (Schedules retry + sends WhatsApp notification)
    - "Escalate to Manager" (Flags ticket for senior intervention)
  - **Reschedule Button**: Select new date and time.

### 8. COO Dashboard & Approvals (سی او او ڈیش بورڈ)
- **Purpose**: Executive oversight, daily productivity governance, and audit verification.
- **Key Metrics**:
  - *Daily Target*: 420 minutes (7.0 hours) of productive customer support per executive.
  - *Productivity Tags*: On Track (>= 420m, Green), Moderate (>= 240m, Amber), Deficient (< 240m, Red), Inactive (0m).
  - *Late Entry Detection*: Flags any executive whose first recorded log for the day is after 10:20 AM.
- **Verification Review Queue**:
  - Logs flagged for duration > 5 minutes without proof link, duplicate proof links, or manual reviews.
  - Action: COO enters review remark and clicks **Approve** (Thumbs Up) or **Reject** (Thumbs Down).

### 9. User Management & Access Rules (صارفین اور رسائی کے اصول)
- **Purpose**: Employee administration and fine-grained Role-Based Access Control (RBAC).
- **Tab 1: Team Members**:
  - Add New Employee: Name, Email, Temporary Password, Employee ID (e.g. TE-105), Role (Support Executive, Support Manager, Technical Team, Finance, etc.), Department.
  - Password Reset: One-click secure password generator with Copy button.
  - Deactivate / Activate: Instantly revoke access without deleting account history.
  - Delete User: Remove user account (Admin account support@philsof.com is protected).
- **Tab 2: Access Rules (رسائی کے اصول)**:
  - Select any role (Support Executive, Technical Team, Support Manager, Marketing, Finance).
  - Toggle switches for every module (Work Log, Tickets, Clients, Follow-ups, WhatsApp, Policies, Reports).
  - When a switch is turned OFF for a role, that module immediately disappears from their navigation sidebar and routes are locked.
  - Director and COO always have 100% full, unconditional access across all modules.

### 10. WhatsApp Automation (واٹس ایپ آٹومیشن)
- **Purpose**: Real-time customer messaging, backup confirmation broadcasts, and incident alerts.
- **Features**: Outbox queue, status badges (Sent, Queued, Delivered), and pre-approved message templates.

### 11. Reports & Analytics (رپورٹس)
- **Purpose**: Data-driven insights into team performance and service quality.
- **Metrics**: CSAT Score (4.8/5), average ticket resolution speed, executive call volume charts, SLA compliance rate.

### 12. 28 TE Operational Rules & Policies (قوانین و ضوابط)
- Covers 28 strict company rules including attendance before 10:00 AM, 10:20 AM call initiation, recording proof link for any session > 5 min, zero tolerance for customer data leaks, and mandatory daily evening work submission.

---

## Personality & Guidance Style:
1. **Friendly, Empathetic, and Highly Knowledgeable**: You are a patient mentor who makes using TEDOS effortless for every team member.
2. **Bilingual Expertise**:
   - If user asks in Urdu or Roman Urdu, respond in clear, natural, helpful Urdu (or Roman Urdu) with English technical terms in parentheses where helpful.
   - If user asks in English, respond in polished, structured English.
3. **Action-Oriented & Practical**:
   - When asked "کیسے فل کریں؟" (How to fill?), provide the exact checklist of fields (1, 2, 3...) and what to type in each.
   - When asked "کونسا بٹن کیا کرتا ہے؟" (What does this button do?), explain the button name, color, and result of clicking it.
   - Always mention the mandatory 5-minute proof link rule when discussing work logs!
   - Remind users about marking daily attendance at https://technoevident.xyz/ when appropriate.
`;

export async function handleGeminiChat(
  req: express.Request,
  res: express.Response
) {
  try {
    const {
      messages,
      model = "gemini-3.8-flash",
      role = "general_guide",
      currentPage = "dashboard",
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid request. 'messages' array is required.",
      });
    }

    // Specific role prompt extensions
    let roleExtension = "";
    if (role === "demo_guide") {
      roleExtension =
        "\nFocus Mode: You are acting as an Interactive Demo Walkthrough Guide. Offer guided step-by-step simulations of common actions (e.g. logging a work call, raising a ticket to Ticket Rase tab, activating a new client).";
    } else if (role === "sop_coach") {
      roleExtension =
        "\nFocus Mode: You are the Operations SOP and Policy Coach. Emphasize compliance with the operational rules, late login tracking (10:20 AM limit), and COO audit criteria.";
    } else if (role === "field_helper") {
      roleExtension = `\nFocus Mode: The user is currently on the '${currentPage}' page. Provide immediate context-aware advice for what to fill and click on THIS specific page.`;
    }

    const systemInstruction = `${TEDOS_KNOWLEDGE_BASE}\n${roleExtension}\nCurrent active view in user session: ${currentPage}`;

    // Valid models according to gemini-api skill: gemini-3.8-flash (primary) & gemini-3.1-flash-lite (fast/fallback)
    let selectedModel = "gemini-3.8-flash";
    if (model === "gemini-3.1-flash-lite") {
      selectedModel = "gemini-3.1-flash-lite";
    }

    let response: any = null;
    let finalModel = selectedModel;

    try {
      const ai = getGenAI();
      const contents = messages.map((m: any) => ({
        role: m.role === "assistant" || m.role === "model" ? "model" : "user",
        parts: [{ text: String(m.content || m.text || "") }],
      }));

      const timeoutMs = 1500;
      const callWithTimeout = (targetModel: string) =>
        Promise.race([
          ai.models.generateContent({
            model: targetModel,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
          )
        ]);

      try {
        response = await callWithTimeout(selectedModel);
      } catch (primaryErr: any) {
        console.warn(`[GEMINI PRIMARY MODEL (${selectedModel}) FAILED]:`, primaryErr?.message);
      }
    } catch (genAiErr: any) {
      console.warn("[GEMINI SDK ERROR, USING LOCAL KNOWLEDGE ENGINE]:", genAiErr?.message);
    }

    if (response && response.text) {
      return res.json({
        success: true,
        text: response.text,
        modelUsed: finalModel,
      });
    }

    // Comprehensive Local Knowledge Fallback if API key is rate-limited or unavailable
    const lastUserMsg = messages[messages.length - 1]?.content || "";
    const lowerQuery = String(lastUserMsg).toLowerCase();

    let localReply = "";
    if (lowerQuery.includes("work log") || lowerQuery.includes("ورک لاگ") || lowerQuery.includes("لاگ") || lowerQuery.includes("fill") || lowerQuery.includes("فارم")) {
      localReply = `📝 **روزانہ ورک لاگ (Daily Work Log) مکمل 10 مراحل کی گائیڈ:**

1. **1. کلائنٹ منتخب کریں (Select Client):** لسٹ یا سرچ باکس سے کلائنٹ منتخب کریں۔ کلائنٹ منتخب ہوتے ہی آٹو سیشن ٹائمر شروع ہو جائے گا۔
2. **2. آٹو سیشن ٹائمر (Start Time Only):** اس باکس میں صرف شروع کا وقت (Start Time) آتا ہے، ٹائمر بیک گراؤنڈ میں چلتا رہتا ہے۔
3. **3. مسئلے کی کیٹیگری (Issues Category):** مثلاً Technical Support، Data Import، Training یا دیگر۔
4. **4. کام کی قسم (Work Type):** Phone call، Whatsapp call، Google meet یا Client Software Review۔
5. **5. کال اسٹیٹس (Call Status) اور 6. اگلا فالو اپ (Next Follow Up Date):** یہ دونوں فیلڈز ایک ہی لائن میں ساتھ ساتھ ہیں۔ اگر کلائنٹ سے دوبارہ رابطہ درکار ہو تو اگلی تاریخ چنیں۔
6. **7. کام کا خلاصہ (Summary):** کیے گئے کام کی تفصیل لکھیں، مائیک سے بولیں یا ✨ AI Polish بٹن دبائیں۔
7. **8. کلائنٹ اسٹیٹس (Client Status: Happy / Unhappy):** مطمئن یا غیر مطمئن منتخب کریں۔
8. **9. اختتامی وقت اور دورانیہ (End Time & Duration):** کلائنٹ اسٹیٹس منتخب ہوتے ہی یہ خودکار لاک ہو جاتا ہے (ناقابلِ ترمیم)۔
9. **10. پروف لنک اسٹیٹس (Proof Link Available?):**
   - اگر 'Yes' ہے تو انٹری کے وقت لنک ڈالنے کی ضرورت نہیں، یہ لاگ خودکار طور پر مین پیج (ڈیش بورڈ) کے **'پینڈنگ پروف لنکس'** میں چلا جائے گا جہاں آپ بعد میں اطمینان سے لنک داخل کر سکتے ہیں۔
   - فارم جمع ہوتے ہی خودکار ریفریش ہو کر مین پیج پر واپس چلا جائے گا۔`;
    } else if (lowerQuery.includes("ticket") || lowerQuery.includes("ٹکٹ") || lowerQuery.includes("raise") || lowerQuery.includes("rase") || lowerQuery.includes("sheet")) {
      localReply = `🎫 **ٹکٹ ریز کرنے اور گوگل شیٹ سنک کا طریقہ:**

- سافٹ ویئر کے ٹکٹ فارم میں نیا ٹکٹ درج کرنے پر وہ فوری طور پر **Ultimate Support Control Sheet** کی **'Ticket Rase'** ٹیب میں منتقل ہو جاتا ہے۔
- فارم میں **FROM** (کون ٹکٹ بھیج رہا ہے) اور **TO** (کس کو بھیجا جا رہا ہے، مثلاً COO یا Technical Team) منتخب کریں۔
- ساتھ ہی اسکرین شاٹ یا ڈرائیو اٹیچمنٹ کا لنک اور اگر چاہیں تو مخصوص گوگل فارم کا لنک بھی دے سکتے ہیں۔
- ٹکٹ درج ہوتے ہی سرور کے ڈیٹا بیس اور گوگل شیٹ کی 'Ticket Rase' ٹیب میں لائیو ڈیٹا پہنچ جاتا ہے۔`;
    } else if (lowerQuery.includes("whatsapp") || lowerQuery.includes("واٹس ایپ") || lowerQuery.includes("interakt") || lowerQuery.includes("نمبر")) {
      localReply = `📱 **انٹریکٹ واٹس ایپ بزنس API اور برانڈڈ میسجنگ:**

- **مرکزی سرکاری واٹس ایپ نمبر:** تمام ملازمین کے بھیجے گئے پیغامات کمپنی کے ایک ہی تصدیق شدہ آفیشل نمبر سے ڈیلیور ہوتے ہیں۔
- **TaleemPro کلائنٹس:** 100% خالص اردو نستعلیق میں باوقار پیغام تیار ہوتا ہے۔
- **Edsof کلائنٹس:** انگریزی میں **Your Edsof Support Team** کی برانڈنگ کے ساتھ پیغام جاتا ہے۔
- **TEDOS ERP v4.5 کا خاتمہ:** کسی بھی پیغام میں TEDOS ERP v4.5 کا نام بالکل نہیں آتا۔
- سیٹنگز میں جا کر آپ اپنی Interakt Secret API Key اور مرکزی نمبر محفوظ کر سکتے ہیں۔`;
    } else if (lowerQuery.includes("password") || lowerQuery.includes("پاس ورڈ") || lowerQuery.includes("user id") || lowerQuery.includes("یوزر") || lowerQuery.includes("admin") || lowerQuery.includes("ایڈمن")) {
      localReply = `👥 **یوزر آئی ڈی اور پاس ورڈ اپ ڈیٹ کی اتھارٹی:**

- **مین ایڈمن رول کا اختیار:** کسی بھی ملازم کی یوزر آئی ڈی (Employee ID / Email) اور پاس ورڈ تبدیل کرنے کا اختیار صرف **مین ایڈمن (Director / support@philsof.com)** کے پاس ہے۔
- دیگر رولز کو صرف اپنے متعلقہ ماڈیولز کے حقوق حاصل ہیں۔
- جب مین ایڈمن کسی ملازم کا پاس ورڈ یا آئی ڈی تبدیل کرتا ہے تو وہ فوری طور پر سینٹرل سرور پر اپ ڈیٹ ہو جاتی ہے اور تمام لیپ ٹاپس اور پی سیز پر فوری لاگو ہو جاتی ہے۔`;
    } else if (lowerQuery.includes("attendance") || lowerQuery.includes("حاضری") || lowerQuery.includes("payroll") || lowerQuery.includes("portal")) {
      localReply = `📅 **آفیشل پے رول حاضری پورٹل:**

- تمام ایگزیکٹوز اور ملازمین کو روزانہ صبح 10:00 بجے سے پہلے **https://technoevident.xyz/** پر اپنی حاضری درج کرنا لازمی ہے۔
- ہیڈر بار میں **Payroll ↗** بٹن پر کلک کر کے آپ براہِ راست حاضری پورٹل کھول سکتے ہیں۔
- صبح لاگ ان کے وقت اور شام لاگ آؤٹ کے وقت واٹس ایپ گروپ پر شفٹ اسٹیٹس شیئر کرنا لازمی اصول ہے۔`;
    } else if (lowerQuery.includes("coo") || lowerQuery.includes("target") || lowerQuery.includes("پالیسی") || lowerQuery.includes("قوانین") || lowerQuery.includes("rule")) {
      localReply = `⚖️ **آپریشنل ایس او پیز اور سی او او گورننس رولز:**

- **روزانہ ورک لوڈ ٹارگٹ:** ہر سپورٹ ایگزیکٹو کے لیے روزانہ 420 منٹ (7 گھنٹے) کا نتیجہ خیز سپورٹ سیشن ریکارڈ کرنا لازمی ہے۔
- **10:20 AM کال لیمٹ:** صبح 10:20 کے بعد شروع ہونے والا پہلا لاگ لیٹ کاؤنٹ ہوتا ہے۔
- **5 منٹ ریکارڈنگ پالیسی (#14):** 5 منٹ سے زائد سیشن کے لیے گوگل میٹ یا ڈرائیو ریکارڈنگ لنک لازمی ہے، ورنہ سیشن COO آڈٹ کیو میں ریڈ فلیگ ہو جائے گا۔`;
    } else {
      localReply = `السلام علیکم! میں آپ کا **Gemini سافٹ ویئر گائیڈ و کو پائلٹ** ہوں۔ 👋

آپ مجھ سے سافٹ ویئر کے کسی بھی حصے کے بارے میں رہنمائی لے سکتے ہیں:
1. 📝 **ڈیلی ورک لاگ فارم:** 1 سے 10 تک تمام فیلڈز اور پینڈنگ پروف کا اصول۔
2. 🎫 **ٹکٹ سینٹر:** ٹکٹ ریز کرنا اور 'Ticket Rase' گوگل شیٹ ٹیب میں براہِ راست اندراج۔
3. 📱 **انٹریکٹ واٹس ایپ:** ایک ہی مرکزی نمبر سے TaleemPro کے لیے اردو اور Edsof کے لیے انگریزی پیغامات۔
4. 👥 **یوزر مینیجمنٹ:** مین ایڈمن کی طرف سے پاس ورڈ اور یوزر آئی ڈی کی تبدیلی۔
5. 📅 **حاضری پورٹل:** https://technoevident.xyz/ پر روزانہ صبح حاضری۔

آپ کا سوال کیا ہے؟ بلا جھجھک لکھیے!`;
    }

    return res.json({
      success: true,
      text: localReply,
      modelUsed: "gemini-knowledge-co-pilot",
    });
  } catch (error: any) {
    console.error("[GEMINI CHAT ERROR]:", error);
    return res.json({
      success: true,
      text: "السلام علیکم! میں آپ کا Gemini سافٹ ویئر گائیڈ ہوں۔ آپ مجھ سے ورک لاگ، ٹکٹ سینٹر، انٹریکٹ واٹس ایپ یا یوزر مینیجمنٹ کے بارے میں کچھ بھی پوچھ سکتے ہیں!",
      modelUsed: "fallback-assistant"
    });
  }
}
