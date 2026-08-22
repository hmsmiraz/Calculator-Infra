const express  = require('express');
const fetch    = require('node-fetch');
const router   = express.Router();
const redis    = require('../utils/redis');
const { protect } = require('../middleware/auth.middleware');

const AUTH_URL = () => process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
const CALC_URL = () => process.env.CALC_SERVICE_URL || 'http://localhost:4002';
const USER_URL = () => process.env.USER_SERVICE_URL || 'http://localhost:4003';

// ── Generic proxy helper ───────────────────────────────────────────────────────

const proxyTo = async (req, res, targetUrl) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(req.headers.authorization && { authorization: req.headers.authorization }),
      ...(req.headers['x-user-id']    && { 'x-user-id':    req.headers['x-user-id'] }),
      ...(req.headers['x-user-email'] && { 'x-user-email': req.headers['x-user-email'] }),
    };

    const options = {
      method:  req.method,
      headers,
      ...(req.method !== 'GET' && req.method !== 'DELETE' && {
        body: JSON.stringify(req.body),
      }),
    };

    const response = await fetch(targetUrl, options);
    const data     = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error(`[Gateway] Proxy error → ${targetUrl}:`, err.message);
    return res.status(503).json({ success: false, message: 'Service unavailable. Please try again.' });
  }
};

// ── Auth Service routes — PUBLIC ───────────────────────────────────────────────

router.post('/auth/register', (req, res) =>
  proxyTo(req, res, `${AUTH_URL()}/api/auth/register`)
);

router.post('/auth/login', (req, res) =>
  proxyTo(req, res, `${AUTH_URL()}/api/auth/login`)
);

// ── Auth Service routes — PROTECTED ───────────────────────────────────────────

router.get('/auth/me', protect, (req, res) =>
  proxyTo(req, res, `${AUTH_URL()}/api/auth/me`)
);

router.post('/auth/logout', protect, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      // Blacklist token in Redis for 7 days
      await redis.setex(`blacklist:${token}`, 60 * 60 * 24 * 7, '1');
    }
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch {
    return res.status(500).json({ success: false, message: 'Logout failed.' });
  }
});

// ── Calculator Service routes — PROTECTED ─────────────────────────────────────

router.post('/calculator/calculate', protect, (req, res) =>
  proxyTo(req, res, `${CALC_URL()}/api/calculator/calculate`)
);

router.get('/calculator/history', protect, (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  proxyTo(req, res, `${CALC_URL()}/api/calculator/history${query ? '?' + query : ''}`)
});

router.delete('/calculator/history', protect, (req, res) =>
  proxyTo(req, res, `${CALC_URL()}/api/calculator/history`)
);

router.delete('/calculator/history/:id', protect, (req, res) =>
  proxyTo(req, res, `${CALC_URL()}/api/calculator/history/${req.params.id}`)
);

// ── User Service routes — PROTECTED ───────────────────────────────────────────

router.get('/users/profile', protect, (req, res) =>
  proxyTo(req, res, `${USER_URL()}/api/users/profile`)
);

router.patch('/users/profile', protect, (req, res) =>
  proxyTo(req, res, `${USER_URL()}/api/users/profile`)
);

router.get('/users/stats', protect, (req, res) =>
  proxyTo(req, res, `${USER_URL()}/api/users/stats`)
);

module.exports = router;
