import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Building2, FolderKanban, Users,
  ClipboardList, BarChart3, LogOut,
} from 'lucide-react';
import logo from '../../assets/TJADERTUPPEN_Logo.jpeg';

const NAV_ITEMS = [
  { to: '/dashboard',   icon: LayoutDashboard, labelKey: 'nav_dashboard'   },
  { to: '/companies',   icon: Building2,        labelKey: 'nav_companies'   },
  { to: '/projects',    icon: FolderKanban,     labelKey: 'nav_projects'    },
  { to: '/employees',   icon: Users,            labelKey: 'nav_employees'   },
  { to: '/work-entry',  icon: ClipboardList,    labelKey: 'nav_work_entry'  },
  { to: '/reports',     icon: BarChart3,        labelKey: 'nav_reports'     },
];

export default function Sidebar({ mobileOpen, onNavigate }) {
  const { t } = useLanguage();
  const { logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
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
          <span>Management System</span>
        </div>
      </div>

      {/* Admin badge */}
      <div style={{ margin: '6px 12px 4px', padding: '6px 12px', borderRadius: 8, background: 'rgba(199,157,79,0.14)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#C79D4F', flexShrink: 0 }} />
        <span className="sidebar-flag" aria-hidden="true"><span /></span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#D9B873', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Administrator
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
          <div className="sidebar-avatar" style={{ background: 'linear-gradient(135deg,#C79D4F,#8E682C)' }}>
            AD
          </div>
          <div className="sidebar-user-info">
            <p>Administrator</p>
            <span>admin@tjadertuppen.se</span>
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-full" onClick={handleLogout} style={{ marginTop: 12 }}>
          <LogOut size={16} style={{ marginRight: 8 }} /> {t('nav_logout')}
        </button>
      </div>
    </aside>
  );
}
