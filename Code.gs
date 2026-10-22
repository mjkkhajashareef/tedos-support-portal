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

  var payload = {
    method: "GET",
    path: e.pathInfo ? "/" + e.pathInfo : "/",
    headers: e.headers || {},
    rawBody: "",
    query: e.parameter || {}
  };
  var response = Dispatcher.dispatch(payload);
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  Logger.log("doPost triggered");
  var rawBody = e.postData ? e.postData.contents : "";
  Logger.log("RawBody: " + rawBody);

  var parsedData = null;
  try {
    if (rawBody) parsedData = JSON.parse(rawBody);
  } catch (err) {
    Logger.log("JSON parse error: " + err.message);
  }

  // FAST-PATH 1: Ticket Raise & Form responses 1 Sync (Requirement #2)
  if (parsedData && (parsedData.action === "raiseTicket" || parsedData.action === "syncTicketResponse1" || parsedData.targetSheet === "Form responses 1")) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheetName = "Form responses 1";
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

      var ticketId = String(parsedData.id || parsedData.ticketId || "TKT-" + Date.now()).trim();
      var timestamp = new Date();
      var clientName = parsedData.clientName || "";
      var teId = parsedData.teId || "";
      var category = parsedData.issueCategory || "";
      var description = parsedData.issueDescription || parsedData.summary || "";
      var priority = parsedData.priority || "High";
      var status = parsedData.status || "In Progress";
      var raisedBy = parsedData.raisedFrom || parsedData.raisedBy || parsedData.createdBy || parsedData.supportName || "Support Team";
      var assignedTo = parsedData.assignedExecutive || parsedData.raisedTo || "COO";
      var attachment = parsedData.attachmentUrl || parsedData.proofLink || "";
      var resolution = parsedData.resolutionSummary || "";
      var updatedDate = parsedData.date || new Date().toISOString().split("T")[0];
      var response1 = parsedData.ultimateResponse1 || parsedData.response1 || ("[TICKET " + ticketId + "] " + clientName + " - " + category + " (" + status + ")");

      // Check if ticket already exists in sheet to update or append
      var values = sheet.getDataRange().getValues();
      var foundRow = -1;
      for (var r = 1; r < values.length; r++) {
        if (String(values[r][1] || "").trim() === ticketId) {
          foundRow = r + 1; // 1-indexed
          break;
        }
      }

      if (foundRow > 0) {
        // Update existing ticket row
        sheet.getRange(foundRow, 7).setValue(priority);
        sheet.getRange(foundRow, 8).setValue(status);
        if (resolution) sheet.getRange(foundRow, 12).setValue(resolution);
        sheet.getRange(foundRow, 13).setValue(updatedDate);
        sheet.getRange(foundRow, 14).setValue(response1);
      } else {
        // Append new ticket row
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
        message: "Ticket successfully synced to Form responses 1 sheet",
        ticketId: ticketId,
        sheet: sheetName
      })).setMimeType(ContentService.MimeType.JSON);
    } catch (tktErr) {
      Logger.log("Error writing to Form responses 1: " + tktErr.message);
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: tktErr.message
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // FAST-PATH 2: addWorkLog / updateWorkLogProof Fast Path
  if (parsedData && (parsedData.action === "addWorkLog" || parsedData.action === "updateWorkLogProof" || parsedData.action === "syncUltimateFollowUp")) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("Work Logs") || ss.getSheetByName("ultimate support control") || ss.getSheets()[0];
      
      // If updating proof link on existing row
      if (parsedData.action === "updateWorkLogProof" && parsedData.id) {
        var logId = String(parsedData.id).trim();
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
          var proofUrl = parsedData.proofLink || "";
          var mgrRemark = parsedData.managerRemark || "";
          if (proofUrl) sheet.getRange(matchedRow, 11).setValue(proofUrl);
          if (mgrRemark) sheet.getRange(matchedRow, 19).setValue(mgrRemark);
          return ContentService.createTextOutput(JSON.stringify({
            success: true,
            message: "Proof link updated in row " + matchedRow
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      // If addWorkLog
      if (parsedData.action === "addWorkLog") {
        var newRow = [
          parsedData.id || "LOG-" + Date.now(),
          parsedData.teId || "",
          parsedData.clientName || "",
          parsedData.date || new Date().toISOString().split("T")[0],
          parsedData.startTime || "",
          parsedData.endTime || "",
          parsedData.duration || "00:15:00",
          parsedData.issueCategory || "",
          parsedData.workType || "",
          parsedData.summary || "",
          parsedData.proofLink || "",
          parsedData.status || "Completed",
          parsedData.clientSatisfactionKpi || "Satisfied",
          parsedData.nextFollowUpDate || "",
          parsedData.supportName || ""
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

  // Standard Dispatcher fallback
  var payload = {
    method: "POST",
    path: e.pathInfo ? "/" + e.pathInfo : "/",
    headers: e.headers || {},
    rawBody: rawBody,
    query: e.parameter || {}
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
