'use strict';

const mongoose = require('mongoose');

/** Regions you sell to (India primary; e.g. UAE/GCC later) with currency + price rules. */
const marketSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    countries: [{ type: String, uppercase: true, trim: true, match: /^[A-Z]{2}$/ }],
    currency: { type: String, uppercase: true, trim: true, default: 'INR', match: /^[A-Z]{3}$/ },
    /** e.g. 10 = prices 10% higher in this market (applied by the storefront/pricing layer). */
    priceAdjustmentPercent: { type: Number, default: 0, min: -90, max: 500 },
    subfolder: { type: String, trim: true, lowercase: true, maxlength: 20 }, // "/en-ae"
    isPrimary: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Market', marketSchema);
