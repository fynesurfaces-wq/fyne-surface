'use strict';

const multer = require('multer');
const ApiError = require('../utils/ApiError');

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);

/** In-memory upload → sent straight to ImageKit (nothing written to disk). */
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED.has(file.mimetype)) return cb(new ApiError(400, `Unsupported file type: ${file.mimetype}`, 'INVALID_FILE_TYPE'));
    return cb(null, true);
  },
});

module.exports = { imageUpload };
