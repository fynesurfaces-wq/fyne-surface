'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const contactMessageSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 20 },
  subject: { type: String, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 4000 },
  status: { type: String, enum: ['new', 'read', 'replied'], default: 'new', index: true },
  ipHash: { type: String, select: false },
}, { timestamps: true, versionKey: false });

contactMessageSchema.index({ createdAt: -1 });
module.exports = mongoose.model('ContactMessage', contactMessageSchema);
