'use strict';

const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

mongoose.set('strictQuery', true);

async function connectDB(uri = env.mongoUri) {
  mongoose.connection.on('error', (err) => logger.error('mongodb_connection_error', { message: err.message }));
  mongoose.connection.on('disconnected', () => logger.warn('mongodb_disconnected'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  logger.info('mongodb_connected', { database: mongoose.connection.name });
  return mongoose.connection;
}

module.exports = { connectDB };
