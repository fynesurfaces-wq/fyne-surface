'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from './api';
import type { NavigationData } from './types';

/** Badge counts (orders to fulfil, low stock, new leads) for sidebar + bell. */
export function useNavigation() {
  return useQuery({
    queryKey: ['navigation'],
    queryFn: () => get<{ data: NavigationData }>('/admin/navigation').then((r) => r.data),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export const qk = {
  products: (state: unknown) => ['products', state] as const,
  product: (id: string) => ['product', id] as const,
  collections: (state: unknown) => ['collections', state] as const,
  collectionOptions: ['collections', 'options'] as const,
  orders: (state: unknown) => ['orders', state] as const,
  order: (id: string) => ['order', id] as const,
  users: (state: unknown) => ['users', state] as const,
  dashboard: (range: string) => ['dashboard', range] as const,
};
