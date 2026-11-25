'use strict';

const { createClient } = require('redis');
const env = require('./env');
const logger = require('../utils/logger');

let client = null;
let connectionError = null;

function parseRedisUrl(value) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (!['redis:', 'rediss:'].includes(parsed.protocol) || !parsed.hostname) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

const redisUrl = parseRedisUrl(env.redis.url);
if (env.redis.url && !redisUrl) {
  connectionError = new Error('REDIS_URL must be a redis:// or rediss:// connection URL; a REST API token alone is not valid.');
  logger.warn('redis_url_invalid', { hint: 'Redis is disabled; use the provider connection URL or clear REDIS_URL.' });
}

if (redisUrl) {
  try {
    client = createClient({ url: redisUrl, socket: { reconnectStrategy: (retries) => Math.min(retries * 250, 5000) } });
    client.on('error', (error) => {
      connectionError = error;
      logger.error('redis_client_error', { message: error.message });
    });
    client.on('ready', () => {
      connectionError = null;
      logger.info('redis_ready');
    });
    client.on('end', () => logger.warn('redis_disconnected'));
  } catch (error) {
    connectionError = error;
    client = null;
    logger.warn('redis_client_init_failed', { message: error.message, hint: 'Redis is disabled; check REDIS_URL.' });
  }
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
