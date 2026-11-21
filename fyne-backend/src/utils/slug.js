'use strict';

/** "1.2mtr & Above" → "1-2mtr-and-above" */
const slugify = (input) =>
  String(input || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

/**
 * Generate a slug that is unique within `Model` (optionally within a scope,
 * e.g. { type: 'blog_post' }). Appends -2, -3 … on collision.
 */
async function uniqueSlug(Model, source, { excludeId, scope = {} } = {}) {
  const base = slugify(source) || 'item';
  let slug = base;
  let i = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ ...scope, slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

module.exports = { slugify, uniqueSlug };
