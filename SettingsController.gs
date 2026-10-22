/**
 * @fileoverview System Settings and Configuration Controller.
 * Coordinates HTTP/REST requests for feature flags and system configs.
 * @license Apache-2.0
 */

var SettingsController = {
  /**
   * Fetches a configuration property by key.
   */
  getSetting: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET"],
      successMessage: "Config setting retrieved."
    }, function(body, userContext) {
      var key = request.query ? request.query.key : null;
      if (!key) throw new Error("Setting 'key' is required.");
      var defaultValue = request.query ? request.query.defaultValue : undefined;
      return { key: key, value: SettingsService.getSetting(key, defaultValue) };
    });
  },

  /**
   * Updates or registers a system setting.
   */
  updateSetting: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST", "PUT"],
      successMessage: "System setting updated successfully."
    }, function(body, userContext) {
      if (!body) throw new Error("Body payload is required.");
      var key = body.key;
      var value = body.value;
      return SettingsService.updateSetting(key, value, userContext);
    });
  },

  /**
   * Retrieves all configuration keys grouped into a dictionary map.
   */
  getAllSettings: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET"],
      successMessage: "All settings dictionary compiled."
    }, function(body, userContext) {
      return SettingsService.getAllSettings();
    });
  },

  /**
   * Batch updates multiple settings.
   */
  batchUpdateSettings: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Batch settings update completed."
    }, function(body, userContext) {
      if (!body) throw new Error("Payload body is required.");
      
      var results = [];
      if (Array.isArray(body)) {
        for (var i = 0; i < body.length; i++) {
          try {
            var item = body[i];
            var updated = SettingsService.updateSetting(item.key, item.value, userContext);
            results.push({ key: item.key, success: true, setting: updated });
          } catch (err) {
            results.push({ key: body[i].key, success: false, message: err.message });
          }
        }
      } else if (typeof body === "object") {
        for (var k in body) {
          if (body.hasOwnProperty(k)) {
            try {
              var updatedObj = SettingsService.updateSetting(k, body[k], userContext);
              results.push({ key: k, success: true, setting: updatedObj });
            } catch (err) {
              results.push({ key: k, success: false, message: err.message });
            }
          }
        }
      } else {
        throw new Error("Payload must be a JSON array or a key-value dictionary object.");
      }
      return results;
    });
  }
};
