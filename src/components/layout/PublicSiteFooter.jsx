import React from 'react';
import { ArrowUpRight, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../../assets/TJADERTUPPEN_Logo.jpeg';

const navigation = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Services', to: '/services' },
  { label: 'Projects', to: '/projects' },
  { label: 'Contact', to: '/contact' },
];

export default function PublicSiteFooter() {
  return (
    <footer className="tj-footer">
      <div className="tj-footer-main">
        <div className="tj-footer-brand">
          <Link to="/" className="tj-footer-logo">
            <img src={logo} alt="" />
            <strong>TJÄDERTUPPEN<small>Svets &amp; Konsult</small></strong>
          </Link>
          <p>Professional welding, fabrication and industrial services. Skilled work, delivered reliably across Sweden.</p>
          <span className="tj-footer-location"><MapPin size={14} /> Sweden · Nationwide field service</span>
        </div>
        <nav className="tj-footer-column" aria-label="Footer navigation">
          <h3>Explore</h3>
          {navigation.map(({ label, to }) => <Link key={to} to={to}>{label}</Link>)}
        </nav>
        <div className="tj-footer-column tj-footer-contact">
          <h3>Get in touch</h3>
          <a href="tel:+46702862773"><Phone size={15} /> +46 70 286 27 73</a>
          <span><MapPin size={15} /> Serving Sweden</span>
        </div>
      </div>
      <div className="tj-footer-bottom">
        <span>© {new Date().getFullYear()} Tjädertuppen Svets &amp; Konsult</span>
        <Link to="/">Back to home <ArrowUpRight size={14} /></Link>
        <span>Built to work. Built to last.</span>
      </div>
    </footer>
  );
}
