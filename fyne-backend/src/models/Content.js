'use strict';

const mongoose = require('mongoose');
const { imageSchema, seoSchema } = require('./schemas/common');

/** Online Store content: static pages (About, Contact, Care Guide…) and blog posts. */
const contentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['page', 'blog_post'], required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 160 },
    excerpt: { type: String, trim: true, maxlength: 500 },
    body: { type: String, maxlength: 100000 }, // sanitized HTML
    coverImage: imageSchema,
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 40 }],
    seo: { type: seoSchema, default: () => ({}) },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    publishedAt: Date,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

contentSchema.index({ type: 1, slug: 1 }, { unique: true });

contentSchema.pre('save', function setPublishedAt() {
  if (this.status === 'published' && !this.publishedAt) this.publishedAt = new Date();
});

module.exports = mongoose.model('Content', contentSchema);
