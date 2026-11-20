function doGet(e) {
  Logger.log("doGet triggered: " + JSON.stringify(e));
  var action = (e && e.parameter && e.parameter.action) || "";

  // 1. Direct fast-path for getClients from Google Sheet
  if (action === "getClients" || (e && e.parameter && !e.pathInfo && action === "")) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("ultimate support control") ||
                  ss.getSheetByName("Support Clients") ||
                  ss.getSheetByName("Clients") ||
                  ss.getSheets()[0];

      var values = sheet.getDataRange().getValues();
      var clients = [];

      for (var i = 1; i < values.length; i++) {
        var row = values[i];
        if (!row[0] && !row[1]) continue;

        clients.push({
          teId: String(row[0] || '').trim(),
          name: String(row[1] || '').trim(),
          clientContact: row[2] || '',
          operatorContact: row[3] || '',
          assignedSupport: row[4] || '',
          department: row[5] || '',
          plan: row[6] || '',
          status: row[7] || 'Active',
          url: String(row[14] || '').trim(),
          softwareUrl: String(row[14] || '').trim(),
          login: String(row[15] || '').trim(),
          softwareLogin: String(row[15] || '').trim(),
          remarks: String(row[18] || '').trim(),
          specialManagerRemark: String(row[18] || '').trim(),
          noteSaad: String(row[18] || '').trim(),
          satisfaction: String(row[19] || '').trim(),
          nextFollowUpDate: String(row[20] || '').trim(),
          executive: String(row[24] || '').trim()
        });
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        count: clients.length,
        clients: clients
      })).setMimeType(ContentService.MimeType.JSON);
    } catch (sheetErr) {
      Logger.log("Fast-path getClients error: " + sheetErr.message);
    }
  }

  // 2. Direct fast-path for getTickets from "Form responses 1"
  if (action === "getTickets" || action === "getFormResponses1") {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("Form responses 1") || ss.getSheetByName("Form Responses 1") || ss.getSheetByName("Tickets");
      if (sheet) {
        var values = sheet.getDataRange().getValues();
        var tickets = [];
        for (var t = 1; t < values.length; t++) {
          var row = values[t];
          if (!row[0] && !row[1]) continue;
          tickets.push({
            timestamp: row[0] ? new Date(row[0]).toISOString() : "",
            id: String(row[1] || "TKT-" + t).trim(),
            clientName: String(row[2] || "").trim(),
            teId: String(row[3] || "").trim(),
            issueCategory: String(row[4] || "").trim(),
            issueDescription: String(row[5] || "").trim(),
            priority: String(row[6] || "Medium").trim(),
            status: String(row[7] || "In Progress").trim(),
            raisedBy: String(row[8] || "").trim(),
            assignedExecutive: String(row[9] || "").trim(),
            attachmentUrl: String(row[10] || "").trim(),
            resolutionSummary: String(row[11] || "").trim(),
            updatedDate: String(row[12] || "").trim(),
            ultimateResponse1: String(row[13] || "").trim()
          });
        }
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          count: tickets.length,
          tickets: tickets
        })).setMimeType(ContentService.MimeType.JSON);
      }
    } catch (ticketErr) {
      Logger.log("Fast-path getTickets error: " + ticketErr.message);
    }
  }

  var resolvedPath = e && e.pathInfo
    ? "/" + e.pathInfo
    : ((e && e.parameter && e.parameter.path) ? String(e.parameter.path) : "/");

  var payload = {
    method: "GET",
    path: resolvedPath,
    headers: (e && e.headers) || {},
    rawBody: "",
    query: (e && e.parameter) || {}
  };
  var response = Dispatcher.dispatch(payload);
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  Logger.log("doPost triggered");
  var rawBody = e && e.postData ? e.postData.contents : "";
  Logger.log("RawBody: " + rawBody);

  var parsedData = null;
  try {
    if (rawBody) parsedData = JSON.parse(rawBody);
  } catch (err) {
    Logger.log("JSON parse error: " + err.message);
  }

  // Unwrap REST tunnel envelope if request came from AppsScriptHttpAdapter
  var tunneledMethod = null;
  var tunneledPath = null;
  var tunneledHeaders = null;
  var effectiveBody = parsedData;
  var effectiveRawBody = rawBody;
  if (parsedData && parsedData.path && parsedData.method && parsedData.body !== undefined) {
    tunneledMethod = String(parsedData.method).toUpperCase();
    tunneledPath = String(parsedData.path);
    tunneledHeaders = parsedData.headers || {};
    effectiveBody = typeof parsedData.body === "string" ? JSON.parse(parsedData.body || "{}") : parsedData.body;
    effectiveRawBody = typeof parsedData.body === "string" ? parsedData.body : JSON.stringify(parsedData.body || {});
  }

  var actionData = effectiveBody || parsedData;

  // FAST-PATH 1: Ticket Raise & Form responses 1 / Ticket Rase Sync
  if (actionData && (actionData.action === "raiseTicket" || actionData.action === "syncTicketResponse1" || actionData.targetSheet === "Form responses 1" || actionData.targetSheet === "Ticket Rase")) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheetName = actionData.targetSheet === "Ticket Rase"
        ? (ss.getSheetByName("Ticket Rase") ? "Ticket Rase" : "Form responses 1")
        : "Form responses 1";
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow([
          "Timestamp",
          "Ticket ID",
          "Client Name",
          "Client TE ID",
          "Issue Category",
          "Issue Description",
          "Priority",
          "Status",
          "Raised By",
          "Assigned To",
          "Attachment / Proof Link",
          "Resolution Summary",
          "Updated Date",
          "Ultimate Response 1"
        ]);
        sheet.setFrozenRows(1);
      }

      var ticketId = String(actionData.id || actionData.ticketId || "TKT-" + Date.now()).trim();
      var timestamp = new Date();
      var clientName = actionData.clientName || "";
      var teId = actionData.teId || "";
      var category = actionData.issueCategory || "";
      var description = actionData.issueDescription || actionData.summary || "";
      var priority = actionData.priority || "High";
      var status = actionData.status || "In Progress";
      var raisedBy = actionData.raisedFrom || actionData.raisedBy || actionData.createdBy || actionData.supportName || "Support Team";
      var assignedTo = actionData.assignedExecutive || actionData.raisedTo || "COO";
      var attachment = actionData.attachmentUrl || actionData.proofLink || "";
      var resolution = actionData.resolutionSummary || "";
      var updatedDate = actionData.date || new Date().toISOString().split("T")[0];
      var response1 = actionData.ultimateResponse1 || actionData.response1 || ("[TICKET " + ticketId + "] " + clientName + " - " + category + " (" + status + ")");

      var values = sheet.getDataRange().getValues();
      var foundRow = -1;
      for (var r = 1; r < values.length; r++) {
        if (String(values[r][1] || "").trim() === ticketId) {
          foundRow = r + 1;
          break;
        }
      }

      if (foundRow > 0) {
        sheet.getRange(foundRow, 7).setValue(priority);
        sheet.getRange(foundRow, 8).setValue(status);
        if (resolution) sheet.getRange(foundRow, 12).setValue(resolution);
        sheet.getRange(foundRow, 13).setValue(updatedDate);
        sheet.getRange(foundRow, 14).setValue(response1);
      } else {
        sheet.appendRow([
          timestamp,
          ticketId,
          clientName,
          teId,
          category,
          description,
          priority,
          status,
          raisedBy,
          assignedTo,
          attachment,
          resolution,
          updatedDate,
          response1
        ]);
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Ticket successfully synced to " + sheetName + " sheet",
        ticketId: ticketId,
        sheet: sheetName
      })).setMimeType(ContentService.MimeType.JSON);
    } catch (tktErr) {
      Logger.log("Error writing to Ticket sheet: " + tktErr.message);
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: tktErr.message
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // FAST-PATH 2: addWorkLog / updateWorkLogProof / syncUltimateFollowUp / syncShift
  if (actionData && (actionData.action === "addWorkLog" || actionData.action === "updateWorkLogProof" || actionData.action === "syncUltimateFollowUp" || actionData.action === "syncShift")) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("Work Logs") || ss.getSheetByName("ultimate support control") || ss.getSheets()[0];

      if (actionData.action === "updateWorkLogProof" && actionData.id) {
        var logId = String(actionData.id).trim();
        var dataRange = sheet.getDataRange();
        var vals = dataRange.getValues();
        var matchedRow = -1;
        for (var rowIdx = 1; rowIdx < vals.length; rowIdx++) {
          if (String(vals[rowIdx][0] || "").trim() === logId || String(vals[rowIdx][1] || "").trim() === logId) {
            matchedRow = rowIdx + 1;
            break;
          }
        }

        if (matchedRow > 0) {
          var proofUrl = actionData.proofLink || "";
          var mgrRemark = actionData.managerRemark || "";
          if (proofUrl) sheet.getRange(matchedRow, 11).setValue(proofUrl);
          if (mgrRemark) sheet.getRange(matchedRow, 19).setValue(mgrRemark);
          return ContentService.createTextOutput(JSON.stringify({
            success: true,
            message: "Proof link updated in row " + matchedRow
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      if (actionData.action === "syncUltimateFollowUp") {
        var fuSheet = ss.getSheetByName("Follow_Up_Tracker") || ss.getSheetByName("Follow Ups") || sheet;
        fuSheet.appendRow([
          actionData.id || "F-" + Date.now(),
          actionData.teId || "",
          actionData.clientName || "",
          actionData.nextFollowUpDate || actionData.date || "",
          actionData.startTime || "11:00",
          actionData.status || "Pending",
          actionData.summary || "",
          actionData.supportName || "",
          actionData.remarksClient || ""
        ]);
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: "Follow-up synchronized to sheet"
        })).setMimeType(ContentService.MimeType.JSON);
      }

      if (actionData.action === "syncShift") {
        var shiftSheet = ss.getSheetByName("Shift_Logs");
        if (!shiftSheet) {
          shiftSheet = ss.insertSheet("Shift_Logs");
          shiftSheet.appendRow(["Shift ID", "Employee ID", "Executive", "Date", "Start Time", "End Time", "Break Mins", "Status", "Notes"]);
          shiftSheet.setFrozenRows(1);
        }
        shiftSheet.appendRow([
          actionData.id || "SHF-" + Date.now(),
          actionData.employeeId || "",
          actionData.executiveName || "",
          actionData.date || "",
          actionData.shiftStartTime || "",
          actionData.shiftEndTime || "",
          actionData.breakMinutes || 0,
          actionData.status || "Active",
          actionData.notes || ""
        ]);
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: "Shift record synchronized to Shift_Logs sheet"
        })).setMimeType(ContentService.MimeType.JSON);
      }

      if (actionData.action === "addWorkLog") {
        var newRow = [
          actionData.id || "LOG-" + Date.now(),
          actionData.teId || "",
          actionData.clientName || "",
          actionData.date || new Date().toISOString().split("T")[0],
          actionData.startTime || "",
          actionData.endTime || "",
          actionData.duration || "00:15:00",
          actionData.issueCategory || "",
          actionData.workType || "",
          actionData.summary || "",
          actionData.proofLink || "",
          actionData.status || "Completed",
          actionData.clientSatisfactionKpi || "Satisfied",
          actionData.nextFollowUpDate || "",
          actionData.supportName || ""
        ];
        sheet.appendRow(newRow);
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: "Work log appended to sheet successfully"
        })).setMimeType(ContentService.MimeType.JSON);
      }
    } catch (wlErr) {
      Logger.log("Error in worklog fast-path: " + wlErr.message);
    }
  }

  // Standard Dispatcher fallback (supports unwrapped REST tunnel envelopes)
  var payload = {
    method: tunneledMethod || "POST",
    path: tunneledPath || ((e && e.pathInfo) ? "/" + e.pathInfo : "/"),
    headers: tunneledHeaders || (e && e.headers) || {},
    rawBody: effectiveRawBody,
    query: (e && e.parameter) || {}
  };
  try {
    var response = Dispatcher.dispatch(payload);
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log("Error in doPost: " + err.message);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
