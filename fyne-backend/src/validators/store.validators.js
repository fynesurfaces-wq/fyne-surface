'use strict';

const { body, query, mongoIdParam, listQuery } = require('./common');
const { PAYMENT_METHODS, ORDER_STATUS, PAYMENT_STATUS } = require('../models/Order');

const phone = (path) => body(path).optional({ values: 'falsy' }).isString().trim().matches(/^[0-9+\-\s()]{7,20}$/).withMessage('Invalid phone number');

const address = (p) => [
  body(p).isObject().withMessage(`${p} is required`),
  body(`${p}.fullName`).optional().isString().trim().isLength({ max: 100 }),
  phone(`${p}.phone`),
  body(`${p}.line1`).isString().trim().isLength({ min: 3, max: 200 }).withMessage('Address line 1 is required'),
  body(`${p}.line2`).optional().isString().trim().isLength({ max: 200 }),
  body(`${p}.city`).isString().trim().isLength({ min: 2, max: 80 }).withMessage('City is required'),
  body(`${p}.state`).isString().trim().isLength({ min: 2, max: 80 }).withMessage('State is required'),
  body(`${p}.postalCode`).isString().trim().matches(/^[A-Za-z0-9 -]{3,12}$/).withMessage('Invalid postal code'),
  body(`${p}.country`).optional().isISO31661Alpha2().toUpperCase(),
];

exports.checkout = [
  body('customer').isObject(),
  body('customer.name').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Name is required'),
  body('customer.email').trim().toLowerCase().isEmail().withMessage('Valid email is required'),
  phone('customer.phone'),
  body('customer.acceptsMarketing').optional().isBoolean().toBoolean(),
  body('items').isArray({ min: 1, max: 50 }).withMessage('Cart is empty'),
  body('items.*.product').isMongoId().withMessage('Invalid product id'),
  body('items.*.qty').isInt({ min: 1, max: 500 }).withMessage('Quantity must be 1–500').toInt(),
  ...address('shippingAddress'),
  body('discountCode').optional({ values: 'falsy' }).isString().trim().isLength({ max: 30 }),
  body('paymentMethod').optional().isIn(PAYMENT_METHODS),
  body('notes').optional().isString().isLength({ max: 1000 }),
];

exports.validateDiscount = [
  body('code').isString().trim().notEmpty().isLength({ max: 30 }),
  body('items').isArray({ min: 1, max: 50 }),
  body('items.*.product').isMongoId(),
  body('items.*.qty').isInt({ min: 1, max: 500 }).toInt(),
  body('email').optional().trim().toLowerCase().isEmail(),
];

exports.lead = [
  body('website').optional().isEmpty().withMessage('Spam detected'), // honeypot: real users never fill this hidden field
  body('name').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Name is required'),
  body('email').optional({ values: 'falsy' }).trim().toLowerCase().isEmail(),
  phone('phone'),
  body().custom((b) => Boolean(b.email || b.phone)).withMessage('Email or phone is required'),
  body('company').optional().isString().trim().isLength({ max: 120 }),
  body('city').optional().isString().trim().isLength({ max: 80 }),
  body('message').optional().isString().trim().isLength({ max: 2000 }),
  body('source').optional().isIn(['contact_form', 'quote_request', 'whatsapp', 'instagram', 'referral', 'other']),
  body('projectType').optional().isIn(['residential', 'commercial', 'hospitality', 'office', 'retail', 'other']),
  body('areaSqFt').optional({ values: 'falsy' }).isFloat({ min: 0, max: 10000000 }).toFloat(),
  body('budgetRange').optional().isString().isLength({ max: 60 }),
  body('interestedProducts').optional().isArray({ max: 20 }),
  body('interestedProducts.*').isMongoId(),
  body('utm').optional().isObject(),
];

exports.track = [
  body('sessionId').isString().trim().matches(/^[A-Za-z0-9_-]{8,64}$/),
  body('path').optional().isString().isLength({ max: 300 }),
  body('referrer').optional().isString().isLength({ max: 300 }),
  body('utmSource').optional().isString().isLength({ max: 60 }),
  body('device').optional().isIn(['mobile', 'tablet', 'desktop', 'other']),
];

exports.storeList = [
  ...listQuery,
  query('collection').optional().isString().isLength({ max: 140 }), // slug
  query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('inStock').optional().isIn(['true', 'false']),
  query('featured').optional().isIn(['true', 'false']),
  query('newArrival').optional().isIn(['true', 'false']),
];

exports.orderList = [
  ...listQuery,
  query('orderStatus').optional().isIn(ORDER_STATUS),
  query('paymentStatus').optional().isIn(PAYMENT_STATUS),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
];

/** COD-only customer order placement. Prices and payment method are never accepted from the client. */
exports.placeOrder = [
  body('items').isArray({ min: 1, max: 50 }).withMessage('Cart is empty or contains too many items'),
  body('items.*.product').isMongoId().withMessage('Invalid product id'),
  body('items.*.qty').isInt({ min: 1, max: 100 }).toInt().withMessage('Quantity must be between 1 and 100'),
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
  body('shippingAddress.fullName').isString().trim().isLength({ min: 2, max: 100 }),
  body('shippingAddress.phoneNumber').isString().trim().matches(/^\d{10}$/).withMessage('Phone number must be 10 digits'),
  body('shippingAddress.addressLine1').isString().trim().isLength({ min: 3, max: 200 }),
  body('shippingAddress.addressLine2').optional({ values: 'falsy' }).isString().trim().isLength({ max: 200 }),
  body('shippingAddress.landmark').optional({ values: 'falsy' }).isString().trim().isLength({ max: 120 }),
  body('shippingAddress.city').isString().trim().isLength({ min: 2, max: 80 }),
  body('shippingAddress.state').isString().trim().isLength({ min: 2, max: 80 }),
  body('shippingAddress.pincode').isString().trim().matches(/^\d{6}$/).withMessage('Pincode must be 6 digits'),
  body('shippingAddress.addressType').isIn(['Home', 'Work']).withMessage('Address type must be Home or Work'),
  body('notes').optional().isString().trim().isLength({ max: 500 }),
  body('discountCode').optional({ values: 'falsy' }).isString().trim().isLength({ max: 30 }),
];

exports.cartQuote = [
  body('items').isArray({ min: 1, max: 50 }).withMessage('Cart is empty or contains too many items'),
  body('items.*.product').isMongoId().withMessage('Invalid product id'),
  body('items.*.qty').isInt({ min: 1, max: 100 }).toInt().withMessage('Quantity must be between 1 and 100'),
  body('discountCode').optional({ values: 'falsy' }).isString().trim().isLength({ max: 30 }),
];

exports.customerOrderList = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
];

exports.productSearch = [
  query('q').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Enter at least 2 search characters'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 60 }).toInt(),
];

exports.orderStatus = [
  mongoIdParam(),
  body('orderStatus').isIn(ORDER_STATUS),
  body('note').optional().isString().isLength({ max: 500 }),
  body('tracking').optional().isObject(),
  body('tracking.carrier').optional().isString().isLength({ max: 60 }),
  body('tracking.number').optional().isString().isLength({ max: 60 }),
  body('tracking.url').optional().isURL(),
];

exports.simulatePayment = [body('orderId').isMongoId(), body('outcome').isIn(['success', 'failure', 'refund'])];
