const { pool } = require('../../config/db');
const UAParser = require('ua-parser-js');

const queue = [];

function getDevice(userAgent) {
  if (!userAgent) return 'unknown';
  const parser = new UAParser(userAgent);
  const device = parser.getDevice().type;
  return device || 'desktop';
}

async function flushQueue() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, 100);
  try {
    const values = batch.map((c) => [c.shortCode, c.ip, c.userAgent, c.referer, c.device]);
    await pool.query(
      'INSERT INTO clicks (short_code, ip, user_agent, referer, device) VALUES ?',
      [values]
    );
  } catch (err) {
    console.error('Analytics flush error:', err.message);
  }
}

function trackClick(shortCode, req) {
  const userAgent = req.headers['user-agent'] || null;
  queue.push({
    shortCode,
    ip: req.ip,
    userAgent,
    referer: req.headers['referer'] || null,
    device: getDevice(userAgent),
  });
}

setInterval(flushQueue, 1000);

module.exports = { trackClick };
