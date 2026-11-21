'use strict';

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../utils/helpers');
const { permissionsFor } = require('../config/permissions');
const {
  REFRESH_COOKIE,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  refreshCookieOptions,
  clearRefreshCookieOptions,
} = require('../utils/tokens');

// Used to equalise response time when the email doesn't exist.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', 12);

/** Issue a fresh access+refresh pair, persist the refresh hash, set the cookie. */
async function issueTokens(user, res) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await User.updateOne({ _id: user._id }, { $set: { refreshToken: hashToken(refreshToken) } });
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  return accessToken;
}

const sessionPayload = (user, accessToken) => ({
  accessToken,
  tokenType: 'Bearer',
  user: user.toJSON(),
  permissions: permissionsFor(user.role),
});

/** POST /api/v1/auth/login */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  // Same message + always run bcrypt → no user-enumeration via response or timing.
  const ok = user ? await user.comparePassword(password) : await bcrypt.compare(password, DUMMY_HASH);
  if (!user || !ok) throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  if (!user.isActive) throw new ApiError(403, 'This account has been disabled', 'ACCOUNT_DISABLED');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const accessToken = await issueTokens(user, res);
  res.json({ success: true, data: sessionPayload(user, accessToken) });
});

/**
 * POST /api/v1/auth/refresh — rotates the refresh token.
 * If a valid-but-already-rotated token is presented (stolen + replayed), we
 * treat it as compromise and revoke the session entirely.
 */
exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  const fail = (msg, code) => {
    res.clearCookie(REFRESH_COOKIE, clearRefreshCookieOptions());
    return new ApiError(401, msg, code);
  };
  if (!token) throw fail('No refresh token', 'NO_REFRESH_TOKEN');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw fail('Session expired — please log in again', 'REFRESH_INVALID');
  }

  const user = await User.findById(payload.sub).select('+refreshToken');
  if (!user || !user.isActive) throw fail('Account not found or disabled', 'ACCOUNT_DISABLED');

  if (!user.refreshToken || user.refreshToken !== hashToken(token)) {
    await User.updateOne({ _id: user._id }, { $unset: { refreshToken: 1 } }); // reuse detected → revoke
    throw fail('Session revoked — please log in again', 'REFRESH_REUSED');
  }

  const accessToken = await issueTokens(user, res);
  res.json({ success: true, data: sessionPayload(user, accessToken) });
});

/** POST /api/v1/auth/logout — works even with an expired access token. */
exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    try {
      const payload = verifyRefreshToken(token, { ignoreExpiration: true });
      await User.updateOne({ _id: payload.sub, refreshToken: hashToken(token) }, { $unset: { refreshToken: 1 } });
    } catch {
      /* invalid token — nothing to revoke */
    }
  }
  res.clearCookie(REFRESH_COOKIE, clearRefreshCookieOptions());
  res.json({ success: true, message: 'Logged out' });
});

/** GET /api/v1/auth/me */
exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toJSON(), permissions: permissionsFor(req.user.role) } });
});

/** PATCH /api/v1/auth/password — change own password; other sessions are invalidated. */
exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw new ApiError(400, 'Current password is incorrect', 'WRONG_PASSWORD');
  }
  user.password = req.body.newPassword;
  await user.save();
  const fresh = await User.findById(user._id);
  const accessToken = await issueTokens(fresh, res);
  res.json({ success: true, data: sessionPayload(fresh, accessToken) });
});
