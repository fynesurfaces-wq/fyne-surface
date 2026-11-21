import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { ArrowRight, Building2, Droplets, Leaf, Sparkles } from 'lucide-react';
import { getCollections, getProducts } from '@/lib/api.server';
import { Hero } from '@/components/home/Hero';
import { CollectionTiles } from '@/components/home/CollectionTiles';
import { ProductCarousel } from '@/components/home/ProductCarousel';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Motion';
import { BotanicalArt } from '@/components/ui/BotanicalArt';

export const revalidate = 300; // ISR

export const metadata: Metadata = { alternates: { canonical: '/' } };

/** Use /public/images/hero.jpg automatically once it's added. */
const HERO_IMAGE = fs.existsSync(path.join(process.cwd(), 'public/images/hero.jpg')) ? '/images/hero.jpg' : null;

const PROMISES = [
  { icon: Droplets, title: 'Zero maintenance', text: 'No watering, sunlight or pruning — ever.' },
  { icon: Leaf, title: 'Lifelike detail', text: 'Natural leaf colour, texture and form.' },
  { icon: Building2, title: 'Made for every space', text: 'Homes, offices, hotels and retail.' },
  { icon: Sparkles, title: 'Always in season', text: 'Green and fresh every day of the year.' },
];

export default async function HomePage() {
  const [collections, featured] = await Promise.all([getCollections(), getProducts({ featured: true, limit: 8 })]);
  // Best sellers: featured products first; fall back to newest if none are featured yet.
  const bestSellers = featured.data.length >= 4 ? featured.data : (await getProducts({ limit: 8, sort: '-createdAt' })).data;

  return (
    <>
      <Hero image={HERO_IMAGE} />

      {/* Brand promises */}
      <section aria-label="Why FYNE" className="border-b border-line bg-white">
        <ul className="container grid grid-cols-2 gap-x-6 gap-y-8 py-12 lg:grid-cols-4 lg:py-14">
          {PROMISES.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 0.08} className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary"><p.icon className="h-5 w-5" /></span>
              <span>
                <span className="block text-[15px] font-semibold text-ink">{p.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-ink-muted">{p.text}</span>
              </span>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Featured collections */}
      {collections.length > 0 && (
        <section aria-labelledby="collections-heading" className="container py-24 lg:py-32">
          <Reveal className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end lg:mb-16">
            <div className="max-w-2xl">
              <p className="text-eyebrow uppercase text-accent">Shop by collection</p>
              <h2 id="collections-heading" className="mt-4 text-display-lg text-ink">Curated for every scale.</h2>
            </div>
            <p className="max-w-sm text-[17px] leading-relaxed text-ink-muted">From statement trees over 1.2 metres to compact tabletop plants and bush packs for green walls.</p>
          </Reveal>
          <CollectionTiles collections={collections} />
        </section>
      )}

      {/* Best sellers */}
      {bestSellers.length > 0 && (
        <section aria-labelledby="bestsellers-heading" className="bg-canvas py-24 lg:py-32">
          <div className="container">
            <Reveal className="mb-12 max-w-2xl lg:mb-16">
              <p className="text-eyebrow uppercase text-accent">Best sellers</p>
              <h2 id="bestsellers-heading" className="mt-4 text-display-lg text-ink">Loved in homes & lobbies.</h2>
            </Reveal>
            <ProductCarousel products={bestSellers} />
            <div className="mt-12 flex justify-center">
              <ButtonLink href="/collections" variant="outline" size="lg" className="group">
                View all products <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ButtonLink>
            </div>
          </div>
        </section>
      )}

      {/* Vertical garden / B2B band */}
      <section aria-labelledby="projects-heading" className="container py-24 lg:py-32">
        <div className="grid items-center gap-12 overflow-hidden rounded-[2rem] bg-primary-900 lg:grid-cols-2 lg:gap-0">
          <Reveal className="px-8 py-14 sm:px-12 lg:px-16 lg:py-20">
            <p className="text-eyebrow uppercase text-accent-300">For architects & businesses</p>
            <h2 id="projects-heading" className="mt-4 text-display-md text-white">Planning a vertical garden or a large installation?</h2>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-white/70">
              Share your space, size and style — our team will recommend the right plants, bush packs and quantities for green walls, lobbies and hospitality projects.
            </p>
            <ButtonLink href="/pages/contact" variant="accent" size="lg" className="mt-9">Request a quote</ButtonLink>
          </Reveal>
          <div className="relative h-80 lg:h-full lg:min-h-[520px]">
            <BotanicalArt seed="vertical-garden" variant="hero" />
          </div>
        </div>
      </section>
    </>
  );
}
