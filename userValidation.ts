import { UserCreate, UserUpdate } from '../types';

export const validateUser = (user: UserCreate | UserUpdate): string[] => {
  const errors: string[] = [];
  if (!user.name) errors.push('Name is required');
  if (!user.email || !user.email.includes('@')) errors.push('Valid email is required');
  if (!user.employeeId) errors.push('Employee ID is required');
  if (!user.role) errors.push('Role is required');
  return errors;
};
