import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider, useLanguage } from '../LanguageContext.jsx';
import { LANGUAGE_STORAGE_KEY } from '../../i18n/translations.js';

function wrapper({ children }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

describe('LanguageContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  });

  it('provides default translations and updates storage on change', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.language).toBe('en');
    expect(result.current.direction).toBe('ltr');
    expect(result.current.t('navigation.feed')).toBe('Live Feed');

    act(() => {
      result.current.setLanguage('fr');
    });

    expect(result.current.language).toBe('fr');
    expect(result.current.direction).toBe('ltr');
    expect(result.current.t('menu.logout')).toBe('Déconnexion');
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');
  });

  it('switches to RTL layout for supported languages', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLanguage('ar');
    });

    expect(result.current.language).toBe('ar');
    expect(result.current.direction).toBe('rtl');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(result.current.t('navigation.feed')).toBe('البث المباشر');
  });

  it('falls back to provided default when translation is missing', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.t('nonexistent.key', 'Fallback')).toBe('Fallback');
  });
});
