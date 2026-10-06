import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => window.matchMedia('(max-width: 768px)').matches
  );
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.querySelector('.page-content')?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateViewport = event => {
      setIsMobileViewport(event.matches);
      setMobileNavOpen(false);
      setSidebarCollapsed(false);
    };
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    const closeOnHistoryNavigation = () => setMobileNavOpen(false);
    window.addEventListener('popstate', closeOnHistoryNavigation);
    return () => window.removeEventListener('popstate', closeOnHistoryNavigation);
  }, []);

  useEffect(() => {
    if (isMobileViewport) return undefined;

    const collapseOnOutsideClick = event => {
      if (event.target instanceof Element &&
        !event.target.closest('#admin-sidebar, .mobile-menu-button')) {
        setSidebarCollapsed(true);
      }
    };
    document.addEventListener('pointerdown', collapseOnOutsideClick);
    return () => document.removeEventListener('pointerdown', collapseOnOutsideClick);
  }, [isMobileViewport]);

  const handleMenuToggle = () => {
    if (isMobileViewport) {
      setMobileNavOpen(open => !open);
      return;
    }
    setSidebarCollapsed(collapsed => !collapsed);
  };

  return (
    <div className={`app-layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar
        mobileOpen={mobileNavOpen}
        collapsed={sidebarCollapsed && !isMobileViewport}
        onExpand={() => setSidebarCollapsed(false)}
        onNavigate={() => setMobileNavOpen(false)}
      />
      {mobileNavOpen && (
        <button
          className="mobile-nav-backdrop"
          type="button"
          aria-label={t('ui_close_navigation')}
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <div className="main-content">
        <Header
          mobileNavOpen={mobileNavOpen}
          sidebarCollapsed={sidebarCollapsed}
          onMenuToggle={handleMenuToggle}
        />
        <main className="page-content animate-in">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
