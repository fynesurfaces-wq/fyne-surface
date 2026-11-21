'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * B2B / project enquiries — vertical-garden & large-plant sales are often
 * quote-led (architects, hotels, offices), so leads get a pipeline of their own.
 */
const leadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 20 },
    company: { type: String, trim: true, maxlength: 120 },
    city: { type: String, trim: true, maxlength: 80 },
    message: { type: String, trim: true, maxlength: 2000 },
    source: {
      type: String,
      enum: ['contact_form', 'quote_request', 'whatsapp', 'phone', 'instagram', 'referral', 'other'],
      default: 'contact_form',
    },
    projectType: { type: String, enum: ['residential', 'commercial', 'hospitality', 'office', 'retail', 'other'] },
    areaSqFt: { type: Number, min: 0 },
    budgetRange: { type: String, trim: true, maxlength: 60 },
    interestedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'],
      default: 'new',
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: [
      {
        _id: false,
        text: { type: String, required: true, maxlength: 2000 },
        by: { type: Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
      },
    ],
    utm: { source: String, medium: String, campaign: String },
  },
  { timestamps: true }
);

leadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
