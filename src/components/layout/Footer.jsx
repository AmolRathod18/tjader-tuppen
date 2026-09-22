import React from 'react';

export default function Footer({ className = '' }) {
  return (
    <footer className={`site-footer ${className}`.trim()}>
      © 2026 Tjädertuppen Svets och konsult
    </footer>
  );
}
