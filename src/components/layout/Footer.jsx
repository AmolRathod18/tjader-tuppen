import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function Footer({ className = '' }) {
  const { t } = useLanguage();
  return (
    <footer className={`site-footer ${className}`.trim()}>
      {t('login_footer')}
    </footer>
  );
}
