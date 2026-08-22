const pool  = require('../config/db');
const redis = require('../config/redis');

// GET /api/users/profile
const getProfile = async (req, res, next) => {
  try {
    const userId = parseInt(req.headers['x-user-id']);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    // Try Redis first
    const cached = await redis.get(`profile:${userId}`);
    if (cached) return res.status(200).json({ success: true, data: { user: JSON.parse(cached) }, cached: true });

    const { rows } = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1', [userId]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'User not found.' });

    await redis.setex(`profile:${userId}`, 300, JSON.stringify(rows[0]));
    return res.status(200).json({ success: true, data: { user: rows[0] } });
  } catch (err) { next(err); }
};

// PATCH /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const userId = parseInt(req.headers['x-user-id']);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const { name } = req.body;
    if (!name || name.trim().length < 2)
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });

    const { rows } = await pool.query(
      'UPDATE users SET name=$1 WHERE id=$2 RETURNING id, name, email, created_at, updated_at',
      [name.trim(), userId]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'User not found.' });

    // Invalidate profile cache
    await redis.del(`profile:${userId}`);
    await redis.del(`stats:${userId}`);

    return res.status(200).json({ success: true, message: 'Profile updated.', data: { user: rows[0] } });
  } catch (err) { next(err); }
};

// GET /api/users/stats
const getStats = async (req, res, next) => {
  try {
    const userId = parseInt(req.headers['x-user-id']);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    // Try Redis first
    const cached = await redis.get(`stats:${userId}`);
    if (cached) return res.status(200).json({ success: true, data: JSON.parse(cached), cached: true });

    const { rows } = await pool.query(
      `SELECT
         COUNT(*)                                          AS total_calculations,
         COUNT(*) FILTER (WHERE operator = '+')           AS additions,
         COUNT(*) FILTER (WHERE operator = '-')           AS subtractions,
         COUNT(*) FILTER (WHERE operator = '*')           AS multiplications,
         COUNT(*) FILTER (WHERE operator = '/')           AS divisions,
         MAX(created_at)                                  AS last_calculation
       FROM calculations WHERE user_id = $1`,
      [userId]
    );

    const stats = {
      total_calculations: parseInt(rows[0].total_calculations),
      by_operation: {
        additions:       parseInt(rows[0].additions),
        subtractions:    parseInt(rows[0].subtractions),
        multiplications: parseInt(rows[0].multiplications),
        divisions:       parseInt(rows[0].divisions),
      },
      last_calculation: rows[0].last_calculation,
    };

    await redis.setex(`stats:${userId}`, 120, JSON.stringify(stats));
    return res.status(200).json({ success: true, data: stats });
  } catch (err) { next(err); }
};

module.exports = { getProfile, updateProfile, getStats };
