'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

type CarouselImage = { src: string; alt: string; label: string };

export function HomeImageCarousel({ images }: { images: CarouselImage[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);

  const move = useCallback((direction: -1 | 1) => {
    const viewport = viewportRef.current;
    const firstCard = viewport?.querySelector<HTMLElement>('[data-home-carousel-card]');
    if (!viewport || !firstCard) return;

    const track = firstCard.parentElement;
    const gap = track ? Number.parseFloat(getComputedStyle(track).columnGap) || 0 : 0;
    const step = firstCard.getBoundingClientRect().width + gap;
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    const next = viewport.scrollLeft + direction * step;

    if (direction > 0 && next >= maxScroll - 4) {
      viewport.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (direction < 0 && next < 0) {
      viewport.scrollTo({ left: maxScroll, behavior: 'smooth' });
    } else {
      viewport.scrollTo({ left: next, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => move(1), 2000);
    return () => window.clearInterval(timer);
  }, [move]);

  return (
    <div aria-label="FYNE SURFACES spaces gallery" aria-roledescription="carousel">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-ink-muted">Artificial plants in real homes and offices</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => move(-1)} aria-label="Previous image" className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink transition hover:border-primary hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Next image" className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink transition hover:border-primary hover:text-primary">
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={viewportRef}
        className="overflow-x-hidden scroll-smooth [scrollbar-width:none] sm:overflow-x-auto [&::-webkit-scrollbar]:hidden"
        aria-live="off"
      >
        <div className="flex w-max gap-0 pb-2 sm:gap-5">
          {images.map((item, index) => (
            <motion.article
              key={item.src}
              data-home-carousel-card
              className="group relative aspect-[4/3] w-[calc(100vw-2.5rem)] shrink-0 overflow-hidden rounded-[1.25rem] border border-white/70 bg-sand shadow-image transition-[transform,box-shadow] duration-700 ease-premium hover:-translate-y-1 hover:shadow-lift sm:w-[42vw] sm:rounded-[1.75rem] lg:w-[27vw] xl:w-[23vw]"
              aria-label={`${index + 1} of ${images.length}: ${item.label}`}
              initial={{ opacity: 0, y: 28, scale: 0.985 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ duration: 0.75, delay: Math.min(index * 0.07, 0.35), ease: [0.22, 1, 0.36, 1] }}
            >
              <Image src={item.src} alt={item.alt} fill sizes="(max-width: 640px) calc(100vw - 2.5rem), (max-width: 1024px) 42vw, 27vw" quality={80} className="object-cover transition-transform duration-1000 group-hover:scale-[1.06] saturate-[1.06]" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary-950/75 via-primary-950/20 to-transparent px-4 pb-4 pt-12 sm:px-5 sm:pb-5 sm:pt-16">
                <p className="text-sm font-semibold leading-snug tracking-tight text-white sm:text-base">{item.label}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}
