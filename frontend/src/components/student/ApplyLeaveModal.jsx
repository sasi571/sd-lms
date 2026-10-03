import React, { useState } from 'react';
import { X, Calendar, Send, AlertCircle, Info } from 'lucide-react';
import { api } from '../../services/api';

export default function ApplyLeaveModal({ isOpen, onClose, onSuccess }) {
  // Pre-fill sensible default dates
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [leaveType, setLeaveType] = useState('ACADEMIC');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(tomorrowStr);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Calculate days
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end - start;
    if (diff < 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const totalDays = calculateDays();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!reason.trim()) {
      setError('Please provide a specific reason for your leave.');
      return;
    }

    if (totalDays <= 0) {
      setError('End date must be greater than or equal to Start date.');
      return;
    }

    setLoading(true);
    try {
      await api.createLeave({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim()
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-header">
          <h3>Apply for Leave</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Leave Category <span className="req">*</span></label>
              <select 
                className="form-select" 
                value={leaveType} 
                onChange={(e) => setLeaveType(e.target.value)}
              >
                <option value="ACADEMIC">Academic / Conference / Workshop</option>
                <option value="MEDICAL">Medical / Health Recovery</option>
                <option value="CASUAL">Casual / Personal Family Leave</option>
                <option value="EMERGENCY">Emergency / Compassionate</option>
                <option value="DUTY">On Duty / Inter-Collegiate Event</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Date <span className="req">*</span></label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Date <span className="req">*</span></label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Computed Duration:</span>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: totalDays > 0 ? '#4f46e5' : '#ef4444' }}>
                {totalDays > 0 ? `${totalDays} Day${totalDays > 1 ? 's' : ''}` : 'Invalid dates'}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Reason & Justification <span className="req">*</span></label>
              <textarea 
                className="form-textarea" 
                placeholder="Explain the detailed purpose for your leave..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <Info size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.78rem', color: '#1e40af', lineHeight: '1.4' }}>
                <strong>Multi-tier Workflow Notice:</strong> Upon submission, this request will be assigned to your Class Tutor for physical verification (in-person check or parent contact) before forwarding to the Principal.
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Send size={16} />
              <span>{loading ? 'Submitting...' : 'Submit to Tutor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
