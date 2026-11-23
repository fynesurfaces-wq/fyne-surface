'use client';

import Image from 'next/image';
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { BotanicalArt } from '@/components/ui/BotanicalArt';

const EASE = [0.22, 1, 0.36, 1] as const;
type HeroImage = { src: string; alt: string };

function BackgroundSlide({ image, index, count, progress }: { image: HeroImage; index: number; count: number; progress: MotionValue<number> }) {
  const start = Math.max(0, index / count - 0.02);
  const fadeInEnd = Math.min(1, index / count + 0.02);
  const fadeOutStart = Math.max(fadeInEnd, (index + 1) / count - 0.02);
  const end = Math.min(1, (index + 1) / count + 0.02);
  const opacity = useTransform(
    progress,
    [start, fadeInEnd, fadeOutStart, end],
    [index === 0 ? 1 : 0, 1, 1, index === count - 1 ? 1 : 0],
  );
  const scale = useTransform(progress, [start, end], [1.08, 1]);

  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={{ opacity, scale }} aria-hidden="true">
      <Image src={image.src} alt={image.alt} fill priority={index === 0} sizes="100vw" className="object-cover [filter:brightness(1.08)_saturate(1.18)]" />
    </motion.div>
  );
}

/** Pinned hero whose five lifestyle backgrounds crossfade as the visitor scrolls. */
export function Hero({ images }: { images: HeroImage[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    const nextIndex = Math.min(images.length - 1, Math.floor(progress * images.length));
    setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
  });

  return (
    <section ref={sectionRef} className="relative h-[500svh] bg-primary-950" aria-label="FYNE SURFACES visual introduction">
      <div className="sticky top-0 isolate flex h-[100svh] items-end overflow-hidden bg-primary-950">
        <div className="absolute inset-0 -z-10 bg-primary-950">
          {images.length ? images.map((image, index) => (
            <BackgroundSlide key={image.src} image={image} index={index} count={images.length} progress={scrollYProgress} />
          )) : (
            <div className="absolute inset-0 grid grid-cols-2 opacity-90 sm:grid-cols-3">
              <div className="relative"><BotanicalArt seed="hero-a" variant="hero" /></div>
              <div className="relative hidden sm:block"><BotanicalArt seed="hero-palm" variant="hero" /></div>
              <div className="relative"><BotanicalArt seed="hero-c" variant="hero" /></div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary-950/65 via-primary-950/15 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-950/40 via-primary-950/10 to-transparent" />
        </div>

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
              Artificial Greenery
              <br />
              <span className="text-primary-200">Dealers and manufacturers</span>
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

        <div className="absolute bottom-8 right-8 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-white/70" aria-hidden="true">
          <span>{String(activeIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span>
          <span className="relative h-10 w-px overflow-hidden bg-white/20">
            <motion.span className="absolute inset-x-0 top-0 h-1/2 bg-white" animate={{ y: ['-100%', '200%'] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
          </span>
          <span>Scroll</span>
        </div>
      </div>
    </section>
  );
}
