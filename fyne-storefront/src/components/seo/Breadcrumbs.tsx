import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn, toPath } from '@/lib/utils';
import type { Breadcrumb } from '@/lib/types';

/** Visible breadcrumb trail; matches the BreadcrumbList JSON-LD from the API. */
export function Breadcrumbs({ items, className, inverted }: { items: Breadcrumb[]; className?: string; inverted?: boolean }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className={cn('flex flex-wrap items-center gap-1.5 text-[13px]', inverted ? 'text-white/75' : 'text-ink-muted')}>
        {items.map((b, i) => {
          const last = i === items.length - 1;
          return (
            <li key={b.url} className="flex items-center gap-1.5">
              {last ? (
                <span aria-current="page" className={cn('font-medium', inverted ? 'text-white' : 'text-ink')}>{b.name}</span>
              ) : (
                <Link href={toPath(b.url) || '/'} className={cn('transition-colors', inverted ? 'hover:text-white' : 'hover:text-primary')}>{b.name}</Link>
              )}
              {!last && <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
