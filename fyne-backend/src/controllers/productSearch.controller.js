'use strict';

const { Product, Collection, Setting } = require('../models');
const { asyncHandler } = require('../utils/helpers');
const { toPublicProduct } = require('../utils/seo/aeo');

exports.search = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 12);
  const q = String(req.query.q).trim().replace(/\s+/g, ' ');
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = new RegExp(escaped, 'i');
  const collectionMatches = await Collection.find({ isActive: true, $or: [{ name: matches }, { slug: matches }, { description: matches }] }).select('_id').lean();
  const clauses = [
    { name: matches }, { sku: matches }, { shortDescription: matches }, { description: matches },
    { tags: matches }, { 'specifications.trunkMaterial': matches }, { 'specifications.indoorOutdoor': matches },
    { 'specifications.leaves.material': matches }, { 'specifications.additional': matches },
  ];
  if (collectionMatches.length) clauses.push({ collection: { $in: collectionMatches.map((c) => c._id) } });
  const filter = { isActive: true, $or: clauses };
  const [products, total, settings] = await Promise.all([
    Product.find(filter).sort({ isFeatured: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('collection', 'name slug').lean(),
    Product.countDocuments(filter),
    Setting.getStore(),
  ]);
  res.json({ success: true, data: products.map((p) => toPublicProduct(p, { collection: p.collection, settings, includeJsonLd: false })), pagination: { page, limit, total, pages: Math.ceil(total / limit) }, query: q });
});
