'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/permissions');

/** Staff accounts for the admin panel (customers live in Customer.js). */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    password: { type: String, required: true, minlength: 10, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.EDITOR, index: true },
    /** SHA-256 hash of the CURRENT refresh token (rotated on every refresh). */
    refreshToken: { type: String, select: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
    passwordChangedAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/** True if the token was issued before the last password change. */
userSchema.methods.changedPasswordAfter = function changedPasswordAfter(jwtIatSeconds) {
  if (!this.passwordChangedAt) return false;
  return jwtIatSeconds * 1000 < this.passwordChangedAt.getTime() - 1000;
};

module.exports = mongoose.model('User', userSchema);
