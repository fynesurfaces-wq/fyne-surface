'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import axios from 'axios';
import { AuthProvider } from './AuthProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (count, err) => {
              // Don't retry auth/permission/validation errors.
              const status = axios.isAxiosError(err) ? err.response?.status : undefined;
              if (status && status >= 400 && status < 500) return false;
              return count < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{ classNames: { toast: 'font-sans rounded-xl border border-border shadow-pop' } }}
      />
    </QueryClientProvider>
  );
}
