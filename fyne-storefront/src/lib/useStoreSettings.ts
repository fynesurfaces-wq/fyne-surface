'use client';

import { useEffect, useState } from 'react';
import { api } from './api.client';
import type { StoreSettings } from './types';

let cache: StoreSettings | null = null;

/** Shipping/tax rules for client-side estimates (server recomputes the real totals). */
export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(cache);
  useEffect(() => {
    if (cache) return;
    api.get<{ data: StoreSettings }>('/store/settings').then((r) => {
      cache = r.data.data;
      setSettings(cache);
    }).catch(() => {});
  }, []);
  return settings;
}

export function estimateShipping(subtotal: number, s: StoreSettings | null, freeShipping = false) {
  if (!s || freeShipping) return 0;
  const { flatRate = 0, freeShippingThreshold = 0 } = s.shipping || {};
  if (!flatRate) return 0;
  if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) return 0;
  return flatRate;
}
