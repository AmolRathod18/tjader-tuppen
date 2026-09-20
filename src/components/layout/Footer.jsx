import React from 'react';

export default function Footer({ className = '' }) {
  return (
    <footer className={`site-footer ${className}`.trim()}>
      © 2026 TJÄDERTUPPEN | Project Management System
    </footer>
  );
}
