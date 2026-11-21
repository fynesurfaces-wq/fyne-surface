'use strict';

/**
 * /api/v1/admin/* — everything behind the admin login.
 * Every route: protect (valid access token) → authorize(permission) → validate → controller.
 */
const router = require('express').Router();
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { imageUpload } = require('../middleware/upload');
const { P } = require('../config/permissions');

const cv = require('../validators/catalog.validators');
const av = require('../validators/admin.validators');
const authV = require('../validators/auth.validators');
const sv = require('../validators/store.validators');

const users = require('../controllers/user.controller');
const products = require('../controllers/product.controller');
const collections = require('../controllers/collection.controller');
const orders = require('../controllers/order.controller');
const customers = require('../controllers/customer.controller');
const leads = require('../controllers/lead.controller');
const media = require('../controllers/media.controller');
const settings = require('../controllers/settings.controller');
const analytics = require('../controllers/analytics.controller');
const growth = require('../controllers/growth.controller');
const nav = require('../controllers/navigation.controller');
const { discounts, content, markets, integrations } = require('../controllers/resources.controller');

const can = authorize;
const id = validate(av.idParam);
const list = validate(av.listQuery);

router.use(protect);

// ── Shell: sidebar + global search ─────────────────────────
router.get('/navigation', nav.getNavigation);
router.get('/search', validate(av.search), nav.globalSearch);

// ── Home / Analytics ───────────────────────────────────────
router.get('/analytics/dashboard', can(P.DASHBOARD_VIEW), analytics.dashboard);
router.get('/analytics/live', can(P.ANALYTICS_VIEW), analytics.live);
router.get('/analytics/reports/sales-by-collection', can(P.ANALYTICS_VIEW), analytics.salesByCollection);

// ── Staff (superadmin) ─────────────────────────────────────
router.get('/users/roles', can(P.USERS_MANAGE), users.getRoles);
router.route('/users')
  .get(can(P.USERS_MANAGE), list, users.getUsers)
  .post(can(P.USERS_MANAGE), validate(authV.createStaff), users.createUser);
router.route('/users/:id')
  .get(can(P.USERS_MANAGE), validate(authV.idOnly), users.getUser)
  .delete(can(P.USERS_MANAGE), validate(authV.idOnly), users.deleteUser);
router.patch('/users/:id/role', can(P.USERS_MANAGE), validate(authV.updateRole), users.updateUserRole);
router.patch('/users/:id/status', can(P.USERS_MANAGE), validate(authV.updateStatus), users.updateUserStatus);

// ── Products ───────────────────────────────────────────────
router.patch('/products/bulk', can(P.PRODUCTS_UPDATE), validate(cv.bulkProducts), products.bulk);
router.route('/products')
  .get(can(P.PRODUCTS_READ), validate(cv.listProducts), products.adminList)
  .post(can(P.PRODUCTS_CREATE), validate(cv.createProduct), products.create);
router.route('/products/:id')
  .get(can(P.PRODUCTS_READ), validate(cv.idParam), products.adminGet)
  .patch(can(P.PRODUCTS_UPDATE), validate(cv.updateProduct), products.update)
  .delete(can(P.PRODUCTS_DELETE), validate(cv.idParam), products.remove);
router.patch('/products/:id/inventory', can(P.PRODUCTS_UPDATE), validate(cv.inventory), products.updateInventory);

// ── Collections ────────────────────────────────────────────
router.route('/collections')
  .get(can(P.COLLECTIONS_READ), list, collections.adminList)
  .post(can(P.COLLECTIONS_CREATE), validate(cv.createCollection), collections.create);
router.route('/collections/:id')
  .get(can(P.COLLECTIONS_READ), id, collections.adminGet)
  .patch(can(P.COLLECTIONS_UPDATE), validate(cv.updateCollection), collections.update)
  .delete(can(P.COLLECTIONS_DELETE), id, collections.remove);

// ── Orders ─────────────────────────────────────────────────
router.get('/orders', can(P.ORDERS_READ), validate(sv.orderList), orders.list);
router.get('/orders/:id', can(P.ORDERS_READ), id, orders.get);
router.patch('/orders/:id/status', can(P.ORDERS_UPDATE), validate(sv.orderStatus), orders.updateStatus);

// ── Customers ──────────────────────────────────────────────
router.get('/customers', can(P.CUSTOMERS_READ), list, customers.list);
router.get('/customers/segments', can(P.CUSTOMERS_READ), customers.segments);
router.get('/customers/:id', can(P.CUSTOMERS_READ), id, customers.get);
router.patch('/customers/:id', can(P.CUSTOMERS_WRITE), validate(av.customerUpdate), customers.update);

// ── Growth ─────────────────────────────────────────────────
router.get('/growth/overview', can(P.GROWTH_VIEW), growth.overview);
router.get('/growth/abandoned-checkouts', can(P.GROWTH_VIEW), list, growth.abandonedCheckouts);

// ── Discounts ──────────────────────────────────────────────
router.route('/discounts')
  .get(can(P.DISCOUNTS_READ), list, discounts.list)
  .post(can(P.DISCOUNTS_WRITE), validate(av.discountCreate), discounts.create);
router.route('/discounts/:id')
  .get(can(P.DISCOUNTS_READ), id, discounts.getOne)
  .patch(can(P.DISCOUNTS_WRITE), validate(av.discountUpdate), discounts.update)
  .delete(can(P.DISCOUNTS_WRITE), id, discounts.remove);

// ── Content (pages, blog) ──────────────────────────────────
router.route('/content')
  .get(can(P.CONTENT_READ), validate(av.contentList), content.list)
  .post(can(P.CONTENT_WRITE), validate(av.contentCreate), (req, _res, next) => { req.body.author = req.user._id; next(); }, content.create);
router.route('/content/:id')
  .get(can(P.CONTENT_READ), id, content.getOne)
  .patch(can(P.CONTENT_WRITE), validate(av.contentUpdate), content.update)
  .delete(can(P.CONTENT_WRITE), id, content.remove);

// ── Files (media library) ──────────────────────────────────
router.route('/media')
  .get(can(P.MEDIA_UPLOAD), list, media.list)
  .post(can(P.MEDIA_UPLOAD), imageUpload.array('files', 10), media.upload);
router.patch('/media/:id', can(P.MEDIA_UPLOAD), validate(av.mediaUpdate), media.updateAlt);
router.delete('/media/:id', can(P.MEDIA_DELETE), id, media.remove);

// ── Markets ────────────────────────────────────────────────
router.route('/markets')
  .get(can(P.MARKETS_READ), list, markets.list)
  .post(can(P.MARKETS_WRITE), validate(av.marketCreate), markets.create);
router.route('/markets/:id')
  .get(can(P.MARKETS_READ), id, markets.getOne)
  .patch(can(P.MARKETS_WRITE), validate(av.marketUpdate), markets.update)
  .delete(can(P.MARKETS_WRITE), id, markets.remove);

// ── Leads ──────────────────────────────────────────────────
router.get('/leads', can(P.LEADS_READ), validate(av.leadList), leads.list);
router.route('/leads/:id')
  .get(can(P.LEADS_READ), id, leads.get)
  .patch(can(P.LEADS_WRITE), validate(av.leadUpdate), leads.update)
  .delete(can(P.LEADS_WRITE), id, leads.remove);
router.post('/leads/:id/notes', can(P.LEADS_WRITE), validate(av.leadNote), leads.addNote);

// ── Sales channels (Agentic, Online Store) ─────────────────
router.get('/channels', can(P.CHANNELS_READ), settings.listChannels);
router.patch('/channels/:key', can(P.CHANNELS_WRITE), validate(av.channelUpdate), settings.updateChannel);

// ── Apps ───────────────────────────────────────────────────
router.route('/apps')
  .get(can(P.APPS_MANAGE), list, integrations.list)
  .post(can(P.APPS_MANAGE), validate(av.integrationCreate), integrations.create);
router.route('/apps/:id')
  .get(can(P.APPS_MANAGE), id, integrations.getOne)
  .patch(can(P.APPS_MANAGE), validate(av.integrationUpdate), integrations.update)
  .delete(can(P.APPS_MANAGE), id, integrations.remove);

// ── Settings ───────────────────────────────────────────────
router.route('/settings')
  .get(can(P.SETTINGS_READ), settings.get)
  .patch(can(P.SETTINGS_WRITE), validate(av.settingsUpdate), settings.update);

module.exports = router;
