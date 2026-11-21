'use strict';

const mongoose = require('mongoose');
const { addressSchema } = require('./schemas/common');

const { Schema } = mongoose;

const ORDER_STATUS = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
const PAYMENT_STATUS = ['Pending', 'Paid', 'Failed', 'Refunded'];
const PAYMENT_METHODS = ['online', 'cod', 'bank_transfer'];

/** Line items are SNAPSHOTS — later product edits/deletes never change historic orders. */
const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    image: String,
    price: { type: Number, required: true, min: 0 }, // unit price at time of purchase
    qty: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const statusEventSchema = new Schema(
  {
    type: { type: String, enum: ['order', 'payment', 'note'], required: true },
    status: String,
    note: { type: String, maxlength: 500 },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: Number, required: true, unique: true }, // #1001, #1002 …
    /** Storefront customer (named `user` per spec; refs Customer, not staff User). */
    user: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    orderItems: {
      type: [orderItemSchema],
      validate: [(v) => Array.isArray(v) && v.length > 0, 'Order must contain at least one item'],
    },
    shippingAddress: { type: addressSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: {
      code: String,
      amount: { type: Number, default: 0, min: 0 },
    },
    shippingFee: { type: Number, default: 0, min: 0 },
    tax: {
      amount: { type: Number, default: 0, min: 0 },
      rate: { type: Number, default: 0 },
      included: { type: Boolean, default: true },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },

    orderStatus: { type: String, enum: ORDER_STATUS, default: 'Pending', index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUS, default: 'Pending', index: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'online' },
    paymentProvider: String, // mock | razorpay | stripe
    paymentIntentId: { type: String, index: true, sparse: true },
    gatewayTransactionId: { type: String, index: true, sparse: true },

    inventoryCommitted: { type: Boolean, default: false },
    tracking: { carrier: String, number: String, url: String },
    notes: { type: String, maxlength: 1000 },
    history: { type: [statusEventSchema], default: [] },

    paidAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ 'discount.code': 1, user: 1 });

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUS = ORDER_STATUS;
module.exports.PAYMENT_STATUS = PAYMENT_STATUS;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
