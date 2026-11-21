'use strict';

/** Content → Files: ImageKit-backed media library used by every image picker. */
const { Media } = require('../models');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../utils/helpers');
const { parsePagination, parseSort, searchFilter, paginate } = require('../utils/query');
const { uploadBuffer, destroy } = require('../services/upload.service');

const FOLDERS = new Set(['products', 'collections', 'content', 'brand', 'misc']);

/**
 * POST /api/v1/admin/media  (multipart/form-data: files[] , folder?, alt?)
 * Returns [{ url, publicId, alt }] — the image object Products,
 * Collections and Content expect, so the UI can upload then attach.
 */
exports.upload = asyncHandler(async (req, res) => {
  if (!req.files?.length) throw new ApiError(400, 'No files uploaded (field name: "files")');
  const folder = FOLDERS.has(req.body.folder) ? req.body.folder : 'misc';
  const results = await Promise.all(
    req.files.map((f) =>
      uploadBuffer(f.buffer, { folder, filename: f.originalname, mimeType: f.mimetype }),
    ),
  );
  const docs = await Media.insertMany(
    results.map((r) => ({
      url: r.secure_url,
      publicId: r.public_id,
      alt: req.body.alt || undefined,
      format: r.format,
      bytes: r.bytes,
      width: r.width,
      height: r.height,
      folder,
      uploadedBy: req.user._id,
    }))
  );
  res.status(201).json({ success: true, data: docs.map((d) => ({ _id: d._id, url: d.url, publicId: d.publicId, alt: d.alt, width: d.width, height: d.height })) });
});

exports.list = asyncHandler(async (req, res) => {
  const pg = parsePagination(req.query, { defaultLimit: 40 });
  const sort = parseSort(req.query.sort, ['createdAt', 'bytes']);
  const base = FOLDERS.has(req.query.folder) ? { folder: req.query.folder } : {};
  const s = searchFilter(req.query.q, ['alt', 'publicId']);
  const { items, pagination } = await paginate(Media, s ? { ...base, ...s } : base, { ...pg, sort });
  res.json({ success: true, data: items, pagination });
});

exports.updateAlt = asyncHandler(async (req, res) => {
  const media = await Media.findByIdAndUpdate(req.params.id, { alt: req.body.alt }, { new: true });
  if (!media) throw new ApiError(404, 'File not found');
  res.json({ success: true, data: media });
});

exports.remove = asyncHandler(async (req, res) => {
  const media = await Media.findByIdAndDelete(req.params.id);
  if (!media) throw new ApiError(404, 'File not found');
  await destroy(media.publicId);
  res.json({ success: true, message: 'File deleted' });
});
