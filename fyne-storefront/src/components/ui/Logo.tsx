import { cn } from '@/lib/utils';

/**
 * FYNE SURFACES wordmark (dark-green FYNE, Y set in an orange block,
 * letter-spaced SURFACES). `inverted` renders it for dark/photo backgrounds.
 * Replace with the official SVG by dropping it in /public and using <Image>.
 */
export function Logo({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  const ink = inverted ? 'text-white' : 'text-primary-800';
  return (
    <span className={cn('inline-flex select-none flex-col items-center leading-none', className)} aria-label="FYNE SURFACES">
      <span className={cn('flex items-center text-[25px] font-extrabold tracking-[-0.02em]', ink)} aria-hidden>
        F
        <span className="mx-[1.5px] inline-flex h-[27px] w-[21px] items-center justify-center rounded-[3px] bg-accent text-white">Y</span>
        NE
      </span>
      <span className="mt-[5px] flex items-center gap-1.5" aria-hidden>
        <span className="h-px w-3 bg-accent" />
        <span className={cn('text-[8.5px] font-semibold tracking-[0.36em]', ink)}>SURFACES</span>
        <span className="h-px w-3 bg-accent" />
      </span>
    </span>
  );
}
