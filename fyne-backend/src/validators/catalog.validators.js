'use strict';

const { body, query, field, mongoIdParam, imageRules, optionalImage, seoRules, tagsRules, listQuery } = require('./common');

const specRules = [
  body('specifications').optional().isObject(),
  body('specifications.height').optional({ values: 'null' }).isObject(),
  body('specifications.height.value').optional({ values: 'null' }).isFloat({ min: 0, max: 100 }).toFloat(),
  body('specifications.height.unit').optional().isIn(['ft', 'm', 'cm', 'in']),
  body('specifications.leaves').optional({ values: 'null' }).isObject(),
  body('specifications.leaves.count').optional({ values: 'null' }).isInt({ min: 0 }).toInt(),
  body('specifications.leaves.material').optional({ values: 'null' }).isString().trim().isLength({ max: 40 }),
  body('specifications.trunkMaterial').optional({ values: 'null' }).isString().trim().isLength({ max: 60 }),
  body('specifications.flowers').optional({ values: 'null' }).isInt({ min: 0 }).toInt(),
  body('specifications.packSize').optional({ values: 'null' }).isInt({ min: 1 }).toInt(),
  body('specifications.potIncluded').optional().isBoolean().toBoolean(),
  body('specifications.uvResistant').optional().isBoolean().toBoolean(),
  body('specifications.fireRetardant').optional().isBoolean().toBoolean(),
  body('specifications.indoorOutdoor').optional().isIn(['indoor', 'outdoor', 'both']),
  body('specifications.additionalNotes').optional().isString().trim().isLength({ max: 2000 }),
  body('specifications.additional').optional().isObject().custom((additional) => {
    const entries = Object.entries(additional);
    if (entries.length > 20) throw new Error('Add no more than 20 custom specifications');
    for (const [name, value] of entries) {
      if (!name.trim() || name.length > 60 || name.startsWith('$') || name.includes('.')) {
        throw new Error('Custom specification names must be 1–60 characters and cannot contain dots or start with $');
      }
      if (typeof value !== 'string' || value.length > 200) {
        throw new Error('Custom specification values must be text up to 200 characters');
      }
    }
    return true;
  }),
];

const productRules = (isUpdate) => [
  ...(isUpdate ? [mongoIdParam()] : []),
  body('name').optional({ values: 'null' }).isString().trim().isLength({ max: 150 }),
  body('slug').optional().isString().trim().isLength({ min: 2, max: 160 }),
  field('sku', isUpdate).isString().trim().matches(/^[A-Za-z0-9-]{3,30}$/).withMessage('SKU: 3–30 letters, numbers or dashes').toUpperCase(),
  field('collection', isUpdate).isMongoId().withMessage('Valid collection id required'),
  field('price', isUpdate).isFloat({ min: 0, max: 100000000 }).withMessage('Price must be a positive number (INR)').toFloat(),
  body('compareAtPrice').optional({ values: 'null' }).isFloat({ min: 0 }).toFloat(),
  body('shortDescription').optional().isString().isLength({ max: 500 }),
  body('description').optional().isString().isLength({ max: 20000 }),
  body('stock').optional().isInt({ min: 0, max: 1000000 }).toInt(),
  body('lowStockThreshold').optional({ values: 'null' }).isInt({ min: 0 }).toInt(),
  body('isActive').optional().isBoolean().toBoolean(),
  body('isFeatured').optional().isBoolean().toBoolean(),
  body('isNewArrival').optional().isBoolean().toBoolean(),
  body('images').optional().isArray({ max: 20 }),
  ...imageRules('images.*'),
  body('faqs').optional().isArray({ max: 20 }),
  body('faqs.*.question').isString().trim().isLength({ min: 3, max: 300 }),
  body('faqs.*.answer').isString().trim().isLength({ min: 1, max: 2000 }),
  ...specRules,
  ...seoRules,
  ...tagsRules,
];

exports.createProduct = productRules(false);
exports.updateProduct = productRules(true);

exports.listProducts = [
  ...listQuery,
  query('collection').optional().isMongoId(),
  query('isActive').optional().isIn(['true', 'false']),
  query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('stockStatus').optional().isIn(['in_stock', 'out_of_stock', 'low_stock']),
  query('tag').optional().isString().isLength({ max: 40 }),
];

exports.inventory = [
  mongoIdParam(),
  body('mode').isIn(['set', 'adjust']).withMessage('mode must be set or adjust'),
  body('quantity').isInt({ min: -1000000, max: 1000000 }).toInt(),
];

exports.bulkProducts = [
  body('ids').isArray({ min: 1, max: 200 }),
  body('ids.*').isMongoId(),
  body('action').isIn(['activate', 'deactivate', 'feature', 'unfeature', 'delete']),
];

const collectionRules = (isUpdate) => [
  ...(isUpdate ? [mongoIdParam()] : []),
  field('name', isUpdate).isString().trim().isLength({ min: 2, max: 120 }),
  body('slug').optional().isString().trim().isLength({ min: 2, max: 140 }),
  body('description').optional().isString().isLength({ max: 10000 }),
  ...optionalImage('coverImage'),
  body('isActive').optional().isBoolean().toBoolean(),
  body('sortOrder').optional().isInt().toInt(),
  ...seoRules,
];

exports.createCollection = collectionRules(false);
exports.updateCollection = collectionRules(true);
exports.idParam = [mongoIdParam()];
