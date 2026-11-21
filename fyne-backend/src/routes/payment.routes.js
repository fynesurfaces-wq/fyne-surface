'use strict';

/**
 * /api/v1/payments/* — mounted in app.js BEFORE express.json() so the webhook
 * receives the raw, unparsed body needed for signature verification.
 */
const express = require('express');
const env = require('../config/env');
const ctrl = require('../controllers/payment.controller');
const validate = require('../middleware/validate');
const { publicWriteLimiter } = require('../middleware/rateLimiters');
const sv = require('../validators/store.validators');

const router = express.Router();

router.post('/webhook', express.raw({ type: '*/*', limit: '1mb' }), ctrl.handleWebhook);

// Development helper — never available in production or with a real gateway.
if (!env.isProd && env.payment.provider === 'mock') {
  router.post('/mock/simulate', express.json(), publicWriteLimiter, validate(sv.simulatePayment), ctrl.simulateMockPayment);
}

module.exports = router;
