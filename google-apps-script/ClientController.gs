/**
 * @fileoverview Client Controller Layer.
 * Coordinates HTTP/REST requests for clients to the ClientService.
 * @license Apache-2.0
 */

var ClientController = {
  /**
   * Retrieves all clients.
   */
  getClients: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET"],
      successMessage: "Clients list retrieved successfully."
    }, function(body, userContext) {
      return ClientService.getClients();
    });
  },

  /**
   * Retrieves a single client profile.
   */
  getClient: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET"],
      successMessage: "Client retrieved successfully."
    }, function(body, userContext) {
      var id = request.query ? request.query.id : null;
      return ClientService.getClient(id);
    });
  },

  /**
   * Registers a new client.
   */
  createClient: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Client created successfully."
    }, function(body, userContext) {
      return ClientService.createClient(body, userContext);
    });
  },

  /**
   * Performs batch creations for clients.
   */
  batchCreateClients: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Batch clients registration completed."
    }, function(body, userContext) {
      if (!body || !Array.isArray(body)) {
        throw new Error("Batch payload must be a JSON array of clients.");
      }
      var results = [];
      for (var i = 0; i < body.length; i++) {
        try {
          var client = ClientService.createClient(body[i], userContext);
          results.push({ index: i, success: true, client: client });
        } catch (err) {
          results.push({ index: i, success: false, message: err.message });
        }
      }
      return results;
    });
  },

  /**
   * Updates an existing client profile.
   */
  updateClient: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["PUT", "PATCH"],
      successMessage: "Client updated successfully."
    }, function(body, userContext) {
      var id = request.query ? request.query.id : null;
      if (!id && body) id = body.id;
      return ClientService.updateClient(id, body, userContext);
    });
  },

  /**
   * Deletes a client profile.
   */
  deleteClient: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["DELETE"],
      successMessage: "Client deleted successfully."
    }, function(body, userContext) {
      var id = request.query ? request.query.id : null;
      return ClientService.deleteClient(id, userContext);
    });
  },

  /**
   * Activates a client status.
   */
  activateClient: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Client activated successfully."
    }, function(body, userContext) {
      var id = body ? body.clientId : (request.query ? request.query.id : null);
      return ClientService.activate(id, userContext);
    });
  },

  /**
   * Suspends a client status.
   */
  suspendClient: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Client suspended successfully."
    }, function(body, userContext) {
      var id = body ? body.clientId : (request.query ? request.query.id : null);
      var reason = body ? body.reason : "No reason provided.";
      return ClientService.suspend(id, reason, userContext);
    });
  },

  /**
   * Renews a client license.
   */
  renewLicense: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Client license renewed successfully."
    }, function(body, userContext) {
      if (!body) throw new Error("Renewal payload body is required.");
      var id = body.clientId;
      var newExpiryDate = body.newExpiryDate;
      var licenseType = body.licenseType;
      return ClientService.renewLicense(id, newExpiryDate, licenseType, userContext);
    });
  },

  /**
   * Evaluates software usage metrics.
   */
  analyzeUsage: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET", "POST"],
      successMessage: "Software usage analyzed successfully."
    }, function(body, userContext) {
      var id = request.query ? request.query.id : (body ? body.clientId : null);
      return ClientService.analyzeSoftwareUsage(id);
    });
  },

  /**
   * Force recalculates client health status.
   */
  recalculateHealth: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Client health score recalculated."
    }, function(body, userContext) {
      var id = body ? body.clientId : (request.query ? request.query.id : null);
      var score = ClientService.recalculateHealthScore(id);
      return { clientId: id, healthStatus: score };
    });
  }
};
