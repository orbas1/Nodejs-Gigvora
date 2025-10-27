import { describe, expect, it } from '@jest/globals';
import {
  resolvePlatformContinuityBootstrap,
} from '../platformContinuityService.js';
import {
  CONTINUITY_THEME_DEFAULTS,
  CONTINUITY_THEME_BLUEPRINT,
} from '../../../../shared-contracts/domain/platform/continuity-bootstrap.js';

function getAccentKeys() {
  return Object.keys(CONTINUITY_THEME_BLUEPRINT.accents ?? {});
}

describe('platformContinuityService', () => {
  it('returns bootstrap with defaults and metadata', () => {
    const result = resolvePlatformContinuityBootstrap();
    expect(result).toBeTruthy();
    expect(result.bootstrap.version).toBeDefined();
    expect(result.bootstrap.theme.blueprint).toBe(CONTINUITY_THEME_BLUEPRINT);
    expect(result.bootstrap.theme.defaults).toEqual(CONTINUITY_THEME_DEFAULTS);
    expect(Array.isArray(result.bootstrap.routes.registry)).toBe(true);
    expect(result.metadata.sections.hasRoutes).toBe(true);
    expect(result.metadata.sections.hasComponents).toBe(true);
  });

  it('applies theme overrides when provided', () => {
    const accentKey = getAccentKeys().find((key) => key !== CONTINUITY_THEME_DEFAULTS.accent) || 'violet';
    const { bootstrap } = resolvePlatformContinuityBootstrap({
      themeOverrides: { mode: 'dark', accent: accentKey, density: 'compact' },
    });

    expect(bootstrap.theme.defaults.mode).toBe('dark');
    expect(bootstrap.theme.defaults.accent).toBe(accentKey);
    expect(bootstrap.theme.defaults.density).toBe('compact');
  });

  it('omits optional sections when requested', () => {
    const { bootstrap, metadata } = resolvePlatformContinuityBootstrap({
      includeRoutes: false,
      includeComponents: false,
    });

    expect(bootstrap.routes).toBeUndefined();
    expect(bootstrap.components).toBeUndefined();
    expect(metadata.sections.hasRoutes).toBe(false);
    expect(metadata.sections.hasComponents).toBe(false);
  });
});
