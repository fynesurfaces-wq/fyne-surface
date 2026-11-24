'use strict';

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { Product } = require('../models');

const namesBySku = {
  FYN112E: 'Palm Tree - 6 ft',
  FYN119E: 'Palm Tree - 4.3 ft',
  FYN113E: 'Palm Tree - 2 ft',
  FYN111E: 'Palm Tree - 3.2 ft',
  FYN121E: 'Palm Tree - 5.3 ft',
  FYN130E: 'Dracaena - 3.6 ft',
  FYN124E: 'Dracaena - 1.4 ft',
  FYN108E: 'Dracaena - 4 ft',
  FYN101E: 'Palm - 4 ft, 19 leaves',
  FYN120E: 'Palm - 4 ft, 8 leaves',
  FYN122E: 'Palm - 3.4 ft, 12 leaves',
  FYN110E: 'Codiaeum - 1.5 ft',
  FYN125E: 'Codiaeum - 3 ft',
  FYN105E: 'Rubber Plant - 5 ft',
  FYN114E: 'Rubber Plant - 3 ft',
  FYN128E: 'Birds of Paradise - 1.9 ft',
  FYN106E: 'Birds of Paradise - 5.3 ft',
  FYN118E: 'Birds of Paradise - 4.6 ft',
  FYN201E: 'Feathery Lime Real Touch Plant',
  FYN202E: 'Pink-Edged Variegated Real Touch Plant',
  FYN203E: 'White-Veined Arrowhead Real Touch Plant',
  FYN204E: 'White-Variegated Real Touch Plant',
  FYN205E: 'Burgundy Real Touch Plant',
  FYN206E: 'Green Variegated Real Touch Plant',
  FYN207E: 'Dark Green Real Touch Plant',
  FYN208E: 'Lime Green Real Touch Plant',
  FYN209E: 'Striped Green Real Touch Plant',
};

async function run() {
  await connectDB();
  const products = await Product.find({ sku: { $in: Object.keys(namesBySku) } });
  const found = new Set(products.map((product) => product.sku));
  const missing = Object.keys(namesBySku).filter((sku) => !found.has(sku));
  if (missing.length) throw new Error(`Missing products: ${missing.join(', ')}`);
  if (new Set(Object.values(namesBySku).map((name) => name.toLocaleLowerCase())).size !== Object.keys(namesBySku).length) {
    throw new Error('The requested replacement names are not unique.');
  }

  const changes = [];
  for (const product of products) {
    const nextName = namesBySku[product.sku];
    const collision = await Product.exists({
      _id: { $ne: product._id },
      name: { $regex: `^${nextName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });
    if (collision) throw new Error(`Replacement name already exists: ${nextName}`);
    const previousName = product.name;
    product.name = nextName;
    if (product.seo) product.seo.metaTitle = `${nextName} | FYNE SURFACES`.slice(0, 70);
    await product.save();
    changes.push({ previousName, name: nextName });
  }
  console.log(JSON.stringify({ renamed: changes.length, names: changes.map(({ name }) => name) }, null, 2));
}
run().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.connection.close());
