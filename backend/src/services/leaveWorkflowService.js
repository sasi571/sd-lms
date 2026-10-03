const db = require('../db');
const { randomUUID } = require('node:crypto');
const notificationService = require('./notificationService');

class LeaveWorkflowService {
  /**
   * Calculate business days or calendar days between start and end
   */
  calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }

  /**
   * Student creates a new leave application
   */
  createLeave(student, payload) {
    const { leave_type, start_date, end_date, reason } = payload;

    if (!leave_type || !start_date || !end_date || !reason) {
      throw new Error('All fields (leave_type, start_date, end_date, reason) are required');
    }

    const totalDays = this.calculateDays(start_date, end_date);
    if (totalDays <= 0) {
      throw new Error('End date must be greater than or equal to start date');
    }

    const leaveId = 'leave-' + randomUUID().slice(0, 8);

    const insertLeave = db.prepare(`
      INSERT INTO leave_requests (id, student_id, leave_type, start_date, end_date, total_days, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING_TUTOR')
    `);
    insertLeave.run(leaveId, student.id, leave_type, start_date, end_date, totalDays, reason.trim());

    // Record Audit Log
    const auditId = 'aud-' + randomUUID().slice(0, 8);
    db.prepare(`
      INSERT INTO leave_audit_logs (id, leave_id, actor_id, actor_role, action, remarks)
      VALUES (?, ?, ?, 'STUDENT', 'SUBMIT', ?)
    `).run(auditId, leaveId, student.id, 'Leave application submitted to Tutor for physical verification');

    // Notify assigned tutor
    const studentUser = db.prepare('SELECT tutor_id, name FROM users WHERE id = ?').get(student.id);
    if (studentUser && studentUser.tutor_id) {
      notificationService.notifyUser(
        studentUser.tutor_id,
        'New Leave Application Awaiting Verification',
        `${studentUser.name} submitted a ${leave_type} leave request (${totalDays} days) awaiting your physical verification.`,
        leaveId
      );
    } else {
      notificationService.notifyRole(
        'TUTOR',
        'New Leave Application Awaiting Verification',
        `${student.name} submitted a ${leave_type} leave request awaiting physical verification.`,
        leaveId
      );
    }

    return this.getLeaveById(leaveId);
  }

  /**
   * Retrieve single leave with student info, verification data, and audit history
   */
  getLeaveById(id) {
    const leave = db.prepare(`
      SELECT 
        l.*,
        u.name AS student_name,
        u.email AS student_email,
        u.reg_number AS student_reg_number,
        u.department AS student_department,
        t.name AS tutor_name
      FROM leave_requests l
      JOIN users u ON l.student_id = u.id
      LEFT JOIN users t ON u.tutor_id = t.id
      WHERE l.id = ?
    `).get(id);

    if (!leave) return null;

    // Fetch physical verification details if available
    const verification = db.prepare(`
      SELECT pv.*, u.name AS tutor_name
      FROM physical_verifications pv
      JOIN users u ON pv.tutor_id = u.id
      WHERE pv.leave_id = ?
    `).get(id);

    // Fetch audit timeline
    const auditLogs = db.prepare(`
      SELECT al.*, u.name AS actor_name
      FROM leave_audit_logs al
      JOIN users u ON al.actor_id = u.id
      WHERE al.leave_id = ?
      ORDER BY al.created_at ASC
    `).all(id);

    return {
      ...leave,
      physical_verification: verification || null,
      audit_logs: auditLogs || []
    };
  }

  /**
   * List leaves according to user's RBAC scope
   */
  listLeaves(user, filters = {}) {
    let sql = `
      SELECT 
        l.*,
        u.name AS student_name,
        u.email AS student_email,
        u.reg_number AS student_reg_number,
        u.department AS student_department,
        pv.is_physically_verified,
        pv.verification_mode,
        pv.remarks AS verification_remarks
      FROM leave_requests l
      JOIN users u ON l.student_id = u.id
      LEFT JOIN physical_verifications pv ON l.id = pv.leave_id
      WHERE 1=1
    `;
    const params = [];

    // RBAC Filter:
    if (user.role === 'STUDENT') {
      sql += ' AND l.student_id = ?';
      params.push(user.id);
    } else if (user.role === 'TUTOR') {
      // Tutor sees students assigned to them, or students in their department
      sql += ' AND (u.tutor_id = ? OR u.department = ?)';
      params.push(user.id, user.department);
    } else if (user.role === 'PRINCIPAL') {
      // Principal sees forwarded leaves by default, or all leaves if queried
      if (filters.status) {
        sql += ' AND l.status = ?';
        params.push(filters.status);
      }
    }

    if (filters.status && user.role !== 'PRINCIPAL') {
      sql += ' AND l.status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY l.created_at DESC';

    const leaves = db.prepare(sql).all(...params);
    return leaves;
  }

  /**
   * Tutor Review Step:
   * Requires physical verification before forwarding to Principal!
   */
  processTutorAction(tutor, leaveId, payload) {
    const { action, is_physically_verified, verification_mode, remarks } = payload;

    const leave = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(leaveId);
    if (!leave) throw new Error('Leave request not found');

    if (leave.status !== 'PENDING_TUTOR') {
      throw new Error(`Cannot process leave in current status: ${leave.status}. Only PENDING_TUTOR leaves can be reviewed by Tutor.`);
    }

    const student = db.prepare('SELECT * FROM users WHERE id = ?').get(leave.student_id);

    if (action === 'FORWARD') {
      // RBAC & Business Requirement: Physical verification must be checked and confirmed!
      if (!is_physically_verified) {
        throw new Error('Physical verification is required before forwarding leave request to Principal.');
      }
      if (!remarks || remarks.trim().length === 0) {
        throw new Error('Tutor remarks/reason are required for physical verification.');
      }

      const verId = 'ver-' + randomUUID().slice(0, 8);
      // Upsert physical verification
      db.prepare(`
        INSERT INTO physical_verifications (id, leave_id, tutor_id, is_physically_verified, verification_mode, remarks)
        VALUES (?, ?, ?, 1, ?, ?)
        ON CONFLICT(leave_id) DO UPDATE SET
          is_physically_verified = 1,
          verification_mode = excluded.verification_mode,
          remarks = excluded.remarks,
          verified_at = CURRENT_TIMESTAMP
      `).run(verId, leaveId, tutor.id, verification_mode || 'IN_PERSON', remarks.trim());

      // Update leave status to FORWARDED_TO_PRINCIPAL
      db.prepare(`
        UPDATE leave_requests 
        SET status = 'FORWARDED_TO_PRINCIPAL', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(leaveId);

      // Audit Log
      db.prepare(`
        INSERT INTO leave_audit_logs (id, leave_id, actor_id, actor_role, action, remarks)
        VALUES (?, ?, ?, 'TUTOR', 'TUTOR_VERIFY_AND_FORWARD', ?)
      `).run(
        'aud-' + randomUUID().slice(0, 8),
        leaveId,
        tutor.id,
        `Physically verified via [${verification_mode || 'IN_PERSON'}]. Remarks: ${remarks.trim()}. Forwarded to Principal.`
      );

      // Notify Principal
      notificationService.notifyRole(
        'PRINCIPAL',
        'Leave Request Forwarded by Tutor',
        `Tutor ${tutor.name} has physically verified and forwarded leave request for ${student.name} (${leave.total_days} days).`,
        leaveId
      );

      // Notify Student of progress
      notificationService.notifyUser(
        student.id,
        'Physical Verification Completed',
        `Your tutor ${tutor.name} has completed physical verification and forwarded your request to the Principal.`,
        leaveId
      );

    } else if (action === 'REJECT') {
      if (!remarks || remarks.trim().length === 0) {
        throw new Error('Reason for rejection is mandatory.');
      }

      // Record rejection verification record if provided
      const verId = 'ver-' + randomUUID().slice(0, 8);
      db.prepare(`
        INSERT INTO physical_verifications (id, leave_id, tutor_id, is_physically_verified, verification_mode, remarks)
        VALUES (?, ?, ?, 0, ?, ?)
        ON CONFLICT(leave_id) DO UPDATE SET
          is_physically_verified = 0,
          remarks = excluded.remarks,
          verified_at = CURRENT_TIMESTAMP
      `).run(verId, leaveId, tutor.id, verification_mode || 'OTHER', remarks.trim());

      // Update leave status to REJECTED_BY_TUTOR
      db.prepare(`
        UPDATE leave_requests 
        SET status = 'REJECTED_BY_TUTOR', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(leaveId);

      // Audit Log
      db.prepare(`
        INSERT INTO leave_audit_logs (id, leave_id, actor_id, actor_role, action, remarks)
        VALUES (?, ?, ?, 'TUTOR', 'TUTOR_REJECT', ?)
      `).run(
        'aud-' + randomUUID().slice(0, 8),
        leaveId,
        tutor.id,
        `Rejected by Tutor. Reason: ${remarks.trim()}`
      );

      // Notify Student
      notificationService.notifyUser(
        student.id,
        'Leave Application Rejected by Tutor',
        `Your tutor ${tutor.name} rejected your leave request: "${remarks.trim()}".`,
        leaveId
      );
    } else {
      throw new Error(`Invalid action: ${action}. Allowed: 'FORWARD' or 'REJECT'`);
    }

    return this.getLeaveById(leaveId);
  }

  /**
   * Principal Decision Step:
   * Reviews forwarded requests and gives final APPROVE or REJECT.
   * Student is notified upon decision!
   */
  processPrincipalAction(principal, leaveId, payload) {
    const { action, remarks } = payload;

    const leave = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(leaveId);
    if (!leave) throw new Error('Leave request not found');

    if (leave.status !== 'FORWARDED_TO_PRINCIPAL') {
      throw new Error(`Cannot process leave in current status: ${leave.status}. Only FORWARDED_TO_PRINCIPAL leaves can be decided by Principal.`);
    }

    const student = db.prepare('SELECT * FROM users WHERE id = ?').get(leave.student_id);

    if (action === 'APPROVE') {
      const decisionRemarks = (remarks && remarks.trim().length > 0) ? remarks.trim() : 'Sanctioned by Principal';

      db.prepare(`
        UPDATE leave_requests 
        SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(leaveId);

      // Audit Log
      db.prepare(`
        INSERT INTO leave_audit_logs (id, leave_id, actor_id, actor_role, action, remarks)
        VALUES (?, ?, ?, 'PRINCIPAL', 'PRINCIPAL_APPROVE', ?)
      `).run(
        'aud-' + randomUUID().slice(0, 8),
        leaveId,
        principal.id,
        decisionRemarks
      );

      // Notify Student immediately
      notificationService.notifyUser(
        student.id,
        '🎉 Leave Request Approved!',
        `Your ${leave.leave_type} leave request (${leave.start_date} to ${leave.end_date}) has been APPROVED by Principal ${principal.name}. ${decisionRemarks ? `Note: "${decisionRemarks}"` : ''}`,
        leaveId
      );

    } else if (action === 'REJECT') {
      if (!remarks || remarks.trim().length === 0) {
        throw new Error('Principal remarks/reason are required when rejecting a leave request.');
      }

      db.prepare(`
        UPDATE leave_requests 
        SET status = 'REJECTED_BY_PRINCIPAL', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(leaveId);

      // Audit Log
      db.prepare(`
        INSERT INTO leave_audit_logs (id, leave_id, actor_id, actor_role, action, remarks)
        VALUES (?, ?, ?, 'PRINCIPAL', 'PRINCIPAL_REJECT', ?)
      `).run(
        'aud-' + randomUUID().slice(0, 8),
        leaveId,
        principal.id,
        `Rejected by Principal. Reason: ${remarks.trim()}`
      );

      // Notify Student
      notificationService.notifyUser(
        student.id,
        'Leave Request Rejected by Principal',
        `Your leave request was rejected by Principal ${principal.name}. Reason: "${remarks.trim()}"`,
        leaveId
      );

    } else {
      throw new Error(`Invalid action: ${action}. Allowed: 'APPROVE' or 'REJECT'`);
    }

    return this.getLeaveById(leaveId);
  }
}

module.exports = new LeaveWorkflowService();
