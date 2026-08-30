import React, { createContext, useContext, useState } from 'react';
import translations from '../i18n/translations';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'wms_lang';

function loadLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'sv' ? 'sv' : 'en';
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(loadLang);

  const setLang = (l) => {
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
    setLangState(l);
  };

  /** Translate a key. Falls back to the key itself if not found. */
  const t = (key) => {
    const dict = translations[lang] || translations.en;
    return dict[key] ?? translations.en[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
