'use strict';

const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

async function connectDB(uri = env.mongoUri) {
  mongoose.connection.on('error', (err) => console.error('[mongo] connection error:', err.message));
  mongoose.connection.on('disconnected', () => console.warn('[mongo] disconnected'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`[mongo] connected → ${mongoose.connection.name}`);
  return mongoose.connection;
}

module.exports = { connectDB };
