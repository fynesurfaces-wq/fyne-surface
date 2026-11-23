'use strict';

/** /api/v1/store/* — public storefront API (no auth). */
const router = require('express').Router();
const validate = require('../middleware/validate');
const { publicWriteLimiter, trackingLimiter } = require('../middleware/rateLimiters');
const sv = require('../validators/store.validators');
const { param } = require('express-validator');

const products = require('../controllers/product.controller');
const collections = require('../controllers/collection.controller');
const checkout = require('../controllers/checkout.controller');
const leads = require('../controllers/lead.controller');
const analytics = require('../controllers/analytics.controller');
const settings = require('../controllers/settings.controller');
const content = require('../controllers/storeContent.controller');
const { responseCache } = require('../middleware/responseCache');

const slug = validate([param('slug').isSlug().isLength({ max: 160 })]);
const contentType = param('type').isIn(['pages', 'blog']);

router.get('/settings', settings.publicSettings);

router.use('/products', responseCache('products', 3600));
router.use('/collections', responseCache('collections', 3600));

router.get('/products', validate(sv.storeList), products.storeList);
router.get('/products/:slug', slug, products.storeGet);

router.get('/collections', collections.storeList);
router.get('/collections/:slug', slug, collections.storeGet);

router.get('/content/:type', validate([contentType]), content.list);
router.get('/content/:type/:slug', validate([contentType, param('slug').isSlug()]), content.get);

router.post('/discounts/validate', publicWriteLimiter, validate(sv.validateDiscount), checkout.validateDiscount);
router.post('/checkout', publicWriteLimiter, validate(sv.checkout), checkout.checkout);
router.post('/leads', publicWriteLimiter, validate(sv.lead), leads.createPublic);
router.post('/analytics/track', trackingLimiter, validate(sv.track), analytics.track);

module.exports = router;
