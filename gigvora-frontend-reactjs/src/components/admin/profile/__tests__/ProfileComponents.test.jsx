import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ProfileCreateModal from '../ProfileCreateModal.jsx';
import ProfileDetailDrawer from '../ProfileDetailDrawer.jsx';
import ProfileFilters from '../ProfileFilters.jsx';
import ProfileList from '../ProfileList.jsx';

const SAMPLE_PROFILE = {
  id: 'profile-1',
  user: {
    firstName: 'Alana',
    lastName: 'North',
    email: 'alana@gigvora.com',
    userType: 'freelancer',
    memberships: ['growth'],
  },
  profile: {
    headline: 'Go-to-market strategist',
    bio: 'Helping companies scale repeatable revenue.',
    missionStatement: 'Build human-centric go-to-market systems.',
    availabilityStatus: 'limited',
    profileVisibility: 'members',
    networkVisibility: 'connections',
    followersVisibility: 'connections',
    trustScore: 92,
    profileCompletion: 86,
    areasOfFocus: ['GTM'],
  },
  trustScore: 92,
  profileCompletion: 86,
  availabilityStatus: 'limited',
  updatedAt: '2024-05-01T11:00:00.000Z',
};

describe('ProfileCreateModal', () => {
  it('collects form data and sends structured payload', async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();

    render(
      <ProfileCreateModal
        open
        onClose={vi.fn()}
        onCreate={onCreate}
        loading={false}
      />,
    );

    await user.type(screen.getByLabelText(/First name/i), 'Jamie');
    await user.type(screen.getByLabelText(/Last name/i), 'Rivera');
    await user.type(screen.getByLabelText(/Email/i), 'jamie@gigvora.com');
    await user.selectOptions(screen.getByLabelText(/Primary role/i), 'admin');
    await user.type(screen.getByLabelText(/Membership tags/i), 'pro, beta');
    await user.type(screen.getByLabelText(/Headline/i), 'Community lead');
    await user.type(screen.getByLabelText(/Mission statement/i), 'Put people first.');
    await user.type(screen.getByLabelText(/Internal note/i), 'Invite to beta cohort');

    await user.click(screen.getByRole('button', { name: /Create profile/i }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({
          firstName: 'Jamie',
          memberships: ['pro', 'beta'],
          userType: 'admin',
        }),
        profile: expect.objectContaining({
          headline: 'Community lead',
          missionStatement: 'Put people first.',
        }),
        notes: expect.objectContaining({ body: 'Invite to beta cohort' }),
      }),
    );
  });
});

describe('ProfileDetailDrawer', () => {
  it('normalises numeric and JSON fields when saving', async () => {
    const onSaveProfile = vi.fn().mockResolvedValue();
    const user = userEvent.setup();

    render(
      <ProfileDetailDrawer
        open
        profile={SAMPLE_PROFILE}
        loading={false}
        error={null}
        onClose={vi.fn()}
        onRefresh={vi.fn()}
        onSaveProfile={onSaveProfile}
        onCreateReference={vi.fn()}
        onUpdateReference={vi.fn()}
        onDeleteReference={vi.fn()}
        onCreateNote={vi.fn()}
        onUpdateNote={vi.fn()}
        onDeleteNote={vi.fn()}
      />,
    );

    await user.clear(screen.getByLabelText(/Membership tag/i));
    await user.type(screen.getByLabelText(/Membership tag/i), 'growth, enterprise');
    await user.clear(screen.getByLabelText(/Trust score/i));
    await user.type(screen.getByLabelText(/Trust score/i), '95');
    await user.clear(screen.getByLabelText(/Areas of focus/i));
    await user.type(screen.getByLabelText(/Areas of focus/i), '["Enterprise"]');

    await user.click(screen.getAllByRole('button', { name: /Save changes/i })[0]);

    await waitFor(() => {
      expect(onSaveProfile).toHaveBeenCalled();
    });

    const payload = onSaveProfile.mock.calls[0][0];
    expect(payload.user.memberships).toEqual(['growth', 'enterprise']);
    expect(payload.profile.trustScore).toBe(95);
    expect(payload.profile.areasOfFocus).toEqual(['Enterprise']);
  });
});

describe('ProfileFilters', () => {
  it('submits search and clears filters', async () => {
    const onFiltersChange = vi.fn();
    const onCreate = vi.fn();
    const user = userEvent.setup();

    render(
      <ProfileFilters
        filters={{ search: '', availability: '', userType: '', membership: '', hasAvatar: '', sortBy: 'recent' }}
        onFiltersChange={onFiltersChange}
        onCreate={onCreate}
      />,
    );

    await user.type(screen.getByLabelText(/Search profiles/i), 'nora');
    await user.click(screen.getByRole('button', { name: /Apply search/i }));
    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'nora' }),
    );

    await user.selectOptions(screen.getByLabelText(/Availability/i), 'open');
    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ availability: 'open' }),
    );

    await user.click(screen.getByRole('button', { name: /New profile/i }));
    expect(onCreate).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Clear filters/i }));
    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: '', availability: '' }),
    );
  });
});

describe('ProfileList', () => {
  it('shows error and selection states', async () => {
    const onRetry = vi.fn();
    const onSelect = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <ProfileList
        profiles={[]}
        loading={false}
        error={new Error('Network error')}
        onRetry={onRetry}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Try again/i }));
    expect(onRetry).toHaveBeenCalled();

    rerender(
      <ProfileList
        profiles={[SAMPLE_PROFILE]}
        loading={false}
        error={null}
        onRetry={onRetry}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByText('Alana North'));
    expect(onSelect).toHaveBeenCalledWith(SAMPLE_PROFILE);
  });
});
