import { Session } from '../types';

const SESSION_KEY = 'auth_session';

export const authService = {
  saveSession: (session: Session) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },
  getSession: (): Session | null => {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    return sessionStr ? JSON.parse(sessionStr) : null;
  },
  clearSession: () => {
    localStorage.removeItem(SESSION_KEY);
  },
  refreshSession: async (refreshToken: string): Promise<Session | null> => {
    // This would call the API
    console.log('Refreshing session', refreshToken);
    return null;
  }
};
