'use strict';

const router = require('express').Router();
const seo = require('../controllers/seo.controller');

router.use('/auth/customer', require('./customerAuth.routes'));
router.use('/orders', require('./customerOrder.routes'));
router.use('/products', require('./productSearch.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/store', require('./store.routes'));
router.use('/contact', require('./contact.routes'));

// SEO / GEO (also exposed at the domain root in app.js)
router.get('/seo/sitemap.xml', seo.sitemap);
router.get('/seo/robots.txt', seo.robots);
router.get('/seo/llms.txt', seo.llmsTxt);
router.get('/feeds/products.json', seo.productFeed);

module.exports = router;
