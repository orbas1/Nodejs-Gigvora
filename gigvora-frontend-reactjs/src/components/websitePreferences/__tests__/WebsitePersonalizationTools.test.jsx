import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import WebsitePersonalizationTools from '../WebsitePersonalizationTools.jsx';
import { ThemeProvider } from '../../../context/ThemeProvider.tsx';
import { saveWebsitePreferences } from '../../../services/websitePreferences.js';

vi.mock('../../../services/websitePreferences.js', () => ({
  __esModule: true,
  saveWebsitePreferences: vi.fn(),
}));

function renderTools(overrides = {}) {
  const onSaved = vi.fn();
  const preferences = {
    settings: {
      siteTitle: 'Atlas Studio',
      tagline: 'Designing premium experiences',
      siteSlug: 'atlas',
      published: true,
      language: 'en',
    },
    personalization: {
      theme: {
        preset: 'aurora',
        mode: 'light',
        accent: 'azure',
        density: 'comfortable',
        livePreview: true,
        analyticsOptIn: true,
      },
      layout: {
        template: 'spotlight',
        heroStyle: 'immersive',
        modules: [
          { id: 'hero', label: 'Hero spotlight', description: 'Hero block', enabled: true, pinned: true, span: 'full' },
          { id: 'services', label: 'Services grid', description: 'Services', enabled: true, span: 'half' },
          { id: 'contact', label: 'Contact', description: 'Contact', enabled: true, span: 'half' },
        ],
        featuredCallout: 'Show visitors value quickly.',
        analyticsEnabled: true,
      },
      subscriptions: {
        digestFrequency: 'weekly',
        channels: { email: true, push: false, inApp: true, sms: false },
        categories: [
          {
            id: 'dealflow',
            label: 'Deal flow insights',
            description: 'Curated opportunities.',
            enabled: true,
            frequency: 'daily',
          },
        ],
        aiSummaries: true,
        previewEnabled: false,
      },
      accessibility: {
        altText: { enforcement: 'required', autoGenerate: true, requireForMedia: true },
        media: { captionPolicy: 'required', transcripts: true, audioDescription: 'summary' },
        content: { readingStyle: 'inclusive', inclusiveLanguage: true, plainLanguage: true },
        localisation: {
          autoTranslate: true,
          languages: ['en'],
          defaultLanguage: 'en',
          signLanguage: 'none',
        },
        compliance: {
          contrast: true,
          focus: true,
          keyboard: true,
          owner: 'Experience Studio',
          lastReviewedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  };

  const utils = render(
    <ThemeProvider>
      <WebsitePersonalizationTools
        userId="user-99"
        preferences={preferences}
        onSaved={onSaved}
        canEdit
        {...overrides}
      />
    </ThemeProvider>,
  );

  return { onSaved, preferences, ...utils };
}

describe('WebsitePersonalizationTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves personalised updates when dirty', async () => {
    saveWebsitePreferences.mockResolvedValue({ updatedAt: '2024-01-01T00:00:00.000Z' });

    const { onSaved } = renderTools();

    await userEvent.click(screen.getByRole('button', { name: /obsidian/i }));
    await userEvent.selectOptions(screen.getByLabelText(/Alt text enforcement/i), 'recommended');
    await userEvent.click(screen.getByLabelText(/Generate AI alt text suggestions/i));
    await userEvent.click(screen.getByLabelText(/Auto-translate new content/i));

    const saveButton = screen.getByRole('button', { name: /save personalisation/i });
    expect(saveButton).not.toBeDisabled();

    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(saveWebsitePreferences).toHaveBeenCalledWith(
        'user-99',
        expect.objectContaining({
          personalization: expect.objectContaining({
            theme: expect.objectContaining({ preset: 'obsidian' }),
            accessibility: expect.objectContaining({
              altText: expect.objectContaining({ enforcement: 'recommended', autoGenerate: false }),
              localisation: expect.objectContaining({ autoTranslate: false }),
            }),
          }),
        }),
      );
    });

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(await screen.findByText(/personalisation updated/i)).toBeInTheDocument();
  });

  it('shows an error message when saving fails', async () => {
    saveWebsitePreferences.mockRejectedValueOnce(new Error('Network unavailable'));

    renderTools();

    await userEvent.click(screen.getByRole('button', { name: /obsidian/i }));
    await userEvent.click(screen.getByRole('button', { name: /save personalisation/i }));

    expect(await screen.findByText(/network unavailable/i)).toBeInTheDocument();
  });
});
