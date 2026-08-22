const redis = require('../utils/redis');

/**
 * Simple Redis-backed rate limiter.
 * @param {number} maxRequests - max requests allowed in the window
 * @param {number} windowSecs  - window size in seconds
 */
const rateLimit = (maxRequests = 100, windowSecs = 60) => async (req, res, next) => {
  try {
    const ip  = req.ip || req.connection.remoteAddress;
    const key = `rate:${ip}`;

    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSecs);
    }

    res.setHeader('X-RateLimit-Limit',     maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));

    if (current > maxRequests) {
      return res.status(429).json({
        success: false,
        message: `Too many requests. Limit: ${maxRequests} per ${windowSecs}s.`,
      });
    }

    next();
  } catch {
    // If Redis is down, let the request through
    next();
  }
};

module.exports = { rateLimit };
