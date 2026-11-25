'use strict';

const { Order } = require('../models');
const { asyncHandler } = require('../utils/helpers');

exports.listMine = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const filter = { user: req.customer._id };
  const [orders, total] = await Promise.all([
    Order.find(filter).select('orderNumber orderItems.name orderItems.qty totalAmount currency orderStatus paymentStatus paymentMethod createdAt updatedAt').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, data: orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.getMine = asyncHandler(async (req, res) => {
  const source = req.ownedOrder;
  // Explicit customer response allow-list; never expose gateway/internal fields or staff IDs.
  const order = {
    _id: source._id,
    orderNumber: source.orderNumber,
    orderItems: source.orderItems.map(({ product, name, sku, image, price, qty, lineTotal }) => ({ product, name, sku, image, price, qty, lineTotal })),
    shippingAddress: source.shippingAddress,
    subtotal: source.subtotal,
    discount: source.discount,
    shippingFee: source.shippingFee,
    tax: source.tax,
    totalAmount: source.totalAmount,
    currency: source.currency,
    orderStatus: source.orderStatus,
    paymentStatus: source.paymentStatus,
    paymentMethod: source.paymentMethod,
    tracking: source.tracking,
    history: source.history.map(({ type, status, note, at }) => ({ type, status, note, at })),
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
    shippedAt: source.shippedAt,
    deliveredAt: source.deliveredAt,
  };
  res.json({ success: true, data: order });
});
