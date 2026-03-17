const { redis } = require('../../config/redis');

const LIMIT = parseInt(process.env.RATE_LIMIT) || 100;
const WINDOW = 60; // seconds

/**
 * WHY Redis for rate limiting (not in-memory):
 * In-memory counters are per-process — with 3 app servers each allows 100 req,
 * total becomes 300. Redis is shared across all servers = true 100/min limit.
 *
 * WHY token bucket pattern: smoother than fixed window.
 * A user can't burst 100 req at 0:59 and 100 more at 1:01.
 */
async function rateLimiter(req, res, next) {
  const key = `rate:${req.ip}`;
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      // First request in window — set expiry
      await redis.expire(key, WINDOW);
    }
    if (current > LIMIT) {
      const ttl = await redis.ttl(key);
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: ttl,
      });
    }
    next();
  } catch {
    // WHY fail open: if Redis is down, don't block all traffic
    next();
  }
}

module.exports = rateLimiter;
