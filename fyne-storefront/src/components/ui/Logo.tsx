import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex select-none flex-col items-center leading-none', className)} aria-label="FYNE SURFACES">
      <span className="inline-flex" aria-hidden>
        <Image src="/images/fyne-logo.png" alt="" width={1367} height={635} priority className="h-auto w-[96px]" />
      </span>
      <span className={cn('mt-1 text-[8px] font-semibold tracking-[0.36em]', inverted ? 'text-white' : 'text-primary-800')} aria-hidden>SURFACES</span>
    </span>
  );
}
