import React from 'react';
import { Check, X, Clock, FileCheck2 } from 'lucide-react';

export default function LeaveTimeline({ status }) {
  // Determine states for 3 main steps:
  // Step 1: Student Application
  // Step 2: Tutor Physical Verification & Forward
  // Step 3: Principal Decision

  let step1 = 'completed'; // always completed once created
  let step2 = 'pending';
  let step3 = 'pending';

  if (status === 'PENDING_TUTOR') {
    step2 = 'active';
    step3 = 'pending';
  } else if (status === 'REJECTED_BY_TUTOR') {
    step2 = 'rejected';
    step3 = 'skipped';
  } else if (status === 'FORWARDED_TO_PRINCIPAL') {
    step2 = 'completed';
    step3 = 'active';
  } else if (status === 'APPROVED') {
    step2 = 'completed';
    step3 = 'completed';
  } else if (status === 'REJECTED_BY_PRINCIPAL') {
    step2 = 'completed';
    step3 = 'rejected';
  }

  const renderIcon = (state, stepNumber) => {
    if (state === 'completed') return <Check size={18} />;
    if (state === 'rejected') return <X size={18} />;
    if (state === 'active') return <Clock size={18} className="animate-spin-slow" />;
    return <span>{stepNumber}</span>;
  };

  return (
    <div className="timeline-tracker">
      {/* Step 1 */}
      <div className="tracker-step">
        <div className={`step-node ${step1}`}>
          {renderIcon(step1, 1)}
        </div>
        <div className="step-title">1. Student Application</div>
        <div className="step-desc">Submitted</div>
      </div>

      {/* Step 2 */}
      <div className="tracker-step">
        <div className={`step-node ${step2}`}>
          {renderIcon(step2, 2)}
        </div>
        <div className="step-title">2. Tutor Physical Verification</div>
        <div className="step-desc">
          {step2 === 'active' && 'Awaiting In-Person Check'}
          {step2 === 'completed' && 'Verified & Forwarded'}
          {step2 === 'rejected' && 'Rejected by Tutor'}
          {step2 === 'pending' && 'Pending'}
        </div>
      </div>

      {/* Step 3 */}
      <div className="tracker-step">
        <div className={`step-node ${step3}`}>
          {renderIcon(step3, 3)}
        </div>
        <div className="step-title">3. Principal Sanction</div>
        <div className="step-desc">
          {step3 === 'active' && 'Under Executive Review'}
          {step3 === 'completed' && 'Approved & Notified'}
          {step3 === 'rejected' && 'Rejected by Principal'}
          {step3 === 'pending' && 'Pending Forward'}
        </div>
      </div>
    </div>
  );
}
