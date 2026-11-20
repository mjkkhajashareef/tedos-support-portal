/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  SupportClient,
  WorkLogEntry,
  FollowUpTracker,
  Ticket,
  ShiftRecord
} from '../../types';
import { apiGateway } from '../../utils/apiGateway';
import { CONFIG } from '../../config/appConfig';
import { fetchClientsFromGAS } from '../../utils/helpers';

export function sanitizeClientsList(clientsList: SupportClient[]): SupportClient[] {
  const uniqueClientsMap = new Map<string, SupportClient>();
  clientsList.forEach((c, idx) => {
    const lowerName = (c.name || '').toLowerCase();
    if (
      lowerName.includes('zigma') ||
      lowerName.includes('apollo') ||
      lowerName.includes('supermart') ||
      lowerName.includes('apex logistics')
    ) {
      return;
    }
    const key = c.id || `client-${idx}`;
    if (!uniqueClientsMap.has(key)) uniqueClientsMap.set(key, c);
  });
  return Array.from(uniqueClientsMap.values());
}

export async function fetchClientsWithFallback(): Promise<SupportClient[]> {
  try {
    const gasClients = await fetchClientsFromGAS('/api/proxy');
    if (gasClients && gasClients.length > 0) return gasClients;
  } catch (proxyErr) {
    console.warn('[AppContext] /api/proxy fetch error, trying direct GAS endpoint:', proxyErr);
  }
  try {
    const directClients = await fetchClientsFromGAS(CONFIG.apiEndpoint);
    if (directClients && directClients.length > 0) return directClients;
  } catch (gasErr) {
    console.warn('[AppContext] Real GAS fetch error, falling back to apiGateway:', gasErr);
  }
  try {
    const fallbackRes = await apiGateway.getClients();
    return fallbackRes.data || [];
  } catch (fbErr) {
    console.error('[AppContext] apiGateway.getClients fallback failed:', fbErr);
    return [];
  }
}

export async function syncServerDomainStores(params: {
  setClients: React.Dispatch<React.SetStateAction<SupportClient[]>>;
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  setWorkLogs: React.Dispatch<React.SetStateAction<WorkLogEntry[]>>;
  setFollowUps: React.Dispatch<React.SetStateAction<FollowUpTracker[]>>;
  setShifts: React.Dispatch<React.SetStateAction<ShiftRecord[]>>;
}) {
  const { setClients, setTickets, setWorkLogs, setFollowUps, setShifts } = params;

  try {
    const srvTkt = await fetch('/api/tickets');
    if (srvTkt.ok) {
      const tktJson = await srvTkt.json();
      if (tktJson.success && Array.isArray(tktJson.tickets) && tktJson.tickets.length > 0) {
        setTickets(prev => {
          const map = new Map<string, Ticket>();
          [...tktJson.tickets, ...prev].forEach((t: Ticket) => {
            if (t && t.id && !/zigma|apollo/i.test(t.clientName || '')) map.set(t.id, t);
          });
          return Array.from(map.values());
        });
      }
    }
  } catch {}

  try {
    const srvRes = await fetch('/api/worklogs');
    if (srvRes.ok) {
      const srvJson = await srvRes.json();
      if (srvJson.success && Array.isArray(srvJson.workLogs)) {
        const cleanSrv = srvJson.workLogs.filter(
          (l: WorkLogEntry) => l && l.id && !/zigma|apollo/i.test(l.clientName || '')
        );
        if (cleanSrv.length > 0) {
          setWorkLogs(prev => {
            const map = new Map<string, WorkLogEntry>();
            [...cleanSrv, ...prev].forEach(item => map.set(item.id, item));
            return Array.from(map.values()).sort(
              (a, b) =>
                new Date(b.date || b.timestamp || 0).getTime() -
                new Date(a.date || a.timestamp || 0).getTime()
            );
          });
        }
      }
    }
  } catch (err) {
    console.warn('[AppContext] Server work logs fetch notice:', err);
  }

  try {
    const shiftRes = await fetch('/api/shifts');
    if (shiftRes.ok) {
      const shiftJson = await shiftRes.json();
      if (shiftJson.success && Array.isArray(shiftJson.shifts)) {
        setShifts(prev => {
          const map = new Map<string, ShiftRecord>();
          prev.forEach(s => {
            if (s && s.id) map.set(s.id, s);
          });
          shiftJson.shifts.forEach((s: ShiftRecord) => {
            if (s && s.id) {
              const existing = map.get(s.id);
              if (!existing || (s.updatedAt || '') >= (existing.updatedAt || '')) {
                map.set(s.id, s);
              }
            }
          });
          const merged = Array.from(map.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          try {
            localStorage.setItem('tedos_shifts_v1', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    }
  } catch (err) {
    console.warn('[AppContext] Server shifts fetch notice:', err);
  }

  try {
    const urlRes = await fetch('/api/client-urls');
    if (urlRes.ok) {
      const urlJson = await urlRes.json();
      if (urlJson.success && urlJson.urls) {
        const urlMap: Record<string, any> = urlJson.urls;
        localStorage.setItem('tedos_client_urls', JSON.stringify(urlMap));
        setClients(prev => {
          const updated = prev.map(c => {
            const entry =
              urlMap[c.teId || ''] ||
              urlMap[c.id || ''] ||
              urlMap[c.name || ''] ||
              (c.teId ? urlMap[c.teId.toUpperCase()] || urlMap[c.teId.toLowerCase()] : null) ||
              (c.name ? urlMap[c.name.toLowerCase()] : null) ||
              null;
            if (!entry) return c;
            const enrichedUrl = typeof entry === 'string' ? entry : entry.url;
            const enrichedLogin = typeof entry === 'object' ? entry.login : '';
            const enrichedRemarks =
              typeof entry === 'object' ? entry.remarks || entry.specialManagerRemark || entry.noteSaad : '';
            return {
              ...c,
              url: enrichedUrl || c.url,
              softwareUrl: enrichedUrl || c.softwareUrl,
              deploymentUrl: enrichedUrl || c.deploymentUrl,
              softwareLogin: enrichedLogin || c.softwareLogin,
              email: enrichedLogin || c.email,
              noteSaad: enrichedRemarks || c.noteSaad,
              specialManagerRemark: enrichedRemarks || c.specialManagerRemark
            };
          });
          try {
            localStorage.setItem('tedos_cached_clients', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    }
  } catch (err) {
    console.warn('[AppContext] Client URLs fetch notice:', err);
  }

  try {
    const rolesRes = await fetch('/api/roles');
    if (rolesRes.ok) {
      const rolesJson = await rolesRes.json();
      if (rolesJson.success && rolesJson.roles) {
        const raw = rolesJson.roles;
        const parsed = Array.isArray(raw) && raw.length > 0 ? raw[0] || raw : raw;
        if (parsed && typeof parsed === 'object') {
          localStorage.setItem('tedos_role_module_access', JSON.stringify(parsed));
          window.dispatchEvent(new Event('tedos_permissions_updated'));
        }
      }
    }
  } catch (err) {
    console.warn('[AppContext] Roles fetch notice:', err);
  }

  try {
    const srvFu = await fetch('/api/follow-ups');
    if (srvFu.ok) {
      const fuJson = await srvFu.json();
      if (fuJson.success && Array.isArray(fuJson.followUps) && fuJson.followUps.length > 0) {
        setFollowUps(prev => {
          const map = new Map<string, FollowUpTracker>();
          [...fuJson.followUps, ...prev].forEach((f: FollowUpTracker) => {
            if (f && f.id && !/zigma|apollo/i.test(f.clientName || '')) map.set(f.id, f);
          });
          return Array.from(map.values());
        });
      }
    }
  } catch {}
}

export function parseSheetTsvUpdates(tsvText: string): {
  updatesMap: Record<string, any>;
  updatedNames: string[];
} {
  const lines = tsvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const updatesMap: Record<string, any> = {};
  const updatedNames: string[] = [];

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 2) continue;

    const teId = (parts[0] || '').trim();
    const clientName = (parts[1] || '').trim();
    const phone = (parts[2] || '').trim();
    const assignedSupport = parts.length > 4 ? (parts[4] || '').trim() : '';
    const department = parts.length > 5 ? (parts[5] || '').trim() : '';
    const plan = parts.length > 6 ? (parts[6] || '').trim() : '';
    const status = parts.length > 7 ? (parts[7] || '').trim() : '';
    const rawUrl = parts.length > 14 ? (parts[14] || '').trim() : '';
    const login = parts.length > 15 ? (parts[15] || '').trim() : '';
    const remarks = parts.length > 18 ? (parts[18] || '').trim() : '';

    const formattedUrl =
      rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://') && rawUrl.includes('.')
        ? `https://${rawUrl}`
        : rawUrl;

    const record = {
      teId,
      clientName,
      phone,
      assignedSupport,
      department,
      plan,
      status,
      url: formattedUrl,
      login,
      remarks,
      updatedAt: new Date().toISOString()
    };

    if (teId) updatesMap[teId] = record;
    if (clientName) updatesMap[clientName] = record;
    updatedNames.push(clientName || teId);
  }

  return { updatesMap, updatedNames };
}
