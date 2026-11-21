'use strict';

const DEFAULT_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  422: 'VALIDATION_ERROR',
  429: 'TOO_MANY_REQUESTS',
  503: 'SERVICE_UNAVAILABLE',
};

class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status
   * @param {string} message    Human-readable message (safe to show in UI)
   * @param {string} [code]     Machine-readable code the frontend can switch on
   * @param {any}    [details]  Field errors etc.
   */
  constructor(statusCode, message, code, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code || DEFAULT_CODES[statusCode] || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'ERROR');
    this.details = details;
    this.isOperational = true;
  }
}

module.exports = ApiError;
