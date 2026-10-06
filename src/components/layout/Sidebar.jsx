import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Building2, FolderKanban, Users,
  ClipboardList, BarChart3, LogOut, Settings, UserRound, MessageSquareText,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import logo from '../../assets/TJADERTUPPEN_Logo.jpeg';

const NAV_ITEMS = [
  { to: '/dashboard',   icon: LayoutDashboard, labelKey: 'nav_dashboard'   },
  { to: '/companies',   icon: Building2,        labelKey: 'nav_companies'   },
  { to: '/admin/projects', icon: FolderKanban,  labelKey: 'nav_projects'    },
  { to: '/employees',   icon: Users,            labelKey: 'nav_employees'   },
  { to: '/work-entry',  icon: ClipboardList,    labelKey: 'nav_work_entry'  },
  { to: '/reports',     icon: BarChart3,        labelKey: 'nav_reports'     },
  { to: '/feedback',    icon: MessageSquareText, labelKey: 'nav_feedback', badge: true },
  { to: '/settings',    icon: Settings,      labelKey: 'nav_settings'    },
];

export default function Sidebar({ mobileOpen, collapsed, onExpand, onNavigate }) {
  const { t } = useLanguage();
  const { auth, logout } = useApp();
  const location = useLocation();
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileMenuPosition, setProfileMenuPosition] = useState({ left: 0, bottom: 0 });
  const profileMenuRef = useRef(null);
  const adminName = auth.user?.username || t('ui_administrator');
  const adminEmail = auth.user?.email || 'admin@tjadertuppen.se';
  const adminInitials = adminName.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!auth.isAuthenticated) return undefined;
    let active = true;
    const loadUnreadCount = async () => {
      const { count, error } = await supabase
        .from('feedback')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false);
      if (!active) return;
      if (error) {
        console.error('Unable to load unread feedback count:', error);
        return;
      }
      setUnreadFeedbackCount(count || 0);
    };
    const refreshUnreadCount = () => loadUnreadCount();
    loadUnreadCount();
    window.addEventListener('feedback-updated', refreshUnreadCount);
    window.addEventListener('focus', refreshUnreadCount);
    const interval = window.setInterval(loadUnreadCount, 60000);
    return () => {
      active = false;
      window.removeEventListener('feedback-updated', refreshUnreadCount);
      window.removeEventListener('focus', refreshUnreadCount);
      window.clearInterval(interval);
    };
  }, [auth.isAuthenticated, location.pathname]);

  useEffect(() => {
    if (!profileMenuOpen) return undefined;

    const updateMenuPosition = () => {
      const trigger = profileMenuRef.current?.querySelector('.sidebar-user');
      if (!trigger) return;
      const bounds = trigger.getBoundingClientRect();
      setProfileMenuPosition({
        left: Math.max(12, Math.min(bounds.left, window.innerWidth - 272)),
        bottom: window.innerHeight - bounds.top + 10,
      });
    };
    const closeOnOutsidePointer = event => {
      if (!profileMenuRef.current?.contains(event.target)) setProfileMenuOpen(false);
    };
    const closeOnEscape = event => {
      if (event.key === 'Escape') setProfileMenuOpen(false);
    };
    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    document.addEventListener('scroll', updateMenuPosition, true);
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      document.removeEventListener('scroll', updateMenuPosition, true);
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [profileMenuOpen]);

  const handleLogout = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setProfileMenuOpen(false);
    logout();
    window.location.assign(`${window.location.origin}/login`);
  };

  return (
    <aside
      className={`sidebar${mobileOpen ? ' mobile-open' : ''}${collapsed ? ' collapsed' : ''}`}
      id="admin-sidebar"
      onClick={collapsed ? onExpand : undefined}
    >
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
        {NAV_ITEMS.map(({ to, icon: Icon, labelKey, badge }) => (
          <NavLink key={to} to={to} title={t(labelKey)} onClick={onNavigate}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <Icon size={18} className="link-icon" />
            <span className="sidebar-link-label">{t(labelKey)}</span>
            {badge && unreadFeedbackCount > 0 && (
              <span className="sidebar-feedback-badge" aria-label={t('feedback_unread_count', [unreadFeedbackCount])}>
                {unreadFeedbackCount > 99 ? '99+' : unreadFeedbackCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info & Logout */}
      <div className="sidebar-footer">
        <div className="sidebar-profile-menu-wrapper" ref={profileMenuRef}>
          {profileMenuOpen && (
            <div
              className="sidebar-profile-menu"
              role="menu"
              aria-label={t('profile_menu_title')}
              style={{
                left: `${profileMenuPosition.left}px`,
                bottom: `${profileMenuPosition.bottom}px`,
              }}
            >
              <div className="sidebar-profile-menu-header">
                <div className="sidebar-avatar">{adminInitials}</div>
                <div className="sidebar-profile-menu-identity">
                  <p>{adminName}</p>
                  <span>{adminEmail}</span>
                </div>
              </div>
              <div className="sidebar-profile-menu-divider" />
              <Link
                className="sidebar-profile-menu-item"
                to="/settings#admin-profile"
                role="menuitem"
                onClick={() => setProfileMenuOpen(false)}
              >
                <UserRound size={16} />
                <span>{t('profile_menu_profile')}</span>
              </Link>
              <Link
                className="sidebar-profile-menu-item"
                to="/settings"
                role="menuitem"
                onClick={() => setProfileMenuOpen(false)}
              >
                <Settings size={16} />
                <span>{t('nav_settings')}</span>
              </Link>
              <button
                type="button"
                className="sidebar-profile-menu-item is-logout"
                role="menuitem"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>{t('nav_logout')}</span>
              </button>
            </div>
          )}
          <button
            type="button"
            className="sidebar-user"
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            aria-label={t('profile_menu_open', [adminName])}
            onClick={() => setProfileMenuOpen(open => !open)}
          >
            <div className="sidebar-avatar">{adminInitials}</div>
            <div className="sidebar-user-info">
              <p>{adminName}</p>
              <span>{adminEmail}</span>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
}
