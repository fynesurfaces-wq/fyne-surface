import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCollections, getProducts, getSettings } from '@/lib/api.server';
import { METRO_CITIES } from '@/lib/locations';
import { SITE_URL } from '@/lib/utils';
import { PageBanner } from '@/components/layout/PageBanner';
import { ProductGrid } from '@/components/product/ProductGrid';
import { JsonLd } from '@/components/seo/JsonLd';
import { FaqSection } from '@/components/seo/FaqSection';
import type { Faq } from '@/components/seo/FaqSection';
import { locationFaqs } from '@/lib/page-faqs';
import { ButtonLink } from '@/components/ui/Button';

type Props = { params: { city: string } };
export const revalidate = 3600;

export function generateStaticParams() { return METRO_CITIES.map(({ slug }) => ({ city: slug })); }

function findCity(slug: string) { return METRO_CITIES.find(({ slug: key }) => key === slug); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const place = findCity(params.city);
  if (!place) return { title: 'Location not found', robots: { index: false } };
  const title = `Premium Artificial Plants in ${place.city}`;
  return { title, description: `Explore artificial plants and vertical garden products for ${place.city}, ${place.state}. Compare specifications and check delivery availability for your address.`, alternates: { canonical: `/locations/${place.slug}` }, openGraph: { title, description: `Artificial plants, decorative greenery and vertical garden products for ${place.city}.` } };
}

export default async function LocationPage({ params }: Props) {
  const place = findCity(params.city);
  if (!place) notFound();
  const [products, settings, collections] = await Promise.all([getProducts({ limit: 8, sort: '-createdAt' }), getSettings(), getCollections()]);
  const title = `Premium Artificial Plants in ${place.city}`;
  const summary = `Browse the FYNE SURFACES artificial plant catalogue from ${place.city}, ${place.state}. Compare product photographs, listed dimensions, materials, prices and current stock online. Add available products to your cart, enter your delivery address and review the server-calculated total before placing a Cash on Delivery order.`;
  const faqs: Faq[] = locationFaqs(place.city, place.state);
  const nearbyCities = METRO_CITIES.filter((candidate) => candidate.state === place.state && candidate.slug !== place.slug).slice(0, 5);
  const localBusiness = {
    '@context': 'https://schema.org', '@type': 'LocalBusiness', '@id': `${SITE_URL}/locations/${place.slug}#business`,
    name: settings?.storeName || 'FYNE SURFACES', url: `${SITE_URL}/locations/${place.slug}`,
    description: `Online catalogue of artificial plants and vertical garden products serving ${place.city}, ${place.state}.`,
    areaServed: { '@type': 'City', name: place.city, containedInPlace: { '@type': 'AdministrativeArea', name: place.state } },
    email: settings?.contact?.email, telephone: settings?.contact?.phone, image: settings?.logo?.url,
    ...(settings?.contact?.address ? { address: { '@type': 'PostalAddress', streetAddress: settings.contact.address, addressLocality: 'Mumbai', addressRegion: 'Maharashtra', addressCountry: 'IN' } } : {}),
  };
  const faqSchema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) };
  return <>
    <JsonLd data={localBusiness} id="location-business-jsonld" />
    <JsonLd data={faqSchema} id="location-faq-jsonld" />
    <PageBanner eyebrow={`${place.city}, ${place.state}`} title={title} description={`Artificial greenery ideas and product information for homes, workspaces and projects in ${place.city}.`} image="/images/banners/serene-botanical-banner-with-trailing-vines.webp" imageAlt={`Botanical greenery banner for ${place.city}`} priority />
    <section className="container pb-16">
      <div className="my-10 grid gap-8 rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-accent-50 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
        <div><p className="text-eyebrow uppercase text-primary">Shopping guide · {place.city}</p><h2 className="mt-3 font-serif text-2xl text-ink">Plan your greenery with the details that matter.</h2><p className="mt-4 text-[15px] leading-7 text-ink-soft">{summary}</p></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"><div className="rounded-2xl bg-white/85 p-4"><p className="font-semibold text-ink">For homes and apartments</p><p className="mt-1 text-sm leading-6 text-ink-muted">Compare plant height, footprint and pot details with the room where it will sit.</p></div><div className="rounded-2xl bg-white/85 p-4"><p className="font-semibold text-ink">For offices and projects</p><p className="mt-1 text-sm leading-6 text-ink-muted">Review listed specifications and contact the team with approximate measurements for larger requirements.</p></div></div>
      </div>
      {collections.length > 0 && <section aria-labelledby="city-collections-heading" className="py-8"><div className="mb-6"><p className="text-eyebrow uppercase text-accent-700">Browse by product type</p><h2 id="city-collections-heading" className="mt-2 font-serif text-2xl text-ink">Explore collections available to {place.city}</h2></div><ul className="flex flex-wrap gap-2">{collections.map((collection) => <li key={collection.id}><Link href={`/collections/${collection.slug}`} className="inline-flex rounded-full border border-primary/15 bg-white px-4 py-2.5 text-sm font-medium text-primary-900 transition hover:border-primary/40 hover:bg-primary-50">{collection.name} <span className="ml-2 text-ink-muted">{collection.productCount}</span></Link></li>)}</ul></section>}
      <section aria-labelledby="city-products-heading" className="py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-eyebrow uppercase text-accent-700">Shop online</p><h2 id="city-products-heading" className="mt-2 text-display-md text-ink">Artificial plants for {place.city}</h2></div><Link href="/collections" className="text-sm font-semibold text-primary hover:underline">Browse all collections →</Link></div>
        {products.data.length ? <ProductGrid products={products.data} /> : <p className="rounded-2xl bg-canvas p-6 text-ink-muted">Product listings are temporarily unavailable. Browse the collections or contact our team for help.</p>}
      </section>
      <section aria-labelledby="city-shopping-heading" className="grid gap-8 border-t border-line py-12 md:grid-cols-2">
        <div><p className="text-eyebrow uppercase text-accent-700">A simple way to order</p><h2 id="city-shopping-heading" className="mt-2 font-serif text-2xl text-ink">From product details to delivery</h2><ol className="mt-5 space-y-4 text-sm leading-6 text-ink-soft"><li><strong className="text-ink">1. Compare.</strong> Check product dimensions, images, price and stock status.</li><li><strong className="text-ink">2. Add to cart.</strong> Choose the products and quantities that fit your space.</li><li><strong className="text-ink">3. Enter your address.</strong> The checkout shows shipping and the current total for review.</li><li><strong className="text-ink">4. Place your COD order.</strong> Pay the order total when it is delivered.</li></ol><ButtonLink href="/collections" variant="outline" className="mt-6">Browse collections</ButtonLink></div>
        <div className="rounded-3xl bg-canvas p-6 sm:p-8"><h3 className="font-serif text-xl text-ink">Planning for a larger space?</h3><p className="mt-3 text-sm leading-6 text-ink-muted">For a lobby, office, retail area or vertical garden, share the city, approximate dimensions and preferred greenery with the FYNE team. We can help you review options from the current catalogue.</p><ButtonLink href="/contact" size="sm" className="mt-5">Discuss a project</ButtonLink></div>
      </section>
      {nearbyCities.length > 0 && <nav aria-label={`Nearby ${place.state} city guides`} className="border-t border-line py-8"><p className="text-sm font-semibold text-ink">More city guides in {place.state}</p><ul className="mt-3 flex flex-wrap gap-2">{nearbyCities.map((candidate) => <li key={candidate.slug}><Link href={`/locations/${candidate.slug}`} className="rounded-full bg-primary-50 px-3 py-2 text-sm text-primary-900 hover:bg-primary-100">{candidate.city}</Link></li>)}</ul></nav>}
    </section>
    <FaqSection faqs={faqs} id={`location-${place.slug}-faq`} includeJsonLd={false} />
  </>;
}
