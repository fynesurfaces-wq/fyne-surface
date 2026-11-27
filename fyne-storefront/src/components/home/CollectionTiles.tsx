'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import type { CollectionSummary } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PlantImage } from '@/components/ui/PlantImage';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Editorial collection grid: first tile is tall, others stack. Hover: zoom + lift + reveal arrow. */
export function CollectionTiles({ collections }: { collections: CollectionSummary[] }) {
  const tiles = collections.slice(0, 3);
  return (
    <ul className="grid gap-5 md:grid-cols-2 md:grid-rows-2 lg:gap-6">
      {tiles.map((c, i) => (
        <motion.li
          key={c.id}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, delay: i * 0.12, ease: EASE }}
          className={cn(i === 0 && 'md:row-span-2')}
        >
          <motion.div whileHover="hover" initial="rest" animate="rest" className="h-full">
            <Link
              href={`/collections/${c.slug}`}
              className={cn('group relative flex h-full min-h-[340px] overflow-hidden rounded-[2rem] border border-white/50 bg-sand shadow-image transition-[transform,box-shadow] duration-700 ease-premium hover:-translate-y-1 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4', i === 0 ? 'md:min-h-[680px]' : 'md:min-h-[328px]')}
            >
              <motion.div className="absolute inset-0" variants={{ rest: { scale: 1 }, hover: { scale: 1.07 } }} transition={{ duration: 1.2, ease: EASE }}>
                <PlantImage src={c.coverImage?.url} alt={c.coverImage?.alt || `${c.name} — FYNE SURFACES artificial plants collection`} seed={c.slug} sizes="(min-width: 768px) 50vw, 100vw" className="saturate-[1.08]" unoptimized={c.coverImage?.unoptimized} />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-primary-950/65 via-primary-950/5 to-transparent" />
              <div className="relative mt-auto flex w-full items-end justify-between gap-6 p-7 lg:p-9">
                <div>
                  <p className="text-[13px] font-medium text-white/70">{c.productCount} {c.productCount === 1 ? 'product' : 'products'}</p>
                  <h3 className="mt-1.5 text-2xl font-semibold tracking-tight text-white lg:text-[2rem]">{c.name}</h3>
                  {c.description && <p className="mt-2 line-clamp-2 max-w-md text-sm leading-relaxed text-white/75">{c.description}</p>}
                </div>
                <motion.span
                  variants={{ rest: { rotate: 0, scale: 1 }, hover: { rotate: 45, scale: 1.08 } }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-ink"
                  aria-hidden
                >
                  <ArrowUpRight className="h-5 w-5" />
                </motion.span>
              </div>
            </Link>
          </motion.div>
        </motion.li>
      ))}
    </ul>
  );
}
