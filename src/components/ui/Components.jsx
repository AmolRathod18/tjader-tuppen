import React from 'react';

export function Badge({ status }) {
  const map = {
    'Active':    { cls: 'badge-success', dot: '🟢' },
    'Completed': { cls: 'badge-info',    dot: '🔵' },
    'On Hold':   { cls: 'badge-warning', dot: '🟡' },
    'Inactive':  { cls: 'badge-neutral', dot: '⚪' },
    'Pending':   { cls: 'badge-warning', dot: '🟡' },
  };
  const info = map[status] || { cls: 'badge-neutral', dot: '⚪' };
  return (
    <span className={`badge ${info.cls}`}>
      {status}
    </span>
  );
}

export function StatCard({ label, value, subtext, colorClass, icon: Icon }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className={`stat-icon ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div className="stat-info">
        <p>{label}</p>
        <h3>{value}</h3>
        {subtext && <small>{subtext}</small>}
      </div>
    </div>
  );
}
