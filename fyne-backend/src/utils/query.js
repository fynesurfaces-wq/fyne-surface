'use strict';

/**
 * Shared helpers for server-side pagination, sorting and search — the contract
 * every admin Data Table uses:
 *
 *   ?page=1&limit=20&sort=-createdAt,name&q=rhodo&<resource filters>
 *
 * Response shape: { success, data: [...], pagination: { page, limit, total, totalPages, hasNextPage, hasPrevPage } }
 */
const { escapeRegex } = require('./helpers');

function parsePagination(query = {}, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

/** "-price,name" → { price: -1, name: 1, _id: -1 }, only for whitelisted fields. */
function parseSort(sortParam, allowed = [], fallback = '-createdAt') {
  const build = (str, whitelist) => {
    const sort = {};
    for (const raw of String(str || '').split(',')) {
      const f = raw.trim();
      if (!f) continue;
      const desc = f.startsWith('-');
      const key = desc ? f.slice(1) : f;
      if (!whitelist || whitelist.includes(key)) sort[key] = desc ? -1 : 1;
    }
    return sort;
  };
  let sort = build(sortParam, allowed);
  if (!Object.keys(sort).length) sort = build(fallback, null);
  if (!sort._id) sort._id = -1; // stable ordering for pagination
  return sort;
}

/** Case-insensitive partial match across fields → { $or: [...] } (or null). */
function searchFilter(term, fields = []) {
  const t = String(term ?? '').trim().slice(0, 100);
  if (!t || !fields.length) return null;
  const rx = new RegExp(escapeRegex(t), 'i');
  return { $or: fields.map((f) => ({ [f]: rx })) };
}

/** Combine filters safely with $and. */
const combine = (...filters) => {
  const parts = filters.filter((f) => f && Object.keys(f).length);
  if (!parts.length) return {};
  return parts.length === 1 ? parts[0] : { $and: parts };
};

async function paginate(Model, filter, { page, limit, skip, sort, select, populate, lean = true }) {
  let q = Model.find(filter).sort(sort).skip(skip).limit(limit);
  if (select) q = q.select(select);
  if (populate) q = q.populate(populate);
  if (lean) q = q.lean();
  const [items, total] = await Promise.all([q, Model.countDocuments(filter)]);
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
}

/** Parse ?from=&to= (ISO dates). Defaults to the last `days` days. */
function parseDateRange(query = {}, days = 30) {
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from ? new Date(query.from) : new Date(to.getTime() - days * 86400000);
  if (Number.isNaN(to.getTime()) || Number.isNaN(from.getTime()) || from > to) {
    const now = new Date();
    return { from: new Date(now.getTime() - days * 86400000), to: now };
  }
  if (query.to && /^\d{4}-\d{2}-\d{2}$/.test(query.to)) to.setUTCHours(23, 59, 59, 999);
  return { from, to };
}

module.exports = { parsePagination, parseSort, searchFilter, combine, paginate, parseDateRange };
