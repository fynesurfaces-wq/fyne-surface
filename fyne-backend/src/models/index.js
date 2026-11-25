'use strict';

const User = require('./User');
const Collection = require('./Collection');
const Product = require('./Product');
const Order = require('./Order');
const Customer = require('./Customer');
const Discount = require('./Discount');
const Content = require('./Content');
const SiteContent = require('./SiteContent');
const Market = require('./Market');
const Lead = require('./Lead');
const ContactMessage = require('./ContactMessage');
const Integration = require('./Integration');
const Setting = require('./Setting');
const { Counter, Visit, Media } = require('./misc');

module.exports = {
  User, Collection, Product, Order, Customer, Discount, Content, SiteContent, Market, Lead, ContactMessage, Integration, Setting, Counter, Visit, Media,
};
