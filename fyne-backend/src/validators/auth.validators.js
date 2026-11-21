'use strict';

const { body, mongoIdParam } = require('./common');

const email = () => body('email').trim().toLowerCase().isEmail().withMessage('A valid email is required').isLength({ max: 254 });
const strongPassword = (path = 'password') =>
  body(path)
    .isString()
    .isLength({ min: 10, max: 128 })
    .withMessage('Password must be 10–128 characters')
    .isStrongPassword({ minLength: 10, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
    .withMessage('Password needs upper & lower case letters and a number');

exports.login = [email(), body('password').isString().notEmpty().withMessage('Password is required').isLength({ max: 128 })];

exports.changePassword = [body('currentPassword').isString().notEmpty(), strongPassword('newPassword')];

exports.createStaff = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
  email(),
  strongPassword(),
  body('role').isIn(['admin', 'editor']).withMessage('Role must be admin or editor'),
];

exports.updateRole = [mongoIdParam(), body('role').isIn(['admin', 'editor']).withMessage('Role must be admin or editor')];
exports.updateStatus = [mongoIdParam(), body('isActive').isBoolean().toBoolean()];
exports.idOnly = [mongoIdParam()];
