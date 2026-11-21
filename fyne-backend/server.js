'use strict';

const mongoose = require('mongoose');
const env = require('./src/config/env');
const { connectDB } = require('./src/config/db');
const app = require('./src/app');

async function start() {
  await connectDB();
  const server = app.listen(env.port, () => console.log(`🌿 FYNE SURFACES API on :${env.port} (${env.nodeEnv})`));

  const shutdown = (signal) => {
    console.log(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  ['SIGINT', 'SIGTERM'].forEach((s) => process.on(s, () => shutdown(s)));
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
    shutdown('unhandledRejection');
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
