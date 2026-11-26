import 'server-only';
import type { BlogEntry, CollectionDetail, CollectionSummary, ContentPage, LegacySiteContent, Pagination, ProductDetail, ProductSummary, StoreSettings } from './types';

/**
 * Server-side data layer (Server Components only).
 *
 * Uses native fetch so Next.js caches responses in its Data Cache and
 * revalidates them in the background (ISR). Search engines and AI crawlers
 * always receive fully rendered HTML with every price, spec and JSON-LD block.
 */
const API_ROOT = `${process.env.API_ORIGIN || 'http://localhost:5000'}/api/v1`;
const API = `${API_ROOT}/store`;

export const REVALIDATE = 300; // seconds — product/collection data refresh window

class NotFoundError extends Error {}

async function storeFetch<T>(path: string, { revalidate = REVALIDATE, tags = [] as string[] } = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    next: { revalidate, tags: ['store', ...tags] },
    headers: { Accept: 'application/json' },
  });
  if (res.status === 404) throw new NotFoundError(path);
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

/** Returns null instead of throwing for 404 (→ notFound()) or when the API is unreachable. */
async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (err) {
    if (!(err instanceof NotFoundError)) console.error('[storefront api]', (err as Error).message);
    return fallback;
  }
}

const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== null && v !== '' && s.set(k, String(v)));
  const str = s.toString();
  return str ? `?${str}` : '';
};

export const getSettings = () =>
  safe(storeFetch<{ data: StoreSettings }>('/settings', { revalidate: 600, tags: ['settings'] }).then((r) => r.data), null);

export const getCollections = () =>
  safe(storeFetch<{ data: CollectionSummary[] }>('/collections', { tags: ['collections'] }).then((r) => r.data), [] as CollectionSummary[]);

export const getCollection = (slug: string, params: { page?: number; sort?: string; limit?: number } = {}) =>
  safe(
    storeFetch<{ data: CollectionDetail; pagination: Pagination }>(`/collections/${encodeURIComponent(slug)}${qs(params)}`, { tags: [`collection:${slug}`] }),
    null
  );

export interface ProductQuery {
  collection?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  newArrival?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}

export const getProducts = (params: ProductQuery = {}) =>
  safe(
    storeFetch<{ data: ProductSummary[]; pagination: Pagination; jsonLd?: Record<string, unknown> }>(`/products${qs({ ...params })}`, { tags: ['products'], ...(params.newArrival && { revalidate: 60 }) }),
    { data: [] as ProductSummary[], pagination: { page: 1, limit: 0, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false } as Pagination, jsonLd: undefined }
  );

/** Public MongoDB text search endpoint; don't cache user-entered queries in the ISR data cache. */
export const searchProducts = async (q: string, limit = 50) => {
  const params = new URLSearchParams({ q: q.slice(0, 100), limit: String(limit) });
  try {
    const response = await fetch(`${API_ROOT}/products/search?${params}`, { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!response.ok) return { data: [] as ProductSummary[], pagination: null as { total: number } | null };
    const body = await response.json() as { data: ProductSummary[]; pagination: { total: number } };
    return body;
  } catch (err) {
    console.error('[storefront search]', (err as Error).message);
    return { data: [] as ProductSummary[], pagination: null as { total: number } | null };
  }
};

export const getProduct = (slug: string) =>
  safe(storeFetch<{ data: ProductDetail }>(`/products/${encodeURIComponent(slug)}`, { tags: [`product:${slug}`] }).then((r) => r.data), null);

export const getContentPage = (slug: string) =>
  safe(storeFetch<{ data: ContentPage }>(`/content/pages/${encodeURIComponent(slug)}`, { revalidate: 600 }).then((r) => r.data), null);

export const getBlogPosts = (params: { page?: number; limit?: number } = {}) =>
  safe(
    storeFetch<{ data: BlogEntry[]; pagination: Pagination }>(`/content/blog${qs(params)}`, { revalidate: 60, tags: ['blog'] }),
    { data: [] as BlogEntry[], pagination: { page: 1, limit: 0, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false } as Pagination }
  );

export const getBlogPost = (slug: string) =>
  safe(storeFetch<{ data: BlogEntry }>(`/content/blog/${encodeURIComponent(slug)}`, { revalidate: 60, tags: [`blog:${slug}`] }).then((r) => r.data), null);

export const getLegacySiteContent = () =>
  safe(storeFetch<{ data: LegacySiteContent }>('/site-content/legacy', { revalidate: 60, tags: ['site-content'] }).then((r) => r.data), null);
