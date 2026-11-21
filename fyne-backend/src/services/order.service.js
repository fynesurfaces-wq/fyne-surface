'use strict';

/**
 * Order lifecycle + inventory.
 *
 * Inventory is committed when money is secured:
 *   • online payments → on the verified `payment.succeeded` webhook
 *   • COD / bank transfer → at checkout
 * All updates are conditional (idempotent) so gateway retries are harmless.
 *
 * NOTE: for strict atomicity across collections, run MongoDB as a replica set
 * (Atlas does this by default) and wrap these in session.withTransaction().
 */
const { Order, Product, Customer, Discount } = require('../models');

async function commitInventory(order) {
  if (order.inventoryCommitted) return [];
  const shortfalls = [];
  for (const item of order.orderItems) {
    // Guarded decrement: never lets stock go below zero.
    // eslint-disable-next-line no-await-in-loop
    const res = await Product.updateOne({ _id: item.product, stock: { $gte: item.qty } }, { $inc: { stock: -item.qty } });
    if (!res.modifiedCount) shortfalls.push({ sku: item.sku, qty: item.qty });
  }
  order.inventoryCommitted = true;
  if (shortfalls.length) {
    order.history.push({ type: 'note', note: `Insufficient stock when committing: ${shortfalls.map((s) => `${s.sku}×${s.qty}`).join(', ')}` });
  }
  return shortfalls;
}

async function releaseInventory(order) {
  if (!order.inventoryCommitted) return;
  await Product.bulkWrite(order.orderItems.map((i) => ({ updateOne: { filter: { _id: i.product }, update: { $inc: { stock: i.qty } } } })));
  order.inventoryCommitted = false;
}

async function markPaid(orderId, { transactionId, provider } = {}) {
  // Conditional transition = idempotency: a retried webhook finds nothing to update.
  const order = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: { $in: ['Pending', 'Failed'] }, orderStatus: { $ne: 'Cancelled' } },
    {
      $set: { paymentStatus: 'Paid', paidAt: new Date(), ...(transactionId && { gatewayTransactionId: transactionId }), ...(provider && { paymentProvider: provider }) },
      $push: { history: { type: 'payment', status: 'Paid', note: transactionId ? `Txn ${transactionId}` : undefined } },
    },
    { new: true }
  );
  if (!order) return null;

  await commitInventory(order);
  await order.save();
  await Customer.updateOne({ _id: order.user }, { $inc: { totalSpent: order.totalAmount } });
  if (order.discount?.code) await Discount.updateOne({ code: order.discount.code }, { $inc: { usedCount: 1 } });
  return order;
}

async function markFailed(orderId, { transactionId } = {}) {
  return Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: 'Pending' },
    {
      $set: { paymentStatus: 'Failed', ...(transactionId && { gatewayTransactionId: transactionId }) },
      $push: { history: { type: 'payment', status: 'Failed' } },
    },
    { new: true }
  );
}

async function markRefunded(orderId) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: 'Paid' },
    { $set: { paymentStatus: 'Refunded' }, $push: { history: { type: 'payment', status: 'Refunded' } } },
    { new: true }
  );
  if (!order) return null;
  if (order.orderStatus !== 'Delivered') await releaseInventory(order);
  await order.save();
  await Customer.updateOne({ _id: order.user }, { $inc: { totalSpent: -order.totalAmount } });
  return order;
}

/** Apply a NormalisedEvent from PaymentService.processWebhook. */
async function applyPaymentEvent(event, provider) {
  if (!event?.orderId) return { applied: false, reason: 'no orderId' };
  switch (event.type) {
    case 'payment.succeeded':
      return { applied: Boolean(await markPaid(event.orderId, { transactionId: event.transactionId, provider })) };
    case 'payment.failed':
      return { applied: Boolean(await markFailed(event.orderId, { transactionId: event.transactionId })) };
    case 'refund.processed':
      return { applied: Boolean(await markRefunded(event.orderId)) };
    default:
      return { applied: false, reason: `ignored event ${event.type}` };
  }
}

/** Allowed manual order-status transitions in the admin. */
const TRANSITIONS = {
  Pending: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: [],
};

module.exports = { commitInventory, releaseInventory, markPaid, markFailed, markRefunded, applyPaymentEvent, TRANSITIONS };
