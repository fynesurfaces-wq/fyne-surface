'use strict';

const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const { clean: xssClean } = require('xss-clean/lib/xss');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { sanitizeRichText } = require('../utils/html');

/** Helmet + CORS (must run before routes). */
function securityHeaders() {
  return [
    helmet({
      // JSON API — no HTML is rendered, so a locked-down CSP is safe.
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
    cors({
      origin(origin, cb) {
        // Requests without Origin (curl, crawlers, server-to-server, webhooks) are allowed;
        // browser requests must come from a whitelisted storefront/admin origin.
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
        return cb(new ApiError(403, `Origin ${origin} not allowed by CORS`, 'CORS_BLOCKED'));
      },
      credentials: true, // needed for the HttpOnly refresh cookie
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['RateLimit', 'RateLimit-Policy', 'Retry-After'],
      maxAge: 600,
    }),
  ];
}

/** NoSQL-injection protection: strips keys starting with `$` or containing `.` */
const noSqlSanitize = () => mongoSanitize({ replaceWith: '_' });

/**
 * XSS protection (xss-clean). Plain-text fields are HTML-escaped by xss-clean.
 * Rich-text fields (edited with a WYSIWYG editor) are instead run through an
 * allow-list HTML sanitizer so formatting survives but scripts/handlers don't.
 */
const RICH_TEXT_KEYS = new Set(['description', 'body', 'answer']);
const SKIP_KEYS = new Set(['password', 'currentPassword', 'newPassword']);

function sanitizeValue(value, key) {
  if (typeof value === 'string') {
    if (SKIP_KEYS.has(key)) return value;
    return RICH_TEXT_KEYS.has(key) ? sanitizeRichText(value) : xssClean(value);
  }
  if (Array.isArray(value)) return value.map((v) => sanitizeValue(v, key));
  if (value && typeof value === 'object') {
    for (const k of Object.keys(value)) value[k] = sanitizeValue(value[k], k);
    return value;
  }
  return value;
}

const xssSanitize = () => (req, _res, next) => {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) sanitizeValue(req.body);
  if (req.query) sanitizeValue(req.query);
  if (req.params) sanitizeValue(req.params);
  next();
};

module.exports = { securityHeaders, noSqlSanitize, xssSanitize };
