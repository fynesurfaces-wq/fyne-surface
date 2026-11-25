'use strict';

const { rateLimit } = require('express-rate-limit');
const { RedisRateLimitStore } = require('./redisRateLimitStore');

const handler = (message) => (_req, res, _next, options) =>
  res.status(options.statusCode).json({ success: false, error: { code: 'TOO_MANY_REQUESTS', message } });

const base = (prefix) => ({ standardHeaders: 'draft-7', legacyHeaders: false, store: new RedisRateLimitStore(prefix) });

/** Login: 10 FAILED attempts / 15 min per IP (successful logins don't count). */
const loginLimiter = rateLimit({
  ...base('admin-login'),
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  handler: handler('Too many login attempts. Please try again in 15 minutes.'),
});

/** Refresh / logout / other auth endpoints. */
const authLimiter = rateLimit({
  ...base('admin-auth'),
  windowMs: 15 * 60 * 1000,
  limit: 100,
  handler: handler('Too many authentication requests. Please slow down.'),
});

/** Public write endpoints: checkout, leads, discount validation. */
const publicWriteLimiter = rateLimit({
  ...base('public-write'),
  windowMs: 15 * 60 * 1000,
  limit: 30,
  handler: handler('Too many requests. Please try again shortly.'),
});

/** Checkout is more expensive and creates inventory-affecting records. */
const checkoutLimiter = rateLimit({
  ...base('checkout'),
  windowMs: 15 * 60 * 1000,
  limit: 10,
  handler: handler('Too many checkout attempts. Please try again shortly.'),
});

/** Public search and contact endpoints have independent abuse ceilings. */
const searchLimiter = rateLimit({ ...base('search'), windowMs: 60 * 1000, limit: 60, handler: handler('Too many searches. Please try again shortly.') });
const contactLimiter = rateLimit({ ...base('contact'), windowMs: 15 * 60 * 1000, limit: 5, handler: handler('Too many contact requests. Please try again later.') });

/** Page-view tracking beacons. */
const trackingLimiter = rateLimit({ ...base('tracking'), windowMs: 60 * 1000, limit: 120, handler: handler('Rate limited') });

/** Global API ceiling. */
const apiLimiter = rateLimit({
  ...base('api-global'),
  windowMs: 15 * 60 * 1000,
  limit: 1500,
  handler: handler('Too many requests from this IP.'),
});

module.exports = { loginLimiter, authLimiter, publicWriteLimiter, checkoutLimiter, searchLimiter, contactLimiter, trackingLimiter, apiLimiter };
