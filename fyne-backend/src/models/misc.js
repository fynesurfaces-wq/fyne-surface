'use strict';

/** Small supporting models: Counter (order numbers), Visit (sessions/live view), Media (Files library). */
const mongoose = require('mongoose');

const { Schema } = mongoose;

// ── Counter ─────────────────────────────────────────────
const counterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } }, { versionKey: false });
counterSchema.statics.next = async function next(name, start = 1000, { session } = {}) {
  const doc = await this.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { new: true, upsert: true, session });
  return start + doc.seq;
};
const Counter = mongoose.model('Counter', counterSchema);

// ── Visit (storefront page views → Sessions, Conversion rate, Live visitors) ──
const visitSchema = new Schema(
  {
    sessionId: { type: String, required: true, maxlength: 64 },
    path: { type: String, maxlength: 300 },
    referrer: { type: String, maxlength: 300 },
    utmSource: { type: String, maxlength: 60 },
    device: { type: String, enum: ['mobile', 'tablet', 'desktop', 'other'], default: 'other' },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);
visitSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 }); // keep 180 days
visitSchema.index({ sessionId: 1, createdAt: -1 });
const Visit = mongoose.model('Visit', visitSchema);

// ── Media (Content → Files) ──────────────────────────────
const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true, unique: true },
    alt: { type: String, trim: true, maxlength: 160 },
    format: String,
    bytes: Number,
    width: Number,
    height: Number,
    folder: String,
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);
mediaSchema.index({ createdAt: -1 });
const Media = mongoose.model('Media', mediaSchema);

module.exports = { Counter, Visit, Media };
