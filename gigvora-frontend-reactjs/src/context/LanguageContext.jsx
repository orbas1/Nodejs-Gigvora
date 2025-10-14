import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_DIRECTIONS,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  translations,
} from '../i18n/translations.js';

const LanguageContext = createContext(null);

function normaliseLanguage(code) {
  if (!code) {
    return DEFAULT_LANGUAGE;
  }
  const value = `${code}`.trim().toLowerCase();
  if (!value.length) {
    return DEFAULT_LANGUAGE;
  }
  const match = SUPPORTED_LANGUAGES.find((language) => language.code === value);
  return match ? match.code : DEFAULT_LANGUAGE;
}

function getBrowserLanguage() {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LANGUAGE;
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
    const match = SUPPORTED_LANGUAGES.find((language) => language.code === base);
    if (match) {
      return match.code;
    }
  }
  return DEFAULT_LANGUAGE;
}

function readStoredLanguage() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) {
      return normaliseLanguage(stored);
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
  const initialLanguage = useMemo(() => readStoredLanguage() ?? getBrowserLanguage(), []);
  const [language, setLanguageState] = useState(initialLanguage);

  const direction = LANGUAGE_DIRECTIONS[language] ?? 'ltr';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = direction;
    }
  }, [direction, language]);

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
    const resolved = normaliseLanguage(next);
    setLanguageState((current) => (current === resolved ? current : resolved));
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, resolved);
      } catch (error) {
        console.warn('Unable to persist language preference', error);
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      language,
      direction,
      availableLanguages: SUPPORTED_LANGUAGES,
      setLanguage,
      t: translate,
      translations: translations[language] ?? translations[DEFAULT_LANGUAGE],
    }),
    [direction, language, setLanguage, translate],
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
