'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { cn, formatINR, ftToCm, heightInFeet } from '@/lib/utils';
import type { ProductDetail, ProductSummary } from '@/lib/types';
import { PlantImage } from '@/components/ui/PlantImage';
import { AddToCartButton } from './AddToCartButton';
import { api } from '@/lib/api.client';

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
  const [related, setRelated] = useState<ProductDetail['related']>([]);
  const [relatedFetched, setRelatedFetched] = useState(false);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedOpen, setRelatedOpen] = useState(false);
  const href = `/products/${p.slug}`;
  const [img1, img2] = p.images;
  const Heading = headingLevel;
  const discount = p.price.compareAt && p.price.compareAt > p.price.amount ? Math.round((1 - p.price.amount / p.price.compareAt) * 100) : 0;
  const suppliedName = p.name?.trim();
  const shortDescription = p.shortDescription?.trim() || '';
  const shortDescriptionName = /\s+by\s+/i.test(shortDescription) ? shortDescription.split(/\s+by\s+/i)[0].trim() : '';
  const productLabel = suppliedName && suppliedName.toLowerCase() !== p.sku.toLowerCase()
    ? suppliedName
    : shortDescriptionName || p.tags.find((tag) => tag.trim()) || 'Artificial plant';
  const loadRelated = async () => {
    if (relatedFetched) return;
    setRelatedFetched(true);
    setRelatedLoading(true);
    try {
      const response = await api.get<{ data: ProductDetail }>(`/store/products/${encodeURIComponent(p.slug)}`);
      setRelated(response.data.data.related || []);
    } catch { /* Related items are an enhancement; the product card remains usable without them. */ }
    finally { setRelatedLoading(false); }
  };

  return (
    <motion.article className="group relative flex flex-col" initial="rest" whileHover="hover" animate="rest" onHoverStart={loadRelated}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-primary-900/5 bg-gradient-to-br from-white via-[#f7f8f3] to-primary-50/70 shadow-image transition-[transform,box-shadow] duration-700 ease-premium group-hover:-translate-y-1 group-hover:shadow-lift">
        <Link href={href} className="absolute inset-0 block rounded-[1.5rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary" aria-label={`${productLabel ? `${productLabel} — ` : ''}${p.price.formatted}`}>
          <motion.div className="absolute inset-0" variants={{ rest: { scale: 1 }, hover: { scale: 1.06 } }} transition={{ duration: 1.8, ease: EASE }}>
            <PlantImage
              src={img1?.url}
              alt={img1?.alt || (productLabel ? `${productLabel} artificial plant by FYNE SURFACES` : `Product image, SKU ${p.sku}`)}
              seed={p.slug}
              fit="contain"
              priority={priority}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              unoptimized={img1?.unoptimized}
            />
            {img2 && (
              <motion.div className="absolute inset-0" variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }} transition={{ duration: 0.9 }}>
                <PlantImage src={img2.url} alt={img2.alt || (productLabel ? `${productLabel} — alternate view` : `Product image, SKU ${p.sku}`)} seed={`${p.slug}-2`} sizes="(min-width: 1280px) 25vw, 50vw" fit="contain" unoptimized={img2.unoptimized} />
              </motion.div>
            )}
          </motion.div>
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {!p.availability.inStock && <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink">Sold out</span>}
          {discount > 0 && <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink">−{discount}%</span>}
          {p.isFeatured && !discount && <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">Featured</span>}
          {p.isNewArrival && <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">New arrival</span>}
        </div>

        <motion.aside aria-label="One suggested product from each collection" variants={{ rest: { x: '105%', opacity: 0 }, hover: { x: 0, opacity: 1 } }} transition={{ duration: 0.55, ease: EASE }} className="absolute inset-y-2 right-2 z-10 hidden w-32 flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/95 p-2 shadow-lift backdrop-blur [@media(hover:hover)]:flex">
          <p className="px-1 pb-1 text-[9px] font-bold uppercase leading-tight tracking-wide text-ink-muted">One from each collection</p>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {related.map((item) => <Link key={item.slug} href={`/products/${item.slug}`} title={`${item.collectionName}: ${item.name} · ${item.sku}`} className="group/related block shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <span className="mb-1 block truncate px-0.5 text-[8px] font-bold uppercase tracking-wide text-primary">{item.collectionName}</span>
              <div className="relative aspect-square overflow-hidden rounded-lg bg-sand"><PlantImage src={item.image} alt={item.name} seed={item.slug} sizes="120px" unoptimized /></div>
              <span className="mt-1 line-clamp-2 block text-[9px] font-semibold leading-tight text-ink group-hover/related:text-primary">{item.name}</span>
            </Link>)}
            {relatedLoading && <span className="px-1 text-[9px] leading-tight text-ink-muted">Loading suggestions…</span>}
            {relatedFetched && !relatedLoading && related.length === 0 && <span className="px-1 text-[9px] leading-tight text-ink-muted">No collection suggestions yet.</span>}
          </div>
          {related.length > 0 && <span className="mt-1 flex items-center justify-center gap-1 text-[9px] font-semibold text-primary">View <ArrowRight className="h-3 w-3" /></span>}
        </motion.aside>

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
            <Link href={href} className="mt-1 inline-block text-[12px] uppercase tracking-[0.12em] text-ink-faint transition-colors hover:text-primary">SKU {p.sku}</Link>
          </div>
          <div className="max-w-full text-left sm:shrink-0 sm:text-right">
            <p className="whitespace-nowrap text-[15px] font-semibold tabular-nums text-ink">{formatINR(p.price.amount)}</p>
            {discount > 0 && <p className="text-xs tabular-nums text-ink-faint line-through">{formatINR(p.price.compareAt!)}</p>}
          </div>
        </div>
        {keyFact(p) && <p className="mt-2 text-[13px] text-ink-muted">{keyFact(p)}</p>}

        {/* Touch screens have no hover, so expose suggestions with a button and horizontal scroller. */}
        <div className="mt-3 [@media(hover:hover)]:hidden">
          <button
            type="button"
            aria-expanded={relatedOpen}
            aria-controls={`related-products-${p.slug}`}
            onClick={() => {
              setRelatedOpen((open) => !open);
              void loadRelated();
            }}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/20 bg-primary-50 px-4 text-xs font-semibold text-primary-800 transition-colors hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {relatedOpen ? 'Hide suggestions' : 'More collections'}
            <ArrowRight className={cn('h-3.5 w-3.5 transition-transform', relatedOpen && 'rotate-90')} />
          </button>
          {relatedOpen && <div id={`related-products-${p.slug}`} className="-mx-1 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
            {relatedLoading && <p className="shrink-0 py-3 text-xs text-ink-muted">Loading suggestions…</p>}
            {!relatedLoading && related.map((item) => <Link key={item.slug} href={`/products/${item.slug}`} title={`${item.collectionName}: ${item.name} · ${item.sku}`} className="w-28 shrink-0 snap-start rounded-xl border border-line bg-white p-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-32">
              <span className="mb-1 block truncate text-[9px] font-bold uppercase tracking-wide text-primary">{item.collectionName}</span>
              <div className="relative aspect-square overflow-hidden rounded-lg bg-sand"><PlantImage src={item.image} alt={item.name} seed={item.slug} sizes="128px" unoptimized /></div>
              <span className="mt-1.5 line-clamp-2 block text-[10px] font-semibold leading-tight text-ink">{item.name}</span>
            </Link>)}
            {!relatedLoading && relatedFetched && related.length === 0 && <p className="shrink-0 py-3 text-xs text-ink-muted">No collection suggestions yet.</p>}
          </div>}
        </div>

        {/* Touch devices: visible actions */}
        <div className={cn('mt-4 [@media(hover:hover)]:hidden')}>
          <AddToCartButton product={p} inStock={p.availability.inStock} size="sm" variant="outline" className="w-full" />
        </div>
      </div>
    </motion.article>
  );
}
