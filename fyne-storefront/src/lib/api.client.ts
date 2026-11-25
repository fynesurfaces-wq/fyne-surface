'use client';

import axios, { type InternalAxiosRequestConfig } from 'axios';

/** Browser → same-origin /api/v1 (proxied to the Express API by next.config rewrites). */
export const api = axios.create({ baseURL: '/api/v1', timeout: 30000, withCredentials: true, headers: { 'Content-Type': 'application/json' } });

type CustomerRetriableConfig = InternalAxiosRequestConfig & { _customerRefreshRetry?: boolean };
let customerRefreshPromise: Promise<void> | null = null;

api.interceptors.response.use((response) => response, async (error) => {
  const original = error.config as CustomerRetriableConfig | undefined;
  const url = String(original?.url || '');
  const code = error.response?.data?.error?.code;
  const isCustomerProtected = url.startsWith('/orders') || url.startsWith('/auth/customer/profile') || url.startsWith('/auth/customer/orders');
  const canRefresh = error.response?.status === 401 && code === 'CUSTOMER_SESSION_EXPIRED';
  if (!original || original._customerRefreshRetry || !isCustomerProtected || !canRefresh) throw error;
  original._customerRefreshRetry = true;
  if (!customerRefreshPromise) {
    customerRefreshPromise = api.post('/auth/customer/refresh').then(() => undefined).finally(() => { customerRefreshPromise = null; });
  }
  try {
    await customerRefreshPromise;
    return api(original);
  } catch {
    throw error;
  }
});

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export function apiError(err: unknown): ApiErrorBody {
  if (axios.isAxiosError(err)) {
    const body = (err.response?.data as { error?: ApiErrorBody } | undefined)?.error;
    if (body) return body;
    if (!err.response) return { code: 'NETWORK', message: 'We couldn’t reach our servers. Please check your connection and try again.' };
  }
  return { code: 'UNKNOWN', message: 'Something went wrong. Please try again.' };
}
