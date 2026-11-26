'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/customerAuth.controller');
const validate = require('../middleware/validate');
const { authLimiter, loginLimiter } = require('../middleware/rateLimiters');
const { requireCustomer, optionalCustomer } = require('../middleware/customerAuth');
const v = require('../validators/customer.validators');

router.post('/register', authLimiter, validate(v.register), ctrl.register);
router.post('/verify-email', authLimiter, validate(v.verifyEmail), ctrl.verifyEmail);
router.post('/login', loginLimiter, validate(v.login), ctrl.login);
router.post('/refresh', authLimiter, ctrl.refresh);
router.post('/forgot-password', authLimiter, validate(v.forgotPassword), ctrl.forgotPassword);
router.post('/reset-password', authLimiter, validate(v.resetPassword), ctrl.resetPassword);
router.post('/change-password', authLimiter, requireCustomer, validate(v.changePassword), ctrl.changePassword);
router.post('/logout', authLimiter, ctrl.logout);
router.get('/profile', optionalCustomer, ctrl.profile);
router.patch('/profile', requireCustomer, validate(v.updateProfile), ctrl.updateProfile);
router.get('/orders', requireCustomer, ctrl.orders);

module.exports = router;
