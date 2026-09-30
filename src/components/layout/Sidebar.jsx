import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Building2, FolderKanban, Users,
  ClipboardList, BarChart3, Car, LogOut, Settings,
} from 'lucide-react';
import logo from '../../assets/TJADERTUPPEN_Logo.jpeg';

const NAV_ITEMS = [
  { to: '/dashboard',   icon: LayoutDashboard, labelKey: 'nav_dashboard'   },
  { to: '/companies',   icon: Building2,        labelKey: 'nav_companies'   },
  { to: '/projects',    icon: FolderKanban,     labelKey: 'nav_projects'    },
  { to: '/employees',   icon: Users,            labelKey: 'nav_employees'   },
  { to: '/work-entry',  icon: ClipboardList,    labelKey: 'nav_work_entry'  },
  { to: '/reports',     icon: BarChart3,        labelKey: 'nav_reports'     },
  { to: '/expenditure', icon: Car,              labelKey: 'nav_expenditure' },
  { to: '/settings', icon: Settings, labelKey: 'nav_settings' },
];

export default function Sidebar({ mobileOpen, onNavigate }) {
  const { t } = useLanguage();
  const { auth, logout } = useApp();
  const adminName = auth.user?.username || t('ui_administrator');
  const adminEmail = auth.user?.email || 'admin@tjadertuppen.se';
  const adminInitials = adminName.slice(0, 2).toUpperCase();

  const handleLogout = (event) => {
    event.preventDefault();
    event.stopPropagation();
    logout();
    window.location.assign(`${window.location.origin}/login`);
  };

  return (
    <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <img
          src={logo}
          alt="TJÄDERTUPPEN"
          className="sidebar-brand-logo"
        />
        <div className="sidebar-logo-text">
          <h2>TJÄDERTUPPEN</h2>
          <span>{t('ui_management_system')}</span>
        </div>
      </div>

      {/* Admin badge */}
      <div className="sidebar-role">
        <span className="sidebar-role-dot" />
        <span className="sidebar-flag" aria-hidden="true"><span /></span>
        <span className="sidebar-role-label">
          {t('ui_administrator')}
        </span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">{t('menu')}</span>
        {NAV_ITEMS.map(({ to, icon: Icon, labelKey }) => (
          <NavLink key={to} to={to} onClick={onNavigate}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <Icon size={18} className="link-icon" />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>

      {/* User info & Logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {adminInitials}
          </div>
          <div className="sidebar-user-info">
            <p>{adminName}</p>
            <span>{adminEmail}</span>
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-full" onClick={handleLogout} style={{ marginTop: 12 }}>
          <LogOut size={16} style={{ marginRight: 8 }} /> {t('nav_logout')}
        </button>
      </div>
    </aside>
  );
}
