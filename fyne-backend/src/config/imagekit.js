'use strict';

const env = require('./env');

const isConfigured = Boolean(env.imagekit.privateKey && env.imagekit.urlEndpoint);

module.exports = { isConfigured };
