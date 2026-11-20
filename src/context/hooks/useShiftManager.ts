/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { ShiftRecord, User, UserRole, AppNotification } from '../../types';
import { getLocalDateString, formatTimeHHMM } from '../../utils/helpers';
import { emitSystemToast } from '../../components/common/SystemToastStack';

interface UseShiftManagerParams {
  currentUser: User | null;
  language: 'en' | 'ur';
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
}

export function useShiftManager({
  currentUser,
  language,
  addNotification
}: UseShiftManagerParams) {
  const [shifts, setShifts] = useState<ShiftRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('tedos_shifts_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    if (shifts.length > 0) {
      try {
        localStorage.setItem('tedos_shifts_v1', JSON.stringify(shifts));
      } catch {}
    }
  }, [shifts]);

  const visibleShifts = useMemo(() => {
    if (!currentUser || currentUser.role !== UserRole.SUPPORT_EXECUTIVE) return shifts;
    const myId = (currentUser.id || '').toLowerCase();
    const myEmp = (currentUser.employeeId || '').trim().toLowerCase();
    const myName = (currentUser.name || '').trim().toLowerCase();
    const firstToken = myName.split(/\s+/)[0] || '';
    return shifts.filter(s => {
      const sUser = (s.userId || '').toLowerCase();
      const sEmp = (s.employeeId || '').trim().toLowerCase();
      const sName = (s.executiveName || '').trim().toLowerCase();
      return (
        (myId && sUser === myId) ||
        (myEmp && sEmp === myEmp) ||
        (myName && (sName === myName || sName.includes(firstToken) || firstToken.includes(sName)))
      );
    });
  }, [shifts, currentUser]);

  const activeTodayShift = useMemo(() => {
    if (!currentUser) return null;
    const todayStr = getLocalDateString();
    const myId = (currentUser.id || '').toLowerCase();
    const myEmp = (currentUser.employeeId || '').trim().toLowerCase();
    const myName = (currentUser.name || '').trim().toLowerCase();
    const firstToken = myName.split(/\s+/)[0] || '';
    const todays = shifts.filter(s => {
      if (s.date !== todayStr) return false;
      const sUser = (s.userId || '').toLowerCase();
      const sEmp = (s.employeeId || '').trim().toLowerCase();
      const sName = (s.executiveName || '').trim().toLowerCase();
      return (
        (myId && sUser === myId) ||
        (myEmp && sEmp === myEmp) ||
        (myName && (sName === myName || sName.includes(firstToken) || firstToken.includes(sName)))
      );
    });
    return todays.find(s => s.status === 'Active') || todays[0] || null;
  }, [shifts, currentUser]);

  const startDailyShift = async (
    customStartTime?: string,
    notes?: string,
    targetShiftMinutes = 480
  ): Promise<ShiftRecord> => {
    const now = new Date();
    const todayStr = getLocalDateString(now);
    const startTimeStr =
      customStartTime && customStartTime.trim() ? customStartTime.trim() : formatTimeHHMM(now);
    const shiftId = `shf-${currentUser?.employeeId || currentUser?.id || 'exec'}-${todayStr}`;

    const newShift: ShiftRecord = {
      id: shiftId,
      userId: currentUser?.id || 'current-user',
      employeeId: currentUser?.employeeId || 'TE-SUP',
      executiveName: currentUser?.name || 'Support Executive',
      role: currentUser?.role || UserRole.SUPPORT_EXECUTIVE,
      date: todayStr,
      shiftStartTime: startTimeStr,
      shiftStartTimestamp: now.getTime(),
      breakMinutes: 0,
      targetShiftMinutes,
      status: 'Active',
      notes: notes?.trim() || '',
      updatedAt: now.toISOString()
    };

    setShifts(prev => {
      const filtered = prev.filter(s => s.id !== shiftId);
      const next = [newShift, ...filtered];
      try {
        localStorage.setItem('tedos_shifts_v1', JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newShift)
      });
      const json = await res.json().catch(() => ({}));
      if (json.sheetSynced === false) {
        emitSystemToast({
          title: language === 'ur' ? 'شفٹ مقامی طور پر محفوظ' : 'Shift Saved Locally',
          message: json.sheetMessage || 'Google Sheet sync pending — queued locally.',
          type: 'warning'
        });
      }
    } catch (e) {
      console.warn('[AppContext] Failed to persist start shift to server:', e);
    }

    addNotification({
      title: language === 'ur' ? 'روزانہ شفٹ شروع ہو گئی' : 'Daily Shift Started',
      message:
        language === 'ur'
          ? `${newShift.executiveName} کی شفٹ ${startTimeStr} پر درج ہو گئی۔`
          : `${newShift.executiveName} clocked in at ${startTimeStr} (${todayStr}).`,
      type: 'success'
    });

    return newShift;
  };

  const endDailyShift = async (
    shiftId?: string,
    customEndTime?: string,
    breakMinutes?: number,
    notes?: string,
    customStartTime?: string
  ): Promise<ShiftRecord | null> => {
    const now = new Date();
    const targetShift = shiftId ? shifts.find(s => s.id === shiftId) : activeTodayShift;

    const endTimeStr =
      customEndTime && customEndTime.trim() ? customEndTime.trim() : formatTimeHHMM(now);
    const startTimeOverride =
      customStartTime && customStartTime.trim() ? customStartTime.trim() : undefined;

    if (!targetShift) {
      const todayStr = getLocalDateString(now);
      const fallbackId = `shf-${currentUser?.employeeId || currentUser?.id || 'exec'}-${todayStr}`;
      const completedRecord: ShiftRecord = {
        id: fallbackId,
        userId: currentUser?.id || 'current-user',
        employeeId: currentUser?.employeeId || 'TE-SUP',
        executiveName: currentUser?.name || 'Support Executive',
        role: currentUser?.role || UserRole.SUPPORT_EXECUTIVE,
        date: todayStr,
        shiftStartTime: startTimeOverride || '09:30',
        shiftStartTimestamp: now.getTime() - 8 * 3600 * 1000,
        shiftEndTime: endTimeStr,
        shiftEndTimestamp: now.getTime(),
        breakMinutes: breakMinutes ?? 0,
        targetShiftMinutes: 480,
        status: 'Completed',
        notes: notes?.trim() || '',
        updatedAt: now.toISOString()
      };
      setShifts(prev => {
        const next = [completedRecord, ...prev.filter(s => s.id !== fallbackId)];
        try {
          localStorage.setItem('tedos_shifts_v1', JSON.stringify(next));
        } catch {}
        return next;
      });
      fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completedRecord)
      })
        .then(r => r.json())
        .then(json => {
          emitSystemToast({
            title: json.sheetSynced
              ? language === 'ur' ? 'شفٹ شیٹ میں محفوظ' : 'Shift Closed & Synced'
              : language === 'ur' ? 'شفٹ مقامی طور پر محفوظ' : 'Shift Closed Locally',
            message: json.sheetMessage || `Ended at ${endTimeStr}`,
            type: json.sheetSynced ? 'success' : 'warning'
          });
        })
        .catch(() => {});
      return completedRecord;
    }

    const updatedShift: ShiftRecord = {
      ...targetShift,
      shiftStartTime: startTimeOverride || targetShift.shiftStartTime,
      shiftEndTime: endTimeStr,
      shiftEndTimestamp: now.getTime(),
      breakMinutes: breakMinutes !== undefined ? breakMinutes : targetShift.breakMinutes || 0,
      status: 'Completed',
      notes: notes !== undefined ? notes : targetShift.notes,
      updatedAt: now.toISOString()
    };

    setShifts(prev => {
      const next = prev.map(s => (s.id === updatedShift.id ? updatedShift : s));
      try {
        localStorage.setItem('tedos_shifts_v1', JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      const res = await fetch(`/api/shifts/${encodeURIComponent(updatedShift.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedShift)
      });
      const json = await res.json().catch(() => ({}));
      emitSystemToast({
        title: json.sheetSynced
          ? language === 'ur' ? 'شفٹ مکمل و سنک ہو گئی' : 'Shift Completed & Synced'
          : language === 'ur' ? 'شفٹ سرور پر محفوظ' : 'Shift Saved on Server',
        message: json.sheetMessage || `Clocked out at ${endTimeStr}`,
        type: json.sheetSynced ? 'success' : 'info'
      });
    } catch (e) {
      console.warn('[AppContext] Failed to persist end shift to server:', e);
    }

    return updatedShift;
  };

  const updateShiftRecord = async (
    shiftId: string,
    updates: Partial<ShiftRecord>
  ): Promise<ShiftRecord | null> => {
    const existing = shifts.find(s => s.id === shiftId);
    if (!existing) return null;
    const updatedShift: ShiftRecord = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date().toISOString()
    };
    setShifts(prev => {
      const next = prev.map(s => (s.id === shiftId ? updatedShift : s));
      try {
        localStorage.setItem('tedos_shifts_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
    try {
      const res = await fetch(`/api/shifts/${encodeURIComponent(shiftId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedShift)
      });
      const json = await res.json().catch(() => ({}));
      emitSystemToast({
        title: language === 'ur' ? 'شفٹ ریکارڈ اپ ڈیٹ ہو گیا' : 'Shift Record Updated',
        message: json.sheetMessage || 'Shift details synchronized.',
        type: json.sheetSynced ? 'success' : 'info'
      });
    } catch (e) {
      console.warn('[AppContext] Failed to update shift record on server:', e);
    }
    return updatedShift;
  };

  return {
    shifts,
    setShifts,
    visibleShifts,
    activeTodayShift,
    startDailyShift,
    endDailyShift,
    updateShiftRecord
  };
}
