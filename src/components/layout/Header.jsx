import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const PAGE_KEYS = {
  '/dashboard':  { title: 'page_dashboard',   subtitle: 'page_dashboard_sub'   },
  '/companies':  { title: 'page_companies',   subtitle: 'page_companies_sub'   },
  '/projects':   { title: 'page_projects',    subtitle: 'page_projects_sub'    },
  '/employees':  { title: 'page_employees',   subtitle: 'page_employees_sub'   },
  '/work-entry': { title: 'page_work_entry',  subtitle: 'page_work_entry_sub'  },
  '/reports':    { title: 'page_reports',     subtitle: 'page_reports_sub'     },
  '/expenditure': { title: 'page_expenditure', subtitle: 'page_expenditure_sub' },
  '/settings': { title: 'page_settings', subtitle: 'page_settings_sub' },
};

export default function Header({ onMenuToggle }) {
  const { pathname } = useLocation();
  const { lang, setLang, t } = useLanguage();
  const keys = PAGE_KEYS[pathname] || { title: 'page_dashboard', subtitle: '' };

  const now = new Date();
  const dateStr = now.toLocaleDateString(lang === 'sv' ? 'sv-SE' : 'en-GB', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <header className="header">
      <div className="header-left">
        <button className="mobile-menu-button" onClick={onMenuToggle} aria-label={t('ui_open_navigation')}>
          <Menu size={20} />
        </button>
        <h1>{t(keys.title)}</h1>
        {keys.subtitle && <p>{t(keys.subtitle)}</p>}
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

        <button className="btn btn-ghost btn-icon" title={t('ui_notifications')} aria-label={t('ui_notifications')}>
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
