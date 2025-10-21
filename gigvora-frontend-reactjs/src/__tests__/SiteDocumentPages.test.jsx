import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import TermsPage from '../pages/TermsPage.jsx';
import PrivacyPage from '../pages/PrivacyPage.jsx';
import RefundPolicyPage from '../pages/RefundPolicyPage.jsx';
import useSiteDocument from '../hooks/useSiteDocument.js';

const layoutSpy = vi.fn(({ hero }) => (
  <div data-testid="site-document-layout" data-hero-title={hero?.title ?? ''} />
));

vi.mock('../components/site/SiteDocumentLayout.jsx', () => ({
  default: layoutSpy,
}));

vi.mock('../hooks/useSiteDocument.js', () => ({
  default: vi.fn(),
}));

vi.mock('../content/site/terms.js', () => ({
  default: { slug: 'terms-of-service', hero: { title: 'Terms of Service' } },
}));

vi.mock('../content/site/privacy.js', () => ({
  default: { slug: 'privacy-policy', hero: { title: 'Privacy Policy' } },
}));

vi.mock('../content/site/refund.js', () => ({
  default: { slug: 'refund-policy', hero: { title: 'Refund Policy' } },
}));

describe('Site document driven pages', () => {
  beforeEach(() => {
    layoutSpy.mockClear();
    useSiteDocument.mockReset();
    useSiteDocument.mockReturnValue({
      page: { title: 'Example' },
      sections: [{ id: 'intro', title: 'Intro', blocks: [] }],
      metadata: { updatedAt: '2024-01-01T00:00:00.000Z' },
      loading: false,
      error: null,
      refresh: vi.fn(),
      usingFallback: false,
      hero: { title: 'Example hero' },
    });
  });

  it('hydrates the terms page via the site document hook', () => {
    render(<TermsPage />);

    expect(useSiteDocument).toHaveBeenCalledWith(
      'terms-of-service',
      expect.objectContaining({ slug: 'terms-of-service' }),
    );
    expect(layoutSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        hero: expect.objectContaining({ title: 'Example hero' }),
        usingFallback: false,
      }),
      expect.anything(),
    );
  });

  it('hydrates the privacy page via the site document hook', () => {
    render(<PrivacyPage />);

    expect(useSiteDocument).toHaveBeenCalledWith(
      'privacy-policy',
      expect.objectContaining({ slug: 'privacy-policy' }),
    );
    expect(layoutSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        hero: expect.objectContaining({ title: 'Example hero' }),
        metadata: expect.objectContaining({ updatedAt: '2024-01-01T00:00:00.000Z' }),
      }),
      expect.anything(),
    );
  });

  it('hydrates the refund policy page via the site document hook', () => {
    render(<RefundPolicyPage />);

    expect(useSiteDocument).toHaveBeenCalledWith(
      'refund-policy',
      expect.objectContaining({ slug: 'refund-policy' }),
    );
    expect(layoutSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        hero: expect.objectContaining({ title: 'Example hero' }),
        error: null,
      }),
      expect.anything(),
    );
  });
});
