import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Accent = 'green' | 'orange';

const accents: Record<Accent, { icon: string; bar: string }> = {
  green: { icon: 'bg-primary-50 text-primary', bar: 'bg-primary' },
  orange: { icon: 'bg-secondary-50 text-secondary', bar: 'bg-secondary' },
};

/** Dashboard metric tile with green/orange accent and optional % change. */
export function StatCard({
  label,
  value,
  icon,
  accent = 'green',
  change,
  hint,
  loading,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent?: Accent;
  change?: number;
  hint?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
}) {
  const a = accents[accent];
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-surface p-5 text-left shadow-card transition',
        onClick && 'hover:-translate-y-0.5 hover:shadow-pop focus-visible:outline-none focus-visible:shadow-ring'
      )}
    >
      <span className={cn('absolute inset-x-0 top-0 h-0.5 opacity-0 transition group-hover:opacity-100', a.bar)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <div className="mt-2 h-8 w-28 animate-pulse rounded-md bg-muted" />
          ) : (
            <p className="mt-1.5 truncate text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</p>
          )}
        </div>
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', a.icon)}>{icon}</span>
      </div>
      {(change !== undefined || hint) && !loading && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {change !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium',
                change >= 0 ? 'bg-primary-50 text-primary-700' : 'bg-danger-50 text-danger'
              )}
            >
              {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </Comp>
  );
}
