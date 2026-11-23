'use strict';

const { createClient } = require('redis');
const env = require('./env');
const logger = require('../utils/logger');

let client = null;
let connectionError = null;

if (env.redis.url) {
  client = createClient({ url: env.redis.url, socket: { reconnectStrategy: (retries) => Math.min(retries * 250, 5000) } });
  client.on('error', (error) => {
    connectionError = error;
    logger.error('redis_client_error', { message: error.message });
  });
  client.on('ready', () => {
    connectionError = null;
    logger.info('redis_ready');
  });
  client.on('end', () => logger.warn('redis_disconnected'));
}

async function connectRedis() {
  if (!client) {
    logger.warn('redis_not_configured', { hint: 'Set REDIS_URL to enable API caching' });
    return false;
  }
  if (client.isReady) return true;
  try {
    await client.connect();
    return client.isReady;
  } catch (error) {
    connectionError = error;
    logger.error('redis_connect_failed', { message: error.message });
    return false;
  }
}

async function checkRedis() {
  if (!client || !client.isReady) return { ok: false, status: client ? 'down' : 'not_configured' };
  try {
    await client.ping();
    return { ok: true, status: 'up' };
  } catch (error) {
    connectionError = error;
    return { ok: false, status: 'down' };
  }
}

async function closeRedis() {
  if (client?.isOpen) await client.quit().catch(() => client.disconnect());
}

module.exports = { redis: client, connectRedis, checkRedis, closeRedis, getRedisError: () => connectionError };
