import { act, renderHook, waitFor } from '@testing-library/react';
import useSitePage from '../hooks/useSitePage.js';
import useSiteDocument from '../hooks/useSiteDocument.js';

const { fetchSitePageMock } = vi.hoisted(() => ({ fetchSitePageMock: vi.fn() }));

vi.mock('../services/publicSite.js', () => ({
  __esModule: true,
  fetchSitePage: fetchSitePageMock,
}));

describe('site page hooks', () => {
  const fallbackDocument = {
    slug: 'about',
    title: 'Fallback About',
    summary: 'Fallback summary',
    body: '',
    sections: [
      {
        id: 'mission',
        title: 'Mission',
        blocks: [
          { type: 'paragraph', text: 'Fallback mission statement.' },
          { type: 'list', items: ['Support creators', 'Grow together'] },
        ],
      },
    ],
    hero: {
      title: 'Fallback hero',
      description: 'Trusted offline copy',
      eyebrow: 'Company overview',
      meta: 'Updated yesterday',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads a live site page and exposes metadata', async () => {
    fetchSitePageMock.mockResolvedValueOnce({
      slug: 'about',
      body: '## Vision\nWe help teams scale.\n\n- Reliable teams\n- Predictable delivery',
      summary: 'Live summary',
      heroTitle: 'Live hero',
      heroSubtitle: 'Live subtitle',
    });

    const { result } = renderHook(() => useSiteDocument('about', fallbackDocument));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.usingFallback).toBe(false);
    expect(result.current.sections[0].title).toBe('Vision');
    expect(result.current.sections[0].blocks).toHaveLength(2);
    expect(result.current.metadata.summary).toBe('Live summary');
    expect(result.current.hero.title).toBe('Live hero');
    expect(result.current.lastErrorAt).toBeNull();
  });

  it('falls back to cached content and records the failure timestamp', async () => {
    fetchSitePageMock.mockRejectedValueOnce(new Error('Network unavailable'));

    const { result } = renderHook(() => useSiteDocument('about', fallbackDocument));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.usingFallback).toBe(true);
    expect(result.current.page.title).toBe('Fallback About');
    expect(result.current.sections[0].blocks[0].text).toContain('Fallback mission');
    expect(result.current.lastErrorAt).not.toBeNull();
  });

  it('refreshes fallback payload when the trusted copy changes', async () => {
    fetchSitePageMock.mockRejectedValueOnce(new Error('Offline'));

    const { result, rerender } = renderHook(({ fallback }) => useSitePage('about', { fallback }), {
      initialProps: { fallback: { title: 'Original fallback' } },
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.usingFallback).toBe(true);
    expect(result.current.page.title).toBe('Original fallback');

    await act(async () => {
      rerender({ fallback: { title: 'Updated fallback' } });
    });

    expect(result.current.page.title).toBe('Updated fallback');
    expect(result.current.lastErrorAt).not.toBeNull();
  });
});
