'use strict';

const { Discount, Order } = require('../models');
const ApiError = require('../utils/ApiError');
const { round2 } = require('../utils/helpers');

/**
 * Validate a discount code against a cart and compute the amount.
 * @param {string} code
 * @param {{ items: Array<{product, collection, lineTotal}>, subtotal:number, customerId?:string }} cart
 * @returns {Promise<{ discount, amount:number, freeShipping:boolean }>}
 */
async function evaluateDiscount(code, { items, subtotal, customerId }) {
  const now = new Date();
  const discount = await Discount.findOne({ code: String(code).trim().toUpperCase(), isActive: true });
  const invalid = (msg) => new ApiError(422, msg, 'DISCOUNT_INVALID');

  if (!discount) throw invalid('This discount code is not valid');
  if (discount.startsAt && discount.startsAt > now) throw invalid('This discount is not active yet');
  if (discount.endsAt && discount.endsAt < now) throw invalid('This discount has expired');
  if (discount.usageLimit && discount.usedCount >= discount.usageLimit) throw invalid('This discount has reached its usage limit');
  if (subtotal < (discount.minSubtotal || 0)) throw invalid(`Minimum order of ₹${discount.minSubtotal} required for this code`);

  if (discount.oncePerCustomer && customerId) {
    const used = await Order.exists({ user: customerId, 'discount.code': discount.code, paymentStatus: { $in: ['Paid', 'Pending'] } });
    if (used) throw invalid('You have already used this discount');
  }

  const { scope, collections = [], products = [] } = discount.appliesTo || {};
  const collSet = new Set(collections.map(String));
  const prodSet = new Set(products.map(String));
  const eligible = items
    .filter((i) => scope === 'all' || !scope || (scope === 'collections' && collSet.has(String(i.collection))) || (scope === 'products' && prodSet.has(String(i.product))))
    .reduce((s, i) => s + i.lineTotal, 0);

  if (!eligible && discount.type !== 'free_shipping') throw invalid('This discount does not apply to the items in your cart');

  let amount = 0;
  if (discount.type === 'percentage') {
    amount = (eligible * discount.value) / 100;
    if (discount.maxDiscountAmount) amount = Math.min(amount, discount.maxDiscountAmount);
  } else if (discount.type === 'fixed_amount') {
    amount = Math.min(discount.value, eligible);
  }

  return { discount, amount: round2(amount), freeShipping: discount.type === 'free_shipping' };
}

module.exports = { evaluateDiscount };
