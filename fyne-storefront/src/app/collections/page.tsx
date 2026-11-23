import type { Metadata } from 'next';
import { getCollections, getProducts } from '@/lib/api.server';
import { CollectionTiles } from '@/components/home/CollectionTiles';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Reveal } from '@/components/ui/Motion';
import { JsonLd } from '@/components/seo/JsonLd';
import { SITE_URL } from '@/lib/utils';
import { FaqSection } from '@/components/seo/FaqSection';
import { collectionIndexFaqs } from '@/lib/page-faqs';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'All Collections — Artificial Trees, Plants & Bushes',
  description: 'Browse every FYNE SURFACES collection: tall artificial trees above 1.2 m, compact plants under 1.2 m, and bush packs for vertical gardens.',
  alternates: { canonical: '/collections' },
};

export default async function CollectionsIndex() {
  const [collections, all] = await Promise.all([getCollections(), getProducts({ limit: 60 })]);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'All collections',
          url: `${SITE_URL}/collections`,
          mainEntity: { '@type': 'ItemList', itemListElement: collections.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: c.url, name: c.name })) },
        }}
      />
      <section className="container pb-20 pt-12 lg:pb-28 lg:pt-20">
        <Reveal className="mb-12 max-w-3xl lg:mb-16">
          <p className="text-eyebrow uppercase text-accent">Shop</p>
          <h1 className="mt-4 text-display-lg text-ink">All collections</h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-muted">Premium artificial greenery, organised by scale — from statement trees to bush packs for living walls.</p>
        </Reveal>
        <CollectionTiles collections={collections} />
      </section>

      {all.data.length > 0 && (
        <section aria-labelledby="all-products" className="bg-canvas py-20 lg:py-28">
          <div className="container">
            <h2 id="all-products" className="mb-12 text-display-md text-ink">Every product</h2>
            <ProductGrid products={all.data} headingLevel="h3" />
          </div>
        </section>
      )}

      <FaqSection faqs={collectionIndexFaqs(collections)} id="collections-faqs" />
    </>
  );
}
