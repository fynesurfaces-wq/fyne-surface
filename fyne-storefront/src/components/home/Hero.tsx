'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { BotanicalArt } from '@/components/ui/BotanicalArt';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Full-bleed hero. Drop a high-resolution lifestyle photo at
 * /public/images/hero.jpg (≥ 2400px wide) and it's used automatically;
 * until then a brand-coloured botanical composition is shown.
 */
export function Hero({ image }: { image: string | null }) {
  return (
    <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-primary-950" aria-labelledby="hero-title">
      {/* Background */}
      <motion.div className="absolute inset-0 -z-10" initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 2.4, ease: EASE }}>
        {image ? (
          <Image src={image} alt="Lush artificial plants and trees styled in a sunlit living space" fill priority sizes="100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 grid grid-cols-2 opacity-90 sm:grid-cols-3">
            <div className="relative"><BotanicalArt seed="hero-a" variant="hero" /></div>
            <div className="relative hidden sm:block"><BotanicalArt seed="hero-palm" variant="hero" /></div>
            <div className="relative"><BotanicalArt seed="hero-c" variant="hero" /></div>
          </div>
        )}
        {/* Legibility gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-950/35 to-primary-950/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-950/60 via-transparent to-transparent" />
      </motion.div>

      <div className="container pb-20 pt-40 lg:pb-28">
        <div className="max-w-3xl">
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3, ease: EASE }} className="text-eyebrow uppercase text-accent-300">
            Premium Vertical Garden
          </motion.p>
          <motion.h1
            id="hero-title"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.45, ease: EASE }}
            className="mt-5 text-display-xl text-white"
          >
            Bring Nature
            <br />
            <span className="text-primary-200">Indoors.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.65, ease: EASE }} className="mt-7 max-w-xl text-lg leading-relaxed text-white/80 lg:text-xl">
            Lifelike artificial trees, plants and vertical-garden greenery — crafted to stay beautiful all year, with no water, sunlight or upkeep.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.8, ease: EASE }} className="mt-10 flex flex-wrap items-center gap-4">
            <ButtonLink href="/collections" size="xl" variant="light" className="group">
              Shop Collections <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </ButtonLink>
            <ButtonLink href="/pages/contact" size="xl" variant="ghost" className="text-white hover:bg-white/10">
              Plan a vertical garden
            </ButtonLink>
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div className="absolute bottom-8 right-8 hidden items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/60 lg:flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
        Scroll
        <span className="relative h-10 w-px overflow-hidden bg-white/20">
          <motion.span className="absolute inset-x-0 top-0 h-1/2 bg-white" animate={{ y: ['-100%', '200%'] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
        </span>
      </motion.div>
    </section>
  );
}
