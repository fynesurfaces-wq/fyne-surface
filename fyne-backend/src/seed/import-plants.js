'use strict';

/**
 * Import the Plants catalog prepared from the FYNE 2024 catalog.
 *
 * Default mode only prints a dry-run summary. Add --apply to upload the images
 * to ImageKit and upsert products into the existing `plants` collection.
 * New products remain drafts with zero stock until reviewed in the admin.
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const env = require('../config/env');
const { connectDB } = require('../config/db');
const { Collection, Media, Product, User } = require('../models');
const { slugify, uniqueSlug } = require('../utils/slug');
const { uploadBuffer, destroy, isConfigured } = require('../services/upload.service');

const APPLY = process.argv.includes('--apply');
const COLLECTION_SLUG = 'plants';
const CATALOG = require('./plants-catalog.json');
const ASSET_DIR = path.join(__dirname, 'assets', 'plants');
const UNIQUE_PRODUCT_NAMES = {
  FYN101E: 'Palm - 4 ft, 19 leaves',
  FYN105E: 'Rubber Plant - 5 ft',
  FYN106E: 'Birds of Paradise - 5.3 ft',
  FYN108E: 'Dracaena - 4 ft',
  FYN110E: 'Codiaeum - 1.5 ft',
  FYN111E: 'Palm Tree - 3.2 ft',
  FYN112E: 'Palm Tree - 6 ft',
  FYN113E: 'Palm Tree - 2 ft',
  FYN114E: 'Rubber Plant - 3 ft',
  FYN118E: 'Birds of Paradise - 4.6 ft',
  FYN119E: 'Palm Tree - 4.3 ft',
  FYN120E: 'Palm - 4 ft, 8 leaves',
  FYN121E: 'Palm Tree - 5.3 ft',
  FYN122E: 'Palm - 3.4 ft, 12 leaves',
  FYN124E: 'Dracaena - 1.4 ft',
  FYN125E: 'Codiaeum - 3 ft',
  FYN128E: 'Birds of Paradise - 1.9 ft',
  FYN130E: 'Dracaena - 3.6 ft',
};
const productNameFor = (item) => {
  if (UNIQUE_PRODUCT_NAMES[item.sku]) return UNIQUE_PRODUCT_NAMES[item.sku];
  return item.name === 'Real Touch Foliage Plant' ? undefined : item.name;
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

function contentFor(item) {
  const facts = [`${item.height} ft high, measured without the pot`];
  if (item.leaves != null) facts.push(`${item.leaves.toLocaleString('en-IN')} ${item.leafMaterial ? `${item.leafMaterial} ` : ''}leaves`);
  if (item.flowers != null) facts.push(`${item.flowers} flowers`);
  if (item.trunk) facts.push(`${item.trunk.toLowerCase()} trunk`);
  if (item.note) facts.push(item.note);

  const productName = productNameFor(item);
  const label = productName || 'Artificial foliage plant';
  const name = escapeHtml(label);
  const sku = escapeHtml(item.sku);
  const factText = escapeHtml(facts.join('; '));
  const imageAlt = `${item.name} artificial plant by FYNE SURFACES, ${item.sku}`;
  const shortDescription = `${label}, an artificial plant listed at ${item.height} ft high. ${facts.slice(1).join('; ')}.`.slice(0, 500);
  const description = `<p>${name} (${sku}) is an artificial plant from FYNE SURFACES.</p><p>Catalog specifications: ${factText}.</p><p>Height is listed without the pot.</p>`;
  const metaTitle = `${productName || item.sku} | Artificial Plant | FYNE`.slice(0, 70);
  const metaDescription = `${label} by FYNE SURFACES. ${facts.join('. ')}. View dimensions and product details.`.slice(0, 170);
  const terms = [label.toLowerCase(), `artificial ${label.toLowerCase()}`, item.sku.toLowerCase(), 'artificial plants india'];

  return {
    imageAlt,
    shortDescription,
    description,
    tags: [...new Set(['artificial plant', label.toLowerCase(), 'plant decor'])],
    seo: { metaTitle, metaDescription, keywords: [...new Set(terms)] },
    faqs: [
      { question: `What are the dimensions of this plant?`, answer: `The catalog lists it at ${item.height} ft high, measured without the pot.` },
      { question: 'What materials and details are listed?', answer: facts.slice(1).join('; ') || 'See the product specifications for the details provided in the catalog.' },
    ],
  };
}

async function importOne(item, collection, uploader) {
  const assetPath = path.join(ASSET_DIR, `${item.sku}.png`);
  if (!fs.existsSync(assetPath)) throw new Error(`Missing image asset for ${item.sku}: ${assetPath}`);

  const existing = await Product.findOne({ sku: item.sku });
  const currentImages = (existing?.images || []).map((image) => image.toObject ? image.toObject() : image);
  const details = contentFor(item);
  const imageAlreadyAttached = currentImages.some((image) => image.alt === details.imageAlt);
  let uploaded;
  let mediaDoc;

  if (!imageAlreadyAttached) {
    uploaded = await uploadBuffer(fs.readFileSync(assetPath), {
      folder: 'products',
      filename: `${item.sku}.png`,
      mimeType: 'image/png',
    });
    mediaDoc = await Media.create({
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      alt: details.imageAlt,
      format: uploaded.format,
      bytes: uploaded.bytes,
      width: uploaded.width,
      height: uploaded.height,
      folder: 'products',
      uploadedBy: uploader?._id,
    });
  }

  const images = imageAlreadyAttached
    ? currentImages
    : [...currentImages, { url: uploaded.secure_url, publicId: uploaded.public_id, alt: details.imageAlt }];
  const product = existing || new Product({ sku: item.sku });
  const specs = {
    height: { value: item.height, unit: 'ft' },
    ...(item.leaves != null && { leaves: { count: item.leaves, ...(item.leafMaterial && { material: item.leafMaterial }) } }),
    ...(item.flowers != null && { flowers: item.flowers }),
    ...(item.trunk && { trunkMaterial: item.trunk }),
    ...(item.note && { additional: { 'Catalog note': item.note } }),
  };

  try {
    product.set({
      name: productNameFor(item),
      slug: existing?.slug || await uniqueSlug(Product, slugify(`${productNameFor(item) || item.sku}`)),
      collection: collection._id,
      price: item.price,
      currency: 'INR',
      shortDescription: details.shortDescription,
      description: details.description,
      specifications: specs,
      images,
      stock: existing ? existing.stock : 0,
      tags: details.tags,
      faqs: details.faqs,
      seo: details.seo,
      isActive: existing ? existing.isActive : false,
      isFeatured: existing ? existing.isFeatured : false,
      ...(uploader && { updatedBy: uploader._id }),
      ...(!existing && uploader && { createdBy: uploader._id }),
    });
    await product.save();
  } catch (error) {
    if (mediaDoc) await Media.deleteOne({ _id: mediaDoc._id });
    if (uploaded?.public_id) await destroy(uploaded.public_id);
    throw error;
  }

  return { sku: item.sku, action: existing ? 'updated' : 'created' };
}

async function run() {
  await connectDB();
  const collection = await Collection.findOne({ slug: COLLECTION_SLUG });
  if (!collection) throw new Error(`Collection "${COLLECTION_SLUG}" was not found; no records were changed.`);

  const skus = CATALOG.map((item) => item.sku);
  const existing = await Product.find({ sku: { $in: skus } }).select('sku').lean();
  const found = new Set(existing.map((product) => product.sku));
  console.log(`[plants import] collection: ${collection.name}`);
  console.log(`[plants import] catalog items: ${CATALOG.length}; existing: ${found.size}; new: ${CATALOG.length - found.size}`);
  console.log(`[plants import] new products will be drafts with stock 0; prices are from the supplied 2024 catalog.`);

  if (!APPLY) {
    console.log('[plants import] dry run only. Add --apply to upload images and save product records.');
    return;
  }
  if (!isConfigured) throw new Error('ImageKit is not configured; no product records were changed.');

  const uploader = await User.findOne({ role: 'superadmin', isActive: true }).select('_id').lean();
  const results = [];
  for (const item of CATALOG) {
    // Keep uploads sequential to avoid bursts against the media provider.
    // eslint-disable-next-line no-await-in-loop
    results.push(await importOne(item, collection, uploader));
  }
  console.table(results);
}

run()
  .catch((error) => {
    console.error('[plants import] failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
