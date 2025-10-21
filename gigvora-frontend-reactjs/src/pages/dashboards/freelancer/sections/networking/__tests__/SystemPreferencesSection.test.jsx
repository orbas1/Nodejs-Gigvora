import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SystemPreferencesSection from '../SystemPreferencesSection.jsx';

const defaultPreferences = {
  shareAvailability: false,
  autoShareCard: false,
  allowMentorIntroductions: false,
  followUpReminders: true,
  autoAcceptInvites: false,
  notifyOnOrders: true,
  calendarSync: 'google',
  digestFrequency: 'weekly',
};

describe('SystemPreferencesSection', () => {
  it('invokes the update handler when toggling a preference', async () => {
    const handleUpdate = vi.fn().mockResolvedValue({});

    render(
      <SystemPreferencesSection
        preferences={defaultPreferences}
        saving={false}
        onUpdate={handleUpdate}
      />,
    );

    fireEvent.click(screen.getByLabelText('Share live availability'));

    await waitFor(() => {
      expect(handleUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ shareAvailability: true }),
      );
    });
    expect(await screen.findByText('Preferences updated.')).toBeInTheDocument();
  });

  it('informs the user when updates are not permitted', async () => {
    render(
      <SystemPreferencesSection
        preferences={defaultPreferences}
        saving={false}
      />,
    );

    fireEvent.click(screen.getByLabelText('Share live availability'));

    expect(
      await screen.findByText('You do not have permission to update these preferences.'),
    ).toBeInTheDocument();
  });
});
