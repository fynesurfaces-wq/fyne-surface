import { cn } from '@/lib/utils';

/**
 * FYNE SURFACES wordmark — dark green "FYNE" with the Y in an orange block,
 * "SURFACES" letter-spaced beneath (matches the brand artwork).
 * To use the official file instead, drop /public/logo.svg and render <img>.
 */
export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  if (compact) {
    return (
      <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-lg font-black text-white', className)} aria-label="FYNE SURFACES">
        Y
      </span>
    );
  }
  return (
    <span className={cn('inline-flex flex-col items-center leading-none', className)} aria-label="FYNE SURFACES">
      <span className="flex items-center text-[26px] font-black tracking-tight text-primary-800">
        F
        <span className="mx-[1px] inline-flex h-[28px] w-[22px] items-center justify-center rounded-[3px] bg-secondary text-white">Y</span>
        NE
      </span>
      <span className="mt-1 flex items-center gap-1.5">
        <span className="h-px w-3 bg-secondary" />
        <span className="text-[9px] font-semibold tracking-[0.32em] text-primary-800">SURFACES</span>
        <span className="h-px w-3 bg-secondary" />
      </span>
    </span>
  );
}
