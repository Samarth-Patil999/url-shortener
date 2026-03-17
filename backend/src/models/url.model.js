const { pool } = require('../../config/db');
const { encode } = require('../services/hashService');

async function createUrl(longUrl, userId = null, expiresAt = null, customSlug = null) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (customSlug) {
      // WHY check first: custom slugs must be unique
      const [existing] = await conn.execute('SELECT id FROM urls WHERE short_code = ?', [customSlug]);
      if (existing.length > 0) throw new Error('SLUG_TAKEN');
      await conn.execute(
        'INSERT INTO urls (short_code, long_url, user_id, expires_at, custom_slug) VALUES (?, ?, ?, ?, 1)',
        [customSlug, longUrl, userId, expiresAt]
      );
      await conn.commit();
      return customSlug;
    }

    // Auto-generate: insert first, encode the auto-increment ID
    const [result] = await conn.execute(
      'INSERT INTO urls (long_url, user_id, expires_at) VALUES (?, ?, ?)',
      [longUrl, userId, expiresAt]
    );
    const shortCode = encode(result.insertId);
    await conn.execute('UPDATE urls SET short_code = ? WHERE id = ?', [shortCode, result.insertId]);
    await conn.commit();
    return shortCode;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function findByShortCode(shortCode) {
  const [rows] = await pool.execute(
    'SELECT long_url FROM urls WHERE short_code = ? AND (expires_at IS NULL OR expires_at > NOW())',
    [shortCode]
  );
  return rows[0] || null;
}

async function getStats(shortCode) {
  const [rows] = await pool.execute(
    `SELECT u.short_code, u.long_url, u.created_at,
            COUNT(c.id) AS click_count
     FROM urls u
     LEFT JOIN clicks c ON u.short_code = c.short_code
     WHERE u.short_code = ?
     GROUP BY u.id`,
    [shortCode]
  );
  return rows[0] || null;
}

async function getClicksOverTime(shortCode) {
  const [rows] = await pool.execute(
    `SELECT DATE(clicked_at) as date, COUNT(*) as clicks
     FROM clicks WHERE short_code = ?
     AND clicked_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY DATE(clicked_at)
     ORDER BY date ASC`,
    [shortCode]
  );
  return rows;
}

async function getUrlsByUser(userId) {
  const [rows] = await pool.execute(
    `SELECT u.short_code, u.long_url, u.created_at, u.expires_at,
            COUNT(c.id) AS click_count
     FROM urls u
     LEFT JOIN clicks c ON u.short_code = c.short_code
     WHERE u.user_id = ?
     GROUP BY u.id
     ORDER BY u.created_at DESC`,
    [userId]
  );
  return rows;
}

module.exports = { createUrl, findByShortCode, getStats, getClicksOverTime, getUrlsByUser };
