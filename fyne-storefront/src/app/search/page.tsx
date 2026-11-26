import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { getCollections, getProducts, searchProducts } from '@/lib/api.server';
import type { CollectionSummary } from '@/lib/types';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ButtonLink } from '@/components/ui/Button';
import { PageBanner } from '@/components/layout/PageBanner';
import { FaqSection } from '@/components/seo/FaqSection';
import { searchFaqs } from '@/lib/page-faqs';

type Props = { searchParams: { q?: string } };

export function generateMetadata({ searchParams }: Props): Metadata {
  const q = (searchParams.q || '').trim();
  return { title: q ? `Search: ${q}` : 'Search', robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: Props) {
  const q = (searchParams.q || '').trim().slice(0, 100);
  let res: Awaited<ReturnType<typeof searchProducts>> | null = null;
  let collections: CollectionSummary[] = [];
  if (q.length >= 2) [res, collections] = await Promise.all([searchProducts(q, 60), getCollections()]);
  const normalizedQuery = q.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const terms = q.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const matchedCollections = collections.filter((collection) => {
    const searchable = `${collection.name} ${collection.slug} ${collection.description}`.toLowerCase();
    const normalized = searchable.replace(/[^a-z0-9]+/g, '');
    return Boolean(normalizedQuery && normalized.includes(normalizedQuery)) || (terms.length > 0 && terms.every((term) => searchable.includes(term)));
  });
  let collectionProductResults: Awaited<ReturnType<typeof getProducts>>[] = [];
  if (!res?.data.length && matchedCollections.length) {
    collectionProductResults = await Promise.all(matchedCollections.map((collection) => getProducts({ collection: collection.slug, limit: 60 })));
  }
  const products = [...(res?.data || []), ...collectionProductResults.flatMap((result) => result.data)]
    .filter((product, index, all) => all.findIndex((candidate) => candidate.id === product.id) === index);

  return (
    <>
    <PageBanner eyebrow="Search" title={q ? `Results for “${q}”` : 'Find artificial plants in Mumbai'} image="/images/banners/lush-greenery-frame-with-soft-shadows.webp" imageAlt="Botanical foliage framing a soft, sunlit center" priority />
    <section className="container pb-28 pt-12 lg:pt-16">

      <form action="/search" role="search" className="mt-8 flex max-w-xl items-center gap-2 rounded-full border border-line bg-white p-1.5 focus-within:border-primary">
        <Search className="ml-4 h-5 w-5 text-ink-muted" aria-hidden />
        <label htmlFor="q" className="sr-only">Search products, collections, and types</label>
        <input id="q" name="q" defaultValue={q} placeholder="Palm, green wall, Bushes, FYN104E…" className="h-11 flex-1 bg-transparent text-[15px] focus:outline-none" />
        <button className="h-11 rounded-full bg-ink px-6 text-sm font-medium text-white hover:bg-primary-900">Search</button>
      </form>
      {q.length === 1 && <p className="mt-4 text-sm text-ink-muted">Enter at least two characters to search the catalogue.</p>}

      <div className="mt-14">
        {matchedCollections.length > 0 && (
          <section className="mb-14" aria-labelledby="search-collections-heading">
            <h2 id="search-collections-heading" className="mb-5 font-serif text-2xl text-ink">Collections</h2>
            <ul className="flex flex-wrap gap-3">
              {matchedCollections.map((collection) => (
                <li key={collection.id}>
                  <Link href={`/collections/${collection.slug}`} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-5 py-3 font-medium text-primary-900 transition hover:border-primary/40 hover:bg-primary-50">
                    {collection.name}<span className="text-sm text-ink-muted">{collection.productCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {products.length > 0 && (
          <>
            <p className="mb-8 text-sm text-ink-muted">{res?.data.length ? res.pagination?.total ?? products.length : products.length} {(res?.data.length ? res.pagination?.total ?? products.length : products.length) === 1 ? 'product' : 'products'} found</p>
            <ProductGrid products={products} />
          </>
        )}
        {q.length >= 2 && products.length === 0 && matchedCollections.length === 0 && (
          <div className="rounded-3xl bg-canvas px-6 py-20 text-center">
            <h2 className="text-xl font-semibold text-ink">No products found</h2>
            <p className="mt-2 text-ink-muted">Try a product name, a SKU like FYN104E, or browse our collections.</p>
            <ButtonLink href="/collections" variant="outline" className="mt-7">Browse collections</ButtonLink>
          </div>
        )}
      </div>
    </section>
    <FaqSection faqs={searchFaqs(q)} id="search-faqs" />
    </>
  );
}
