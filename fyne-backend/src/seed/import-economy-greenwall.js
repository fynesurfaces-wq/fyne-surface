'use strict';

/** Import the 2025 Economy Greenwall catalog using its pre-existing collection. */
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { Collection, Product } = require('../models');
const { slugify, uniqueSlug } = require('../utils/slug');

const APPLY = process.argv.includes('--apply');
const COLLECTION_NAME = 'Economy Greenwall';
const COLLECTION_SLUG = 'economy-greenwall';
const CATALOG = require('./economy-greenwall-catalog.json');
const PUBLIC_IMAGE_PREFIX = '/images/collections/economy-greenwall';

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

function contentFor(item) {
  const productLabel = 'Artificial wall panel';
  const safeName = escapeHtml(productLabel);
  const safeCode = escapeHtml(item.catalogCode);
  const safeSize = escapeHtml(item.size);
  const safeCoverage = escapeHtml(item.coverage);
  const shortDescription = `${productLabel} (${item.catalogCode}) is an indoor artificial wall panel. Size ${item.size}; coverage ${item.coverage}.`;
  const description = `<p>${safeName} is part of the FYNE SURFACES Economy Greenwall collection.</p><p>Catalog code: ${safeCode}. Size: ${safeSize}. Coverage: ${safeCoverage}. Application: indoor use.</p>`;
  const imageAlt = `${productLabel}, indoor artificial wall panel ${item.size}, FYNE SURFACES`;
  return {
    shortDescription, description, imageAlt,
    tags: ['artificial plants', 'economy greenwall', 'indoor wall plants', 'vertical garden'],
    seo: {
      metaTitle: `${item.catalogCode} | FYNE SURFACES`.slice(0, 70),
      metaDescription: `Shop ${productLabel} by FYNE SURFACES. 16 x 24 inch indoor panel, approximately 2.6 sq ft coverage. Artificial plants in Mumbai.`.slice(0, 170),
      keywords: ['artificial plants in Mumbai', 'economy greenwall', '16 x 24 artificial wall panel', 'indoor wall plants', item.catalogCode.toLowerCase()],
    },
    faqs: [
      { question: `What size is this panel?`, answer: `The catalog lists this panel as ${item.size}, with approximately ${item.coverage} coverage per piece.` },
      { question: `Is this panel suitable for indoor use?`, answer: 'Yes. The catalog lists this product for indoor use.' },
    ],
  };
}

async function importOne(item, collection) {
  const existing = await Product.findOne({ sku: item.sku });
  const currentImages = (existing?.images || []).map((image) => image.toObject ? image.toObject() : image);
  const details = contentFor(item);
  const imageUrl = `${PUBLIC_IMAGE_PREFIX}/${item.imageFile}`;
  const images = currentImages.some((image) => image.alt === details.imageAlt && image.url === imageUrl)
    ? currentImages
    : [...currentImages, { url: imageUrl, alt: details.imageAlt }];
  const product = existing || new Product({ sku: item.sku });
  product.set({
    name: undefined,
    slug: existing?.slug || await uniqueSlug(Product, slugify(item.sku)),
    sku: item.sku,
    collection: collection._id,
    price: item.price,
    currency: 'INR',
    shortDescription: details.shortDescription,
    description: details.description,
    specifications: {
      indoorOutdoor: 'indoor',
      additional: {
        'Catalog code': item.catalogCode,
        'Panel size': item.size,
        'Coverage per piece': item.coverage,
        'Catalog application': 'Indoor use',
        ...(item.variant ? { Variant: item.variant } : {}),
      },
    },
    images,
    stock: existing ? existing.stock : 0,
    tags: details.tags,
    faqs: details.faqs,
    seo: details.seo,
    isActive: true,
    isFeatured: existing ? existing.isFeatured : false,
  });
  await product.save();
  return { sku: item.sku, action: existing ? 'updated' : 'created', price: item.price };
}

async function run() {
  await connectDB();
  const existingCollection = await Collection.findOne({ slug: COLLECTION_SLUG });
  if (!existingCollection) throw new Error(`Existing collection ${COLLECTION_SLUG} not found; refusing to create a duplicate.`);
  const skus = CATALOG.map((item) => item.sku);
  const existingProducts = await Product.find().where('sku').in(skus).select('sku').lean();
  const found = new Set(existingProducts.map((product) => product.sku));
  console.log(`[economy greenwall import] target collection: ${existingCollection.name} (${existingCollection.slug})`);
  console.log(`[economy greenwall import] catalog items: ${CATALOG.length}; existing products: ${found.size}; new products: ${CATALOG.length - found.size}`);
  if (!APPLY) {
    console.log('[economy greenwall import] dry run only. Add --apply to save the products.');
    return;
  }

  const collection = existingCollection;
  collection.set({
    name: COLLECTION_NAME,
    slug: COLLECTION_SLUG,
    description: '<p>Shop FYNE SURFACES Economy Greenwall panels in 16 x 24 inch format. Each piece covers approximately 2.6 sq ft and is catalogued for indoor use. Check individual product listings for code, price and variant details.</p>',
    isActive: true,
    seo: {
      metaTitle: 'Economy Greenwall Collection | FYNE SURFACES',
      metaDescription: 'Shop 16 x 24 inch indoor artificial wall panels with approximately 2.6 sq ft coverage per piece. Artificial plants in Mumbai from FYNE SURFACES.',
      keywords: ['artificial plants in Mumbai', 'economy greenwall', '16 x 24 artificial wall panels', 'indoor wall plants'],
    },
  });
  await collection.save();

  const results = [];
  for (const item of CATALOG) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await importOne(item, collection));
  }
  if (!collection.coverImage) {
    const cover = await Product.findOne({ collection: collection._id, 'images.0': { $exists: true } }).sort({ createdAt: 1 }).select('images').lean();
    const firstImage = cover?.images?.[0];
    if (firstImage) collection.coverImage = { url: firstImage.url, alt: 'Economy artificial wall panel from FYNE SURFACES' };
    await collection.save();
  }
  console.table(results);
  console.log('[economy greenwall import] new listings start with zero stock; update stock in Admin before accepting orders.');
}

run()
  .catch((error) => { console.error('[economy greenwall import] failed:', error.message); process.exitCode = 1; })
  .finally(() => mongoose.connection.close());
