import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
/** ₹1,69,500 */
export const formatINR = (n: number) => inr.format(Number(n) || 0);

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001').replace(/\/$/, '');

/** Make absolute backend URLs (https://www.fynesurfaces.com/products/x) relative for in-site links. */
export const toPath = (url: string) => {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
};

/** Height in feet from typed specs (for filtering & display). */
export function heightInFeet(h?: { value?: number; unit?: string }) {
  if (h?.value == null) return undefined;
  const factor = { ft: 1, m: 3.28084, cm: 0.0328084, in: 1 / 12 }[h.unit || 'ft'] ?? 1;
  return h.value * factor;
}

export const ftToCm = (ft: number) => Math.round(ft * 30.48);

/** Safely serialise JSON-LD into a <script> (prevents </script> injection). */
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
