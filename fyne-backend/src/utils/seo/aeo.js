'use strict';

/**
 * AEO / GEO presenter — shapes products for storefronts AND machines.
 *
 * AI answer engines (ChatGPT, Perplexity, Gemini, Claude) and shopping agents
 * do best with:
 *   • a factual one-paragraph `summary` (no marketing fluff) they can quote,
 *   • flat, explicitly-labelled `facts` (key → value) and `attributes`,
 *   • canonical URLs, breadcrumbs, FAQs, and Schema.org JSON-LD.
 * Every public product endpoint returns this shape.
 */
const env = require('../../config/env');
const { formatINR } = require('../helpers');
const { stripHtml, truncate } = require('../html');
const { buildAttributes } = require('./attributes');
const { productUrl, collectionUrl, productBreadcrumbs, generateProductSchemaGraph } = require('./jsonLd');

function buildSummary(p, collection, attributes, settings) {
  const brand = settings?.storeName || env.brand.name;
  const name = String(p.name || '').trim() || p.sku || 'Product';
  const sentences = [
    `${name} (SKU ${p.sku}) is a premium artificial plant by ${brand}${collection ? `, from the "${collection.name}" collection` : ''}.`,
  ];
  const specBits = attributes
    .filter((a) => ['height', 'leafCount', 'leafMaterial', 'trunkMaterial', 'flowerCount', 'packSize'].includes(a.key))
    .map((a) => `${a.name.toLowerCase()} ${a.display}`);
  if (specBits.length) sentences.push(`Specifications: ${specBits.join(', ')}.`);
  const taxNote = settings?.tax ? (settings.tax.pricesIncludeTax ? ', inclusive of GST' : ', excluding GST') : '';
  sentences.push(`Price: ${formatINR(p.price)} (INR${taxNote}).`);
  sentences.push(p.stock > 0 ? 'Currently in stock.' : 'Currently out of stock.');
  if (p.shortDescription) sentences.push(p.shortDescription);
  return sentences.join(' ');
}

/**
 * @param {object} p          product (lean or doc)
 * @param {object} opts       { collection, settings, includeJsonLd }
 */
function toPublicProduct(p, { collection, settings, includeJsonLd = true } = {}) {
  const coll = collection || (p.collection && p.collection.name ? p.collection : null);
  const shortDescription = String(p.shortDescription || '').trim();
  const descriptionName = /\s+by\s+/i.test(shortDescription) ? shortDescription.split(/\s+by\s+/i)[0].trim() : '';
  const tagName = (p.tags || []).find((tag) => String(tag || '').trim());
  const displayName = String(p.name || '').trim() || descriptionName || tagName || p.sku || 'Product';
  const publicProduct = { ...p, name: displayName };
  const attributes = buildAttributes(p.specifications || {});
  const url = productUrl(p);
  const plainDescription = stripHtml(p.description);

  const result = {
    id: String(p._id),
    name: displayName,
    slug: p.slug,
    sku: p.sku,
    url,
    brand: settings?.storeName || env.brand.name,
    category: 'Artificial Plants',
    collection: coll ? { id: String(coll._id), name: coll.name, slug: coll.slug, url: collectionUrl(coll) } : null,
    price: {
      amount: p.price,
      currency: 'INR',
      formatted: formatINR(p.price),
      compareAt: p.compareAtPrice || null,
      taxIncluded: settings?.tax ? Boolean(settings.tax.pricesIncludeTax) : null,
    },
    availability: { inStock: p.stock > 0, status: p.stock > 0 ? 'InStock' : 'OutOfStock' },
    summary: buildSummary(publicProduct, coll, attributes, settings),
    shortDescription: p.shortDescription || truncate(plainDescription, 200),
    descriptionHtml: p.description || '',
    descriptionText: plainDescription,
    specifications: p.specifications || {},
    attributes: attributes.map(({ key, name, value, unit, display }) => ({ key, name, value, unit, display })),
    facts: Object.fromEntries([
      ['brand', settings?.storeName || env.brand.name],
      ['sku', p.sku],
      ['collection', coll?.name],
      ['priceINR', p.price],
      ['inStock', p.stock > 0],
      ...attributes.map((a) => [a.key, a.display]),
    ].filter(([, v]) => v !== undefined && v !== null)),
    images: (p.images || []).map((i) => ({ url: i.url, alt: i.alt || `${displayName} — artificial plant by ${env.brand.name}`, ...(i.unoptimized && { unoptimized: true }) })),
    tags: p.tags || [],
    faqs: (p.faqs || []).map((f) => ({ question: f.question, answer: stripHtml(f.answer) })),
    isFeatured: Boolean(p.isFeatured),
    isNewArrival: Boolean(p.isNewArrival),
    seo: {
      title: String(p.seo?.metaTitle || '').trim() || `${displayName} | ${coll ? `${coll.name} | ` : ''}${env.brand.name}`.slice(0, 70),
      description: String(p.seo?.metaDescription || '').trim()
        || truncate(plainDescription || buildSummary(publicProduct, coll, attributes, settings), 160),
      keywords: p.seo?.keywords || [],
      canonicalUrl: url,
    },
    breadcrumbs: productBreadcrumbs(publicProduct, coll),
    updatedAt: p.updatedAt,
  };

  if (includeJsonLd) result.jsonLd = generateProductSchemaGraph(publicProduct, { collection: coll, settings });
  return result;
}

module.exports = { toPublicProduct, buildSummary };
