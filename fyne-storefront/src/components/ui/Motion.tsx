'use client';

import { MotionConfig, motion, type Variants } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Respects the user's "reduce motion" OS setting everywhere. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user" transition={{ ease: EASE }}>{children}</MotionConfig>;
}

/** Fade + rise when scrolled into view (once). Content stays in the HTML for crawlers. */
export function Reveal({ children, delay = 0, y = 24, className, as = 'div' }: { children: React.ReactNode; delay?: number; y?: number; className?: string; as?: 'div' | 'section' | 'li' }) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(5px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </Comp>
  );
}

/** A restrained focus-in treatment for primary page and section headings. */
export function TextReveal({ children, className, delay = 0, as = 'h2', id }: { children: React.ReactNode; className?: string; delay?: number; as?: 'h1' | 'h2' | 'h3' | 'p'; id?: string }) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      id={id}
      initial={{ opacity: 0, y: 18, filter: 'blur(7px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.85, delay, ease: EASE }}
    >
      {children}
    </Comp>
  );
}

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item: Variants = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } } };

export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.ul className={className} variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}>
      {children}
    </motion.ul>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.li className={className} variants={item}>
      {children}
    </motion.li>
  );
}
