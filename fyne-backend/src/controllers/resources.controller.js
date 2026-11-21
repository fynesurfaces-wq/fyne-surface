'use strict';

/**
 * Simple admin resources built on the CRUD factory:
 * Discounts, Content (pages & blog), Markets, Apps (integrations).
 */
const { Discount, Content, Market, Integration } = require('../models');
const { crud } = require('./factory');
const { toBool } = require('../utils/helpers');

exports.discounts = crud(Discount, {
  label: 'Discount',
  allowedFields: ['code', 'description', 'type', 'value', 'minSubtotal', 'maxDiscountAmount', 'startsAt', 'endsAt', 'usageLimit', 'oncePerCustomer', 'appliesTo', 'isActive'],
  searchFields: ['code', 'description'],
  sortable: ['code', 'usedCount', 'startsAt', 'endsAt', 'createdAt'],
  buildFilter: (q) => {
    const f = {};
    const active = toBool(q.isActive);
    if (active !== undefined) f.isActive = active;
    if (q.status === 'expired') f.endsAt = { $lt: new Date() };
    if (q.status === 'scheduled') f.startsAt = { $gt: new Date() };
    return f;
  },
});

exports.content = crud(Content, {
  label: 'Content',
  allowedFields: ['type', 'title', 'slug', 'excerpt', 'body', 'coverImage', 'tags', 'seo', 'status', 'publishedAt', 'author'],
  searchFields: ['title', 'excerpt', 'tags'],
  sortable: ['title', 'publishedAt', 'createdAt', 'updatedAt'],
  slugSource: 'title',
  slugScope: (data, doc) => ({ type: data.type || doc?.type }),
  populate: { path: 'author createdBy', select: 'name' },
  buildFilter: (q) => ({
    ...(q.type && { type: q.type }),
    ...(q.status && { status: q.status }),
  }),
});

exports.markets = crud(Market, {
  label: 'Market',
  allowedFields: ['name', 'countries', 'currency', 'priceAdjustmentPercent', 'subfolder', 'isPrimary', 'isActive'],
  searchFields: ['name', 'countries'],
  sortable: ['name', 'createdAt'],
});

exports.integrations = crud(Integration, {
  label: 'App',
  allowedFields: ['key', 'name', 'category', 'description', 'isEnabled', 'config'],
  searchFields: ['name', 'key', 'category'],
  sortable: ['name', 'category', 'createdAt'],
  buildFilter: (q) => ({ ...(q.category && { category: q.category }) }),
});
