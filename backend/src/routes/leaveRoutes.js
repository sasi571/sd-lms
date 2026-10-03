const express = require('express');
const router = express.Router();
const leaveService = require('../services/leaveWorkflowService');
const { authenticateToken, requireRoles } = require('../auth');
const db = require('../db');

// All leave endpoints require authentication
router.use(authenticateToken);

// 1. Student creates leave application
router.post('/', requireRoles('STUDENT'), (req, res) => {
  try {
    const leave = leaveService.createLeave(req.user, req.body);
    res.status(201).json({ message: 'Leave request created successfully', leave });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 2. List leaves (RBAC filtered)
router.get('/', (req, res) => {
  try {
    const filters = {
      status: req.query.status
    };
    const leaves = leaveService.listLeaves(req.user, filters);
    res.json({ leaves });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. System KPI Summary for Dashboards
router.get('/stats/summary', (req, res) => {
  try {
    const role = req.user.role;
    let baseSql = 'SELECT status, COUNT(*) as count FROM leave_requests l JOIN users u ON l.student_id = u.id WHERE 1=1';
    const params = [];

    if (role === 'STUDENT') {
      baseSql += ' AND l.student_id = ?';
      params.push(req.user.id);
    } else if (role === 'TUTOR') {
      baseSql += ' AND (u.tutor_id = ? OR u.department = ?)';
      params.push(req.user.id, req.user.department);
    }

    baseSql += ' GROUP BY status';
    const rows = db.prepare(baseSql).all(...params);

    const summary = {
      total: 0,
      pending_tutor: 0,
      forwarded_to_principal: 0,
      approved: 0,
      rejected_by_tutor: 0,
      rejected_by_principal: 0
    };

    rows.forEach(r => {
      summary.total += r.count;
      if (r.status === 'PENDING_TUTOR') summary.pending_tutor = r.count;
      else if (r.status === 'FORWARDED_TO_PRINCIPAL') summary.forwarded_to_principal = r.count;
      else if (r.status === 'APPROVED') summary.approved = r.count;
      else if (r.status === 'REJECTED_BY_TUTOR') summary.rejected_by_tutor = r.count;
      else if (r.status === 'REJECTED_BY_PRINCIPAL') summary.rejected_by_principal = r.count;
    });

    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get specific leave details by ID
router.get('/:id', (req, res) => {
  try {
    const leave = leaveService.getLeaveById(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });

    // RBAC ownership check for student
    if (req.user.role === 'STUDENT' && leave.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only view your own leave requests' });
    }

    res.json({ leave });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Tutor action: Physical verification + forward/reject
router.post('/:id/tutor-action', requireRoles('TUTOR'), (req, res) => {
  try {
    const updatedLeave = leaveService.processTutorAction(req.user, req.params.id, req.body);
    res.json({
      message: req.body.action === 'FORWARD' 
        ? 'Leave physically verified and successfully forwarded to Principal'
        : 'Leave request rejected by Tutor',
      leave: updatedLeave
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Principal action: Final approve / reject
router.post('/:id/principal-action', requireRoles('PRINCIPAL'), (req, res) => {
  try {
    const updatedLeave = leaveService.processPrincipalAction(req.user, req.params.id, req.body);
    res.json({
      message: req.body.action === 'APPROVE'
        ? 'Leave request approved and student notified'
        : 'Leave request rejected and student notified',
      leave: updatedLeave
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
