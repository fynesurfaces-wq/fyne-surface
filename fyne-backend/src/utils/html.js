'use strict';

const sanitizeHtml = require('sanitize-html');

/**
 * Rich-text fields (product/collection descriptions, blog bodies, FAQ answers)
 * are stored as SANITIZED HTML — the admin uses a WYSIWYG editor (e.g. TipTap)
 * exactly like Shopify. Everything else is plain text and goes through xss-clean.
 */
const RICH_TEXT_OPTIONS = {
  allowedTags: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote', 'code', 'pre',
    'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'img', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    '*': ['class'],
  },
  allowedSchemes: ['https', 'http', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['https'] },
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
  },
};

const sanitizeRichText = (html) => sanitizeHtml(String(html ?? ''), RICH_TEXT_OPTIONS);

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'", '&nbsp;': ' ' };

/** HTML → plain text (for JSON-LD, meta descriptions, AI summaries). */
const stripHtml = (html) =>
  sanitizeHtml(String(html ?? '').replace(/<\/(p|li|h[1-6]|tr)>/gi, ' '), { allowedTags: [], allowedAttributes: {} })
    .replace(/&(amp|lt|gt|quot|#39|#x27|nbsp);/g, (m) => ENTITIES[m])
    .replace(/\s+/g, ' ')
    .trim();

const truncate = (text, max = 160) => {
  const t = String(text ?? '');
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
};

module.exports = { sanitizeRichText, stripHtml, truncate };
