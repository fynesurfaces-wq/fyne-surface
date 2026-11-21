'use strict';

/**
 * Dual-token auth helpers.
 *
 *  Access token  — short-lived (15m), returned in JSON, kept IN MEMORY by the
 *                  admin SPA and sent as `Authorization: Bearer <token>`.
 *  Refresh token — long-lived (7d), sent ONLY as an HttpOnly + Secure +
 *                  SameSite=Strict cookie scoped to /api/v1/auth. JavaScript
 *                  can never read it. A SHA-256 hash is stored on the user so
 *                  it can be rotated and revoked (reuse → full logout).
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const REFRESH_COOKIE = 'fyne_rt';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

const signOpts = { issuer: env.jwt.issuer, audience: env.jwt.audience, algorithm: 'HS256' };
const verifyOpts = { issuer: env.jwt.issuer, audience: env.jwt.audience, algorithms: ['HS256'] };

const signAccessToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role, typ: 'access' }, env.jwt.accessSecret, {
    ...signOpts,
    expiresIn: env.jwt.accessExpires,
  });

const signRefreshToken = (user) =>
  jwt.sign({ sub: String(user._id), typ: 'refresh', jti: crypto.randomUUID() }, env.jwt.refreshSecret, {
    ...signOpts,
    expiresIn: `${env.jwt.refreshExpiresDays}d`,
  });

const verifyAccessToken = (token) => {
  const payload = jwt.verify(token, env.jwt.accessSecret, verifyOpts);
  if (payload.typ !== 'access') throw new jwt.JsonWebTokenError('wrong token type');
  return payload;
};

const verifyRefreshToken = (token, { ignoreExpiration = false } = {}) => {
  const payload = jwt.verify(token, env.jwt.refreshSecret, { ...verifyOpts, ignoreExpiration });
  if (payload.typ !== 'refresh') throw new jwt.JsonWebTokenError('wrong token type');
  return payload;
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.isProd, // browsers also accept Secure cookies on http://localhost
  sameSite: 'strict',
  path: REFRESH_COOKIE_PATH,
  maxAge: env.jwt.refreshExpiresDays * 24 * 60 * 60 * 1000,
});

const clearRefreshCookieOptions = () => {
  const { maxAge, ...rest } = refreshCookieOptions();
  return rest;
};

module.exports = {
  REFRESH_COOKIE,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  refreshCookieOptions,
  clearRefreshCookieOptions,
};
