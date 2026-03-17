const express = require('express');
const router = express.Router();
const { createUrl } = require('../models/url.model');
const { setUrl } = require('../services/cacheService');
const rateLimiter = require('../middleware/rateLimiter');
const { optionalAuth } = require('../middleware/auth');

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

router.post('/', rateLimiter, optionalAuth, async (req, res) => {
  const { longUrl, expiresAt, customSlug } = req.body;
  const userId = req.user?.id || null;

  if (!longUrl || !isValidUrl(longUrl)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Custom slugs only for logged-in users
  if (customSlug && !userId) {
    return res.status(401).json({ error: 'Login required for custom slugs' });
  }

  if (customSlug && !/^[a-zA-Z0-9_-]{3,20}$/.test(customSlug)) {
    return res.status(400).json({ error: 'Slug must be 3-20 alphanumeric characters' });
  }

  try {
    const shortCode = await createUrl(longUrl, userId, expiresAt || null, customSlug || null);
    await setUrl(shortCode, longUrl);

    return res.status(201).json({
      shortCode,
      shortUrl: `${process.env.BASE_URL}/${shortCode}`,
      longUrl,
    });
  } catch (err) {
    if (err.message === 'SLUG_TAKEN') return res.status(409).json({ error: 'Custom slug already taken' });
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
