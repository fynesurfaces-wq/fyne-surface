'use strict';

require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

const required = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')} (see .env.example)`);
}

if (isProd) {
  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'PAYMENT_WEBHOOK_SECRET']) {
    if (!process.env[key] || process.env[key].length < 32) {
      throw new Error(`${key} must be at least 32 characters in production`);
    }
  }
  if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ');
  }
}

const list = (value, fallback = '') =>
  (value || fallback)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const stripSlash = (url) => String(url || '').replace(/\/+$/, '');

module.exports = Object.freeze({
  nodeEnv,
  isProd,
  port: Number(process.env.PORT) || 5000,
  trustProxy: Number(process.env.TRUST_PROXY ?? 1),
  mongoUri: process.env.MONGO_URI,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpiresDays: Number(process.env.JWT_REFRESH_EXPIRES_DAYS) || 7,
    issuer: 'fyne-api',
    audience: 'fyne-admin',
  },
  corsOrigins: [
    ...new Set([
      'http://localhost:3000',
      'http://localhost:5173',
      'https://fyne-surface.vercel.app',
      'https://fyne-surface-qivi.vercel.app',
      'https://fyne-surface.onrender.com',
      ...list(process.env.CORS_ORIGINS),
    ]),
  ],
  siteUrl: stripSlash(process.env.SITE_URL || 'http://localhost:3000'),
  apiUrl: stripSlash(process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`),
  imagekit: {
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: stripSlash(process.env.IMAGEKIT_URL_ENDPOINT || ''),
    folder: process.env.IMAGEKIT_FOLDER || 'fyne-surfaces',
  },
  payment: {
    provider: (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase(),
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'dev-only-webhook-secret',
  },
  lowStockThreshold: Number(process.env.LOW_STOCK_THRESHOLD) || 5,
  brand: {
    name: 'FYNE SURFACES',
    tagline: 'Premium Vertical Garden',
  },
  seed: {
    name: process.env.SEED_SUPERADMIN_NAME || 'FYNE Owner',
    email: process.env.SEED_SUPERADMIN_EMAIL,
    password: process.env.SEED_SUPERADMIN_PASSWORD,
  },
});
