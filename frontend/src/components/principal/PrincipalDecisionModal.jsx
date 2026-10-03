import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, ShieldCheck, AlertCircle, FileText, Check } from 'lucide-react';
import { api } from '../../services/api';

export default function PrincipalDecisionModal({ isOpen, onClose, leave, onSuccess }) {
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !leave) return null;

  const handleAction = async (action) => {
    setError('');

    if (action === 'REJECT' && !remarks.trim()) {
      setError('Please provide a reason for rejecting this leave request.');
      return;
    }

    setLoading(true);
    try {
      await api.principalAction(leave.id, {
        action,
        remarks: remarks.trim()
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to process decision');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog large">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#fef3c7', padding: '6px', borderRadius: '8px', color: '#d97706' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3>Principal Executive Sanction</h3>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Leave Request #{leave.id}</div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Student Overview */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Applicant</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{leave.student_name}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Roll No: {leave.student_reg_number} &bull; {leave.student_department}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Period & Duration</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{leave.start_date} to {leave.end_date}</div>
                <div style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 600 }}>{leave.total_days} Days ({leave.leave_type})</div>
              </div>
            </div>

            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Student Reason</span>
              <div style={{ fontSize: '0.88rem', color: '#334155', marginTop: '2px' }}>"{leave.reason}"</div>
            </div>
          </div>

          {/* Tutor's Physical Verification Attestation */}
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#059669" />
                <span style={{ fontWeight: 700, color: '#065f46', fontSize: '0.92rem' }}>
                  Tutor Physical Verification: Confirmed
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                Mode: {leave.verification_mode || 'IN_PERSON'}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#047857' }}>
              <strong>Tutor Verification Notes:</strong> "{leave.verification_remarks || 'Physically verified and recommended.'}"
            </div>
          </div>

          {/* Principal Remarks */}
          <div className="form-group">
            <label className="form-label">
              Principal Executive Remarks <span style={{ color: '#64748b', fontWeight: 'normal' }}>(Optional for approval, mandatory for rejection)</span>
            </label>
            <textarea 
              className="form-textarea"
              placeholder="e.g. Approved. Ensure missed laboratory sessions are made up before semester exams."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              The student will immediately receive an in-app notification with this decision and your remarks.
            </span>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button 
            type="button" 
            className="btn btn-danger"
            onClick={() => handleAction('REJECT')}
            disabled={loading}
          >
            <XCircle size={16} />
            <span>Reject Leave</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-success"
              onClick={() => handleAction('APPROVE')}
              disabled={loading}
            >
              <CheckCircle2 size={16} />
              <span>{loading ? 'Sanctioning...' : 'Approve Leave Request'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
