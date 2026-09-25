import React, { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = translations[lang].app_title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', translations[lang].app_description);
  }, [lang]);

  const setLang = (l) => {
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
    setLangState(l);
  };

  /** Translate a key and replace {0}, {1}, ... placeholders. */
  const t = (key, values = []) => {
    const dict = translations[lang] || translations.en;
    const value = dict[key] ?? translations.en[key] ?? key;
    return String(value).replace(/\{(\d+)\}/g, (_, index) => values[Number(index)] ?? '');
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
