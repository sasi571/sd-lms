import React, { useState } from 'react';
import { X, CheckCircle, ShieldAlert, ArrowRight, UserCheck, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

export default function PhysicalVerificationModal({ isOpen, onClose, leave, onSuccess }) {
  const [isPhysicallyVerified, setIsPhysicallyVerified] = useState(false);
  const [verificationMode, setVerificationMode] = useState('IN_PERSON');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !leave) return null;

  const handleAction = async (action) => {
    setError('');

    if (action === 'FORWARD') {
      if (!isPhysicallyVerified) {
        setError('Physical verification is mandatory before forwarding to the Principal.');
        return;
      }
      if (!remarks.trim()) {
        setError('Please provide verification observations and reason in the remarks field.');
        return;
      }
    } else if (action === 'REJECT') {
      if (!remarks.trim()) {
        setError('Please state the specific reason for rejecting this leave.');
        return;
      }
    }

    setLoading(true);
    try {
      await api.tutorAction(leave.id, {
        action,
        is_physically_verified: isPhysicallyVerified,
        verification_mode: verificationMode,
        remarks: remarks.trim()
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog large">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#ede9fe', padding: '6px', borderRadius: '8px', color: '#7c3aed' }}>
              <UserCheck size={20} />
            </div>
            <div>
              <h3>Tutor Physical Verification & Review</h3>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Request #{leave.id}</div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Student Info Card */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Student</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{leave.student_name}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Roll: {leave.student_reg_number}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Leave Period</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{leave.start_date} to {leave.end_date}</div>
                <div style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 600 }}>{leave.total_days} Day(s) &bull; {leave.leave_type}</div>
              </div>
            </div>

            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Student's Reason</span>
              <div style={{ fontSize: '0.88rem', color: '#334155', marginTop: '2px', background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                "{leave.reason}"
              </div>
            </div>
          </div>

          {/* Mandatory Physical Verification Card */}
          <div className="verification-card">
            <label className="verification-checkbox-label">
              <input 
                type="checkbox" 
                checked={isPhysicallyVerified}
                onChange={(e) => setIsPhysicallyVerified(e.target.checked)}
              />
              <div>
                <div className="verification-title">
                  Physical Verification Completed
                </div>
                <div className="verification-hint">
                  I hereby confirm that I have physically verified this student's leave situation (via personal interview, contact with registered parent/guardian, or verified medical certificate).
                </div>
              </div>
            </label>
          </div>

          {/* Verification Mode */}
          <div className="form-group">
            <label className="form-label">Physical Verification Mode <span className="req">*</span></label>
            <select 
              className="form-select"
              value={verificationMode}
              onChange={(e) => setVerificationMode(e.target.value)}
            >
              <option value="IN_PERSON">In-Person Student Interview</option>
              <option value="PARENT_CALL">Verified Directly with Parent via Phone</option>
              <option value="MEDICAL_SLIP">Physical Medical Slip / Hospital Certificate Examined</option>
              <option value="OTHER">Other Institutional / Warden Verification</option>
            </select>
          </div>

          {/* Tutor Remarks */}
          <div className="form-group">
            <label className="form-label">
              Tutor Verification Remarks & Justification <span className="req">*</span>
            </label>
            <textarea 
              className="form-textarea"
              placeholder="e.g. Spoke to father Mr. Sharma who confirmed hospital admission. Recommended for approval."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              These remarks will be forwarded directly to the Principal's review portal.
            </span>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button 
            type="button" 
            className="btn btn-danger btn-sm"
            onClick={() => handleAction('REJECT')}
            disabled={loading}
          >
            Reject Request
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
              className="btn btn-primary"
              onClick={() => handleAction('FORWARD')}
              disabled={loading}
            >
              <CheckCircle size={16} />
              <span>{loading ? 'Processing...' : 'Verify & Forward to Principal'}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
