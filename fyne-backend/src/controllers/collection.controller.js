'use strict';

const { Collection, Product, Setting } = require('../models');
const ApiError = require('../utils/ApiError');
const { asyncHandler, pick, toBool } = require('../utils/helpers');
const { parsePagination, parseSort, searchFilter, combine, paginate } = require('../utils/query');
const { uniqueSlug } = require('../utils/slug');
const { toPublicProduct } = require('../utils/seo/aeo');
const { generateCollectionSchemaGraph, collectionUrl } = require('../utils/seo/jsonLd');
const { stripHtml, truncate } = require('../utils/html');
const { destroy } = require('../services/upload.service');
const { invalidateStoreCache } = require('../middleware/responseCache');

const FIELDS = ['name', 'slug', 'description', 'coverImage', 'seo', 'isActive', 'sortOrder'];
const LEGACY_BUSHES_SLUG = 'bushes-collection-0325';
const canonicalCollectionSlug = (slug) => slug === LEGACY_BUSHES_SLUG ? 'bushes' : slug;

async function attachCounts(collections) {
  const ids = collections.map((c) => c._id);
  const counts = await Product.aggregate([
    { $match: { collection: { $in: ids } } },
    { $group: { _id: '$collection', total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c]));
  return collections.map((c) => ({ ...c, productCount: map.get(String(c._id))?.total || 0, activeProductCount: map.get(String(c._id))?.active || 0 }));
}

// ═══════════════════════════ ADMIN ═══════════════════════════

exports.adminList = asyncHandler(async (req, res) => {
  const pg = parsePagination(req.query);
  const sort = parseSort(req.query.sort, ['name', 'sortOrder', 'createdAt', 'updatedAt'], 'sortOrder,name');
  const base = {};
  const active = toBool(req.query.isActive);
  if (active !== undefined) base.isActive = active;
  const filter = combine(base, searchFilter(req.query.q, ['name', 'slug']));
  const { items, pagination } = await paginate(Collection, filter, { ...pg, sort });
  res.json({ success: true, data: await attachCounts(items), pagination });
});

exports.adminGet = asyncHandler(async (req, res) => {
  const collection = await Collection.findById(req.params.id).lean();
  if (!collection) throw new ApiError(404, 'Collection not found');
  const [withCount] = await attachCounts([collection]);
  res.json({ success: true, data: withCount });
});

exports.create = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  data.slug = await uniqueSlug(Collection, data.slug || data.name);
  data.createdBy = req.user._id;
  const collection = await Collection.create(data);
  await invalidateStoreCache('products', 'collections');
  res.status(201).json({ success: true, data: collection });
});

exports.update = asyncHandler(async (req, res) => {
  const collection = await Collection.findById(req.params.id);
  if (!collection) throw new ApiError(404, 'Collection not found');
  const data = pick(req.body, FIELDS);
  if (data.slug) data.slug = await uniqueSlug(Collection, data.slug, { excludeId: collection._id });
  const oldCover = collection.coverImage?.publicId;
  collection.set({ ...data, updatedBy: req.user._id });
  await collection.save();
  if (oldCover && 'coverImage' in data && data.coverImage?.publicId !== oldCover) destroy(oldCover);
  await invalidateStoreCache('products', 'collections');
  res.json({ success: true, data: collection });
});

/** Refuses to delete a non-empty collection (products require a collection). */
exports.remove = asyncHandler(async (req, res) => {
  const count = await Product.countDocuments({ collection: req.params.id });
  if (count) throw new ApiError(409, `Collection still has ${count} product(s). Move or delete them first.`, 'COLLECTION_NOT_EMPTY');
  const collection = await Collection.findByIdAndDelete(req.params.id);
  if (!collection) throw new ApiError(404, 'Collection not found');
  destroy(collection.coverImage?.publicId);
  await invalidateStoreCache('products', 'collections');
  res.json({ success: true, message: 'Collection deleted' });
});

// ═══════════════════════════ STOREFRONT ═══════════════════════════

/** GET /api/v1/store/collections */
exports.storeList = asyncHandler(async (_req, res) => {
  const collections = await Collection.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  const withCounts = await attachCounts(collections);
  res.set('Cache-Control', 'public, max-age=300');
  res.json({
    success: true,
    data: withCounts.map((c) => ({
      id: String(c._id),
      name: c.name,
      slug: canonicalCollectionSlug(c.slug),
      url: collectionUrl({ ...c, slug: canonicalCollectionSlug(c.slug) }),
      description: stripHtml(c.description),
      coverImage: c.coverImage || null,
      productCount: c.activeProductCount,
    })),
  });
});

/** GET /api/v1/store/collections/:slug?page&limit&sort — collection + its products + CollectionPage JSON-LD */
exports.storeGet = asyncHandler(async (req, res) => {
  const settings = await Setting.getStore();
  const requestedSlug = canonicalCollectionSlug(req.params.slug);
  const collection = await Collection.findOne({ slug: requestedSlug, isActive: true }).lean()
    || (requestedSlug === 'bushes' && await Collection.findOne({ slug: LEGACY_BUSHES_SLUG, isActive: true }).lean());
  if (!collection) throw new ApiError(404, 'Collection not found');
  collection.slug = canonicalCollectionSlug(collection.slug);

  const pg = parsePagination(req.query, { defaultLimit: 24, maxLimit: 60 });
  const sort = parseSort(req.query.sort, ['price', 'name', 'createdAt'], '-isFeatured,-createdAt');
  const { items, pagination } = await paginate(Product, { collection: collection._id, isActive: true }, { ...pg, sort });

  res.json({
    success: true,
    data: {
      id: String(collection._id),
      name: collection.name,
      slug: collection.slug,
      url: collectionUrl(collection),
      descriptionHtml: collection.description || '',
      coverImage: collection.coverImage || null,
      seo: {
        title: collection.seo?.metaTitle || `${collection.name} | Artificial Plants | ${settings.storeName}`.slice(0, 70),
        description: collection.seo?.metaDescription || truncate(stripHtml(collection.description), 160),
        canonicalUrl: collectionUrl(collection),
      },
      products: items.map((p) => toPublicProduct(p, { collection, settings, includeJsonLd: false })),
      jsonLd: generateCollectionSchemaGraph(collection, items, { settings, offset: pg.skip }),
    },
    pagination,
  });
});
