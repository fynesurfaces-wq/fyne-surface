'use strict';

const env = require('../config/env');
const { NAVIGATION } = require('../config/navigation');
const { hasPermission, P } = require('../config/permissions');
const { Order, Product, Lead, Setting, Customer, Collection, Content } = require('../models');
const { asyncHandler, escapeRegex } = require('../utils/helpers');

async function badgeCounts(role) {
  const tasks = {};
  if (hasPermission(role, P.ORDERS_READ)) {
    tasks.ordersToFulfill = Order.countDocuments({ orderStatus: 'Pending', $or: [{ paymentStatus: 'Paid' }, { paymentMethod: { $in: ['cod', 'bank_transfer'] } }] });
  }
  if (hasPermission(role, P.PRODUCTS_READ)) {
    tasks.lowStock = Product.countDocuments({ $expr: { $lte: ['$stock', { $ifNull: ['$lowStockThreshold', env.lowStockThreshold] }] } });
  }
  if (hasPermission(role, P.LEADS_READ)) tasks.newLeads = Lead.countDocuments({ status: 'new' });
  const keys = Object.keys(tasks);
  const values = await Promise.all(Object.values(tasks));
  return Object.fromEntries(keys.map((k, i) => [k, values[i]]));
}

function filterItems(items, role, badges) {
  return items
    .filter((i) => !i.permission || hasPermission(role, i.permission))
    .map(({ permission, badge, children, ...rest }) => {
      const out = { ...rest };
      if (badge && badges[badge]) out.badge = badges[badge];
      if (children) {
        const kids = filterItems(children, role, badges);
        if (kids.length) out.children = kids;
      }
      return out;
    });
}

/**
 * GET /api/v1/admin/navigation
 * Sidebar tree filtered by the user's permissions, with live badge counts
 * (e.g. "Orders 4"). The frontend renders exactly what it receives.
 */
exports.getNavigation = asyncHandler(async (req, res) => {
  const role = req.user.role;
  const [badges, settings] = await Promise.all([badgeCounts(role), Setting.getStore()]);
  const sections = NAVIGATION.filter((s) => !s.permission || hasPermission(role, s.permission))
    .map(({ permission, items, ...s }) => ({ ...s, items: filterItems(items, role, badges) }))
    .filter((s) => s.items.length);

  res.json({
    success: true,
    data: {
      store: { name: settings.storeName, tagline: settings.tagline, logo: settings.logo?.url || null, brandColors: settings.brandColors, storefrontUrl: env.siteUrl },
      sections,
      badges,
    },
  });
});

/**
 * GET /api/v1/admin/search?q= — global "Ctrl K" search across everything the
 * user is allowed to see.
 */
exports.globalSearch = asyncHandler(async (req, res) => {
  const role = req.user.role;
  const q = String(req.query.q).trim();
  const rx = new RegExp(escapeRegex(q), 'i');
  const tasks = {};

  if (hasPermission(role, P.PRODUCTS_READ)) {
    tasks.products = Product.find({ $or: [{ name: rx }, { sku: rx }, { tags: rx }] }).limit(5).select('name sku images isActive').lean()
      .then((r) => r.map((p) => ({ id: p._id, title: p.name, subtitle: p.sku, image: p.images?.[0]?.url, path: `/products/${p._id}` })));
  }
  if (hasPermission(role, P.COLLECTIONS_READ)) {
    tasks.collections = Collection.find({ name: rx }).limit(5).select('name slug').lean()
      .then((r) => r.map((c) => ({ id: c._id, title: c.name, subtitle: `/${c.slug}`, path: `/collections/${c._id}` })));
  }
  if (hasPermission(role, P.ORDERS_READ)) {
    const num = q.replace(/^#/, '');
    const filter = /^\d+$/.test(num) ? { orderNumber: Number(num) } : { email: rx };
    tasks.orders = Order.find(filter).sort({ createdAt: -1 }).limit(5).select('orderNumber email totalAmount paymentStatus').lean()
      .then((r) => r.map((o) => ({ id: o._id, title: `#${o.orderNumber}`, subtitle: `${o.email} · ₹${o.totalAmount} · ${o.paymentStatus}`, path: `/orders/${o._id}` })));
  }
  if (hasPermission(role, P.CUSTOMERS_READ)) {
    tasks.customers = Customer.find({ $or: [{ name: rx }, { email: rx }, { phone: rx }] }).limit(5).select('name email').lean()
      .then((r) => r.map((c) => ({ id: c._id, title: c.name, subtitle: c.email, path: `/customers/${c._id}` })));
  }
  if (hasPermission(role, P.CONTENT_READ)) {
    tasks.content = Content.find({ title: rx }).limit(5).select('title type status').lean()
      .then((r) => r.map((c) => ({ id: c._id, title: c.title, subtitle: `${c.type} · ${c.status}`, path: `/content/${c.type === 'page' ? 'pages' : 'blog'}/${c._id}` })));
  }

  const keys = Object.keys(tasks);
  const values = await Promise.all(Object.values(tasks));
  res.json({ success: true, data: Object.fromEntries(keys.map((k, i) => [k, values[i]])) });
});
