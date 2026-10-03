import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.querySelector('.page-content')?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
      {mobileNavOpen && (
        <button
          className="mobile-nav-backdrop"
          aria-label={t('ui_close_navigation')}
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <div className="main-content">
        <Header onMenuToggle={() => setMobileNavOpen(open => !open)} />
        <main className="page-content animate-in">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
