import { createElement } from 'react';
import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from '../ThemeProvider.tsx';

vi.mock('../../services/analytics.js', () => {
  const analyticsMock = {
    track: vi.fn(),
    setGlobalContext: vi.fn(),
  };
  return { __esModule: true, default: analyticsMock };
});

vi.mock('../../services/publicSite.js', () => ({
  fetchThemeFabric: vi.fn(),
}));

const { fetchThemeFabric } = await import('../../services/publicSite.js');

function createMatchMedia(matches = false) {
  return {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      window.matchMedia = vi.fn().mockImplementation((query) => {
        if (query === '(prefers-color-scheme: dark)') {
          return createMatchMedia(false);
        }
        return createMatchMedia();
      });
    }
    fetchThemeFabric.mockResolvedValue({
      version: 'baseline',
      theme: {
        accentPresets: {
          aurora: {
            accent: '#6366f1',
            accentStrong: '#4f46e5',
            accentSoft: 'rgba(99, 102, 241, 0.16)',
            primary: '#6366f1',
            primarySoft: 'rgba(79, 70, 229, 0.12)',
          },
        },
      },
      components: { tokens: {} },
      metadata: { themeId: 'theme-aurora' },
    });
  });

  afterEach(() => {
    document.documentElement.removeAttribute('style');
    document.documentElement.removeAttribute('data-thememode');
    document.documentElement.removeAttribute('data-themedensity');
    delete document.documentElement.dataset.themeAccent;
  });

  it('exposes default theme tokens', async () => {
    const wrapper = ({ children }) => createElement(ThemeProvider, null, children);
    const { result } = renderHook(() => useTheme(), { wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.mode).toBe('light');
    expect(result.current.tokens.colors.background).toBeDefined();
    expect(document.documentElement.style.getPropertyValue('--gv-color-background')).not.toEqual('');
  });

  it('updates mode and accent tokens', async () => {
    const wrapper = ({ children }) => createElement(ThemeProvider, null, children);
    const { result } = renderHook(() => useTheme(), { wrapper });

    await act(async () => {
      await Promise.resolve();
      result.current.setMode('dark');
      result.current.setAccent('violet');
      result.current.setDensity('compact');
    });

    expect(result.current.mode).toBe('dark');
    expect(document.documentElement.dataset.themeMode).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--gv-space-md')).not.toEqual('');
    expect(result.current.tokens.colors.accent).toContain('#');
    expect(document.documentElement.dataset.themeAccent).toBe('violet');
    expect(document.documentElement.style.getPropertyValue('--gv-font-heading-lg')).not.toEqual('');
    expect(document.documentElement.style.getPropertyValue('--gv-density-scale')).not.toEqual('');
  });

  it('merges remote fabric accent presets when loaded', async () => {
    fetchThemeFabric.mockResolvedValueOnce({
      version: '2024.10.01',
      theme: {
        accentPresets: {
          daybreak: {
            accent: '#ff8a00',
            accentStrong: '#ff6a00',
            accentSoft: 'rgba(255, 138, 0, 0.18)',
            primary: '#ff8a00',
            primarySoft: 'rgba(255, 138, 0, 0.12)',
          },
        },
      },
      components: { tokens: {} },
      metadata: { themeId: 'theme-daybreak' },
    });

    const wrapper = ({ children }) => createElement(ThemeProvider, null, children);
    const { result } = renderHook(() => useTheme(), { wrapper });

    await act(async () => {
      await Promise.resolve();
      result.current.setAccent('daybreak');
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.fabricStatus).toBe('ready');
    expect(result.current.fabricVersion).toBe('2024.10.01');
    expect(result.current.tokens.colors.accent).toBe('#ff8a00');
  });
});
