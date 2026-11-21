'use strict';

const { rateLimit } = require('express-rate-limit');

const handler = (message) => (_req, res, _next, options) =>
  res.status(options.statusCode).json({ success: false, error: { code: 'TOO_MANY_REQUESTS', message } });

const base = { standardHeaders: 'draft-7', legacyHeaders: false };

/** Login: 10 FAILED attempts / 15 min per IP (successful logins don't count). */
const loginLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  handler: handler('Too many login attempts. Please try again in 15 minutes.'),
});

/** Refresh / logout / other auth endpoints. */
const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 100,
  handler: handler('Too many authentication requests. Please slow down.'),
});

/** Public write endpoints: checkout, leads, discount validation. */
const publicWriteLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  handler: handler('Too many requests. Please try again shortly.'),
});

/** Page-view tracking beacons. */
const trackingLimiter = rateLimit({ ...base, windowMs: 60 * 1000, limit: 120, handler: handler('Rate limited') });

/** Global API ceiling. */
const apiLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 1500,
  handler: handler('Too many requests from this IP.'),
});

module.exports = { loginLimiter, authLimiter, publicWriteLimiter, trackingLimiter, apiLimiter };
