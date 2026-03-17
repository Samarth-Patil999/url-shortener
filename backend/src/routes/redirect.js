const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const UAParser = require('ua-parser-js');
const { findByShortCode, getStats, getClicksOverTime, getUrlsByUser } = require('../models/url.model');
const { getUrl, setUrl } = require('../services/cacheService');
const { trackClick } = require('../workers/analyticsWorker');
const { authMiddleware } = require('../middleware/auth');

// GET /:code — main redirect
router.get('/:code', async (req, res) => {
  const { code } = req.params;
  try {
    let longUrl = await getUrl(code);
    if (!longUrl) {
      const row = await findByShortCode(code);
      if (!row) return res.status(404).json({ error: 'URL not found or expired' });
      longUrl = row.long_url;
      await setUrl(code, longUrl);
    }
    res.redirect(301, longUrl);
    trackClick(code, req);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats/:code — click stats + chart data
router.get('/api/stats/:code', async (req, res) => {
  try {
    const [stats, timeline] = await Promise.all([
      getStats(req.params.code),
      getClicksOverTime(req.params.code),
    ]);
    if (!stats) return res.status(404).json({ error: 'Not found' });
    res.json({ ...stats, timeline });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/qr/:code — generate QR code as PNG
router.get('/api/qr/:code', async (req, res) => {
  try {
    const shortUrl = `${process.env.BASE_URL}/${req.params.code}`;
    const qrBuffer = await QRCode.toBuffer(shortUrl, { width: 300, margin: 2 });
    res.setHeader('Content-Type', 'image/png');
    res.send(qrBuffer);
  } catch (err) {
    res.status(500).json({ error: 'QR generation failed' });
  }
});

// GET /api/my-urls — all URLs for logged-in user
router.get('/api/my-urls', authMiddleware, async (req, res) => {
  try {
    const urls = await getUrlsByUser(req.user.id);
    res.json(urls);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
