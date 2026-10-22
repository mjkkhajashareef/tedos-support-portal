# Google Sheets Architecture & Mapping Rules
## Version 1.0.0 (Foundation Certified)

This document defines the storage layers, tab structures, schemas, and dynamic sync patterns used by the **TEDOS Support Digital Operating System**. It establishes the rules governing database transactional integrity.

---

## 1. Core Architectural Mandate

> [!CAUTION]
> **DIRECT MANIPULATION OF THE GOOGLE SPREADSHEET VIA THIRD-PARTY CLIENT WRITERS IS STRICTLY FORBIDDEN.**

All Create, Read, Update, and Delete (CRUD) operations must pass through the authorized Google Apps Script API gateway. The spreadsheet functions solely as an append-only transaction ledger and query-optimized view repository.

---

## 2. Spreadsheet Database Schema Map

The workbook consists of seven fixed-schema tables. Column order must match these matrices exactly.

### 2.1 Tab: `Client_Workspaces_Telemetry`
Tracks client store setups, software versions, license periods, and live support statuses.

| Col Index | Field / Header Name | Data Type | Validation Rules / Key Bounds |
| :--- | :--- | :--- | :--- |
| **A (1)** | `id` | String | Unique UUID prefixed with `client_` |
| **B (2)** | `company` | String | Min 2, Max 100 characters |
| **C (3)** | `name` | String | Store manager name |
| **D (4)** | `phone` | String | E.164 phone number format |
| **E (5)** | `version` | String | POS software version (e.g. `v4.2`) |
| **F (6)** | `health` | Number | Integer between 0 and 100 |
| **G (7)** | `backup_status` | String | `Success` \| `Failed` \| `Overdue` |
| **H (8)** | `license_expiry` | Date | ISO Date format (`YYYY-MM-DD`) |
| **I (9)** | `license_status`| String | `Active` \| `Expiring` \| `Expired` |
| **J (10)**| `last_updated` | DateTime | ISO Timestamp of last sync |

### 2.2 Tab: `Daily_Work_Logs`
Stores the daily audit record of support actions taken by executives.

| Col Index | Field / Header Name | Data Type | Validation Rules / Key Bounds |
| :--- | :--- | :--- | :--- |
| **A (1)** | `id` | String | Prefix `log_` |
| **B (2)** | `executive` | String | Logging operator email |
| **C (3)** | `client_id` | String | Matches `Client_Workspaces_Telemetry.id` |
| **D (4)** | `action_taken` | String | Support diary details (Max 2000 chars) |
| **E (5)** | `timestamp` | DateTime | ISO Timestamp |

### 2.3 Tab: `Follow_Up_Tracker`
Schedules automated or manual callbacks to retail store managers.

| Col Index | Field / Header Name | Data Type | Validation Rules / Key Bounds |
| :--- | :--- | :--- | :--- |
| **A (1)** | `id` | String | Prefix `follow_` |
| **B (2)** | `client_id` | String | Matches `Client_Workspaces_Telemetry.id` |
| **C (3)** | `reason` | String | Description of task objective |
| **D (4)** | `priority` | String | `High` \| `Medium` \| `Low` |
| **E (5)** | `scheduled_date`| DateTime | Target callback time |
| **F (6)** | `status` | String | `Scheduled` \| `Completed` \| `Overdue` |

---

## 3. Core Database Operations

```text
  ┌──────────────────────┐
  │  React Client (App)  │
  └──────────┬───────────┘
             │ (JSON Request Envelope)
             ▼
  ┌──────────────────────┐
  │  Apps Script Engine  │
  └──────────┬───────────┘
             │ (Script Lock & Transactions)
             ▼
  ┌──────────────────────┐
  │  Google Sheets DB    │
  └──────────────────────┘
```

### 3.1 Create (Append Row)
- New rows are always appended to the first empty row from the top of the worksheet to avoid fragmented blank intervals.
- The Apps Script engine validates that the incoming primary key (`id`) is completely unique before writing.

### 3.2 Read (Index Retrieval)
- Reads load structural database ranges into JSON object arrays using column header keys as object property names.
- Headers are converted from Snake Case (`backup_status`) into Camel Case (`backupStatus`) during client serialization.

### 3.3 Update & Batch Processing
- To save cellular bandwidth on mobile support terminals, batch updates are processed using target range arrays:
  ```json
  {
    "action": "BATCH_UPDATE",
    "payload": {
      "tabName": "Client_Workspaces_Telemetry",
      "updates": [
        { "id": "client_8f21a", "row": 14, "data": { "health": 92 } },
        { "id": "client_9a01e", "row": 22, "data": { "health": 48 } }
      ]
    }
  }
  ```
- Batch transactions must commit atomically. If any row modification in a batch triggers an out-of-bounds validation, the script halts and rollbacks all previously written rows in that batch.

---

## 4. Integrity and Safeguards

### 4.1 Script Lock System
To block overwrite collisions during simultaneous writes by multiple executives, every write operation must acquire an exclusive write lock:

```javascript
var lock = LockService.getScriptLock();
try {
  lock.waitLock(5000); // Wait up to 5s for lock acquisition
  // Execute transactional append / edit
} finally {
  lock.releaseLock();
}
```

### 4.2 Data Caching
The client app utilizes local memory buffering to optimize network requests:
- **Telemetry Records**: Cached for **30 seconds** in development, **5 minutes** in staging, and **30 minutes** in production unless forced to reload.
- **Static Assets**: Theme config, localized structures, and configurations are loaded strictly once on startup.
