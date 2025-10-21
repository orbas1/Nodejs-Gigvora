import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SeoSettingsForm from '../SeoSettingsForm.jsx';

function createDraft(overrides = {}) {
  return {
    siteName: 'Gigvora',
    defaultTitle: 'Gigvora – Title',
    defaultDescription: 'Platform description',
    defaultKeywords: ['gigvora'],
    canonicalBaseUrl: 'https://gigvora.com',
    allowIndexing: true,
    noindexPaths: ['/private'],
    sitemapUrl: 'https://gigvora.com/sitemap.xml',
    robotsPolicy: 'User-agent: *\nAllow: /',
    verificationCodes: {
      google: 'abc',
    },
    socialDefaults: {
      ogTitle: 'Gigvora',
      ogDescription: 'Scale every engagement.',
      ogImageUrl: 'https://cdn.gigvora.com/og-default.png',
      ogImageAlt: 'Gigvora hero image',
      twitterHandle: '@gigvora',
      twitterTitle: 'Gigvora on X',
      twitterDescription: 'Secure talent operations.',
      twitterCardType: 'summary_large_image',
      twitterImageUrl: 'https://cdn.gigvora.com/twitter-default.png',
    },
    structuredData: {
      organization: {
        name: 'Gigvora',
        url: 'https://gigvora.com',
        logoUrl: 'https://cdn.gigvora.com/logo.svg',
        contactEmail: 'hello@gigvora.com',
        sameAs: ['https://linkedin.com/company/gigvora'],
      },
      customJsonText: '{"@context":"https://schema.org"}',
    },
    pageOverrides: [],
    ...overrides,
  };
}

describe('SeoSettingsForm', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup({ applyAcceptDefaultUnhandledRejections: false });
  });

  it('renders a loading placeholder while waiting on draft data', () => {
    render(<SeoSettingsForm draft={null} onDraftChange={vi.fn()} />);
    expect(screen.getByText(/loading seo configuration/i)).toBeInTheDocument();
  });

  it('normalises keyword tokens before saving', async () => {
    let currentDraft = createDraft({ defaultKeywords: [] });
    const handleDraftChange = vi.fn((updater) => {
      currentDraft = typeof updater === 'function' ? updater(currentDraft) : updater;
    });
    const view = render(
      <SeoSettingsForm
        draft={currentDraft}
        onDraftChange={handleDraftChange}
      />,
    );

    const keywordsField = screen.getByText('Default keywords').closest('div');
    const keywordsInput = within(keywordsField).getByRole('textbox');

    await act(async () => {
      await user.type(keywordsInput, ' Growth {enter}');
    });

    view.rerender(<SeoSettingsForm draft={currentDraft} onDraftChange={handleDraftChange} />);

    expect(screen.getByText('growth')).toBeInTheDocument();
    expect(currentDraft.defaultKeywords).toEqual(['growth']);
  });

  it('surfaces canonical base URL validation errors', async () => {
    let currentDraft = createDraft();
    const handleDraftChange = vi.fn((updater) => {
      currentDraft = typeof updater === 'function' ? updater(currentDraft) : updater;
    });
    const view = render(
      <SeoSettingsForm
        draft={currentDraft}
        onDraftChange={handleDraftChange}
      />,
    );

    const canonicalInput = screen.getByLabelText(/canonical base url/i);

    await act(async () => {
      fireEvent.change(canonicalInput, { target: { value: 'ftp://example.com' } });
    });

    view.rerender(<SeoSettingsForm draft={currentDraft} onDraftChange={handleDraftChange} />);

    const canonicalField = screen.getByLabelText(/canonical base url/i).closest('div');
    await within(canonicalField).findByText(/valid https:\/\/ base url/i);
    expect(currentDraft.canonicalBaseUrl).toBe('ftp://example.com');
  });

  it('flags invalid JSON-LD payloads', async () => {
    let currentDraft = createDraft({ structuredData: { ...createDraft().structuredData, customJsonText: '' } });
    const handleDraftChange = vi.fn((updater) => {
      currentDraft = typeof updater === 'function' ? updater(currentDraft) : updater;
    });
    const view = render(
      <SeoSettingsForm
        draft={currentDraft}
        onDraftChange={handleDraftChange}
      />,
    );

    const jsonTextarea = screen.getByLabelText(/additional json-ld/i);

    await act(async () => {
      fireEvent.change(jsonTextarea, { target: { value: '{not valid' } });
    });

    view.rerender(<SeoSettingsForm draft={currentDraft} onDraftChange={handleDraftChange} />);

    await screen.findByText(/invalid json-ld/i);
  });

  it('raises warnings for invalid structured data profile URLs', async () => {
    let currentDraft = createDraft({
      structuredData: {
        organization: { name: 'Gigvora', url: 'https://gigvora.com', sameAs: [] },
        customJsonText: '',
      },
    });
    const handleDraftChange = vi.fn((updater) => {
      currentDraft = typeof updater === 'function' ? updater(currentDraft) : updater;
    });
    const view = render(
      <SeoSettingsForm
        draft={currentDraft}
        onDraftChange={handleDraftChange}
      />,
    );

    const sameAsField = screen.getByText('Organisation sameAs profiles').closest('div');
    const sameAsInput = within(sameAsField).getByRole('textbox');

    await act(async () => {
      await user.type(sameAsInput, 'notaurl{enter}');
    });

    view.rerender(<SeoSettingsForm draft={currentDraft} onDraftChange={handleDraftChange} />);

    await screen.findByText(/review profile urls/i);
  });
});
