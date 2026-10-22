/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ColumnMapping {
  field: string;
  columnLetter: string; // e.g. 'A', 'B', 'C'
  headerName: string; // e.g. 'Log ID', 'Date'
}

export interface SheetMappingConfig {
  sheetName: string;
  columns: ColumnMapping[];
}

/**
 * Global spreadsheet column mapping configuration.
 * Moving mapping configuration into a dedicated declarative layer prevents hardcoding
 * and ensures perfect alignment with Google Sheet schemas when migrating to integration phase.
 */
export const SHEETS_MAPPING_CONFIG: Record<string, SheetMappingConfig> = {
  DAILY_WORK_LOGS: {
    sheetName: 'Daily_Work_Logs',
    columns: [
      { field: 'id', columnLetter: 'A', headerName: 'ID' },
      { field: 'date', columnLetter: 'B', headerName: 'Date' },
      { field: 'time', columnLetter: 'C', headerName: 'Time' },
      { field: 'executiveName', columnLetter: 'D', headerName: 'ExecName' },
      { field: 'teId', columnLetter: 'E', headerName: 'TEID' },
      { field: 'clientName', columnLetter: 'F', headerName: 'Client' },
      { field: 'category', columnLetter: 'G', headerName: 'WorkType' },
      { field: 'status', columnLetter: 'H', headerName: 'Status' },
      { field: 'details', columnLetter: 'I', headerName: 'Summary' },
      { field: 'nextFollowUpDate', columnLetter: 'J', headerName: 'NextDate' },
      { field: 'priority', columnLetter: 'K', headerName: 'Priority' },
      { field: 'durationMinutes', columnLetter: 'L', headerName: 'Mins' },
      { field: 'remarks', columnLetter: 'M', headerName: 'Remarks' },
      { field: 'syncStatus', columnLetter: 'N', headerName: 'Sync' },
    ],
  },
  FOLLOW_UP_TRACKER: {
    sheetName: 'Follow_Up_Tracker',
    columns: [
      { field: 'id', columnLetter: 'A', headerName: 'ID' },
      { field: 'teId', columnLetter: 'B', headerName: 'TEID' },
      { field: 'clientName', columnLetter: 'C', headerName: 'ClientName' },
      { field: 'clientId', columnLetter: 'D', headerName: 'ClientID' },
      { field: 'executiveName', columnLetter: 'E', headerName: 'AssignedExecutive' },
      { field: 'scheduledDate', columnLetter: 'F', headerName: 'DueDate' },
      { field: 'scheduledTime', columnLetter: 'G', headerName: 'DueTime' },
      { field: 'priority', columnLetter: 'H', headerName: 'Priority' },
      { field: 'lastContactDate', columnLetter: 'I', headerName: 'LastContactDate' },
      { field: 'status', columnLetter: 'J', headerName: 'CurrentStatus' },
      { field: 'reason', columnLetter: 'K', headerName: 'Purpose' },
      { field: 'remarks', columnLetter: 'L', headerName: 'Remarks' },
      { field: 'nextAction', columnLetter: 'M', headerName: 'NextAction' },
      { field: 'syncStatus', columnLetter: 'N', headerName: 'Sync' },
    ],
  },
};

/**
 * Utility helper to convert a record of data into an array of values based on the mapping config,
 * ready to be pushed directly as a row in Google Sheets API.
 */
export function mapRecordToRow<T extends Record<string, any>>(configKey: string, data: T): any[] {
  const mapping = SHEETS_MAPPING_CONFIG[configKey];
  if (!mapping) return [];
  
  // Sort columns by column letter index (A=0, B=1, etc)
  const sortedColumns = [...mapping.columns].sort((a, b) => {
    return a.columnLetter.localeCompare(b.columnLetter);
  });

  return sortedColumns.map(col => {
    const val = data[col.field];
    return val !== undefined ? val : '';
  });
}
