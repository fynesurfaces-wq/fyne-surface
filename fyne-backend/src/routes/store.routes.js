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
const { requireCustomer } = require('../middleware/customerAuth');
const { checkoutLimiter } = require('../middleware/rateLimiters');
const siteContent = require('../controllers/siteContent.controller');
const locations = require('../controllers/location.controller');

const slug = validate([param('slug').isSlug().isLength({ max: 160 })]);
const contentType = param('type').isIn(['pages', 'blog']);

router.get('/settings', settings.publicSettings);
router.get('/site-content/legacy', siteContent.publicLegacy);
router.get('/locations', locations.list);
router.get('/locations/:city', validate([param('city').matches(/^[a-z0-9-]{2,80}$/)]), locations.get);

router.use('/products', responseCache('products', 3600));
router.use('/collections', responseCache('collections', 3600));

router.get('/products', validate(sv.storeList), products.storeList);
router.get('/products/:slug', slug, products.storeGet);

router.get('/collections', collections.storeList);
router.get('/collections/:slug', slug, collections.storeGet);

router.get('/content/:type', validate([contentType]), content.list);
router.get('/content/:type/:slug', validate([contentType, param('slug').isSlug()]), content.get);

router.post('/discounts/validate', publicWriteLimiter, validate(sv.validateDiscount), checkout.validateDiscount);
// Legacy URL remains available, but now uses the same COD-only transactional path as /orders.
router.post('/checkout', checkoutLimiter, requireCustomer, (req, _res, next) => {
  const address = req.body.shippingAddress || {};
  const phone = String(address.phoneNumber || address.phone || req.customer.phone || '').replace(/\D/g, '').slice(-10);
  req.body.shippingAddress = {
    ...address,
    fullName: address.fullName || req.customer.name,
    phoneNumber: address.phoneNumber || phone,
    addressLine1: address.addressLine1 || address.line1,
    addressLine2: address.addressLine2 || address.line2,
    pincode: address.pincode || address.postalCode,
    addressType: address.addressType || 'Home',
  };
  next();
}, validate(sv.placeOrder), checkout.placeOrder);
router.post('/leads', publicWriteLimiter, validate(sv.lead), leads.createPublic);
router.post('/analytics/track', trackingLimiter, validate(sv.track), analytics.track);

module.exports = router;
