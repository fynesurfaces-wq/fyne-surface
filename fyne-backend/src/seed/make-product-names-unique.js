'use strict';

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { Product } = require('../models');

const normalize = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const alphaLabel = (index) => {
  let value = index + 1;
  let label = '';
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return label;
};

function variantLabels(group) {
  const fields = [
    (product) => {
      const height = product.specifications?.height;
      return height?.value != null ? `${height.value} ${height.unit || 'ft'}` : null;
    },
    (product) => product.specifications?.leaves?.count != null ? `${product.specifications.leaves.count} leaves` : null,
    (product) => product.specifications?.flowers != null ? `${product.specifications.flowers} flowers` : null,
    (product) => product.specifications?.trunkMaterial ? `${product.specifications.trunkMaterial} trunk` : null,
  ];
  for (let depth = 1; depth <= fields.length; depth += 1) {
    const labels = group.map((product) => fields.slice(0, depth).map((field) => field(product)));
    if (labels.every((parts) => parts.every(Boolean)) && new Set(labels.map((parts) => parts.join(', '))).size === group.length) {
      return labels.map((parts) => parts.join(', '));
    }
  }
  return group.map((_, index) => `Variant ${alphaLabel(index)}`);
}

async function run() {
  await connectDB();
  const products = await Product.find().sort({ createdAt: 1, sku: 1 });
  const groups = new Map();
  for (const product of products) {
    const key = normalize(product.name);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) || []), product]);
  }
  const duplicates = [...groups.values()].filter((group) => group.length > 1);
  const duplicateIds = new Set(duplicates.flat().map((product) => String(product._id)));
  const usedNames = new Set(products.filter((product) => !duplicateIds.has(String(product._id))).map((product) => normalize(product.name)).filter(Boolean));
  const changes = [];

  for (const group of duplicates) {
    const labels = variantLabels(group);
    for (const [index, product] of group.entries()) {
      const original = String(product.name).trim().replace(/\s+/g, ' ');
      const suffix = ` - ${labels[index]}`;
      const base = `${original.slice(0, 150 - suffix.length).trimEnd()}${suffix}`;
      let candidate = base;
      let serial = 2;
      while (usedNames.has(normalize(candidate)) || await Product.exists({
        _id: { $ne: product._id },
        name: { $regex: `^${escapeRegex(candidate)}$`, $options: 'i' },
      })) {
        const extra = ` - Variant ${alphaLabel(serial - 2)}`;
        serial += 1;
        candidate = `${base.slice(0, 150 - extra.length).trimEnd()}${extra}`;
      }
      product.name = candidate;
      if (product.seo) product.seo.metaTitle = `${candidate} | FYNE SURFACES`.slice(0, 70);
      await product.save();
      usedNames.add(normalize(candidate));
      changes.push({ sku: product.sku, previousName: original, name: candidate });
    }
  }

  const remaining = await Product.aggregate([
    { $match: { name: { $type: 'string', $ne: '' } } },
    { $group: { _id: { $toLower: { $trim: { input: '$name' } } }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);
  await Product.collection.createIndex(
    { name: 1 },
    { unique: true, sparse: true, collation: { locale: 'en', strength: 2 }, name: 'uniq_product_name_ci' }
  );
  console.log(JSON.stringify({ renamed: changes.length, remainingDuplicateGroups: remaining.length, changes }, null, 2));
  if (remaining.length) throw new Error(`Duplicate product names remain in ${remaining.length} groups.`);
}

run().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.connection.close());
