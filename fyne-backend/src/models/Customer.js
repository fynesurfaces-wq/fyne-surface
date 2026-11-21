'use strict';

const mongoose = require('mongoose');
const { addressSchema } = require('./schemas/common');

/** Storefront buyers (guest checkout creates/links by email). */
const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
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

customerSchema.index({ createdAt: -1 });
customerSchema.index({ totalSpent: -1 });
customerSchema.index({ acceptsMarketing: 1 });

module.exports = mongoose.model('Customer', customerSchema);
