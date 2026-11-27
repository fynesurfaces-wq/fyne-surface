import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { getCollection } from '@/lib/api.server';
import { applyFilters, facetCounts, parseFilters, sortToApi } from '@/lib/filters';
import { SITE_URL, toPath } from '@/lib/utils';
import { JsonLd } from '@/components/seo/JsonLd';
import { CollectionHero } from '@/components/collection/CollectionHero';
import { FilterBar } from '@/components/collection/FilterBar';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ButtonLink } from '@/components/ui/Button';
import { FaqSection } from '@/components/seo/FaqSection';
import { collectionFaqs } from '@/lib/page-faqs';
import { SeoAnswerSection } from '@/components/seo/SeoAnswerSection';

// Render per request so admin catalog edits are visible immediately.
export const revalidate = 0;

type Props = { params: { slug: string }; searchParams: Record<string, string | string[] | undefined> };

function isSportsGrassCollection(collection: { slug: string; name: string }) {
  const identity = `${collection.slug} ${collection.name}`.toLowerCase();
  return identity.includes('sport') && identity.includes('grass');
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const res = await getCollection(params.slug, { limit: 1 });
  if (!res) return { title: 'Collection not found', robots: { index: false } };
  const c = res.data;
  const filtered = Object.keys(searchParams).length > 0;
  const isSportsGrass = isSportsGrassCollection(c);
  const title = isSportsGrass ? 'Sports Grass in India | FYNE SURFACES' : c.seo.title;
  const description = isSportsGrass
    ? 'Artificial sports grass and football turf in India. Compare specs and prices; ask about CC Grass, BellinTurf, wholesale supply and installation support.'
    : c.seo.description;
  return {
    title: { absolute: title },
    description,
    // Filtered/sorted variants point at the clean collection URL (no duplicate content).
    alternates: { canonical: toPath(c.seo.canonicalUrl) },
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: {
      type: 'website',
      title,
      description,
      url: toPath(c.seo.canonicalUrl),
      images: c.coverImage ? [{ url: c.coverImage.url, alt: c.coverImage.alt || c.name }] : undefined,
    },
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const filters = parseFilters(searchParams);
  // Collections are small (≤60 products): fetch once, filter by height/price on the server.
  const res = await getCollection(params.slug, { limit: 60, sort: sortToApi(filters.sort) });
  if (!res) notFound();

  const c = res.data;
  const products = applyFilters(c.products, filters);
  const counts = facetCounts(c.products, filters);
  const isSportsGrass = isSportsGrassCollection(c);

  return (
    <>
      <JsonLd data={c.jsonLd} id="collection-jsonld" />
      <CollectionHero
        title={c.name}
        descriptionHtml={c.descriptionHtml}
        cover={c.coverImage}
        count={res.pagination.total}
        seed={c.slug}
        breadcrumbs={[{ name: 'Home', url: SITE_URL }, { name: 'Collections', url: `${SITE_URL}/collections` }, { name: c.name, url: c.url }]}
      />

      <section aria-label={`${c.name} products`} className="container pb-28">
        <Suspense>
          <FilterBar active={filters} counts={counts} total={products.length} />
        </Suspense>

        <div className="pt-10 lg:pt-14">
          {products.length ? (
            <ProductGrid products={products} />
          ) : (
            <div className="flex flex-col items-center rounded-3xl bg-canvas px-6 py-20 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary shadow-soft"><SlidersHorizontal className="h-6 w-6" /></span>
              <h2 className="mt-5 text-xl font-semibold text-ink">No products match these filters</h2>
              <p className="mt-2 max-w-sm text-ink-muted">Try a different height or price range — or browse the full collection.</p>
              <ButtonLink href={`/collections/${c.slug}`} variant="outline" className="mt-7">Clear filters</ButtonLink>
            </div>
          )}
        </div>
      </section>

      <SeoAnswerSection
        variant="collection"
        heading={isSportsGrass ? 'Explore Our Sports Grass Collection' : `About the ${c.name} collection`}
        paragraphs={isSportsGrass ? [
          <>Create the perfect playing surface with <strong>FYNE Sports Grass</strong>, designed to bring comfort, durability, and performance to every game. Whether you’re setting up a football ground, cricket pitch, sports arena, school playground, or recreational area, our artificial sports grass provides a clean, consistent, and comfortable surface for year-round play.</>,
          <>Made for active use, <strong>artificial sports grass</strong> offers excellent durability, low maintenance, and an attractive natural grass-like appearance. It helps create a neat and well-maintained sports area without the regular watering, mowing, or upkeep required by natural grass.</>,
          <>Ideal for <strong>football grounds, cricket practice areas, outdoor sports facilities, and multi-purpose playgrounds</strong>, FYNE Sports Grass is a practical solution for residential, commercial, and professional sports spaces.</>,
          <>Discover quality <strong>synthetic sports turf, artificial football grass, and cricket ground grass</strong> designed to make every playing experience more enjoyable.</>,
          <>Searching for a <strong>CC Grass dealer in India</strong> or a <strong>BellinTurf dealer, supplier, or wholesaler</strong>? Contact FYNE SURFACES to confirm current brand availability, bulk supply options, and delivery for your project location.</>,
          <>For a <strong>football turf installer</strong> or sports turf project, share your location, playing use, and approximate area with our team so we can confirm whether installation support is available for your requirements.</>,
          <>Browse our Sports Grass collection to explore product photos, dimensions, specifications, pricing, and availability. Compare product details and use the available filters to find the right artificial grass solution for your sports and recreational needs.</>,
        ] : [
          `Browse the ${c.name} collection. ${c.seo.description}`,
          `This collection currently includes ${res.pagination.total} ${res.pagination.total === 1 ? 'product' : 'products'}. Compare product photos, listed dimensions, specifications, prices and availability on each product page. Use the collection filters to narrow products by the attributes shown.`,
        ]}
      />
      <FaqSection faqs={isSportsGrass ? [
        { question: 'Where can I find sports grass in India?', answer: 'Browse this FYNE SURFACES collection to compare listed artificial sports grass and football turf products, specifications, prices, and availability.' },
        { question: 'Does FYNE SURFACES supply CC Grass or BellinTurf?', answer: 'Contact FYNE SURFACES to confirm current CC Grass or BellinTurf availability, supplier details, and wholesale options.' },
        { question: 'Can you install football or sports turf?', answer: 'Share your project location, area, and intended use with the team to confirm current installation support.' },
        ...collectionFaqs(c.name, res.pagination.total).slice(0, 9),
      ] : collectionFaqs(c.name, res.pagination.total)} id="collection-faqs" />
    </>
  );
}
