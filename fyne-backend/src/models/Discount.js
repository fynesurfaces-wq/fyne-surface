'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const discountSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, match: /^[A-Z0-9_-]{3,30}$/ },
    description: { type: String, trim: true, maxlength: 300 },
    type: { type: String, enum: ['percentage', 'fixed_amount', 'free_shipping'], required: true },
    value: { type: Number, default: 0, min: 0 }, // % or ₹ depending on type
    minSubtotal: { type: Number, default: 0, min: 0 },
    maxDiscountAmount: { type: Number, min: 0 }, // cap for percentage discounts
    startsAt: { type: Date, default: Date.now },
    endsAt: Date,
    usageLimit: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0 },
    oncePerCustomer: { type: Boolean, default: false },
    appliesTo: {
      scope: { type: String, enum: ['all', 'collections', 'products'], default: 'all' },
      collections: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],
      products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

discountSchema.index({ isActive: 1, startsAt: 1, endsAt: 1 });

module.exports = mongoose.model('Discount', discountSchema);
