'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { FolderTree, Loader2, Package, Search, ShoppingBag, Users, FileText } from 'lucide-react';
import { get } from '@/lib/api';
import { useClickOutside, useDebounce } from '@/lib/hooks';
import type { SearchResultItem, SearchResults } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Thumb } from '@/components/ui/misc';

const GROUPS: { key: keyof SearchResults; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'products', label: 'Products', icon: Package },
  { key: 'collections', label: 'Collections', icon: FolderTree },
  { key: 'orders', label: 'Orders', icon: ShoppingBag },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'content', label: 'Content', icon: FileText },
];

/** Maps API result paths to routes that exist in this admin. */
function toAdminRoute(group: keyof SearchResults, item: SearchResultItem) {
  switch (group) {
    case 'products': return `/dashboard/products?edit=${item.id}`;
    case 'collections': return `/dashboard/collections?edit=${item.id}`;
    case 'orders': return `/dashboard/orders?open=${item.id}`;
    default: return null; // customers/content pages not built yet
  }
}

/** Global search (Ctrl/⌘ + K) across everything the user may see. */
export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounced = useDebounce(q.trim(), 250);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(boxRef, close, open);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => get<{ data: SearchResults }>('/admin/search', { params: { q: debounced } }).then((r) => r.data),
    enabled: debounced.length >= 2,
    staleTime: 10_000,
  });

  const flat = useMemo(
    () =>
      GROUPS.flatMap((g) => (data?.[g.key] || []).map((item) => ({ group: g.key, item, href: toAdminRoute(g.key, item) }))).filter(
        (r): r is { group: keyof SearchResults; item: SearchResultItem; href: string } => Boolean(r.href)
      ),
    [data]
  );

  useEffect(() => setActive(0), [debounced]);

  const go = (href: string) => {
    setOpen(false);
    setQ('');
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!flat.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % flat.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + flat.length) % flat.length); }
    if (e.key === 'Enter') { e.preventDefault(); go(flat[active].href); }
  };

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search products, orders, collections…"
        className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-16 text-sm placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:outline-none focus:shadow-ring"
        aria-label="Global search"
        role="combobox"
        aria-controls="global-search-results"
        aria-autocomplete="list"
        aria-expanded={open && debounced.length >= 2}
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-white px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block">
        Ctrl K
      </kbd>

      {open && debounced.length >= 2 && (
        <div id="global-search-results" role="listbox" className="absolute left-0 right-0 z-40 mt-2 max-h-[420px] animate-scale-in overflow-y-auto rounded-xl border border-border bg-white p-1.5 shadow-pop">
          {isFetching && !data && (
            <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Searching…</div>
          )}
          {data && !flat.length && <p className="px-3 py-4 text-sm text-muted-foreground">No results for “{debounced}”.</p>}
          {GROUPS.map((g) => {
            const items = flat.filter((r) => r.group === g.key);
            if (!items.length) return null;
            return (
              <div key={g.key} className="py-1">
                <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</p>
                {items.map((r) => {
                  const idx = flat.indexOf(r);
                  return (
                    <button
                      key={`${g.key}-${r.item.id}`}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => go(r.href)}
                      className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm', idx === active ? 'bg-primary-50 text-primary-700' : 'text-ink-soft')}
                    >
                      {r.item.image ? (
                        <Thumb src={r.item.image} alt={r.item.title} size={28} />
                      ) : (
                        <g.icon className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{r.item.title}</span>
                        {r.item.subtitle && <span className="block truncate text-xs text-muted-foreground">{r.item.subtitle}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
