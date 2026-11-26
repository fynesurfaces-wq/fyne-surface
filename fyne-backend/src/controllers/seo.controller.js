'use strict';

/**
 * Dynamic sitemap.xml, robots.txt, llms.txt and the Agentic product feed.
 * The storefront (e.g. Next.js) should proxy /sitemap.xml, /robots.txt and
 * /llms.txt on its own domain to these endpoints (rewrites), so search engines
 * see them at https://www.fynesurfaces.com/sitemap.xml.
 */
const env = require('../config/env');
const { Product, Collection, Content, Setting } = require('../models');
const ApiError = require('../utils/ApiError');
const { asyncHandler, escapeXml, formatINR } = require('../utils/helpers');
const { productUrl, collectionUrl } = require('../utils/seo/jsonLd');
const { toPublicProduct } = require('../utils/seo/aeo');
const { stripHtml, truncate } = require('../utils/html');
const metroCities = require('../data/metroCities');

const STATIC_PAGES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/collections', changefreq: 'weekly', priority: '0.8' },
  { path: '/products', changefreq: 'daily', priority: '0.8' },
  { path: '/blog', changefreq: 'weekly', priority: '0.6' },
  { path: '/locations', changefreq: 'monthly', priority: '0.6' },
  { path: '/faq', changefreq: 'monthly', priority: '0.5' },
  { path: '/return-policy', changefreq: 'yearly', priority: '0.3' },
  { path: '/contact', changefreq: 'yearly', priority: '0.4' },
];

const iso = (d) => (d ? new Date(d).toISOString() : undefined);
const imageKitHost = (() => {
  try { return new URL(env.imagekit.urlEndpoint).hostname.toLowerCase(); } catch { return ''; }
})();
const isImageKitUrl = (value) => {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === 'ik.imagekit.io' || (imageKitHost && host === imageKitHost);
  } catch {
    return false;
  }
};
const absoluteImageUrl = (value) => {
  try { return new URL(value, `${env.siteUrl}/`).toString(); } catch { return ''; }
};

/** GET /sitemap.xml — includes Google image-sitemap extension for product photos. */
exports.sitemap = asyncHandler(async (_req, res) => {
  const [collections, products, content] = await Promise.all([
    Collection.find({ isActive: true }).select('slug updatedAt coverImage name').lean(),
    Product.find({ isActive: true }).select('slug name updatedAt images').lean(),
    Content.find({ status: 'published' }).select('type slug updatedAt').lean(),
  ]);

  const urls = [];
  const add = ({ loc, lastmod, changefreq, priority, images = [] }) => {
    const imgs = images
      .map((i) => ({ ...i, absoluteUrl: i?.url ? absoluteImageUrl(i.url) : '' }))
      .filter((i) => i.absoluteUrl && !isImageKitUrl(i.absoluteUrl))
      .slice(0, 10)
      .map((i) => `\n    <image:image><image:loc>${escapeXml(i.absoluteUrl)}</image:loc>${i.alt ? `<image:title>${escapeXml(i.alt)}</image:title>` : ''}</image:image>`)
      .join('');
    urls.push(
      `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}${changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : ''}${priority ? `\n    <priority>${priority}</priority>` : ''}${imgs}\n  </url>`
    );
  };

  STATIC_PAGES.forEach((p) => add({ loc: `${env.siteUrl}${p.path === '/' ? '' : p.path}` || env.siteUrl, changefreq: p.changefreq, priority: p.priority }));
  collections.forEach((c) => add({ loc: collectionUrl(c), lastmod: iso(c.updatedAt), changefreq: 'weekly', priority: '0.8', images: c.coverImage ? [{ ...c.coverImage, alt: c.coverImage.alt || c.name }] : [] }));
  products.forEach((p) => add({ loc: productUrl(p), lastmod: iso(p.updatedAt), changefreq: 'weekly', priority: '0.9', images: p.images.map((i) => ({ ...i, alt: i.alt || p.name || p.sku })) }));
  content.forEach((c) => add({ loc: `${env.siteUrl}/${c.type === 'page' ? 'pages' : 'blog'}/${c.slug}`, lastmod: iso(c.updatedAt), changefreq: 'monthly', priority: '0.5' }));
  metroCities.forEach((city) => add({ loc: `${env.siteUrl}/locations/${city.slug}`, changefreq: 'monthly', priority: '0.5' }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`;
  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(xml);
});

/** GET /robots.txt — explicitly welcomes AI/answer-engine crawlers when the Agentic channel allows it. */
exports.robots = asyncHandler(async (_req, res) => {
  const settings = await Setting.getStore();
  const allowAi = settings.channels?.agentic?.enabled && settings.channels?.agentic?.allowAiCrawlers;
  const privatePaths = ['/admin', '/cart', '/checkout', '/account', '/api/', '/search?'];
  const disallow = privatePaths.map((p) => `Disallow: ${p}`).join('\n');
  const aiBots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'Claude-SearchBot', 'Google-Extended', 'Applebot-Extended', 'Bingbot'];

  const aiBlock = aiBots
    .map((bot) => `User-agent: ${bot}\n${allowAi ? `Allow: /\n${disallow}` : 'Disallow: /'}`)
    .join('\n\n');

  const body = `# ${settings.storeName} — ${settings.tagline}
User-agent: *
Allow: /
${disallow}

# AI assistants & answer engines (GEO/AEO)
${aiBlock}

Sitemap: ${env.siteUrl}/sitemap.xml
`;
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(body);
});

async function assertAgenticEnabled() {
  const settings = await Setting.getStore();
  if (!settings.channels?.agentic?.enabled) throw new ApiError(404, 'Agentic channel is disabled');
  return settings;
}

/**
 * GET /llms.txt — the emerging convention (llmstxt.org) for giving LLMs a
 * concise, Markdown map of a site: who you are, what you sell, where the
 * canonical pages are.
 */
exports.llmsTxt = asyncHandler(async (_req, res) => {
  const settings = await assertAgenticEnabled();
  const [collections, products] = await Promise.all([
    Collection.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    Product.find({ isActive: true }).populate('collection', 'name slug').sort({ collection: 1, name: 1 }).lean(),
  ]);

  const byCollection = new Map(collections.map((c) => [String(c._id), []]));
  products.forEach((p) => byCollection.get(String(p.collection?._id))?.push(p));

  const lines = [
    `# ${settings.storeName}`,
    '',
    `> ${settings.storeName} (${settings.tagline}) sells premium artificial plants, trees, bushes and vertical-garden greenery in India. Prices are in INR${settings.tax?.pricesIncludeTax ? ' and include GST' : ''}.`,
    '',
    `- Website: ${env.siteUrl}`,
    settings.contact?.email ? `- Email: ${settings.contact.email}` : null,
    settings.contact?.phone ? `- Phone: ${settings.contact.phone}` : null,
    `- Machine-readable catalog (JSON): ${env.apiUrl}/api/v1/feeds/products.json`,
    '',
  ].filter((l) => l !== null);

  for (const c of collections) {
    const items = byCollection.get(String(c._id)) || [];
    if (!items.length) continue;
    lines.push(`## ${c.name}`, '');
    if (c.description) lines.push(truncate(stripHtml(c.description), 300), '');
    items.forEach((p) => {
      const pub = toPublicProduct(p, { collection: c, settings, includeJsonLd: false });
      const facts = pub.attributes.map((a) => `${a.name}: ${a.display}`).join('; ');
      lines.push(`- [${p.name || p.sku}](${pub.url}): ${formatINR(p.price)}${facts ? ` — ${facts}` : ''}${p.stock > 0 ? '' : ' — out of stock'}`);
    });
    lines.push('');
  }

  res.set('Content-Type', 'text/markdown; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(lines.join('\n'));
});

/** GET /api/v1/feeds/products.json — full structured catalog for shopping agents & AI engines. */
exports.productFeed = asyncHandler(async (_req, res) => {
  const settings = await assertAgenticEnabled();
  const products = await Product.find({ isActive: true }).populate('collection', 'name slug').lean();
  res.set('Cache-Control', 'public, max-age=900');
  res.json({
    version: '1.0',
    generatedAt: new Date().toISOString(),
    store: { name: settings.storeName, tagline: settings.tagline, url: env.siteUrl, currency: 'INR', country: 'IN' },
    count: products.length,
    products: products.map((p) => toPublicProduct(p, { settings, includeJsonLd: false })),
  });
});
