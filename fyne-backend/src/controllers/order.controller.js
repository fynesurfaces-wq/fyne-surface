'use strict';

const { Order } = require('../models');
const ApiError = require('../utils/ApiError');
const { asyncHandler, escapeRegex } = require('../utils/helpers');
const { parsePagination, parseSort, combine, paginate } = require('../utils/query');
const { releaseInventory, commitInventory, TRANSITIONS } = require('../services/order.service');
const { Customer } = require('../models');

/** GET /api/v1/admin/orders?orderStatus&paymentStatus&from&to&q&page&limit&sort */
exports.list = asyncHandler(async (req, res) => {
  const pg = parsePagination(req.query);
  const sort = parseSort(req.query.sort, ['orderNumber', 'totalAmount', 'createdAt', 'orderStatus', 'paymentStatus']);
  const f = {};
  if (req.query.orderStatus) f.orderStatus = req.query.orderStatus;
  if (req.query.paymentStatus) f.paymentStatus = req.query.paymentStatus;
  if (req.query.from || req.query.to) {
    f.createdAt = {};
    if (req.query.from) f.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) f.createdAt.$lte = new Date(req.query.to);
  }
  let search = null;
  const q = String(req.query.q || '').trim().replace(/^#/, '');
  if (q) {
    search = /^\d+$/.test(q)
      ? { orderNumber: Number(q) }
      : { $or: [{ email: new RegExp(escapeRegex(q), 'i') }, { 'shippingAddress.fullName': new RegExp(escapeRegex(q), 'i') }, { 'orderItems.sku': q.toUpperCase() }] };
  }
  const { items, pagination } = await paginate(Order, combine(f, search), {
    ...pg,
    sort,
    select: 'orderNumber user email totalAmount currency orderStatus paymentStatus paymentMethod orderItems.qty orderItems.name createdAt',
    populate: { path: 'user', select: 'name email' },
  });
  const data = items.map((o) => ({ ...o, itemCount: o.orderItems.reduce((s, i) => s + i.qty, 0) }));
  res.json({ success: true, data, pagination });
});

/** GET /api/v1/admin/orders/:id */
exports.get = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone ordersCount totalSpent')
    .populate('orderItems.product', 'slug stock')
    .populate('history.by', 'name');
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ success: true, data: order });
});

/**
 * PATCH /api/v1/admin/orders/:id/status  { orderStatus, note?, tracking? }
 * Enforces the state machine Pending → Shipped → Delivered (or → Cancelled).
 */
exports.updateStatus = asyncHandler(async (req, res) => {
  const { orderStatus: next, note, tracking } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  const allowed = TRANSITIONS[order.orderStatus] || [];
  if (!allowed.includes(next)) {
    throw new ApiError(409, `Cannot change order from ${order.orderStatus} to ${next}`, 'INVALID_TRANSITION', { allowed });
  }
  const payLater = ['cod', 'bank_transfer'].includes(order.paymentMethod);
  if (next === 'Shipped' && order.paymentStatus !== 'Paid' && !payLater) {
    throw new ApiError(409, 'Online orders can only be shipped after payment is confirmed', 'UNPAID_ORDER');
  }

  const now = new Date();
  order.orderStatus = next;
  if (tracking) order.tracking = { ...order.tracking?.toObject?.(), ...tracking };
  if (next === 'Shipped') {
    order.shippedAt = now;
    if (!order.inventoryCommitted) await commitInventory(order);
  }
  if (next === 'Delivered') {
    order.deliveredAt = now;
    if (order.paymentMethod === 'cod' && order.paymentStatus === 'Pending') {
      order.paymentStatus = 'Paid'; // cash collected on delivery
      order.paidAt = now;
      order.history.push({ type: 'payment', status: 'Paid', note: 'COD collected', by: req.user._id, at: now });
      await Customer.updateOne({ _id: order.user }, { $inc: { totalSpent: order.totalAmount } });
    }
  }
  if (next === 'Cancelled') {
    order.cancelledAt = now;
    await releaseInventory(order);
  }
  order.history.push({ type: 'order', status: next, note, by: req.user._id, at: now });
  await order.save();

  res.json({
    success: true,
    data: order,
    ...(next === 'Cancelled' && order.paymentStatus === 'Paid' && { warning: 'Order was paid — issue a refund from the payment gateway.' }),
  });
});
