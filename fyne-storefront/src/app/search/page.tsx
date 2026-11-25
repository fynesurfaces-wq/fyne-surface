import type { Metadata } from 'next';
import { Search } from 'lucide-react';
import { searchProducts } from '@/lib/api.server';
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
  const res = q.length >= 2 ? await searchProducts(q, 60) : null;

  return (
    <>
    <PageBanner eyebrow="Search" title={q ? `Results for “${q}”` : 'Find artificial plants in Mumbai'} image="/images/banners/lush-greenery-frame-with-soft-shadows.webp" imageAlt="Botanical foliage framing a soft, sunlit center" priority />
    <section className="container pb-28 pt-12 lg:pt-16">

      <form action="/search" role="search" className="mt-8 flex max-w-xl items-center gap-2 rounded-full border border-line bg-white p-1.5 focus-within:border-primary">
        <Search className="ml-4 h-5 w-5 text-ink-muted" aria-hidden />
        <label htmlFor="q" className="sr-only">Search products</label>
        <input id="q" name="q" defaultValue={q} placeholder="Palm, orchid, FYN104E…" className="h-11 flex-1 bg-transparent text-[15px] focus:outline-none" />
        <button className="h-11 rounded-full bg-ink px-6 text-sm font-medium text-white hover:bg-primary-900">Search</button>
      </form>
      {q.length === 1 && <p className="mt-4 text-sm text-ink-muted">Enter at least two characters to search the catalogue.</p>}

      <div className="mt-14">
        {res && res.data.length > 0 && (
          <>
            <p className="mb-8 text-sm text-ink-muted">{res.pagination?.total ?? res.data.length} {(res.pagination?.total ?? res.data.length) === 1 ? 'product' : 'products'} found</p>
            <ProductGrid products={res.data} />
          </>
        )}
        {res && res.data.length === 0 && (
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
