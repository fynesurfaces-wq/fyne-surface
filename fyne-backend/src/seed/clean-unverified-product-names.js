'use strict';

/** Remove collection/style placeholders from catalog products with no verified botanical name. */
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { Product } = require('../models');

const catalogs = [
  require('./bushes-catalog.json'),
  require('./creepers-catalog.json'),
  require('./economy-greenwall-catalog.json'),
  require('./exclusive-greenwall-catalog.json'),
  require('./premium-greenwall-catalog.json'),
];
const unnamedPlantSkus = Array.from({ length: 9 }, (_, index) => `FYN${201 + index}E`);
const skus = [...new Set([...catalogs.flatMap((catalog) => catalog.map((item) => item.sku)), ...unnamedPlantSkus])];

async function run() {
  await connectDB();
  const products = await Product.find({ sku: { $in: skus } }).select('sku name').lean();
  const named = products.filter((product) => product.name?.trim());
  console.log(`[product name cleanup] catalog SKUs: ${skus.length}; matched: ${products.length}; names to remove: ${named.length}`);
  if (!process.argv.includes('--apply')) {
    console.table(named.map(({ sku, name }) => ({ sku, previousName: name })));
    console.log('[product name cleanup] dry run only. Add --apply to remove these names.');
    return;
  }
  const result = await Product.updateMany({ sku: { $in: named.map((product) => product.sku) } }, { $unset: { name: '' } });
  console.log(`[product name cleanup] removed names from ${result.modifiedCount} products.`);
}

run()
  .catch((error) => { console.error('[product name cleanup] failed:', error.message); process.exitCode = 1; })
  .finally(() => mongoose.connection.close());
