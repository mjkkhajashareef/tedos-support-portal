/**
 * @fileoverview Settings Repository Layer.
 * Governs configuration settings read/write operations from Google Sheets.
 * @license Apache-2.0
 */

var SettingsRepository = new SystemRepository(
  "SETTINGS",
  CONFIG.SHEET_NAMES.SETTINGS,
  "key",
  [
    { field: 'key', headerName: 'Config Key', columnIndex: 0, dataType: 'string' },
    { field: 'value', headerName: 'Config Value', columnIndex: 1, dataType: 'string' },
    { field: 'description', headerName: 'Config Description', columnIndex: 2, dataType: 'string' },
    { field: 'updatedBy', headerName: 'Last Updated By', columnIndex: 3, dataType: 'string' },
    { field: 'updatedAt', headerName: 'Updated Timestamp', columnIndex: 4, dataType: 'string' }
  ],
  "SETTINGS"
);

/**
 * Convenience helper to read a setting's value directly.
 * 
 * @param {string} key - Setting key
 * @param {string} [defaultValue=""] - Fallback if key missing
 * @return {string} Configured value
 */
SettingsRepository.getSettingValue = function(key, defaultValue) {
  var record = this.find(key);
  if (record && record.value !== null && record.value !== undefined) {
    return record.value;
  }
  return defaultValue !== undefined ? defaultValue : "";
};

/**
 * Convenience helper to set or insert a setting value.
 * 
 * @param {string} key - Target configuration key
 * @param {string} value - Value to register
 * @param {string} [updatedBy="SYSTEM"] - Modifier user or system descriptor
 */
SettingsRepository.setSettingValue = function(key, value, updatedBy) {
  var record = this.find(key);
  var updates = {
    key: key,
    value: value,
    updatedBy: updatedBy || "SYSTEM",
    updatedAt: new Date().toISOString()
  };

  if (record) {
    this.update(key, updates);
  } else {
    updates.description = "System configured parameter.";
    this.insert(updates);
  }

  LoggerService.info("Config key '" + key + "' set to value: " + value);
};
