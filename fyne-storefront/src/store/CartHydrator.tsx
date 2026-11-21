'use client';

import { useEffect } from 'react';
import { hydrateCart } from './cart';

/** Loads the persisted cart from localStorage after the first client render. */
export function CartHydrator() {
  useEffect(() => hydrateCart(), []);
  return null;
}
