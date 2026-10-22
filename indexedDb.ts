/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkLogEntry, FollowUpTracker, Ticket, SupportClient, User } from '../types';
import { Logger } from './helpers';

const DB_NAME = 'TEDOS_Offline_Store';
const DB_VERSION = 3;

const STORES = {
  WORK_LOGS: 'work_logs',
  FOLLOW_UPS: 'follow_ups',
  TICKETS: 'tickets',
  CLIENTS: 'clients',
  USERS: 'users',
};

/**
 * Initialise IndexedDB Database
 */
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      Logger.error('IndexedDB', 'IndexedDB is not supported in this browser.');
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      Logger.error('IndexedDB', 'Database failed to open', event);
      reject(new Error('Failed to open IndexedDB database'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store for Work Logs if it doesn't exist
      if (!db.objectStoreNames.contains(STORES.WORK_LOGS)) {
        db.createObjectStore(STORES.WORK_LOGS, { keyPath: 'id' });
        Logger.info('IndexedDB', `Created object store: ${STORES.WORK_LOGS}`);
      }

      // Create object store for Follow Ups if it doesn't exist
      if (!db.objectStoreNames.contains(STORES.FOLLOW_UPS)) {
        db.createObjectStore(STORES.FOLLOW_UPS, { keyPath: 'id' });
        Logger.info('IndexedDB', `Created object store: ${STORES.FOLLOW_UPS}`);
      }

      // Create object store for Tickets if it doesn't exist
      if (!db.objectStoreNames.contains(STORES.TICKETS)) {
        db.createObjectStore(STORES.TICKETS, { keyPath: 'id' });
        Logger.info('IndexedDB', `Created object store: ${STORES.TICKETS}`);
      }

      // Create object store for Clients if it doesn't exist
      if (!db.objectStoreNames.contains(STORES.CLIENTS)) {
        db.createObjectStore(STORES.CLIENTS, { keyPath: 'id' });
        Logger.info('IndexedDB', `Created object store: ${STORES.CLIENTS}`);
      }

      // Create object store for Users if it doesn't exist
      if (!db.objectStoreNames.contains(STORES.USERS)) {
        db.createObjectStore(STORES.USERS, { keyPath: 'id' });
        Logger.info('IndexedDB', `Created object store: ${STORES.USERS}`);
      }
    };
  });
}

/**
 * Generic IndexedDB operations
 */
async function dbPut<T>(storeName: string, item: T): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = (e) => {
      Logger.error('IndexedDB', `Error putting item into ${storeName}`, e);
      reject(e);
    };
  });
}

async function dbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = (e) => {
      Logger.error('IndexedDB', `Error getting all items from ${storeName}`, e);
      reject(e);
    };
  });
}

async function dbDelete(storeName: string, id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = (e) => {
      Logger.error('IndexedDB', `Error deleting item ${id} from ${storeName}`, e);
      reject(e);
    };
  });
}

async function dbClear(storeName: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = (e) => {
      Logger.error('IndexedDB', `Error clearing store ${storeName}`, e);
      reject(e);
    };
  });
}

export const offlineDb = {
  put: dbPut,
  getAll: dbGetAll,
  delete: dbDelete,
  clear: dbClear,

  // Dedicated helpers for Work Logs
  async saveWorkLog(log: WorkLogEntry): Promise<void> {
    return dbPut<WorkLogEntry>(STORES.WORK_LOGS, log);
  },

  async getWorkLogs(): Promise<WorkLogEntry[]> {
    return dbGetAll<WorkLogEntry>(STORES.WORK_LOGS);
  },

  async deleteWorkLog(id: string): Promise<void> {
    return dbDelete(STORES.WORK_LOGS, id);
  },

  async clearWorkLogs(): Promise<void> {
    return dbClear(STORES.WORK_LOGS);
  },

  // Dedicated helpers for Follow Ups
  async saveFollowUp(followUp: FollowUpTracker): Promise<void> {
    return dbPut<FollowUpTracker>(STORES.FOLLOW_UPS, followUp);
  },

  async getFollowUps(): Promise<FollowUpTracker[]> {
    return dbGetAll<FollowUpTracker>(STORES.FOLLOW_UPS);
  },

  async deleteFollowUp(id: string): Promise<void> {
    return dbDelete(STORES.FOLLOW_UPS, id);
  },

  async clearFollowUps(): Promise<void> {
    return dbClear(STORES.FOLLOW_UPS);
  },

  // Dedicated helpers for Tickets
  async saveTicket(ticket: Ticket): Promise<void> {
    return dbPut<Ticket>(STORES.TICKETS, ticket);
  },

  async getTickets(): Promise<Ticket[]> {
    return dbGetAll<Ticket>(STORES.TICKETS);
  },

  async deleteTicket(id: string): Promise<void> {
    return dbDelete(STORES.TICKETS, id);
  },

  async clearTickets(): Promise<void> {
    return dbClear(STORES.TICKETS);
  },

  // Dedicated helpers for Clients
  async saveClient(client: SupportClient): Promise<void> {
    return dbPut<SupportClient>(STORES.CLIENTS, client);
  },

  async getClients(): Promise<SupportClient[]> {
    return dbGetAll<SupportClient>(STORES.CLIENTS);
  },

  async deleteClient(id: string): Promise<void> {
    return dbDelete(STORES.CLIENTS, id);
  },

  async clearClients(): Promise<void> {
    return dbClear(STORES.CLIENTS);
  },

  // Dedicated helpers for Users
  async saveUser(user: User): Promise<void> {
    return dbPut<User>(STORES.USERS, user);
  },

  async getUsers(): Promise<User[]> {
    return dbGetAll<User>(STORES.USERS);
  },

  async deleteUser(id: string): Promise<void> {
    return dbDelete(STORES.USERS, id);
  },

  async clearUsers(): Promise<void> {
    return dbClear(STORES.USERS);
  },
};
