'use strict';

const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../utils/helpers');
const { verifyAccessToken } = require('../utils/tokens');

/**
 * Requires a valid ACCESS token in `Authorization: Bearer <token>`.
 *
 * On expiry we return 401 with code TOKEN_EXPIRED — the admin SPA catches that
 * code, calls POST /auth/refresh once (cookie is sent automatically), and
 * retries the original request.
 *
 * The role is re-read from the DB on every request, so role changes and
 * deactivations take effect immediately (not after the token expires).
 */
const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) throw new ApiError(401, 'Authentication required', 'NO_TOKEN');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw new ApiError(401, 'Access token expired', 'TOKEN_EXPIRED');
    throw new ApiError(401, 'Invalid access token', 'INVALID_TOKEN');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'Account not found or disabled', 'ACCOUNT_DISABLED');
  if (user.changedPasswordAfter(payload.iat)) {
    throw new ApiError(401, 'Password was changed — please log in again', 'PASSWORD_CHANGED');
  }

  req.user = user;
  next();
});

module.exports = { protect };
