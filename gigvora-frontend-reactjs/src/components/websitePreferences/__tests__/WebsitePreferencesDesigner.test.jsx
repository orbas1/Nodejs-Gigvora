import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import WebsitePreferencesDesigner from '../WebsitePreferencesDesigner.jsx';
import { saveWebsitePreferences } from '../../../services/websitePreferences.js';

vi.mock('../../../services/websitePreferences.js', () => ({
  __esModule: true,
  saveWebsitePreferences: vi.fn(),
}));

describe('WebsitePreferencesDesigner', () => {
  const buildPreferences = () => ({
    settings: {
      siteTitle: 'Atlas Studio',
      tagline: 'Original tagline',
      siteSlug: 'atlas-studio',
      published: false,
      language: 'en',
      customDomain: '',
    },
    hero: {
      kicker: 'Hero kicker',
      headline: 'Make better launches',
      subheadline: 'Ship faster with guided talent',
      primaryCtaLabel: 'Book call',
      primaryCtaLink: '#contact',
      secondaryCtaLabel: '',
      secondaryCtaLink: '',
    },
    about: {
      title: 'About',
      body: 'We build standout brands.',
      highlights: [],
    },
  });

  const renderDesigner = (props = {}) => {
    const onClose = vi.fn();
    const onSaved = vi.fn();
    const utils = render(
      <WebsitePreferencesDesigner
        open
        userId="user-55"
        canEdit
        initialPreferences={buildPreferences()}
        onClose={onClose}
        onSaved={onSaved}
        {...props}
      />,
    );

    return { onClose, onSaved, ...utils };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits updated preferences and surfaces success feedback', async () => {
    const payload = {
      ...buildPreferences(),
      settings: {
        ...buildPreferences().settings,
        tagline: 'Refined experiences delivered',
      },
      updatedAt: '2024-10-22T10:15:00.000Z',
    };

    saveWebsitePreferences.mockResolvedValue(payload);

    const { onSaved } = renderDesigner();

    const taglineInput = screen.getByLabelText(/tagline/i);
    await userEvent.clear(taglineInput);
    await userEvent.type(taglineInput, 'Refined experiences delivered');

    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(saveWebsitePreferences).toHaveBeenCalledWith(
        'user-55',
        expect.objectContaining({
          settings: expect.objectContaining({ tagline: 'Refined experiences delivered' }),
        }),
      );
    });

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(payload));
    expect(await screen.findByText(/updated/i)).toBeInTheDocument();
  });

  it('resets unsaved changes when requested', async () => {
    renderDesigner();

    const taglineInput = screen.getByLabelText(/tagline/i);
    await userEvent.clear(taglineInput);
    await userEvent.type(taglineInput, 'New draft tagline');
    expect(taglineInput).toHaveValue('New draft tagline');

    await userEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(taglineInput).toHaveValue('Original tagline');
  });

  it('shows an error when saving fails', async () => {
    saveWebsitePreferences.mockRejectedValueOnce(new Error('Server unavailable'));

    const { onSaved } = renderDesigner();

    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect(await screen.findByText(/server unavailable/i)).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('disables editing when the viewer lacks permission', () => {
    renderDesigner({ canEdit: false });

    expect(screen.getByLabelText(/tagline/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled();
  });
});
