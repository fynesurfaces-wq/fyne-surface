'use strict';

const router = require('express').Router();
const validate = require('../middleware/validate');
const { searchLimiter } = require('../middleware/rateLimiters');
const sv = require('../validators/store.validators');
const controller = require('../controllers/productSearch.controller');

router.get('/search', searchLimiter, validate(sv.productSearch), controller.search);
module.exports = router;
