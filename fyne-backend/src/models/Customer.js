'use strict';

const mongoose = require('mongoose');
const { addressSchema } = require('./schemas/common');

/** Storefront buyers, separate from administrator accounts. */
const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    password: { type: String, select: false },
    emailVerified: { type: Boolean, default: false },
    sessionVersion: { type: Number, default: 0, min: 0 },
    refreshTokenHash: { type: String, select: false },
    refreshTokenExpiresAt: { type: Date, select: false },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpiresAt: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    phone: { type: String, trim: true, maxlength: 20 },
    addresses: { type: [addressSchema], default: [] },
    acceptsMarketing: { type: Boolean, default: false },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 40 }],
    notes: { type: String, trim: true, maxlength: 2000 },
    source: { type: String, enum: ['checkout', 'lead', 'admin', 'import'], default: 'checkout' },
    ordersCount: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastOrderAt: Date,
  },
  { timestamps: true }
);

customerSchema.methods.setPassword = async function setPassword(value) {
  const bcrypt = require('bcryptjs');
  this.password = await bcrypt.hash(value, 12);
};

customerSchema.index({ createdAt: -1 });
customerSchema.index({ totalSpent: -1 });
customerSchema.index({ acceptsMarketing: 1 });

module.exports = mongoose.model('Customer', customerSchema);
