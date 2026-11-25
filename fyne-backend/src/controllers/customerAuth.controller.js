'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Customer, Order } = require('../models');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../utils/helpers');
const env = require('../config/env');
const emailService = require('../services/email.service');

const COOKIE = 'fyn_customer';
const REFRESH_COOKIE = 'fyn_customer_refresh';
const tokenOptions = { issuer: env.jwt.issuer, audience: 'fyne-customer', algorithm: 'HS256' };
const accessCookieOptions = () => ({ httpOnly: true, secure: env.isProd, sameSite: 'strict', path: '/', maxAge: 15 * 60 * 1000 });
const refreshCookieOptions = () => ({ httpOnly: true, secure: env.isProd, sameSite: 'strict', path: '/', maxAge: env.jwt.customerRefreshExpiresDays * 24 * 60 * 60 * 1000 });
const safeCustomer = (c) => ({ id: String(c._id), name: c.name, email: c.email, phone: c.phone || '', emailVerified: c.emailVerified });
const hashed = (token) => crypto.createHash('sha256').update(token).digest('hex');

const issueAccessToken = (customer) => jwt.sign(
  { sub: String(customer._id), typ: 'customer', sv: customer.sessionVersion || 0 },
  env.jwt.accessSecret,
  { ...tokenOptions, expiresIn: '15m' }
);

async function startCustomerSession(customer, res) {
  const refreshToken = crypto.randomBytes(48).toString('hex');
  customer.refreshTokenHash = hashed(refreshToken);
  customer.refreshTokenExpiresAt = new Date(Date.now() + env.jwt.customerRefreshExpiresDays * 24 * 60 * 60 * 1000);
  await customer.save();
  res.cookie(COOKIE, issueAccessToken(customer), accessCookieOptions());
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
}

function clearCustomerCookies(res) {
  res.clearCookie(COOKIE, { ...accessCookieOptions(), maxAge: undefined });
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
}

exports.register = asyncHandler(async (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  let customer = await Customer.findOne({ email }).select('+password +emailVerificationTokenHash +emailVerificationExpiresAt');
  if (customer?.password) throw new ApiError(409, 'An account already exists for this email', 'EMAIL_EXISTS');
  if (!customer) customer = new Customer({ email, source: 'checkout' });
  customer.name = req.body.name.trim();
  customer.phone = req.body.phone || customer.phone;
  await customer.setPassword(req.body.password);
  // Email delivery is optional: a customer can use the store without an email provider.
  // Keep the legacy verification fields cleared so no stale token can be reused.
  customer.emailVerified = true;
  customer.emailVerificationTokenHash = undefined;
  customer.emailVerificationExpiresAt = undefined;
  await customer.save();
  await startCustomerSession(customer, res);
  res.status(201).json({ success: true, data: { verificationRequired: false, customer: safeCustomer(customer) } });
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const tokenHash = hashed(req.body.token);
  const customer = await Customer.findOne({ emailVerificationTokenHash: tokenHash, emailVerificationExpiresAt: { $gt: new Date() } }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');
  if (!customer) throw new ApiError(400, 'This verification link is invalid or expired.', 'INVALID_VERIFICATION_TOKEN');
  customer.emailVerified = true;
  customer.emailVerificationTokenHash = undefined;
  customer.emailVerificationExpiresAt = undefined;
  await customer.save();
  await startCustomerSession(customer, res);
  res.json({ success: true, data: { customer: safeCustomer(customer) } });
});

exports.login = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ email: req.body.email.trim().toLowerCase() }).select('+password');
  if (!customer?.password || !(await bcrypt.compare(req.body.password, customer.password))) {
    throw new ApiError(401, 'Email or password is incorrect.', 'INVALID_CREDENTIALS');
  }
  // Let existing accounts created before optional email verification sign in too.
  if (!customer.emailVerified) {
    customer.emailVerified = true;
    customer.emailVerificationTokenHash = undefined;
    customer.emailVerificationExpiresAt = undefined;
  }
  await startCustomerSession(customer, res);
  res.json({ success: true, data: { customer: safeCustomer(customer) } });
});

exports.refresh = asyncHandler(async (req, res) => {
  const currentToken = req.cookies?.[REFRESH_COOKIE];
  if (!currentToken) {
    clearCustomerCookies(res);
    throw new ApiError(401, 'Your customer session has expired. Sign in again.', 'CUSTOMER_SESSION_EXPIRED');
  }
  const nextToken = crypto.randomBytes(48).toString('hex');
  const customer = await Customer.findOneAndUpdate(
    { refreshTokenHash: hashed(currentToken), refreshTokenExpiresAt: { $gt: new Date() } },
    { $set: { refreshTokenHash: hashed(nextToken), refreshTokenExpiresAt: new Date(Date.now() + env.jwt.customerRefreshExpiresDays * 24 * 60 * 60 * 1000) } },
    { new: true, runValidators: true }
  );
  if (!customer) {
    clearCustomerCookies(res);
    throw new ApiError(401, 'Your customer session has expired. Sign in again.', 'CUSTOMER_SESSION_EXPIRED');
  }
  res.cookie(COOKIE, issueAccessToken(customer), accessCookieOptions());
  res.cookie(REFRESH_COOKIE, nextToken, refreshCookieOptions());
  res.json({ success: true, data: { customer: safeCustomer(customer) } });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ email: req.body.email.trim().toLowerCase() });
  if (customer) {
    const token = crypto.randomBytes(32).toString('hex');
    customer.passwordResetTokenHash = hashed(token);
    customer.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await customer.save();
    await emailService.sendCustomerPasswordReset(customer, `${env.siteUrl}/reset-password?token=${token}`);
  }
  // Keep the response identical whether the account exists or not.
  res.json({ success: true, data: { message: 'If an account exists and email delivery is configured, a password reset link will be sent.' } });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ passwordResetTokenHash: hashed(req.body.token), passwordResetExpiresAt: { $gt: new Date() } }).select('+passwordResetTokenHash +passwordResetExpiresAt +refreshTokenHash +refreshTokenExpiresAt');
  if (!customer) throw new ApiError(400, 'This password reset link is invalid or expired.', 'INVALID_RESET_TOKEN');
  await customer.setPassword(req.body.password);
  customer.passwordResetTokenHash = undefined;
  customer.passwordResetExpiresAt = undefined;
  customer.sessionVersion += 1;
  customer.refreshTokenHash = undefined;
  customer.refreshTokenExpiresAt = undefined;
  await customer.save();
  res.json({ success: true, data: { message: 'Password updated. You can now sign in.' } });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.customer._id).select('+password +refreshTokenHash +refreshTokenExpiresAt');
  if (!customer?.password || !(await bcrypt.compare(req.body.currentPassword, customer.password))) {
    throw new ApiError(400, 'Current password is incorrect.', 'CURRENT_PASSWORD_INVALID');
  }
  await customer.setPassword(req.body.password);
  customer.sessionVersion = (customer.sessionVersion || 0) + 1;
  customer.refreshTokenHash = undefined;
  customer.refreshTokenExpiresAt = undefined;
  await customer.save();
  clearCustomerCookies(res);
  res.json({ success: true, data: { message: 'Password changed. Please sign in again.' } });
});

exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) await Customer.updateOne({ refreshTokenHash: hashed(token) }, { $unset: { refreshTokenHash: 1, refreshTokenExpiresAt: 1 }, $inc: { sessionVersion: 1 } });
  clearCustomerCookies(res);
  res.json({ success: true });
});

exports.profile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { customer: { ...safeCustomer(req.customer), addresses: req.customer.addresses || [] } } });
});

exports.orders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(20, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
  const [orders, total] = await Promise.all([
    Order.find({ user: req.customer._id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .select('orderNumber orderItems orderStatus paymentStatus paymentMethod subtotal discount shippingFee tax totalAmount createdAt shippedAt deliveredAt tracking').lean(),
    Order.countDocuments({ user: req.customer._id }),
  ]);
  res.json({ success: true, data: orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;
  if (name !== undefined) req.customer.name = name.trim();
  if (phone !== undefined) req.customer.phone = phone.trim();
  if (address) {
    const index = req.customer.addresses.findIndex((saved) => saved.line1.toLowerCase() === address.line1.toLowerCase() && saved.postalCode === address.postalCode);
    if (index >= 0) req.customer.addresses.splice(index, 1);
    req.customer.addresses.unshift(address);
    req.customer.addresses = req.customer.addresses.slice(0, 10);
  }
  await req.customer.save();
  res.json({ success: true, data: { customer: { ...safeCustomer(req.customer), addresses: req.customer.addresses || [] } } });
});
