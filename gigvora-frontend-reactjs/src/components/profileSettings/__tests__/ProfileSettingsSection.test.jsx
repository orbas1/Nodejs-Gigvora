import { vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileSettingsSection from '../ProfileSettingsSection.jsx';

vi.mock('../../ProfileEditor.jsx', () => ({
  default: ({ open }) => (open ? <div data-testid="profile-editor" /> : null),
}));

const updateProfile = vi.fn();
const updateUserAccount = vi.fn();

vi.mock('../../../services/profile.js', () => ({
  updateProfile: (...args) => updateProfile(...args),
}));

vi.mock('../../../services/user.js', () => ({
  updateUserAccount: (...args) => updateUserAccount(...args),
}));

const baseProfile = {
  firstName: 'Jordan',
  lastName: 'Lee',
  email: 'jordan@example.com',
  userLocation: 'Berlin',
  timezone: 'Europe/Berlin',
  headline: 'Product Lead',
  missionStatement: 'Build ventures',
  bio: 'Product leader',
  skills: ['Strategy'],
  areasOfFocus: ['Product'],
  preferredEngagements: ['Full-time'],
  statusFlags: [],
  volunteerBadges: [],
  experience: [],
  qualifications: [],
  portfolioLinks: [],
  references: [],
  collaborationRoster: [],
  impactHighlights: [],
  pipelineInsights: [],
  availability: {
    status: 'limited',
    hoursPerWeek: 20,
    openToRemote: true,
    notes: 'Mon-Thu',
    timezone: 'Europe/Berlin',
    lastUpdatedAt: '2024-01-01T00:00:00Z',
  },
  metrics: {
    profileCompletion: 82,
    trustScore: 4.5,
  },
  launchpadEligibility: {
    status: 'eligible',
  },
};

describe('ProfileSettingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves identity updates through the account service', async () => {
    updateUserAccount.mockResolvedValue({});
    const onRefresh = vi.fn();
    const user = userEvent.setup();

    render(
      <ProfileSettingsSection
        profile={baseProfile}
        userId="user-1"
        onRefresh={onRefresh}
        session={{ memberships: ['user'] }}
      />,
    );

    const identitySection = screen.getByRole('heading', { name: /identity/i }).closest('section');
    const firstNameInput = within(identitySection).getByLabelText('First name');
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Jordan Updated');

    const saveButton = within(identitySection).getByRole('button', { name: /^save$/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(updateUserAccount).toHaveBeenCalledWith('user-1', expect.objectContaining({
        firstName: 'Jordan Updated',
      }));
    });
    expect(onRefresh).toHaveBeenCalledWith(expect.objectContaining({ force: true }));
  });

  it('persists profile draft changes via the profile service', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    const updatedProfile = { ...baseProfile, headline: 'Product Visionary' };
    updateProfile.mockResolvedValue(updatedProfile);

    render(
      <ProfileSettingsSection
        profile={baseProfile}
        userId="user-1"
        onRefresh={onRefresh}
        session={{ memberships: ['user'] }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /story/i }));
    const headlineInput = screen.getByLabelText('Headline');
    await user.clear(headlineInput);
    await user.type(headlineInput, 'Product Visionary');

    const saveButton = screen.getByRole('button', { name: /^save$/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ headline: 'Product Visionary' }),
      );
    });
    expect(onRefresh).toHaveBeenCalledWith(expect.objectContaining({ force: true }));
  });
});
