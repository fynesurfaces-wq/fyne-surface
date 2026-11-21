import type { ProductSummary } from './types';
import { heightInFeet } from './utils';

/** Shared by the server (filtering) and the client FilterBar (labels/URLs). */
export const HEIGHT_BUCKETS = [
  { key: 'under-2ft', label: 'Under 2 ft', cm: 'Under 61 cm', test: (ft: number) => ft < 2 },
  { key: '2-4ft', label: '2 – 4 ft', cm: '61 – 122 cm', test: (ft: number) => ft >= 2 && ft < 4 },
  { key: '4-6ft', label: '4 – 6 ft', cm: '122 – 183 cm', test: (ft: number) => ft >= 4 && ft < 6 },
  { key: '6ft-plus', label: '6 ft & above', cm: '183 cm & above', test: (ft: number) => ft >= 6 },
] as const;

export const PRICE_BUCKETS = [
  { key: 'under-5k', label: 'Under ₹5,000', test: (p: number) => p < 5000 },
  { key: '5k-25k', label: '₹5,000 – ₹25,000', test: (p: number) => p >= 5000 && p < 25000 },
  { key: '25k-1l', label: '₹25,000 – ₹1,00,000', test: (p: number) => p >= 25000 && p < 100000 },
  { key: '1l-plus', label: '₹1,00,000 & above', test: (p: number) => p >= 100000 },
] as const;

export const SORTS = [
  { key: 'featured', label: 'Featured', api: undefined },
  { key: 'price-asc', label: 'Price: Low to High', api: 'price' },
  { key: 'price-desc', label: 'Price: High to Low', api: '-price' },
  { key: 'newest', label: 'Newest', api: '-createdAt' },
  { key: 'name', label: 'Name: A – Z', api: 'name' },
] as const;

export interface ActiveFilters {
  height: string[];
  price: string[];
  sort: string;
  unit: 'ft' | 'cm';
}

const list = (v?: string | string[]) => (Array.isArray(v) ? v : v ? v.split(',') : []).filter(Boolean);

export function parseFilters(sp: Record<string, string | string[] | undefined>): ActiveFilters {
  const heightKeys = new Set<string>(HEIGHT_BUCKETS.map((b) => b.key));
  const priceKeys = new Set<string>(PRICE_BUCKETS.map((b) => b.key));
  const sort = typeof sp.sort === 'string' && SORTS.some((s) => s.key === sp.sort) ? sp.sort : 'featured';
  return {
    height: list(sp.height).filter((k) => heightKeys.has(k)),
    price: list(sp.price).filter((k) => priceKeys.has(k)),
    sort,
    unit: sp.unit === 'cm' ? 'cm' : 'ft',
  };
}

export const sortToApi = (key: string) => SORTS.find((s) => s.key === key)?.api;

const matchesHeight = (p: ProductSummary, keys: string[]) => {
  if (!keys.length) return true;
  const ft = heightInFeet(p.specifications?.height);
  if (ft === undefined) return false;
  return HEIGHT_BUCKETS.some((b) => keys.includes(b.key) && b.test(ft));
};
const matchesPrice = (p: ProductSummary, keys: string[]) => !keys.length || PRICE_BUCKETS.some((b) => keys.includes(b.key) && b.test(p.price.amount));

export function applyFilters(products: ProductSummary[], f: ActiveFilters) {
  return products.filter((p) => matchesHeight(p, f.height) && matchesPrice(p, f.price));
}

/** Facet counts (each facet counted with the OTHER facet applied, like Shopify). */
export function facetCounts(products: ProductSummary[], f: ActiveFilters) {
  const byPrice = products.filter((p) => matchesPrice(p, f.price));
  const byHeight = products.filter((p) => matchesHeight(p, f.height));
  return {
    height: Object.fromEntries(HEIGHT_BUCKETS.map((b) => [b.key, byPrice.filter((p) => matchesHeight(p, [b.key])).length])),
    price: Object.fromEntries(PRICE_BUCKETS.map((b) => [b.key, byHeight.filter((p) => matchesPrice(p, [b.key])).length])),
    hasHeights: products.some((p) => heightInFeet(p.specifications?.height) !== undefined),
  };
}
