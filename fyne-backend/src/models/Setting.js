'use strict';

const mongoose = require('mongoose');
const { imageSchema } = require('./schemas/common');

/** Singleton store settings document (key: "store"). */
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'store', unique: true, immutable: true },
    storeName: { type: String, default: 'FYNE SURFACES', trim: true, maxlength: 80 },
    tagline: { type: String, default: 'Premium Vertical Garden', trim: true, maxlength: 120 },
    logo: imageSchema,
    contact: {
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      whatsapp: { type: String, trim: true },
      address: { type: String, trim: true, maxlength: 300 },
    },
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    gstin: { type: String, trim: true, uppercase: true, maxlength: 15 },
    tax: {
      pricesIncludeTax: { type: Boolean, default: true },
      rate: { type: Number, default: 18, min: 0, max: 100 },
    },
    shipping: {
      flatRate: { type: Number, default: 0, min: 0 },
      freeShippingThreshold: { type: Number, default: 0, min: 0 }, // 0 = always free
    },
    /** Brand theme for the admin + storefront (matches the FYNE logo). */
    brandColors: {
      primary: { type: String, default: '#2E7D32' }, // green
      accent: { type: String, default: '#F4A261' }, // light orange
      background: { type: String, default: '#FFFFFF' }, // white
    },
    social: {
      instagram: String,
      facebook: String,
      youtube: String,
      linkedin: String,
      pinterest: String,
    },
    seo: {
      defaultMetaTitle: { type: String, maxlength: 70 },
      defaultMetaDescription: { type: String, maxlength: 170 },
    },
    channels: {
      onlineStore: { enabled: { type: Boolean, default: true } },
      agentic: {
        enabled: { type: Boolean, default: true }, // product feed + llms.txt
        allowAiCrawlers: { type: Boolean, default: true }, // GPTBot, PerplexityBot, ClaudeBot… in robots.txt
      },
    },
  },
  { timestamps: true }
);

settingSchema.statics.getStore = function getStore() {
  return this.findOneAndUpdate(
    { key: 'store' },
    { $setOnInsert: { key: 'store' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

module.exports = mongoose.model('Setting', settingSchema);
