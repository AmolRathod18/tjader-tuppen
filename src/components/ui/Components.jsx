import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export function Badge({ status }) {
  const { t } = useLanguage();
  const map = {
    'Active':    { cls: 'badge-success', dot: '🟢' },
    'Completed': { cls: 'badge-info',    dot: '🔵' },
    'On Hold':   { cls: 'badge-warning', dot: '🟡' },
    'Inactive':  { cls: 'badge-neutral', dot: '⚪' },
    'Pending':   { cls: 'badge-warning', dot: '🟡' },
  };
  const info = map[status] || { cls: 'badge-neutral', dot: '⚪' };
  const statusKeys = {
    Active: 'status_active',
    Completed: 'status_completed',
    'On Hold': 'status_on_hold',
    Inactive: 'status_inactive',
    Pending: 'status_pending',
  };
  return (
    <span className={`badge ${info.cls}`}>
      {statusKeys[status] ? t(statusKeys[status]) : status}
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
