'use strict';

/**
 * Import the Bushes catalog prepared from Bushes.zip.
 *
 * Default mode prints a dry-run summary. Add --apply to upload the photos to
 * ImageKit and upsert the products by SKU into the existing Bushes collection.
 * New products are active for the storefront, with zero stock until inventory
 * is entered in the admin.
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { Collection, Media, Product, User } = require('../models');
const { slugify, uniqueSlug } = require('../utils/slug');
const { uploadBuffer, destroy, isConfigured } = require('../services/upload.service');

const APPLY = process.argv.includes('--apply');
const COLLECTION_SLUG = 'bushes-collection-0325';
const CATALOG = require('./bushes-catalog.json');
const ASSET_DIR = path.join(__dirname, 'assets', 'bushes');

function contentFor(item) {
  const name = `Bush Pack ${item.sku}`;
  const imageAlt = `Artificial bush pack ${item.sku}, ${item.packSize} pieces for vertical gardens and green walls`;
  const shortDescription = `${name} includes ${item.packSize} artificial foliage pieces for vertical gardens, green walls and planters.`;
  const description = `<p>${name} by FYNE SURFACES includes ${item.packSize} artificial foliage pieces.</p><p>Use this bush pack to build vertical gardens, green walls, planters and landscaping displays.</p>`;
  const metaTitle = `Artificial Bush Pack ${item.sku} | FYNE SURFACES`.slice(0, 70);
  const metaDescription = `Shop artificial bush pack ${item.sku} by FYNE SURFACES. Includes ${item.packSize} foliage pieces for vertical gardens, green walls and planters.`.slice(0, 170);

  return {
    name,
    imageAlt,
    shortDescription,
    description,
    tags: ['artificial bush', 'bush pack', 'vertical garden', 'green wall'],
    seo: {
      metaTitle,
      metaDescription,
      keywords: ['artificial bush pack', 'artificial bushes', 'vertical garden plants', 'green wall foliage', item.sku.toLowerCase()],
    },
    faqs: [
      { question: `How many pieces are in Bush Pack ${item.sku}?`, answer: `The catalog lists ${item.packSize} pieces in this pack.` },
      { question: `Where can Bush Pack ${item.sku} be used?`, answer: 'The catalog describes bush packs for vertical gardens, green walls, planters and landscaping.' },
    ],
  };
}

async function importOne(item, collection, uploader) {
  const assetPath = path.join(ASSET_DIR, item.imageFile);
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
      filename: item.imageFile,
      mimeType: 'image/jpeg',
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

  try {
    product.set({
      name: details.name,
      slug: existing?.slug || await uniqueSlug(Product, slugify(`${details.name}-${item.sku}`)),
      collection: collection._id,
      price: item.price,
      currency: 'INR',
      shortDescription: details.shortDescription,
      description: details.description,
      specifications: { packSize: item.packSize },
      images,
      stock: existing ? existing.stock : 0,
      tags: details.tags,
      faqs: details.faqs,
      seo: details.seo,
      isActive: true,
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
  const existing = await Product.find().where('sku').in(skus).select('sku').lean();
  const found = new Set(existing.map((product) => product.sku));
  console.log(`[bushes import] collection: ${collection.name}`);
  console.log(`[bushes import] catalog items: ${CATALOG.length}; existing: ${found.size}; new: ${CATALOG.length - found.size}`);
  console.log('[bushes import] products will be active for the storefront; new records start with stock 0.');

  if (!APPLY) {
    console.log('[bushes import] dry run only. Add --apply to upload images and save product records.');
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
    console.error('[bushes import] failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
