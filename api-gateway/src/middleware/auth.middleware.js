const jwt = require('jsonwebtoken');
const redis = require('../utils/redis');

const SECRET = process.env.JWT_SECRET || 'fallback_secret';

/**
 * Verifies JWT at the gateway before forwarding to any protected service.
 * Also checks Redis token blacklist (for logged-out tokens).
 */
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided.' });
    }

    const token = header.split(' ')[1];

    // Check blacklist in Redis
    const blacklisted = await redis.get(`blacklist:${token}`);
    if (blacklisted) {
      return res.status(401).json({ success: false, message: 'Token has been revoked. Please log in again.' });
    }

    const decoded = jwt.verify(token, SECRET);

    // Forward user identity to downstream services via headers
    req.headers['x-user-id']    = String(decoded.id);
    req.headers['x-user-email'] = decoded.email;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

module.exports = { protect };
