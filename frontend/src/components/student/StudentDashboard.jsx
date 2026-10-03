import React, { useState } from 'react';
import { 
  Plus, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  FileText, 
  Eye, 
  Sparkles,
  Inbox
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import ApplyLeaveModal from './ApplyLeaveModal';
import LeaveDetailsModal from '../common/LeaveDetailsModal';

export default function StudentDashboard({ user, leaves, stats, onRefresh }) {
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const filteredLeaves = leaves.filter(l => {
    if (filter === 'ALL') return true;
    return l.status === filter;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Student Leave Portal</h1>
          <p>Welcome, {user.name} ({user.reg_number}) &bull; Department of {user.department}</p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setIsApplyOpen(true)}
        >
          <Plus size={18} />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Applied</span>
            <span className="stat-value">{stats?.total || leaves.length}</span>
          </div>
          <div className="stat-icon total">
            <Calendar size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Awaiting Verification</span>
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
            <span className="stat-label">Sanctioned & Approved</span>
            <span className="stat-value" style={{ color: '#059669' }}>
              {stats?.approved || 0}
            </span>
          </div>
          <div className="stat-icon approved">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Leave Applications Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <FileText size={18} color="#4f46e5" />
            <span>My Leave Applications</span>
          </div>

          <div className="filter-group">
            <select 
              className="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_TUTOR">Awaiting Physical Verification</option>
              <option value="FORWARDED_TO_PRINCIPAL">Forwarded to Principal</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED_BY_TUTOR">Rejected by Tutor</option>
              <option value="REJECTED_BY_PRINCIPAL">Rejected by Principal</option>
            </select>
          </div>
        </div>

        {filteredLeaves.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Inbox size={28} />
            </div>
            <h3>No Leave Applications Found</h3>
            <p>You haven't submitted any leave requests matching the current filter.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setIsApplyOpen(true)}>
              <Plus size={14} />
              <span>Apply for New Leave</span>
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Category</th>
                  <th>Dates & Duration</th>
                  <th>Reason</th>
                  <th>Physical Verification</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map(leave => (
                  <tr key={leave.id}>
                    <td>
                      <code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>
                        #{leave.id.slice(-6)}
                      </code>
                    </td>
                    <td>
                      <span className="leave-type-badge">{leave.leave_type}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {leave.total_days} Day{leave.total_days > 1 ? 's' : ''}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {leave.start_date} to {leave.end_date}
                      </div>
                    </td>
                    <td style={{ maxWidth: '260px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#334155' }}>
                        {leave.reason}
                      </div>
                    </td>
                    <td>
                      {leave.is_physically_verified ? (
                        <span className="verif-badge verified">
                          ✓ Verified ({leave.verification_mode || 'In-Person'})
                        </span>
                      ) : (
                        <span className="verif-badge pending">
                          ⏱ Awaiting Tutor Check
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={leave.status} />
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedLeaveId(leave.id)}
                      >
                        <Eye size={14} />
                        <span>Timeline</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      <ApplyLeaveModal 
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        onSuccess={onRefresh}
      />

      {/* Details / Timeline Modal */}
      <LeaveDetailsModal 
        isOpen={!!selectedLeaveId}
        leaveId={selectedLeaveId}
        onClose={() => setSelectedLeaveId(null)}
      />
    </div>
  );
}
