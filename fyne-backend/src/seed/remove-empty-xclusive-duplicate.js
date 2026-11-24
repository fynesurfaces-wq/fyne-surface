'use strict';

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { Collection, Product } = require('../models');

async function run() {
  await connectDB();
  const original = await Collection.findOne({ slug: 'x-clusive-greenwall' }).select('_id name slug').lean();
  const duplicate = await Collection.findOne({ slug: 'xclusive-greenwall' }).select('_id name slug').lean();
  if (!original) throw new Error('Original X’Clusive collection is missing; refusing to remove anything.');
  if (!duplicate) {
    console.log('Duplicate X’clusive collection is already absent.');
    return;
  }
  const remaining = await Product.countDocuments({ collection: duplicate._id });
  const originalCount = await Product.countDocuments({ collection: original._id });
  if (remaining !== 0) throw new Error(`Duplicate still has ${remaining} products; refusing to delete it.`);
  if (originalCount < 57) throw new Error(`Original contains only ${originalCount} products after reassignment; refusing to delete duplicate.`);
  await Collection.deleteOne({ _id: duplicate._id, slug: 'xclusive-greenwall' });
  console.log(`Deleted empty duplicate ${duplicate.name} (${duplicate.slug}); ${originalCount} products remain on ${original.name}.`);
}
run().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.connection.close());
