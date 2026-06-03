import React from 'react';

const StatCard = ({ title, value, subtitle, Icon, colorClass = 'text-primary' }) => {
  return (
    <div className="stat-card">
      <div className="stat-content">
        <p className="stat-label">{title}</p>
        <h3 className="stat-value">{value}</h3>
        {subtitle && (
          <p className="text-xs text-muted" style={{ marginTop: '4px' }}>
            {subtitle}
          </p>
        )}
      </div>
      {Icon && (
        <div className={`stat-icon bg-secondary-light ${colorClass}`}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
