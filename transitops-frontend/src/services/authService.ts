import type { User, LoginCredentials, LoginResponse } from '../types';

const STORAGE_KEY = 'transitops_user';
const TOKEN_KEY = 'transitops_token';

// Predefined user accounts
const PREDEFINED_USERS: (User & { password: string })[] = [
  {
    id: 'u1',
    name: 'Admin User',
    email: 'admin@transitops.com',
    role: 'Fleet Manager',
    password: 'admin123',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'u2',
    name: 'Ravi Kumar',
    email: 'driver@transitops.com',
    role: 'Driver',
    password: 'driver123',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'u3',
    name: 'Safety Officer',
    email: 'safety@transitops.com',
    role: 'Safety Officer',
    password: 'safety123',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'u4',
    name: 'Finance Analyst',
    email: 'finance@transitops.com',
    role: 'Financial Analyst',
    password: 'finance123',
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const delay = (ms = 400) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    await delay();
    const match = PREDEFINED_USERS.find(
      (u) => u.email === credentials.email && u.password === credentials.password,
    );
    if (!match) throw new Error('Invalid email or password');

    const { password: _pw, ...user } = match;
    const token = btoa(`${user.id}:${user.email}:${Date.now()}`);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);

    return { user, token };
  },

  async logout(): Promise<void> {
    await delay(100);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },

  async getMe(): Promise<User | null> {
    await delay(100);
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
