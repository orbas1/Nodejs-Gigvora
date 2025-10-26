import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ProfileOverview from '../ProfileOverview.jsx';

describe('ProfileOverview', () => {
  const baseProfile = {
    name: 'Jordan Doe',
    headline: 'Product strategist',
    location: 'London, UK',
    missionStatement: 'Drive adoption with clarity.',
    avatarSeed: 'jordan',
  };

  it('renders profile information and highlights', () => {
    render(
      <ProfileOverview
        profile={baseProfile}
        profileNumber="42"
        impactHighlights={[
          { title: 'Gross bookings', value: '$2.4M', description: 'Managed across marketplace pods.' },
        ]}
        statusFlags={['available_now']}
        volunteerBadges={['mentor_elite']}
        areasOfFocus={['Brand systems', 'Conversion copy']}
      />,
    );

    expect(screen.getByText('Profile #42')).toBeInTheDocument();
    expect(screen.getByText('Jordan Doe')).toBeInTheDocument();
    expect(screen.getByText('Product strategist')).toBeInTheDocument();
    expect(screen.getByText('Gross bookings')).toBeInTheDocument();
    expect(screen.getByText('Available Now')).toBeInTheDocument();
    expect(screen.getByText('Mentor Elite')).toBeInTheDocument();
    expect(screen.getByText('Brand systems')).toBeInTheDocument();
  });

  it('calls edit handler when edit button is pressed', async () => {
    const onEdit = vi.fn();
    render(
      <ProfileOverview
        profile={baseProfile}
        canEdit
        onEdit={onEdit}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
    expect(onEdit).toHaveBeenCalled();
  });

  it('shows saving state when edit is disabled', async () => {
    const onEdit = vi.fn();
    render(
      <ProfileOverview
        profile={baseProfile}
        canEdit
        editDisabled
        onEdit={onEdit}
      />,
    );

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  });
});
