import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react';
import PublicNavbar from './PublicNavbar';
import { useLanguage } from '../../context/LanguageContext';
import { publicProjects, publicServices } from '../../config/publicCatalog';

const navigation = [
  { label: 'Home', to: '/', end: true, type: 'link' },
  { label: 'About', to: '/about', type: 'link' },
  { label: 'Services', to: '/services', type: 'dropdown', items: publicServices },
  { label: 'Projects', to: '/projects', type: 'dropdown', items: publicProjects },
  { label: 'Contact', to: '/contact', type: 'link' },
];

export default function PublicSiteHeader({ variant = 'page' }) {
  const { tp } = useLanguage();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState('');
  const [theme, setTheme] = useState('dark');
  const headerRef = useRef(null);
  const isHero = variant === 'hero';

  useEffect(() => {
    const updateTheme = () => {
      const marker = (headerRef.current?.getBoundingClientRect().bottom ?? 0) + 1;
      const activeSection = [...document.querySelectorAll('[data-header-theme]')].find(section => {
        const bounds = section.getBoundingClientRect();
        return bounds.top <= marker && bounds.bottom > marker;
      });

      if (activeSection) {
        setTheme(activeSection.dataset.headerTheme);
      }
    };

    updateTheme();
    window.addEventListener('scroll', updateTheme, { passive: true });
    window.addEventListener('resize', updateTheme);
    return () => {
      window.removeEventListener('scroll', updateTheme);
      window.removeEventListener('resize', updateTheme);
    };
  }, []);

  useEffect(() => {
    const closeOnEscape = event => {
      if (event.key === 'Escape') {
        setOpenDropdown('');
        setMenuOpen(false);
      }
    };
    const closeOnOutsidePointer = event => {
      if (!headerRef.current?.contains(event.target)) {
        setOpenDropdown('');
        setMenuOpen(false);
      }
    };
    const closeOnOutsideFocus = event => {
      if (!headerRef.current?.contains(event.target)) {
        setOpenDropdown('');
        setMenuOpen(false);
      }
    };
    const closeOnDesktopResize = () => {
      if (window.matchMedia('(min-width: 901px)').matches) {
        setOpenDropdown('');
        setMenuOpen(false);
      }
    };
    const closeOnHistoryNavigation = () => {
      setOpenDropdown('');
      setMenuOpen(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('focusin', closeOnOutsideFocus);
    window.addEventListener('resize', closeOnDesktopResize);
    window.addEventListener('popstate', closeOnHistoryNavigation);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('focusin', closeOnOutsideFocus);
      window.removeEventListener('resize', closeOnDesktopResize);
      window.removeEventListener('popstate', closeOnHistoryNavigation);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className={`tj-hero-header${isHero ? ' tj-home-header' : ' tj-page-header'} tj-header-theme-${theme}`}
    >
      <PublicNavbar />
      <button
        className="tj-menu-toggle"
        aria-controls="tj-main-navigation"
        type="button"
        aria-label={tp(menuOpen ? 'Close navigation' : 'Open navigation')}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(open => !open)}
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <nav
        id="tj-main-navigation"
        className={`tj-section-nav${menuOpen ? ' is-open' : ''}`}
        aria-label={tp('Main navigation')}
      >
        {navigation.map(({ label, to, end, type, items }) => {
          if (type === 'dropdown') {
            const expanded = openDropdown === label;
            const routeActive = pathname.startsWith(to);
            const Icon = items[0].icon;
            return (
              <div
                className={`tj-nav-dropdown${expanded ? ' is-open' : ''}`}
                key={to}
                onKeyDown={event => {
                  if (event.key === 'Escape') setOpenDropdown('');
                }}
                onMouseEnter={() => {
                  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) setOpenDropdown(label);
                }}
                onMouseLeave={() => {
                  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) setOpenDropdown('');
                }}
              >
                <button
                  className={`tj-nav-trigger${expanded || routeActive ? ' is-active' : ''}`}
                  id={`tj-${label.toLowerCase()}-navigation-trigger`}
                  aria-controls={`tj-${label.toLowerCase()}-navigation-panel`}
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={expanded}
                  onClick={() => {
                    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
                    setOpenDropdown(current => (
                      canHover || current !== label ? label : ''
                    ));
                  }}
                >
                  {tp(label)} <ChevronDown size={14} />
                </button>
                <div
                  className="tj-nav-dropdown-panel"
                  id={`tj-${label.toLowerCase()}-navigation-panel`}
                  role="group"
                  aria-labelledby={`tj-${label.toLowerCase()}-navigation-trigger`}
                >
                  <div className="tj-nav-dropdown-heading">
                    <span className="tj-nav-dropdown-icon"><Icon size={18} /></span>
                    <div><strong>{tp(label)}</strong><small>{tp(label === 'Services' ? 'Skilled work for industry' : 'A selection of our work')}</small></div>
                  </div>
                  <div className="tj-nav-dropdown-grid">
                    {items.map(({ title, path, summary, image, images, icon: ItemIcon }) => (
                      <Link
                        className="tj-nav-dropdown-item"
                        key={path}
                        to={path}
                        onClick={() => { setOpenDropdown(''); setMenuOpen(false); }}
                      >
                        <span className="tj-nav-dropdown-thumb">
                          <img src={image ?? images[0]} alt="" />
                          <span><ItemIcon size={14} /></span>
                        </span>
                        <span className="tj-nav-dropdown-copy">
                          <strong>{tp(title)}</strong>
                          <small>{tp(summary)}</small>
                        </span>
                        <ArrowRight className="tj-nav-dropdown-arrow" size={15} />
                      </Link>
                    ))}
                  </div>
                  <Link
                    className="tj-nav-dropdown-all"
                    to={to}
                    onClick={() => { setOpenDropdown(''); setMenuOpen(false); }}
                  >
                    {tp(label === 'Services' ? 'Explore all services' : 'Explore all projects')} <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            );
          }
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => { setOpenDropdown(''); setMenuOpen(false); }}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            >
              {tp(label)}
            </NavLink>
          );
        })}
      </nav>
    </header>
  );
}
