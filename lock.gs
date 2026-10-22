/**
 * @fileoverview Concurrency Lock Manager wrapper over Google Apps Script LockService.
 * Controls atomic transactional safety during sheet updates and concurrent writes.
 * @license Apache-2.0
 */

var LockManager = {
  /**
   * Retrieves the script-level exclusive write lock.
   * Scoped globally to prevent any other concurrent script instance from mutating sheets.
   * 
   * @private
   */
  getLock: function() {
    try {
      return LockService.getScriptLock();
    } catch (e) {
      LoggerService.error("LockService is unavailable in the current context.", e);
      return null;
    }
  },

  /**
   * Executes a business action wrapped in an exclusive execution block.
   * Handles auto-release securely via try-finally.
   * 
   * @param {function} criticalActionFunction - No-args function wrapping the database write operation
   * @param {number} [timeoutMs] - Maximum lock acquire wait window (Default is CONFIG.LOCK_TIMEOUT_MS)
   * @return {*} The returned result of the criticalActionFunction
   * @throws {Error} If lock acquisition times out or the internal action throws an exception
   */
  executeAtomic: function(criticalActionFunction, timeoutMs) {
    var lock = this.getLock();
    var waitMs = timeoutMs || CONFIG.LOCK_TIMEOUT_MS;
    
    if (!lock) {
      // If lock service is unavailable, execute anyway but warn
      LoggerService.warn("LockService unavailable. Executing transaction without concurrency protection.");
      return criticalActionFunction();
    }

    var lockAcor = false;
    try {
      lockAcor = lock.tryLock(waitMs);
      if (!lockAcor) {
        var timeoutErr = new Error("Failed to acquire database lock within " + waitMs + "ms. Server is highly concurrent.");
        timeoutErr.code = CONSTANTS.ERROR_CODES.SRV_LOCK_TIMEOUT;
        throw timeoutErr;
      }

      LoggerService.info("Exclusive lock ACQUIRED for write transaction.");
      return criticalActionFunction();

    } finally {
      if (lock && lockAcor) {
        try {
          lock.releaseLock();
          LoggerService.info("Exclusive lock RELEASED.");
        } catch (releaseErr) {
          LoggerService.error("Error releasing script lock", releaseErr);
        }
      }
    }
  }
};
