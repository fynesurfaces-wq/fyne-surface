import { ArrowUpRight, Building2, Globe2, Leaf, PackageOpen, Sparkles, Store } from 'lucide-react';
import { PlantImage } from '@/components/ui/PlantImage';

const PRODUCTS = [
  { title: 'Premium Artificial Landscape Grass', icon: Leaf },
  { title: 'Sports Grass', detail: 'Football, cricket and other sports', icon: Sparkles },
  { title: 'Decorative Greenwalls', detail: 'Indoor and outdoor', icon: Building2 },
  { title: 'Hanging Creepers & Bunches', icon: Leaf },
  { title: 'Innovative Decorative Greenery Solutions', icon: PackageOpen },
];

const STATS = [
  { value: '1,500+', label: 'Dealer network', icon: Store },
  { value: '10+', label: 'Distributors', icon: Building2 },
  { value: 'PAN-INDIA', label: 'Market presence', icon: Globe2 },
  { value: 'GROWING', label: 'Product portfolio', icon: PackageOpen },
];

const STORY_IMAGES = [
  { src: '/images/home/planning-vertical-garden.webp', alt: 'Outdoor artificial grass and garden greenery', label: 'Landscape grass' },
  { src: '/images/banners/lush-tropical-greenery-wall.webp', alt: 'Lush decorative green wall with layered artificial foliage', label: 'Decorative greenwalls' },
  { src: '/images/banners/warm-modern-vertical-garden-entryway.webp', alt: 'Modern interior entryway with a vertical greenery feature', label: 'Greener interiors' },
];

export function OurStory() {
  return (
    <div className="container pb-16 sm:pb-20 lg:pb-24">
      <section className="relative isolate -mt-5 overflow-hidden rounded-[2rem] border border-[#e8eadf] bg-[#f7f8f3] p-5 shadow-soft sm:p-8 lg:rounded-[2.5rem] lg:p-12">
        <div aria-hidden className="absolute -right-20 -top-24 -z-10 h-80 w-80 rounded-full bg-accent-300/20 blur-3xl" />
        <div className="grid items-center gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="py-2 lg:py-5">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/80 px-3.5 py-2 text-eyebrow uppercase text-accent-700 shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-accent-500" /> Our story · Since 2010</p>
            <h2 className="mt-6 max-w-2xl font-serif text-4xl leading-[1.08] tracking-tight text-primary-950 sm:text-5xl lg:text-[3.5rem]">From Direct Decor to a <span className="text-primary">greener India.</span></h2>
            <div className="mt-7 space-y-4 border-l-2 border-accent-400 pl-5 text-[15px] leading-7 text-ink-soft sm:text-base sm:leading-8">
              <p>At FYNE Surfaces, our journey began in 2010 as Direct Decor, driven by a passion for transforming spaces through the beauty of greenery and innovative surface solutions.</p>
              <p>Over the years, we have grown into an established name in India’s artificial greenery market, building an extensive nationwide network of 1,500+ dealers and 10+ distributors. This network brings our products and solutions closer to customers, businesses and design professionals across the country.</p>
              <p>We believe every space deserves a touch of creativity, and every environment has the potential to become more beautiful, functional and inspiring.</p>
            </div>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-primary-950 shadow-sm ring-1 ring-primary/5"><span className="h-2 w-2 rounded-full bg-accent-500" /> Building greener spaces since 2010</div>
          </div>
          <div className="grid min-h-[360px] grid-cols-2 grid-rows-2 gap-3 sm:min-h-[430px] sm:gap-4">
            {STORY_IMAGES.map((image, index) => (
              <figure key={image.src} className={`group relative min-h-0 overflow-hidden rounded-2xl border border-white/80 bg-primary-100 shadow-image sm:rounded-3xl ${index === 0 ? 'row-span-2' : ''}`}>
                <PlantImage src={image.src} alt={image.alt} seed={image.label} sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 50vw" className="transition-transform duration-700 group-hover:scale-105" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary-950/80 via-primary-950/25 to-transparent px-3 pb-3 pt-10 text-xs font-semibold text-white sm:px-4 sm:pb-4 sm:pt-12 sm:text-sm">{image.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="story-products-heading" className="py-14 sm:py-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-eyebrow uppercase text-accent-700">What we do</p>
          <h2 id="story-products-heading" className="mt-3 font-serif text-3xl text-ink sm:text-4xl">Thoughtful greenery for every kind of space.</h2>
          <p className="mt-4 leading-7 text-ink-muted">Our expertise in artificial greenery spans a diverse range of products, thoughtfully curated for residential, commercial, hospitality and landscape environments.</p>
        </div>
        <ul className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map(({ title, detail, icon: Icon }) => (
            <li key={title} className="group flex min-h-28 items-start gap-4 rounded-2xl border border-[#e8eadf] bg-white p-5 shadow-[0_8px_24px_-22px_rgba(8,26,10,0.45)] transition duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-soft sm:p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary transition group-hover:bg-accent-100"><Icon className="h-5 w-5" /></span>
              <span><span className="block font-semibold leading-6 text-ink">{title}</span>{detail && <span className="mt-1 block text-sm text-ink-muted">{detail}</span>}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="beyond-greenery-heading" className="grid overflow-hidden rounded-[2rem] bg-primary-950 text-white lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative isolate flex min-h-64 flex-col justify-center overflow-hidden p-7 sm:p-10 lg:p-12">
          <div aria-hidden className="absolute -bottom-20 -left-16 -z-10 h-72 w-72 rounded-full bg-primary-700/60 blur-3xl" />
          <p className="text-eyebrow uppercase text-accent-300">Beyond greenery</p>
          <h2 id="beyond-greenery-heading" className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">More possibilities for modern living.</h2>
        </div>
        <div className="flex items-center border-t border-white/10 bg-white/[0.04] p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
          <p className="max-w-2xl text-[15px] leading-7 text-white/75">Our vision extends beyond artificial greenery. We continuously explore new materials, designs and surface innovations to expand the possibilities of modern living. By combining quality, aesthetics, product innovation and strong distribution partnerships, we strive to deliver solutions that create lasting value.</p>
        </div>
      </section>

      <section aria-labelledby="network-heading" className="py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-eyebrow uppercase text-accent-700">Our strength is our network</p>
          <h2 id="network-heading" className="mt-3 font-serif text-3xl text-ink sm:text-4xl">Built on trust, relationships and partnership.</h2>
          <p className="mt-4 leading-7 text-ink-muted">Our nationwide presence reflects the trust, relationships and partnerships we have built over the years. Together with our dealers, distributors and business partners, we are making innovative greenery and surface solutions accessible across India.</p>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STATS.map(({ value, label, icon: Icon }) => (
            <li key={label} className="group rounded-2xl border border-[#e8eadf] bg-white p-5 text-center shadow-[0_8px_24px_-22px_rgba(8,26,10,0.45)] transition duration-300 hover:-translate-y-1 hover:shadow-soft sm:p-7">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 transition group-hover:bg-accent-100"><Icon className="h-5 w-5 text-primary" /></span>
              <p className="mt-4 font-serif text-2xl font-semibold tracking-tight text-primary-950 sm:text-3xl">{value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted sm:text-sm">{label}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[1.75rem] border border-accent-200/80 bg-[#fff9ed] p-7 shadow-sm sm:p-9">
          <p className="text-eyebrow uppercase text-accent-800">Our vision</p>
          <h2 className="mt-3 font-serif text-2xl text-primary-950 sm:text-3xl">Setting new benchmarks.</h2>
          <p className="mt-4 text-[15px] leading-7 text-ink-soft">To continue being one of India’s most trusted and recognised brands in decorative greenery and innovative surface solutions, setting new benchmarks in quality, design and customer experience.</p>
        </article>
        <article className="rounded-[1.75rem] border border-primary-100 bg-[#f5f8f2] p-7 shadow-sm sm:p-9">
          <p className="text-eyebrow uppercase text-primary">Our promise</p>
          <h2 className="mt-3 font-serif text-2xl text-primary-950 sm:text-3xl">Made to create lasting value.</h2>
          <ul className="mt-5 space-y-3 text-[15px] font-medium text-ink-soft">
            {['Quality in every product.', 'Innovation in every collection.', 'Trust in every relationship.'].map((promise) => <li key={promise} className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-accent-500" />{promise}</li>)}
          </ul>
        </article>
      </section>

      <a href="https://www.instagram.com/fynesurfaces" target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-700">See what we’re creating <ArrowUpRight className="h-4 w-4" /></a>
    </div>
  );
}
