import React from 'react';

const StatusBadge = ({ status, customClass = '' }) => {
  let badgeClass = 'neutral';
  const statusLower = status?.toLowerCase() || '';

  if (['approved', 'completed', 'fulfilled', 'donated', 'safe', 'success', 'arrived'].includes(statusLower)) {
    badgeClass = 'success';
  } else if (['pending', 'processing', 'screening', 'warning'].includes(statusLower)) {
    badgeClass = 'warning';
  } else if (['rejected', 'cancelled', 'critical', 'danger', 'failed'].includes(statusLower)) {
    badgeClass = 'danger';
  } else if (['registered', 'active', 'info'].includes(statusLower)) {
    badgeClass = 'info';
  }

  return (
    <span className={`status-badge ${badgeClass} ${customClass}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
