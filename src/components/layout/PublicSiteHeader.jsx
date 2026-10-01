import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import PublicNavbar from './PublicNavbar';

const navigation = [
  { label: 'Home', to: '/', end: true },
  { label: 'About', to: '/about' },
  { label: 'Services', to: '/services' },
  { label: 'Projects', to: '/projects' },
  { label: 'Contact', to: '/contact' },
];

export default function PublicSiteHeader({ variant = 'page' }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isHero = variant === 'hero';

  return (
    <header className={`tj-hero-header${isHero ? '' : ' tj-page-header'}`}>
      <PublicNavbar />
      <button
        className="tj-menu-toggle"
        type="button"
        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(open => !open)}
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <nav className={`tj-section-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
        {navigation.map(({ label, to, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => (isActive ? 'is-active' : undefined)}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
