'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { LanguageCode } from './config';
import { DEFAULT_LANGUAGE, LANGUAGES } from './config';

interface I18nContextValue {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: (key: string) => string;
  strings: Record<string, string>;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'farm-assistant-lang';

// Cache loaded locale files
const localeCache: Partial<Record<LanguageCode, Record<string, string>>> = {};

async function loadLocale(lang: LanguageCode): Promise<Record<string, string>> {
  if (localeCache[lang]) {
    return localeCache[lang]!;
  }
  try {
    const mod = await import(`./locales/${lang}.json`);
    localeCache[lang] = mod.default;
    return mod.default;
  } catch {
    // Fallback to English if locale file is missing
    if (lang !== 'en') {
      return loadLocale('en');
    }
    return {};
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (stored && LANGUAGES[stored]) {
        return stored;
      }
    }
    return DEFAULT_LANGUAGE;
  });
  const [strings, setStrings] = useState<Record<string, string>>({});

  // Sync state if localStorage changes in other tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue && LANGUAGES[e.newValue as LanguageCode]) {
        setLangState(e.newValue as LanguageCode);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Load locale strings when language changes and sync <html lang="...">
  useEffect(() => {
    loadLocale(lang).then(setStrings);
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((newLang: LanguageCode) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return strings[key] || key;
    },
    [strings],
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t, strings }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
