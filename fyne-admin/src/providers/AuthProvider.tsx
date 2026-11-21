'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { login as apiLogin, logout as apiLogout, refreshSession } from '@/lib/api';
import type { Role, User } from '@/lib/types';

interface AuthContextValue {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: User | null;
  role: Role | undefined;
  permissions: string[];
  can: (permission: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Restores the session on first load (silent refresh via the HttpOnly cookie)
 * and exposes `can(permission)` to the whole app.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status, user, permissions, setStatus } = useAuthStore();
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return; // StrictMode runs effects twice in dev
    bootstrapped.current = true;
    if (useAuthStore.getState().accessToken) return;
    refreshSession().catch(() => setStatus('unauthenticated'));
  }, [setStatus]);

  const login = useCallback(async (email: string, password: string) => {
    await apiLogin(email, password);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    queryClient.clear(); // never leak cached data to the next user on this browser
    router.replace('/login');
  }, [queryClient, router]);

  const value = useMemo<AuthContextValue>(() => {
    const set = new Set(permissions);
    return {
      status,
      user,
      role: user?.role,
      permissions,
      can: (p: string) => set.has(p),
      login,
      logout,
    };
  }, [status, user, permissions, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** <Can permission="products:delete">…</Can> */
export function Can({ permission, children, fallback = null }: { permission: string; children: React.ReactNode; fallback?: React.ReactNode }) {
  const { can } = useAuth();
  return <>{can(permission) ? children : fallback}</>;
}
