const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const { calculateHandler, getHistory, clearHistory, deleteHistoryEntry } = require('../controllers/calculator.controller');

const validateCalculate = [
  body('a').notEmpty().isNumeric().withMessage('"a" must be a number'),
  body('b').notEmpty().isNumeric().withMessage('"b" must be a number'),
  body('operator').isIn(['+','-','*','/']).withMessage('Invalid operator'),
];

router.post('/calculate',     validateCalculate, calculateHandler);
router.get('/history',        getHistory);
router.delete('/history',     clearHistory);
router.delete('/history/:id', deleteHistoryEntry);

module.exports = router;
