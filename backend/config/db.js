const mysql = require('mysql2/promise');

// WHY pool: reusing connections is faster than creating new ones per request
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,   // WHY 10: safe default, tune based on DB server capacity
  queueLimit: 0,
});

async function ping() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    return true;
  } catch {
    return false;
  }
}

module.exports = { pool, ping };
