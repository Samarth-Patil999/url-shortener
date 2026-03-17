const express = require('express');
const router = express.Router();
const { register, login } = require('../services/authService');

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password too short' });
  try {
    const user = await register(email, password);
    res.status(201).json({ message: 'Registered successfully', apiKey: user.apiKey });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const { token, apiKey } = await login(email, password);
    res.json({ token, apiKey });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

module.exports = router;
