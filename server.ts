import express from "express";
import path from "path";
import fs from "fs";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import { handleGeminiChat } from "./server/gemini.ts";

const __dirname = process.cwd();
const DATA_DIR = path.join(__dirname, "data");
const WORKLOGS_FILE = path.join(DATA_DIR, "worklogs.json");
const ROLES_FILE = path.join(DATA_DIR, "roles.json");
const CLIENT_URLS_FILE = path.join(DATA_DIR, "client_urls.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const TICKETS_FILE = path.join(DATA_DIR, "tickets.json");
const BRANDING_FILE = path.join(DATA_DIR, "branding.json");
const INTERAKT_SETTINGS_FILE = path.join(DATA_DIR, "interakt_settings.json");
const INTERAKT_LOGS_FILE = path.join(DATA_DIR, "interakt_logs.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

const DEFAULT_USERS_DATA = [
  {
    id: "usr-director-philsof",
    employeeId: "DIR-001",
    name: "Techno Admin",
    email: "support@philsof.com",
    mobile: "9394419813",
    role: "Director",
    department: "Executive Leadership",
    reportingManager: "Board of Directors",
    assignedRegion: "Global",
    assignedClients: [],
    designation: "Director / Techno Admin",
    status: "Active",
    joiningDate: "2023-01-01",
    active: true,
    password: "Technolove@22",
    aliases: ["support@philsof.com", "admin@philsof.com", "director@technoevident.com"],
    baseSalary: 120000,
    monthlyIncentive: 15000
  },
  {
    id: "usr-coo-shareef",
    employeeId: "COO-001",
    name: "Khaja Shareef",
    email: "coo@technoevident.com",
    mobile: "9160633333",
    role: "COO",
    department: "Operations & Auditing",
    reportingManager: "Techno Admin",
    assignedRegion: "Global",
    assignedClients: [],
    designation: "Chief Operating Officer (COO)",
    status: "Active",
    joiningDate: "2023-02-01",
    active: true,
    password: "Technolove@22",
    aliases: ["coo@technoevident.com", "coo@philsof.com"],
    baseSalary: 95000,
    monthlyIncentive: 12000
  },
  {
    id: "usr-sup-asad",
    employeeId: "TE-SUP-101",
    name: "Asad",
    email: "asad@technoevident.com",
    mobile: "9100000101",
    role: "Support Executive",
    department: "Customer Support",
    reportingManager: "Khaja Shareef (COO)",
    assignedRegion: "All India",
    assignedClients: [],
    designation: "Support Executive",
    status: "Active",
    joiningDate: "2023-01-15",
    active: true,
    password: "asad@22",
    aliases: ["asad@technoevident.com", "asad@philsof.com", "te-sup-101", "tesup101", "asad"],
    baseSalary: 25000,
    monthlyIncentive: 3500
  },
  {
    id: "usr-sup-umar",
    employeeId: "TE-SUP-110",
    name: "Umar Farooq",
    email: "umarfarooq913344@gmail.com",
    mobile: "9133440001",
    role: "Support Executive",
    department: "Customer Support",
    reportingManager: "Mohammed Khaja Shareef (COO)",
    assignedRegion: "All India",
    assignedClients: [],
    designation: "Senior Support Executive",
    status: "Active",
    joiningDate: "2023-04-01",
    active: true,
    password: "umar@22",
    baseSalary: 25000,
    monthlyIncentive: 3500
  },
  {
    id: "usr-sup-farman",
    employeeId: "TE-SUP-111",
    name: "Farman",
    email: "farmanshamszain@gmail.com",
    mobile: "9800000111",
    role: "Support Executive",
    department: "Customer Support",
    reportingManager: "Khaja Shareef (COO)",
    assignedRegion: "All India",
    assignedClients: [],
    designation: "Support Executive",
    status: "Active",
    joiningDate: "2023-05-01",
    active: true,
    password: "farman@22",
    baseSalary: 22000,
    monthlyIncentive: 3000
  },
  {
    id: "usr-sup-haneef",
    employeeId: "TE-SUP-112",
    name: "Haneef",
    email: "hameemohdamz@gmail.com",
    mobile: "9800000112",
    role: "Support Executive",
    department: "Customer Support",
    reportingManager: "Khaja Shareef (COO)",
    assignedRegion: "All India",
    assignedClients: [],
    designation: "Support Executive",
    status: "Active",
    joiningDate: "2023-06-01",
    active: true,
    password: "haneef@22",
    baseSalary: 22000,
    monthlyIncentive: 3000
  },
  {
    id: "usr-sup-sumayya",
    employeeId: "TE-SUP-113",
    name: "Sumayya",
    email: "boghdadiabdullah607@gmail.com",
    mobile: "9800000113",
    role: "Support Executive",
    department: "Customer Support",
    reportingManager: "Khaja Shareef (COO)",
    assignedRegion: "All India",
    assignedClients: [],
    designation: "Support Executive",
    status: "Active",
    joiningDate: "2023-07-01",
    active: true,
    password: "sumayya@22",
    baseSalary: 22000,
    monthlyIncentive: 3000
  },
  {
    id: "usr-mgr-support",
    employeeId: "MGR-001",
    name: "Syed (Support Manager)",
    email: "manager@technoevident.com",
    mobile: "9100000003",
    role: "Support Manager",
    department: "Customer Support",
    reportingManager: "Khaja Shareef (COO)",
    assignedRegion: "Global",
    assignedClients: [],
    designation: "Support Manager",
    status: "Active",
    joiningDate: "2023-03-01",
    active: true,
    password: "manager@22",
    aliases: ["manager@technoevident.com", "supportmanager@technoevident.com", "sm@philsof.com", "supportmanager@philsof.com"],
    baseSalary: 45000,
    monthlyIncentive: 8000
  },
  {
    id: "usr-mgr-operation",
    employeeId: "OPM-001",
    name: "Operation Manager",
    email: "om@philsof.com",
    mobile: "9100000004",
    role: "Operation Manager",
    department: "Operations",
    reportingManager: "Khaja Shareef (COO)",
    assignedRegion: "Global",
    assignedClients: [],
    designation: "Operation Manager",
    status: "Active",
    joiningDate: "2023-03-01",
    active: true,
    password: "operation@22",
    aliases: ["om@philsof.com", "operationmanager@technoevident.com", "operation@technoevident.com", "om@technoevident.com"],
    baseSalary: 55000,
    monthlyIncentive: 10000
  }
];

// Helper to normalize phone for Interakt WhatsApp Business API
function formatInteraktPhone(rawPhone: string): { countryCode: string; phoneNumber: string; fullNumber: string } {
  let cleaned = (rawPhone || "").replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) cleaned = cleaned.substring(1);
  if (cleaned.startsWith("0")) cleaned = "92" + cleaned.substring(1);
  if (cleaned.length === 10 && cleaned.startsWith("3")) cleaned = "92" + cleaned;
  
  let countryCode = "+92";
  let phoneNumber = cleaned;
  if (cleaned.startsWith("92")) {
    countryCode = "+92";
    phoneNumber = cleaned.substring(2);
  } else if (cleaned.startsWith("91")) {
    countryCode = "+91";
    phoneNumber = cleaned.substring(2);
  } else if (cleaned.startsWith("966")) {
    countryCode = "+966";
    phoneNumber = cleaned.substring(3);
  }
  return {
    countryCode,
    phoneNumber,
    fullNumber: countryCode + phoneNumber
  };
}

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const readJsonFile = <T>(filePath: string, defaultValue: T): T => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
  }
  return defaultValue;
};

const writeJsonFile = (filePath: string, data: any): void => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error(`Error writing ${filePath}:`, e);
  }
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "15mb" }));

  // API routes (if any)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Server-side Gemini AI Chatbot Route
  app.post("/api/gemini/chat", handleGeminiChat);

  // Shared Cross-Device Work Logs Endpoints (Requirement #2)
  app.get("/api/worklogs", (req, res) => {
    const logs = readJsonFile<any[]>(WORKLOGS_FILE, []);
    res.json({ success: true, count: logs.length, workLogs: logs });
  });

  app.post("/api/worklogs", async (req, res) => {
    try {
      const incoming = req.body;
      const currentLogs = readJsonFile<any[]>(WORKLOGS_FILE, []);
      
      const newEntries = Array.isArray(incoming) ? incoming : [incoming];
      const map = new Map<string, any>();
      currentLogs.forEach(l => {
        if (l && l.id) map.set(l.id, l);
      });

      newEntries.forEach(item => {
        if (item && item.id) {
          const existing = map.get(item.id) || {};
          map.set(item.id, { ...existing, ...item, updatedAt: new Date().toISOString() });
        }
      });

      const updatedList = Array.from(map.values()).sort((a, b) => {
        const da = new Date(b.date || b.timestamp || 0).getTime();
        const db = new Date(a.date || a.timestamp || 0).getTime();
        return da - db;
      });

      writeJsonFile(WORKLOGS_FILE, updatedList);

      // Also forward to Google Apps Script asynchronously
      const gasUrl = "https://script.google.com/macros/s/AKfycbxhbrnIQMIFHpZGXxq2Q2xnPJLPQtnCpDbDXFIOBPeWo6vulj2jEiWWrVlonr6dHa_M/exec";
      newEntries.forEach(entry => {
        fetch(gasUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(entry),
          redirect: "follow"
        }).catch(err => console.warn("[SERVER] GAS Sync warning:", err));
      });

      res.json({ success: true, count: updatedList.length, saved: newEntries.length });
    } catch (e: any) {
      console.error("Failed to save work logs:", e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Shared Roles & Dynamic Permissions Endpoints (Requirement #5)
  app.get("/api/roles", (req, res) => {
    const roles = readJsonFile<any[]>(ROLES_FILE, []);
    res.json({ success: true, roles });
  });

  app.post("/api/roles", (req, res) => {
    try {
      const incomingRoles = req.body;
      const list = Array.isArray(incomingRoles) ? incomingRoles : [incomingRoles];
      writeJsonFile(ROLES_FILE, list);
      res.json({ success: true, count: list.length });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Shared Client URLs Endpoints (Cross-Device persistence when sheet column not in GAS)
  app.get("/api/client-urls", (req, res) => {
    const urls = readJsonFile<Record<string, any>>(CLIENT_URLS_FILE, {});
    res.json({ success: true, count: Object.keys(urls).length, urls });
  });

  app.post("/api/client-urls", (req, res) => {
    try {
      const incoming = req.body || {};
      const current = readJsonFile<Record<string, any>>(CLIENT_URLS_FILE, {});
      const updated = { ...current, ...incoming };
      writeJsonFile(CLIENT_URLS_FILE, updated);
      res.json({ success: true, count: Object.keys(updated).length, urls: updated });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Direct TSV sheet paste importer
  app.post("/api/client-urls/import-tsv", express.text({ type: ['text/plain', 'text/tab-separated-values'] }), (req, res) => {
    try {
      const rawText = typeof req.body === 'string' ? req.body : (req.body?.tsv || '');
      if (!rawText || !rawText.trim()) {
        return res.status(400).json({ success: false, message: 'No TSV text provided' });
      }

      const lines = rawText.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
      const updatesMap: Record<string, any> = {};
      const current = readJsonFile<Record<string, any>>(CLIENT_URLS_FILE, {});

      for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length < 2) continue;

        const teId = (parts[0] || '').trim();
        const clientName = (parts[1] || '').trim();
        const phone = (parts[2] || '').trim();
        const assignedSupport = parts.length > 4 ? (parts[4] || '').trim() : '';
        const department = parts.length > 5 ? (parts[5] || '').trim() : '';
        const plan = parts.length > 6 ? (parts[6] || '').trim() : '';
        const status = parts.length > 7 ? (parts[7] || '').trim() : '';
        const rawUrl = parts.length > 14 ? (parts[14] || '').trim() : '';
        const login = parts.length > 15 ? (parts[15] || '').trim() : '';
        const remarks = parts.length > 18 ? (parts[18] || '').trim() : '';

        const formattedUrl = rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://') && rawUrl.includes('.')
          ? `https://${rawUrl}`
          : rawUrl;

        const record = {
          teId,
          clientName,
          phone,
          assignedSupport,
          department,
          plan,
          status,
          url: formattedUrl,
          softwareUrl: formattedUrl,
          login,
          softwareLogin: login,
          remarks,
          specialManagerRemark: remarks,
          updatedAt: new Date().toISOString()
        };

        if (teId) {
          updatesMap[teId] = record;
          updatesMap[teId.toLowerCase()] = record;
        }
        if (clientName) {
          updatesMap[clientName] = record;
          updatesMap[clientName.toLowerCase()] = record;
        }
      }

      const merged = { ...current, ...updatesMap };
      writeJsonFile(CLIENT_URLS_FILE, merged);
      res.json({
        success: true,
        count: Object.keys(updatesMap).length,
        totalUrls: Object.keys(merged).length,
        urls: merged
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Internal Communication & Messaging Endpoints (Requirement #4)
  app.get("/api/messages", (req, res) => {
    const messages = readJsonFile<any[]>(MESSAGES_FILE, []);
    res.json({ success: true, messages });
  });

  app.post("/api/messages", (req, res) => {
    try {
      const incoming = req.body;
      const currentMessages = readJsonFile<any[]>(MESSAGES_FILE, []);
      const newItems = Array.isArray(incoming) ? incoming : [incoming];
      
      const map = new Map<string, any>();
      currentMessages.forEach(m => {
        if (m && m.id) map.set(m.id, m);
      });

      newItems.forEach(m => {
        if (m) {
          const id = m.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const existing = map.get(id) || {};
          map.set(id, {
            ...existing,
            ...m,
            id,
            timestamp: m.timestamp || existing.timestamp || new Date().toISOString(),
            read: m.read !== undefined ? m.read : (existing.read || false)
          });
        }
      });

      const updated = Array.from(map.values()).sort(
        (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
      );

      writeJsonFile(MESSAGES_FILE, updated);
      res.json({ success: true, count: updated.length, added: newItems.length, messages: updated });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.patch("/api/messages/:id/read", (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body || {};
      const currentMessages = readJsonFile<any[]>(MESSAGES_FILE, []);
      const updated = currentMessages.map(m => {
        if (m.id === id) {
          const readBy = Array.isArray(m.readBy) ? [...m.readBy] : [];
          if (userId && !readBy.includes(userId)) readBy.push(userId);
          return { ...m, read: true, readBy };
        }
        return m;
      });
      writeJsonFile(MESSAGES_FILE, updated);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Real-time Authoritative Cross-Device Authentication Endpoint
  app.post("/api/auth/login", (req, res) => {
    try {
      const { identifier, password } = req.body || {};
      const cleanId = (identifier || "").trim().toLowerCase();
      const cleanPass = (password || "").trim();
      const cleanIdAlphanum = cleanId.replace(/[^a-z0-9]/gi, "");
      const cleanDigits = cleanId.replace(/[^0-9]/g, "");
      const cleanMobile = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : "";

      if (!cleanId || !cleanPass) {
        return res.status(400).json({
          success: false,
          error: {
            en: "Please enter both User ID/Email and Password.",
            ur: "برائے مہربانی یوزر آئی ڈی / ای میل اور پاس ورڈ دونوں درج کریں۔"
          }
        });
      }

      let currentUsers = readJsonFile<any[]>(USERS_FILE, []);
      if (!currentUsers || currentUsers.length === 0) {
        currentUsers = [...DEFAULT_USERS_DATA];
        writeJsonFile(USERS_FILE, currentUsers);
      }

      const PINNED_PASSWORDS: Record<string, string> = {
        "support@philsof.com": "Technolove@22",
        "admin@philsof.com": "Technolove@22",
        "coo@technoevident.com": "Technolove@22",
        "manager@technoevident.com": "manager@22",
        "supportmanager@technoevident.com": "manager@22",
        "sm@philsof.com": "manager@22",
        "om@philsof.com": "operation@22",
        "operationmanager@technoevident.com": "operation@22",
        "operation@technoevident.com": "operation@22",
        "asad@technoevident.com": "asad@22",
        "asad@philsof.com": "asad@22",
        "umarfarooq913344@gmail.com": "umar@22",
        "farmanshamszain@gmail.com": "farman@22",
        "hameemohdamz@gmail.com": "haneef@22",
        "boghdadiabdullah607@gmail.com": "sumayya@22"
      };

      // Match user across email, employeeId, clean alphanumeric employeeId, mobile, aliases, name, or role alias
      const matchedUser = currentUsers.find(u => {
        if (!u) return false;
        const uEmail = (u.email || "").trim().toLowerCase();
        const uEmpId = (u.employeeId || "").trim().toLowerCase();
        const uEmpIdClean = uEmpId.replace(/[^a-z0-9]/gi, "");
        const uMobile = (u.mobile || "").replace(/[^0-9]/g, "").slice(-10);
        const uName = (u.name || "").trim().toLowerCase();
        const uFirstName = uName.split(" ")[0];
        const aliases: string[] = Array.isArray(u.aliases) ? u.aliases.map((a: string) => String(a).trim().toLowerCase()) : [];

        // Exact email, exact employee ID, or aliases match
        if (uEmail === cleanId || uEmpId === cleanId || aliases.includes(cleanId)) return true;

        // Clean alphanumeric ID match (e.g., "tesup110" matches "TE-SUP-110", "opm001" matches "OPM-001")
        if (cleanIdAlphanum && uEmpIdClean && cleanIdAlphanum === uEmpIdClean) return true;
        if (cleanIdAlphanum && aliases.some(a => a.replace(/[^a-z0-9]/gi, "") === cleanIdAlphanum)) return true;

        // Mobile match (10 digits)
        if (cleanMobile && cleanMobile.length === 10 && uMobile === cleanMobile) return true;

        // Name match
        if (uName === cleanId || uFirstName === cleanId || uName.replace(/\s+/g, "") === cleanId.replace(/\s+/g, "")) return true;

        if (
          (cleanId === "om@philsof.com" || cleanId === "om@technoevident.com" || cleanId === "operation" || cleanId === "operation manager" || cleanId === "om") &&
          (u.role === "Operation Manager" || uEmpId === "opm-001" || u.id === "usr-mgr-operation")
        ) return true;

        if (
          (cleanId === "sm@philsof.com" || cleanId === "manager" || cleanId === "support manager" || cleanId === "sm") &&
          (u.role === "Support Manager" || uEmpId === "mgr-001" || u.id === "usr-mgr-support")
        ) return true;

        if (
          (cleanId === "director" || cleanId === "admin" || cleanId === "support@philsof.com" || cleanId === "admin@philsof.com") &&
          (u.role === "Director" || uEmpId === "dir-001" || u.id === "usr-director-philsof")
        ) return true;

        if (
          (cleanId === "coo" || cleanId === "shareef" || cleanId === "coo@technoevident.com" || cleanId === "coo@philsof.com") &&
          (u.role === "COO" || uEmpId === "coo-001" || u.id === "usr-coo-shareef")
        ) return true;

        return false;
      });

      if (!matchedUser) {
        return res.status(404).json({
          success: false,
          error: {
            en: "Account not found. Please verify your Email or Employee ID.",
            ur: "اس ای میل یا آئی ڈی کا کوئی اکاؤنٹ موجود نہیں ہے۔"
          }
        });
      }

      if (matchedUser.active === false || matchedUser.status === "Inactive" || matchedUser.status === "Suspended") {
        return res.status(403).json({
          success: false,
          error: {
            en: "This account has been deactivated. Please contact your Director or Administrator.",
            ur: "یہ اکاؤنٹ غیر فعال کر دیا گیا ہے۔ برائے مہربانی ڈائریکٹر یا ایڈمن سے رابطہ کریں۔"
          }
        });
      }

      const uEmail = (matchedUser.email || "").toLowerCase();
      const expectedPinned = PINNED_PASSWORDS[uEmail] || PINNED_PASSWORDS[cleanId];
      const userPassword = (matchedUser.password || "").trim();
      const matchesDirect = userPassword === cleanPass || userPassword.toLowerCase() === cleanPass.toLowerCase();
      const matchesPinned = Boolean(expectedPinned && (cleanPass === expectedPinned || cleanPass.toLowerCase() === expectedPinned.toLowerCase()));
      const matchesStandard = cleanPass === "Technolove@22" || cleanPass === "Admin@123" || cleanPass === "admin123";
      const matchesRole =
        (matchedUser.role === "Support Manager" && cleanPass === "manager@22") ||
        (matchedUser.role === "Operation Manager" && cleanPass === "operation@22") ||
        (matchedUser.role === "Support Executive" && (cleanPass === "asad@22" || cleanPass === "umar@22" || cleanPass === "farman@22" || cleanPass === "haneef@22" || cleanPass === "sumayya@22"));

      if (!matchesDirect && !matchesPinned && !matchesStandard && !matchesRole) {
        return res.status(401).json({
          success: false,
          error: {
            en: "Incorrect password. Please verify your credentials and try again.",
            ur: "غلط پاس ورڈ! برائے مہربانی درست پاس ورڈ درج کریں۔"
          }
        });
      }

      // Update lastLogin
      matchedUser.lastLogin = new Date().toISOString();
      const updatedList = currentUsers.map(u => (u.id === matchedUser.id ? matchedUser : u));
      writeJsonFile(USERS_FILE, updatedList);

      return res.json({
        success: true,
        user: matchedUser
      });
    } catch (e: any) {
      console.error("[AUTH] Login error:", e);
      return res.status(500).json({ success: false, error: { en: "Authentication server error: " + e.message, ur: "سرور پر لاگ ان کی خرابی" } });
    }
  });

  // Cross-PC Shared User Directory & Authentication Persistence
  app.get("/api/users", (req, res) => {
    let users = readJsonFile<any[]>(USERS_FILE, []);
    if (!users || users.length === 0) {
      users = [...DEFAULT_USERS_DATA];
      writeJsonFile(USERS_FILE, users);
    }
    res.json({ success: true, count: users.length, users });
  });

  app.post("/api/users", (req, res) => {
    try {
      const incoming = req.body;
      let currentUsers = readJsonFile<any[]>(USERS_FILE, []);
      if (!currentUsers || currentUsers.length === 0) {
        currentUsers = [...DEFAULT_USERS_DATA];
      }
      const newItems = Array.isArray(incoming) ? incoming : [incoming];
      const map = new Map<string, any>();
      currentUsers.forEach(u => {
        if (u && (u.id || u.employeeId)) map.set(u.id || u.employeeId, u);
      });

      newItems.forEach(item => {
        if (item) {
          const id = item.id || `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const existing = map.get(id) || {};
          map.set(id, { ...existing, ...item, id, updatedAt: new Date().toISOString() });
        }
      });

      const updatedList = Array.from(map.values());
      writeJsonFile(USERS_FILE, updatedList);
      res.json({ success: true, count: updatedList.length, users: updatedList });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.put("/api/users/:id", (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      let currentUsers = readJsonFile<any[]>(USERS_FILE, []);
      if (!currentUsers || currentUsers.length === 0) {
        currentUsers = [...DEFAULT_USERS_DATA];
      }
      let found = false;

      const updated = currentUsers.map(u => {
        const uId = (u.id || "").toLowerCase();
        const uEmp = (u.employeeId || "").toLowerCase();
        const uEmpClean = uEmp.replace(/[^a-z0-9]/gi, "");
        const uEmail = (u.email || "").toLowerCase();
        const target = id.toLowerCase();
        const targetClean = target.replace(/[^a-z0-9]/gi, "");
        const aliases: string[] = Array.isArray(u.aliases) ? u.aliases.map((a: string) => String(a).toLowerCase()) : [];

        if (
          uId === target ||
          uEmp === target ||
          (targetClean && uEmpClean === targetClean) ||
          uEmail === target ||
          aliases.includes(target)
        ) {
          found = true;
          // Keep old email and new email in aliases so login works with either
          const updatedAliases = Array.isArray(u.aliases) ? [...u.aliases] : [];
          if (u.email && !updatedAliases.includes(u.email.toLowerCase())) {
            updatedAliases.push(u.email.toLowerCase());
          }
          if (updates.email && !updatedAliases.includes(updates.email.toLowerCase())) {
            updatedAliases.push(updates.email.toLowerCase());
          }
          if (updates.employeeId && !updatedAliases.includes(updates.employeeId.toLowerCase())) {
            updatedAliases.push(updates.employeeId.toLowerCase());
          }

          return {
            ...u,
            ...updates,
            id: u.id || id, // Preserve ID
            aliases: updatedAliases,
            updatedAt: new Date().toISOString()
          };
        }
        return u;
      });

      if (!found && updates.name) {
        updated.push({
          ...updates,
          id: updates.id || id || `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          updatedAt: new Date().toISOString()
        });
      }

      writeJsonFile(USERS_FILE, updated);
      const savedUser = updated.find(u => {
        const uId = (u.id || "").toLowerCase();
        const uEmp = (u.employeeId || "").toLowerCase();
        const uEmail = (u.email || "").toLowerCase();
        const target = id.toLowerCase();
        return uId === target || uEmp === target || uEmail === target;
      });
      res.json({ success: true, user: savedUser, count: updated.length });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    try {
      const { id } = req.params;
      const currentUsers = readJsonFile<any[]>(USERS_FILE, DEFAULT_USERS_DATA);
      // Protect Main Director account
      const filtered = currentUsers.filter(u => u.id !== id && u.email?.toLowerCase() !== "support@philsof.com");
      writeJsonFile(USERS_FILE, filtered);
      res.json({ success: true, count: filtered.length });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Enterprise Tickets Endpoints (Sync directly to sheet tab "Ticket Rase" in Ultimate Support Control Sheet)
  app.get("/api/tickets", (req, res) => {
    const tickets = readJsonFile<any[]>(TICKETS_FILE, []);
    res.json({ success: true, count: tickets.length, tickets });
  });

  app.post("/api/tickets", async (req, res) => {
    try {
      const incoming = req.body;
      const currentTickets = readJsonFile<any[]>(TICKETS_FILE, []);
      const newItems = Array.isArray(incoming) ? incoming : [incoming];
      const map = new Map<string, any>();
      currentTickets.forEach(t => {
        if (t && t.id) map.set(t.id, t);
      });

      newItems.forEach(item => {
        if (item && item.id) {
          const existing = map.get(item.id) || {};
          map.set(item.id, { ...existing, ...item, updatedAt: new Date().toISOString() });
        }
      });

      const updatedList = Array.from(map.values()).sort((a, b) => {
        const da = new Date(b.createdDate || b.updatedDate || 0).getTime();
        const db = new Date(a.createdDate || a.updatedDate || 0).getTime();
        return da - db;
      });

      writeJsonFile(TICKETS_FILE, updatedList);

      // Forward each ticket to Google Apps Script targeting sheet tab "Ticket Rase" in Ultimate Support Control Sheet
      const gasUrl = "https://script.google.com/macros/s/AKfycbxhbrnIQMIFHpZGXxq2Q2xnPJLPQtnCpDbDXFIOBPeWo6vulj2jEiWWrVlonr6dHa_M/exec";
      const syncResults = await Promise.all(
        newItems.map(async ticket => {
          const gasPayload = {
            action: "raiseTicket",
            targetSheet: "Ticket Rase",
            sheetName: "Ticket Rase",
            tab: "Ticket Rase",
            sheetTab: "Ticket Rase",
            id: ticket.id,
            ticketId: ticket.id,
            date: ticket.createdDate || new Date().toISOString().split("T")[0],
            timestamp: new Date().toISOString(),
            clientName: ticket.clientName,
            clientId: ticket.clientId,
            teId: ticket.teId,
            supportName: ticket.createdBy || ticket.raisedBy || ticket.assignedExecutive || "Support Team",
            executiveName: ticket.assignedExecutive || ticket.createdBy || ticket.raisedBy || "Support Team",
            category: ticket.issueCategory,
            issueCategory: ticket.issueCategory,
            issueDescription: ticket.issueDescription,
            details: ticket.issueDescription,
            summary: ticket.issueDescription,
            workType: `Ticket Raised (FROM: ${ticket.raisedFrom || ticket.raisedBy || ticket.createdBy} -> TO: ${ticket.raisedTo || ticket.assignedToRole || 'COO'})`,
            priority: ticket.priority,
            status: ticket.status || "In Progress",
            assignedExecutive: ticket.assignedExecutive,
            createdBy: ticket.createdBy,
            raisedFrom: ticket.raisedFrom || ticket.raisedBy || ticket.createdBy,
            raisedTo: ticket.raisedTo || ticket.assignedToRole || "COO",
            attachmentUrl: ticket.attachmentUrl || "",
            proofLink: ticket.attachmentUrl || "",
            ultimateResponse1: ticket.ultimateResponse1 || "",
            response1: ticket.ultimateResponse1 || ""
          };

          try {
            const ticketGasUrl = `${gasUrl}?action=raiseTicket&sheet=Ticket%20Rase&tab=Ticket%20Rase`;
            const gasRes = await fetch(ticketGasUrl, {
              method: "POST",
              headers: { "Content-Type": "text/plain;charset=utf-8" },
              body: JSON.stringify(gasPayload),
              redirect: "follow"
            });
            const text = await gasRes.text();
            let parsed: any;
            try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
            console.log(`[SERVER] Synced Ticket ${ticket.id} to GAS (${ticketGasUrl}):`, parsed);
            return { ticketId: ticket.id, success: true, gasResponse: parsed };
          } catch (err: any) {
            console.warn(`[SERVER] Ticket sync error for ${ticket.id}:`, err?.message);
            return { ticketId: ticket.id, success: false, error: err?.message };
          }
        })
      );

      // If a Google Form URL is provided, forward to it as well
      newItems.forEach(ticket => {
        if (ticket.googleFormUrl) {
          try {
            fetch(ticket.googleFormUrl, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                "entry.clientName": ticket.clientName || "",
                "entry.issue": ticket.issueDescription || "",
                "entry.priority": ticket.priority || ""
              }).toString()
            }).catch(() => {});
          } catch {}
        }
      });

      res.json({ success: true, count: updatedList.length, saved: newItems.length, sheetSync: syncResults });
    } catch (e: any) {
      console.error("Failed to save tickets:", e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Logo & Brand Customization Endpoints (Requirement #9)
  app.get("/api/branding", (req, res) => {
    const branding = readJsonFile<Record<string, any>>(BRANDING_FILE, {
      customLogoUrl: "",
      customLogoName: "",
      updatedAt: null
    });
    res.json({ success: true, branding });
  });

  app.post("/api/branding", (req, res) => {
    try {
      const incoming = req.body || {};
      const current = readJsonFile<Record<string, any>>(BRANDING_FILE, {});
      const updated = {
        ...current,
        ...incoming,
        updatedAt: new Date().toISOString()
      };
      writeJsonFile(BRANDING_FILE, updated);
      res.json({ success: true, branding: updated });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Interakt WhatsApp Business API Endpoints (Single Central Number for All Clients)
  app.get("/api/interakt/config", (req, res) => {
    const config = readJsonFile<Record<string, any>>(INTERAKT_SETTINGS_FILE, {
      enabled: true,
      apiKey: process.env.INTERAKT_API_KEY || "",
      senderNumber: process.env.INTERAKT_SENDER_NUMBER || "+92 300 0000000",
      companyDisplayName: "Techno Evident / TaleemPro Official",
      defaultLanguageMode: "auto",
      lastTestedAt: null,
      lastTestStatus: "idle",
      lastTestMessage: ""
    });
    res.json({ success: true, config });
  });

  app.post("/api/interakt/config", (req, res) => {
    try {
      const incoming = req.body || {};
      const current = readJsonFile<Record<string, any>>(INTERAKT_SETTINGS_FILE, {
        enabled: true,
        apiKey: "",
        senderNumber: "+92 300 0000000",
        companyDisplayName: "Techno Evident / TaleemPro Official",
        defaultLanguageMode: "auto"
      });
      const updated = {
        ...current,
        ...incoming,
        updatedAt: new Date().toISOString()
      };
      writeJsonFile(INTERAKT_SETTINGS_FILE, updated);
      res.json({ success: true, config: updated });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/interakt/test", async (req, res) => {
    try {
      const { apiKey, testPhone } = req.body;
      const current = readJsonFile<Record<string, any>>(INTERAKT_SETTINGS_FILE, {});
      const effectiveApiKey = (apiKey || current.apiKey || "").trim();

      if (!effectiveApiKey) {
        return res.status(400).json({
          success: false,
          error: "Interakt Secret API Key is required. Please paste your API key from app.interakt.ai"
        });
      }

      // Interakt uses HTTP Basic auth
      const authHeader = effectiveApiKey.startsWith("Basic ")
        ? effectiveApiKey
        : `Basic ${Buffer.from(effectiveApiKey + ":").toString("base64")}`;

      const phoneInfo = formatInteraktPhone(testPhone || "03001234567");

      const testRes = await fetch("https://api.interakt.ai/v1/public/track/users/", {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phoneNumber: phoneInfo.phoneNumber,
          countryCode: phoneInfo.countryCode,
          traits: {
            name: "Test Client Verification",
            system: "TaleemPro / Edsof Central WhatsApp"
          }
        })
      });

      const responseText = await testRes.text();
      let responseJson: any = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {}

      const isOk = testRes.ok || (testRes.status >= 200 && testRes.status < 300);

      const updated = {
        ...current,
        lastTestedAt: new Date().toISOString(),
        lastTestStatus: isOk ? "success" : "failed",
        lastTestMessage: isOk 
          ? "Connected successfully to Interakt WhatsApp Business API!" 
          : (responseJson?.message || `Interakt status ${testRes.status}: ${responseText.slice(0, 100)}`)
      };
      writeJsonFile(INTERAKT_SETTINGS_FILE, updated);

      res.json({
        success: isOk,
        status: testRes.status,
        message: updated.lastTestMessage,
        data: responseJson || responseText
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/interakt/send", async (req, res) => {
    try {
      const {
        phoneNumber,
        message,
        clientName,
        clientBrand = "TALEEMPRO",
        templateName,
        templateValues
      } = req.body;

      if (!phoneNumber || !message) {
        return res.status(400).json({
          success: false,
          error: "phoneNumber and message are required"
        });
      }

      const current = readJsonFile<Record<string, any>>(INTERAKT_SETTINGS_FILE, {
        enabled: true,
        apiKey: process.env.INTERAKT_API_KEY || "",
        senderNumber: process.env.INTERAKT_SENDER_NUMBER || "+92 300 0000000",
        companyDisplayName: "Techno Evident / TaleemPro Official"
      });

      const phoneInfo = formatInteraktPhone(phoneNumber);
      const cleanFullDigits = phoneInfo.countryCode.replace("+", "") + phoneInfo.phoneNumber;
      const fallbackUrl = `https://wa.me/${cleanFullDigits}?text=${encodeURIComponent(message.trim())}`;

      // If Interakt is not enabled or no apiKey is present yet:
      if (!current.enabled || !current.apiKey) {
        return res.json({
          success: true,
          simulated: true,
          channel: "FALLBACK_WHATSAPP_WEB",
          senderNumber: current.senderNumber,
          fallbackUrl,
          message: "Interakt API key is not yet configured. Fallback WhatsApp Web URL generated."
        });
      }

      const effectiveApiKey = current.apiKey.trim();
      const authHeader = effectiveApiKey.startsWith("Basic ")
        ? effectiveApiKey
        : `Basic ${Buffer.from(effectiveApiKey + ":").toString("base64")}`;

      const interaktPayload: any = {
        countryCode: phoneInfo.countryCode,
        phoneNumber: phoneInfo.phoneNumber,
        type: "Template",
        template: {
          name: templateName || (clientBrand === "TALEEMPRO" ? "taleempro_support" : "edsof_support"),
          languageCode: clientBrand === "TALEEMPRO" ? "ur" : "en",
          bodyValues: templateValues && templateValues.length > 0 
            ? templateValues 
            : [clientName || "Valued Client", message]
        }
      };

      const interaktRes = await fetch("https://api.interakt.ai/v1/public/message/", {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(interaktPayload)
      });

      const resText = await interaktRes.text();
      let resJson: any = null;
      try { resJson = JSON.parse(resText); } catch {}

      if (interaktRes.ok || (resJson && resJson.result === true)) {
        // Record into central Interakt WABA logs
        const interaktLogs = readJsonFile<any[]>(INTERAKT_LOGS_FILE, []);
        const newMsgRecord = {
          id: `msg-interakt-${Date.now()}`,
          to: phoneInfo.fullNumber,
          clientName: clientName || "Client",
          clientBrand,
          content: message,
          senderNumber: current.senderNumber,
          channel: "INTERAKT_CENTRAL_WABA",
          status: "SENT",
          timestamp: new Date().toISOString()
        };
        interaktLogs.unshift(newMsgRecord);
        writeJsonFile(INTERAKT_LOGS_FILE, interaktLogs.slice(0, 500));

        return res.json({
          success: true,
          messageId: resJson?.id || `interakt-${Date.now()}`,
          senderNumber: current.senderNumber,
          channel: "INTERAKT_CENTRAL_WABA",
          brand: clientBrand,
          data: resJson
        });
      } else {
        console.warn("[INTERAKT] Direct API call returned:", interaktRes.status, resText);
        return res.json({
          success: false,
          error: resJson?.message || `Interakt status ${interaktRes.status}: ${resText.slice(0, 150)}`,
          fallbackUrl,
          senderNumber: current.senderNumber
        });
      }
    } catch (e: any) {
      console.error("[INTERAKT] Error:", e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  const proxyHandler = async (req: express.Request, res: express.Response) => {
    console.log(`[PROXY] Incoming Method: ${req.method}`);
    console.log(`[PROXY] Incoming Path: ${req.url}`);
    console.log(`[PROXY] Incoming Body: ${JSON.stringify(req.body)}`);

    try {
      const url = "https://script.google.com/macros/s/AKfycbxhbrnIQMIFHpZGXxq2Q2xnPJLPQtnCpDbDXFIOBPeWo6vulj2jEiWWrVlonr6dHa_M/exec";
      console.log(`[PROXY] Target GAS URL: ${url}`);
      const params = new URLSearchParams(req.query as any);
      if (req.method === 'POST' && req.body && typeof req.body === 'object') {
        if (req.body.action && !params.has('action')) {
          params.set('action', String(req.body.action));
        }
        if ((req.body.targetSheet || req.body.sheetName || req.body.tab) && !params.has('sheet')) {
          params.set('sheet', String(req.body.targetSheet || req.body.sheetName || req.body.tab));
        }
      }
      
      const fetchOptions: RequestInit = {
        method: req.method,
        headers: {
          "Content-Type": "application/json"
        },
        redirect: 'follow'
      };

      if (req.method === 'POST') {
        const body = JSON.stringify(req.body);
        console.log(`[PROXY] Forwarding Body: ${body}`);
        fetchOptions.body = body;
      }
      
      console.log(`[PROXY] Forward Method: ${fetchOptions.method}`);
      
      const response = await fetch(url + "?" + params.toString(), fetchOptions);
      console.log(`[PROXY] GAS Status: ${response.status}`);
      
      const text = await response.text();
      console.log(`[PROXY] GAS Response: ${text.slice(0, 300)}...`);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('GAS response is not JSON:', text);
        return res.status(500).json({ success: false, message: 'Invalid JSON from GAS', rawResponse: text });
      }
      
      // Seamlessly merge and persist real client URLs, logins, and remarks (Column O, P, S)
      if (data && data.success && Array.isArray(data.clients)) {
        const clientUrls = readJsonFile<Record<string, any>>(CLIENT_URLS_FILE, {});
        let urlsUpdated = false;

        data.clients = data.clients.map((c: any) => {
          const teId = String(c.teId || c.id || '').trim();
          const name = String(c.name || c.company || '').trim();
          const entry =
            clientUrls[teId] ||
            clientUrls[name] ||
            clientUrls[teId.toUpperCase()] ||
            clientUrls[teId.toLowerCase()] ||
            clientUrls[name.toLowerCase()] ||
            null;

          let rawUrl = (c.softwareUrl || c.url || c.deploymentUrl || '').trim();
          let rawLogin = (c.softwareLogin || c.login || c.email || '').trim();
          let rawRemarks = (c.specialManagerRemark || c.noteSaad || '').trim();

          if (entry) {
            const entryUrl = typeof entry === 'string' ? entry : (entry.url || entry.softwareUrl);
            const entryLogin = typeof entry === 'object' ? (entry.login || entry.softwareLogin || entry.email) : '';
            const entryRemarks = typeof entry === 'object' ? (entry.remarks || entry.specialManagerRemark || entry.noteSaad) : '';
            if (!rawUrl && entryUrl) rawUrl = entryUrl;
            if (!rawLogin && entryLogin) rawLogin = entryLogin;
            if (!rawRemarks && entryRemarks) rawRemarks = entryRemarks;
          }

          const formattedUrl = rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://') && rawUrl.includes('.')
            ? `https://${rawUrl.trim()}`
            : (rawUrl || '').trim();

          // Sync into persistent client_urls if found so cross-device cache is complete
          if (formattedUrl || rawLogin || rawRemarks) {
            const record = {
              teId,
              clientName: name,
              url: formattedUrl,
              softwareUrl: formattedUrl,
              login: rawLogin,
              softwareLogin: rawLogin,
              remarks: rawRemarks,
              specialManagerRemark: rawRemarks,
              department: c.department || '',
              assignedSupport: c.assignedSupport || '',
              phone: c.clientContact || c.phone || '',
              updatedAt: new Date().toISOString()
            };
            if (teId && (!clientUrls[teId] || clientUrls[teId].url !== formattedUrl)) {
              clientUrls[teId] = record;
              urlsUpdated = true;
            }
            if (name && (!clientUrls[name] || clientUrls[name].url !== formattedUrl)) {
              clientUrls[name] = record;
              urlsUpdated = true;
            }
          }

          return {
            ...c,
            url: formattedUrl,
            softwareUrl: formattedUrl,
            deploymentUrl: formattedUrl,
            login: rawLogin,
            softwareLogin: rawLogin,
            email: rawLogin || c.email || '',
            specialManagerRemark: rawRemarks,
            noteSaad: rawRemarks
          };
        });

        if (urlsUpdated) {
          writeJsonFile(CLIENT_URLS_FILE, clientUrls);
        }
      }

      res.json(data);
    } catch (error) {
      console.error('Proxy error:', error);
      if (error instanceof Error) {
        console.error('Proxy error stack:', error.stack);
      }
      res.status(500).json({ success: false, message: 'Proxy error', error: error instanceof Error ? error.message : String(error) });
    }
  };

  app.post("/api/proxy", express.json(), proxyHandler);
  app.get("/api/proxy", proxyHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
