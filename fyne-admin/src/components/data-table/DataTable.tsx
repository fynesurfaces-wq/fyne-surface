'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Columns3, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside, useDebounce } from '@/lib/hooks';
import type { Pagination } from '@/lib/types';
import { EmptyState } from '@/components/ui/misc';

/**
 * Server-driven table matching the API contract:
 *   ?page=&limit=&sort=-field&q=   →   { data, pagination }
 * Parents own `state` (so it can go in query keys) and get changes via onStateChange.
 */

export interface Column<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** API field name to sort by. Omit for non-sortable columns. */
  sortKey?: string;
  className?: string;
  headerClassName?: string;
  /** Can be hidden from the "Columns" menu (default true). */
  hideable?: boolean;
  defaultHidden?: boolean;
}

export interface TableState {
  page: number;
  limit: number;
  sort: string; // "-createdAt" | "price"
  q: string;
}

export const defaultTableState = (overrides: Partial<TableState> = {}): TableState => ({ page: 1, limit: 20, sort: '-createdAt', q: '', ...overrides });

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[] | undefined;
  rowKey: (row: T) => string;
  state: TableState;
  onStateChange: (next: TableState) => void;
  pagination?: Pagination;
  isLoading?: boolean;
  isFetching?: boolean;
  searchPlaceholder?: string;
  /** Extra filter controls rendered next to search. */
  toolbar?: React.ReactNode;
  onRowClick?: (row: T) => void;
  empty?: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode };
  /** Persist column visibility per table. */
  storageKey?: string;
  pageSizes?: number[];
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  state,
  onStateChange,
  pagination,
  isLoading,
  isFetching,
  searchPlaceholder = 'Search…',
  toolbar,
  onRowClick,
  empty = { title: 'No results', description: 'Try adjusting your search or filters.' },
  storageKey,
  pageSizes = [10, 20, 50, 100],
}: DataTableProps<T>) {
  // ── Search (debounced → state.q, resets to page 1) ──
  const [search, setSearch] = useState(state.q);
  const debounced = useDebounce(search, 350);
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    if (debounced !== stateRef.current.q) onStateChange({ ...stateRef.current, q: debounced, page: 1 });
  }, [debounced, onStateChange]);

  // ── Column visibility (UI preference only → localStorage is fine) ──
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(columns.filter((c) => c.defaultHidden).map((c) => c.id)));
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(`fyne:cols:${storageKey}`);
      if (saved) setHidden(new Set(JSON.parse(saved)));
    } catch {
      /* ignore */
    }
  }, [storageKey]);
  const toggleColumn = (id: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      if (storageKey) {
        try {
          localStorage.setItem(`fyne:cols:${storageKey}`, JSON.stringify([...next]));
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  };
  const visible = useMemo(() => columns.filter((c) => !hidden.has(c.id)), [columns, hidden]);

  // ── Sorting: none → asc → desc → none (falls back to default) ──
  const sortField = state.sort.replace(/^-/, '');
  const sortDesc = state.sort.startsWith('-');
  const onSort = (key: string) => {
    let sort: string;
    if (sortField !== key) sort = key;
    else if (!sortDesc) sort = `-${key}`;
    else sort = '-createdAt';
    onStateChange({ ...state, sort, page: 1 });
  };

  const rows = data ?? [];
  const showSkeleton = isLoading && !rows.length;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border p-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-lg border border-border bg-white pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:shadow-ring"
            aria-label="Search table"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-ink" aria-label="Clear search">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2">{toolbar}</div>
        <ColumnMenu columns={columns} hidden={hidden} onToggle={toggleColumn} />
      </div>

      {/* Table */}
      <div className={cn('relative overflow-x-auto', isFetching && !showSkeleton && 'opacity-70 transition-opacity')}>
        {isFetching && !showSkeleton && <div className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-primary" />}
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/80 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <tr>
              {visible.map((col) => (
                <th key={col.id} scope="col" className={cn('whitespace-nowrap px-4 py-3 font-medium', col.headerClassName)}>
                  {col.sortKey ? (
                    <button onClick={() => onSort(col.sortKey!)} className="group inline-flex items-center gap-1 uppercase hover:text-ink">
                      {col.header}
                      {sortField === col.sortKey ? (
                        sortDesc ? <ArrowDown className="h-3.5 w-3.5 text-primary" /> : <ArrowUp className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-60" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {showSkeleton
              ? Array.from({ length: Math.min(state.limit, 8) }).map((_, i) => (
                  <tr key={i}>
                    {visible.map((c) => (
                      <td key={c.id} className="px-4 py-3.5">
                        <div className="h-4 animate-pulse rounded bg-muted" style={{ width: `${50 + ((i * 7 + c.id.length * 5) % 40)}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn('transition-colors hover:bg-primary-50/40', onRowClick && 'cursor-pointer')}
                  >
                    {visible.map((col) => (
                      <td key={col.id} className={cn('px-4 py-3 align-middle text-ink-soft', col.className)}>
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
        {!isLoading && !rows.length && <EmptyState {...empty} />}
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm sm:flex-row">
          <p className="text-muted-foreground">
            Showing <span className="font-medium text-ink">{(pagination.page - 1) * pagination.limit + 1}</span>–
            <span className="font-medium text-ink">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-medium text-ink">{pagination.total}</span>
          </p>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-muted-foreground">
              Rows
              <select
                value={state.limit}
                onChange={(e) => onStateChange({ ...state, limit: Number(e.target.value), page: 1 })}
                className="h-8 rounded-md border border-border bg-white px-2 text-sm text-ink focus:border-primary focus:outline-none"
              >
                {pageSizes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <div className="flex items-center gap-1">
              <PageButton disabled={!pagination.hasPrevPage} onClick={() => onStateChange({ ...state, page: state.page - 1 })} label="Previous page">
                <ChevronLeft className="h-4 w-4" />
              </PageButton>
              <span className="min-w-[72px] text-center tabular-nums text-ink-soft">
                {pagination.page} / {Math.max(1, pagination.totalPages)}
              </span>
              <PageButton disabled={!pagination.hasNextPage} onClick={() => onStateChange({ ...state, page: state.page + 1 })} label="Next page">
                <ChevronRight className="h-4 w-4" />
              </PageButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PageButton({ children, disabled, onClick, label }: { children: React.ReactNode; disabled?: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-ink-soft transition hover:bg-muted disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function ColumnMenu<T>({ columns, hidden, onToggle }: { columns: Column<T>[]; hidden: Set<string>; onToggle: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  const hideable = columns.filter((c) => c.hideable !== false);
  if (!hideable.length) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-medium text-ink-soft hover:bg-muted"
        aria-expanded={open}
      >
        <Columns3 className="h-4 w-4" /> Columns
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-52 animate-scale-in rounded-xl border border-border bg-white p-1.5 shadow-pop">
          <p className="px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Visible columns</p>
          {hideable.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-ink-soft hover:bg-muted">
              <input type="checkbox" checked={!hidden.has(c.id)} onChange={() => onToggle(c.id)} className="h-4 w-4 rounded border-gray-300 accent-primary" />
              {c.header}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/** Compact filter <select> styled for the toolbar. */
export function FilterSelect({ value, onChange, children, label }: { value: string; onChange: (v: string) => void; children: React.ReactNode; label: string }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-9 rounded-lg border bg-white px-3 pr-8 text-sm transition focus:border-primary focus:outline-none',
        value ? 'border-primary-300 bg-primary-50 font-medium text-primary-700' : 'border-border text-ink-soft'
      )}
    >
      {children}
    </select>
  );
}
