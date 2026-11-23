import type { Metadata } from 'next';
import { Search } from 'lucide-react';
import { getProducts } from '@/lib/api.server';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ButtonLink } from '@/components/ui/Button';
import { TextReveal } from '@/components/ui/Motion';

type Props = { searchParams: { q?: string } };

export function generateMetadata({ searchParams }: Props): Metadata {
  const q = (searchParams.q || '').trim();
  return { title: q ? `Search: ${q}` : 'Search', robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: Props) {
  const q = (searchParams.q || '').trim().slice(0, 100);
  const res = q ? await getProducts({ q, limit: 60 }) : null;

  return (
    <section className="container pb-28 pt-12 lg:pt-16">
      <p className="text-eyebrow uppercase text-accent">Search</p>
      <TextReveal as="h1" className="mt-4 text-display-md text-ink">{q ? <>Results for “{q}” in Mumbai Artificial Greenery</> : 'Find Artificial Greenery for Mumbai Spaces'}</TextReveal>

      <form action="/search" role="search" className="mt-8 flex max-w-xl items-center gap-2 rounded-full border border-line bg-white p-1.5 focus-within:border-primary">
        <Search className="ml-4 h-5 w-5 text-ink-muted" aria-hidden />
        <label htmlFor="q" className="sr-only">Search products</label>
        <input id="q" name="q" defaultValue={q} placeholder="Palm, orchid, FYN104E…" className="h-11 flex-1 bg-transparent text-[15px] focus:outline-none" />
        <button className="h-11 rounded-full bg-ink px-6 text-sm font-medium text-white hover:bg-primary-900">Search</button>
      </form>

      <div className="mt-14">
        {res && res.data.length > 0 && (
          <>
            <p className="mb-8 text-sm text-ink-muted">{res.pagination.total} {res.pagination.total === 1 ? 'product' : 'products'} found</p>
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
  );
}
