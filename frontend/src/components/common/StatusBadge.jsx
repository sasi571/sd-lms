import React from 'react';

export default function StatusBadge({ status }) {
  const getStatusConfig = (st) => {
    switch (st) {
      case 'PENDING_TUTOR':
        return { label: 'Awaiting Physical Verification', class: 'pending_tutor' };
      case 'FORWARDED_TO_PRINCIPAL':
        return { label: 'Forwarded to Principal', class: 'forwarded_to_principal' };
      case 'APPROVED':
        return { label: 'Approved by Principal', class: 'approved' };
      case 'REJECTED_BY_TUTOR':
        return { label: 'Rejected by Tutor', class: 'rejected_by_tutor' };
      case 'REJECTED_BY_PRINCIPAL':
        return { label: 'Rejected by Principal', class: 'rejected_by_principal' };
      default:
        return { label: st, class: 'pending_tutor' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`status-chip ${config.class}`}>
      <span className="status-dot"></span>
      {config.label}
    </span>
  );
}
