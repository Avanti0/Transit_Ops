import api from './api';
import type { User, LoginCredentials, LoginResponse } from '../types';

const STORAGE_KEY = 'transitops_user';
const TOKEN_KEY = 'transitops_token';

/** Map backend UserResponse snake_case → frontend User camelCase */
function mapUser(raw: any): User {
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    email: raw.email ?? '',
    // Backend returns role as { id, role_name } nested object
    role: (raw.role?.role_name ?? raw.role ?? 'Fleet Manager') as User['role'],
    createdAt: raw.created_at ?? new Date().toISOString(),
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    // 1. Exchange credentials for a JWT token
    const tokenRes = await api.post('/auth/login', credentials);
    const { access_token } = tokenRes.data;

    // 2. Store the token so the next request carries it
    localStorage.setItem(TOKEN_KEY, access_token);

    // 3. Fetch real user profile (id, name, role) from /auth/me
    const meRes = await api.get('/auth/me');
    const user = mapUser(meRes.data);

    // 4. Persist the resolved profile
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
