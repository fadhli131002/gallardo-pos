const express = require('express');
const router = express.Router();
const { login, getMe } = require('./auth.controller');
const { authenticateToken } = require('../../middlewares/authMiddleware');

router.post('/login', login);
router.get('/me', authenticateToken, getMe);

module.exports = router;
