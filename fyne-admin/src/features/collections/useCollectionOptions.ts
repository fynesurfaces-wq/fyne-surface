'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { qk } from '@/lib/queries';
import type { Collection, ListResponse } from '@/lib/types';

/** All collections for selects/filters (small list → one request). */
export function useCollectionOptions() {
  return useQuery({
    queryKey: qk.collectionOptions,
    queryFn: () => get<ListResponse<Collection>>('/admin/collections', { params: { limit: 100, sort: 'sortOrder,name' } }).then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}
