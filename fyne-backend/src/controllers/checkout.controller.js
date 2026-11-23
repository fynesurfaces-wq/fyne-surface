'use strict';

const { Product, Customer, Order, Setting, Counter } = require('../models');
const ApiError = require('../utils/ApiError');
const { asyncHandler, round2 } = require('../utils/helpers');
const { evaluateDiscount } = require('../services/discount.service');
const { commitInventory } = require('../services/order.service');
const { getPaymentService } = require('../services/payment/PaymentService');
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
      name: p.name,
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
  const { customer: c, items, shippingAddress, discountCode, paymentMethod = 'online', notes } = req.body;
  const settings = await Setting.getStore();
  const { lines, subtotal } = await priceCart(items);

  // Guest checkout: link to an existing customer by email or create one.
  // Existing customers' details are never overwritten by an anonymous request.
  const customerResult = await Customer.findOneAndUpdate(
    { email: c.email },
    { $setOnInsert: { email: c.email, name: c.name, phone: c.phone, acceptsMarketing: Boolean(c.acceptsMarketing), source: 'checkout' } },
    { upsert: true, new: true, setDefaultsOnInsert: true, includeResultMetadata: true }
  );
  const customer = customerResult.value;
  const isNewCustomer = Boolean(customerResult.lastErrorObject?.upserted);
  // This project has guest checkout rather than shopper accounts; first-time
  // customer creation is its registration moment for the welcome message.
  if (isNewCustomer) void email.sendWelcome(customer);

  let discount = { amount: 0 };
  let freeShipping = false;
  if (discountCode) {
    const result = await evaluateDiscount(discountCode, { items: lines, subtotal, customerId: customer._id });
    discount = { code: result.discount.code, amount: result.amount };
    freeShipping = result.freeShipping;
  }

  const totals = computeTotals({ subtotal, discountAmount: discount.amount, freeShipping, settings });
  const payments = getPaymentService();

  const order = new Order({
    orderNumber: await Counter.next('order'),
    user: customer._id,
    email: customer.email,
    orderItems: lines.map(({ collection, ...l }) => l),
    shippingAddress: { fullName: c.name, phone: c.phone, ...shippingAddress },
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

  await Customer.updateOne(
    { _id: customer._id },
    {
      $inc: { ordersCount: 1 },
      $set: { lastOrderAt: new Date() },
      ...(!customer.addresses?.length && { $push: { addresses: order.shippingAddress } }),
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
