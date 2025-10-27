import { createElement } from 'react';
import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationChromeProvider, useNavigationChrome } from '../NavigationChromeContext.jsx';

vi.mock('../../services/publicSite.js', () => ({
  fetchNavigationChrome: vi.fn(),
}));

vi.mock('../../services/analytics.js', () => ({
  __esModule: true,
  default: {
    track: vi.fn(),
  },
}));

const { fetchNavigationChrome } = await import('../../services/publicSite.js');
const analytics = (await import('../../services/analytics.js')).default;

function flushPromises() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe('NavigationChromeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchNavigationChrome.mockResolvedValue({
      locales: [
        {
          code: 'en',
          label: 'English',
          nativeLabel: 'English',
          flag: '🇬🇧',
          region: 'Global',
          coverage: 100,
          status: 'ga',
          supportLead: 'London localisation studio',
          lastUpdated: '2024-05-12T09:00:00Z',
          summary: 'Editorial canon reviewed quarterly.',
          direction: 'ltr',
          isDefault: true,
          metadata: { localeCode: 'en-GB' },
        },
        {
          code: 'ar',
          label: 'Arabic',
          nativeLabel: 'العربية',
          flag: '🇦🇪',
          region: 'MENA',
          coverage: 74,
          status: 'preview',
          supportLead: 'Dubai localisation studio',
          lastUpdated: '2024-03-05T15:10:00Z',
          summary: 'RTL layout localised.',
          direction: 'rtl',
          metadata: { localeCode: 'ar-AE' },
        },
      ],
      personas: [
        {
          key: 'founder',
          label: 'Founder HQ',
          icon: 'rocket-launch',
          tagline: 'Raise capital and hire leaders.',
          focusAreas: ['Capital'],
          metrics: [],
          primaryCta: 'Review founder workspace',
          defaultRoute: '/dashboard/founder',
          timelineEnabled: true,
          metadata: { journey: 'founder' },
        },
        {
          key: 'admin',
          label: 'Platform administration',
          icon: 'shield-check',
          tagline: 'Monitor governance.',
          focusAreas: ['Security'],
          metrics: [],
          primaryCta: 'Manage platform admin',
          defaultRoute: '/dashboard/admin',
          timelineEnabled: false,
          metadata: { journey: 'admin' },
        },
      ],
      footer: {
        navigationSections: [
          {
            title: 'Platform',
            links: [
              { label: 'Launchpad', to: '/launchpad' },
            ],
          },
        ],
      },
      metadata: {
        defaultLocale: 'en',
        localeStatusCounts: { ga: 1, preview: 1 },
        updatedAt: '2024-05-12T09:00:00Z',
      },
    });
  });

  afterEach(() => {
    fetchNavigationChrome.mockReset();
  });

  it('provides derived navigation metadata and lookup helpers', async () => {
    const wrapper = ({ children }) => createElement(NavigationChromeProvider, null, children);
    const { result } = renderHook(() => useNavigationChrome(), { wrapper });

    await act(async () => {
      await flushPromises();
    });

    expect(result.current.defaultLocale).toBe('en');
    expect(result.current.personaCount).toBe(2);
    expect(result.current.localesByStatus.preview).toHaveLength(1);
    expect(result.current.metadata.localeStatusCounts.ga).toBe(1);
    expect(result.current.timelineEnabledPersonas).toHaveLength(1);
    expect(result.current.getLocale('ar')?.direction).toBe('rtl');
    expect(result.current.getPersona('founder')?.defaultRoute).toBe('/dashboard/founder');
    expect(result.current.getFooterSection('platform').links[0].to).toBe('/launchpad');
    expect(analytics.track).toHaveBeenCalledWith(
      'navigation.chrome_loaded',
      expect.objectContaining({ localeCount: 2, personaCount: 2, defaultLocale: 'en' }),
    );
  });

  it('retains previous metadata when refresh fails', async () => {
    const wrapper = ({ children }) => createElement(NavigationChromeProvider, null, children);
    const { result } = renderHook(() => useNavigationChrome(), { wrapper });

    await act(async () => {
      await flushPromises();
    });

    fetchNavigationChrome.mockRejectedValueOnce(new Error('network down'));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.metadata.defaultLocale).toBe('en');
    expect(result.current.error).toBe('network down');
  });
});
