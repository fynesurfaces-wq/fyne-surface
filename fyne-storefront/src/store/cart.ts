'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Cart state (persisted to localStorage so it survives reloads).
 *
 * Prices stored here are for DISPLAY only — the backend re-prices every line
 * from the database at checkout, so a tampered cart can't change what's charged.
 */
export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  price: number;
  image: string | null;
  imageUnoptimized?: boolean;
  collection?: string;
  qty: number;
}

export const MAX_QTY = 50;

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  /** true once persisted state has loaded (avoids SSR/client count mismatch) */
  hydrated: boolean;
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      hydrated: false,
      addItem: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === item.productId);
          const items = existing
            ? s.items.map((i) => (i.productId === item.productId ? { ...i, ...item, qty: Math.min(MAX_QTY, i.qty + qty) } : i))
            : [...s.items, { ...item, qty: Math.min(MAX_QTY, qty) }];
          return { items, isOpen: true };
        }),
      updateQty: (productId, qty) =>
        set((s) => ({
          items: qty <= 0 ? s.items.filter((i) => i.productId !== productId) : s.items.map((i) => (i.productId === productId ? { ...i, qty: Math.min(MAX_QTY, qty) } : i)),
        })),
      removeItem: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: 'fyne-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }), // never persist UI state
      // Hydration is triggered manually below (see the note there).
      skipHydration: true,
    }
  )
);

// Derived selectors
export const selectCount = (s: CartState) => s.items.reduce((n, i) => n + i.qty, 0);
export const selectSubtotal = (s: CartState) => s.items.reduce((n, i) => n + i.price * i.qty, 0);

/*
 * Load the saved cart as soon as this module runs in the browser — BEFORE any
 * component effect calls set() (e.g. the drawer's close-on-navigate), which
 * would otherwise persist an empty cart over the saved one.
 * The `hydrated` flag is flipped later, after mount (CartHydrator), so the
 * server HTML and the first client render still match.
 */
if (typeof window !== 'undefined') void useCart.persist.rehydrate();

/** Called once after mount by <CartHydrator/>. */
export function hydrateCart() {
  const done = () => useCart.setState({ hydrated: true });
  if (useCart.persist.hasHydrated()) return done();
  const unsub = useCart.persist.onFinishHydration(() => {
    done();
    unsub();
  });
}
