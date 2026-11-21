'use strict';

const crypto = require('crypto');
const { Order } = require('../models');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../utils/helpers');
const { getPaymentService, MockPaymentGateway } = require('../services/payment/PaymentService');
const { applyPaymentEvent } = require('../services/order.service');

/**
 * POST /api/v1/payments/webhook
 *
 * req.body is a RAW Buffer here (express.raw on this route, mounted before
 * express.json) — signature verification MUST use the exact bytes received.
 *
 *  1. PaymentService.processWebhook() verifies the signature
 *       mock:     x-mock-signature  = HMAC_SHA256(rawBody, PAYMENT_WEBHOOK_SECRET)
 *       razorpay: X-Razorpay-Signature = HMAC_SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET)
 *       stripe:   stripe.webhooks.constructEvent(rawBody, req.headers['stripe-signature'], secret)
 *     → 400 if invalid (gateway will retry; attackers get nothing).
 *  2. The provider payload is normalised to { type, orderId, transactionId }.
 *  3. applyPaymentEvent() updates the order idempotently.
 *  4. Always 200 quickly for valid-but-irrelevant events so the gateway stops retrying.
 */
exports.handleWebhook = asyncHandler(async (req, res) => {
  const payments = getPaymentService();
  const event = await payments.processWebhook(req.body, req.headers);
  const result = await applyPaymentEvent(event, payments.provider);
  res.status(200).json({ received: true, event: event.type, ...result });
});

/**
 * POST /api/v1/payments/mock/simulate  (development only, mock provider only)
 * Builds a signed webhook exactly like a real gateway would and runs it
 * through the same pipeline — lets the storefront test success/failure flows.
 */
exports.simulateMockPayment = asyncHandler(async (req, res) => {
  const { orderId, outcome } = req.body;
  const order = await Order.findById(orderId).lean();
  if (!order) throw new ApiError(404, 'Order not found');

  const type = { success: 'payment.succeeded', failure: 'payment.failed', refund: 'refund.processed' }[outcome];
  const rawBody = Buffer.from(
    JSON.stringify({
      id: `evt_mock_${crypto.randomBytes(8).toString('hex')}`,
      type,
      data: { orderId, transactionId: `mock_txn_${crypto.randomBytes(8).toString('hex')}`, amount: Math.round(order.totalAmount * 100) },
    })
  );
  const headers = { 'x-mock-signature': MockPaymentGateway.sign(rawBody) };

  const payments = getPaymentService();
  const event = await payments.processWebhook(rawBody, headers);
  const result = await applyPaymentEvent(event, payments.provider);
  const updated = await Order.findById(orderId).select('orderNumber paymentStatus orderStatus gatewayTransactionId inventoryCommitted').lean();
  res.json({ success: true, data: { event: event.type, ...result, order: updated } });
});
