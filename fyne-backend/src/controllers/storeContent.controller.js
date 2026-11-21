'use strict';

/** Public pages & blog posts (published only). */
const env = require('../config/env');
const { Content, Setting } = require('../models');
const ApiError = require('../utils/ApiError');
const { asyncHandler, prune } = require('../utils/helpers');
const { parsePagination, paginate } = require('../utils/query');
const { stripHtml, truncate } = require('../utils/html');

const urlFor = (c) => `${env.siteUrl}/${c.type === 'page' ? 'pages' : 'blog'}/${c.slug}`;

exports.list = asyncHandler(async (req, res) => {
  const type = req.params.type === 'pages' ? 'page' : 'blog_post';
  const pg = parsePagination(req.query, { defaultLimit: 12, maxLimit: 50 });
  const { items, pagination } = await paginate(Content, { type, status: 'published' }, {
    ...pg,
    sort: { publishedAt: -1, _id: -1 },
    select: 'type title slug excerpt coverImage tags publishedAt',
  });
  res.json({ success: true, data: items.map((c) => ({ ...c, url: urlFor(c) })), pagination });
});

exports.get = asyncHandler(async (req, res) => {
  const type = req.params.type === 'pages' ? 'page' : 'blog_post';
  const c = await Content.findOne({ type, slug: req.params.slug, status: 'published' }).populate('author', 'name').lean();
  if (!c) throw new ApiError(404, 'Not found');
  const settings = await Setting.getStore();
  const url = urlFor(c);
  const description = c.seo?.metaDescription || c.excerpt || truncate(stripHtml(c.body), 160);
  const jsonLd = prune({
    '@context': 'https://schema.org',
    '@type': type === 'page' ? 'WebPage' : 'BlogPosting',
    headline: c.title,
    name: c.title,
    url,
    description,
    image: c.coverImage?.url,
    datePublished: c.publishedAt,
    dateModified: c.updatedAt,
    author: c.author ? { '@type': 'Person', name: c.author.name } : { '@type': 'Organization', name: settings.storeName },
    publisher: { '@type': 'Organization', name: settings.storeName, logo: settings.logo?.url },
  });
  res.json({
    success: true,
    data: { ...c, url, seo: { title: c.seo?.metaTitle || `${c.title} | ${settings.storeName}`, description, canonicalUrl: url }, jsonLd },
  });
});
