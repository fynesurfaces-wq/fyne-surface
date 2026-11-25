'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const ORDER_STATUS = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
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

const shippingAddressSchema = new Schema(
  {
    fullName: { type: String, required() { return this.isNew; }, trim: true, minlength: 2, maxlength: 100 },
    phoneNumber: { type: String, required() { return this.isNew || !this.phone; }, match: /^\d{10}$/ },
    addressLine1: { type: String, required() { return this.isNew || !this.line1; }, trim: true, minlength: 3, maxlength: 200 },
    addressLine2: { type: String, trim: true, maxlength: 200 },
    landmark: { type: String, trim: true, maxlength: 120 },
    city: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    state: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    pincode: { type: String, required() { return this.isNew || !this.postalCode; }, match: /^\d{6}$/ },
    addressType: { type: String, enum: ['Home', 'Work'], default: 'Home', required: true },
    // Legacy aliases keep historical orders readable and editable after the address schema update.
    phone: { type: String, trim: true, maxlength: 20 },
    line1: { type: String, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    postalCode: { type: String, trim: true, maxlength: 12 },
    country: { type: String, trim: true, uppercase: true, maxlength: 2 },
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
    shippingAddress: { type: shippingAddressSchema, required: true },
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
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'cod' },
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
