import React from 'react';
import { ArrowUpRight, House, LockKeyhole } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import logo from '../../assets/TJADERTUPPEN_Logo.jpeg';

export default function PublicNavbar() {
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <nav className="public-nav" aria-label="Public navigation">
      <Link to="/" className="public-nav-brand">
        <span className="public-nav-mark"><img src={logo} alt="" /></span>
        <span><strong>TJÄDERTUPPEN</strong><small>Management System</small></span>
      </Link>
      <div className="public-nav-actions">
        <div className="public-nav-languages" aria-label={t('ui_language_selection')}>
          <button type="button" className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')} aria-pressed={lang === 'en'}>EN</button>
          <button type="button" className={lang === 'sv' ? 'active' : ''} onClick={() => setLang('sv')} aria-pressed={lang === 'sv'}>SV</button>
        </div>
        <Link
          to={isLogin ? '/' : '/login'}
          className="public-nav-cta"
          aria-label={isLogin ? 'Back to home' : 'Admin login'}
        >
          <span className="public-nav-cta-icon">
            {isLogin ? <House size={15} /> : <LockKeyhole size={15} />}
          </span>
          <span className="public-nav-cta-text">{isLogin ? 'Back to home' : 'Admin login'}</span>
          <ArrowUpRight size={15} className="public-nav-cta-arrow" />
        </Link>
      </div>
    </nav>
  );
}