import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle2, ShieldCheck, UserCheck, Calendar, Clock, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import StatusBadge from './StatusBadge';
import LeaveTimeline from './LeaveTimeline';

export default function LeaveDetailsModal({ isOpen, onClose, leaveId }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && leaveId) {
      setLoading(true);
      setError('');
      api.getLeaveById(leaveId)
        .then(res => setDetails(res.leave))
        .catch(err => setError(err.message || 'Failed to fetch details'))
        .finally(() => setLoading(false));
    } else {
      setDetails(null);
    }
  }, [isOpen, leaveId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-dialog large">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#e0e7ff', padding: '6px', borderRadius: '8px', color: '#4338ca' }}>
              <FileText size={20} />
            </div>
            <div>
              <h3>Leave Request Dossier</h3>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Reference ID: #{leaveId}</div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Loading complete leave history...
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '8px', color: '#b91c1c' }}>
              {error}
            </div>
          )}

          {details && (
            <>
              {/* Header Status & Timeline */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', marginRight: '8px' }}>Current State:</span>
                  <StatusBadge status={details.status} />
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Submitted on {new Date(details.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Visual Progress Stepper */}
              <LeaveTimeline status={details.status} />

              {/* Applicant & Request Details Grid */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', margin: '20px 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Student</span>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{details.student_name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Roll: {details.student_reg_number}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Dept: {details.student_department}</div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Leave Info</span>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{details.leave_type} LEAVE</div>
                    <div style={{ fontSize: '0.82rem', color: '#4f46e5', fontWeight: 600 }}>{details.total_days} Day(s) Total</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{details.start_date} to {details.end_date}</div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Tutor</span>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{details.tutor_name || 'Prof. Arvind Kumar'}</div>
                    <div style={{ fontSize: '0.78rem', color: '#059669' }}>
                      {details.physical_verification?.is_physically_verified ? '✓ Physically Verified' : 'Awaiting Check'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Applicant's Statement</span>
                  <div style={{ fontSize: '0.88rem', color: '#1e293b', marginTop: '4px', background: '#ffffff', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    "{details.reason}"
                  </div>
                </div>
              </div>

              {/* Physical Verification Record (If available) */}
              {details.physical_verification && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#166534', fontSize: '0.9rem' }}>
                      Physical Verification Record
                    </span>
                    <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      Mode: {details.physical_verification.verification_mode}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#14532d' }}>
                    <strong>Verification Remarks:</strong> "{details.physical_verification.remarks}"
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#15803d', marginTop: '4px' }}>
                    Verified by {details.physical_verification.tutor_name} at {new Date(details.physical_verification.verified_at).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Audit Trail Timeline */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Workflow Audit Trail
                </h4>
                <div className="audit-list">
                  {details.audit_logs && details.audit_logs.map(log => (
                    <div key={log.id} className="audit-entry">
                      <div className="audit-actor">
                        <span>{log.actor_name}</span>
                        <span className="audit-role">{log.actor_role}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>
                          &bull; Action: {log.action}
                        </span>
                      </div>
                      <div className="audit-remarks">
                        {log.remarks}
                      </div>
                      <div className="audit-time">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
