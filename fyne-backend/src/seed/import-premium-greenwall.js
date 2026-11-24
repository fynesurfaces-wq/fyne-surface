'use strict';

/** Import the 2026 Premium Greenwall catalog prepared from the supplied PDF and image archive. */
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { Collection, Product } = require('../models');
const { slugify, uniqueSlug } = require('../utils/slug');

const APPLY = process.argv.includes('--apply');
const COLLECTION_NAME = 'Premium Greenwall';
const COLLECTION_SLUG = 'premium-greenwall';
const CATALOG = require('./premium-greenwall-catalog.json');
const PUBLIC_IMAGE_PREFIX = '/images/collections/premium-greenwall';

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const collectionDescription = '<p>Explore the FYNE SURFACES Premium Greenwall collection: artificial wall panels and tiles for indoor and outdoor spaces. Catalog items are listed as 20 x 20 inches and cover approximately 2.7 sq ft per piece or tile. Check each product listing for its price, application and any variant details.</p>';

function contentFor(item) {
  const productLabel = 'Artificial wall panel';
  const safeName = escapeHtml(productLabel);
  const safeCode = escapeHtml(item.catalogCode);
  const safeApplication = escapeHtml(item.application);
  const safeSize = escapeHtml(item.size);
  const safeCoverage = escapeHtml(item.coverage);
  const shortDescription = `${productLabel} (${item.catalogCode}) is a ${item.application.toLowerCase()} artificial wall panel. Size ${item.size}; coverage ${item.coverage}.`;
  const description = `<p>${safeName} is listed in the FYNE SURFACES Premium Greenwall collection.</p><p>Catalog code: ${safeCode}. Size: ${safeSize}. Coverage: ${safeCoverage}. Application: ${safeApplication}.</p>`;
  const imageAlt = `${productLabel}, artificial wall panel ${item.size}, FYNE SURFACES`;

  return {
    shortDescription,
    description,
    imageAlt,
    tags: ['artificial plants', 'premium greenwall', 'vertical garden', 'wall plants'],
    seo: {
      metaTitle: `${item.catalogCode} | FYNE SURFACES`.slice(0, 70),
      metaDescription: `Shop ${productLabel} by FYNE SURFACES. ${item.size}, approximately ${item.coverage}. Listed for ${item.application.toLowerCase()}.`.slice(0, 170),
      keywords: ['premium greenwall', 'artificial wall plants', 'vertical garden tiles', item.catalogCode.toLowerCase()],
    },
    faqs: [
      { question: `What size is this panel?`, answer: `The catalog lists this panel as ${item.size}, with approximately ${item.coverage}.` },
      { question: `Where can this panel be used?`, answer: `The catalog lists the application as ${item.application}.` },
    ],
  };
}

async function importOne(item, collection) {
  const existing = await Product.findOne({ sku: item.sku });
  const currentImages = (existing?.images || []).map((image) => image.toObject ? image.toObject() : image);
  const details = contentFor(item);
  const imageUrl = `${PUBLIC_IMAGE_PREFIX}/${item.imageFile}`;
  const imageAlreadyAttached = currentImages.some((image) => image.alt === details.imageAlt && image.url === imageUrl);
  const images = imageAlreadyAttached
    ? currentImages
    : [...currentImages, { url: imageUrl, alt: details.imageAlt }];
  const product = existing || new Product({ sku: item.sku });
  try {
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
        indoorOutdoor: 'both',
        additional: {
          'Catalog code': item.catalogCode,
          'Tile size': item.size,
          'Coverage per tile': item.coverage,
          'Catalog application': item.application,
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
  } catch (error) {
    throw error;
  }

  return { sku: item.sku, action: existing ? 'updated' : 'created', price: item.price };
}

async function run() {
  await connectDB();
  const skus = CATALOG.map((item) => item.sku);
  const existingProducts = await Product.find().where('sku').in(skus).select('sku').lean();
  const found = new Set(existingProducts.map((product) => product.sku));
  const existingCollection = await Collection.findOne({ slug: COLLECTION_SLUG });
  console.log(`[premium greenwall import] collection: ${existingCollection?.name || COLLECTION_NAME}`);
  console.log(`[premium greenwall import] catalog items: ${CATALOG.length}; existing products: ${found.size}; new products: ${CATALOG.length - found.size}`);

  if (!APPLY) {
    console.log('[premium greenwall import] dry run only. Add --apply to save the collection and products.');
    return;
  }

  const collection = existingCollection || new Collection({ slug: COLLECTION_SLUG });
  collection.set({
    name: COLLECTION_NAME,
    slug: COLLECTION_SLUG,
    description: collectionDescription,
    isActive: true,
    sortOrder: existingCollection?.sortOrder ?? 20,
    seo: {
      metaTitle: 'Premium Greenwall Collection | FYNE SURFACES',
      metaDescription: 'Shop 20 x 20 inch artificial wall panels for indoor and outdoor spaces. Each tile covers approximately 2.7 sq ft.',
      keywords: ['premium greenwall', 'artificial wall plants', 'vertical garden tiles'],
    },
  });
  await collection.save();

  const results = [];
  for (const item of CATALOG) {
    // Keep uploads sequential to avoid bursts against the media provider.
    // eslint-disable-next-line no-await-in-loop
    const result = await importOne(item, collection);
    results.push(result);
  }
  if (!collection.coverImage) {
    const cover = await Product.findOne({ collection: collection._id, 'images.0': { $exists: true } }).sort({ createdAt: 1 }).select('images').lean();
    const firstImage = cover?.images?.[0];
    if (firstImage) collection.coverImage = { url: firstImage.url, alt: 'Premium artificial greenwall panel from FYNE SURFACES' };
    await collection.save();
  }
  console.table(results);
  console.log('[premium greenwall import] new listings start with zero stock; update stock in Admin before accepting orders.');
}

run()
  .catch((error) => {
    console.error('[premium greenwall import] failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
