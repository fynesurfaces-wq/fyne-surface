'use strict';

const { Product, Setting } = require('../models');
const { asyncHandler } = require('../utils/helpers');
const { toPublicProduct } = require('../utils/seo/aeo');

exports.search = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 12);
  const q = String(req.query.q).trim().replace(/\s+/g, ' ');
  const filter = { isActive: true, $text: { $search: q } };
  const [products, total, settings] = await Promise.all([
    Product.find(filter, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' }, createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('collection', 'name slug').lean(),
    Product.countDocuments(filter),
    Setting.getStore(),
  ]);
  res.json({ success: true, data: products.map((p) => toPublicProduct(p, { collection: p.collection, settings, includeJsonLd: false })), pagination: { page, limit, total, pages: Math.ceil(total / limit) }, query: q });
});
