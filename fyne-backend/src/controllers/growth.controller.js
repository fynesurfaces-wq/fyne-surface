'use strict';

/** Growth (Shopify "Marketing"): abandoned checkouts, audience, discount performance. */
const { Order, Customer, Discount } = require('../models');
const { asyncHandler, round2 } = require('../utils/helpers');
const { parsePagination, parseSort, paginate } = require('../utils/query');

const abandonedFilter = () => ({
  paymentMethod: 'online',
  paymentStatus: { $in: ['Pending', 'Failed'] },
  orderStatus: 'Pending',
  createdAt: { $lte: new Date(Date.now() - 60 * 60 * 1000) }, // older than 1h
});

/** GET /api/v1/admin/growth/abandoned-checkouts */
exports.abandonedCheckouts = asyncHandler(async (req, res) => {
  const pg = parsePagination(req.query);
  const sort = parseSort(req.query.sort, ['createdAt', 'totalAmount']);
  const filter = abandonedFilter();
  const [{ items, pagination }, [sum]] = await Promise.all([
    paginate(Order, filter, { ...pg, sort, select: 'orderNumber email totalAmount paymentStatus orderItems.name orderItems.qty createdAt user', populate: { path: 'user', select: 'name email phone acceptsMarketing' } }),
    Order.aggregate([{ $match: filter }, { $group: { _id: null, value: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
  ]);
  res.json({ success: true, data: items, pagination, summary: { recoverableValue: round2(sum?.value || 0), count: sum?.count || 0 } });
});

/** GET /api/v1/admin/growth/overview */
exports.overview = asyncHandler(async (_req, res) => {
  const now = new Date();
  const [customers, subscribers, repeatCustomers, activeDiscounts, topDiscounts, [abandoned]] = await Promise.all([
    Customer.countDocuments(),
    Customer.countDocuments({ acceptsMarketing: true }),
    Customer.countDocuments({ ordersCount: { $gte: 2 } }),
    Discount.countDocuments({ isActive: true, startsAt: { $lte: now }, $or: [{ endsAt: null }, { endsAt: { $gte: now } }] }),
    Discount.find().sort({ usedCount: -1 }).limit(5).select('code type value usedCount usageLimit').lean(),
    Order.aggregate([{ $match: abandonedFilter() }, { $group: { _id: null, value: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
  ]);
  res.json({
    success: true,
    data: {
      audience: { customers, subscribers, subscriberRate: customers ? round2((subscribers / customers) * 100) : 0, repeatCustomers },
      discounts: { active: activeDiscounts, top: topDiscounts },
      abandonedCheckouts: { count: abandoned?.count || 0, recoverableValue: round2(abandoned?.value || 0) },
    },
  });
});
