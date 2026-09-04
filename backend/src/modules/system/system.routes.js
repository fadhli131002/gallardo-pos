const express = require('express');
const router = express.Router();
const {
  getMaintenanceStatus,
  updateMaintenanceStatus,
  toggleMaintenanceStatus
} = require('./system.controller');

// Opsional: Jika ada middleware auth, kita bisa gunakan untuk menangkap nama user, namun tidak memblokir akses
let optionalAuth = (req, res, next) => next();
try {
  const jwt = require('jsonwebtoken');
  optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123', (err, user) => {
        if (!err && user) {
          req.user = user;
        }
        next();
      });
    } else {
      next();
    }
  };
} catch (e) {
  // Ignore fallback
}

// 1. Cek status maintenance (Publik untuk frontend banner)
router.get('/maintenance', getMaintenanceStatus);

// 2. Update status maintenance (ON / OFF + Pesan)
router.post('/maintenance', optionalAuth, updateMaintenanceStatus);
router.put('/maintenance', optionalAuth, updateMaintenanceStatus);

// 3. Toggle instan status maintenance (ON -> OFF atau OFF -> ON)
router.post('/maintenance/toggle', optionalAuth, toggleMaintenanceStatus);

module.exports = router;
