import api from './api';
import type { User, LoginCredentials, LoginResponse } from '../types';

const STORAGE_KEY = 'transitops_user';
const TOKEN_KEY = 'transitops_token';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const res = await api.post('/auth/login', credentials);
    const { access_token } = res.data;

    // Decode user info from token or fetch from /auth/me if available
    const user: User = {
      id: '',
      name: credentials.email.split('@')[0],
      email: credentials.email,
      role: 'Fleet Manager',
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return { user, token: access_token };
  },

  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },

  async getMe(): Promise<User | null> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as User; } catch { return null; }
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};
