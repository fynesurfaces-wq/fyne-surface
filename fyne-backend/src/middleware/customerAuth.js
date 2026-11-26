'use strict';

const jwt = require('jsonwebtoken');
const { Customer } = require('../models');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../utils/helpers');
const env = require('../config/env');

const protectCustomer = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.fyn_customer;
  if (!token) {
    // Only attempt refresh when a refresh cookie exists. This keeps normal
    // signed-out browsing from triggering a second, expected 401 request.
    if (req.cookies?.fyn_customer_refresh) {
      throw new ApiError(401, 'Your customer session needs renewal.', 'CUSTOMER_SESSION_EXPIRED');
    }
    throw new ApiError(401, 'Sign in to continue.', 'CUSTOMER_AUTH_REQUIRED');
  }
  let payload;
  try {
    payload = jwt.verify(token, env.jwt.accessSecret, { issuer: env.jwt.issuer, audience: 'fyne-customer', algorithms: ['HS256'] });
  } catch {
    throw new ApiError(401, 'Your customer session has expired. Sign in again.', 'CUSTOMER_SESSION_EXPIRED');
  }
  const customer = await Customer.findById(payload.sub);
  if (!customer) throw new ApiError(401, 'Customer account not found.', 'CUSTOMER_AUTH_REQUIRED');
  if (payload.typ !== 'customer' || payload.sv !== (customer.sessionVersion || 0)) throw new ApiError(401, 'Your customer session has expired. Sign in again.', 'CUSTOMER_SESSION_EXPIRED');
  req.customer = customer;
  next();
});

const optionalCustomer = (req, res, next) => {
  if (!req.cookies?.fyn_customer && !req.cookies?.fyn_customer_refresh) return next();
  return protectCustomer(req, res, next);
};

module.exports = { protectCustomer, requireCustomer: protectCustomer, optionalCustomer };
