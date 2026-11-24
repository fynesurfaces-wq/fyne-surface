'use strict';

/**
 * Schema.org JSON-LD generators.
 *
 * Every public product response carries a ready-to-embed `jsonLd` object.
 * The storefront drops it into:
 *     <script type="application/ld+json">{JSON.stringify(product.jsonLd)}</script>
 *
 * Output is a single @graph containing Product (+ Offer), BreadcrumbList and,
 * when FAQs exist, FAQPage. This drives Google rich results (price,
 * availability) and gives AI answer engines clean, unambiguous facts.
 */
const env = require('../../config/env');
const { prune } = require('../helpers');
const { stripHtml, truncate } = require('../html');
const { buildAttributes, materialLabel } = require('./attributes');

const productUrl = (p) => `${env.siteUrl}/products/${p.slug}`;
const collectionUrl = (c) => `${env.siteUrl}/collections/${c.slug}`;
const ORG_ID = `${env.siteUrl}/#organization`;

const priceValidUntil = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

function productDescription(product) {
  const name = String(product.name || '').trim() || product.sku || 'Product';
  return (
    product.seo?.metaDescription ||
    product.shortDescription ||
    truncate(stripHtml(product.description), 300) ||
    `${name} — premium artificial plant by ${env.brand.name}.`
  );
}

/** Schema.org Product + Offer for one product. */
function generateProductJsonLd(product, { collection, settings } = {}) {
  const specs = product.specifications || {};
  const url = productUrl(product);
  const attributes = buildAttributes(specs);
  const inStock = product.isActive !== false && product.stock > 0;
  const materials = [specs.trunkMaterial && `${specs.trunkMaterial} trunk`, specs.leaves?.material && `${materialLabel(specs.leaves.material)} leaves`].filter(Boolean);
  const heightAttr = attributes.find((a) => a.key === 'height');

  return prune({
    '@type': 'Product',
    '@id': `${url}#product`,
    name: String(product.name || '').trim() || product.sku || 'Product',
    sku: product.sku,
    mpn: product.sku,
    url,
    description: productDescription(product),
    image: (product.images || []).map((i) => i.url),
    brand: { '@type': 'Brand', name: settings?.storeName || env.brand.name },
    manufacturer: { '@id': ORG_ID },
    category: collection?.name ? `Artificial Plants > ${collection.name}` : 'Artificial Plants',
    material: materials.length ? materials.join(', ') : undefined,
    height: heightAttr ? { '@type': 'QuantitativeValue', value: heightAttr.value, unitCode: heightAttr.unitCode, unitText: heightAttr.unit } : undefined,
    keywords: product.seo?.keywords?.length ? product.seo.keywords.join(', ') : undefined,
    additionalProperty: attributes.map((a) => ({ '@type': 'PropertyValue', name: a.name, value: a.value, unitCode: a.unitCode })),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'INR',
      price: Number(product.price).toFixed(2),
      priceValidUntil: priceValidUntil(),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': ORG_ID },
      ...(settings?.tax && {
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: Number(product.price).toFixed(2),
          priceCurrency: 'INR',
          valueAddedTaxIncluded: Boolean(settings.tax.pricesIncludeTax),
        },
      }),
    },
  });
}

function generateBreadcrumbJsonLd(trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: t.url })),
  };
}

function generateFaqJsonLd(faqs = []) {
  if (!faqs.length) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: stripHtml(f.answer) },
    })),
  };
}

function generateOrganizationJsonLd(settings = {}) {
  return prune({
    '@type': 'Organization',
    '@id': ORG_ID,
    name: settings.storeName || env.brand.name,
    slogan: settings.tagline || env.brand.tagline,
    url: env.siteUrl,
    logo: settings.logo?.url,
    email: settings.contact?.email,
    telephone: settings.contact?.phone,
    sameAs: Object.values(settings.social || {}).filter(Boolean),
  });
}

const productBreadcrumbs = (product, collection) => [
  { name: 'Home', url: env.siteUrl },
  ...(collection ? [{ name: collection.name, url: collectionUrl(collection) }] : []),
  { name: String(product.name || '').trim() || product.sku || 'Product', url: productUrl(product) },
];

/** Full graph for a product detail page. */
function generateProductSchemaGraph(product, { collection, settings } = {}) {
  const graph = [
    generateProductJsonLd(product, { collection, settings }),
    generateBreadcrumbJsonLd(productBreadcrumbs(product, collection)),
    generateFaqJsonLd(product.faqs),
    generateOrganizationJsonLd(settings),
  ].filter(Boolean);
  return { '@context': 'https://schema.org', '@graph': graph };
}

/** Collection page: CollectionPage + ItemList of products. */
function generateCollectionSchemaGraph(collection, products = [], { settings, offset = 0 } = {}) {
  const url = collectionUrl(collection);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      prune({
        '@type': 'CollectionPage',
        '@id': `${url}#collection`,
        name: collection.name,
        url,
        description: collection.seo?.metaDescription || truncate(stripHtml(collection.description), 300),
        image: collection.coverImage?.url,
        isPartOf: { '@type': 'WebSite', url: env.siteUrl, name: settings?.storeName || env.brand.name },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: products.length,
          itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: offset + i + 1, url: productUrl(p), name: String(p.name || '').trim() || p.sku || 'Product' })),
        },
      }),
      generateBreadcrumbJsonLd([{ name: 'Home', url: env.siteUrl }, { name: collection.name, url }]),
    ],
  };
}

module.exports = {
  productUrl,
  collectionUrl,
  productDescription,
  productBreadcrumbs,
  generateProductJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
  generateOrganizationJsonLd,
  generateProductSchemaGraph,
  generateCollectionSchemaGraph,
};
