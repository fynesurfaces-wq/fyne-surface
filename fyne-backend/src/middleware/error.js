'use strict';

const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const notFound = (req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.path}`));

/** Normalises every error into: { success:false, error:{ code, message, details? } } */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let error = err;

  if (error.name === 'CastError') {
    error = new ApiError(400, 'Invalid request identifier', 'INVALID_ID');
  } else if (error.code === 11000) {
    const field = Object.keys(error.keyValue || error.keyPattern || {})[0] || 'field';
    error = new ApiError(409, `A record with this ${field} already exists`, 'DUPLICATE_KEY', { field });
  } else if (error.name === 'ValidationError' && error.errors) {
    const details = Object.values(error.errors).map((e) => ({ field: e.path, message: e.message }));
    error = new ApiError(422, env.isProd ? 'Submitted data is invalid' : 'Validation failed', 'VALIDATION_ERROR', env.isProd ? undefined : details);
  } else if (error.name === 'MulterError') {
    const tooLarge = error.code === 'LIMIT_FILE_SIZE';
    error = new ApiError(tooLarge ? 413 : 400, tooLarge ? 'Uploaded file is too large' : 'Invalid file upload', error.code);
  } else if (error.type === 'entity.parse.failed') {
    error = new ApiError(400, 'Malformed JSON body', 'INVALID_JSON');
  } else if (error.type === 'entity.too.large') {
    error = new ApiError(413, 'Request body too large');
  } else if (!(error instanceof ApiError)) {
    logger.error('unhandled_api_error', { method: req.method, path: req.path, name: err.name, message: err.message, stack: err.stack });
    error = new ApiError(500, env.isProd ? 'Something went wrong' : err.message || 'Internal error');
  }

  if (error.statusCode >= 500 && err instanceof ApiError) logger.error('api_error', { method: req.method, path: req.path, code: error.code, message: error.message, stack: err.stack });

  const hideInternal = env.isProd && error.statusCode >= 500;
  const publicCode = hideInternal ? (error.statusCode === 503 ? 'SERVICE_UNAVAILABLE' : 'INTERNAL_ERROR') : error.code;
  const publicMessage = hideInternal
    ? error.statusCode === 503 ? 'Service temporarily unavailable. Please try again shortly.' : 'Something went wrong. Please try again.'
    : error.message;

  res.status(error.statusCode).json({
    success: false,
    error: {
      code: publicCode,
      message: publicMessage,
      ...(!hideInternal && error.details !== undefined && { details: error.details }),
      ...(!env.isProd && error.statusCode >= 500 && err.stack && { stack: err.stack.split('\n').slice(0, 6) }),
    },
  });
}

module.exports = { notFound, errorHandler };
