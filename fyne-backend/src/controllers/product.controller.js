'use strict';

const env = require('../config/env');
const { Product, Collection, Setting } = require('../models');
const ApiError = require('../utils/ApiError');
const { asyncHandler, pick, isObjectId, toBool } = require('../utils/helpers');
const { parsePagination, parseSort, searchFilter, combine, paginate } = require('../utils/query');
const { uniqueSlug } = require('../utils/slug');
const { hasPermission, P } = require('../config/permissions');
const { toPublicProduct } = require('../utils/seo/aeo');
const { generateProductSchemaGraph, generateCollectionSchemaGraph, productUrl } = require('../utils/seo/jsonLd');
const { destroy } = require('../services/upload.service');
const { invalidateStoreCache } = require('../middleware/responseCache');

const FIELDS = [
  'name', 'slug', 'sku', 'collection', 'price', 'compareAtPrice', 'shortDescription', 'description',
  'specifications', 'images', 'stock', 'lowStockThreshold', 'tags', 'faqs', 'seo', 'isActive', 'isFeatured', 'isNewArrival',
];
const SORTABLE = ['name', 'sku', 'price', 'stock', 'createdAt', 'updatedAt'];
const LEGACY_BUSHES_SLUG = 'bushes-collection-0325';
const LEGACY_SPORTS_GRASS_SLUG = 'post-grass';

const lowStockExpr = {
  $expr: {
    $and: [
      { $gt: ['$stock', 0] },
      { $lte: ['$stock', { $ifNull: ['$lowStockThreshold', env.lowStockThreshold] }] },
    ],
  },
};

function adminFilter(q) {
  const f = {};
  if (q.collection && isObjectId(q.collection)) f.collection = q.collection;
  const active = toBool(q.isActive);
  if (active !== undefined) f.isActive = active;
  if (q.minPrice != null || q.maxPrice != null) {
    f.price = {};
    if (q.minPrice != null) f.price.$gte = Number(q.minPrice);
    if (q.maxPrice != null) f.price.$lte = Number(q.maxPrice);
  }
  if (q.tag) f.tags = String(q.tag).toLowerCase();
  if (q.stockStatus === 'out_of_stock') f.stock = { $lte: 0 };
  if (q.stockStatus === 'in_stock') f.stock = { $gt: 0 };
  return q.stockStatus === 'low_stock' ? combine(f, lowStockExpr) : f;
}

async function assertCollection(id) {
  if (!(await Collection.exists({ _id: id }))) throw new ApiError(422, 'Collection does not exist', 'INVALID_COLLECTION');
}

/** Admin response = raw document + live SEO preview (Google snippet + JSON-LD). */
async function withSeoPreview(product) {
  const settings = await Setting.getStore();
  const obj = product.toObject({ virtuals: true });
  const collection = obj.collection && obj.collection.name ? obj.collection : await Collection.findById(obj.collection).lean();
  const publicProduct = { ...obj, name: String(obj.name || '').trim() || undefined };
  const pub = toPublicProduct(publicProduct, { collection, settings, includeJsonLd: false });
  return {
    ...obj,
    seoPreview: {
      google: { title: pub.seo.title, url: pub.url, description: pub.seo.description },
      aiSummary: pub.summary,
      jsonLd: generateProductSchemaGraph(obj, { collection, settings }),
    },
  };
}

// ═══════════════════════════ ADMIN ═══════════════════════════

/** GET /api/v1/admin/products?page&limit&sort&q&collection&isActive&minPrice&maxPrice&stockStatus&tag */
exports.adminList = asyncHandler(async (req, res) => {
  const pg = parsePagination(req.query);
  const sort = parseSort(req.query.sort, SORTABLE);
  const filter = combine(adminFilter(req.query), searchFilter(req.query.q, ['name', 'sku', 'tags']));
  const { items, pagination } = await paginate(Product, filter, {
    ...pg,
    sort,
    select: 'name slug sku collection price compareAtPrice stock lowStockThreshold images isActive isFeatured isNewArrival tags updatedAt createdAt',
    populate: { path: 'collection', select: 'name slug' },
  });
  const data = items.map((p) => ({
    ...p,
    name: String(p.name || '').trim() || undefined,
    thumbnail: p.images?.[0]?.url || null,
    inventoryStatus: p.stock <= 0 ? 'out_of_stock' : p.stock <= (p.lowStockThreshold ?? env.lowStockThreshold) ? 'low_stock' : 'in_stock',
  }));
  res.json({ success: true, data, pagination });
});

/** GET /api/v1/admin/products/:id */
exports.adminGet = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('collection', 'name slug').populate('createdBy updatedBy', 'name');
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, data: await withSeoPreview(product) });
});

/** POST /api/v1/admin/products */
exports.create = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  await assertCollection(data.collection);
  data.slug = await uniqueSlug(Product, data.slug || data.name || data.sku);
  data.createdBy = req.user._id;
  data.updatedBy = req.user._id;
  const product = await Product.create(data);
  await product.populate('collection', 'name slug');
  await invalidateStoreCache('products', 'collections');
  res.status(201).json({ success: true, data: await withSeoPreview(product) });
});

/**
 * PATCH /api/v1/admin/products/:id
 * Slug is NOT regenerated when the name changes (keeps URLs/SEO stable);
 * send `slug` explicitly to change it.
 */
exports.update = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  const data = pick(req.body, FIELDS);
  if (data.collection) await assertCollection(data.collection);
  if (data.slug) data.slug = await uniqueSlug(Product, data.slug, { excludeId: product._id });

  // Clean up images removed from the gallery.
  let removedPublicIds = [];
  if (Array.isArray(data.images)) {
    const keep = new Set(data.images.map((i) => i.publicId).filter(Boolean));
    removedPublicIds = product.images.map((i) => i.publicId).filter((id) => id && !keep.has(id));
  }

  product.set({ ...data, updatedBy: req.user._id });
  await product.save();
  const deletionResults = await Promise.all(removedPublicIds.map((id) => destroy(id)));
  if (deletionResults.some((deleted) => !deleted)) {
    console.warn(`[product images] One or more removed images could not be deleted from ImageKit for product ${product._id}`);
  }
  await product.populate('collection', 'name slug');
  await invalidateStoreCache('products', 'collections');
  res.json({ success: true, data: await withSeoPreview(product) });
});

/** DELETE /api/v1/admin/products/:id — orders keep their snapshots, so this is safe. Prefer archiving (isActive=false). */
exports.remove = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  await Promise.all(product.images.map((i) => destroy(i.publicId)));
  await invalidateStoreCache('products', 'collections');
  res.json({ success: true, message: 'Product deleted' });
});

/** PATCH /api/v1/admin/products/:id/inventory  { mode: 'set'|'adjust', quantity } */
exports.updateInventory = asyncHandler(async (req, res) => {
  const { mode, quantity } = req.body;
  let product;
  if (mode === 'set') {
    if (quantity < 0) throw new ApiError(422, 'Stock cannot be negative');
    product = await Product.findByIdAndUpdate(req.params.id, { $set: { stock: quantity, updatedBy: req.user._id } }, { new: true });
  } else {
    // Atomic adjust that can never take stock below zero.
    product = await Product.findOneAndUpdate(
      { _id: req.params.id, stock: { $gte: Math.max(0, -quantity) } },
      { $inc: { stock: quantity }, $set: { updatedBy: req.user._id } },
      { new: true }
    );
    if (!product && (await Product.exists({ _id: req.params.id }))) throw new ApiError(409, 'Adjustment would make stock negative', 'INSUFFICIENT_STOCK');
  }
  if (!product) throw new ApiError(404, 'Product not found');
  await invalidateStoreCache('products', 'collections');
  res.json({ success: true, data: { _id: product._id, sku: product.sku, stock: product.stock } });
});

/** PATCH /api/v1/admin/products/bulk  { ids:[], action } — Shopify-style bulk actions. */
exports.bulk = asyncHandler(async (req, res) => {
  const { ids, action } = req.body;
  if (action === 'delete') {
    if (!hasPermission(req.user.role, P.PRODUCTS_DELETE)) throw new ApiError(403, 'You cannot delete products');
    const docs = await Product.find({ _id: { $in: ids } }).select('images');
    const r = await Product.deleteMany({ _id: { $in: ids } });
    docs.forEach((d) => d.images.forEach((i) => destroy(i.publicId)));
    await invalidateStoreCache('products', 'collections');
    return res.json({ success: true, data: { affected: r.deletedCount } });
  }
  const set = { activate: { isActive: true }, deactivate: { isActive: false }, feature: { isFeatured: true }, unfeature: { isFeatured: false } }[action];
  const r = await Product.updateMany({ _id: { $in: ids } }, { $set: { ...set, updatedBy: req.user._id } });
  await invalidateStoreCache('products', 'collections');
  return res.json({ success: true, data: { affected: r.modifiedCount } });
});

// ═══════════════════════════ STOREFRONT (public) ═══════════════════════════

/** GET /api/v1/store/products?collection=<slug>&q&minPrice&maxPrice&inStock&featured&sort&page&limit */
exports.storeList = asyncHandler(async (req, res) => {
  const settings = await Setting.getStore();
  const pg = parsePagination(req.query, { defaultLimit: 24, maxLimit: 60 });
  const sort = parseSort(req.query.sort, ['price', 'name', 'createdAt'], '-isFeatured,-createdAt');
  const base = { isActive: true };
  let collection = null;
  if (req.query.collection) {
    const requestedSlug = String(req.query.collection);
    const collectionSlug = requestedSlug === LEGACY_SPORTS_GRASS_SLUG ? 'sports-grass' : requestedSlug;
    collection = await Collection.findOne({ slug: collectionSlug, isActive: true }).lean()
      || (collectionSlug === 'bushes' && await Collection.findOne({ slug: LEGACY_BUSHES_SLUG, isActive: true }).lean())
      || (collectionSlug === 'sports-grass' && await Collection.findOne({ slug: LEGACY_SPORTS_GRASS_SLUG, isActive: true }).lean());
    if (!collection) throw new ApiError(404, 'Collection not found');
    base.collection = collection._id;
  }
  if (req.query.minPrice != null || req.query.maxPrice != null) {
    base.price = {};
    if (req.query.minPrice != null) base.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice != null) base.price.$lte = Number(req.query.maxPrice);
  }
  if (toBool(req.query.inStock)) base.stock = { $gt: 0 };
  if (toBool(req.query.featured)) base.isFeatured = true;
  if (toBool(req.query.newArrival)) base.isNewArrival = true;

  const filter = combine(base, searchFilter(req.query.q, ['name', 'sku', 'tags', 'shortDescription']));
  const { items, pagination } = await paginate(Product, filter, { ...pg, sort, populate: { path: 'collection', select: 'name slug' } });
  const data = items.map((p) => toPublicProduct(p, { settings, includeJsonLd: false }));

  res.json({
    success: true,
    data,
    pagination,
    ...(collection && { jsonLd: generateCollectionSchemaGraph(collection, items, { settings, offset: pg.skip }) }),
  });
});

/** GET /api/v1/store/products/:slug — full AEO payload + JSON-LD @graph. */
exports.storeGet = asyncHandler(async (req, res) => {
  const settings = await Setting.getStore();
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate('collection', 'name slug isActive').lean();
  if (!product) throw new ApiError(404, 'Product not found');

  const related = await Product.aggregate([
    { $match: { isActive: true, _id: { $ne: product._id } } },
    { $addFields: {
      _sharedTagScore: { $size: { $setIntersection: [{ $ifNull: ['$tags', []] }, product.tags || []] } },
      _availableScore: { $cond: [{ $gt: ['$stock', 0] }, 1, 0] },
      _recommendationShuffle: { $rand: {} },
    } },
    // Prefer products with tags in common and available stock; shuffle equally ranked candidates per request.
    { $sort: { collection: 1, _sharedTagScore: -1, _availableScore: -1, _recommendationShuffle: 1 } },
    // Keep the best matching product from every active collection.
    { $group: { _id: '$collection', product: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$product' } },
    { $lookup: { from: 'collections', localField: 'collection', foreignField: '_id', as: 'collectionDoc' } },
    { $match: { 'collectionDoc.isActive': true } },
    { $sort: { 'collectionDoc.name': 1 } },
    { $project: { name: 1, slug: 1, sku: 1, price: 1, images: { $slice: ['$images', 1] }, stock: 1, collectionName: { $ifNull: [{ $arrayElemAt: ['$collectionDoc.name', 0] }, 'Other collection'] } } },
  ]);

  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.json({
    success: true,
    data: {
      ...toPublicProduct(product, { settings }),
      related: related.map((r) => ({ name: r.name || r.sku, slug: r.slug, sku: r.sku, collectionName: r.collectionName, url: productUrl(r), price: r.price, image: r.images?.[0]?.url || null, imageUnoptimized: Boolean(r.images?.[0]?.unoptimized), inStock: r.stock > 0 })),
    },
  });
});
