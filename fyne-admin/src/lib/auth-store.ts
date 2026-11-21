'use client';

import { create } from 'zustand';
import type { Session, User } from './types';

/**
 * Session state lives IN MEMORY only (never localStorage/sessionStorage), so
 * an XSS payload can't steal a persisted token. On a full page reload the
 * store is empty and AuthProvider silently calls /auth/refresh — the browser
 * sends the HttpOnly refresh cookie automatically.
 *
 * Zustand (not just React context) because the Axios interceptor — which
 * lives outside React — must read and update the token.
 */
type Status = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: Status;
  accessToken: string | null;
  user: User | null;
  permissions: string[];
  setSession: (s: Session) => void;
  clearSession: () => void;
  setStatus: (s: Status) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  accessToken: null,
  user: null,
  permissions: [],
  setSession: ({ accessToken, user, permissions }) => set({ accessToken, user, permissions, status: 'authenticated' }),
  clearSession: () => set({ accessToken: null, user: null, permissions: [], status: 'unauthenticated' }),
  setStatus: (status) => set({ status }),
}));

/** Non-React accessors for the Axios layer. */
export const getAccessToken = () => useAuthStore.getState().accessToken;
