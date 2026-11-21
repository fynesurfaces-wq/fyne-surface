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
        className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-5 pb-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:gap-7 lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p, i) => (
          <li key={p.id} className="w-[72%] shrink-0 snap-start sm:w-[44%] lg:w-[calc((100%-5.25rem)/4)]">
            <ProductCard product={p} priority={i < 2} />
          </li>
        ))}
      </ul>
    </div>
  );
}
