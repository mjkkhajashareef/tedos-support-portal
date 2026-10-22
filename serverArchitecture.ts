/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SupportClient, Ticket, WorkLogEntry, FollowUpTracker, AppNotification, UserRole } from '../types';
import { RecordState, SyncMode, ConflictResolutionStrategy, FieldMapping } from './sheetsContract';
import { ApiVersion, ApiResponse, SecurityContext } from '../utils/apiGateway';

/**
 * ============================================================================
 * PHASE 6: GOOGLE APPS SCRIPT ENTERPRISE SERVER ARCHITECTURE BLUEPRINT
 * ============================================================================
 * 
 * This module acts as the authoritative architecture contract for the future
 * Google Apps Script (GAS) deployment. It defines the interfaces, patterns, and
 * structures that form the secure server-side boundary, separating the client
 * completely from direct spreadsheet access.
 * 
 * Flow: TEDOS Client -> API Service -> Apps Script Adapter -> Apps Script Server
 *       -> Middleware -> Controller -> Service -> Repository -> Google Sheets
 */

/**
 * 1. CONFIGURATION SPECIFICATIONS
 * Authorized Sheet IDs, Environment Variables, limits, and roles.
 */
export interface GasServerConfig {
  spreadsheetId: string;
  environment: 'Development' | 'Testing' | 'Production';
  executionTimeCeilingMs: number; // GAS limit is 360,000ms (6 minutes)
  rateLimitRequestsPerMin: number;
  cacheExpirationSeconds: number; // GAS CacheService limit is 21,600s (6 hours)
  supportedVersions: ApiVersion[];
  mandatoryApiKey: string;
}

/**
 * 2. SECURITY ARCHITECTURE CONTRACT
 * Signature verification, token placeholder matching, and session verification.
 */
export interface IGasSecurityManager {
  validateApiKey(apiKey: string): boolean;
  verifyPayloadSignature(payload: string, signature: string, secret: string): boolean;
  validateSession(sessionId: string): boolean;
  authorizeRole(userRole: UserRole, requiredRoles: UserRole[]): boolean;
  generateFutureJwt(userId: string, role: UserRole): string;
}

/**
 * 3. MIDDLEWARE LAYER
 * Chains requests sequentially to validate context, trace actions, and protect boundaries.
 */
export interface GasMiddlewareContext {
  requestPath: string;
  requestMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  securityContext: SecurityContext;
  clientIp?: string;
  processedAt: string;
}

export interface IGasMiddlewareChain {
  verifyVersion(ctx: GasMiddlewareContext): void;
  authenticate(ctx: GasMiddlewareContext): void;
  authorize(ctx: GasMiddlewareContext, requiredRoles: UserRole[]): void;
  validatePayload<T>(ctx: GasMiddlewareContext, payload: T): void;
  rateLimit(ctx: GasMiddlewareContext): void;
  auditTrail(ctx: GasMiddlewareContext, actionNotes: string): void;
  globalErrorHandler(error: Error): ApiResponse;
}

/**
 * 4. REPOSITORY LAYER (The ONLY layer permitted to touch Sheets)
 * Abstraction layer to map entities directly to row operations.
 */
export interface IGasRepository<T extends { id: string | number }> {
  getSheetName(): string;
  getPrimaryKey(): string;
  find(id: string | number): T | null;
  findAll(): T[];
  insert(record: T): T;
  update(id: string | number, record: Partial<T>): T;
  delete(id: string | number): boolean;
  
  // Transaction/Lock support
  acquireTransactionLock(timeoutMs: number): boolean;
  releaseTransactionLock(): void;
}

export interface IGasClientRepository extends IGasRepository<SupportClient> {}
export interface IGasTicketRepository extends IGasRepository<Ticket> {
  findByClient(clientId: string): Ticket[];
  findByStatus(status: Ticket['status']): Ticket[];
}
export interface IGasWorkLogRepository extends IGasRepository<WorkLogEntry> {
  findByTicket(ticketId: string): WorkLogEntry[];
}
export interface IGasFollowUpRepository extends IGasRepository<FollowUpTracker> {
  findPending(): FollowUpTracker[];
}
export interface IGasNotificationRepository extends IGasRepository<AppNotification> {}
export interface IGasTrainingRepository extends IGasRepository<{ id: string; topic: string }> {}
export interface IGasAuditRepository extends IGasRepository<{ id: string; type: string }> {}
export interface IGasSettingsRepository extends IGasRepository<{ id: string; key: string; value: string }> {}

/**
 * 5. SERVICES LAYER
 * Implements core domain operations, validation sequencing, cache checks, and lock control.
 */
export interface IGasClientService {
  getClients(security: SecurityContext): SupportClient[];
  registerClient(client: SupportClient, security: SecurityContext): SupportClient;
}

export interface IGasTicketService {
  getTickets(security: SecurityContext): Ticket[];
  createTicket(ticket: Ticket, security: SecurityContext): Ticket;
  updateTicket(id: string, updates: Partial<Ticket>, security: SecurityContext): Ticket;
}

export interface IGasWorkLogService {
  logWork(entry: WorkLogEntry, security: SecurityContext): WorkLogEntry;
  getLogsByTicket(ticketId: string): WorkLogEntry[];
}

export interface IGasFollowUpService {
  schedule(followUp: FollowUpTracker, security: SecurityContext): FollowUpTracker;
  reassign(followUpId: string, executiveId: string): FollowUpTracker;
}

export interface IGasNotificationService {
  dispatchSystemNotification(title: string, message: string, type: string): AppNotification;
  getUserNotifications(userId: string): AppNotification[];
}

export interface IGasSyncService {
  reconcileBatch(entity: string, records: any[], mode: SyncMode, conflict: ConflictResolutionStrategy): {
    synced: number;
    conflicted: any[];
    failed: string[];
  };
}

export interface IGasValidationService {
  validate<T>(entityName: string, data: T): { isValid: boolean; errors: string[] };
}

export interface IGasAuditService {
  writeEntry(type: string, actor: string, details: string, ticketId?: string, clientId?: string): void;
}

export interface IGasCacheService {
  get(key: string): string | null;
  put(key: string, value: string, expirationSeconds?: number): void;
  remove(key: string): void;
}

export interface IGasLockService {
  tryLock(timeoutMs: number): boolean;
  release(): void;
}

/**
 * 6. CONTROLLERS LAYER
 * Route handlers that consume middleware context, validate payloads, invoke services, and compile standard responses.
 */
export interface IGasController {
  handleRequest(ctx: GasMiddlewareContext, payload?: any): ApiResponse;
}

export interface IAuthController extends IGasController {
  login(ctx: GasMiddlewareContext, payload: { email: string; teCode: string }): ApiResponse<{ authToken: string; role: UserRole }>;
  logout(ctx: GasMiddlewareContext): ApiResponse;
}

export interface IClientController extends IGasController {
  list(ctx: GasMiddlewareContext): ApiResponse<SupportClient[]>;
  create(ctx: GasMiddlewareContext, client: SupportClient): ApiResponse<SupportClient>;
}

export interface ITicketController extends IGasController {
  list(ctx: GasMiddlewareContext): ApiResponse<Ticket[]>;
  create(ctx: GasMiddlewareContext, ticket: Ticket): ApiResponse<Ticket>;
  update(ctx: GasMiddlewareContext, ticketId: string, updates: Partial<Ticket>): ApiResponse<Ticket>;
}

export interface IWorkLogController extends IGasController {
  create(ctx: GasMiddlewareContext, log: WorkLogEntry): ApiResponse<WorkLogEntry>;
}

export interface IFollowUpController extends IGasController {
  create(ctx: GasMiddlewareContext, followUp: FollowUpTracker): ApiResponse<FollowUpTracker>;
  listPending(ctx: GasMiddlewareContext): ApiResponse<FollowUpTracker[]>;
}

export interface INotificationController extends IGasController {
  fetch(ctx: GasMiddlewareContext): ApiResponse<AppNotification[]>;
  markAsRead(ctx: GasMiddlewareContext, id: string): ApiResponse;
}

export interface ITrainingController extends IGasController {
  log(ctx: GasMiddlewareContext, payload: any): ApiResponse;
}

export interface IDashboardController extends IGasController {
  getStats(ctx: GasMiddlewareContext): ApiResponse<{
    activeTicketsCount: number;
    pendingFollowUpsCount: number;
    loggedHoursToday: number;
    averageResolutionTimeHrs: number;
  }>;
}

export interface IReportController extends IGasController {
  generatePerformanceSummary(ctx: GasMiddlewareContext): ApiResponse;
}

export interface ISettingsController extends IGasController {
  get(ctx: GasMiddlewareContext, key: string): ApiResponse;
  set(ctx: GasMiddlewareContext, key: string, value: string): ApiResponse;
}

export interface ISyncController extends IGasController {
  processSync(ctx: GasMiddlewareContext, payload: { entity: string; records: any[] }): ApiResponse;
}

export interface IHealthController extends IGasController {
  checkHealth(ctx: GasMiddlewareContext): ApiResponse<{ status: 'HEALTHY'; executionTimeMs: number }>;
}

export interface IAuditController extends IGasController {
  getLogs(ctx: GasMiddlewareContext): ApiResponse;
}

/**
 * 7. UTILITIES INTERFACES
 * Support utilities executing localized operations without domain awareness.
 */
export interface IGasDateUtilities {
  formatIso(date: Date): string;
  differenceInMinutes(start: string, end: string): number;
  addDays(dateStr: string, days: number): string;
}

export interface IGasResponseBuilder {
  success<T>(data: T, message?: string): ApiResponse<T>;
  failed(message: string, errorCode: string, errors?: string[]): ApiResponse;
}

export interface IGasIdGenerator {
  generateTicketId(): string;
  generateClientId(): string;
  generateFollowUpId(): string;
}

export interface IGasSheetMapper {
  headersToFields(headers: string[], mappings: FieldMapping[]): Record<string, number>;
  rowToEntity<T>(row: any[], mappings: FieldMapping[]): T;
  entityToRow<T>(entity: T, mappings: FieldMapping[]): any[];
}

export interface IGasConfigLoader {
  getString(key: string): string;
  getNumber(key: string): number;
  getBoolean(key: string): boolean;
}

export interface IGasLogger {
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, error?: Error): void;
}
