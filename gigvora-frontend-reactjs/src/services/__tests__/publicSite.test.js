import { describe, it, expect, vi, beforeEach } from 'vitest';

const postMock = vi.fn();

vi.mock('../apiClient.js', () => ({
  apiClient: {
    post: postMock,
    get: vi.fn(),
  },
  default: {
    post: postMock,
    get: vi.fn(),
  },
}));

const { submitSitePageFeedback } = await import('../publicSite.js');

describe('submitSitePageFeedback', () => {
  beforeEach(() => {
    postMock.mockReset();
    postMock.mockResolvedValue({ feedback: { id: 5, response: 'yes' } });
  });

  it('posts sanitized feedback payloads to the API', async () => {
    const result = await submitSitePageFeedback('privacy-policy', {
      rating: 'Yes',
      message: '  Helpful overview.  ',
    });

    expect(postMock).toHaveBeenCalledWith(
      '/site/pages/privacy-policy/feedback',
      { rating: 'yes', message: 'Helpful overview.' },
      undefined,
    );
    expect(result).toEqual({ id: 5, response: 'yes' });
  });

  it('passes through optional request options', async () => {
    const abortController = new AbortController();
    await submitSitePageFeedback(
      'terms',
      { rating: 'partially', message: 'Needs more detail' },
      { signal: abortController.signal, params: { preview: 'true' } },
    );

    expect(postMock).toHaveBeenCalledWith(
      '/site/pages/terms/feedback',
      { rating: 'partially', message: 'Needs more detail' },
      { signal: abortController.signal, params: { preview: 'true' } },
    );
  });

  it('throws when rating is missing or invalid', async () => {
    await expect(() => submitSitePageFeedback('privacy', {})).rejects.toThrow(
      /rating is required/,
    );
    await expect(() => submitSitePageFeedback('privacy', { rating: 'maybe' })).rejects.toThrow(
      /rating must be one of/,
    );
  });
});
