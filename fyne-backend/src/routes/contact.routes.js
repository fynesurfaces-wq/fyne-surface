'use strict';

const router = require('express').Router();
const validate = require('../middleware/validate');
const { contactLimiter } = require('../middleware/rateLimiters');
const controller = require('../controllers/contact.controller');
const { body } = require('express-validator');

const contactInput = [
  body('website').optional().isEmpty().withMessage('Spam detected'),
  body('name').isString().trim().isLength({ min: 2, max: 100 }),
  body('email').optional({ values: 'falsy' }).isEmail().normalizeEmail().isLength({ max: 254 }),
  body('phone').optional({ values: 'falsy' }).isString().trim().matches(/^[0-9+\-\s()]{7,20}$/),
  body().custom((value) => Boolean(value.email || value.phone)).withMessage('Provide an email address or phone number'),
  body('subject').optional().isString().trim().isLength({ max: 160 }),
  body('message').isString().trim().isLength({ min: 10, max: 4000 }),
];

router.post('/', contactLimiter, validate(contactInput), controller.create);
module.exports = router;
