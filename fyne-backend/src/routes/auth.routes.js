'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const v = require('../validators/auth.validators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { loginLimiter, authLimiter } = require('../middleware/rateLimiters');

router.post('/login', loginLimiter, validate(v.login), ctrl.login);
router.post('/refresh', authLimiter, ctrl.refresh);
router.post('/logout', authLimiter, ctrl.logout);
router.get('/me', protect, ctrl.getMe);
router.patch('/password', authLimiter, protect, validate(v.changePassword), ctrl.changePassword);

module.exports = router;
