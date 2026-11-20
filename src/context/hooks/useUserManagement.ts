/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  User,
  UserCreate,
  UserStatus,
  SupportClient,
  AppNotification
} from '../../types';
import { apiGateway } from '../../utils/apiGateway';
import { getLocalDateString } from '../../utils/helpers';
import {
  loadStoredUsers,
  saveStoredUsers,
  syncUsersWithServer,
  persistUserToServer
} from '../../utils/userDirectory';

interface UseUserManagementParams {
  currentUser: User | null;
  loginWithUser: (user: User) => Promise<void> | void;
  setClients: React.Dispatch<React.SetStateAction<SupportClient[]>>;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
}

export const normalize10DigitMobile = (raw?: string): string => {
  const digits = (raw || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

export function useUserManagement({
  currentUser,
  loginWithUser,
  setClients,
  addNotification
}: UseUserManagementParams) {
  const [users, setUsers] = useState<User[]>(() => loadStoredUsers());
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    syncUsersWithServer().then(res => {
      if (res && res.length > 0) setUsers(res);
    });

    const handleUserUpdate = () => setUsers(loadStoredUsers());
    window.addEventListener('tedos_users_updated', handleUserUpdate);

    const interval = setInterval(() => {
      syncUsersWithServer().then(res => {
        if (res && res.length > 0) setUsers(res);
      });
    }, 10000);

    return () => {
      window.removeEventListener('tedos_users_updated', handleUserUpdate);
      clearInterval(interval);
    };
  }, []);

  const addUser = async (user: UserCreate): Promise<User | undefined> => {
    try {
      const current = loadStoredUsers();
      const cleanMobile = normalize10DigitMobile(user.mobile);
      if (cleanMobile && cleanMobile.length === 10) {
        const dupUser = current.some(u => normalize10DigitMobile(u.mobile) === cleanMobile);
        if (dupUser) {
          throw new Error(
            'Ek mobile no. ki ek hi ID banni chahiye! Yeh mobile number pehle se kisi ID par registered hai.'
          );
        }
      }
      if (user.employeeId) {
        const dupEmpId = current.some(
          u => (u.employeeId || '').toLowerCase() === user.employeeId.trim().toLowerCase()
        );
        if (dupEmpId) {
          throw new Error(
            `Employee ID "${user.employeeId}" pehle se mojood hai. Har user ki alag ID honi chahiye.`
          );
        }
      }

      const newUser: User = {
        id: `usr-${Date.now()}`,
        employeeId: user.employeeId || `TE-${Math.floor(100 + Math.random() * 900)}`,
        name: user.name,
        designation: user.designation || user.role,
        email: user.email.toLowerCase(),
        mobile: user.mobile || '',
        role: user.role,
        department: user.department || 'Support Operations',
        reportingManager: user.reportingManager || 'Management',
        assignedRegion: user.assignedRegion || 'Global',
        assignedClients: user.assignedClients || [],
        status: UserStatus.ACTIVE,
        joiningDate: user.joiningDate || getLocalDateString(),
        lastLogin: 'Never',
        active: true,
        password: user.password || 'Welcome@123',
        baseSalary: user.baseSalary || 20000,
        monthlyIncentive: user.monthlyIncentive || 2000,
        isFreelancer: user.isFreelancer || false
      };

      const updated = [...current, newUser];
      saveStoredUsers(updated);
      setUsers(updated);

      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      }).catch(e => console.warn('Server user sync error:', e));

      try {
        await apiGateway.createUser(user);
      } catch (e) {
        console.warn('apiGateway createUser background error (stored locally):', e);
      }

      addNotification({
        title: 'User Created',
        message: `User ${user.name} (${newUser.employeeId}) has been successfully created.`,
        type: 'success'
      });

      return newUser;
    } catch (err) {
      console.error('Failed to create user', err);
      throw err;
    }
  };

  const refreshUsers = async () => {
    try {
      setUsersLoading(true);
      const srvUsers = await syncUsersWithServer();
      setUsers(srvUsers);
    } catch (err) {
      console.error('Failed to refresh users', err);
      setUsers(loadStoredUsers());
    } finally {
      setUsersLoading(false);
    }
  };

  const updateUser = async (user: User): Promise<User | undefined> => {
    try {
      const current = loadStoredUsers();
      const cleanMobile = normalize10DigitMobile(user.mobile);

      const isSameUser = (u: User) => {
        if (u.id && user.id && u.id === user.id) return true;
        if (
          u.employeeId &&
          user.employeeId &&
          u.employeeId.trim().toLowerCase() === user.employeeId.trim().toLowerCase()
        ) {
          return true;
        }
        if (
          u.email &&
          user.email &&
          u.email.trim().toLowerCase() === user.email.trim().toLowerCase()
        ) {
          return true;
        }
        return false;
      };

      if (cleanMobile && cleanMobile.length === 10) {
        const dupUser = current.find(
          u => !isSameUser(u) && normalize10DigitMobile(u.mobile) === cleanMobile
        );
        if (dupUser) {
          throw new Error(
            `Ek mobile no. ki ek hi ID banni chahiye! Yeh mobile number pehle se ${dupUser.name} (${dupUser.employeeId}) par registered hai.`
          );
        }
      }
      if (user.employeeId) {
        const dupEmp = current.find(
          u =>
            !isSameUser(u) &&
            (u.employeeId || '').trim().toLowerCase() === user.employeeId.trim().toLowerCase()
        );
        if (dupEmp) {
          throw new Error(`Employee ID "${user.employeeId}" pehle se ${dupEmp.name} ko assigned hai.`);
        }
      }

      let targetUpdatedUser: User | null = null;
      let found = false;
      const updatedList = current.map(u => {
        if (isSameUser(u)) {
          found = true;
          const upUser: User = {
            ...u,
            ...user,
            id: u.id || user.id,
            employeeId: user.employeeId.trim(),
            name: user.name.trim(),
            email: user.email.trim().toLowerCase(),
            mobile: user.mobile.trim(),
            password:
              user.password && user.password.trim()
                ? user.password.trim()
                : u.password || 'Admin@123',
            designation: user.designation || u.designation || user.role,
            department: user.department || u.department,
            role: user.role || u.role,
            baseSalary: user.baseSalary !== undefined ? Number(user.baseSalary) : u.baseSalary,
            monthlyIncentive:
              user.monthlyIncentive !== undefined
                ? Number(user.monthlyIncentive)
                : u.monthlyIncentive,
            assignedClients: user.assignedClients || u.assignedClients || []
          };
          targetUpdatedUser = upUser;
          return upUser;
        }
        return u;
      });

      if (!found) {
        targetUpdatedUser = user;
        updatedList.push(user);
      }

      saveStoredUsers(updatedList);
      setUsers(updatedList);

      if (
        currentUser &&
        targetUpdatedUser &&
        (currentUser.id === (targetUpdatedUser as User).id ||
          (currentUser.employeeId &&
            (currentUser.employeeId || '').toLowerCase() ===
              (targetUpdatedUser as User).employeeId.toLowerCase()) ||
          (currentUser.email &&
            (currentUser.email || '').toLowerCase() ===
              (targetUpdatedUser as User).email.toLowerCase()))
      ) {
        loginWithUser({ ...currentUser, ...(targetUpdatedUser as User) });
      }

      if (Array.isArray(user.assignedClients)) {
        setClients(prev =>
          prev.map(c =>
            user.assignedClients.includes(c.id)
              ? { ...c, assignedExecutive: user.name, assignedSupport: user.name }
              : c
          )
        );
      }

      await persistUserToServer(targetUpdatedUser || user);

      try {
        await apiGateway.updateUser(user.id, targetUpdatedUser || user);
      } catch (e) {
        console.warn('apiGateway background updateUser warning (saved locally):', e);
      }

      addNotification({
        title: 'User Updated',
        message: `Profile & Employee ID (${user.employeeId}) for ${user.name} updated successfully.`,
        type: 'success'
      });

      return targetUpdatedUser || user;
    } catch (err) {
      console.error('Failed to update user', err);
      throw err;
    }
  };

  const deactivateUser = async (id: string): Promise<User | undefined> => {
    try {
      const current = loadStoredUsers();
      let updatedUser: User | undefined;
      const updated = current.map(u => {
        if (u.id === id) {
          const nextActive = !u.active;
          updatedUser = {
            ...u,
            active: nextActive,
            status: nextActive ? UserStatus.ACTIVE : UserStatus.INACTIVE
          };
          return updatedUser;
        }
        return u;
      });
      saveStoredUsers(updated);
      setUsers(updated);

      if (updatedUser) await persistUserToServer(updatedUser);

      try {
        await apiGateway.updateUser(id, { id, active: updatedUser?.active });
      } catch (e) {
        console.warn('apiGateway background update failed:', e);
      }
      return updatedUser;
    } catch (err) {
      console.error('Failed to deactivate user', err);
      throw err;
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    try {
      const current = loadStoredUsers();
      const updated = current.filter(u => u.id !== id);
      saveStoredUsers(updated);
      setUsers(updated);

      fetch(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(e =>
        console.warn('Server user delete warning:', e)
      );

      try {
        await apiGateway.deleteUser(id);
      } catch (e) {
        console.warn('apiGateway background delete failed:', e);
      }

      addNotification({
        title: 'User Removed',
        message: 'Team member has been removed.',
        type: 'info'
      });
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  const resetUserPassword = async (id: string, newPassword?: string): Promise<string> => {
    try {
      const generated = newPassword || 'TE@' + Math.floor(100000 + Math.random() * 900000);
      const current = loadStoredUsers();
      let updatedUser: User | undefined;
      const updated = current.map(u => {
        if (u.id === id) {
          updatedUser = { ...u, password: generated };
          return updatedUser;
        }
        return u;
      });
      saveStoredUsers(updated);
      setUsers(updated);

      if (updatedUser) await persistUserToServer(updatedUser);

      try {
        await apiGateway.resetUserPassword(id, generated);
      } catch (e) {
        console.warn('apiGateway background reset password failed:', e);
      }

      addNotification({
        title: 'Password Reset',
        message: 'Password reset successfully. Temporary credentials issued.',
        type: 'success'
      });
      return generated;
    } catch (err) {
      console.error('Failed to reset user password', err);
      return newPassword || 'TE@' + Math.floor(100000 + Math.random() * 900000);
    }
  };

  return {
    users,
    setUsers,
    usersLoading,
    addUser,
    updateUser,
    deactivateUser,
    deleteUser,
    resetUserPassword,
    refreshUsers
  };
}
