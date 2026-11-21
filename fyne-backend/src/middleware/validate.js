'use strict';

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/** Run express-validator chains, then fail with 422 + per-field errors. */
const validate = (chains = []) => [
  ...chains,
  (req, _res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();
    const details = result.array({ onlyFirstError: true }).map((e) => ({ field: e.path, message: e.msg, location: e.location }));
    return next(new ApiError(422, 'Validation failed', 'VALIDATION_ERROR', details));
  },
];

module.exports = validate;
