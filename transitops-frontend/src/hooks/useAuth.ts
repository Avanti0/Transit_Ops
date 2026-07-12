import { useState, useEffect, useCallback } from 'react';
import type { User, LoginCredentials } from '../types';
import { authService } from '../services/authService';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    authService
      .getMe()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const { user: loggedIn } = await authService.login(credentials);
      setUser(loggedIn);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err; // re-throw so callers can react (e.g. show toast)
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
  };
}
