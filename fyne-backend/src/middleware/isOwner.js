'use strict';

const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../utils/helpers');

/**
 * Resource ownership guard. Mount after protectCustomer and supply the model's
 * owner field (for example Order.user or an address document's customerId).
 * Querying by both _id and owner avoids an existence oracle for other users' IDs.
 */
function isOwner({ Model, ownerField = 'user', idParam = 'id', assignTo = 'ownedResource', select } = {}) {
  if (!Model || !ownerField) throw new TypeError('isOwner requires a Model and ownerField');
  return asyncHandler(async (req, _res, next) => {
    if (!req.customer?._id) throw new ApiError(401, 'Sign in to continue.', 'CUSTOMER_AUTH_REQUIRED');
    const query = Model.findOne({ _id: req.params[idParam], [ownerField]: req.customer._id });
    if (select) query.select(select);
    const resource = await query;
    if (!resource) throw new ApiError(404, 'Resource not found', 'RESOURCE_NOT_FOUND');
    req[assignTo] = resource;
    next();
  });
}

module.exports = { isOwner };
