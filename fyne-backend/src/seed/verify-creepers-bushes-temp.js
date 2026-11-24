'use strict';
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { Product } = require('../models');
const skus = [
  ...require('./creepers-catalog.json').map((item) => item.sku),
  ...require('./bushes-catalog.json').map((item) => item.sku),
];
(async () => {
  await connectDB();
  const products = await Product.find({ sku: { $in: skus } }).select('sku name').lean();
  const missingNames = products.filter((product) => !product.name?.trim()).map((product) => product.sku);
  const namesWithSku = products.filter((product) => product.name?.toLowerCase().includes(product.sku.toLowerCase())).map((product) => product.sku);
  const duplicateGroups = await Product.aggregate([
    { $match: { name: { $type: 'string', $ne: '' } } },
    { $group: { _id: { $toLower: { $trim: { input: '$name' } } }, skus: { $push: '$sku' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);
  console.log(JSON.stringify({ expected: skus.length, found: products.length, missingNames, namesWithSku, duplicateNameGroups: duplicateGroups }, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => mongoose.connection.close());
