/**
 * @fileoverview Schema Validator Engine for input validation on all write operations.
 * @license Apache-2.0
 */

var Validator = {
  /**
   * Defined schemas corresponding to the validation contracts of sheetsContract.ts
   */
  SCHEMAS: {
    CLIENT: {
      id: { required: true, pattern: /^CLT-\d{3,6}$/ },
      name: { required: true, min: 2, max: 100 },
      company: { required: true, min: 2, max: 100 },
      phone: { required: true, pattern: /^\+?[0-9\s-]{10,15}$/ },
      email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      status: { required: true, enum: ["Critical", "Warning", "Active", "Inactive"] },
      healthStatus: { required: true, min: 0, max: 100 }
    },

    TICKET: {
      id: { required: true, pattern: /^TKT-\d{4}-\d{3,6}$/ },
      clientId: { required: true, pattern: /^CLT-\d{3,6}$/ },
      clientName: { required: true },
      issueCategory: { required: true, min: 2, max: 80 },
      issueDescription: { required: true, min: 5, max: 2000 },
      priority: { required: true, enum: ["Low", "Medium", "High", "Critical"] },
      status: { required: true, enum: ["New", "Assigned", "In Progress", "Waiting for Client", "Rescheduled", "Escalated", "Resolved", "Closed"] }
    },

    WORK_LOG: {
      id: { required: true },
      clientId: { required: true, pattern: /^CLT-\d{3,6}$/ },
      clientName: { required: true },
      date: { required: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
      durationMinutes: { required: true, min: 1, max: 1440 },
      category: { required: true },
      details: { required: true, min: 3, max: 5000 }
    },

    FOLLOW_UP: {
      id: { required: true },
      clientId: { required: true, pattern: /^CLT-\d{3,6}$/ },
      clientName: { required: true },
      scheduledDate: { required: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
      scheduledTime: { required: true, pattern: /^\d{2}:\d{2}$/ },
      status: { required: true, enum: ["Pending", "Completed", "Rescheduled", "Escalated", "Cancelled"] }
    },

    NOTIFICATION: {
      id: { required: true },
      title: { required: true, min: 1, max: 200 },
      message: { required: true, min: 1, max: 2000 },
      timestamp: { required: true },
      read: { required: true },
      type: { required: true, enum: ["info", "warning", "success", "error"] }
    },

    USER: {
      id: { required: true },
      name: { required: true, min: 2, max: 80 },
      email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      role: { required: true, enum: ["CEO", "Support Manager", "Technical Executive", "AI Administrator"] }
    },

    TRAINING: {
      id: { required: true },
      topic: { required: true, min: 2, max: 150 },
      date: { required: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
      durationMinutes: { required: true, min: 5, max: 600 },
      attendeesCount: { required: true, min: 1, max: 200 },
      conductedBy: { required: true }
    },

    SETTINGS: {
      key: { required: true, pattern: /^[A-Z_][A-Z0-9_]*$/ },
      value: { required: true },
      description: { required: true }
    }
  },

  /**
   * Validates a data object against a schema definition.
   * 
   * @param {string} schemaKey - The key corresponding to Validator.SCHEMAS
   * @param {Object} data - The payload to check
   * @return {{isValid: boolean, errors: Array<string>}} The validation result
   */
  validate: function(schemaKey, data) {
    var schema = this.SCHEMAS[schemaKey];
    if (!schema) {
      return {
        isValid: false,
        errors: ["Validation schema '" + schemaKey + "' not found."]
      };
    }

    var errors = [];

    for (var field in schema) {
      if (schema.hasOwnProperty(field)) {
        var rule = schema[field];
        var val = data[field];

        // 1. Required Check
        if (rule.required && (val === undefined || val === null || val === "")) {
          errors.push("Field '" + field + "' is required.");
          continue;
        }

        // If field is not present and not required, pass
        if (val === undefined || val === null || val === "") {
          continue;
        }

        // 2. Pattern (Regex) Check
        if (rule.pattern && !rule.pattern.test(String(val))) {
          errors.push("Field '" + field + "' with value '" + val + "' violates required pattern.");
        }

        // 3. Min Check
        if (rule.min !== undefined) {
          if (typeof val === "number" && val < rule.min) {
            errors.push("Field '" + field + "' is below minimum value of " + rule.min + ".");
          } else if (typeof val === "string" && val.length < rule.min) {
            errors.push("Field '" + field + "' length is below minimum of " + rule.min + " characters.");
          }
        }

        // 4. Max Check
        if (rule.max !== undefined) {
          if (typeof val === "number" && val > rule.max) {
            errors.push("Field '" + field + "' is above maximum value of " + rule.max + ".");
          } else if (typeof val === "string" && val.length > rule.max) {
            errors.push("Field '" + field + "' length exceeds maximum of " + rule.max + " characters.");
          }
        }

        // 5. Enum Check
        if (rule.enum && rule.enum.indexOf(String(val)) === -1) {
          errors.push("Field '" + field + "' with value '" + val + "' is not a member of permitted enum: [" + rule.enum.join(", ") + "].");
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
};
