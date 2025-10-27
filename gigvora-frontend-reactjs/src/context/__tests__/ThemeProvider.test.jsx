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
    document.documentElement.removeAttribute('data-theme-mode');
    document.documentElement.removeAttribute('data-theme-density');
    document.documentElement.removeAttribute('data-theme-accent');
  });

  it('exposes default theme tokens', () => {
    const wrapper = ({ children }) => createElement(ThemeProvider, null, children);
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.mode).toBe('light');
    expect(result.current.tokens.colors.background).toBeDefined();
    expect(typeof result.current.tokens.spacingPx.md).toBe('number');
    expect(result.current.tokens.spacing.md).toMatch(/rem/);
    expect(result.current.cssVariables['--gv-color-accent']).toMatch(/#/);
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
    expect(document.documentElement.dataset.themeAccent).toBe('violet');
    expect(document.documentElement.style.getPropertyValue('--gv-space-md')).not.toEqual('');
    expect(result.current.tokens.colors.accent).toContain('#');
    expect(result.current.cssVariables['--gv-color-accent']).toContain('#');
  });

  it('emits preference changes to the provided handler', async () => {
    const handler = vi.fn();
    const wrapper = ({ children }) =>
      createElement(
        ThemeProvider,
        {
          onPreferencesChange: handler,
          disablePersistence: true,
        },
        children,
      );

    const { result } = renderHook(() => useTheme(), { wrapper });

    await act(async () => {
      result.current.setMode('dark');
    });

    expect(handler).toHaveBeenCalled();
    const payload = handler.mock.calls.at(-1)[0];
    expect(payload.mode).toBe('dark');
    expect(payload.preference).toBe('dark');
    expect(payload.accent).toBeDefined();
  });
});
