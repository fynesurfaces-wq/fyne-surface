'use strict';

const env = require('../config/env');
const { Setting, Product, Content } = require('../models');
const ApiError = require('../utils/ApiError');
const { asyncHandler, pick } = require('../utils/helpers');
const { generateOrganizationJsonLd } = require('../utils/seo/jsonLd');

const EDITABLE = ['storeName', 'tagline', 'logo', 'contact', 'gstin', 'tax', 'shipping', 'brandColors', 'social', 'seo'];

/** Deep-merge plain objects so PATCHing { tax: { rate: 12 } } keeps pricesIncludeTax. */
function merge(doc, updates) {
  for (const [k, v] of Object.entries(updates)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && k !== 'logo') {
      for (const [k2, v2] of Object.entries(v)) doc.set(`${k}.${k2}`, v2);
    } else {
      doc.set(k, v);
    }
  }
}

exports.get = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await Setting.getStore() });
});

exports.update = asyncHandler(async (req, res) => {
  const settings = await Setting.getStore();
  merge(settings, pick(req.body, EDITABLE));
  await settings.save();
  res.json({ success: true, data: settings });
});

/** GET /api/v1/store/settings — public subset for the storefront header/footer/theme. */
exports.publicSettings = asyncHandler(async (_req, res) => {
  const s = await Setting.getStore();
  res.set('Cache-Control', 'public, max-age=300');
  res.json({
    success: true,
    data: {
      storeName: s.storeName,
      tagline: s.tagline,
      logo: s.logo || null,
      contact: s.contact,
      currency: s.currency,
      brandColors: s.brandColors,
      social: s.social,
      tax: { pricesIncludeTax: s.tax.pricesIncludeTax },
      shipping: s.shipping,
      seo: s.seo,
      organizationJsonLd: { '@context': 'https://schema.org', ...generateOrganizationJsonLd(s) },
    },
  });
});

// ── Sales channels ─────────────────────────────────────────

const CHANNELS = {
  'online-store': {
    name: 'Online Store',
    settingsPath: 'channels.onlineStore',
    describe: (s) => ({
      enabled: s.channels.onlineStore.enabled,
      url: env.siteUrl,
      endpoints: { sitemap: `${env.apiUrl}/sitemap.xml`, robots: `${env.apiUrl}/robots.txt` },
    }),
  },
  agentic: {
    name: 'Agentic',
    description: 'Make the catalog discoverable and purchasable by AI assistants and shopping agents (ChatGPT, Perplexity, Gemini, Claude).',
    settingsPath: 'channels.agentic',
    describe: (s) => ({
      enabled: s.channels.agentic.enabled,
      allowAiCrawlers: s.channels.agentic.allowAiCrawlers,
      endpoints: {
        productFeed: `${env.apiUrl}/api/v1/feeds/products.json`,
        llmsTxt: `${env.apiUrl}/llms.txt`,
        robots: `${env.apiUrl}/robots.txt`,
      },
    }),
  },
};

/** GET /api/v1/admin/channels */
exports.listChannels = asyncHandler(async (_req, res) => {
  const s = await Setting.getStore();
  const [activeProducts, publishedContent] = await Promise.all([Product.countDocuments({ isActive: true }), Content.countDocuments({ status: 'published' })]);
  res.json({
    success: true,
    data: Object.entries(CHANNELS).map(([key, c]) => ({
      key,
      name: c.name,
      description: c.description,
      ...c.describe(s),
      stats: { activeProducts, publishedContent },
    })),
  });
});

/** PATCH /api/v1/admin/channels/:key  { enabled?, allowAiCrawlers? } */
exports.updateChannel = asyncHandler(async (req, res) => {
  const channel = CHANNELS[req.params.key];
  if (!channel) throw new ApiError(404, 'Unknown sales channel');
  const s = await Setting.getStore();
  if (typeof req.body.enabled === 'boolean') s.set(`${channel.settingsPath}.enabled`, req.body.enabled);
  if (req.params.key === 'agentic' && typeof req.body.allowAiCrawlers === 'boolean') s.set('channels.agentic.allowAiCrawlers', req.body.allowAiCrawlers);
  await s.save();
  res.json({ success: true, data: { key: req.params.key, name: channel.name, ...channel.describe(s) } });
});
