'use strict';

/** Import the X'clusive Greenwall catalog prepared from the supplied PDF and ZIP. */
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { Collection, Product } = require('../models');
const { slugify, uniqueSlug } = require('../utils/slug');

const APPLY = process.argv.includes('--apply');
const COLLECTION_NAME = "X'Clusive Greenwall";
const COLLECTION_SLUG = 'x-clusive-greenwall';
const CATALOG = require('./exclusive-greenwall-catalog.json');
const PUBLIC_IMAGE_PREFIX = '/images/collections/xclusive-greenwall';

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const collectionDescription = '<p>Explore FYNE SURFACES X\'clusive Greenwall panels and grills for indoor and outdoor spaces. The collection includes 1 x 1 m and 1.5 x 1 m panels, plus 2 x 1 m grill options. Coverage and material details vary by item; check each product listing for its catalog dimensions and price.</p>';

function contentFor(item) {
  const productLabel = 'Artificial wall panel';
  const safeName = escapeHtml(productLabel);
  const safeCode = escapeHtml(item.catalogCode);
  const safeApplication = escapeHtml(item.application);
  const safeSize = escapeHtml(item.size);
  const safeCoverage = escapeHtml(item.coverage);
  const shortDescription = `${productLabel} (${item.catalogCode}) is an artificial wall panel for ${item.application.toLowerCase()}. Size ${item.size}; coverage ${item.coverage}.`;
  const description = `<p>${safeName} is part of the FYNE SURFACES X'clusive Greenwall collection.</p><p>Catalog code: ${safeCode}. Size: ${safeSize}. Coverage: ${safeCoverage}. Application: ${safeApplication}.</p>`;
  const imageAlt = `${productLabel}, artificial wall panel ${item.size}, FYNE SURFACES`;
  return {
    shortDescription, description, imageAlt,
    tags: ['artificial plants', 'xclusive greenwall', 'vertical garden', 'wall plants'],
    seo: {
      metaTitle: `${item.catalogCode} | FYNE SURFACES`.slice(0, 70),
      metaDescription: `Shop ${productLabel} by FYNE SURFACES. ${item.size}, approximately ${item.coverage}. Artificial plants in Mumbai for ${item.application.toLowerCase()}.`.slice(0, 170),
      keywords: ['artificial plants in Mumbai', 'xclusive greenwall', 'artificial wall plants', 'vertical garden panels', item.catalogCode.toLowerCase()],
    },
    faqs: [
      { question: `What size is this panel?`, answer: `The catalog lists this item as ${item.size}, with approximately ${item.coverage}.` },
      { question: `Where can this panel be used?`, answer: `The catalog lists the application as ${item.application}.` },
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
      indoorOutdoor: 'both',
      additional: {
        'Catalog code': item.catalogCode,
        'Panel or grill size': item.size,
        'Catalog coverage': item.coverage,
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
  return { sku: item.sku, action: existing ? 'updated' : 'created', price: item.price };
}

async function run() {
  await connectDB();
  const skus = CATALOG.map((item) => item.sku);
  const existingProducts = await Product.find().where('sku').in(skus).select('sku').lean();
  const found = new Set(existingProducts.map((product) => product.sku));
  const existingCollection = await Collection.findOne({ slug: COLLECTION_SLUG });
  console.log(`[xclusive greenwall import] target collection: ${existingCollection?.name || COLLECTION_NAME}`);
  console.log(`[xclusive greenwall import] catalog items: ${CATALOG.length}; existing products: ${found.size}; new products: ${CATALOG.length - found.size}`);
  if (!APPLY) {
    console.log('[xclusive greenwall import] dry run only. Add --apply to save the collection and products.');
    return;
  }

  if (!existingCollection) throw new Error(`Existing collection ${COLLECTION_SLUG} not found; refusing to create a duplicate.`);
  const collection = existingCollection;
  collection.set({
    name: COLLECTION_NAME,
    slug: COLLECTION_SLUG,
    description: collectionDescription,
    isActive: true,
    sortOrder: existingCollection?.sortOrder ?? 21,
    seo: {
      metaTitle: "X'clusive Greenwall Collection | FYNE SURFACES",
      metaDescription: 'Shop artificial wall panels and grills in 1 x 1 m, 1.5 x 1 m and 2 x 1 m sizes. Explore artificial plants in Mumbai from FYNE SURFACES.',
      keywords: ['artificial plants in Mumbai', 'xclusive greenwall', 'artificial wall panels', 'vertical garden'],
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
    if (firstImage) collection.coverImage = { url: firstImage.url, alt: "X'clusive artificial greenwall panel from FYNE SURFACES" };
    await collection.save();
  }
  console.table(results);
  console.log('[xclusive greenwall import] new listings start with zero stock; update stock in Admin before accepting orders.');
}

run()
  .catch((error) => {
    console.error('[xclusive greenwall import] failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
