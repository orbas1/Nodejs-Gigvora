import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useSiteDocument from '../useSiteDocument.js';
import { fetchSitePage } from '../../services/publicSite.js';

vi.mock('../../services/publicSite.js', () => ({
  fetchSitePage: vi.fn(),
}));

const fallback = {
  slug: 'sample-doc',
  version: '1.0.0',
  lastUpdated: '2024-08-10',
  hero: {
    eyebrow: 'Test',
    title: 'Fallback title',
    description: 'Fallback description',
  },
  body: '## Fallback heading\nFallback paragraph.',
};

describe('useSiteDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses fallback content when the API request fails', async () => {
    fetchSitePage.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useSiteDocument('sample-doc', fallback));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.sections[0].title).toBe('Fallback heading');
    expect(result.current.usingFallback).toBe(true);
    expect(result.current.metadata.version).toBe('1.0.0');
  });

  it('prefers live content when the API request succeeds', async () => {
    fetchSitePage.mockResolvedValueOnce({
      slug: 'sample-doc',
      version: '2.0.0',
      body: '## Live heading\nLive paragraph.',
      hero: { title: 'Live hero' },
    });

    const { result } = renderHook(() => useSiteDocument('sample-doc', fallback));

    await waitFor(() => expect(result.current.usingFallback).toBe(false));

    expect(result.current.sections[0].title).toBe('Live heading');
    expect(result.current.metadata.version).toBe('2.0.0');
  });
});
