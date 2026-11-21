import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const inrCompact = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 });
const num = new Intl.NumberFormat('en-IN');

/** ₹1,25,000 */
export const formatINR = (n: number | undefined | null) => inr.format(Number(n) || 0);
/** ₹1.3L */
export const formatINRCompact = (n: number | undefined | null) => inrCompact.format(Number(n) || 0);
export const formatNumber = (n: number | undefined | null) => num.format(Number(n) || 0);

export const formatDate = (d?: string | Date, withTime = false) =>
  d
    ? new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...(withTime && { hour: 'numeric', minute: '2-digit' }),
        timeZone: 'Asia/Kolkata',
      }).format(new Date(d))
    : '—';

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

/** "tree, palm , tall" → ["tree","palm","tall"] */
export const splitList = (s?: string) =>
  (s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
