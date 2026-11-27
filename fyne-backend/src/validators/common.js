'use strict';

const { body, param, query } = require('express-validator');

const mongoIdParam = (name = 'id') => param(name).isMongoId().withMessage(`Invalid ${name}`);

/** For create (required) vs update (optional) variants of the same rule set. */
const field = (path, isUpdate) =>
  isUpdate ? body(path).optional() : body(path).exists({ values: 'falsy' }).withMessage(`${path} is required`).bail();

const listQuery = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('q').optional().isString().isLength({ max: 100 }),
  query('sort').optional().isString().isLength({ max: 100 }),
];

const imageRules = (path, onlyIf) => {
  const b = (p) => (onlyIf ? body(p).if(onlyIf) : body(p));
  return [
    b(`${path}.url`).isURL({ protocols: ['https'], require_protocol: true }).withMessage('Image URL must be https'),
    b(`${path}.alt`).optional().isString().isLength({ max: 160 }),
    b(`${path}.publicId`).optional().isString().isLength({ max: 200 }),
    b(`${path}.unoptimized`).optional().isBoolean().toBoolean(),
  ];
};

/** An image object that may be omitted or null; when present, its fields are validated. */
const optionalImage = (path) => [
  body(path).optional({ values: 'null' }).isObject(),
  ...imageRules(path, body(path).exists({ values: 'null' })),
];

const seoRules = [
  body('seo').optional().isObject(),
  body('seo.metaTitle').optional().isString().trim().isLength({ max: 70 }).withMessage('Meta title max 70 chars'),
  body('seo.metaDescription').optional().isString().trim().isLength({ max: 170 }).withMessage('Meta description max 170 chars'),
  body('seo.keywords').optional().isArray({ max: 20 }),
  body('seo.keywords.*').isString().trim().isLength({ min: 1, max: 60 }),
];

const tagsRules = [body('tags').optional().isArray({ max: 30 }), body('tags.*').isString().trim().isLength({ min: 1, max: 40 })];

module.exports = { mongoIdParam, field, listQuery, imageRules, optionalImage, seoRules, tagsRules, body, param, query };
