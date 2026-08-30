import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Building2, FolderKanban, Users,
  ClipboardList, BarChart3, LogOut, CalendarCheck, Link2
} from 'lucide-react';
import logo from '../../assets/TJADERTUPPEN_Logo.jpeg';

const adminNav = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/companies',   icon: Building2,        label: 'Client Companies' },
  { to: '/projects',    icon: FolderKanban,     label: 'Projects' },
  { to: '/employees',   icon: Users,            label: 'Employees' },
  { to: '/assignments', icon: Link2,            label: 'Assignments' },
  { to: '/work-entry',  icon: ClipboardList,    label: 'Daily Work Entry' },
  { to: '/attendance',  icon: CalendarCheck,    label: 'Attendance' },
  { to: '/reports',     icon: BarChart3,        label: 'Reports' },
];

const employeeNav = [
  { to: '/employee/dashboard',  icon: LayoutDashboard, label: 'My Dashboard' },
  { to: '/employee/attendance', icon: CalendarCheck,   label: 'My Attendance' },
];

export default function Sidebar() {
  const { logout, userRole, loggedInEmployeeId, employees } = useApp();
  const navigate = useNavigate();
  const isEmployee = userRole === 'employee';
  const navItems = isEmployee ? employeeNav : adminNav;

  const loggedEmp = isEmployee ? employees.find(e => e.id === loggedInEmployeeId) : null;
  const initials = loggedEmp
    ? loggedEmp.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'AD';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <img
          src={logo}
          alt="TJÄDERTUPPEN"
          className="sidebar-brand-logo"
        />
        <div className="sidebar-logo-text">
          <h2>TJÄDERTUPPEN</h2>
          <span>{isEmployee ? 'Employee Portal' : 'Admin Panel'}</span>
        </div>
      </div>

      {/* Role badge */}
      <div style={{ margin: '6px 12px 4px', padding: '6px 12px', borderRadius: 8, background: isEmployee ? 'rgba(22,163,74,0.15)' : 'rgba(29,78,216,0.15)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: isEmployee ? '#22C55E' : '#3B82F6', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: isEmployee ? '#4ADE80' : '#93C5FD', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {isEmployee ? 'Employee' : 'Administrator'}
        </span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Menu</span>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <Icon size={18} className="link-icon" />
            {label}
          </NavLink>
        ))}
        <span className="sidebar-section-label" style={{ marginTop: 8 }}>System</span>
        <button className="sidebar-link" onClick={handleLogout}>
          <LogOut size={18} className="link-icon" /> Logout
        </button>
      </nav>

      {/* User info */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{ background: isEmployee ? 'linear-gradient(135deg,#16A34A,#22C55E)' : 'linear-gradient(135deg,#1D4ED8,#7C3AED)' }}>
            {initials}
          </div>
          <div className="sidebar-user-info">
            <p>{loggedEmp ? loggedEmp.name : 'Administrator'}</p>
            <span>{loggedEmp ? loggedEmp.empId : 'admin@tjadertuppen.se'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
