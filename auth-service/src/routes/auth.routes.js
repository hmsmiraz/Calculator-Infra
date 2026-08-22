const express = require('express');
const router  = express.Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const { body } = require('express-validator');

const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }),
  body('email').trim().isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
];

const validateLogin = [
  body('email').trim().isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
];

router.post('/register', validateRegister, register);
router.post('/login',    validateLogin,    login);
router.get('/me',        getMe);

module.exports = router;
