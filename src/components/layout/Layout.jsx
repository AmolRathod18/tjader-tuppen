import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    setShowScrollTop(false);
  }, [location.pathname]);

  useEffect(() => {
    const updateScrollButton = () => setShowScrollTop(window.scrollY > 400);
    updateScrollButton();
    window.addEventListener('scroll', updateScrollButton, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollButton);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

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
        <Footer />
      </div>
      {showScrollTop && (
        <button
          className="scroll-top-button"
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  );
}
