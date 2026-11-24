'use client';

import { useRef, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { ProductSummary } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/product/ProductCard';

/** Scroll-snap carousel (native scrolling = accessible + crawlable) with arrow controls. */
export function ProductCarousel({ products }: { products: ProductSummary[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  };
  useEffect(update, [products]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const el = ref.current;
      const firstCard = el?.querySelector<HTMLElement>('li');
      if (!el || !firstCard) return;

      const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
      const step = firstCard.getBoundingClientRect().width + gap;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 8) el.scrollTo({ left: 0, behavior: 'smooth' });
      else el.scrollBy({ left: step, behavior: 'smooth' });
    }, 2000);

    return () => window.clearInterval(timer);
  }, [products]);

  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });

  return (
    <div className="relative">
      <div className="absolute -top-20 right-0 hidden gap-2 md:flex">
        {([-1, 1] as const).map((d) => (
          <button
            key={d}
            onClick={() => scroll(d)}
            disabled={d === -1 ? edges.start : edges.end}
            aria-label={d === -1 ? 'Previous products' : 'Next products'}
            className={cn('flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white text-ink transition hover:border-ink disabled:opacity-30')}
          >
            {d === -1 ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          </button>
        ))}
      </div>
      <ul
        ref={ref}
        onScroll={update}
        aria-label="Featured products"
        aria-roledescription="carousel"
        className="-mx-5 flex snap-x snap-mandatory gap-0 overflow-x-hidden scroll-smooth px-0 pb-4 [scrollbar-width:none] sm:-mx-6 sm:gap-5 sm:overflow-x-auto sm:px-6 lg:mx-0 lg:gap-7 lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p, i) => (
          <li key={p.id} className="w-full shrink-0 snap-start px-3 pb-5 pt-2 sm:px-0 sm:pb-0 sm:pt-0 sm:w-[48%] lg:w-[calc((100%-5.25rem)/4)]">
            <ProductCard product={p} priority={i < 2} />
          </li>
        ))}
      </ul>
    </div>
  );
}
