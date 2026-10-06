import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import '../feedback/Feedback.css';

const PAGE_KEYS = {
  '/dashboard':  { title: 'page_dashboard',   subtitle: 'page_dashboard_sub'   },
  '/companies':  { title: 'page_companies',   subtitle: 'page_companies_sub'   },
  '/admin/projects': { title: 'page_projects', subtitle: 'page_projects_sub' },
  '/employees':  { title: 'page_employees',   subtitle: 'page_employees_sub'   },
  '/work-entry': { title: 'page_work_entry',  subtitle: 'page_work_entry_sub'  },
  '/reports':    { title: 'page_reports',     subtitle: 'page_reports_sub'     },
  '/feedback':   { title: 'feedback_title', subtitle: 'feedback_subtitle' },
  '/settings': { title: 'page_settings', subtitle: 'page_settings_sub' },
};

export default function Header({ mobileNavOpen, sidebarCollapsed, onMenuToggle }) {
  const { pathname } = useLocation();
  const { lang, setLang, t } = useLanguage();
  const { auth } = useApp();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [feedbackLoadError, setFeedbackLoadError] = useState('');
  const notificationRef = useRef(null);
  const keys = PAGE_KEYS[pathname] || { title: 'page_dashboard', subtitle: '' };

  useEffect(() => {
    if (!auth.isAuthenticated || auth.user?.role !== 'admin') return undefined;
    let active = true;
    const loadNotifications = async () => {
      const [unreadResult, recentResult] = await Promise.all([
        supabase.from('feedback').select('id', { count: 'exact', head: true }).eq('is_read', false),
        supabase
          .from('feedback')
          .select('id, name, message, is_read, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);
      if (!active) return;
      setNotificationsLoading(false);
      if (unreadResult.error || recentResult.error) {
        const loadError = unreadResult.error || recentResult.error;
        setFeedbackLoadError(t('feedback_notifications_error'));
        console.error('Unable to load feedback notifications:', loadError);
        return;
      }
      setFeedbackLoadError('');
      setUnreadFeedbackCount(unreadResult.count || 0);
      setRecentFeedback(recentResult.data || []);
      window.dispatchEvent(new Event('feedback-updated'));
    };

    const channel = supabase
      .channel('admin-feedback-notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'feedback',
      }, loadNotifications)
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setFeedbackLoadError(t('feedback_realtime_error'));
          setNotificationsLoading(false);
          console.error('Unable to subscribe to realtime feedback notifications:', status);
        }
      });
    loadNotifications();
    window.addEventListener('focus', loadNotifications);

    return () => {
      active = false;
      window.removeEventListener('focus', loadNotifications);
      supabase.removeChannel(channel);
    };
  }, [auth.isAuthenticated, auth.user?.role, t]);

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    const closeOnOutsidePointer = event => {
      if (!notificationRef.current?.contains(event.target)) setNotificationsOpen(false);
    };
    const closeOnEscape = event => {
      if (event.key === 'Escape') setNotificationsOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [notificationsOpen]);

  const now = new Date();
  const dateStr = now.toLocaleDateString(lang === 'sv' ? 'sv-SE' : 'en-GB', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="mobile-menu-button"
          type="button"
          onClick={onMenuToggle}
          aria-label={t(mobileNavOpen || !sidebarCollapsed ? 'ui_close_navigation' : 'ui_open_navigation')}
          aria-expanded={mobileNavOpen || !sidebarCollapsed}
          aria-controls="admin-sidebar"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <div className="header-title-group">
          <h1>{t(keys.title)}</h1>
          {keys.subtitle && <p>{t(keys.subtitle)}</p>}
        </div>
      </div>
      <div className="header-right">
        <span className="header-date">📅 {dateStr}</span>

        {/* Language Switcher */}
        <div style={{
          display: 'flex', gap: 0,
          border: '1px solid var(--color-border)',
          borderRadius: 8, overflow: 'hidden',
        }}>
          <button
            id="lang-en-btn"
            onClick={() => setLang('en')}
            style={{
              padding: '5px 10px', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 11,
              letterSpacing: '0.05em',
              background: lang === 'en' ? 'var(--color-primary)' : 'transparent',
              color: lang === 'en' ? '#fff' : 'var(--color-text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            EN
          </button>
          <button
            id="lang-sv-btn"
            onClick={() => setLang('sv')}
            style={{
              padding: '5px 10px', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 11,
              letterSpacing: '0.05em',
              background: lang === 'sv' ? 'var(--color-primary)' : 'transparent',
              color: lang === 'sv' ? '#fff' : 'var(--color-text-secondary)',
              borderLeft: '1px solid var(--color-border)',
              transition: 'all 0.15s',
            }}
          >
            SV
          </button>
        </div>

        {auth.user?.role === 'admin' && <div className="header-notifications" ref={notificationRef}>
          <button
            className="btn btn-ghost btn-icon header-notifications-trigger"
            type="button"
            title={t('ui_notifications')}
            aria-label={t('feedback_notification_count', [unreadFeedbackCount])}
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
            onClick={() => setNotificationsOpen(open => !open)}
          >
            <Bell size={18} />
            {unreadFeedbackCount > 0 && <span className="header-notification-badge">{unreadFeedbackCount > 99 ? '99+' : unreadFeedbackCount}</span>}
          </button>
          {notificationsOpen && (
            <section className="header-notifications-popover" role="dialog" aria-label={t('feedback_notifications_title')}>
              <div className="header-notifications-heading">
                <strong>{t('feedback_notifications_title')}</strong>
                {unreadFeedbackCount > 0 && <span>{unreadFeedbackCount}</span>}
              </div>
              {feedbackLoadError && <p className="header-notifications-error" role="status">{feedbackLoadError}</p>}
              {!feedbackLoadError && notificationsLoading && (
                <p className="header-notifications-empty">{t('feedback_loading')}</p>
              )}
              {!feedbackLoadError && !notificationsLoading && recentFeedback.length === 0 && (
                <p className="header-notifications-empty">{t('feedback_notifications_empty')}</p>
              )}
              {!feedbackLoadError && recentFeedback.map(item => (
                <Link
                  key={item.id}
                  to="/feedback"
                  className={`header-notification-item${item.is_read ? '' : ' is-unread'}`}
                  onClick={() => setNotificationsOpen(false)}
                >
                  <span className="header-notification-indicator" />
                  <span className="header-notification-copy">
                    <strong>{item.name}</strong>
                    <span>{item.message}</span>
                  </span>
                </Link>
              ))}
              <Link
                className="header-notifications-footer"
                to="/feedback"
                onClick={() => setNotificationsOpen(false)}
              >
                {t('feedback_view_all')}
              </Link>
            </section>
          )}
        </div>}
      </div>
    </header>
  );
}
