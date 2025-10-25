import { describe, it, expect } from 'vitest';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, translations, resolveLanguage, getLanguageDirection, translate } from '../i18n/translations.js';

describe('i18n helpers', () => {
  it('resolves configured languages and preserves ordering', () => {
    expect(SUPPORTED_LANGUAGES[0].code).toBe(DEFAULT_LANGUAGE);
    expect(resolveLanguage('FR').code).toBe('fr');
    expect(resolveLanguage('unknown')).toEqual(SUPPORTED_LANGUAGES[0]);
  });

  it('returns language direction with sensible defaults', () => {
    expect(getLanguageDirection('ar')).toBe('rtl');
    expect(getLanguageDirection('fr')).toBe('ltr');
  });

  it('translates keys with fallback to default language', () => {
    expect(translate('fr', 'menu.logout')).toBe(translations.fr.menu.logout);
    expect(translate('zz', 'menu.logout')).toBe(translations.en.menu.logout);
    expect(translate('en', 'nonexistent.path', 'Fallback')).toBe('Fallback');
  });
});
