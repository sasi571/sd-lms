const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const bcrypt = require('bcryptjs');

const dbDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'leave_system.db');
const db = new DatabaseSync(dbPath);

// Enable foreign key constraints
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('STUDENT', 'TUTOR', 'PRINCIPAL', 'ADMIN')),
      department TEXT NOT NULL,
      reg_number TEXT,
      tutor_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      leave_type TEXT NOT NULL CHECK(leave_type IN ('MEDICAL', 'CASUAL', 'ACADEMIC', 'EMERGENCY', 'DUTY')),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_days INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING_TUTOR' CHECK(
        status IN (
          'PENDING_TUTOR',
          'REJECTED_BY_TUTOR',
          'FORWARDED_TO_PRINCIPAL',
          'APPROVED',
          'REJECTED_BY_PRINCIPAL'
        )
      ),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS physical_verifications (
      id TEXT PRIMARY KEY,
      leave_id TEXT UNIQUE NOT NULL,
      tutor_id TEXT NOT NULL,
      is_physically_verified INTEGER NOT NULL DEFAULT 0,
      verification_mode TEXT CHECK(verification_mode IN ('IN_PERSON', 'PARENT_CALL', 'MEDICAL_SLIP', 'OTHER')),
      remarks TEXT NOT NULL,
      verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (leave_id) REFERENCES leave_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (tutor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS leave_audit_logs (
      id TEXT PRIMARY KEY,
      leave_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (leave_id) REFERENCES leave_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (actor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      leave_id TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (leave_id) REFERENCES leave_requests(id) ON DELETE SET NULL
    );
  `);

  seedData();
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return;

  console.log('Seeding initial Leave Management System database...');

  const tutorHash = bcrypt.hashSync('tutor123', 10);
  const studentHash = bcrypt.hashSync('student123', 10);
  const principalHash = bcrypt.hashSync('principal123', 10);
  const adminHash = bcrypt.hashSync('admin123', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, department, reg_number, tutor_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 1. Tutor
  const tutorId = 'usr-tutor-arvind';
  insertUser.run(tutorId, 'arvind@college.edu', tutorHash, 'Prof. Arvind Kumar', 'TUTOR', 'Computer Science & Engineering', 'EMP-CS-102', null);

  // 2. Principal
  const principalId = 'usr-principal-raman';
  insertUser.run(principalId, 'principal@college.edu', principalHash, 'Dr. K. Ramanathan', 'PRINCIPAL', 'Administration', 'EMP-ADM-001', null);

  // 3. Admin
  const adminId = 'usr-admin-system';
  insertUser.run(adminId, 'admin@college.edu', adminHash, 'System Administrator', 'ADMIN', 'Administration', 'EMP-ADM-999', null);

  // 4. Students
  const student1Id = 'usr-std-rahul';
  insertUser.run(student1Id, 'rahul@college.edu', studentHash, 'Rahul Sharma', 'STUDENT', 'Computer Science & Engineering', '2024-CS-042', tutorId);

  const student2Id = 'usr-std-priya';
  insertUser.run(student2Id, 'priya@college.edu', studentHash, 'Priya Patel', 'STUDENT', 'Computer Science & Engineering', '2024-CS-055', tutorId);

  // Pre-seed illustrative leave requests for immediate end-to-end evaluation:
  const insertLeave = db.prepare(`
    INSERT INTO leave_requests (id, student_id, leave_type, start_date, end_date, total_days, reason, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const insertAudit = db.prepare(`
    INSERT INTO leave_audit_logs (id, leave_id, actor_id, actor_role, action, remarks, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const insertVerification = db.prepare(`
    INSERT INTO physical_verifications (id, leave_id, tutor_id, is_physically_verified, verification_mode, remarks, verified_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const insertNotification = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, leave_id, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  // Leave 1: PENDING_TUTOR (Ready for Tutor Arvind to physically verify & forward)
  const leave1Id = 'leave-demo-101';
  insertLeave.run(leave1Id, student1Id, 'ACADEMIC', '2026-10-10', '2026-10-12', 3, 'Presenting research paper on Distributed Systems at IEEE College Conference', 'PENDING_TUTOR', '-2 hours');
  insertAudit.run('aud-101-1', leave1Id, student1Id, 'STUDENT', 'SUBMIT', 'Leave request submitted to Class Tutor for verification', '-2 hours');
  insertNotification.run('notif-101-1', tutorId, 'New Leave Awaiting Verification', 'Student Rahul Sharma applied for 3 days Academic Leave', leave1Id, 0, '-2 hours');

  // Leave 2: FORWARDED_TO_PRINCIPAL (Tutor has physically verified, ready for Principal Ramanathan to approve)
  const leave2Id = 'leave-demo-102';
  insertLeave.run(leave2Id, student2Id, 'MEDICAL', '2026-10-05', '2026-10-08', 4, 'Viral fever recovery as advised by campus medical officer', 'FORWARDED_TO_PRINCIPAL', '-1 days');
  insertAudit.run('aud-102-1', leave2Id, student2Id, 'STUDENT', 'SUBMIT', 'Leave application initiated by student', '-1 days');
  insertVerification.run('ver-102', leave2Id, tutorId, 1, 'MEDICAL_SLIP', 'Verified clinic medical certificate and spoke with parent on phone.', '-18 hours');
  insertAudit.run('aud-102-2', leave2Id, tutorId, 'TUTOR', 'TUTOR_VERIFY_AND_FORWARD', 'Physical verification completed with valid medical slip. Forwarded to Principal for final sanction.', '-18 hours');
  insertNotification.run('notif-102-1', principalId, 'Leave Request Forwarded', 'Prof. Arvind Kumar forwarded Priya Patel\'s Medical Leave request for your approval', leave2Id, 0, '-18 hours');

  // Leave 3: APPROVED (Completed lifecycle)
  const leave3Id = 'leave-demo-103';
  insertLeave.run(leave3Id, student1Id, 'CASUAL', '2026-09-20', '2026-09-21', 2, 'Attending family wedding ceremony', 'APPROVED', '-10 days');
  insertAudit.run('aud-103-1', leave3Id, student1Id, 'STUDENT', 'SUBMIT', 'Leave applied', '-10 days');
  insertVerification.run('ver-103', leave3Id, tutorId, 1, 'PARENT_CALL', 'Spoke to father over phone and confirmed dates.', '-9 days');
  insertAudit.run('aud-103-2', leave3Id, tutorId, 'TUTOR', 'TUTOR_VERIFY_AND_FORWARD', 'Verified with parents. Recommended.', '-9 days');
  insertAudit.run('aud-103-3', leave3Id, principalId, 'PRINCIPAL', 'PRINCIPAL_APPROVE', 'Sanctioned Casual Leave.', '-8 days');
  insertNotification.run('notif-103-1', student1Id, 'Leave Request Approved! 🎉', 'Your Casual Leave request #leave-demo-103 has been sanctioned by Principal Dr. K. Ramanathan.', leave3Id, 1, '-8 days');

  console.log('Seed data successfully populated!');
}

initializeDatabase();

module.exports = db;
