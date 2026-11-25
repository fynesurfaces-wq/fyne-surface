'use strict';

const mongoose = require('mongoose');
const { imageSchema } = require('./schemas/common');

const siteContentSchema = new mongoose.Schema({
  key: { type: String, default: 'legacy', unique: true, immutable: true },
  isEnabled: { type: Boolean, default: true },
  eyebrow: { type: String, trim: true, maxlength: 80, default: 'Built to last' },
  title: { type: String, trim: true, maxlength: 160, default: 'Create a space that leaves a lasting impression.' },
  body: { type: String, trim: true, maxlength: 1200, default: 'From intimate gatherings to landmark installations, our team helps bring thoughtful greenery to the moments and spaces people remember.' },
  ctaLabel: { type: String, trim: true, maxlength: 60, default: 'Plan your project' },
  ctaHref: { type: String, trim: true, maxlength: 300, default: '/contact' },
  image: imageSchema,
  reels: {
    type: [{
      url: {
        type: String, trim: true, maxlength: 300, required: true,
        match: [/^https:\/\/(?:www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?(?:\?[A-Za-z0-9_=&%-]*)?$/i, 'Enter a valid Instagram Reel URL.'],
      },
      caption: { type: String, trim: true, maxlength: 180, default: '' },
      isActive: { type: Boolean, default: true },
    }],
    default: [],
    validate: { validator: (items) => items.length <= 8, message: 'A maximum of 8 Instagram reels is allowed.' },
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('SiteContent', siteContentSchema);
