import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowRight, Building2, Droplets, Leaf, Sparkles } from 'lucide-react';
import { getCollections, getLegacySiteContent, getProducts } from '@/lib/api.server';
import { Hero } from '@/components/home/Hero';
import { CollectionTiles } from '@/components/home/CollectionTiles';
import { ProductCarousel } from '@/components/home/ProductCarousel';
import { HomeImageCarousel } from '@/components/home/HomeImageCarousel';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Motion';
import { FaqSection } from '@/components/seo/FaqSection';
import { SeoAnswerSection } from '@/components/seo/SeoAnswerSection';
import { homeFaqs } from '@/lib/page-faqs';
import { LegacyCTA } from '@/components/home/LegacyCTA';
import { InstagramReels } from '@/components/home/InstagramReels';

export const revalidate = 0; // Product and collection imagery updates should appear on the next request.

export const metadata: Metadata = {
  title: { absolute: 'Artificial Plants & Green Walls in India | FYNE SURFACES' },
  description: 'Shop artificial plants, decorative trees, green wall panels and vertical garden products in India. Compare styles, specifications, prices and availability at FYNE SURFACES.',
  alternates: { canonical: '/' },
};

const HERO_IMAGE = { src: '/images/hero/modern-biophilic-scandinavian-home-office.png', alt: 'Bright Scandinavian home office with indoor plants, warm wood finishes and a large window' };

const HOME_IMAGES = [
  { src: '/images/home/balcony-garden.jpg', alt: 'Balcony styled with artificial plants and outdoor flooring', label: 'A greener balcony' },
  { src: '/images/home/greenwall-dining.jpg', alt: 'Green wall beside a dining and work table', label: 'Green walls at home' },
  { src: '/images/home/play-area-turf.png', alt: 'Soft green play area with colourful play balls', label: 'Play spaces' },
  { src: '/images/home/pet-friendly-lawn.jpg', alt: 'Dog relaxing on a green lawn', label: 'Room for pets' },
  { src: '/images/home/greenwall-window.jpg', alt: 'Lush vertical garden surrounding a window', label: 'Vertical gardens' },
  { src: '/images/home/playground-turf.jpg', alt: 'Playground with green artificial turf', label: 'Playground turf' },
  { src: '/images/home/sports-turf.jpg', alt: 'Football resting on a green sports field', label: 'Sports surfaces' },
  { src: '/images/home/office-greenwall.jpg', alt: 'Office meeting room with a planted green wall', label: 'Greener workspaces' },
  { src: '/images/home/planning-vertical-garden.webp', alt: 'Outdoor living space with artificial grass, garden plants and a covered seating area', label: 'Outdoor living' },
];

const PROMISES = [
  { icon: Droplets, title: 'Zero maintenance', text: 'No watering, sunlight or pruning — ever.' },
  { icon: Leaf, title: 'Lifelike detail', text: 'Natural leaf colour, texture and form.' },
  { icon: Building2, title: 'Made for every space', text: 'Homes, offices, hotels and retail.' },
  { icon: Sparkles, title: 'Always in season', text: 'Green and fresh every day of the year.' },
];

export default async function HomePage() {
  const [collections, legacyContent] = await Promise.all([getCollections(), getLegacySiteContent()]);
  const homeCollections = collections.filter((collection) => collection.productCount > 0).slice(0, 3);
  const featuredByCollection = await Promise.all(homeCollections.map(async (collection) => ({
    collection,
    products: (await getProducts({ collection: collection.slug, featured: true, limit: 10 })).data,
  })));
  const newArrivals = (await getProducts({ newArrival: true, sort: '-createdAt', limit: 10 })).data;

  return (
    <>
      <Hero image={HERO_IMAGE} />

      {/* Brand promises */}
      <section aria-label="Why FYNE" className="border-b border-line bg-white">
        <ul className="container grid grid-cols-1 gap-x-6 gap-y-6 py-10 sm:grid-cols-2 sm:gap-y-8 sm:py-12 lg:grid-cols-4 lg:py-14">
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
      {homeCollections.length > 0 && (
        <section aria-labelledby="collections-heading" className="container py-24 lg:py-32">
          <Reveal className="mb-12 max-w-2xl lg:mb-16">
            <p className="text-eyebrow uppercase text-accent-700">Shop by collection</p>
            <h2 id="collections-heading" className="mt-4 text-display-lg text-ink">Curated for every scale.</h2>
          </Reveal>
          <CollectionTiles collections={homeCollections} />
        </section>
      )}

      {featuredByCollection.map(({ collection, products }, index) => products.length > 0 && (
        <section key={collection.id} aria-labelledby={`featured-${collection.slug}-heading`} className={index % 2 === 0 ? 'bg-gradient-to-br from-canvas via-canvas to-primary-50/50 py-20 lg:py-28' : 'bg-white py-20 lg:py-28'}>
          <div className="container">
            <Reveal className="mb-12 max-w-2xl lg:mb-16">
              <p className="text-eyebrow uppercase text-accent-700">Featured collection</p>
              <h2 id={`featured-${collection.slug}-heading`} className="mt-4 text-display-lg text-ink">{collection.name}</h2>
              <p className="mt-4 text-[17px] leading-relaxed text-ink-muted">Explore featured products from the {collection.name} collection.</p>
            </Reveal>
            <ProductCarousel products={products.slice(0, 10)} />
            <div className="mt-10 flex justify-center">
              <ButtonLink href={`/collections/${collection.slug}`} variant="outline" size="lg" className="group">
                View {collection.name} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ButtonLink>
            </div>
          </div>
        </section>
      ))}

      {newArrivals.length > 0 && (
        <section aria-labelledby="new-arrivals-heading" className="bg-white py-20 lg:py-28">
          <div className="container">
            <Reveal className="mb-12 max-w-2xl lg:mb-16">
              <p className="text-eyebrow uppercase text-accent-700">Just added</p>
              <h2 id="new-arrivals-heading" className="mt-4 text-display-lg text-ink">New arrivals</h2>
              <p className="mt-4 text-[17px] leading-relaxed text-ink-muted">Discover the latest additions to our collection.</p>
            </Reveal>
            <ProductCarousel products={newArrivals} />
          </div>
        </section>
      )}

      {/* One-line auto-advancing home gallery */}
      <section aria-labelledby="spaces-heading" className="bg-canvas py-16 lg:py-20">
        <div className="container">
          <Reveal className="mb-8 max-w-2xl">
            <p className="text-eyebrow uppercase text-accent-700">Ideas for every space</p>
            <h2 id="spaces-heading" className="mt-3 text-display-md text-ink">Artificial plants for homes, offices and outdoor spaces.</h2>
          </Reveal>
          <HomeImageCarousel images={HOME_IMAGES} />
        </div>
      </section>

      {/* Vertical garden / B2B band */}
      <section aria-labelledby="projects-heading" className="container py-24 lg:py-32">
        <div className="grid items-center gap-12 overflow-hidden rounded-[2rem] bg-primary-900 lg:grid-cols-2 lg:gap-0">
          <Reveal className="px-8 py-14 sm:px-12 lg:px-16 lg:py-20">
            <p className="text-eyebrow uppercase text-accent-300">For architects & businesses</p>
            <h2 id="projects-heading" className="mt-4 text-display-md text-white">Planning a vertical garden or a large installation?</h2>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-white/70">
              Share your space, size and style — our team will recommend the right plants, bush packs and quantities for green walls, lobbies and hospitality projects. From Malad West, we work with spaces across Bandra, Andheri, Powai, Goregaon, Borivali, Thane and Navi Mumbai.
            </p>
            <ButtonLink href="/contact" variant="accent" size="lg" className="mt-9">Request a quote</ButtonLink>
          </Reveal>
          <div className="relative h-80 lg:h-full lg:min-h-[520px]">
            <Image
              src="/images/home/planning-vertical-garden.webp"
              alt="Outdoor living space with artificial grass, garden plants and a covered seating area"
              fill
              unoptimized
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <SeoAnswerSection
        heading="Artificial plants for homes, offices and projects"
        paragraphs={[
          'Shop lifelike artificial plants for home decoration, offices, hotels, retail spaces and events. Browse decorative trees, indoor plants, hanging creepers, bush packs and green wall panels, then compare each product’s photos, listed size, materials, price and availability.',
          'Choosing greenery for a small room, balcony, office or feature wall? Start with the space available and the look you want, then check product dimensions and listed indoor or outdoor suitability before ordering. Artificial plants need no watering or sunlight; follow the product listing for material-specific care.',
          'For a vertical garden, green wall or bulk order, share your city, approximate measurements and preferred products with the FYNE SURFACES team. We can discuss catalogue options and confirm current quantities, delivery coverage, pricing and any project support available.',
        ]}
      />

      <InstagramReels reels={legacyContent?.reels} />
      <LegacyCTA content={legacyContent} />
      <FaqSection faqs={homeFaqs(homeCollections)} id="home-faqs" />
    </>
  );
}
