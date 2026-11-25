'use strict';

const { body } = require('express-validator');

const email = body('email').isString().trim().normalizeEmail().isEmail({ allow_ip_domain: false, require_tld: true }).isLength({ max: 254 }).withMessage('Enter a valid email address.');
const password = body('password').isString().isLength({ min: 10, max: 128 }).withMessage('Password must be 10–128 characters.').isStrongPassword({ minLength: 10, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 }).withMessage('Use upper and lower case letters and at least one number.');

exports.register = [body('name').isString().trim().isLength({ min: 2, max: 100 }), email, password, body('phone').optional().isString().trim().isLength({ max: 20 }), body('redirect').optional().isString().isLength({ max: 300 })];
exports.login = [email, body('password').isString().isLength({ min: 1, max: 128 })];
exports.verifyEmail = [body('token').isString().isLength({ min: 32, max: 128 })];
exports.forgotPassword = [email];
exports.resetPassword = [body('token').isString().isLength({ min: 32, max: 128 }), password];
exports.changePassword = [body('currentPassword').isString().isLength({ min: 1, max: 128 }), body('password').isString().isLength({ min: 10, max: 128 }).isStrongPassword({ minLength: 10, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 }).withMessage('Use upper and lower case letters and at least one number.')];
exports.updateProfile = [
  body('name').optional().isString().trim().isLength({ min: 2, max: 100 }),
  body('phone').optional().isString().trim().isLength({ max: 20 }),
  body('address').optional().isObject(),
  body('address.fullName').if((_value, { req }) => req.body.address !== undefined).isString().trim().isLength({ min: 2, max: 100 }),
  body('address.phone').if((_value, { req }) => req.body.address !== undefined).isString().trim().matches(/^[0-9+\-\s()]{7,20}$/),
  body('address.line1').if((_value, { req }) => req.body.address !== undefined).isString().trim().isLength({ min: 3, max: 200 }),
  body('address.line2').optional().isString().trim().isLength({ max: 200 }),
  body('address.city').if((_value, { req }) => req.body.address !== undefined).isString().trim().isLength({ min: 2, max: 80 }),
  body('address.state').if((_value, { req }) => req.body.address !== undefined).isString().trim().isLength({ min: 2, max: 80 }),
  body('address.postalCode').if((_value, { req }) => req.body.address !== undefined).isString().trim().matches(/^[A-Za-z0-9 -]{3,12}$/),
  body('address.country').optional().isISO31661Alpha2().toUpperCase(),
];
