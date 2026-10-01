import React from 'react';
import { ArrowUpRight, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../../assets/TJADERTUPPEN_Logo.jpeg';
import { useLanguage } from '../../context/LanguageContext';

const navigation = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Services', to: '/services' },
  { label: 'Projects', to: '/projects' },
  { label: 'Contact', to: '/contact' },
];

export default function PublicSiteFooter() {
  const { tp } = useLanguage();

  return (
    <footer className="tj-footer" data-header-theme="light">
      <div className="tj-footer-main">
        <div className="tj-footer-brand">
          <Link to="/" className="tj-footer-logo">
            <img src={logo} alt="" />
            <strong>TJÄDERTUPPEN<small>Svets &amp; Konsult</small></strong>
          </Link>
          <p>{tp('Professional welding, fabrication and industrial services. Skilled work, delivered reliably across Sweden.')}</p>
          <span className="tj-footer-location"><MapPin size={14} /> {tp('Sweden · Nationwide field service')}</span>
        </div>
        <nav className="tj-footer-column" aria-label={tp('Footer navigation')}>
          <h3>{tp('Explore')}</h3>
          {navigation.map(({ label, to }) => <Link key={to} to={to}>{tp(label)}</Link>)}
        </nav>
        <div className="tj-footer-column tj-footer-contact">
          <h3>{tp('Get in touch')}</h3>
          <a href="tel:+46702862773"><Phone size={15} /> +46 70 286 27 73</a>
          <span><MapPin size={15} /> {tp('Serving Sweden')}</span>
        </div>
      </div>
      <div className="tj-footer-bottom">
        <span>© {new Date().getFullYear()} Tjädertuppen Svets &amp; Konsult</span>
        <Link to="/">{tp('Back to home')} <ArrowUpRight size={14} /></Link>
        <span>{tp('Built to work. Built to last.')}</span>
      </div>
    </footer>
  );
}
