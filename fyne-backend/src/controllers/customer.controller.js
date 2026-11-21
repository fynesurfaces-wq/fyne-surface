'use strict';

const { Customer, Order } = require('../models');
const ApiError = require('../utils/ApiError');
const { asyncHandler, pick, toBool } = require('../utils/helpers');
const { parsePagination, parseSort, searchFilter, combine, paginate } = require('../utils/query');

/** GET /api/v1/admin/customers?q&acceptsMarketing&segment=repeat|vip|new|subscribers */
exports.list = asyncHandler(async (req, res) => {
  const pg = parsePagination(req.query);
  const sort = parseSort(req.query.sort, ['name', 'email', 'ordersCount', 'totalSpent', 'lastOrderAt', 'createdAt']);
  const f = {};
  const marketing = toBool(req.query.acceptsMarketing);
  if (marketing !== undefined) f.acceptsMarketing = marketing;
  // Built-in segments (Customers → Segments)
  switch (req.query.segment) {
    case 'repeat': f.ordersCount = { $gte: 2 }; break;
    case 'vip': f.totalSpent = { $gte: 100000 }; break; // ₹1 lakh+
    case 'new': f.createdAt = { $gte: new Date(Date.now() - 30 * 86400000) }; break;
    case 'subscribers': f.acceptsMarketing = true; break;
    case 'no_orders': f.ordersCount = 0; break;
    default: break;
  }
  if (req.query.tag) f.tags = String(req.query.tag).toLowerCase();
  const filter = combine(f, searchFilter(req.query.q, ['name', 'email', 'phone']));
  const { items, pagination } = await paginate(Customer, filter, { ...pg, sort });
  res.json({ success: true, data: items, pagination });
});

/** GET /api/v1/admin/customers/segments — counts for the segment chips. */
exports.segments = asyncHandler(async (_req, res) => {
  const [all, repeat, vip, fresh, subscribers, noOrders] = await Promise.all([
    Customer.countDocuments(),
    Customer.countDocuments({ ordersCount: { $gte: 2 } }),
    Customer.countDocuments({ totalSpent: { $gte: 100000 } }),
    Customer.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } }),
    Customer.countDocuments({ acceptsMarketing: true }),
    Customer.countDocuments({ ordersCount: 0 }),
  ]);
  res.json({
    success: true,
    data: [
      { key: 'all', label: 'All customers', count: all },
      { key: 'repeat', label: 'Repeat buyers', count: repeat },
      { key: 'vip', label: 'Spent ₹1L+', count: vip },
      { key: 'new', label: 'New (30 days)', count: fresh },
      { key: 'subscribers', label: 'Email subscribers', count: subscribers },
      { key: 'no_orders', label: 'No orders yet', count: noOrders },
    ],
  });
});

/** GET /api/v1/admin/customers/:id — profile + recent orders. */
exports.get = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id).lean();
  if (!customer) throw new ApiError(404, 'Customer not found');
  const orders = await Order.find({ user: customer._id }).sort({ createdAt: -1 }).limit(20)
    .select('orderNumber totalAmount orderStatus paymentStatus createdAt').lean();
  res.json({ success: true, data: { ...customer, orders } });
});

/** PATCH /api/v1/admin/customers/:id */
exports.update = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  customer.set(pick(req.body, ['name', 'phone', 'acceptsMarketing', 'notes', 'tags']));
  await customer.save();
  res.json({ success: true, data: customer });
});
