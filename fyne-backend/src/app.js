'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { checkRedis } = require('./config/redis');

const env = require('./config/env');
const { securityHeaders, noSqlSanitize, xssSanitize } = require('./middleware/security');
const { apiLimiter } = require('./middleware/rateLimiters');
const { notFound, errorHandler } = require('./middleware/error');
const seo = require('./controllers/seo.controller');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', env.trustProxy); // correct client IPs for rate limiting behind a proxy

// 1. Security headers + CORS
app.use(securityHeaders());
app.use(compression());
app.use(morgan((tokens, req, res) => JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'http_request',
  method: tokens.method(req, res),
  path: req.path,
  status: Number(tokens.status(req, res)),
  responseTimeMs: Number(tokens['response-time'](req, res)),
  contentLength: Number(tokens.res(req, res, 'content-length')) || 0,
}), { skip: (req) => env.isProd && req.path === '/health', stream: { write: (line) => process.stdout.write(line) } }));

// 2. Payment webhook — needs the RAW body, so it is mounted BEFORE the JSON parser
app.use('/api/v1/payments', require('./routes/payment.routes'));

// 3. Body parsing + sanitisation
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());
app.use(noSqlSanitize()); // express-mongo-sanitize
app.use(xssSanitize()); // xss-clean (+ allow-list sanitiser for rich text)

// 4. Health check
app.get('/health', async (_req, res) => {
  let db = false;
  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      db = true;
    }
  } catch {
    db = false;
  }
  const redis = await checkRedis();
  const healthy = db && redis.ok;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    dependencies: { mongodb: db ? 'up' : 'down', redis: redis.status },
    uptime: Math.round(process.uptime()),
  });
});
// 5. Root-level SEO files (proxy these from the storefront domain)
app.get('/sitemap.xml', seo.sitemap);
app.get('/robots.txt', seo.robots);
app.get('/llms.txt', seo.llmsTxt);

// 6. API
app.use('/api/v1', apiLimiter, require('./routes'));

// 7. Errors
app.use(notFound);
app.use(errorHandler);

module.exports = app;
