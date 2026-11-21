'use strict';

const path = require('path');
const { isConfigured } = require('../config/imagekit');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';
const FILE_API_URL = 'https://api.imagekit.io/v1/files';
const IMAGEKIT_ID_PREFIX = 'ik:';

function assertConfigured() {
  if (!isConfigured) {
    throw new ApiError(
      503,
      'Image uploads are not configured (set IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT)',
      'UPLOADS_DISABLED',
    );
  }
}

function authHeaders() {
  const credentials = Buffer.from(`${env.imagekit.privateKey}:`).toString('base64');
  return { Authorization: `Basic ${credentials}` };
}

async function parseResponse(response, operation) {
  if (!response.ok) {
    const body = await response.text();
    let reason = '';
    try {
      const details = JSON.parse(body);
      if (details && typeof details.message === 'string') reason = details.message;
      else if (details && typeof details.help === 'string') reason = details.help;
    } catch (err) {
      if (!(err instanceof SyntaxError)) throw err;
    }

    throw new ApiError(
      502,
      `ImageKit ${operation} failed (HTTP ${response.status})${reason ? `: ${reason}` : ''}`,
      'IMAGEKIT_REQUEST_FAILED',
    );
  }

  let result;
  try {
    result = await response.json();
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new ApiError(502, `ImageKit returned an invalid response while ${operation}`, 'IMAGEKIT_INVALID_RESPONSE');
    }
    throw err;
  }
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new ApiError(502, `ImageKit returned an incomplete response while ${operation}`, 'IMAGEKIT_INVALID_RESPONSE');
  }

  return result;
}

/** Upload an in-memory image and return the provider-neutral fields used by the media API. */
async function uploadBuffer(buffer, { folder = 'products', filename, mimeType } = {}) {
  assertConfigured();

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new ApiError(400, 'The uploaded file is empty or invalid', 'INVALID_UPLOAD');
  }

  const safeFilename = path.basename(String(filename || 'image').replace(/\\/g, '/'));
  const targetFolder = `/${[env.imagekit.folder, folder]
    .map((part) => part.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')}`;
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType || 'application/octet-stream' }), safeFilename);
  form.append('fileName', safeFilename);
  form.append('folder', targetFolder);
  form.append('useUniqueFileName', 'true');
  form.append('overwriteFile', 'false');

  let response;
  try {
    response = await fetch(UPLOAD_URL, { method: 'POST', headers: authHeaders(), body: form });
  } catch (err) {
    if (err.name !== 'TypeError' && err.name !== 'AbortError') throw err;
    throw new ApiError(502, 'Could not connect to ImageKit to upload the file', 'IMAGEKIT_UNAVAILABLE');
  }

  const result = await parseResponse(response, 'upload');
  if (typeof result.fileId !== 'string' || typeof result.url !== 'string') {
    throw new ApiError(502, 'ImageKit returned an incomplete upload result', 'IMAGEKIT_INVALID_RESPONSE');
  }

  return {
    secure_url: result.url,
    public_id: `${IMAGEKIT_ID_PREFIX}${result.fileId}`,
    format: path.extname(result.name || safeFilename).slice(1).toLowerCase(),
    bytes: result.size,
    width: result.width,
    height: result.height,
  };
}

/** Best-effort delete. Unprefixed IDs belong to existing Cloudinary assets. */
async function destroy(fileReference) {
  if (!isConfigured || !fileReference || !fileReference.startsWith(IMAGEKIT_ID_PREFIX)) return false;
  const fileId = fileReference.slice(IMAGEKIT_ID_PREFIX.length);

  try {
    const response = await fetch(`${FILE_API_URL}/${encodeURIComponent(fileId)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!response.ok) {
      console.warn(`[imagekit] delete failed (${response.status})`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[imagekit] delete failed', err.message);
    return false;
  }
}

module.exports = { uploadBuffer, destroy, isConfigured };
