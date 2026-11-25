import type { Metadata } from 'next';
import { getCollections, getProducts } from '@/lib/api.server';
import { CollectionTiles } from '@/components/home/CollectionTiles';
import { ProductGrid } from '@/components/product/ProductGrid';
import { JsonLd } from '@/components/seo/JsonLd';
import { SITE_URL } from '@/lib/utils';
import { FaqSection } from '@/components/seo/FaqSection';
import { collectionIndexFaqs } from '@/lib/page-faqs';
import { SeoAnswerSection } from '@/components/seo/SeoAnswerSection';
import { PageBanner } from '@/components/layout/PageBanner';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Artificial Plant Collections in Mumbai | FYNE SURFACES',
  description: 'Browse artificial plants in Mumbai across FYNE SURFACES collections, from tall decorative trees to compact plants and bush packs for vertical gardens.',
  alternates: { canonical: '/collections' },
};

async function getAllProducts() {
  const products = [];
  for (let page = 1; ; page += 1) {
    const result = await getProducts({ page, limit: 60 });
    products.push(...result.data);
    if (!result.pagination.hasNextPage) return products;
  }
}

export default async function CollectionsIndex() {
  const [collections, allProducts] = await Promise.all([getCollections(), getAllProducts()]);

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
      <PageBanner eyebrow="Shop" title="Artificial Plant Collections in Mumbai" description="Artificial plants organised by scale — from statement trees to bush packs for vertical gardens." image="/images/banners/lush-tropical-greenery-wall.webp" imageAlt="Lush tropical green wall with layered botanical foliage" priority />
      <section className="container pb-20 pt-12 lg:pb-28 lg:pt-20">
        <CollectionTiles collections={collections} />
      </section>

      {allProducts.length > 0 && (
        <section aria-labelledby="all-products" className="bg-canvas py-20 lg:py-28">
          <div className="container">
            <h2 id="all-products" className="mb-12 text-display-md text-ink">Every product</h2>
            <ProductGrid products={allProducts} headingLevel="h3" />
          </div>
        </section>
      )}

      <SeoAnswerSection
        heading="How to choose artificial plants"
        paragraphs={[
          `Browse artificial plants in Mumbai across ${collections.length ? collections.map((collection) => collection.name).join(', ') : 'our available plant collections'} to compare styles and find plants for your space. The collection pages group products by type so you can narrow your options before opening a product.`,
          'Check each product page for its photographs, listed size, specifications, current availability and price. For a vertical garden or a larger commercial project, contact FYNE SURFACES with your approximate measurements to discuss product selection and quantities.',
        ]}
      />
      <FaqSection faqs={collectionIndexFaqs(collections)} id="collections-faqs" />
    </>
  );
}
