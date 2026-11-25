'use client';

import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, useAuthStore } from './auth-store';
import type { ApiErrorBody, Session } from './types';

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api/v1';

/**
 * Axios instance for every admin call.
 *  - withCredentials: lets the browser send/receive the HttpOnly refresh cookie
 *  - request interceptor: attaches the in-memory access token
 *  - response interceptor: on 401 → refresh once (single-flight) → retry
 */
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

/** Bare client for auth endpoints — no interceptors, so refresh can't loop. */
const authClient = axios.create({ baseURL: API_BASE, withCredentials: true, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

// ── Refresh (single-flight) ───────────────────────────────────────────────
// If 5 requests fail with 401 at the same moment, only ONE refresh call is
// made; the other 4 wait for it and then retry with the new token.
let refreshPromise: Promise<string> | null = null;

export async function refreshSession(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = authClient
      .post<{ data: Session }>('/auth/refresh')
      .then(({ data }) => {
        useAuthStore.getState().setSession(data.data);
        return data.data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Codes that mean "your access token is no good, but a refresh may fix it".
const REFRESHABLE = new Set(['TOKEN_EXPIRED', 'INVALID_TOKEN', 'NO_TOKEN']);

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ error?: ApiErrorBody }>) => {
    const original = error.config as RetriableConfig | undefined;
    const code = error.response?.data?.error?.code;

    if (error.response?.status === 401 && original && !original._retry && (!code || REFRESHABLE.has(code))) {
      original._retry = true;
      try {
        const token = await refreshSession();
        original.headers.set('Authorization', `Bearer ${token}`);
        return api(original);
      } catch {
        forceLogout();
      }
    } else if (error.response?.status === 401 && code && !REFRESHABLE.has(code)) {
      // ACCOUNT_DISABLED, PASSWORD_CHANGED … → session is dead.
      forceLogout();
    }
    return Promise.reject(error);
  }
);

function forceLogout() {
  useAuthStore.getState().clearSession();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`/login?next=${next}&expired=1`);
  }
}

// ── Auth calls ────────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const { data } = await authClient.post<{ data: Session }>('/auth/login', { email, password });
  useAuthStore.getState().setSession(data.data);
  return data.data;
}

export async function logout() {
  try {
    await authClient.post('/auth/logout');
  } finally {
    useAuthStore.getState().clearSession();
  }
}

// ── Error helpers ─────────────────────────────────────────────────────────
export function getApiError(err: unknown): ApiErrorBody {
  if (axios.isAxiosError(err)) {
    const body = (err.response?.data as { error?: ApiErrorBody } | undefined)?.error;
    if (body) return body;
    if (err.code === 'ECONNABORTED') return { code: 'TIMEOUT', message: 'The server took too long to respond.' };
    if (!err.response) return { code: 'NETWORK', message: 'We couldn’t reach the server. Check your connection and try again.' };
    if (err.response.status >= 500) return { code: err.response.status === 503 ? 'SERVICE_UNAVAILABLE' : 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' };
    return { code: `HTTP_${err.response.status}`, message: 'The request could not be completed.' };
  }
  return { code: 'UNKNOWN', message: 'Something went wrong. Please try again.' };
}

export const getErrorMessage = (err: unknown) => getApiError(err).message;

/** Field-level validation errors (HTTP 422) → [{ field, message }] */
export function getFieldErrors(err: unknown): { field: string; message: string }[] {
  const d = getApiError(err).details;
  return Array.isArray(d) ? d : [];
}

// Typed helpers
export const get = <T>(url: string, config?: AxiosRequestConfig) => api.get<T>(url, config).then((r) => r.data);
export const post = <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => api.post<T>(url, body, config).then((r) => r.data);
export const patch = <T>(url: string, body?: unknown) => api.patch<T>(url, body).then((r) => r.data);
export const del = <T>(url: string) => api.delete<T>(url).then((r) => r.data);
