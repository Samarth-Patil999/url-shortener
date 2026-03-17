const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_prod';

async function register(email, password) {
  const hashed = await bcrypt.hash(password, 10);
  const apiKey = crypto.randomBytes(32).toString('hex');
  const [result] = await pool.execute(
    'INSERT INTO users (email, password, api_key) VALUES (?, ?, ?)',
    [email, hashed, apiKey]
  );
  return { id: result.insertId, email, apiKey };
}

async function login(email, password) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];
  if (!user) throw new Error('Invalid credentials');
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid credentials');
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  return { token, apiKey: user.api_key };
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { register, login, verifyToken };
