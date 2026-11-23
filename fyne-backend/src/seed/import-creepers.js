'use strict';

/** Import the labeled Hanging Creepers photos and catalog details. */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { Collection, Media, Product, User } = require('../models');
const { slugify, uniqueSlug } = require('../utils/slug');
const { uploadBuffer, destroy, isConfigured } = require('../services/upload.service');

const APPLY = process.argv.includes('--apply');
const COLLECTION_SLUG = 'hanging-creepers';
const CATALOG = require('./creepers-catalog.json');
const ASSET_DIR = path.join(__dirname, 'assets', 'creepers');

function contentFor(item) {
  const name = `Hanging Creeper ${item.sku}`;
  const imageAlt = `Artificial hanging creeper ${item.sku}, ${item.heightFt} ft long, pack of ${item.packSize}`;
  const shortDescription = `${name} by FYNE SURFACES is ${item.heightFt} ft (${item.heightCm} cm) long and supplied in a pack of ${item.packSize}.`;
  const description = `<p>${name} is an artificial hanging creeper by FYNE SURFACES.</p><p>Catalog dimensions: ${item.heightFt} ft (${item.heightCm} cm). Pack size: ${item.packSize} ${item.packSize === 1 ? 'piece' : 'pieces'}.</p><p>Suitable for adding cascading greenery to indoor décor, planters and vertical garden displays.</p>`;
  return {
    name,
    imageAlt,
    shortDescription,
    description,
    tags: ['artificial hanging creeper', 'hanging artificial plant', 'artificial vine', 'vertical garden'],
    seo: {
      metaTitle: `${name} | Artificial Hanging Plant | FYNE`.slice(0, 70),
      metaDescription: `Shop ${name} by FYNE SURFACES. ${item.heightFt} ft (${item.heightCm} cm) long, pack of ${item.packSize}. See product details and price.`.slice(0, 170),
      keywords: ['artificial hanging creeper', 'artificial hanging plant', 'artificial vine', 'vertical garden', item.sku.toLowerCase()],
    },
    faqs: [
      { question: `What is the size of Hanging Creeper ${item.sku}?`, answer: `The catalog lists a length of ${item.heightFt} ft (${item.heightCm} cm).` },
      { question: `How many pieces are included in ${item.sku}?`, answer: `The catalog lists ${item.packSize} ${item.packSize === 1 ? 'piece' : 'pieces'} in this pack.` },
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
    uploaded = await uploadBuffer(fs.readFileSync(assetPath), { folder: 'products', filename: item.imageFile, mimeType: 'image/jpeg' });
    mediaDoc = await Media.create({
      url: uploaded.secure_url, publicId: uploaded.public_id, alt: details.imageAlt,
      format: uploaded.format, bytes: uploaded.bytes, width: uploaded.width, height: uploaded.height,
      folder: 'products', uploadedBy: uploader?._id,
    });
  }
  const images = imageAlreadyAttached ? currentImages : [...currentImages, { url: uploaded.secure_url, publicId: uploaded.public_id, alt: details.imageAlt }];
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
      specifications: { height: { value: item.heightFt, unit: 'ft' }, packSize: item.packSize, additional: { 'Catalog metric height': `${item.heightCm} cm` } },
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
  const existing = await Product.find({ sku: { $in: CATALOG.map((item) => item.sku) } }).select('sku').lean();
  const found = new Set(existing.map((product) => product.sku));
  console.log(`[creepers import] collection: ${collection.name}`);
  console.log(`[creepers import] catalog items: ${CATALOG.length}; existing: ${found.size}; new: ${CATALOG.length - found.size}`);
  console.log('[creepers import] products will be active for the storefront; new records start with stock 0.');
  if (!APPLY) {
    console.log('[creepers import] dry run only. Add --apply to upload images and save product records.');
    return;
  }
  if (!isConfigured) throw new Error('ImageKit is not configured; no product records were changed.');
  const uploader = await User.findOne({ role: 'superadmin', isActive: true }).select('_id').lean();
  const results = [];
  for (const item of CATALOG) {
    // Sequential uploads keep requests within the media provider's limits.
    // eslint-disable-next-line no-await-in-loop
    results.push(await importOne(item, collection, uploader));
  }
  console.table(results);
}

run().catch((error) => {
  console.error('[creepers import] failed:', error.message);
  process.exitCode = 1;
}).finally(() => mongoose.connection.close());
