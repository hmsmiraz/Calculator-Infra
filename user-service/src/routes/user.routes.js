const express = require('express');
const router  = express.Router();
const { getProfile, updateProfile, getStats } = require('../controllers/user.controller');

router.get('/profile',   getProfile);
router.patch('/profile', updateProfile);
router.get('/stats',     getStats);

module.exports = router;
