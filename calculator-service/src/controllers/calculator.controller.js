const { validationResult } = require('express-validator');
const { calculate }        = require('../utils/calculator.utils');
const CalculationModel     = require('../models/calculation.model');
const redis                = require('../config/redis');

const HISTORY_CACHE_TTL = 60; // seconds

const validationFailed = (res, errors) =>
  res.status(400).json({ success: false, message: 'Validation failed',
    errors: errors.array().map((e) => ({ field: e.path, message: e.msg })) });

// POST /api/calculator/calculate
const calculateHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return validationFailed(res, errors);

    const userId = parseInt(req.headers['x-user-id']);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const { a, b, operator } = req.body;
    const numA = Number(a), numB = Number(b);

    const { result, expression, operation } = calculate(numA, numB, operator);

    const saved = await CalculationModel.create({
      userId, operandA: numA, operandB: numB, operator, result, expression, operation,
    });

    // Invalidate history cache for this user
    await redis.del(`history:${userId}`);

    return res.status(200).json({
      success: true,
      data: { id: saved.id, result, expression, operation, timestamp: saved.created_at },
    });
  } catch (err) { next(err); }
};

// GET /api/calculator/history
const getHistory = async (req, res, next) => {
  try {
    const userId = parseInt(req.headers['x-user-id']);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const page   = Math.max(1, parseInt(req.query.page  || '1', 10));
    const limit  = Math.min(50, parseInt(req.query.limit || '20', 10));
    const offset = (page - 1) * limit;

    // Try Redis cache (only page 1, default limit)
    if (page === 1 && limit === 20) {
      const cached = await redis.get(`history:${userId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return res.status(200).json({ success: true, data: parsed, cached: true });
      }
    }

    const [rows, total] = await Promise.all([
      CalculationModel.findByUserId(userId, { limit, offset }),
      CalculationModel.countByUserId(userId),
    ]);

    const data = {
      calculations: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };

    // Cache page 1
    if (page === 1 && limit === 20) {
      await redis.setex(`history:${userId}`, HISTORY_CACHE_TTL, JSON.stringify(data));
    }

    return res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

// DELETE /api/calculator/history
const clearHistory = async (req, res, next) => {
  try {
    const userId = parseInt(req.headers['x-user-id']);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const deleted = await CalculationModel.deleteAllByUserId(userId);
    await redis.del(`history:${userId}`);

    return res.status(200).json({ success: true, message: `${deleted} calculation(s) deleted.` });
  } catch (err) { next(err); }
};

// DELETE /api/calculator/history/:id
const deleteHistoryEntry = async (req, res, next) => {
  try {
    const userId = parseInt(req.headers['x-user-id']);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const deleted = await CalculationModel.deleteOne(req.params.id, userId);
    if (!deleted) return res.status(404).json({ success: false, message: 'Entry not found.' });

    await redis.del(`history:${userId}`);
    return res.status(200).json({ success: true, message: 'Entry deleted.' });
  } catch (err) { next(err); }
};

module.exports = { calculateHandler, getHistory, clearHistory, deleteHistoryEntry };
