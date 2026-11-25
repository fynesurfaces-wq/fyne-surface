'use strict';

/** Customer order creation. Admin order management stays under /admin/orders. */
const router = require('express').Router();
const validate = require('../middleware/validate');
const { checkoutLimiter } = require('../middleware/rateLimiters');
const { protectCustomer } = require('../middleware/customerAuth');
const { isOwner } = require('../middleware/isOwner');
const { Order } = require('../models');
const sv = require('../validators/store.validators');
const controller = require('../controllers/checkout.controller');
const customerOrders = require('../controllers/customerOrder.controller');
const av = require('../validators/admin.validators');

router.post('/quote', checkoutLimiter, protectCustomer, validate(sv.cartQuote), controller.quote);
router.post('/', checkoutLimiter, protectCustomer, validate(sv.placeOrder), controller.placeOrder);
router.get('/my-orders', protectCustomer, validate(sv.customerOrderList), customerOrders.listMine);
router.get('/:id', protectCustomer, validate(av.idParam), isOwner({ Model: Order, ownerField: 'user', assignTo: 'ownedOrder' }), customerOrders.getMine);

module.exports = router;
