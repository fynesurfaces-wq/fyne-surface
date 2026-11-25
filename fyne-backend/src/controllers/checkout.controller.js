'use strict';

const { Product, Customer, Order, Setting, Counter } = require('../models');
const ApiError = require('../utils/ApiError');
const { asyncHandler, round2 } = require('../utils/helpers');
const { evaluateDiscount } = require('../services/discount.service');
const { commitInventory } = require('../services/order.service');
const { getPaymentService } = require('../services/payment/PaymentService');
const mongoose = require('mongoose');
const { invalidateStoreCache } = require('../middleware/responseCache');
const env = require('../config/env');
const email = require('../services/email.service');

/**
 * Re-price a cart from the DATABASE (never trust client prices).
 * Returns line items with snapshots and the subtotal.
 */
async function priceCart(items) {
  const qtyById = new Map();
  for (const it of items) qtyById.set(String(it.product), (qtyById.get(String(it.product)) || 0) + Number(it.qty));

  const products = await Product.find({ _id: { $in: [...qtyById.keys()] }, isActive: true }).lean();
  if (products.length !== qtyById.size) throw new ApiError(422, 'One or more products are no longer available', 'PRODUCT_UNAVAILABLE');

  const shortages = [];
  const lines = products.map((p) => {
    const qty = qtyById.get(String(p._id));
    if (p.stock < qty) shortages.push({ product: String(p._id), sku: p.sku, requested: qty, available: p.stock });
    return {
      product: p._id,
      collection: p.collection,
      name: p.name || p.sku,
      sku: p.sku,
      image: p.images?.[0]?.url,
      price: p.price,
      qty,
      lineTotal: round2(p.price * qty),
    };
  });
  if (shortages.length) throw new ApiError(409, 'Some items do not have enough stock', 'INSUFFICIENT_STOCK', shortages);
  return { lines, subtotal: round2(lines.reduce((s, l) => s + l.lineTotal, 0)) };
}

function computeTotals({ subtotal, discountAmount, freeShipping, settings }) {
  const afterDiscount = Math.max(0, round2(subtotal - discountAmount));
  const { flatRate = 0, freeShippingThreshold = 0 } = settings.shipping || {};
  const shippingFee = freeShipping || !flatRate || (freeShippingThreshold > 0 && afterDiscount >= freeShippingThreshold) ? 0 : flatRate;
  const rate = settings.tax?.rate || 0;
  const included = settings.tax?.pricesIncludeTax !== false;
  const taxAmount = included ? round2(afterDiscount - afterDiscount / (1 + rate / 100)) : round2((afterDiscount * rate) / 100);
  const total = round2(afterDiscount + shippingFee + (included ? 0 : taxAmount));
  return { shippingFee, tax: { amount: taxAmount, rate, included }, total };
}

/** COD-only, transactional checkout. Request prices/payment method are deliberately ignored. */
exports.placeOrder = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      const qtyById = new Map();
      for (const item of req.body.items) {
        const id = String(item.product);
        const nextQty = (qtyById.get(id) || 0) + Number(item.qty);
        if (nextQty > 100) throw new ApiError(422, 'Maximum quantity per product is 100', 'INVALID_QUANTITY');
        qtyById.set(id, nextQty);
      }
      const ids = [...qtyById.keys()];
      const products = await Product.find({ _id: { $in: ids }, isActive: true }).session(session).lean();
      if (products.length !== ids.length) throw new ApiError(422, 'One or more products are no longer available', 'PRODUCT_UNAVAILABLE');
      const lines = products.map((p) => ({ product: p._id, collection: p.collection, name: p.name || p.sku, sku: p.sku, image: p.images?.[0]?.url, price: p.price, qty: qtyById.get(String(p._id)), lineTotal: round2(p.price * qtyById.get(String(p._id))) }));
      const subtotal = round2(lines.reduce((sum, line) => sum + line.lineTotal, 0));
      const applied = req.body.discountCode ? await evaluateDiscount(req.body.discountCode, { items: lines, subtotal, customerId: req.customer._id }) : { discount: null, amount: 0, freeShipping: false };

      // Conditional atomic decrement. The surrounding transaction rolls back every decrement if any item fails.
      for (const line of lines) {
        const result = await Product.updateOne({ _id: line.product, isActive: true, stock: { $gte: line.qty } }, { $inc: { stock: -line.qty } }, { session });
        if (result.modifiedCount !== 1) throw new ApiError(409, `Insufficient stock for ${line.name}`, 'INSUFFICIENT_STOCK', { product: String(line.product), requested: line.qty });
      }

      const settings = await Setting.getStore();
      const shippingFee = env.mockShippingFee;
      const totals = computeTotals({ subtotal, discountAmount: applied.amount, freeShipping: applied.freeShipping, settings: { ...settings.toObject?.() || settings, shipping: { flatRate: shippingFee, freeShippingThreshold: 0 } } });
      const address = { ...req.body.shippingAddress };
      order = new Order({
        orderNumber: await Counter.next('order', 1000, { session }), user: req.customer._id, email: req.customer.email,
        orderItems: lines.map(({ collection: _collection, ...line }) => line), shippingAddress: address,
        subtotal, discount: { ...(applied.discount && { code: applied.discount.code }), amount: applied.amount }, shippingFee: totals.shippingFee, tax: totals.tax, totalAmount: totals.total,
        currency: 'INR', orderStatus: 'Pending', paymentStatus: 'Pending', paymentMethod: 'cod', inventoryCommitted: true,
        notes: req.body.notes, history: [{ type: 'order', status: 'Pending', note: 'COD order placed' }],
      });
      await order.save({ session });
      const customerUpdate = { $inc: { ordersCount: 1 }, $set: { lastOrderAt: new Date() } };
      await Customer.updateOne({ _id: req.customer._id }, customerUpdate, { session });
    });
  } catch (error) {
    if (error.code === 20 || error.codeName === 'IllegalOperation' || /Transaction numbers are only allowed/i.test(error.message || '')) {
      throw new ApiError(503, 'Order checkout requires MongoDB replica-set transaction support.', 'TRANSACTIONS_REQUIRED');
    }
    throw error;
  } finally {
    await session.endSession();
  }
  try { await invalidateStoreCache('products', 'collections'); } catch { /* order is committed; cache invalidation must not misreport checkout failure */ }
  void email.sendCodOrderConfirmation(order);
  res.status(201).json({ success: true, data: { orderId: String(order._id), order: { id: order._id, orderNumber: order.orderNumber, orderStatus: order.orderStatus, paymentStatus: order.paymentStatus, paymentMethod: order.paymentMethod, items: order.orderItems, subtotal: order.subtotal, discount: order.discount, shippingFee: order.shippingFee, tax: order.tax, totalAmount: order.totalAmount, currency: order.currency }, payment: null } });
});

/** Authenticated cart quote; all line prices and shipping are read/calculated on the server. */
exports.quote = asyncHandler(async (req, res) => {
  const qtyById = new Map();
  for (const item of req.body.items) {
    const id = String(item.product);
    const qty = (qtyById.get(id) || 0) + Number(item.qty);
    if (qty > 100) throw new ApiError(422, 'Maximum quantity per product is 100', 'INVALID_QUANTITY');
    qtyById.set(id, qty);
  }
  const { lines, subtotal } = await priceCart([...qtyById].map(([product, qty]) => ({ product, qty })));
  const applied = req.body.discountCode ? await evaluateDiscount(req.body.discountCode, { items: lines, subtotal, customerId: req.customer._id }) : { discount: null, amount: 0, freeShipping: false };
  const settings = await Setting.getStore();
  const totals = computeTotals({ subtotal, discountAmount: applied.amount, freeShipping: applied.freeShipping, settings: { ...settings.toObject?.() || settings, shipping: { flatRate: env.mockShippingFee, freeShippingThreshold: 0 } } });
  res.json({ success: true, data: { items: lines.map(({ collection: _collection, ...line }) => line), subtotal, discount: { ...(applied.discount && { code: applied.discount.code }), amount: applied.amount }, shippingFee: totals.shippingFee, tax: totals.tax, totalAmount: totals.total, currency: 'INR' } });
});

/** POST /api/v1/store/discounts/validate — cart preview before checkout. */
exports.validateDiscount = asyncHandler(async (req, res) => {
  const settings = await Setting.getStore();
  const { lines, subtotal } = await priceCart(req.body.items);
  const customer = req.body.email ? await Customer.findOne({ email: req.body.email }).select('_id').lean() : null;
  const { discount, amount, freeShipping } = await evaluateDiscount(req.body.code, { items: lines, subtotal, customerId: customer?._id });
  const totals = computeTotals({ subtotal, discountAmount: amount, freeShipping, settings });
  res.json({ success: true, data: { code: discount.code, type: discount.type, discountAmount: amount, freeShipping, subtotal, ...totals } });
});

/**
 * POST /api/v1/store/checkout
 * Creates the Order with paymentStatus "Pending" and returns a payment intent.
 * Stock is reserved when payment succeeds (webhook) — or immediately for COD.
 */
exports.checkout = asyncHandler(async (req, res) => {
  const { customer: submittedCustomer, items, shippingAddress, discountCode, paymentMethod = 'online', notes } = req.body;
  const c = { ...submittedCustomer, name: req.customer.name, email: req.customer.email, phone: submittedCustomer.phone || req.customer.phone };
  const settings = await Setting.getStore();
  const { lines, subtotal } = await priceCart(items);

  const customer = req.customer;

  let discount = { amount: 0 };
  let freeShipping = false;
  if (discountCode) {
    const result = await evaluateDiscount(discountCode, { items: lines, subtotal, customerId: customer._id });
    discount = { code: result.discount.code, amount: result.amount };
    freeShipping = result.freeShipping;
  }

  const totals = computeTotals({ subtotal, discountAmount: discount.amount, freeShipping, settings });
  const payments = getPaymentService();
  const orderAddress = {
    fullName: c.name,
    phoneNumber: String(shippingAddress.phoneNumber || shippingAddress.phone || c.phone || '').replace(/\D/g, '').slice(-10),
    addressLine1: shippingAddress.addressLine1 || shippingAddress.line1,
    addressLine2: shippingAddress.addressLine2 || shippingAddress.line2,
    landmark: shippingAddress.landmark,
    city: shippingAddress.city,
    state: shippingAddress.state,
    pincode: shippingAddress.pincode || shippingAddress.postalCode,
    addressType: shippingAddress.addressType || 'Home',
  };

  const order = new Order({
    orderNumber: await Counter.next('order'),
    user: customer._id,
    email: customer.email,
    orderItems: lines.map(({ collection, ...l }) => l),
    shippingAddress: orderAddress,
    subtotal,
    discount,
    shippingFee: totals.shippingFee,
    tax: totals.tax,
    totalAmount: totals.total,
    currency: 'INR',
    orderStatus: 'Pending',
    paymentStatus: 'Pending',
    paymentMethod,
    paymentProvider: paymentMethod === 'online' ? payments.provider : undefined,
    notes,
    history: [{ type: 'order', status: 'Pending', note: 'Order placed' }],
  });

  let payment = null;
  if (paymentMethod === 'online') {
    payment = await payments.initializePayment(order, customer);
    order.paymentIntentId = payment.id;
  } else {
    await commitInventory(order); // COD / bank transfer: reserve stock now
  }
  await order.save();

  if (paymentMethod === 'cod') void email.sendCodOrderConfirmation(order);

  await Customer.updateOne(
    { _id: customer._id },
    {
      $inc: { ordersCount: 1 },
      $set: { lastOrderAt: new Date(), ...(c.acceptsMarketing && { acceptsMarketing: true }) },
    }
  );

  res.status(201).json({
    success: true,
    data: {
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        items: order.orderItems,
        subtotal: order.subtotal,
        discount: order.discount,
        shippingFee: order.shippingFee,
        tax: order.tax,
        totalAmount: order.totalAmount,
        currency: order.currency,
      },
      payment, // mock payment intent (null for COD / bank transfer)
    },
  });
});
