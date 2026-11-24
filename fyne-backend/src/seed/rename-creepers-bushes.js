'use strict';

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { Product } = require('../models');
const creepers = require('./creepers-catalog.json');
const bushes = require('./bushes-catalog.json');

const entries = [
  ...creepers.map((item) => ({ sku: item.sku })),
  ...bushes.map((item) => ({ sku: item.sku })),
];

async function run() {
  await connectDB();
  const products = await Product.find({ sku: { $in: entries.map((entry) => entry.sku) } });
  const found = new Set(products.map((product) => product.sku));
  const missing = entries.filter((entry) => !found.has(entry.sku));
  if (missing.length) throw new Error(`Products not found: ${missing.map((entry) => entry.sku).join(', ')}`);

  const results = [];
  for (const product of products) {
    product.name = undefined;
    await product.save();
    results.push({ sku: product.sku, nameRemoved: true });
  }
  console.table(results);
}

run()
  .catch((error) => { console.error('[rename creepers and bushes] failed:', error.message); process.exitCode = 1; })
  .finally(() => mongoose.connection.close());
