/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  SupportClient,
  WorkLogEntry,
  FollowUpTracker,
  Ticket,
  ShiftRecord,
  User,
  UserRole,
  ModuleId,
  AppNotification
} from '../../types';
import { apiGateway, CreateClientRequest } from '../../utils/apiGateway';
import { CONFIG } from '../../config/appConfig';
import { fetchClientsFromGAS } from '../../utils/helpers';
import { loadStoredUsers, syncSupportTeamFromClients } from '../../utils/userDirectory';
import { emitSystemToast } from '../../components/common/SystemToastStack';
import {
  sanitizeClientsList,
  fetchClientsWithFallback,
  syncServerDomainStores,
  parseSheetTsvUpdates
} from './clientSyncHelpers';

interface UseClientOperationsParams {
  currentUser: User | null;
  clients: SupportClient[];
  setClients: React.Dispatch<React.SetStateAction<SupportClient[]>>;
  language: 'en' | 'ur';
  setSelectedClientId: (id: string | null) => void;
  setCurrentModule: (module: ModuleId) => void;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  setWorkLogs: React.Dispatch<React.SetStateAction<WorkLogEntry[]>>;
  setFollowUps: React.Dispatch<React.SetStateAction<FollowUpTracker[]>>;
  setShifts: React.Dispatch<React.SetStateAction<ShiftRecord[]>>;
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  normalizeMobile: (raw?: string) => string;
  users: User[];
}

export function useClientOperations({
  currentUser,
  clients,
  setClients,
  language,
  setSelectedClientId,
  setCurrentModule,
  setUsers,
  setTickets,
  setWorkLogs,
  setFollowUps,
  setShifts,
  setNotifications,
  addNotification,
  normalizeMobile,
  users
}: UseClientOperationsParams) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const visibleClients = useMemo(() => {
    const cleanAll = clients.filter(c => !/zigma|apollo/i.test(c.name || ''));
    if (!currentUser) return cleanAll;
    if (currentUser.role === UserRole.SUPPORT_EXECUTIVE) {
      const execNameLower = (currentUser.name || '').trim().toLowerCase();
      const tokens = execNameLower.split(/\s+/).filter(Boolean);
      const firstToken = tokens[0] || '';
      const emailUser = (currentUser.email || '').split('@')[0].toLowerCase();
      const myEmpId = (currentUser.employeeId || '').trim().toLowerCase();
      const assignedIds = new Set(currentUser.assignedClients || []);

      const matched = cleanAll.filter(c => {
        if (assignedIds.has(c.id) || (c.teId && assignedIds.has(c.teId))) return true;
        const clientExec = (c.assignedExecutive || c.assignedSupport || '').trim().toLowerCase();
        if (!clientExec || clientExec === 'unassigned') return false;
        if (clientExec === execNameLower) return true;
        if (firstToken && (clientExec.includes(firstToken) || firstToken.includes(clientExec))) return true;
        if (tokens.some(t => t.length > 2 && clientExec.includes(t))) return true;
        if (emailUser && emailUser.length > 3 && clientExec.includes(emailUser)) return true;
        if (myEmpId && clientExec.includes(myEmpId)) return true;
        return false;
      });
      return matched.length > 0 ? matched : cleanAll;
    }
    return cleanAll;
  }, [clients, currentUser]);

  const fetchAppData = async () => {
    try {
      const [clientsList, ticketsRes, workLogsRes, followUpsRes, notifsRes, usersRes] =
        await Promise.all([
          fetchClientsWithFallback(),
          apiGateway.getTickets().catch(() => ({ success: true, data: [] })),
          apiGateway.getWorkLogs().catch(() => ({ success: true, data: [] })),
          apiGateway.getFollowUps().catch(() => ({ success: true, data: [] })),
          apiGateway.getNotifications().catch(() => ({ success: true, data: [] })),
          apiGateway.getUsers().catch(() => ({ success: true, data: [] }))
        ]);

      if (clientsList && clientsList.length > 0) {
        const sanitizedClients = sanitizeClientsList(clientsList);
        if (sanitizedClients.length > 0) {
          setClients(sanitizedClients);
          localStorage.setItem('tedos_cached_clients', JSON.stringify(sanitizedClients));
          setUsers(syncSupportTeamFromClients(sanitizedClients));
        }
      }

      if (ticketsRes.success && ticketsRes.data) {
        const cleanTickets = ticketsRes.data.filter(
          (t: Ticket) => !/zigma|apollo/i.test(t.clientName || '')
        );
        if (cleanTickets.length > 0) setTickets(cleanTickets);
      }

      if (workLogsRes.success && workLogsRes.data) {
        const cleanLogs = workLogsRes.data.filter(
          (l: WorkLogEntry) => !/zigma|apollo/i.test(l.clientName || '')
        );
        if (cleanLogs.length > 0) setWorkLogs(cleanLogs);
      }

      if (followUpsRes.success && followUpsRes.data) {
        const cleanFollowUps = followUpsRes.data.filter(
          (f: FollowUpTracker) => !/zigma|apollo/i.test(f.clientName || '')
        );
        if (cleanFollowUps.length > 0) setFollowUps(cleanFollowUps);
      }

      await syncServerDomainStores({
        setClients,
        setTickets,
        setWorkLogs,
        setFollowUps,
        setShifts
      });

      if (notifsRes.success && notifsRes.data) {
        setNotifications(
          notifsRes.data.filter((n: AppNotification) => !/zigma|apollo/i.test(n.message || ''))
        );
      }

      if (usersRes.success && usersRes.data && usersRes.data.length > 0) {
        setUsers(loadStoredUsers());
      }
    } catch (err) {
      console.error('[RUNTIME LOG] fetchAppData exception:', err);
    }
  };

  const refreshCurrentView = async () => {
    setIsRefreshing(true);
    try {
      await fetchAppData();
      addNotification({
        title: language === 'ur' ? 'ڈیٹا ریفریش ہو گیا' : 'Data Refreshed',
        message:
          language === 'ur'
            ? 'تمام ماڈیولز اور کلائنٹس کا ڈیٹا کامیابی سے تازہ ہو گیا۔'
            : 'All views and synchronization nodes refreshed successfully.',
        type: 'info'
      });
    } catch (err) {
      console.error('Failed to refresh app data', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const refreshClients = async () => {
    try {
      let gasClients: SupportClient[] = [];
      try {
        gasClients = await fetchClientsFromGAS('/api/proxy');
      } catch {
        gasClients = await fetchClientsFromGAS(CONFIG.apiEndpoint);
      }
      if (gasClients && gasClients.length > 0) {
        const sanitizedClients = sanitizeClientsList(gasClients);
        if (sanitizedClients.length > 0) {
          setClients(sanitizedClients);
          localStorage.setItem('tedos_cached_clients', JSON.stringify(sanitizedClients));
          setUsers(syncSupportTeamFromClients(sanitizedClients));
          addNotification({
            title: language === 'ur' ? 'گوگل شیٹ سنک مکمل' : 'Google Sheet Synced',
            message:
              language === 'ur'
                ? `گوگل شیٹ سے ${sanitizedClients.length} اصلی کلائنٹس کامیابی سے سنک ہو گئے۔`
                : `Successfully synchronized ${sanitizedClients.length} clients from Google Sheet.`,
            type: 'success'
          });
        }
      } else {
        const fallback = await apiGateway.getClients();
        if (fallback.success && fallback.data) setClients(fallback.data);
      }
    } catch (err) {
      console.error('Failed to refresh clients', err);
      const fallback = await apiGateway.getClients();
      if (fallback.success && fallback.data) setClients(fallback.data);
    }
  };

  const addClient = async (client: CreateClientRequest): Promise<SupportClient | undefined> => {
    try {
      const cleanMobile = normalizeMobile(client.basicInfo?.phone);
      if (cleanMobile && cleanMobile.length === 10) {
        const duplicateInClients = clients.some(c => normalizeMobile(c.phone) === cleanMobile);
        const duplicateInUsers = users.some(u => normalizeMobile(u.mobile) === cleanMobile);
        if (duplicateInClients || duplicateInUsers) {
          throw new Error(
            'Ek mobile no. ki ek hi ID banni chahiye! Yeh mobile number pehle se registered hai.'
          );
        }
      }

      const response = await apiGateway.createClient(client);
      await fetchAppData();
      addNotification({
        title: 'Client Activated',
        message: `Client ${client.name} (ID: ${response.data?.id || 'Assigned'}) has been successfully activated.`,
        type: 'success'
      });

      if (response.data) {
        setSelectedClientId(response.data.id);
        setCurrentModule(ModuleId.CLIENT_WORKSPACE);
      }
      return response.data;
    } catch (err) {
      console.error('Failed to create client', err);
      throw err;
    }
  };

  const updateClientStatus = (
    clientId: string,
    status: 'Critical' | 'Warning' | 'Active' | 'Inactive'
  ) => {
    setClients(prev => prev.map(c => (c.id === clientId ? { ...c, status } : c)));
  };

  const updateClientUrl = async (
    identifier: string,
    newUrl: string,
    login?: string,
    remarks?: string
  ) => {
    const trimmed = (newUrl || '').trim();
    const formatted =
      trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://') && trimmed.includes('.')
        ? `https://${trimmed}`
        : trimmed;

    setClients(prev =>
      prev.map(c =>
        c.id === identifier || c.teId === identifier || c.name === identifier
          ? {
              ...c,
              url: formatted,
              softwareUrl: formatted,
              deploymentUrl: formatted,
              softwareLogin: login !== undefined ? login : c.softwareLogin,
              email: login || c.email,
              noteSaad: remarks !== undefined ? remarks : c.noteSaad,
              specialManagerRemark: remarks !== undefined ? remarks : c.specialManagerRemark
            }
          : c
      )
    );

    const recordPayload = {
      url: formatted,
      login: login || '',
      remarks: remarks || '',
      updatedAt: new Date().toISOString()
    };

    try {
      const cachedStr = localStorage.getItem('tedos_client_urls');
      const cached = cachedStr ? JSON.parse(cachedStr) : {};
      cached[identifier] = recordPayload;
      localStorage.setItem('tedos_client_urls', JSON.stringify(cached));
    } catch {}

    try {
      await fetch('/api/client-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [identifier]: recordPayload })
      });
      emitSystemToast({
        title: language === 'ur' ? 'سافٹ ویئر لنک محفوظ' : 'Client URL Saved',
        message: `Portal link for ${identifier} synchronized.`,
        type: 'success'
      });
    } catch (e) {
      console.warn('Failed to sync client url to server:', e);
    }
  };

  const importSheetRowData = async (
    tsvText: string
  ): Promise<{ count: number; importedClients: string[] }> => {
    if (!tsvText || !tsvText.trim()) return { count: 0, importedClients: [] };

    const { updatesMap, updatedNames } = parseSheetTsvUpdates(tsvText);
    if (Object.keys(updatesMap).length === 0) return { count: 0, importedClients: [] };

    setClients(prev => {
      const updated = prev.map(c => {
        const entry =
          updatesMap[c.teId || ''] ||
          updatesMap[c.id || ''] ||
          updatesMap[c.name || ''] ||
          (c.teId ? updatesMap[c.teId.toUpperCase()] || updatesMap[c.teId.toLowerCase()] : null) ||
          (c.name ? updatesMap[c.name.toLowerCase()] : null) ||
          null;
        if (!entry) return c;
        return {
          ...c,
          url: entry.url || c.url,
          softwareUrl: entry.url || c.softwareUrl,
          deploymentUrl: entry.url || c.deploymentUrl,
          softwareLogin: entry.login || c.softwareLogin,
          email: entry.login || c.email,
          noteSaad: entry.remarks || c.noteSaad,
          specialManagerRemark: entry.remarks || c.specialManagerRemark,
          phone: entry.phone || c.phone,
          assignedSupport: entry.assignedSupport || c.assignedSupport,
          assignedExecutive: entry.assignedSupport || c.assignedExecutive
        };
      });
      try {
        localStorage.setItem('tedos_cached_clients', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      const cachedStr = localStorage.getItem('tedos_client_urls');
      const cached = cachedStr ? JSON.parse(cachedStr) : {};
      localStorage.setItem('tedos_client_urls', JSON.stringify({ ...cached, ...updatesMap }));
    } catch {}

    try {
      await fetch('/api/client-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatesMap)
      });
    } catch (e) {
      console.warn('Failed to sync batch sheet URLs to server:', e);
    }

    return { count: Object.keys(updatesMap).length, importedClients: updatedNames };
  };

  return {
    visibleClients,
    allClients: clients.filter(c => !/zigma|apollo/i.test(c.name || '')),
    isRefreshing,
    fetchAppData,
    refreshCurrentView,
    refreshClients,
    addClient,
    updateClientStatus,
    updateClientUrl,
    importSheetRowData
  };
}
