import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import type { ProductDetail } from '@/lib/types';
import { PlantImage } from '@/components/ui/PlantImage';
import { Stagger, StaggerItem } from '@/components/ui/Motion';

export function RelatedProducts({ items }: { items: ProductDetail['related'] }) {
  return (
    <section aria-labelledby="related-heading" className="mt-28">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-eyebrow uppercase text-accent-700">Complete the space</p>
          <h2 id="related-heading" className="mt-3 text-display-md text-ink">You may also like</h2>
        </div>
      </div>
      <Stagger className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4 lg:gap-x-7">
        {items.map((r) => (
          <StaggerItem key={r.slug}>
            <Link href={`/products/${r.slug}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-sand">
                <PlantImage src={r.image} alt={`${r.name} artificial plant`} seed={r.slug} sizes="(min-width: 1024px) 25vw, 50vw" className="transition-transform duration-1000 ease-premium group-hover:scale-105" unoptimized={r.imageUnoptimized} />
                {!r.inStock && <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink">Sold out</span>}
              </div>
              <h3 className="mt-4 flex items-center justify-between text-[15px] font-semibold text-ink group-hover:text-primary">
                {r.name}
                <ArrowRight className="h-4 w-4 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
              </h3>
              <p className="mt-1 flex items-center justify-between text-sm">
                <span className="text-[12px] uppercase tracking-[0.12em] text-ink-faint">{r.sku}</span>
                <span className="font-semibold tabular-nums text-ink">{formatINR(r.price)}</span>
              </p>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
