'use strict';

const { body } = require('express-validator');

exports.create = [
  body('website').optional().isEmpty().withMessage('Spam detected'),
  body('name').isString().trim().isLength({ min: 2, max: 100 }),
  body('email').optional({ values: 'falsy' }).isString().trim().toLowerCase().isEmail().isLength({ max: 254 }),
  body('phone').optional({ values: 'falsy' }).isString().trim().matches(/^[0-9+\\-\\s()]{7,20}$/),
  body().custom((value) => Boolean(value.email || value.phone)).withMessage('Provide an email address or phone number'),
  body('subject').optional().isString().trim().isLength({ min: 2, max: 160 }),
  body('message').isString().trim().isLength({ min: 5, max: 3000 }),
];
