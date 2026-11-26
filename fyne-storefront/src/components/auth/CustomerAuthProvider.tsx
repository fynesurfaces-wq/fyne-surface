'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api.client';

export type CustomerSession = { id: string; name: string; email: string; phone: string; emailVerified: boolean };
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
type CustomerAuthContextValue = {
  customer: CustomerSession | null;
  status: AuthStatus;
  refreshCustomer: () => Promise<CustomerSession | null>;
  logout: () => Promise<void>;
};

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const refreshCustomer = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await api.get<{ data: { customer: CustomerSession | null } }>('/auth/customer/profile');
      setCustomer(response.data.data.customer);
      setStatus(response.data.data.customer ? 'authenticated' : 'unauthenticated');
      return response.data.data.customer;
    } catch {
      setCustomer(null);
      setStatus('unauthenticated');
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/customer/logout');
    setCustomer(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => { void refreshCustomer(); }, [refreshCustomer]);

  return <CustomerAuthContext.Provider value={{ customer, status, refreshCustomer, logout }}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) throw new Error('useCustomerAuth must be used inside CustomerAuthProvider');
  return context;
}
