'use strict';

const ApiError = require('../utils/ApiError');
const { hasPermission } = require('../config/permissions');

/**
 * Permission-based guard. Use AFTER `protect`.
 *   router.post('/', authorize(P.PRODUCTS_CREATE), createProduct)
 * Multiple permissions = ALL required.
 */
const authorize = (...permissions) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  const allowed = permissions.every((p) => hasPermission(req.user.role, p));
  if (!allowed) {
    return next(new ApiError(403, 'You do not have permission to perform this action', 'FORBIDDEN', { required: permissions }));
  }
  return next();
};

/** Role-based guard for the rare cases where a role (not a permission) matters. */
const restrictTo = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  if (!roles.includes(req.user.role)) return next(new ApiError(403, 'Insufficient role'));
  return next();
};

module.exports = { authorize, restrictTo };
