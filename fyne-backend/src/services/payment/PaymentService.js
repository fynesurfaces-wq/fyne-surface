'use strict';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Gateway-agnostic payment architecture
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  checkout ──► PaymentService.initializePayment(order) ──► gateway adapter
 *                                                            (mock | razorpay | stripe)
 *  gateway ──► POST /api/v1/payments/webhook (raw body)
 *          ──► PaymentService.processWebhook(rawBody, headers)
 *                 1. verifySignature()      ← reject forged calls
 *                 2. adapter.parseEvent()   ← provider JSON → NormalisedEvent
 *          ──► orderService.applyPaymentEvent(event)  ← idempotent DB update
 *
 *  NormalisedEvent = {
 *    id:            provider event id (for logging / dedupe),
 *    type:          'payment.succeeded' | 'payment.failed' | 'refund.processed' | 'ignored',
 *    orderId:       our Mongo order _id (passed to the gateway as metadata/notes),
 *    transactionId: provider payment id → Order.gatewayTransactionId,
 *    amount:        in paise (smallest unit),
 *    raw:           original payload
 *  }
 *
 *  To add Razorpay or Stripe: create RazorpayGateway.js / StripeGateway.js
 *  extending PaymentGateway, register it in GATEWAYS below and set
 *  PAYMENT_PROVIDER in .env. Nothing else in the codebase changes.
 */
const crypto = require('crypto');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');

/** Interface every gateway adapter implements. */
class PaymentGateway {
  get name() {
    throw new Error('PaymentGateway.name not implemented');
  }

  /**
   * Create a payment on the provider and return what the storefront needs to
   * open the checkout widget.
   * @returns {Promise<{id, provider, amount, currency, status, clientSecret?, nextAction?}>}
   */
  // eslint-disable-next-line no-unused-vars
  async initializePayment({ orderId, orderNumber, amount, currency, customer }) {
    throw new Error('initializePayment not implemented');
  }

  /** @returns {boolean} true if the webhook really came from the provider. */
  // eslint-disable-next-line no-unused-vars
  verifySignature(rawBody, headers) {
    throw new Error('verifySignature not implemented');
  }

  /** Map the provider payload to a NormalisedEvent. */
  // eslint-disable-next-line no-unused-vars
  parseEvent(payload, headers) {
    throw new Error('parseEvent not implemented');
  }
}

/** Constant-time comparison of two hex/base64 strings. */
const safeEqual = (a, b) => {
  const ba = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

/**
 * Mock gateway — behaves like a real one (HMAC-signed webhooks) so the whole
 * flow can be built and tested end-to-end before choosing Razorpay/Stripe.
 *
 * Signature header:  x-mock-signature = hex(HMAC_SHA256(rawBody, PAYMENT_WEBHOOK_SECRET))
 */
class MockPaymentGateway extends PaymentGateway {
  get name() {
    return 'mock';
  }

  async initializePayment({ orderId, orderNumber, amount, currency }) {
    const id = `mock_pi_${crypto.randomBytes(12).toString('hex')}`;
    return {
      id,
      provider: this.name,
      orderId: String(orderId),
      orderNumber,
      amount: Math.round(amount * 100), // paise — real gateways all use the smallest currency unit
      currency,
      status: 'requires_payment',
      clientSecret: `${id}_secret_${crypto.randomBytes(16).toString('hex')}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      nextAction: {
        type: 'mock_redirect',
        instructions:
          'Mock gateway: in development call POST /api/v1/payments/mock/simulate { orderId, outcome: "success" | "failure" } to fire a signed webhook.',
      },
    };
  }

  static sign(rawBody) {
    return crypto.createHmac('sha256', env.payment.webhookSecret).update(rawBody).digest('hex');
  }

  verifySignature(rawBody, headers) {
    return safeEqual(headers['x-mock-signature'], MockPaymentGateway.sign(rawBody));
  }

  parseEvent(payload) {
    const map = { 'payment.succeeded': 'payment.succeeded', 'payment.failed': 'payment.failed', 'refund.processed': 'refund.processed' };
    return {
      id: payload.id,
      type: map[payload.type] || 'ignored',
      orderId: payload.data?.orderId,
      transactionId: payload.data?.transactionId,
      amount: payload.data?.amount,
      raw: payload,
    };
  }
}

/*
 * ── HOW TO VERIFY SIGNATURES ONCE A REAL GATEWAY IS INTEGRATED ─────────────────
 *
 * RAZORPAY  (class RazorpayGateway extends PaymentGateway)
 *   initializePayment: razorpay.orders.create({ amount: paise, currency: 'INR',
 *                       receipt: `FYN-${orderNumber}`, notes: { orderId } })
 *   Webhook header:    X-Razorpay-Signature
 *   verifySignature:   expected = HMAC_SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET).hex()
 *                      return safeEqual(headers['x-razorpay-signature'], expected)
 *                      (or Razorpay.validateWebhookSignature(rawBody, sig, secret))
 *   parseEvent:        'payment.captured' → payment.succeeded
 *                      'payment.failed'   → payment.failed
 *                      'refund.processed' → refund.processed
 *                      orderId = payload.payload.payment.entity.notes.orderId
 *                      transactionId = payload.payload.payment.entity.id
 *   Client callback:   ALSO verify on the success redirect:
 *                      HMAC_SHA256(`${razorpay_order_id}|${razorpay_payment_id}`, KEY_SECRET)
 *                      === razorpay_signature — but treat the WEBHOOK as the source of truth.
 *
 * STRIPE    (class StripeGateway extends PaymentGateway)
 *   initializePayment: stripe.paymentIntents.create({ amount: paise, currency: 'inr',
 *                       metadata: { orderId } }) → return { clientSecret: pi.client_secret }
 *   Webhook header:    Stripe-Signature
 *   verifySignature:   stripe.webhooks.constructEvent(rawBody, headers['stripe-signature'],
 *                       STRIPE_WEBHOOK_SECRET) — throws if invalid (also checks timestamp
 *                       tolerance to block replay attacks).
 *   parseEvent:        'payment_intent.succeeded' → payment.succeeded
 *                      'payment_intent.payment_failed' → payment.failed
 *                      'charge.refunded' → refund.processed
 *
 * In ALL cases:
 *   • Signatures are computed over the RAW request bytes — that's why the
 *     webhook route uses express.raw() and is mounted BEFORE express.json().
 *   • Never trust amount/status sent by the browser; only the verified webhook.
 *   • Handlers must be idempotent (gateways retry) — see orderService.applyPaymentEvent.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const GATEWAYS = {
  mock: MockPaymentGateway,
  // razorpay: RazorpayGateway,
  // stripe: StripeGateway,
};

class PaymentService {
  constructor(gateway) {
    this.gateway = gateway;
  }

  get provider() {
    return this.gateway.name;
  }

  async initializePayment(order, customer) {
    return this.gateway.initializePayment({
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      currency: order.currency,
      customer: { name: customer?.name, email: order.email, phone: customer?.phone },
    });
  }

  verifySignature(rawBody, headers) {
    return this.gateway.verifySignature(rawBody, headers);
  }

  async processWebhook(rawBody, headers) {
    if (!Buffer.isBuffer(rawBody) || !rawBody.length) throw new ApiError(400, 'Empty webhook body', 'INVALID_WEBHOOK');
    if (!this.verifySignature(rawBody, headers)) throw new ApiError(400, 'Invalid webhook signature', 'INVALID_SIGNATURE');
    let payload;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new ApiError(400, 'Webhook body is not valid JSON', 'INVALID_WEBHOOK');
    }
    return this.gateway.parseEvent(payload, headers);
  }
}

let instance;
function getPaymentService() {
  if (!instance) {
    const Gateway = GATEWAYS[env.payment.provider];
    if (!Gateway) throw new Error(`Unsupported PAYMENT_PROVIDER "${env.payment.provider}". Available: ${Object.keys(GATEWAYS).join(', ')}`);
    instance = new PaymentService(new Gateway());
  }
  return instance;
}

module.exports = { PaymentGateway, MockPaymentGateway, PaymentService, getPaymentService };
