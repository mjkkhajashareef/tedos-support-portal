/**
 * @fileoverview User Repository Layer.
 * Governs all database transactions for organizational Users.
 * @license Apache-2.0
 */

var UserRepository = new SystemRepository(
  "USER",
  CONFIG.SHEET_NAMES.USERS,
  "id",
  [
    { field: 'id', headerName: 'User/Executive ID', columnIndex: 0, dataType: 'string' },
    { field: 'name', headerName: 'Full Name', columnIndex: 1, dataType: 'string' },
    { field: 'email', headerName: 'Organizational Email', columnIndex: 2, dataType: 'string' },
    { field: 'role', headerName: 'Assigned Role', columnIndex: 3, dataType: 'string' },
    { field: 'avatarUrl', headerName: 'Avatar Profile URL', columnIndex: 4, dataType: 'string' }
  ],
  "USER"
);

/**
 * Finds user details specifically by organizational email.
 * 
 * @param {string} email
 * @return {Object|null} Matching user details or null
 */
UserRepository.findByEmail = function(email) {
  if (!email) return null;
  var cleanEmail = String(email).toLowerCase().trim();
  var records = this.findAll(true); // Include archived just in case

  for (var i = 0; i < records.length; i++) {
    var u = records[i];
    if (u.email && u.email.toLowerCase().trim() === cleanEmail) {
      return u;
    }
  }
  return null;
};

/**
 * Filters users by assigned Role.
 * 
 * @param {string} role - Standard UserRole enum
 * @return {Array<Object>} Matches list
 */
UserRepository.findByRole = function(role) {
  return this.findWhere({ role: role });
};
