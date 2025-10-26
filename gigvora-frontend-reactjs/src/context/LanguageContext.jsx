import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_DIRECTIONS,
  LANGUAGE_STORAGE_KEY,
  translations,
} from '../i18n/translations.js';
import { useNavigationChrome } from './NavigationChromeContext.jsx';

const LanguageContext = createContext(null);

const FALLBACK_LOCALES = [
  { code: DEFAULT_LANGUAGE, label: 'English', nativeLabel: 'English', direction: 'ltr' },
];

function normaliseLanguage(code, availableLocales = FALLBACK_LOCALES) {
  const list = Array.isArray(availableLocales) && availableLocales.length ? availableLocales : FALLBACK_LOCALES;
  const first = list[0]?.code ?? DEFAULT_LANGUAGE;
  if (!code) {
    return first;
  }
  const value = `${code}`.trim().toLowerCase();
  if (!value.length) {
    return first;
  }
  const match = list.find((language) => language.code === value);
  return match ? match.code : first;
}

function getBrowserLanguage(availableLocales = FALLBACK_LOCALES) {
  const list = Array.isArray(availableLocales) && availableLocales.length ? availableLocales : FALLBACK_LOCALES;
  const fallback = list[0]?.code ?? DEFAULT_LANGUAGE;
  if (typeof navigator === 'undefined') {
    return fallback;
  }
  const candidates = [];
  if (Array.isArray(navigator.languages)) {
    candidates.push(...navigator.languages);
  }
  if (navigator.language) {
    candidates.push(navigator.language);
  }
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    const [base] = `${candidate}`.toLowerCase().split('-');
    const match = list.find((language) => language.code === base);
    if (match) {
      return match.code;
    }
  }
  return fallback;
}

function readStoredLanguage(availableLocales = FALLBACK_LOCALES) {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) {
      return normaliseLanguage(stored, availableLocales);
    }
  } catch (error) {
    console.warn('Unable to read stored language preference', error);
  }
  return null;
}

function getTranslationValue(language, key) {
  const source = translations[language];
  if (!source) {
    return undefined;
  }
  return key.split('.').reduce((value, segment) => {
    if (value && typeof value === 'object' && segment in value) {
      return value[segment];
    }
    return undefined;
  }, source);
}

export function LanguageProvider({ children }) {
  const { locales: chromeLocales } = useNavigationChrome();
  const availableLocales = useMemo(() => {
    if (Array.isArray(chromeLocales) && chromeLocales.length) {
      return chromeLocales;
    }
    return FALLBACK_LOCALES;
  }, [chromeLocales]);

  const initialLanguage = useMemo(
    () => readStoredLanguage(availableLocales) ?? getBrowserLanguage(availableLocales),
    [availableLocales],
  );
  const [language, setLanguageState] = useState(initialLanguage);

  const activeLocale = useMemo(
    () => availableLocales.find((locale) => locale.code === language) ?? availableLocales[0],
    [availableLocales, language],
  );

  const direction = activeLocale?.direction ?? LANGUAGE_DIRECTIONS[language] ?? 'ltr';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = direction;
    }
  }, [direction, language]);

  useEffect(() => {
    setLanguageState((current) => normaliseLanguage(current, availableLocales));
  }, [availableLocales]);

  const translate = useCallback(
    (key, fallback) => {
      const value = getTranslationValue(language, key);
      if (typeof value === 'string') {
        return value;
      }
      if (language !== DEFAULT_LANGUAGE) {
        const defaultValue = getTranslationValue(DEFAULT_LANGUAGE, key);
        if (typeof defaultValue === 'string') {
          return defaultValue;
        }
      }
      if (typeof fallback === 'string' && fallback.length) {
        return fallback;
      }
      return key;
    },
    [language],
  );

  const setLanguage = useCallback((next) => {
    const resolved = normaliseLanguage(next, availableLocales);
    setLanguageState((current) => (current === resolved ? current : resolved));
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, resolved);
      } catch (error) {
        console.warn('Unable to persist language preference', error);
      }
    }
  }, [availableLocales]);

  const value = useMemo(
    () => ({
      language,
      direction,
      availableLanguages: availableLocales,
      setLanguage,
      t: translate,
      translations: translations[language] ?? translations[DEFAULT_LANGUAGE],
    }),
    [availableLocales, direction, language, setLanguage, translate],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
