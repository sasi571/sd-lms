import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Eye, 
  Award,
  Filter
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import PrincipalDecisionModal from './PrincipalDecisionModal';
import LeaveDetailsModal from '../common/LeaveDetailsModal';

export default function PrincipalDashboard({ user, leaves, stats, onRefresh }) {
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [selectedDetailsId, setSelectedDetailsId] = useState(null);
  const [filter, setFilter] = useState('FORWARDED_TO_PRINCIPAL'); // default to pending principal sanction

  const filteredLeaves = leaves.filter(l => {
    if (filter === 'ALL') return true;
    return l.status === filter;
  });

  const handleOpenDecision = (leave) => {
    setSelectedLeave(leave);
    setIsDecisionModalOpen(true);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Principal Executive Sanction Portal</h1>
          <p>
            {user.name} &bull; Institutional Head &bull; Final Decision & Notification Authority
          </p>
        </div>

        <div style={{ background: '#fef3c7', padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #fde68a' }}>
          <ShieldCheck size={18} color="#d97706" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400e' }}>
            Decision triggers instant in-app notification dispatch to the applicant student
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid #7c3aed' }}>
          <div className="stat-info">
            <span className="stat-label">Pending Your Sanction</span>
            <span className="stat-value" style={{ color: '#7c3aed' }}>
              {stats?.forwarded_to_principal || 0}
            </span>
          </div>
          <div className="stat-icon forwarded">
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-info">
            <span className="stat-label">Approved by You</span>
            <span className="stat-value" style={{ color: '#059669' }}>
              {stats?.approved || 0}
            </span>
          </div>
          <div className="stat-icon approved">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="stat-info">
            <span className="stat-label">Rejected by You</span>
            <span className="stat-value" style={{ color: '#dc2626' }}>
              {stats?.rejected_by_principal || 0}
            </span>
          </div>
          <div className="stat-icon rejected">
            <XCircle size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Institution Pipeline</span>
            <span className="stat-value">
              {stats?.total || leaves.length}
            </span>
          </div>
          <div className="stat-icon total">
            <Award size={24} />
          </div>
        </div>
      </div>

      {/* Decision Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <ShieldCheck size={18} color="#d97706" />
            <span>Forwarded Applications Roster</span>
          </div>

          <div className="filter-group">
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Filter:</span>
            <select 
              className="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="FORWARDED_TO_PRINCIPAL">Awaiting My Decision ({stats?.forwarded_to_principal || 0})</option>
              <option value="APPROVED">Sanctioned & Approved ({stats?.approved || 0})</option>
              <option value="REJECTED_BY_PRINCIPAL">Rejected by Principal ({stats?.rejected_by_principal || 0})</option>
              <option value="ALL">All Institute Records</option>
            </select>
          </div>
        </div>

        {filteredLeaves.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={28} />
            </div>
            <h3>No Pending Actions!</h3>
            <p>There are no leave requests awaiting executive sanction under this filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student & Dept</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Tutor Physical Verification</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Executive Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map(leave => (
                  <tr key={leave.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{leave.student_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Roll: {leave.student_reg_number} &bull; {leave.student_department}
                      </div>
                    </td>
                    <td>
                      <span className="leave-type-badge">{leave.leave_type}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {leave.total_days} Day(s)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {leave.start_date} to {leave.end_date}
                      </div>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      {leave.is_physically_verified ? (
                        <div>
                          <span className="verif-badge verified">
                            ✓ Verified via {leave.verification_mode || 'In-Person'}
                          </span>
                          <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '3px' }}>
                            <strong>Tutor Note:</strong> "{leave.verification_remarks || 'Physically checked'}"
                          </div>
                        </div>
                      ) : (
                        <span className="verif-badge pending">
                          ⚠️ Not Verified
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={leave.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        {leave.status === 'FORWARDED_TO_PRINCIPAL' && (
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => handleOpenDecision(leave)}
                          >
                            <ShieldCheck size={14} />
                            <span>Sanction Leave</span>
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

      {/* Principal Decision Modal */}
      <PrincipalDecisionModal 
        isOpen={isDecisionModalOpen}
        leave={selectedLeave}
        onClose={() => {
          setIsDecisionModalOpen(false);
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
