const Redis = require('ioredis');


const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('error', (err) => console.error('Redis error:', err.message));

async function ping() {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

module.exports = { redis, ping };
