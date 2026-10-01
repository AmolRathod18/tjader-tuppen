import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import PublicSiteFooter from './PublicSiteFooter';
import PublicSiteHeader from './PublicSiteHeader';

export default function PublicSiteLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <div className="tj-landing tj-public-page">
      <PublicSiteHeader />
      <main className="tj-public-content">
        <Outlet />
      </main>
      <PublicSiteFooter />
    </div>
  );
}
