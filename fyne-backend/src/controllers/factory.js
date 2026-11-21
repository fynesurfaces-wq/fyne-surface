'use strict';

/**
 * Generic CRUD controller factory for simple admin resources
 * (Discounts, Content, Markets, Apps…). Every list endpoint speaks the same
 * Data Table contract: ?page&limit&sort&q + resource filters.
 */
const ApiError = require('../utils/ApiError');
const { asyncHandler, pick } = require('../utils/helpers');
const { parsePagination, parseSort, searchFilter, combine, paginate } = require('../utils/query');
const { uniqueSlug } = require('../utils/slug');

function crud(Model, {
  allowedFields = [],
  searchFields = [],
  sortable = ['createdAt', 'updatedAt'],
  buildFilter = () => ({}),
  populate,
  slugSource, // e.g. 'title' → auto-generate unique slug
  slugScope, // (data, doc) => scope object for slug uniqueness
  label = Model.modelName,
} = {}) {
  const hasCreatedBy = Boolean(Model.schema.path('createdBy'));

  const list = asyncHandler(async (req, res) => {
    const pg = parsePagination(req.query);
    const sort = parseSort(req.query.sort, sortable);
    const filter = combine(buildFilter(req.query, req), searchFilter(req.query.q, searchFields));
    const { items, pagination } = await paginate(Model, filter, { ...pg, sort, populate });
    res.json({ success: true, data: items, pagination });
  });

  const getOne = asyncHandler(async (req, res) => {
    let q = Model.findById(req.params.id);
    if (populate) q = q.populate(populate);
    const doc = await q;
    if (!doc) throw new ApiError(404, `${label} not found`);
    res.json({ success: true, data: doc });
  });

  const create = asyncHandler(async (req, res) => {
    const data = pick(req.body, allowedFields);
    if (slugSource) {
      data.slug = await uniqueSlug(Model, data.slug || data[slugSource], { scope: slugScope ? slugScope(data) : {} });
    }
    if (hasCreatedBy && req.user) data.createdBy = req.user._id;
    const doc = await Model.create(data);
    res.status(201).json({ success: true, data: doc });
  });

  const update = asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw new ApiError(404, `${label} not found`);
    const data = pick(req.body, allowedFields);
    if (slugSource && data.slug) {
      data.slug = await uniqueSlug(Model, data.slug, { excludeId: doc._id, scope: slugScope ? slugScope(data, doc) : {} });
    }
    doc.set(data);
    await doc.save();
    res.json({ success: true, data: doc });
  });

  const remove = asyncHandler(async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) throw new ApiError(404, `${label} not found`);
    res.json({ success: true, message: `${label} deleted` });
  });

  return { list, getOne, create, update, remove };
}

module.exports = { crud };
