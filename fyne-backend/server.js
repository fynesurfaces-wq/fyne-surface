'use strict';

const mongoose = require('mongoose');
const env = require('./src/config/env');
const { connectDB } = require('./src/config/db');
const { connectRedis, closeRedis } = require('./src/config/redis');
const logger = require('./src/utils/logger');
const app = require('./src/app');

async function start() {
  await connectDB();
  // Keep the HTTP API available while Redis retries in the background; health
  // stays degraded until the cache connection is ready.
  void connectRedis();
  const server = app.listen(env.port, () => logger.info('api_listening', { port: env.port, environment: env.nodeEnv }));

  const shutdown = (signal) => {
    logger.info('shutdown_started', { signal });
    server.close(async () => {
      await closeRedis();
      await mongoose.connection.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  ['SIGINT', 'SIGTERM'].forEach((s) => process.on(s, () => shutdown(s)));
  process.on('unhandledRejection', (err) => {
    logger.error('unhandled_rejection', { message: err?.message, stack: err?.stack });
    shutdown('unhandledRejection');
  });
}

start().catch((err) => {
  logger.error('startup_failed', { message: err.message, stack: err.stack });
  process.exit(1);
});
