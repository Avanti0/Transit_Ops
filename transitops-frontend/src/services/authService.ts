import { api } from './api';
import type { User, LoginCredentials, LoginResponse } from '../types';

const STORAGE_KEY = 'transitops_user';
const TOKEN_KEY = 'transitops_token';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const res = await api.post<{ access_token: string; token_type: string }>('/auth/login', credentials);
    const token = res.data.access_token;
    localStorage.setItem(TOKEN_KEY, token);

    // Fetch user details from /auth/me
    const userRes = await api.get<any>('/auth/me');
    
    // Map backend response role structure to frontend flat string role
    const user: User = {
      id: userRes.data.id,
      name: userRes.data.name,
      email: userRes.data.email,
      role: userRes.data.role.role_name,
      createdAt: userRes.data.created_at || new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return { user, token };
  },

  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },

  async getMe(): Promise<User | null> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY) && !!localStorage.getItem(STORAGE_KEY);
  },
};
