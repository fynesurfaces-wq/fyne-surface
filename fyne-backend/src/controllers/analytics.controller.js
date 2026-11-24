'use strict';

const env = require('../config/env');
const { Product, Order, Customer, Visit, Lead } = require('../models');
const { asyncHandler, round2, dayKey } = require('../utils/helpers');
const { parseDateRange } = require('../utils/query');
const { hasPermission, P } = require('../config/permissions');

const TZ = 'Asia/Kolkata';
const lowStockMatch = { $expr: { $lte: ['$stock', { $ifNull: ['$lowStockThreshold', env.lowStockThreshold] }] } };
const pctChange = (cur, prev) => (prev ? round2(((cur - prev) / prev) * 100) : cur ? 100 : 0);

async function countSessions(from, to) {
  const [r] = await Visit.aggregate([{ $match: { createdAt: { $gte: from, $lte: to } } }, { $group: { _id: '$sessionId' } }, { $count: 'n' }]);
  return r?.n || 0;
}

async function orderTotals(from, to) {
  const [r] = await Order.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        paidOrders: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] } },
        revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, '$totalAmount', 0] } },
      },
    },
  ]);
  return { orders: r?.orders || 0, paidOrders: r?.paidOrders || 0, revenue: round2(r?.revenue || 0) };
}

function fillDays(from, to, rows) {
  const byDay = new Map(rows.map((r) => [r._id, r]));
  const out = [];
  const seen = new Set();
  for (let t = from.getTime(); t <= to.getTime() + 86400000; t += 3600000 * 6) {
    if (t > to.getTime()) break;
    const k = dayKey(new Date(t), TZ);
    if (seen.has(k)) continue;
    seen.add(k);
    const r = byDay.get(k);
    out.push({ date: k, revenue: round2(r?.revenue || 0), orders: r?.orders || 0, sessions: r?.sessions || 0 });
  }
  return out;
}

/**
 * GET /api/v1/admin/analytics/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Powers the Home page (Shopify-style top bar: Sessions · Total sales · Orders ·
 * Conversion rate · Live visitors) + stat cards, chart, low-stock alerts.
 * Response is permission-aware: editors get catalog stats only.
 */
exports.dashboard = asyncHandler(async (req, res) => {
  const { from, to } = parseDateRange(req.query, 30);
  const role = req.user.role;
  const canOrders = hasPermission(role, P.ORDERS_READ);
  const canAnalytics = hasPermission(role, P.ANALYTICS_VIEW);

  const [productAgg, lowStockAlerts, lowStockCount] = await Promise.all([
    Product.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $lte: ['$stock', 0] }, 1, 0] } },
          inventoryValue: { $sum: { $multiply: ['$price', '$stock'] } },
        },
      },
    ]),
    Product.find(lowStockMatch).select('name sku slug stock lowStockThreshold images').sort({ stock: 1 }).limit(10).lean(),
    Product.countDocuments(lowStockMatch),
  ]);
  const ps = productAgg[0] || {};

  const data = {
    range: { from, to, timezone: TZ },
    stats: {
      totalProducts: ps.total || 0,
      activeProducts: ps.active || 0,
      outOfStockProducts: ps.outOfStock || 0,
      lowStockCount,
      inventoryValue: round2(ps.inventoryValue || 0),
    },
    lowStockAlerts: lowStockAlerts.map((p) => ({
      _id: p._id,
      name: p.name || p.sku,
      sku: p.sku,
      stock: p.stock,
      threshold: p.lowStockThreshold ?? env.lowStockThreshold,
      thumbnail: p.images?.[0]?.url || null,
      severity: p.stock <= 0 ? 'critical' : 'warning',
    })),
  };

  if (canOrders) {
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(from.getTime() - (to.getTime() - from.getTime()));
    const [cur, prev, facet, toFulfill, totalCustomers, newLeads] = await Promise.all([
      orderTotals(from, to),
      orderTotals(prevFrom, prevTo),
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $facet: {
            salesOverTime: [
              {
                $group: {
                  _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } },
                  orders: { $sum: 1 },
                  revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, '$totalAmount', 0] } },
                },
              },
            ],
            byStatus: [{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }],
            topProducts: [
              { $match: { paymentStatus: 'Paid' } },
              { $unwind: '$orderItems' },
              {
                $group: {
                  _id: '$orderItems.product',
                  name: { $first: '$orderItems.name' },
                  sku: { $first: '$orderItems.sku' },
                  unitsSold: { $sum: '$orderItems.qty' },
                  revenue: { $sum: '$orderItems.lineTotal' },
                },
              },
              { $sort: { revenue: -1 } },
              { $limit: 5 },
            ],
          },
        },
      ]),
      Order.countDocuments({ orderStatus: 'Pending', $or: [{ paymentStatus: 'Paid' }, { paymentMethod: { $in: ['cod', 'bank_transfer'] } }] }),
      Customer.countDocuments(),
      hasPermission(role, P.LEADS_READ) ? Lead.countDocuments({ status: 'new' }) : Promise.resolve(undefined),
    ]);
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5)
      .select('orderNumber email totalAmount orderStatus paymentStatus createdAt').lean();

    Object.assign(data.stats, {
      totalRevenue: cur.revenue,
      totalOrders: cur.orders,
      paidOrders: cur.paidOrders,
      averageOrderValue: cur.paidOrders ? round2(cur.revenue / cur.paidOrders) : 0,
      ordersToFulfill: toFulfill,
      totalCustomers,
      ...(newLeads !== undefined && { newLeads }),
    });
    data.changes = { revenue: pctChange(cur.revenue, prev.revenue), orders: pctChange(cur.orders, prev.orders) };
    data.ordersByStatus = Object.fromEntries((facet[0]?.byStatus || []).map((s) => [s._id, s.count]));
    data.topProducts = facet[0]?.topProducts || [];
    data.recentOrders = recentOrders;
    data.salesOverTime = facet[0]?.salesOverTime || [];

    if (canAnalytics) {
      const prevTo2 = prevTo;
      const [sessions, prevSessions, live, sessionsByDay] = await Promise.all([
        countSessions(from, to),
        countSessions(prevFrom, prevTo2),
        Visit.distinct('sessionId', { createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } }),
        Visit.aggregate([
          { $match: { createdAt: { $gte: from, $lte: to } } },
          { $group: { _id: { d: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } }, s: '$sessionId' } } },
          { $group: { _id: '$_id.d', sessions: { $sum: 1 } } },
        ]),
      ]);
      Object.assign(data.stats, {
        sessions,
        conversionRate: sessions ? round2((cur.paidOrders / sessions) * 100) : 0,
        liveVisitors: live.length,
      });
      data.changes.sessions = pctChange(sessions, prevSessions);
      const sMap = new Map(sessionsByDay.map((s) => [s._id, s.sessions]));
      data.salesOverTime = data.salesOverTime.map((r) => ({ ...r, sessions: sMap.get(r._id) || 0 }));
      for (const [d, n] of sMap) if (!data.salesOverTime.find((r) => r._id === d)) data.salesOverTime.push({ _id: d, sessions: n });
    }
    data.salesOverTime = fillDays(from, to, data.salesOverTime);
  }

  res.json({ success: true, data });
});

/** GET /api/v1/admin/analytics/live — Live View (last 5 minutes). */
exports.live = asyncHandler(async (_req, res) => {
  const since = new Date(Date.now() - 5 * 60 * 1000);
  const [visitors, topPages, devices] = await Promise.all([
    Visit.distinct('sessionId', { createdAt: { $gte: since } }),
    Visit.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: '$path', views: { $sum: 1 } } }, { $sort: { views: -1 } }, { $limit: 10 }]),
    Visit.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: { s: '$sessionId', d: '$device' } } }, { $group: { _id: '$_id.d', count: { $sum: 1 } } }]),
  ]);
  res.json({
    success: true,
    data: {
      liveVisitors: visitors.length,
      topPages: topPages.map((p) => ({ path: p._id, views: p.views })),
      devices: Object.fromEntries(devices.map((d) => [d._id, d.count])),
      asOf: new Date(),
    },
  });
});

/** GET /api/v1/admin/analytics/reports/sales-by-collection?from&to */
exports.salesByCollection = asyncHandler(async (req, res) => {
  const { from, to } = parseDateRange(req.query, 30);
  const rows = await Order.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to }, paymentStatus: 'Paid' } },
    { $unwind: '$orderItems' },
    { $lookup: { from: 'products', localField: 'orderItems.product', foreignField: '_id', as: 'p' } },
    { $unwind: { path: '$p', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'collections', localField: 'p.collection', foreignField: '_id', as: 'c' } },
    { $unwind: { path: '$c', preserveNullAndEmptyArrays: true } },
    { $group: { _id: '$c._id', collection: { $first: { $ifNull: ['$c.name', 'Uncategorised'] } }, units: { $sum: '$orderItems.qty' }, revenue: { $sum: '$orderItems.lineTotal' } } },
    { $sort: { revenue: -1 } },
  ]);
  res.json({ success: true, data: { range: { from, to }, rows } });
});

/** POST /api/v1/store/analytics/track — storefront page-view beacon (public, rate-limited). */
exports.track = asyncHandler(async (req, res) => {
  const { sessionId, path, referrer, utmSource, device } = req.body;
  await Visit.create({ sessionId, path, referrer, utmSource, device });
  res.status(202).json({ success: true });
});
