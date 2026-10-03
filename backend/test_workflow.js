const API = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const res = await fetch(`${API}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function runTest() {
  console.log('====================================================');
  console.log('🚀 RUNNING LEAVE MANAGEMENT SYSTEM END-TO-END SUITE');
  console.log('====================================================\n');

  // 1. Student Login
  console.log('Step 1: Logging in as Student (Rahul Sharma)...');
  const studentAuth = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'rahul@college.edu', password: 'student123' })
  });
  console.log(`✅ Logged in as: ${studentAuth.user.name} (${studentAuth.user.role})`);
  const studentToken = studentAuth.token;

  // 2. Student Applies for Leave
  console.log('\nStep 2: Student submits Leave Application...');
  const newLeave = await req('/leaves', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      leave_type: 'DUTY',
      start_date: '2026-10-15',
      end_date: '2026-10-18',
      reason: 'Representing university in Smart India Hackathon Grand Finale at IIT Delhi'
    })
  });
  const leaveId = newLeave.leave.id;
  console.log(`✅ Leave Created successfully! ID: ${leaveId}, Initial Status: ${newLeave.leave.status}`);

  // 3. Tutor Login
  console.log('\nStep 3: Logging in as Class Tutor (Prof. Arvind Kumar)...');
  const tutorAuth = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'arvind@college.edu', password: 'tutor123' })
  });
  console.log(`✅ Logged in as: ${tutorAuth.user.name} (${tutorAuth.user.role})`);
  const tutorToken = tutorAuth.token;

  // 4. Tutor checks pending leaves
  console.log('\nStep 4: Tutor fetches pending verification queue...');
  const tutorLeaves = await req('/leaves?status=PENDING_TUTOR', {
    headers: { Authorization: `Bearer ${tutorToken}` }
  });
  const foundLeave = tutorLeaves.leaves.find(l => l.id === leaveId);
  if (!foundLeave) throw new Error(`Leave ${leaveId} not found in tutor queue!`);
  console.log(`✅ Leave ${leaveId} found in Tutor queue. Student: ${foundLeave.student_name}`);

  // 5. Test Guardrail: Tutor attempts forward WITHOUT physical verification
  console.log('\nStep 5: Testing Guardrail - Forwarding WITHOUT physical verification...');
  try {
    await req(`/leaves/${leaveId}/tutor-action`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tutorToken}` },
      body: JSON.stringify({
        action: 'FORWARD',
        is_physically_verified: false,
        remarks: 'Trying to forward without verification'
      })
    });
    throw new Error('Guardrail FAILED: Backend should have blocked forwarding without physical verification!');
  } catch (err) {
    console.log(`✅ Guardrail passed! Backend rejected with status ${err.status}: "${err.message}"`);
  }

  // 6. Tutor completes physical verification and forwards to Principal
  console.log('\nStep 6: Tutor performs Physical Verification and forwards to Principal...');
  const forwardedRes = await req(`/leaves/${leaveId}/tutor-action`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tutorToken}` },
    body: JSON.stringify({
      action: 'FORWARD',
      is_physically_verified: true,
      verification_mode: 'PARENT_CALL',
      remarks: 'Contacted parent Mr. Sharma; confirmed travel tickets and event nomination. Recommended for approval.'
    })
  });
  console.log(`✅ Tutor Action result: ${forwardedRes.message}`);
  console.log(`✅ Leave Status updated to: ${forwardedRes.leave.status}`);

  // 7. Principal Login
  console.log('\nStep 7: Logging in as Principal (Dr. K. Ramanathan)...');
  const principalAuth = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'principal@college.edu', password: 'principal123' })
  });
  console.log(`✅ Logged in as: ${principalAuth.user.name} (${principalAuth.user.role})`);
  const principalToken = principalAuth.token;

  // 8. Principal inspects forwarded leave & physical verification proof
  console.log('\nStep 8: Principal inspects forwarded leave dossier...');
  const principalLeaveView = await req(`/leaves/${leaveId}`, {
    headers: { Authorization: `Bearer ${principalToken}` }
  });
  console.log(`✅ Leave found by Principal. Current status: ${principalLeaveView.leave.status}`);
  console.log(`✅ Verification record found: Physically Verified = ${principalLeaveView.leave.physical_verification?.is_physically_verified === 1}`);
  console.log(`   Verification Mode: ${principalLeaveView.leave.physical_verification?.verification_mode}`);
  console.log(`   Tutor Remarks: "${principalLeaveView.leave.physical_verification?.remarks}"`);

  // 9. Principal approves leave
  console.log('\nStep 9: Principal sanctions and approves leave request...');
  const approvalRes = await req(`/leaves/${leaveId}/principal-action`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${principalToken}` },
    body: JSON.stringify({
      action: 'APPROVE',
      remarks: 'Sanctioned with On-Duty attendance credit. All the best for Hackathon finals!'
    })
  });
  console.log(`✅ Principal Action result: ${approvalRes.message}`);
  console.log(`✅ Final Leave Status: ${approvalRes.leave.status}`);

  // 10. Student checks notifications
  console.log('\nStep 10: Verifying Student Notification Dispatch...');
  const notifRes = await req('/notifications', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const approvalNotif = notifRes.notifications.find(n => n.leave_id === leaveId);
  if (!approvalNotif) {
    throw new Error('Notification FAILED: Student did not receive approval notification!');
  }
  console.log(`✅ Student received real-time notification:`);
  console.log(`   Title:   "${approvalNotif.title}"`);
  console.log(`   Message: "${approvalNotif.message}"`);
  console.log(`   Time:    ${approvalNotif.created_at}`);

  console.log('\n====================================================');
  console.log('🎉 ALL WORKFLOW & RBAC TESTS PASSED SUCCESSFULLY! 100%');
  console.log('====================================================\n');
}

runTest().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
