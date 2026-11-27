'use client';

import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';

type HeroImage = { src: string; alt: string };
const BUSINESS_TERMS = ['Supplier', 'Manufacturer', 'Dealer', 'Distributor', 'Trader', 'Stockist'];

/** Static home hero with one fixed background image. */
export function Hero({ image }: { image: HeroImage }) {
  const [termIndex, setTermIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = window.setInterval(() => setTermIndex((index) => (index + 1) % BUSINESS_TERMS.length), 3200);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion]);

  return (
    <section aria-label="FYNE SURFACES visual introduction" className="relative isolate flex min-h-[min(100svh,900px)] items-end overflow-hidden bg-primary-950">
      <div className="absolute inset-0 -z-10">
        <Image src={image.src} alt={image.alt} fill priority sizes="100vw" quality={80} unoptimized className="object-cover [filter:brightness(1.08)_saturate(1.18)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950/65 via-primary-950/15 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-950/40 via-primary-950/10 to-transparent" />
      </div>

      <div className="container w-full pb-16 pt-28 sm:pb-20 sm:pt-36 lg:pb-24 lg:pt-40">
        <div className="relative isolate max-w-3xl break-words before:absolute before:-inset-x-8 before:-inset-y-6 before:-z-10 before:rounded-full before:bg-primary-950/40 before:blur-3xl">
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} className="text-eyebrow uppercase text-accent-300 drop-shadow-sm">
            Premium Vertical Garden
          </motion.p>
          <motion.h1
            id="hero-title"
            aria-label="Artificial Plants Wholesaler and Supplier in Mumbai"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-full text-[clamp(2rem,6vw,4rem)] leading-[1.08] tracking-[-0.03em] text-accent-300 drop-shadow-[0_3px_12px_rgba(0,0,0,0.55)]"
          >
            Artificial Plants
            <span className="block text-white" aria-hidden="true">Wholesaler &amp; <span className="inline-grid align-bottom">
              <span className="invisible col-start-1 row-start-1">Manufacturer</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={BUSINESS_TERMS[termIndex]} className="col-start-1 row-start-1 inline-block" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
                  {BUSINESS_TERMS[termIndex]}
                </motion.span>
              </AnimatePresence>
            </span></span>
            <span className="block text-primary-200">in Mumbai</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.65, ease: [0.22, 1, 0.36, 1] }} className="mt-6 max-w-xl text-base leading-relaxed text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)] sm:text-lg">
            Lifelike artificial trees, plants and vertical-garden décor — designed to stay beautiful all year, with no watering, sunlight or pruning.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }} className="mt-10 flex flex-wrap items-center gap-4">
            <ButtonLink href="/collections" size="xl" variant="light" className="group">
              Shop Collections <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </ButtonLink>
            <ButtonLink href="/contact" size="xl" variant="ghost" className="text-white hover:bg-white/10">
              Plan a vertical garden
            </ButtonLink>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
