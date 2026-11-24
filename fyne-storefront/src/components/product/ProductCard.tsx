'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { cn, formatINR, ftToCm, heightInFeet } from '@/lib/utils';
import type { ProductSummary } from '@/lib/types';
import { PlantImage } from '@/components/ui/PlantImage';
import { AddToCartButton } from './AddToCartButton';

const EASE = [0.22, 1, 0.36, 1] as const;

/** One headline spec shown under the name (scannable, factual). */
function keyFact(p: ProductSummary) {
  const s = p.specifications || {};
  const ft = heightInFeet(s.height);
  if (ft) return `${s.height?.value} ${s.height?.unit ?? 'ft'} · ${ftToCm(ft)} cm`;
  if (s.packSize) return `Pack of ${s.packSize}`;
  return undefined;
}

/**
 * Premium product card:
 *  - 4:5 image on a warm backdrop; slow zoom + second image crossfade on hover
 *  - "Add to Cart" + "View details" slide up on hover (always visible on touch)
 *  - Semantic <article> with an <h3> name for crawlers
 */
export function ProductCard({ product: p, priority, headingLevel = 'h3' }: { product: ProductSummary; priority?: boolean; headingLevel?: 'h2' | 'h3' }) {
  const href = `/products/${p.slug}`;
  const [img1, img2] = p.images;
  const Heading = headingLevel;
  const discount = p.price.compareAt && p.price.compareAt > p.price.amount ? Math.round((1 - p.price.amount / p.price.compareAt) * 100) : 0;
  const productLabel = p.name?.trim();

  return (
    <motion.article className="group relative flex flex-col" initial="rest" whileHover="hover" animate="rest">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-white/70 bg-gradient-to-br from-sand via-sand to-primary-50/60 shadow-image transition-[transform,box-shadow] duration-700 ease-premium group-hover:-translate-y-1 group-hover:shadow-lift">
        <Link href={href} className="absolute inset-0 block rounded-[1.5rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary" aria-label={`${productLabel ? `${productLabel} — ` : ''}${p.price.formatted}`}>
          <motion.div className="absolute inset-0" variants={{ rest: { scale: 1 }, hover: { scale: 1.06 } }} transition={{ duration: 1.1, ease: EASE }}>
            <PlantImage
              src={img1?.url}
              alt={img1?.alt || (productLabel ? `${productLabel} artificial plant by FYNE SURFACES` : `Product image, SKU ${p.sku}`)}
              seed={p.slug}
              priority={priority}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            />
            {img2 && (
              <motion.div className="absolute inset-0" variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }} transition={{ duration: 0.6 }}>
                <PlantImage src={img2.url} alt={img2.alt || (productLabel ? `${productLabel} — alternate view` : `Product image, SKU ${p.sku}`)} seed={`${p.slug}-2`} sizes="(min-width: 1280px) 25vw, 50vw" />
              </motion.div>
            )}
          </motion.div>
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {!p.availability.inStock && <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink">Sold out</span>}
          {discount > 0 && <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">−{discount}%</span>}
          {p.isFeatured && !discount && <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">Featured</span>}
          {p.isNewArrival && <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">New arrival</span>}
        </div>

        {/* Hover actions (pointer devices) — siblings of the link, not nested inside it */}
        <motion.div
          className="absolute inset-x-3 bottom-3 hidden gap-2 [@media(hover:hover)]:flex"
          variants={{ rest: { opacity: 0, y: 16 }, hover: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <AddToCartButton product={p} inStock={p.availability.inStock} size="md" className="flex-1" />
          <Link href={href} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-soft transition hover:bg-ink hover:text-white" aria-label={`View details of ${productLabel || `SKU ${p.sku}`}`}>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:justify-between">
          <div className="min-w-0 w-full sm:flex-1">
            {productLabel && <Heading className="text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink transition-colors duration-300 group-hover:text-primary">
              <Link href={href} className="hover:text-primary">{productLabel}</Link>
            </Heading>}
            <p className="mt-1 text-[12px] uppercase tracking-[0.12em] text-ink-faint">SKU {p.sku}</p>
          </div>
          <div className="max-w-full text-left sm:shrink-0 sm:text-right">
            <p className="whitespace-nowrap text-[15px] font-semibold tabular-nums text-ink">{formatINR(p.price.amount)}</p>
            {discount > 0 && <p className="text-xs tabular-nums text-ink-faint line-through">{formatINR(p.price.compareAt!)}</p>}
          </div>
        </div>
        {keyFact(p) && <p className="mt-2 text-[13px] text-ink-muted">{keyFact(p)}</p>}

        {/* Touch devices: visible actions */}
        <div className={cn('mt-4 [@media(hover:hover)]:hidden')}>
          <AddToCartButton product={p} inStock={p.availability.inStock} size="sm" variant="outline" className="w-full" />
        </div>
      </div>
    </motion.article>
  );
}
