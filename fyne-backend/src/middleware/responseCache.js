'use strict';

const { redis } = require('../config/redis');
const logger = require('../utils/logger');

const PREFIX = 'fyne:store-cache';

function responseCache(namespace, ttlSeconds = 3600) {
  return async (req, res, next) => {
    if (req.method !== 'GET' || !redis?.isReady) return next();

    const key = `${PREFIX}:${namespace}:${req.originalUrl}`;
    try {
      const cached = await redis.get(key);
      if (cached) {
        const value = JSON.parse(cached);
        res.set('X-Cache', 'HIT');
        return res.status(value.statusCode).json(value.body);
      }
    } catch (error) {
      logger.warn('redis_cache_read_failed', { namespace, message: error.message });
    }

    res.set('X-Cache', 'MISS');
    const sendJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300 && redis?.isReady) {
        const value = JSON.stringify({ statusCode: res.statusCode, body });
        redis.set(key, value, { EX: ttlSeconds }).catch((error) => {
          logger.warn('redis_cache_write_failed', { namespace, message: error.message });
        });
      }
      return sendJson(body);
    };
    return next();
  };
}

async function invalidateStoreCache(...namespaces) {
  if (!redis?.isReady) return;
  for (const namespace of new Set(namespaces.flat())) {
    try {
      const keys = [];
      for await (const key of redis.scanIterator({ MATCH: `${PREFIX}:${namespace}:*`, COUNT: 200 })) keys.push(key);
      if (keys.length) await redis.del(keys);
    } catch (error) {
      logger.warn('redis_cache_invalidation_failed', { namespace, message: error.message });
    }
  }
}

module.exports = { responseCache, invalidateStoreCache };
