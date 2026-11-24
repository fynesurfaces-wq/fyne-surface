'use strict';

const mongoose = require('mongoose');
const { imageSchema, seoSchema } = require('./schemas/common');
const { slugify } = require('../utils/slug');

const { Schema } = mongoose;

/**
 * Specifications are TYPED (not free text) so they can be filtered, rendered
 * consistently, and emitted as Schema.org PropertyValues for Google / AI engines.
 * Anything product-specific that doesn't fit goes in `additional` (key → value).
 */
const specificationsSchema = new Schema(
  {
    height: {
      value: { type: Number, min: 0 },
      unit: { type: String, enum: ['ft', 'm', 'cm', 'in'], default: 'ft' },
    },
    leaves: {
      count: { type: Number, min: 0 },
      material: { type: String, trim: true, maxlength: 40 }, // e.g. "PE" (polyethylene)
    },
    trunkMaterial: { type: String, trim: true, maxlength: 60 }, // Wooden / Plastic
    flowers: { type: Number, min: 0 },
    packSize: { type: Number, min: 1 }, // pieces per pack
    potIncluded: Boolean,
    uvResistant: Boolean,
    fireRetardant: Boolean,
    indoorOutdoor: { type: String, enum: ['indoor', 'outdoor', 'both'] },
    additional: { type: Map, of: String },
  },
  { _id: false }
);

const faqSchema = new Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 300 },
    answer: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    name: { type: String, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 30 }, // FYN104E
    collection: { type: Schema.Types.ObjectId, ref: 'Collection', required: true, index: true },
    price: { type: Number, required: true, min: 0 }, // INR, GST handling per Settings.tax
    compareAtPrice: { type: Number, min: 0 }, // strike-through "MRP"
    currency: { type: String, default: 'INR', enum: ['INR'] },
    shortDescription: { type: String, trim: true, maxlength: 500 }, // plain text, used in cards & AI summaries
    description: { type: String, trim: true, maxlength: 20000 }, // sanitized HTML
    specifications: { type: specificationsSchema, default: () => ({}) },
    images: { type: [imageSchema], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, min: 0 }, // falls back to env LOW_STOCK_THRESHOLD
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 40 }],
    faqs: { type: [faqSchema], default: [] }, // feeds FAQPage JSON-LD (AEO)
    seo: { type: seoSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  // `collection` is a reserved schema option name in Mongoose; suppress the warning since it's our field.
  { timestamps: true, suppressReservedKeysWarning: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.index({ isActive: 1, collection: 1, price: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ stock: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ name: 1 }, { unique: true, sparse: true, collation: { locale: 'en', strength: 2 }, name: 'uniq_product_name_ci' });

productSchema.virtual('inStock').get(function inStock() {
  return this.stock > 0;
});

productSchema.pre('validate', async function validateOptionalUniqueName() {
  const name = String(this.name || '').trim().replace(/\s+/g, ' ');
  this.name = name || undefined;
  if (!name) return;

  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const duplicate = await this.constructor.exists({
    _id: { $ne: this._id },
    name: { $regex: `^${escaped}$`, $options: 'i' },
  });
  if (duplicate) this.invalidate('name', 'Product names must be unique. Use a descriptive product variant name.');
});

productSchema.pre('validate', function ensureSlug() {
  if (!this.slug) this.slug = slugify(this.name || this.sku);
});

module.exports = mongoose.model('Product', productSchema);
