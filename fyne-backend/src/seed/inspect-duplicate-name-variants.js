'use strict';
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { Product } = require('../models');
async function run() {
  await connectDB();
  const products = await Product.find({ sku: { $in: [
    'FYN112E','FYN119E','FYN113E','FYN111E','FYN121E','FYN130E','FYN124E','FYN108E',
    'FYN101E','FYN120E','FYN122E','FYN110E','FYN125E','FYN105E','FYN114E',
    'FYN128E','FYN106E','FYN118E','FYN201E','FYN202E','FYN203E','FYN204E','FYN205E','FYN206E','FYN207E','FYN208E','FYN209E',
  ] } }).select('sku name specifications images alt tags collection').sort({ sku: 1 }).lean();
  console.log(JSON.stringify(products.map((p) => ({ sku: p.sku, name: p.name, specifications: p.specifications, image: p.images?.[0]?.alt, tags: p.tags })), null, 2));
}
run().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.connection.close());
