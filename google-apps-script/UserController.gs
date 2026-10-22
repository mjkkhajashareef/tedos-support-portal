/**
 * @fileoverview User Management and Access Governance Controller.
 * Coordinates HTTP/REST requests for administrative and operator users.
 * @license Apache-2.0
 */

var UserController = {
  /**
   * Registers a new user account.
   */
  createUser: function(request) {
     return ControllerHelper.run(request, {
       expectedMethods: ["POST"],
       successMessage: "User account created successfully."
     }, function(body, userContext) {
       return UserService.createUser(body, userContext);
     });
  },

  /**
   * Batch creates multiple user accounts.
   */
  batchCreateUsers: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "Batch user accounts creation completed."
    }, function(body, userContext) {
      if (!body || !Array.isArray(body)) {
        throw new Error("Payload body must be a JSON array of users.");
      }
      var results = [];
      for (var i = 0; i < body.length; i++) {
        try {
          var usr = UserService.createUser(body[i], userContext);
          results.push({ index: i, success: true, user: usr });
        } catch (err) {
          results.push({ index: i, success: false, message: err.message });
        }
      }
      return results;
    });
  },

  /**
   * Retrieves all registered users.
   */
  getUsers: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET"],
      successMessage: "Users list retrieved successfully."
    }, function(body, userContext) {
      return UserService.getUsers();
    });
  },

  /**
   * Retrieves profile details of a single user.
   */
  getUserProfile: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["GET"],
      successMessage: "User profile details retrieved."
    }, function(body, userContext) {
      var userId = request.query ? request.query.id : null;
      return UserService.getUserProfile(userId);
    });
  },

  /**
   * Updates an existing user's generic details.
   */
  updateUser: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["PUT", "PATCH"],
      successMessage: "User profile updated successfully."
    }, function(body, userContext) {
      var userId = request.query ? request.query.id : null;
      if (!userId && body) userId = body.id;
      return UserService.updateUser(userId, body, userContext);
    });
  },

  /**
   * Updates an existing user's role designation.
   */
  updateUserRole: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "User security role updated."
    }, function(body, userContext) {
      if (!body) throw new Error("Body payload is required.");
      var userId = body.userId;
      var newRole = body.newRole;
      return UserService.updateUserRole(userId, newRole, userContext);
    });
  },

  /**
   * Administrative suspension/banning of an operator user.
   */
  banUser: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "User suspended and active sessions invalidated."
    }, function(body, userContext) {
      var userId = body ? body.userId : (request.query ? request.query.id : null);
      return UserService.banUser(userId, userContext);
    });
  },

  /**
   * Lifts an administrative ban on an operator user.
   */
  unbanUser: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["POST"],
      successMessage: "User account unsuspended."
    }, function(body, userContext) {
      var userId = body ? body.userId : (request.query ? request.query.id : null);
      return UserService.unbanUser(userId, userContext);
    });
  },

  /**
   * Permanently purges a user account.
   */
  deleteUser: function(request) {
    return ControllerHelper.run(request, {
      expectedMethods: ["DELETE"],
      successMessage: "User account deleted successfully."
    }, function(body, userContext) {
      var userId = request.query ? request.query.id : null;
      return UserService.deleteUser(userId, userContext);
    });
  }
};
