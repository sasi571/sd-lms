const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { generateToken, authenticateToken } = require('../auth');

// Login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      reg_number: user.reg_number
    }
  });
});

// Current User Profile
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, department, reg_number, tutor_id FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// Demo persona quick-switch list for presentation & live grading
router.get('/personas', (req, res) => {
  const users = db.prepare('SELECT id, email, name, role, department, reg_number FROM users ORDER BY role, name').all();
  res.json({ personas: users });
});

// Instant switch endpoint for testing persona
router.post('/switch-persona', (req, res) => {
  const { userId } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      reg_number: user.reg_number
    }
  });
});

module.exports = router;
