'use strict';

/**
 * Seed the catalog from the FYNE SURFACES price lists.
 *
 *   npm run seed            → idempotent upsert (safe to run repeatedly)
 *   npm run seed:destroy    → wipe catalog/orders/customers (keeps staff users)
 *
 * Images are left empty on purpose — upload real photos through
 * POST /api/v1/admin/media and attach them in the admin.
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const { connectDB } = require('../config/db');
const { User, Collection, Product, Setting, Market, Integration, Order, Customer, Counter } = require('../models');
const { ROLES } = require('../config/permissions');

const COLLECTIONS = [
  {
    name: '1.2mtr & Above',
    slug: '1-2mtr-and-above',
    sortOrder: 1,
    description: '<p>Statement artificial trees and tall plants 1.2 metres and above — designed for lobbies, atriums, hotels and large living spaces.</p>',
    seo: { metaTitle: 'Tall Artificial Trees 1.2m & Above | FYNE SURFACES', metaDescription: 'Premium tall artificial trees and plants above 1.2 metres — realistic foliage, wooden & plastic trunks. Shop FYNE SURFACES.', keywords: ['tall artificial trees', 'artificial palm tree', 'large artificial plants india'] },
  },
  {
    name: '1.2mtr & Below',
    slug: '1-2mtr-and-below',
    sortOrder: 2,
    description: '<p>Compact artificial plants and flowering arrangements under 1.2 metres — ideal for tabletops, reception desks, corners and balconies.</p>',
    seo: { metaTitle: 'Artificial Plants Under 1.2m | FYNE SURFACES', metaDescription: 'Lifelike compact artificial plants and orchids under 1.2 metres for homes and offices. Maintenance-free greenery by FYNE SURFACES.', keywords: ['small artificial plants', 'artificial orchid', 'indoor artificial plants'] },
  },
  {
    name: 'Bushes',
    slug: 'bushes',
    sortOrder: 3,
    description: '<p>Artificial bush packs for building vertical gardens, green walls, planters and landscaping borders.</p>',
    seo: { metaTitle: 'Artificial Bushes for Vertical Gardens | FYNE SURFACES', metaDescription: 'Artificial bush packs (6 pcs) for vertical gardens, green walls and planters. Premium vertical-garden greenery from FYNE SURFACES.', keywords: ['artificial bushes', 'vertical garden plants', 'green wall bushes'] },
  },
];

// Exactly as provided in the price lists.
const PRODUCTS = [
  {
    collection: '1-2mtr-and-above', name: 'Rhododendron', sku: 'FYN104E', price: 125000, slug: 'rhododendron-fyn104e',
    specifications: { height: { value: 5.5, unit: 'ft' }, leaves: { count: 1130 }, trunkMaterial: 'Wooden', indoorOutdoor: 'indoor' },
    stock: 5, tags: ['tree', 'flowering', 'tall'],
  },
  {
    collection: '1-2mtr-and-above', name: 'Palm Tree - 6 ft', sku: 'FYN112E', price: 169500, slug: 'palm-tree-fyn112e',
    specifications: { height: { value: 6, unit: 'ft' }, leaves: { count: 21, material: 'PE' }, trunkMaterial: 'Plastic', indoorOutdoor: 'indoor' },
    stock: 5, tags: ['tree', 'palm', 'tall', 'tropical'],
  },
  {
    collection: '1-2mtr-and-below', name: 'Leopard Lily', sku: 'FYN126E', price: 13500, slug: 'leopard-lily-fyn126e',
    specifications: { height: { value: 1.5, unit: 'ft' }, leaves: { count: 12, material: 'PE' }, trunkMaterial: 'Plastic', indoorOutdoor: 'indoor' },
    stock: 15, tags: ['tabletop', 'foliage'],
  },
  {
    collection: '1-2mtr-and-below', name: 'Orchid White', sku: 'FYN139E', price: 125000, slug: 'orchid-white-fyn139e',
    specifications: { height: { value: 2.25, unit: 'ft' }, leaves: { count: 10, material: 'PE' }, flowers: 49, indoorOutdoor: 'indoor' },
    stock: 5, tags: ['orchid', 'flowering', 'white', 'tabletop'],
  },
  {
    collection: 'bushes', name: 'Bush Pack - Design A', sku: 'FS-3026', price: 1550, slug: 'bush-pack-fs-3026',
    specifications: { packSize: 6 },
    stock: 50, tags: ['bush', 'vertical garden', 'green wall'],
  },
  {
    collection: 'bushes', name: 'Bush Pack - Design B', sku: 'FS-3024', price: 1550, slug: 'bush-pack-fs-3024',
    specifications: { packSize: 6 },
    stock: 50, tags: ['bush', 'vertical garden', 'green wall'],
  },
];

function enrich(p, collectionName) {
  const s = p.specifications;
  const productName = p.name;
  const facts = [
    s.height && `${s.height.value} ${s.height.unit} tall`,
    s.leaves?.count != null && `${s.leaves.count.toLocaleString('en-IN')} ${s.leaves.material ? `${s.leaves.material} ` : ''}leaves`,
    s.flowers != null && `${s.flowers} flowers`,
    s.trunkMaterial && `${s.trunkMaterial.toLowerCase()} trunk`,
    s.packSize && `pack of ${s.packSize} pieces`,
  ].filter(Boolean);
  const short = `${productName} — premium artificial ${s.packSize ? 'bush pack' : 'plant'}: ${facts.join(', ')}.`;
  return {
    ...p,
    name: productName,
    shortDescription: short,
    description: `<p>${short}</p><p>Part of the ${collectionName} collection by FYNE SURFACES. Maintenance-free, no watering, sunlight or pruning required — stays green all year.</p>`,
    seo: {
      metaTitle: `${productName} | Artificial ${s.packSize ? 'Bushes' : 'Plants'} | FYNE`.slice(0, 70),
      metaDescription: `${short} Buy online from FYNE SURFACES.`.slice(0, 170),
      keywords: [p.name.toLowerCase(), `artificial ${p.name.toLowerCase()}`, p.sku.toLowerCase()],
    },
    faqs: [
      { question: `What is the size of the ${productName}?`, answer: facts.length ? `It is ${facts.join(', ')}.` : 'Please contact us for exact dimensions.' },
      { question: `Does the ${productName} need any maintenance?`, answer: 'No. It is an artificial plant — no watering, sunlight or pruning. Dust occasionally with a soft cloth.' },
    ],
    isActive: true,
  };
}

async function seed() {
  await connectDB();

  if (process.argv.includes('--destroy')) {
    await Promise.all([Product.deleteMany({}), Collection.deleteMany({}), Order.deleteMany({}), Customer.deleteMany({}), Counter.deleteMany({})]);
    console.log('🗑  Catalog, orders, customers and counters removed (staff users kept).');
    return;
  }

  // 1. Superadmin
  if (env.seed.email && env.seed.password) {
    const exists = await User.findOne({ email: env.seed.email.toLowerCase() });
    if (!exists) {
      await User.create({ name: env.seed.name, email: env.seed.email, password: env.seed.password, role: ROLES.SUPERADMIN });
      console.log(`👤 Superadmin created: ${env.seed.email}`);
    } else {
      console.log(`👤 Superadmin already exists: ${env.seed.email}`);
    }
  } else {
    console.warn('⚠  SEED_SUPERADMIN_EMAIL / SEED_SUPERADMIN_PASSWORD not set — skipping superadmin.');
  }

  // 2. Store settings, market, apps
  await Setting.getStore();
  await Market.updateOne({ name: 'India' }, { $setOnInsert: { name: 'India', countries: ['IN'], currency: 'INR', isPrimary: true, isActive: true } }, { upsert: true });
  const apps = [
    { key: 'razorpay', name: 'Razorpay', category: 'payments', description: 'UPI, cards, netbanking (India).' },
    { key: 'stripe', name: 'Stripe', category: 'payments', description: 'International cards.' },
    { key: 'whatsapp', name: 'WhatsApp Business', category: 'communication', description: 'Order updates & enquiries on WhatsApp.' },
    { key: 'google-analytics', name: 'Google Analytics 4', category: 'analytics', description: 'Storefront analytics.' },
    { key: 'meta-pixel', name: 'Meta Pixel', category: 'marketing', description: 'Facebook & Instagram ads tracking.' },
    { key: 'shiprocket', name: 'Shiprocket', category: 'shipping', description: 'Courier aggregation & tracking.' },
  ];
  await Integration.bulkWrite(apps.map((a) => ({ updateOne: { filter: { key: a.key }, update: { $setOnInsert: { ...a, isEnabled: false } }, upsert: true } })));

  // 3. Collections
  const collMap = {};
  for (const c of COLLECTIONS) {
    // eslint-disable-next-line no-await-in-loop
    const legacySlug = c.slug === 'bushes' ? 'bushes-collection-0325' : null;
    const existing = await Collection.findOne({ slug: c.slug }) || (legacySlug && await Collection.findOne({ slug: legacySlug }));
    const doc = existing
      ? await Collection.findByIdAndUpdate(existing._id, { $set: { ...c, isActive: true } }, { new: true, runValidators: true })
      : await Collection.findOneAndUpdate({ slug: c.slug }, { $set: { ...c, isActive: true } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    collMap[c.slug] = doc;
  }
  console.log(`📁 ${COLLECTIONS.length} collections upserted`);

  // 4. Products (upsert by SKU; existing stock is preserved on re-runs)
  for (const raw of PRODUCTS) {
    const coll = collMap[raw.collection];
    const { stock, ...data } = enrich(raw, coll.name);
    // eslint-disable-next-line no-await-in-loop
    await Product.findOneAndUpdate(
      { sku: data.sku },
      { $set: { ...data, collection: coll._id }, $setOnInsert: { stock } },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );
  }
  console.log(`🌿 ${PRODUCTS.length} products upserted`);
  console.table(PRODUCTS.map((p) => ({ collection: p.collection, name: p.name, sku: p.sku, price: p.price })));
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
