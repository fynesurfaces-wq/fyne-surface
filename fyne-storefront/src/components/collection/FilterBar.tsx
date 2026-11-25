'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Loader2, X } from 'lucide-react';
import { HEIGHT_BUCKETS, PRICE_BUCKETS, SORTS, type ActiveFilters } from '@/lib/filters';
import { cn } from '@/lib/utils';

type Counts = { height: Record<string, number>; price: Record<string, number>; hasHeights: boolean };

/**
 * Top filter bar: Height (ft/cm) · Price · Sort. State lives in the URL
 * (?height=2-4ft,4-6ft&price=25k-1l&sort=price-asc&unit=cm) so filtered views
 * are shareable and server-rendered.
 */
export function FilterBar({ active, counts, total }: { active: ActiveFilters; counts: Counts; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState<null | 'height' | 'price' | 'sort'>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => barRef.current && !barRef.current.contains(e.target as Node) && setOpen(null);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, []);

  const push = useCallback(
    (mut: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mut(next);
      const qs = next.toString();
      startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [params, pathname, router]
  );

  const toggle = (name: 'height' | 'price', key: string) =>
    push((p) => {
      const cur = new Set((p.get(name) || '').split(',').filter(Boolean));
      cur.has(key) ? cur.delete(key) : cur.add(key);
      cur.size ? p.set(name, [...cur].join(',')) : p.delete(name);
    });

  const chips = [
    ...active.height.map((k) => ({ name: 'height' as const, key: k, label: (active.unit === 'cm' ? HEIGHT_BUCKETS.find((b) => b.key === k)?.cm : HEIGHT_BUCKETS.find((b) => b.key === k)?.label) || k })),
    ...active.price.map((k) => ({ name: 'price' as const, key: k, label: PRICE_BUCKETS.find((b) => b.key === k)?.label || k })),
  ];

  const pill = (isOpen: boolean, isActive: boolean) =>
    cn(
      'flex h-11 items-center gap-2 whitespace-nowrap rounded-full border px-5 text-sm font-medium transition-colors',
      isActive ? 'border-ink bg-ink text-white' : isOpen ? 'border-ink text-ink' : 'border-line text-ink-soft hover:border-ink/40 hover:text-ink'
    );

  return (
    <div ref={barRef} className="sticky top-[72px] z-30 -mx-5 border-b border-line bg-white/90 px-5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-20 lg:mx-0 lg:px-0">
      <div className="flex flex-wrap items-center gap-3 py-4 sm:flex-nowrap">
        <div className="flex basis-full flex-wrap items-center gap-2.5 sm:min-w-0 sm:basis-auto sm:flex-1 sm:flex-nowrap sm:overflow-x-auto sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden lg:overflow-visible">
          {counts.hasHeights && (
            <Dropdown label={`Height${active.height.length ? ` · ${active.height.length}` : ''}`} isOpen={open === 'height'} onToggle={() => setOpen(open === 'height' ? null : 'height')} className={pill(open === 'height', active.height.length > 0)}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Height</span>
                <div className="flex rounded-full bg-canvas p-0.5 text-xs font-semibold" role="group" aria-label="Height unit">
                  {(['ft', 'cm'] as const).map((u) => (
                    <button key={u} onClick={() => push((p) => (u === 'ft' ? p.delete('unit') : p.set('unit', u)))} className={cn('rounded-full px-3 py-1 transition', active.unit === u ? 'bg-white text-ink shadow-sm' : 'text-ink-muted')} aria-pressed={active.unit === u}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              {HEIGHT_BUCKETS.map((b) => (
                <Option key={b.key} checked={active.height.includes(b.key)} count={counts.height[b.key]} onClick={() => toggle('height', b.key)}>
                  {active.unit === 'cm' ? b.cm : b.label}
                </Option>
              ))}
            </Dropdown>
          )}

          <Dropdown label={`Price${active.price.length ? ` · ${active.price.length}` : ''}`} isOpen={open === 'price'} onToggle={() => setOpen(open === 'price' ? null : 'price')} className={pill(open === 'price', active.price.length > 0)}>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-muted">Price</span>
            {PRICE_BUCKETS.map((b) => (
              <Option key={b.key} checked={active.price.includes(b.key)} count={counts.price[b.key]} onClick={() => toggle('price', b.key)}>
                {b.label}
              </Option>
            ))}
          </Dropdown>

          <AnimatePresence initial={false}>
            {chips.map((c) => (
              <motion.button
                key={`${c.name}-${c.key}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => toggle(c.name, c.key)}
                className="hidden h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary-50 pl-3.5 pr-2.5 text-[13px] font-medium text-primary-800 hover:bg-primary-100 md:flex"
                aria-label={`Remove filter ${c.label}`}
              >
                {c.label} <X className="h-3.5 w-3.5" />
              </motion.button>
            ))}
          </AnimatePresence>
          {chips.length > 0 && (
            <button onClick={() => push((p) => { p.delete('height'); p.delete('price'); })} className="whitespace-nowrap px-2 text-sm font-medium text-ink-muted underline-offset-4 hover:text-ink hover:underline">
              Clear all
            </button>
          )}
        </div>

        <span className="hidden items-center gap-2 whitespace-nowrap text-sm text-ink-muted sm:flex" aria-live="polite">
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {total} {total === 1 ? 'product' : 'products'}
        </span>

        <Dropdown align="right" label={`Sort: ${SORTS.find((s) => s.key === active.sort)?.label}`} isOpen={open === 'sort'} onToggle={() => setOpen(open === 'sort' ? null : 'sort')} className={cn(pill(open === 'sort', false), 'ml-auto sm:ml-0')}>
          {SORTS.map((s) => (
            <Option key={s.key} radio checked={active.sort === s.key} onClick={() => { push((p) => (s.key === 'featured' ? p.delete('sort') : p.set('sort', s.key))); setOpen(null); }}>
              {s.label}
            </Option>
          ))}
        </Dropdown>
      </div>
    </div>
  );
}

function Dropdown({ label, isOpen, onToggle, className, children, align = 'left' }: { label: string; isOpen: boolean; onToggle: () => void; className: string; children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <div className="relative shrink-0">
      <button onClick={onToggle} className={className} aria-expanded={isOpen} aria-haspopup="true">
        {label} <ChevronDown className={cn('h-4 w-4 transition-transform duration-300', isOpen && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className={cn('fixed left-5 right-5 z-40 mt-2 rounded-2xl border border-line bg-white p-4 shadow-lift sm:absolute sm:left-auto sm:right-auto sm:w-72', align === 'right' ? 'sm:right-0' : 'sm:left-0')}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Option({ checked, count, onClick, children, radio }: { checked: boolean; count?: number; onClick: () => void; children: React.ReactNode; radio?: boolean }) {
  const disabled = count === 0 && !checked;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      role={radio ? 'menuitemradio' : 'menuitemcheckbox'}
      aria-checked={checked}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm text-ink transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center border transition', radio ? 'rounded-full' : 'rounded-md', checked ? 'border-primary bg-primary text-white' : 'border-ink/20')}>
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className="flex-1">{children}</span>
      {count !== undefined && <span className="text-xs tabular-nums text-ink-faint">{count}</span>}
    </button>
  );
}
