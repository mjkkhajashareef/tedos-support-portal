# Google Apps Script Web App API Contract
## Version 1.0.0 (Foundation Certified)

This contract defines the strict integration guidelines and interface specifications between the **TEDOS Support Client App** (React Single Page Application) and the **TEDOS Backend Engine** (deployed as a Google Apps Script Web App using `doPost` and `doGet` entry points).

---

## 1. Request-Response Mechanics

All interactions run over HTTPS. Google Apps Script's execution environment maps incoming parameters to a single endpoint (`/exec` with web app deployment ID).

### 1.1 Authentication & Header Flow
Because standard HTTP headers are stripped or restricted during Google Apps Script redirects, authentication tokens are sent within the JSON payload envelope or via query parameters.

- **Request Authentication Parameter**: `authToken: "Bearer <SECURE_JWT_OR_HASH>"`
- **Request Metadata Envelope**: Every payload must contain an execution metadata header:
  ```json
  {
    "meta": {
      "clientVersion": "1.0.0",
      "environment": "production",
      "authToken": "Bearer tedos_sec_hash_08912x"
    },
    "action": "READ_CLIENTS",
    "payload": {}
  }
  ```

---

## 2. API JSON Payload Schemas

### 2.1 Unified Success Response Format (HTTP 200 OK)
Google Apps Script always redirects and returns an HTTP 200 wrapper containing the serialized response. The body itself must declare transaction status.

```json
{
  "success": true,
  "statusCode": 200,
  "timestamp": "2026-07-08T11:08:15.000Z",
  "data": {
    "records": [],
    "totalCount": 0
  },
  "error": null
}
```

### 2.2 Unified Error Response Format
When processing fails, the API returns a structured object matching this contract:

```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2026-07-08T11:08:15.000Z",
  "data": null,
  "error": {
    "code": "SCHEMA_MISMATCH",
    "message": "Column mapping for 'Backup_Status' is missing on targeted Spreadsheet.",
    "details": "Column expected at Index 8 but detected empty cell."
  }
}
```

### 2.3 Standarized Operational Status Codes
While the outer transport layer returns HTTP 200, the `statusCode` property inside the payload strictly defines the backend status:

| Inner Status | Name | Description |
| :--- | :--- | :--- |
| `200` | OK | Action completed successfully and synced to targeted Sheet. |
| `400` | Bad Request | Parameter validation failed (e.g. invalid phone format, empty body). |
| `401` | Unauthorized | Token expired, invalid signature, or insufficient RBAC permission. |
| `404` | Not Found | Target client ID, log entry, or checklist item could not be located. |
| `409` | Conflict | Simultaneous multi-user edit collision detected on targeted row cells. |
| `422` | Unprocessable | Schema mismatch or Google Sheet cell limits exceeded. |
| `500` | Internal Error | Apps Script execution failure (e.g. lock timeout, spreadsheet missing). |

---

## 3. Query Standards (Pagination, Search, Filtering)

### 3.1 Pagination Standard
For large dataset retrievals (e.g., historical audit logs), client requests must specify limit and cursor parameters:

```json
{
  "action": "READ_LOGS",
  "payload": {
    "page": 1,
    "limit": 50,
    "sortField": "timestamp",
    "sortOrder": "DESC"
  }
}
```

The response must provide cursor telemetry:
```json
"data": {
  "records": [...],
  "totalCount": 384,
  "page": 1,
  "limit": 50,
  "hasNextPage": true
}
```

### 3.2 Filtering & Structural Searching
All filtering parameters must be grouped logically under a `filters` object. Free-text search is matched server-side using case-insensitive substring operations on designated searchable columns.

```json
{
  "action": "READ_CLIENTS",
  "payload": {
    "searchQuery": "Apex Logistics",
    "filters": {
      "healthStatus": "Critical",
      "supportAssignee": "Sneha Patel"
    }
  }
}
```

---

## 4. Date, Time, and Temporal Rules

To prevent timezone distortion across clients, all datetime values must conform to these rules:

- **Transmission Format**: All dates transmitted in request or response envelopes must utilize the **ISO 8601 UTC** standard (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- **Sheet Writing Format**: The backend script parses the ISO string and writes it to Google Sheets utilizing standard numeric values format formatted as `yyyy-MM-dd HH:mm:ss` relative to the spreadsheet's native timezone.
- **Timezone Anchor**: The system-wide server timezone anchor is fixed at **Asia/Kolkata (IST)**.

---

## 5. Offline Sync & Collision Rules

Since TEDOS operates on a high-availability client caching engine, the following sync protocol prevents data loss.

### 5.1 Versioning & Optimistic Locking
Every record row in the sheet contains a hidden `version_hash` or `last_updated` column.
1. When fetching, the client caches the version token.
2. When submitting an update, the client passes the cached version identifier.
3. The Apps Script backend verifies if the sheet's current row version matches the incoming version payload.
   - **Match**: Update is applied, a new version token is generated and returned to the client.
   - **Mismatch**: The backend rejects the request with status `409 Conflict` and returns the actual record currently stored in the sheet. The client must prompt the operator to resolve or overwrite.

---

## 6. Execution Safeguards (Retries, Timeouts, Logs)

- **Execution Timeout**: Standard Google Apps Script executions terminate at 360 seconds. The client-side timeout in `appConfig` is set to **15,000ms** to fail fast and trigger the retry queue.
- **Server Lock System**: To prevent cell corruption during concurrent writes, the Apps Script backend must utilize `LockService.getScriptLock()` with a **5,000ms** acquisition timeout limit before applying write operations.
- **Transactional Rollback**: In batch requests, if writing to a row fails mid-execution, the script must restore the cached backup of affected rows, clean up transaction flags, and return a structured 500 error wrapper to prevent partial/corrupted writes.
- **Upload Restrictions**:
  - Image/File uploads (e.g. hardware support receipt snapshots) are serialized to Base64 in the client, sent via JSON payload, written as blobs into a dedicated **Google Drive Folder**, and the static file access URL is written back to the respective Google Sheet cell.
  - Maximum upload size is capped strictly at **5MB** to prevent Apps Script memory buffer crashes.
