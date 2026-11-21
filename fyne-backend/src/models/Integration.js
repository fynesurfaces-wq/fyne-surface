'use strict';

const mongoose = require('mongoose');

/**
 * "Apps" section. Stores enable/disable state and NON-secret config only.
 * API keys/secrets belong in environment variables / a secrets manager.
 */
const integrationSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9-]{2,40}$/ },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    category: {
      type: String,
      enum: ['payments', 'marketing', 'analytics', 'shipping', 'communication', 'seo', 'other'],
      default: 'other',
    },
    description: { type: String, trim: true, maxlength: 500 },
    isEnabled: { type: Boolean, default: false },
    config: { type: Map, of: String, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Integration', integrationSchema);
