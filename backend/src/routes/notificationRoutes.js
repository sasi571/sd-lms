const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../auth');

router.use(authenticateToken);

// Get user notifications
router.get('/', (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(req.user.id);
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get unread notification count
router.get('/unread-count', (req, res) => {
  try {
    const result = db.prepare(`
      SELECT COUNT(*) as unread_count 
      FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).get(req.user.id);
    res.json({ unread_count: result ? result.unread_count : 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark single notification as read
router.patch('/:id/read', (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all as read
router.post('/mark-all-read', (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
