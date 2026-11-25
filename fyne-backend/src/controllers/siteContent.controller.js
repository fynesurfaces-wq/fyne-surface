'use strict';

const { SiteContent } = require('../models');
const { asyncHandler, pick } = require('../utils/helpers');

const DEFAULT_CONTENT = {
  key: 'legacy', isEnabled: true, eyebrow: 'Built to last', reels: [],
  title: 'Create a space that leaves a lasting impression.',
  body: 'From intimate gatherings to landmark installations, our team helps bring thoughtful greenery to the moments and spaces people remember.',
  ctaLabel: 'Plan your project', ctaHref: '/contact', image: null,
};

exports.publicLegacy = asyncHandler(async (_req, res) => {
  const content = await SiteContent.findOne({ key: 'legacy' }).select('isEnabled eyebrow title body ctaLabel ctaHref image reels').lean();
  res.json({ success: true, data: content || DEFAULT_CONTENT });
});

exports.adminGet = asyncHandler(async (_req, res) => {
  const content = await SiteContent.findOneAndUpdate(
    { key: 'legacy' }, { $setOnInsert: DEFAULT_CONTENT }, { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  res.json({ success: true, data: content });
});

exports.adminUpdate = asyncHandler(async (req, res) => {
  const fields = pick(req.body, ['isEnabled', 'eyebrow', 'title', 'body', 'ctaLabel', 'ctaHref', 'image', 'reels']);
  const content = await SiteContent.findOneAndUpdate(
    { key: 'legacy' }, { $set: { ...fields, updatedBy: req.user._id }, $setOnInsert: { key: 'legacy' } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json({ success: true, data: content });
});

