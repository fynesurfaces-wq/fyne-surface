'use strict';
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { Product } = require('../models');
async function run() {
  await connectDB();
  const groups = await Product.aggregate([
    { $match: { name: { $type: 'string', $ne: '' } } },
    { $group: { _id: { $toLower: { $trim: { input: '$name' } } }, count: { $sum: 1 }, products: { $push: { sku: '$sku', name: '$name', id: '$_id' } } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1, _id: 1 } },
  ]);
  console.log(JSON.stringify({ duplicateGroups: groups.length, duplicates: groups }, null, 2));
}
run().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.connection.close());
