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

// Rendered per request (filters live in ?searchParams); API responses are still
// served from Next's Data Cache and revalidated every 5 minutes.
export const revalidate = 300;

type Props = { params: { slug: string }; searchParams: Record<string, string | string[] | undefined> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const res = await getCollection(params.slug, { limit: 1 });
  if (!res) return { title: 'Collection not found', robots: { index: false } };
  const c = res.data;
  const filtered = Object.keys(searchParams).length > 0;
  return {
    title: { absolute: c.seo.title },
    description: c.seo.description,
    // Filtered/sorted variants point at the clean collection URL (no duplicate content).
    alternates: { canonical: toPath(c.seo.canonicalUrl) },
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: {
      type: 'website',
      title: c.seo.title,
      description: c.seo.description,
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

      <FaqSection faqs={collectionFaqs(c.name, res.pagination.total)} id="collection-faqs" />
    </>
  );
}
