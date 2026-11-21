'use strict';

/** Validators for Customers, Discounts, Content, Markets, Leads, Apps, Settings, Channels, Media. */
const { body, query, field, mongoIdParam, optionalImage, seoRules, tagsRules, listQuery } = require('./common');

const upd = (isUpdate) => (isUpdate ? [mongoIdParam()] : []);

exports.customerUpdate = [
  mongoIdParam(),
  body('name').optional().isString().trim().isLength({ min: 2, max: 100 }),
  body('phone').optional().isString().trim().isLength({ max: 20 }),
  body('acceptsMarketing').optional().isBoolean().toBoolean(),
  body('notes').optional().isString().isLength({ max: 2000 }),
  ...tagsRules,
];

const discountRules = (isUpdate) => [
  ...upd(isUpdate),
  field('code', isUpdate).isString().trim().toUpperCase().matches(/^[A-Z0-9_-]{3,30}$/).withMessage('Code: 3–30 chars A-Z 0-9 _ -'),
  field('type', isUpdate).isIn(['percentage', 'fixed_amount', 'free_shipping']),
  body('value').optional().isFloat({ min: 0 }).toFloat()
    .custom((v, { req }) => req.body.type !== 'percentage' || v <= 100).withMessage('Percentage cannot exceed 100'),
  body('description').optional().isString().isLength({ max: 300 }),
  body('minSubtotal').optional().isFloat({ min: 0 }).toFloat(),
  body('maxDiscountAmount').optional({ values: 'null' }).isFloat({ min: 0 }).toFloat(),
  body('startsAt').optional().isISO8601().toDate(),
  body('endsAt').optional({ values: 'null' }).isISO8601().toDate(),
  body('usageLimit').optional({ values: 'null' }).isInt({ min: 1 }).toInt(),
  body('oncePerCustomer').optional().isBoolean().toBoolean(),
  body('appliesTo.scope').optional().isIn(['all', 'collections', 'products']),
  body('appliesTo.collections').optional().isArray(),
  body('appliesTo.collections.*').isMongoId(),
  body('appliesTo.products').optional().isArray(),
  body('appliesTo.products.*').isMongoId(),
  body('isActive').optional().isBoolean().toBoolean(),
];
exports.discountCreate = discountRules(false);
exports.discountUpdate = discountRules(true);

const contentRules = (isUpdate) => [
  ...upd(isUpdate),
  field('type', isUpdate).isIn(['page', 'blog_post']),
  field('title', isUpdate).isString().trim().isLength({ min: 2, max: 150 }),
  body('slug').optional().isString().trim().isLength({ min: 2, max: 160 }),
  body('excerpt').optional().isString().isLength({ max: 500 }),
  body('body').optional().isString().isLength({ max: 100000 }),
  body('status').optional().isIn(['draft', 'published']),
  body('publishedAt').optional({ values: 'null' }).isISO8601().toDate(),
  ...optionalImage('coverImage'),
  ...seoRules,
  ...tagsRules,
];
exports.contentCreate = contentRules(false);
exports.contentUpdate = contentRules(true);
exports.contentList = [...listQuery, query('type').optional().isIn(['page', 'blog_post']), query('status').optional().isIn(['draft', 'published'])];

const marketRules = (isUpdate) => [
  ...upd(isUpdate),
  field('name', isUpdate).isString().trim().isLength({ min: 2, max: 80 }),
  body('countries').optional().isArray({ max: 250 }),
  body('countries.*').isISO31661Alpha2().toUpperCase(),
  body('currency').optional().isISO4217().toUpperCase(),
  body('priceAdjustmentPercent').optional().isFloat({ min: -90, max: 500 }).toFloat(),
  body('subfolder').optional().isString().matches(/^\/[a-z-]{2,10}$/),
  body('isPrimary').optional().isBoolean().toBoolean(),
  body('isActive').optional().isBoolean().toBoolean(),
];
exports.marketCreate = marketRules(false);
exports.marketUpdate = marketRules(true);

exports.leadUpdate = [
  mongoIdParam(),
  body('status').optional().isIn(['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost']),
  body('assignedTo').optional({ values: 'null' }).isMongoId(),
  body('projectType').optional().isIn(['residential', 'commercial', 'hospitality', 'office', 'retail', 'other']),
  body('budgetRange').optional().isString().isLength({ max: 60 }),
  body('company').optional().isString().isLength({ max: 120 }),
];
exports.leadNote = [mongoIdParam(), body('text').isString().trim().isLength({ min: 1, max: 2000 })];
exports.leadList = [...listQuery, query('status').optional().isIn(['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost']), query('source').optional().isString()];

const integrationRules = (isUpdate) => [
  ...upd(isUpdate),
  field('key', isUpdate).isString().trim().toLowerCase().matches(/^[a-z0-9-]{2,40}$/),
  field('name', isUpdate).isString().trim().isLength({ min: 2, max: 80 }),
  body('category').optional().isIn(['payments', 'marketing', 'analytics', 'shipping', 'communication', 'seo', 'other']),
  body('description').optional().isString().isLength({ max: 500 }),
  body('isEnabled').optional().isBoolean().toBoolean(),
  body('config').optional().isObject()
    .custom((cfg) => Object.keys(cfg).every((k) => !/secret|password|token|key_secret/i.test(k)))
    .withMessage('Do not store secrets in app config — use environment variables'),
];
exports.integrationCreate = integrationRules(false);
exports.integrationUpdate = integrationRules(true);

exports.settingsUpdate = [
  body('storeName').optional().isString().trim().isLength({ min: 2, max: 80 }),
  body('tagline').optional().isString().trim().isLength({ max: 120 }),
  ...optionalImage('logo'),
  body('contact').optional().isObject(),
  body('contact.email').optional({ values: 'falsy' }).isEmail(),
  body('gstin').optional({ values: 'falsy' }).matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i).withMessage('Invalid GSTIN'),
  body('tax.pricesIncludeTax').optional().isBoolean().toBoolean(),
  body('tax.rate').optional().isFloat({ min: 0, max: 100 }).toFloat(),
  body('shipping.flatRate').optional().isFloat({ min: 0 }).toFloat(),
  body('shipping.freeShippingThreshold').optional().isFloat({ min: 0 }).toFloat(),
  body('brandColors.*').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Colors must be hex like #2E7D32'),
  body('social.*').optional({ values: 'falsy' }).isURL({ protocols: ['https'] }),
  body('seo.defaultMetaTitle').optional().isLength({ max: 70 }),
  body('seo.defaultMetaDescription').optional().isLength({ max: 170 }),
];

exports.channelUpdate = [
  body('enabled').optional().isBoolean().toBoolean(),
  body('allowAiCrawlers').optional().isBoolean().toBoolean(),
];

exports.mediaUpdate = [mongoIdParam(), body('alt').isString().trim().isLength({ max: 160 })];
exports.search = [query('q').isString().trim().isLength({ min: 1, max: 100 })];
exports.idParam = [mongoIdParam()];
exports.listQuery = listQuery;
