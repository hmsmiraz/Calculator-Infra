const { validationResult } = require('express-validator');
const UserModel            = require('../models/user.model');
const { generateToken }    = require('../utils/jwt.utils');
const redis                = require('../config/redis');

const validationFailed = (res, errors) =>
  res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors:  errors.array().map((e) => ({ field: e.path, message: e.msg })),
  });

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return validationFailed(res, errors);

    const { name, email, password } = req.body;

    const existing = await UserModel.findByEmail(email);
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const user  = await UserModel.create({ name, email, password });
    const token = generateToken({ id: user.id, email: user.email });

    // Cache user session in Redis (TTL 7 days)
    await redis.setex(`session:${user.id}`, 60 * 60 * 24 * 7, JSON.stringify(user));

    return res.status(201).json({ success: true, message: 'Account created.', data: { user, token } });
  } catch (err) { next(err); }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return validationFailed(res, errors);

    const { email, password } = req.body;
    const user = await UserModel.findByEmail(email);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const match = await UserModel.comparePassword(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const token = generateToken({ id: user.id, email: user.email });
    const { password: _pw, ...safeUser } = user;

    // Cache user session in Redis
    await redis.setex(`session:${user.id}`, 60 * 60 * 24 * 7, JSON.stringify(safeUser));

    return res.status(200).json({ success: true, message: 'Logged in.', data: { user: safeUser, token } });
  } catch (err) { next(err); }
};

// GET /api/auth/me  (x-user-id header set by gateway)
const getMe = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    // Try Redis cache first
    const cached = await redis.get(`session:${userId}`);
    if (cached) {
      return res.status(200).json({ success: true, data: { user: JSON.parse(cached) } });
    }

    // Fall back to DB
    const user = await UserModel.findById(parseInt(userId));
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await redis.setex(`session:${userId}`, 60 * 60 * 24 * 7, JSON.stringify(user));
    return res.status(200).json({ success: true, data: { user } });
  } catch (err) { next(err); }
};

module.exports = { register, login, getMe };
