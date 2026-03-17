const { redis } = require('../../config/redis');

const TTL = 3600; // WHY 1hr: hot URLs stay cached, stale ones auto-evict

/**
 * WHY mutex lock: without it, 1000 concurrent cache misses for same key
 * would all hit MySQL simultaneously — "thundering herd" problem.
 * Lock ensures only 1 request queries DB; others wait & get cache.
 */
async function getUrl(shortCode) {
  const cached = await redis.get(shortCode);
  if (cached) return cached;

  const lockKey = `lock:${shortCode}`;
  const lock = await redis.set(lockKey, '1', 'NX', 'EX', 5);

  if (!lock) {
    // Another request holds the lock — wait briefly and read from cache
    await new Promise((r) => setTimeout(r, 150));
    return redis.get(shortCode);
  }

  return null; // caller must fetch from DB and call setUrl()
}

async function setUrl(shortCode, longUrl) {
  await redis.setex(shortCode, TTL, longUrl);
  await redis.del(`lock:${shortCode}`);
}

async function deleteUrl(shortCode) {
  await redis.del(shortCode);
}

module.exports = { getUrl, setUrl, deleteUrl };
