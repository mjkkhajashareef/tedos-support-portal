import { Client360 } from '../types';

export const validateClient360 = (client: Client360): string[] => {
  const errors: string[] = [];
  if (!client.id) errors.push('Client ID is required');
  if (!client.name) errors.push('Client Name is required');
  if (!client.basicInfo.email || !client.basicInfo.email.includes('@')) errors.push('Valid email is required');
  return errors;
};
