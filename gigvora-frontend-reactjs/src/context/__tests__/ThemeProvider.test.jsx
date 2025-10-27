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
  });

  afterEach(() => {
    document.documentElement.removeAttribute('style');
    document.documentElement.removeAttribute('data-thememode');
    document.documentElement.removeAttribute('data-themedensity');
    delete document.documentElement.dataset.themeAccent;
  });

  it('exposes default theme tokens', () => {
    const wrapper = ({ children }) => createElement(ThemeProvider, null, children);
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.mode).toBe('light');
    expect(result.current.tokens.colors.background).toBeDefined();
    expect(document.documentElement.style.getPropertyValue('--gv-color-background')).not.toEqual('');
  });

  it('updates mode and accent tokens', async () => {
    const wrapper = ({ children }) => createElement(ThemeProvider, null, children);
    const { result } = renderHook(() => useTheme(), { wrapper });

    await act(async () => {
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
});
