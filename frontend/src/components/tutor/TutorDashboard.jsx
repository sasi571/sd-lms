import React, { useState } from 'react';
import { 
  UserCheck, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Eye, 
  ShieldAlert, 
  CheckSquare,
  Users
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import PhysicalVerificationModal from './PhysicalVerificationModal';
import LeaveDetailsModal from '../common/LeaveDetailsModal';

export default function TutorDashboard({ user, leaves, stats, onRefresh }) {
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedDetailsId, setSelectedDetailsId] = useState(null);
  const [filter, setFilter] = useState('PENDING_TUTOR'); // default to pending verification queue

  const filteredLeaves = leaves.filter(l => {
    if (filter === 'ALL') return true;
    return l.status === filter;
  });

  const handleOpenVerify = (leave) => {
    setSelectedLeave(leave);
    setIsVerifyModalOpen(true);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Tutor Verification Desk</h1>
          <p>
            {user.name} &bull; Department of {user.department} &bull; Physical Verification Authority
          </p>
        </div>

        <div style={{ background: '#ede9fe', padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #ddd6fe' }}>
          <UserCheck size={18} color="#7c3aed" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#5b21b6' }}>
            Verification Rule: In-person check or parent confirmation required before forwarding
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-info">
            <span className="stat-label">Needs Physical Check</span>
            <span className="stat-value" style={{ color: '#d97706' }}>
              {stats?.pending_tutor || 0}
            </span>
          </div>
          <div className="stat-icon pending">
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Forwarded to Principal</span>
            <span className="stat-value" style={{ color: '#7c3aed' }}>
              {stats?.forwarded_to_principal || 0}
            </span>
          </div>
          <div className="stat-icon forwarded">
            <Send size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Sanctioned Leaves</span>
            <span className="stat-value" style={{ color: '#059669' }}>
              {stats?.approved || 0}
            </span>
          </div>
          <div className="stat-icon approved">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Department Leaves</span>
            <span className="stat-value">
              {stats?.total || leaves.length}
            </span>
          </div>
          <div className="stat-icon total">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Requests Queue Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <CheckSquare size={18} color="#7c3aed" />
            <span>Student Verification Roster</span>
          </div>

          <div className="filter-group">
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Filter View:</span>
            <select 
              className="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="PENDING_TUTOR">Action Required: Awaiting Verification ({stats?.pending_tutor || 0})</option>
              <option value="FORWARDED_TO_PRINCIPAL">Forwarded to Principal ({stats?.forwarded_to_principal || 0})</option>
              <option value="APPROVED">Approved by Principal ({stats?.approved || 0})</option>
              <option value="REJECTED_BY_TUTOR">Rejected by Tutor ({stats?.rejected_by_tutor || 0})</option>
              <option value="ALL">All Applications</option>
            </select>
          </div>
        </div>

        {filteredLeaves.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <CheckCircle2 size={28} />
            </div>
            <h3>Queue is Clear!</h3>
            <p>There are no leave requests currently matching this filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Category</th>
                  <th>Dates & Days</th>
                  <th>Student's Reason</th>
                  <th>Physical Verification</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map(leave => (
                  <tr key={leave.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{leave.student_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Roll: {leave.student_reg_number} &bull; #{leave.id.slice(-6)}
                      </div>
                    </td>
                    <td>
                      <span className="leave-type-badge">{leave.leave_type}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {leave.total_days} Day{leave.total_days > 1 ? 's' : ''}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {leave.start_date} to {leave.end_date}
                      </div>
                    </td>
                    <td style={{ maxWidth: '240px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#334155' }}>
                        "{leave.reason}"
                      </div>
                    </td>
                    <td>
                      {leave.is_physically_verified ? (
                        <div>
                          <span className="verif-badge verified">
                            ✓ Verified ({leave.verification_mode || 'In-Person'})
                          </span>
                          {leave.verification_remarks && (
                            <div style={{ fontSize: '0.7rem', color: '#15803d', marginTop: '2px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              "{leave.verification_remarks}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="verif-badge pending">
                          ⚠️ Action Required
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={leave.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        {leave.status === 'PENDING_TUTOR' && (
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpenVerify(leave)}
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)' }}
                          >
                            <UserCheck size={14} />
                            <span>Verify & Forward</span>
                          </button>
                        )}
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedDetailsId(leave.id)}
                        >
                          <Eye size={14} />
                          <span>Dossier</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Physical Verification Modal */}
      <PhysicalVerificationModal 
        isOpen={isVerifyModalOpen}
        leave={selectedLeave}
        onClose={() => {
          setIsVerifyModalOpen(false);
          setSelectedLeave(null);
        }}
        onSuccess={onRefresh}
      />

      {/* Details Modal */}
      <LeaveDetailsModal 
        isOpen={!!selectedDetailsId}
        leaveId={selectedDetailsId}
        onClose={() => setSelectedDetailsId(null)}
      />
    </div>
  );
}
