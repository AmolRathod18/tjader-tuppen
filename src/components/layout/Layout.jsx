import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
      {mobileNavOpen && (
        <button
          className="mobile-nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <div className="main-content">
        <Header onMenuToggle={() => setMobileNavOpen(open => !open)} />
        <main className="page-content animate-in">
          {children}
        </main>
      </div>
    </div>
  );
}
