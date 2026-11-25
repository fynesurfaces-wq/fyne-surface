'use strict';

const { MemoryStore } = require('express-rate-limit');
const { redis } = require('../config/redis');
const logger = require('../utils/logger');

const INCREMENT_SCRIPT = `
local hits = redis.call('INCR', KEYS[1])
if hits == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return { hits, redis.call('PTTL', KEYS[1]) }
`;

/** Shared Redis counters across API instances, with a local fallback if Redis is unavailable. */
class RedisRateLimitStore {
  constructor(prefix) {
    this.prefix = `fyne:rate-limit:${prefix}:`;
    this.local = new MemoryStore();
    this.windowMs = 60_000;
  }

  init(options) {
    this.windowMs = options.windowMs;
    this.local.init(options);
  }

  async increment(key) {
    if (redis?.isReady) {
      try {
        const [totalHits, ttl] = await redis.eval(INCREMENT_SCRIPT, { keys: [`${this.prefix}${key}`], arguments: [String(this.windowMs)] });
        return { totalHits: Number(totalHits), resetTime: new Date(Date.now() + Math.max(0, Number(ttl))) };
      } catch (error) {
        logger.warn('redis_rate_limit_fallback', { message: error.message });
      }
    }
    return this.local.increment(key);
  }

  async decrement(key) {
    if (redis?.isReady) {
      try {
        await redis.decr(`${this.prefix}${key}`);
        return;
      } catch (error) {
        logger.warn('redis_rate_limit_decrement_failed', { message: error.message });
      }
    }
    return this.local.decrement(key);
  }

  async resetKey(key) {
    if (redis?.isReady) {
      try { await redis.del(`${this.prefix}${key}`); } catch (error) { logger.warn('redis_rate_limit_reset_failed', { message: error.message }); }
    }
    return this.local.resetKey(key);
  }

  shutdown() { return this.local.shutdown(); }
}

module.exports = { RedisRateLimitStore };
