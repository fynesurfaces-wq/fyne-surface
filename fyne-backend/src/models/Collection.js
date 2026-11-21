'use strict';

const mongoose = require('mongoose');
const { imageSchema, seoSchema } = require('./schemas/common');
const { slugify } = require('../utils/slug');

const collectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 120 }, // "1.2mtr & Above"
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 140 },
    description: { type: String, trim: true, maxlength: 10000 }, // sanitized HTML
    coverImage: imageSchema,
    seo: { type: seoSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

collectionSchema.index({ isActive: 1, sortOrder: 1 });

collectionSchema.pre('validate', function ensureSlug() {
  if (!this.slug && this.name) this.slug = slugify(this.name);
});

module.exports = mongoose.model('Collection', collectionSchema);
