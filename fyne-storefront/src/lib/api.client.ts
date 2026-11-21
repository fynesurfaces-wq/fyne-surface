'use client';

import axios from 'axios';

/** Browser → same-origin /api/v1 (proxied to the Express API by next.config rewrites). */
export const api = axios.create({ baseURL: '/api/v1', timeout: 30000, headers: { 'Content-Type': 'application/json' } });

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
