const db = require('../db');
const { randomUUID } = require('node:crypto');

class NotificationService {
  /**
   * Dispatch a notification to a specific user
   */
  notifyUser(userId, title, message, leaveId = null) {
    try {
      const id = 'notif-' + randomUUID().slice(0, 8);
      const stmt = db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, leave_id, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, 0, datetime('now'))
      `);
      stmt.run(id, userId, title, message, leaveId);
      console.log(`[Notification Dispatched] To: ${userId} | ${title}: ${message}`);
      return id;
    } catch (err) {
      console.error('Error dispatching notification:', err);
    }
  }

  /**
   * Dispatch notification to all users matching a role (e.g. all Principals or Tutors)
   */
  notifyRole(role, title, message, leaveId = null) {
    try {
      const users = db.prepare('SELECT id FROM users WHERE role = ?').all(role);
      for (const u of users) {
        this.notifyUser(u.id, title, message, leaveId);
      }
    } catch (err) {
      console.error('Error dispatching role notification:', err);
    }
  }
}

module.exports = new NotificationService();
