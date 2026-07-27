const prisma = require('../../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ success: false, error: 'Username, password, and role are required' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Username atau password salah' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Username atau password salah' });
    }

    if (user.role !== role) {
      const roleNames = {
        'sales': 'Sales Team',
        'finance': 'Finance / Accounting',
        'admin': 'Administrator'
      };
      return res.status(403).json({ success: false, error: `Akun ini tidak memiliki hak akses sebagai ${roleNames[role] || role}` });
    }

    const payload = {
      user_id: user.id,
      name: user.name,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'supersecretkey123', { expiresIn: '1d' });

    res.json({
      success: true,
      data: {
        token,
        user: payload
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const { user_id, id } = req.user || {};
    const userId = user_id || id;
    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true, name: true, username: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User tidak ditemukan' });
    }

    res.json({
      success: true,
      data: {
        user_id: user.id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getMe };
