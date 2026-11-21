'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MAX_QTY } from '@/store/cart';

export function QtyStepper({ value, onChange, size = 'md', label = 'Quantity' }: { value: number; onChange: (v: number) => void; size?: 'sm' | 'md'; label?: string }) {
  const h = size === 'sm' ? 'h-9' : 'h-12';
  const w = size === 'sm' ? 'w-9' : 'w-12';
  return (
    <div className={cn('inline-flex items-center rounded-full border border-line bg-white', h)} role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} className={cn('flex items-center justify-center rounded-full text-ink-soft transition hover:text-ink disabled:opacity-30', h, w)} aria-label="Decrease quantity" disabled={value <= 1 && size === 'md'}>
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className={cn('min-w-[28px] text-center font-medium tabular-nums text-ink', size === 'sm' ? 'text-sm' : 'text-[15px]')} aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} className={cn('flex items-center justify-center rounded-full text-ink-soft transition hover:text-ink disabled:opacity-30', h, w)} aria-label="Increase quantity" disabled={value >= MAX_QTY}>
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
