'use strict';

const { Schema } = require('mongoose');

/** Images are objects (not bare URLs) so we keep SEO alt text + provider ID for cleanup. */
const imageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true, maxlength: 160 },
    publicId: { type: String, trim: true },
    unoptimized: { type: Boolean, default: false },
  },
  { _id: false }
);

const seoSchema = new Schema(
  {
    metaTitle: { type: String, trim: true, maxlength: 70 },
    metaDescription: { type: String, trim: true, maxlength: 170 },
    keywords: [{ type: String, trim: true, lowercase: true, maxlength: 60 }],
  },
  { _id: false }
);

const addressSchema = new Schema(
  {
    fullName: { type: String, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 20 },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    landmark: { type: String, trim: true, maxlength: 120 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    state: { type: String, required: true, trim: true, maxlength: 80 },
    postalCode: { type: String, required: true, trim: true, maxlength: 12 },
    country: { type: String, trim: true, uppercase: true, default: 'IN', maxlength: 2 },
    addressType: { type: String, enum: ['Home', 'Work'], default: 'Home' },
  },
  { _id: false }
);

module.exports = { imageSchema, seoSchema, addressSchema };
