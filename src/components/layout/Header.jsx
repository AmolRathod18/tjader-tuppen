import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';

const PAGE_META = {
  '/dashboard':           { title: 'Dashboard',           subtitle: 'Overview of your welding projects' },
  '/companies':           { title: 'Client Companies',    subtitle: 'Manage your client company records' },
  '/projects':            { title: 'Projects',            subtitle: 'All welding projects across clients' },
  '/employees':           { title: 'Employees',           subtitle: 'Manage your welding workforce' },
  '/work-entry':          { title: 'Daily Work Entry',    subtitle: 'Log and track daily work hours' },
  '/attendance':          { title: 'Attendance',          subtitle: 'Monitor employee attendance & location verification' },
  '/reports':             { title: 'Reports',             subtitle: 'View and export work reports' },
  '/employee/dashboard':  { title: 'My Dashboard',        subtitle: 'Your attendance and daily work portal' },
  '/employee/attendance': { title: 'My Attendance',       subtitle: 'Your personal attendance history' },
};

export default function Header() {
  const { pathname } = useLocation();
  const meta = PAGE_META[pathname] || { title: 'WeldPro', subtitle: '' };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-SE', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <header className="header">
      <div className="header-left">
        <h1>{meta.title}</h1>
        {meta.subtitle && <p>{meta.subtitle}</p>}
      </div>
      <div className="header-right">
        <span className="header-date">📅 {dateStr}</span>
        <button className="btn btn-ghost btn-icon" title="Notifications">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
