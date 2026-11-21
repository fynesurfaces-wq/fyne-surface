'use strict';

const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const notFound = (req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

/** Normalises every error into: { success:false, error:{ code, message, details? } } */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let error = err;

  if (error.name === 'CastError') {
    error = new ApiError(400, `Invalid ${error.path}: ${error.value}`, 'INVALID_ID');
  } else if (error.code === 11000) {
    const field = Object.keys(error.keyValue || error.keyPattern || {})[0] || 'field';
    error = new ApiError(409, `A record with this ${field} already exists`, 'DUPLICATE_KEY', { field });
  } else if (error.name === 'ValidationError' && error.errors) {
    const details = Object.values(error.errors).map((e) => ({ field: e.path, message: e.message }));
    error = new ApiError(422, 'Validation failed', 'VALIDATION_ERROR', details);
  } else if (error.name === 'MulterError') {
    error = new ApiError(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400, error.message, error.code);
  } else if (error.type === 'entity.parse.failed') {
    error = new ApiError(400, 'Malformed JSON body', 'INVALID_JSON');
  } else if (error.type === 'entity.too.large') {
    error = new ApiError(413, 'Request body too large');
  } else if (!(error instanceof ApiError)) {
    console.error('[unhandled]', err);
    error = new ApiError(500, env.isProd ? 'Something went wrong' : err.message || 'Internal error');
  }

  if (error.statusCode >= 500 && err instanceof ApiError) console.error('[api-error]', err);

  res.status(error.statusCode).json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details !== undefined && { details: error.details }),
      ...(!env.isProd && error.statusCode >= 500 && err.stack && { stack: err.stack.split('\n').slice(0, 6) }),
    },
  });
}

module.exports = { notFound, errorHandler };
