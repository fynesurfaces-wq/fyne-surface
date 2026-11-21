'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { StoreImage } from '@/lib/types';
import { PlantImage } from '@/components/ui/PlantImage';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Large main image with thumbnails (left rail on desktop, row on mobile).
 * Smooth crossfade between images; keyboard arrows supported.
 * Every image is rendered with descriptive alt text for image search.
 */
export function ProductGallery({ images, name, slug }: { images: StoreImage[]; name: string; slug: string }) {
  const [index, setIndex] = useState(0);
  const list = images.length ? images : [{ url: '', alt: `${name} — artificial plant by FYNE SURFACES` }];
  const current = list[index];
  const altFor = (img: StoreImage, i: number) => img.alt || `${name} artificial plant${i ? ` — view ${i + 1}` : ''} | FYNE SURFACES`;

  const onKey = (e: React.KeyboardEvent) => {
    if (list.length < 2) return;
    if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % list.length);
    if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + list.length) % list.length);
  };

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row lg:gap-5">
      {list.length > 1 && (
        <ul className="flex gap-3 overflow-x-auto pb-1 lg:w-[88px] lg:flex-col lg:overflow-visible" role="tablist" aria-label="Product images">
          {list.map((img, i) => (
            <li key={`${img.url}-${i}`} className="shrink-0">
              <button
                role="tab"
                aria-selected={i === index}
                aria-label={`Show image ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  'relative block h-[96px] w-[78px] overflow-hidden rounded-xl bg-sand transition-all duration-300 lg:h-[108px] lg:w-[88px]',
                  i === index ? 'ring-2 ring-ink ring-offset-2' : 'opacity-70 hover:opacity-100'
                )}
              >
                <PlantImage src={img.url} alt={altFor(img, i)} seed={`${slug}-${i}`} sizes="88px" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div
        className="relative aspect-[4/5] flex-1 overflow-hidden rounded-[1.75rem] bg-sand focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        tabIndex={list.length > 1 ? 0 : -1}
        onKeyDown={onKey}
        aria-roledescription="carousel"
        aria-label={`${name} images`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <PlantImage src={current.url} alt={altFor(current, index)} seed={`${slug}-${index}`} priority={index === 0} sizes="(min-width: 1024px) 50vw, 100vw" />
          </motion.div>
        </AnimatePresence>
        {list.length > 1 && (
          <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium tabular-nums text-ink backdrop-blur">
            {index + 1} / {list.length}
          </span>
        )}
      </div>
    </div>
  );
}
