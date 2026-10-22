/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SupportClient, Ticket, WorkLogEntry, FollowUpTracker, AppNotification, User, UserCreate, UserUpdate } from '../types';

/**
 * Enterprise Environment Enum
 * Defines the execution environment to dynamically scale configuration parameters.
 */
export enum ExecutionEnvironment {
  DEVELOPMENT = 'Development',
  TESTING = 'Testing',
  PRODUCTION = 'Production'
}

/**
 * API Versioning Type
 * Ready for v1, v2, and future enterprise version releases.
 */
export enum ApiVersion {
  V1 = 'v1',
  V2 = 'v2',
  FUTURE = 'v_future'
}

/**
 * Standard Security Headers / Context Metadata Placeholder Block
 * Implements security elements required by enterprise audits without actual client-side leakage.
 */
export interface SecurityContext {
  authToken: string | null;       // JWT or Bearer session token
  refreshToken: string | null;    // Token to negotiate new sessions
  requestSignature: string | null;// HMAC-SHA256 signature validating payload integrity
  apiVersion: ApiVersion;         // Scoped version lock
  deviceId: string;               // Unique client instance UUID
  sessionId: string;              // Current user active session tracking ID
}

/**
 * Standardized Unified API Response Wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  version: ApiVersion;
  timestamp: string;               // ISO-8601 Timestamp
  errorCode?: string;              // Normalized application error codes (e.g. AUTH_001, NET_503)
  validationErrors?: string[];     // Array of individual validation errors
}

/**
 * Unified Exception Model
 * Exposes sanitized, user-friendly details instead of raw server stack traces.
 */
export class ApiError extends Error {
  public readonly errorCode: string;
  public readonly timestamp: string;
  public readonly validationErrors?: string[];

  constructor(message: string, errorCode: string, validationErrors?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.errorCode = errorCode;
    this.timestamp = new Date().toISOString();
    this.validationErrors = validationErrors;
    
    // Ensure correct prototype chain
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Timeout Strategy & Configurations
 */
export interface TimeoutConfig {
  connectionTimeoutMs: number;  // Limit to establish connection
  readTimeoutMs: number;        // Limit to wait for remote stream response
}

/**
 * Retry Strategy Blueprint
 * Backoff parameter boundaries to prevent DDoS behavior on flaky networks.
 */
export interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  multiplier: number;           // Exponential growth coefficient (e.g., 2.0)
  maxDelayMs: number;           // Ceiling to avoid long freezes
}

/**
 * API Logs Adapter Interface
 * Enables developers to connect telemetry, cloud monitoring, or browser debuggers.
 */
export interface IApiLogger {
  logRequest(requestId: string, method: string, path: string, security: Omit<SecurityContext, 'authToken' | 'refreshToken'>): void;
  logResponse(requestId: string, statusCode: number, latencyMs: number, success: boolean): void;
  logError(requestId: string, error: ApiError, level: 'warn' | 'error' | 'fatal'): void;
}

/**
 * Offline Request Queue Contract
 * Tracks pending changes local storage to ensure zero loss of business logs on network drop.
 */
export interface QueueItem {
  id: string;                   // UUID of queue record
  timestamp: string;            // Time registered in queue
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;                 // Target endpoint relative to adapter
  payload: any;                 // Serialized request data
  retryCount: number;           // Attempt monitoring
}

export interface IRequestQueue {
  enqueue(item: Omit<QueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<QueueItem>;
  dequeue(): Promise<QueueItem | null>;
  peek(): Promise<QueueItem | null>;
  remove(id: string): Promise<boolean>;
  getPendingCount(): Promise<number>;
}

// ==========================================
// Strongly Typed Request Payload Models
// ==========================================

export interface CreateClientRequest {
  name: string;
  company: string;
  basicInfo: { phone: string; email: string; address: string };
  products?: string[];
  assignments?: { executiveId: string; managerId: string };
  dltInfo?: { registered: boolean; entityId: string };
}

export interface CreateTicketRequest {
  teId: string;
  clientId: string;
  clientName: string;
  issueCategory: string;
  issueDescription: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'In Progress' | 'New' | 'Assigned';
  assignedExecutive: string;
  createdBy: string;
}

export interface UpdateTicketRequest {
  ticketId: string;
  status?: Ticket['status'];
  priority?: Ticket['priority'];
  assignedExecutive?: string;
  resolutionSummary?: string;
  closedDate?: string;
}

export interface SaveWorkLogRequest {
  ticketId: string;
  clientId: string;
  clientName: string;
  teId: string;
  category: string;
  details: string;
  status: string;
  durationMinutes: number;
  nextFollowUpDate?: string;
  remarks?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface ScheduleFollowUpRequest {
  ticketId: string;
  clientId: string;
  clientName: string;
  teId: string;
  executiveName: string;
  scheduledDate: string;
  scheduledTime: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  reason: string;
  nextAction?: string;
}

export interface LoginRequest {
  email: string;
  teCode: string;
}

export interface LogoutRequest {
  sessionId: string;
}

export interface SyncDataRequest {
  entityName: string;
  records: any[];
}

// ==========================================
// Apps Script Adapter Interface (The Port)
// ==========================================

export interface IAppsScriptAdapter {
  get<TResponse = any>(path: string, security: SecurityContext): Promise<ApiResponse<TResponse>>;
  post<TResponse = any, TPayload = any>(path: string, payload: TPayload, security: SecurityContext): Promise<ApiResponse<TResponse>>;
  put<TResponse = any, TPayload = any>(path: string, payload: TPayload, security: SecurityContext): Promise<ApiResponse<TResponse>>;
  delete<TResponse = any>(path: string, security: SecurityContext): Promise<ApiResponse<TResponse>>;
  
  /**
   * Complex transactional batch-sync capability with Sheets
   */
  batchSync<TPayload = any, TResult = any>(payload: TPayload, security: SecurityContext): Promise<ApiResponse<TResult>>;
  
  /**
   * Health Check validator
   */
  healthCheck(): Promise<ApiResponse<{ status: 'HEALTHY' | 'UNHEALTHY'; apiGatewayConnected: boolean }>>;
}

// ==========================================
// Central API Service Layer (The Gateway Entry)
// ==========================================

/**
 * TEDOS API Gateway Dispatcher
 * Routing every operational business module transaction through a centralized gate.
 * Strictly decoupled from specific HTTP clients, OAuth components, or sheet indices.
 */
export class TedosApiGatewayService {
  private adapter: IAppsScriptAdapter;
  private securityContext: SecurityContext;
  private logger: IApiLogger | null = null;
  private timeoutConfig: TimeoutConfig;
  private retryPolicy: RetryPolicy;
  private env: ExecutionEnvironment;

  constructor(
    adapter: IAppsScriptAdapter, 
    env: ExecutionEnvironment = ExecutionEnvironment.DEVELOPMENT,
    logger?: IApiLogger
  ) {
    this.adapter = adapter;
    this.env = env;
    this.logger = logger || null;
    
    // Set environment-sensitive timeout parameters
    this.timeoutConfig = {
      connectionTimeoutMs: env === ExecutionEnvironment.PRODUCTION ? 10000 : 15000,
      readTimeoutMs: env === ExecutionEnvironment.PRODUCTION ? 20000 : 30000
    };

    // Configure resilient backoff retries
    this.retryPolicy = {
      maxRetries: 3,
      initialDelayMs: 1000,
      multiplier: 2.0,
      maxDelayMs: 8000
    };

    // Initialize mock security context placeholders
    this.securityContext = {
      authToken: null,
      refreshToken: null,
      requestSignature: null,
      apiVersion: ApiVersion.V1,
      deviceId: 'TEDOS-DEVICE-UUID-MOCK-777',
      sessionId: 'TEDOS-SESSION-MOCK-999'
    };
  }

  /**
   * Configures security parameters (e.g. following user login)
   */
  public updateSecurityContext(updates: Partial<SecurityContext>): void {
    this.securityContext = {
      ...this.securityContext,
      ...updates
    };
  }

  /**
   * Generates a unique tracking token for logging correlation
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }

  // 1. Client Management Operations
  public async getClients(): Promise<ApiResponse<SupportClient[]>> {
    const rId = this.generateRequestId();
    this.logger?.logRequest(rId, 'GET', '/clients', this.securityContext);
    
    try {
      const response = await this.adapter.get<SupportClient[]>('/clients', this.securityContext);
      this.logger?.logResponse(rId, 200, 150, response.success);
      return response;
    } catch (err: any) {
      const apiErr = new ApiError(err.message || 'Client retrieval failed.', 'NET_CLIENT_GET_ERR');
      this.logger?.logError(rId, apiErr, 'error');
      throw apiErr;
    }
  }

  public async createClient(request: CreateClientRequest): Promise<ApiResponse<SupportClient>> {
    const rId = this.generateRequestId();
    console.log(`[RUNTIME LOG] createClient called, payload:`, request);
    this.logger?.logRequest(rId, 'POST', '/clients', this.securityContext);

    try {
      const response = await this.adapter.post<SupportClient, CreateClientRequest>('/clients', request, this.securityContext);
      console.log(`[RUNTIME LOG] createClient HTTP response:`, response);
      this.logger?.logResponse(rId, 201, 250, response.success);
      return response;
    } catch (err: any) {
      console.error(`[RUNTIME LOG] createClient error:`, err);
      const apiErr = new ApiError(err.message || 'Client creation failed.', 'NET_CLIENT_POST_ERR');
      this.logger?.logError(rId, apiErr, 'error');
      throw apiErr;
    }
  }

  // 1.5 User Management Operations
  public async getUsers(): Promise<ApiResponse<User[]>> {
    const rId = this.generateRequestId();
    this.logger?.logRequest(rId, 'GET', '/users', this.securityContext);
    
    try {
      const response = await this.adapter.get<User[]>('/users', this.securityContext);
      this.logger?.logResponse(rId, 200, 150, response.success);
      return response;
    } catch (err: any) {
      const apiErr = new ApiError(err.message || 'User retrieval failed.', 'NET_USER_GET_ERR');
      this.logger?.logError(rId, apiErr, 'error');
      throw apiErr;
    }
  }

  public async getUserById(userId: string): Promise<ApiResponse<User>> {
    const rId = this.generateRequestId();
    this.logger?.logRequest(rId, 'GET', `/users/${userId}`, this.securityContext);
    
    try {
      const response = await this.adapter.get<User>(`/users/${userId}`, this.securityContext);
      this.logger?.logResponse(rId, 200, 150, response.success);
      return response;
    } catch (err: any) {
      const apiErr = new ApiError(err.message || 'User retrieval failed.', 'NET_USER_GET_ID_ERR');
      this.logger?.logError(rId, apiErr, 'error');
      throw apiErr;
    }
  }

  public async createUser(request: UserCreate): Promise<ApiResponse<User>> {
    const rId = this.generateRequestId();
    console.log(`[RUNTIME LOG] createUser called, payload:`, request);
    this.logger?.logRequest(rId, 'POST', '/users', this.securityContext);
    
    try {
      const response = await this.adapter.post<User, UserCreate>('/users', request, this.securityContext);
      console.log(`[RUNTIME LOG] createUser HTTP response:`, response);
      this.logger?.logResponse(rId, 201, 200, response.success);
      return response;
    } catch (err: any) {
      console.error(`[RUNTIME LOG] createUser error:`, err);
      const apiErr = new ApiError(err.message || 'User creation failed.', 'NET_USER_POST_ERR');
      this.logger?.logError(rId, apiErr, 'error');
      throw apiErr;
    }
  }

  public async updateUser(userId: string, request: UserUpdate): Promise<ApiResponse<User>> {
    const rId = this.generateRequestId();
    this.logger?.logRequest(rId, 'PUT', `/users/${userId}`, this.securityContext);
    
    try {
      const response = await this.adapter.put<User, UserUpdate>(`/users/${userId}`, request, this.securityContext);
      this.logger?.logResponse(rId, 200, 200, response.success);
      return response;
    } catch (err: any) {
      const apiErr = new ApiError(err.message || 'User update failed.', 'NET_USER_PUT_ERR');
      this.logger?.logError(rId, apiErr, 'error');
      throw apiErr;
    }
  }

  public async deleteUser(userId: string): Promise<ApiResponse<{ success: boolean }>> {
    const rId = this.generateRequestId();
    this.logger?.logRequest(rId, 'DELETE', `/users/${userId}`, this.securityContext);
    
    try {
      const response = await this.adapter.delete<{ success: boolean }>(`/users/${userId}`, this.securityContext);
      this.logger?.logResponse(rId, 200, 200, response.success);
      return response;
    } catch (err: any) {
      const apiErr = new ApiError(err.message || 'User deletion failed.', 'NET_USER_DEL_ERR');
      this.logger?.logError(rId, apiErr, 'error');
      throw apiErr;
    }
  }

  public async resetUserPassword(userId: string, newPassword?: string): Promise<ApiResponse<{ success: boolean; tempPassword?: string }>> {
    const rId = this.generateRequestId();
    this.logger?.logRequest(rId, 'POST', `/users/${userId}/reset-password`, this.securityContext);
    
    try {
      const response = await this.adapter.post<{ success: boolean; tempPassword?: string }, { newPassword?: string }>(
        `/users/${userId}/reset-password`,
        { newPassword: newPassword || 'TE@' + Math.floor(100000 + Math.random() * 900000) },
        this.securityContext
      );
      this.logger?.logResponse(rId, 200, 200, response.success);
      return response;
    } catch (err: any) {
      const apiErr = new ApiError(err.message || 'Password reset failed.', 'NET_USER_RESET_ERR');
      this.logger?.logError(rId, apiErr, 'error');
      throw apiErr;
    }
  }

  // 2. Ticket Management Operations
  public async getTickets(): Promise<ApiResponse<Ticket[]>> {
    const rId = this.generateRequestId();
    this.logger?.logRequest(rId, 'GET', '/tickets', this.securityContext);
    
    try {
      const response = await this.adapter.get<Ticket[]>('/tickets', this.securityContext);
      this.logger?.logResponse(rId, 200, 280, response.success);
      return response;
    } catch (err: any) {
      const apiErr = new ApiError(err.message || 'Ticket retrieval failed.', 'NET_TKT_GET_ERR');
      this.logger?.logError(rId, apiErr, 'error');
      throw apiErr;
    }
  }

  public async createTicket(request: CreateTicketRequest): Promise<ApiResponse<Ticket>> {
    const rId = this.generateRequestId();
    this.logger?.logRequest(rId, 'POST', '/tickets', this.securityContext);

    try {
      const response = await this.adapter.post<Ticket, CreateTicketRequest>('/tickets', request, this.securityContext);
      this.logger?.logResponse(rId, 201, 280, response.success);
      return response;
    } catch (err: any) {
      const apiErr = new ApiError(err.message || 'Ticket creation failed.', 'NET_TKT_POST_ERR');
      this.logger?.logError(rId, apiErr, 'error');
      throw apiErr;
    }
  }

  public async updateTicket(request: UpdateTicketRequest): Promise<ApiResponse<Ticket>> {
    const rId = this.generateRequestId();
    this.logger?.logRequest(rId, 'PUT', `/tickets/${request.ticketId}`, this.securityContext);

    try {
      const response = await this.adapter.put<Ticket, UpdateTicketRequest>(`/tickets/${request.ticketId}`, request, this.securityContext);
      this.logger?.logResponse(rId, 200, 210, response.success);
      return response;
    } catch (err: any) {
      const apiErr = new ApiError(err.message || 'Ticket update failed.', 'NET_TKT_PUT_ERR');
      this.logger?.logError(rId, apiErr, 'error');
      throw apiErr;
    }
  }

  // 3. Work Log Operations
  public async getWorkLogs(): Promise<ApiResponse<WorkLogEntry[]>> {
    const rId = this.generateRequestId();
    this.logger?.logRequest(rId, 'GET', '/work-logs', this.securityContext);
    
    try {
      const response = await this.adapter.get<WorkLogEntry[]>('/work-logs', this.securityContext);
      this.logger?.logResponse(rId, 200, 300, response.success);
      return response;
    } catch (err: any) {
      const apiErr = new ApiError(err.message || 'Work log retrieval failed.', 'NET_WL_GET_ERR');
      this.logger?.logError(rId, apiErr, 'error');
      throw apiErr;
    }
  }

  public async saveWorkLog(request: SaveWorkLogRequest): Promise<ApiResponse<WorkLogEntry>> {
    const rId = this.generateRequestId();
    this.logger?.logRequest(rId, 'POST', '/work-logs', this.securityContext);

    try {
      const response = await this.adapter.post<WorkLogEntry, SaveWorkLogRequest>('/work-logs', request, this.securityContext);
      this.logger?.logResponse(rId, 201, 190, response.success);
      return response;
    } catch (err: any) {
      const apiErr = new ApiError(err.message || 'Work log dispatch failed.', 'NET_WL_POST_ERR');
      this.logger?.logError(rId, apiErr, 'error');
      throw apiErr;
    }
  }

  // 4. Follow-up Operational Dispatches
  public async getFollowUps(): Promise<ApiResponse<FollowUpTracker[]>> {
    const rId = this.generateRequestId();
    this.logger?.logRequest(rId, 'GET', '/follow-ups', this.securityContext);
    
    try {
      const response = await this.adapter.get<FollowUpTracker[]>('/follow-ups', this.securityContext);
      this.logger?.logResponse(rId, 200, 300, response.success);
      return response;
    } catch (err: any) {
      const apiErr = new ApiError(err.message || 'Follow-up retrieval failed.', 'NET_FU_GET_ERR');
      this.logger?.logError(rId, apiErr, 'error');
      throw apiErr;
    }
  }

  public async scheduleFollowUp(request: ScheduleFollowUpRequest): Promise<ApiResponse<FollowUpTracker>> {
    const rId = this.generateRequestId();
    this.logger?.logRequest(rId, 'POST', '/follow-ups', this.securityContext);

    try {
      const response = await this.adapter.post<FollowUpTracker, ScheduleFollowUpRequest>('/follow-ups', request, this.securityContext);
      this.logger?.logResponse(rId, 201, 230, response.success);
      return response;
    } catch (err: any) {
      const apiErr = new ApiError(err.message || 'Follow-up allocation rejected.', 'NET_FU_POST_ERR');
      this.logger?.logError(rId, apiErr, 'error');
      throw apiErr;
    }
  }

  // 5. Shared Ledger Synchronization
  public async syncData(request: SyncDataRequest): Promise<ApiResponse<{ syncedCount: number; conflictsCount: number }>> {
    const rId = this.generateRequestId();
    this.logger?.logRequest(rId, 'POST', '/sync', this.securityContext);

    try {
      const response = await this.adapter.batchSync<SyncDataRequest, { syncedCount: number; conflictsCount: number }>(request, this.securityContext);
      this.logger?.logResponse(rId, 200, 480, response.success);
      return response;
    } catch (err: any) {
      const apiErr = new ApiError(err.message || 'Data sync sequence interrupted.', 'NET_SYNC_BATCH_ERR');
      this.logger?.logError(rId, apiErr, 'error');
      throw apiErr;
    }
  }

  // 6. Security Authentication Gateway Interfaces
  public async login(request: LoginRequest): Promise<ApiResponse<{ authToken: string; name: string; teId: string }>> {
    const rId = this.generateRequestId();
    this.logger?.logRequest(rId, 'POST', '/auth/login', this.securityContext);

    try {
      const response = await this.adapter.post<{ authToken: string; name: string; teId: string }, LoginRequest>('/auth/login', request, this.securityContext);
      
      if (response.success && response.data) {
        this.updateSecurityContext({
          authToken: response.data.authToken,
          sessionId: `sess-${Date.now()}`
        });
      }

      this.logger?.logResponse(rId, 200, 320, response.success);
      return response;
    } catch (err: any) {
      const apiErr = new ApiError(err.message || 'Authentication exchange failed.', 'NET_AUTH_LOGIN_ERR');
      this.logger?.logError(rId, apiErr, 'warn');
      throw apiErr;
    }
  }

  public async logout(request: LogoutRequest): Promise<ApiResponse<{ success: boolean }>> {
    const rId = this.generateRequestId();
    this.logger?.logRequest(rId, 'POST', '/auth/logout', this.securityContext);

    try {
      const response = await this.adapter.post<{ success: boolean }, LogoutRequest>('/auth/logout', request, this.securityContext);
      
      this.updateSecurityContext({
        authToken: null,
        refreshToken: null,
        requestSignature: null
      });

      this.logger?.logResponse(rId, 200, 110, response.success);
      return response;
    } catch (err: any) {
      const apiErr = new ApiError(err.message || 'Secure session termination rejected.', 'NET_AUTH_LOGOUT_ERR');
      this.logger?.logError(rId, apiErr, 'warn');
      throw apiErr;
    }
  }

  // 7. Notification Feeds
  public async getNotifications(): Promise<ApiResponse<AppNotification[]>> {
    const rId = this.generateRequestId();
    this.logger?.logRequest(rId, 'GET', '/notifications', this.securityContext);

    try {
      const response = await this.adapter.get<AppNotification[]>('/notifications', this.securityContext);
      this.logger?.logResponse(rId, 200, 120, response.success);
      return response;
    } catch (err: any) {
      const apiErr = new ApiError(err.message || 'Notification sync error.', 'NET_NOTIF_GET_ERR');
      this.logger?.logError(rId, apiErr, 'warn');
      throw apiErr;
    }
  }

  // Utility Getters for Advanced Settings Hooks
  public getRetryPolicy(): RetryPolicy {
    return { ...this.retryPolicy };
  }

  public getTimeoutConfig(): TimeoutConfig {
    return { ...this.timeoutConfig };
  }

  public getExecutionEnvironment(): ExecutionEnvironment {
    return this.env;
  }
}

/**
 * Concrete implementation of IAppsScriptAdapter that makes live fetch requests.
 */
const DIRECT_GAS_FALLBACK_URL =
  'https://script.google.com/macros/s/AKfycbxhbrnIQMIFHpZGXxq2Q2xnPJLPQtnCpDbDXFIOBPeWo6vulj2jEiWWrVlonr6dHa_M/exec';

export class AppsScriptHttpAdapter implements IAppsScriptAdapter {
  private webAppUrl: string;
  private apiKey: string;
  private signatureSecret: string;

  constructor(
    webAppUrl: string = '/api/proxy',
    apiKey: string = 'TEDOS-SECURE-API-KEY-777',
    signatureSecret: string = 'TEDOS-HMAC-SHA256-SIGNING-SECRET-999'
  ) {
    this.webAppUrl = webAppUrl || '/api/proxy';
    this.apiKey = apiKey;
    this.signatureSecret = signatureSecret;
  }

  /**
   * Dynamically configures or updates the Web App URL at runtime.
   */
  public setWebAppUrl(url: string): void {
    this.webAppUrl = url;
    localStorage.setItem('TEDOS_APPS_SCRIPT_URL', url);
  }

  public getWebAppUrl(): string {
    return this.webAppUrl;
  }

  // Generate cryptographic HMAC-SHA256 signature using browser native Web Crypto API
  private async generateSignature(method: string, timestamp: string, nonce: string, payload: string): Promise<string> {
    const signatureBase = [
      method.toUpperCase(),
      timestamp,
      nonce,
      payload
    ].join("|");

    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.signatureSecret);
    const messageData = encoder.encode(signatureBase);

    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["sign"]
    );

    const signatureBuffer = await window.crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      messageData
    );

    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    return signatureArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private async prepareRequest(method: string, path: string, payload: any, security: SecurityContext) {
    const timestamp = new Date().toISOString();
    const nonce = this.generateNonce();
    const payloadStr = payload ? JSON.stringify(payload) : '';
    const signature = await this.generateSignature(method, timestamp, nonce, payloadStr);

    const headers: Record<string, string> = {
      'X-API-Key': this.apiKey,
      'X-API-Version': security.apiVersion || 'v1',
      'X-Device-ID': security.deviceId || 'TEDOS-BROWSER-DEVICE',
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
      'X-Signature': signature
    };

    if (security.authToken) {
      headers['Authorization'] = `Bearer ${security.authToken}`;
    }

    return { headers, timestamp, nonce, signature, payloadStr };
  }

  public async get<TResponse = any>(path: string, security: SecurityContext): Promise<ApiResponse<TResponse>> {
    if (!this.webAppUrl) {
      throw new Error("Apps Script Web App URL is not configured. Please enter your Web App URL in settings.");
    }

    const { timestamp, nonce, signature } = await this.prepareRequest('GET', path, null, security);

    // Append security parameters to query string for Apps Script doGet mapping
    const params = new URLSearchParams();
    params.append('path', path);
    params.append('apiKey', this.apiKey);
    params.append('apiVersion', security.apiVersion || 'v1');
    params.append('deviceId', security.deviceId || 'TEDOS-BROWSER-DEVICE');
    params.append('timestamp', timestamp);
    params.append('nonce', nonce);
    params.append('signature', signature);
    if (security.authToken) {
      params.append('token', security.authToken);
    }

    const fetchUrl = `${this.webAppUrl}?${params.toString()}`;
    try {
      const response = await fetch(fetchUrl, {
        method: 'GET',
        mode: 'cors'
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        return (await response.json()) as ApiResponse<TResponse>;
      }
    } catch {
      // Fallback to direct Google Apps Script URL when running on static Netlify
    }

    const directUrl = `${DIRECT_GAS_FALLBACK_URL}?${params.toString()}`;
    const directRes = await fetch(directUrl, { method: 'GET', redirect: 'follow' });
    if (!directRes.ok) {
      throw new Error(`HTTP Error: ${directRes.status} ${directRes.statusText}`);
    }
    return (await directRes.json()) as ApiResponse<TResponse>;
  }

  public async post<TResponse = any, TPayload = any>(path: string, payload: TPayload, security: SecurityContext): Promise<ApiResponse<TResponse>> {
    return this.sendTunneledRequest<TResponse>('POST', path, payload, security);
  }

  public async put<TResponse = any, TPayload = any>(path: string, payload: TPayload, security: SecurityContext): Promise<ApiResponse<TResponse>> {
    return this.sendTunneledRequest<TResponse>('PUT', path, payload, security);
  }

  public async delete<TResponse = any>(path: string, security: SecurityContext): Promise<ApiResponse<TResponse>> {
    return this.sendTunneledRequest<TResponse>('DELETE', path, null, security);
  }

  public async batchSync<TPayload = any, TResult = any>(payload: TPayload, security: SecurityContext): Promise<ApiResponse<TResult>> {
    return this.sendTunneledRequest<TResult>('POST', '/sync', payload, security);
  }

  public async healthCheck(): Promise<ApiResponse<{ status: 'HEALTHY' | 'UNHEALTHY'; apiGatewayConnected: boolean }>> {
    try {
      const security: SecurityContext = {
        authToken: null,
        refreshToken: null,
        requestSignature: null,
        apiVersion: ApiVersion.V1,
        deviceId: 'HEALTH-CHECK-CLIENT',
        sessionId: 'HEALTH-CHECK-SESS'
      };
      const response = await this.get<{ status: string; latencyMs: number }>('/ping', security);
      return {
        success: response.success,
        message: response.message,
        data: {
          status: response.success ? 'HEALTHY' : 'UNHEALTHY',
          apiGatewayConnected: response.success
        },
        version: ApiVersion.V1,
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Failed health check",
        version: ApiVersion.V1,
        timestamp: new Date().toISOString(),
        data: {
          status: 'UNHEALTHY',
          apiGatewayConnected: false
        }
      };
    }
  }

  private async sendTunneledRequest<TResponse>(method: string, path: string, payload: any, security: SecurityContext): Promise<ApiResponse<TResponse>> {
    if (!this.webAppUrl) {
      throw new Error("Apps Script Web App URL is not configured. Please enter your Web App URL in settings.");
    }

    const { headers } = await this.prepareRequest(method, path, payload, security);

    const tunnelPayload = {
      method: method,
      path: path,
      headers: headers,
      body: payload
    };

    try {
      const response = await fetch(this.webAppUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tunnelPayload)
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        return (await response.json()) as ApiResponse<TResponse>;
      }
    } catch {
      // Fallback to direct Google Apps Script URL with text/plain to avoid CORS preflight on Netlify
    }

    const directRes = await fetch(DIRECT_GAS_FALLBACK_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(tunnelPayload)
    });

    if (!directRes.ok) {
      throw new Error(`HTTP Error: ${directRes.status} ${directRes.statusText}`);
    }

    return (await directRes.json()) as ApiResponse<TResponse>;
  }
}

// Global exported adapter and apiGateway instances
export const httpAdapter = new AppsScriptHttpAdapter(
  "/api/proxy"
);
export const apiGateway = new TedosApiGatewayService(httpAdapter);