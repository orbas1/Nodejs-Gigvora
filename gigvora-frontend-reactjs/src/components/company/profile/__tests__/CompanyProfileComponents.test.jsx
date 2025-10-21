import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import CompanyConnectionsManager from '../CompanyConnectionsManager.jsx';
import CompanyFollowersManager from '../CompanyFollowersManager.jsx';
import CompanyProfileForm from '../CompanyProfileForm.jsx';
import CompanyProfileOverview from '../CompanyProfileOverview.jsx';

const sampleConnections = [
  {
    id: '1',
    relationshipType: 'Partner',
    status: 'active',
    contactEmail: 'ally@example.com',
    contactPhone: '+1 555 123 4567',
    notes: 'Quarterly sync',
    lastInteractedAt: '2024-06-01T00:00:00.000Z',
    target: { name: 'Ally Co', email: 'ally@example.com' },
  },
];

const sampleFollowers = [
  {
    followerId: 'u-1',
    follower: {
      name: 'Jamie Rivera',
      email: 'jamie@example.com',
      profile: { headline: 'Operations lead' },
    },
    status: 'active',
    notificationsEnabled: true,
    createdAt: '2024-05-01T12:00:00.000Z',
  },
];

describe('CompanyConnectionsManager', () => {
  it('submits a new connection and resets the form', async () => {
    const handleCreate = vi.fn().mockResolvedValue();

    render(
      <CompanyConnectionsManager
        connections={sampleConnections}
        onCreateConnection={handleCreate}
        onUpdateConnection={vi.fn()}
        onRemoveConnection={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/connection email/i), { target: { value: 'new.partner@example.com' } });
    fireEvent.change(screen.getByLabelText(/relationship type/i), { target: { value: 'Hiring lead' } });

    fireEvent.click(screen.getByRole('button', { name: /add connection/i }));

    await waitFor(() => expect(handleCreate).toHaveBeenCalled());

    expect(handleCreate).toHaveBeenCalledWith({
      targetEmail: 'new.partner@example.com',
      relationshipType: 'Hiring lead',
      status: 'pending',
      contactEmail: '',
      contactPhone: '',
      notes: '',
    });
    expect(screen.getByLabelText(/connection email/i)).toHaveValue('');
  });

  it('saves inline updates and removes entries', async () => {
    const handleUpdate = vi.fn().mockResolvedValue();
    const handleRemove = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <CompanyConnectionsManager
        connections={sampleConnections}
        onCreateConnection={vi.fn()}
        onUpdateConnection={handleUpdate}
        onRemoveConnection={handleRemove}
      />,
    );

    const row = screen.getByText('Ally Co').closest('tr');
    const relationshipInput = within(row).getByDisplayValue('Partner');

    fireEvent.change(relationshipInput, { target: { value: 'Strategic partner' } });
    const saveButton = within(row).getByRole('button', { name: /save/i });
    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);
    await waitFor(() => expect(handleUpdate).toHaveBeenCalled());

    expect(handleUpdate).toHaveBeenCalledWith('1', expect.objectContaining({ relationshipType: 'Strategic partner' }));

    fireEvent.click(within(row).getByRole('button', { name: /remove/i }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(handleRemove).toHaveBeenCalledWith('1');

    confirmSpy.mockRestore();
  });
});

describe('CompanyFollowersManager', () => {
  it('adds a follower and toggles preferences', async () => {
    const handleAdd = vi.fn().mockResolvedValue();
    const handleUpdate = vi.fn();
    const handleRemove = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <CompanyFollowersManager
        followers={sampleFollowers}
        onAddFollower={handleAdd}
        onUpdateFollower={handleUpdate}
        onRemoveFollower={handleRemove}
      />,
    );

    fireEvent.change(screen.getByLabelText(/follower email/i), { target: { value: 'new.follower@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /add follower/i }));

    await waitFor(() => expect(handleAdd).toHaveBeenCalled());

    expect(handleAdd).toHaveBeenCalledWith({
      email: 'new.follower@example.com',
      status: 'active',
      notificationsEnabled: true,
    });

    const followerRow = screen.getByText('Jamie Rivera').closest('tr');

    fireEvent.change(within(followerRow).getByRole('combobox'), { target: { value: 'blocked' } });
    expect(handleUpdate).toHaveBeenCalledWith('u-1', { status: 'blocked' });

    fireEvent.click(within(followerRow).getByRole('checkbox'));
    expect(handleUpdate).toHaveBeenCalledWith('u-1', { notificationsEnabled: false });

    fireEvent.click(within(followerRow).getByRole('button', { name: /remove/i }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(handleRemove).toHaveBeenCalledWith('u-1');

    confirmSpy.mockRestore();
  });
});

describe('CompanyProfileForm', () => {
  it('submits trimmed data and resets on cancel', () => {
    const profile = {
      companyName: 'Gigvora',
      tagline: 'Build better hiring',
      description: 'We connect teams and talent.',
      website: 'https://gigvora.example',
      contactEmail: 'hello@gigvora.example',
      contactPhone: '+1 555 1000',
      location: 'Austin, TX',
      socialLinks: [
        { label: 'LinkedIn', url: 'https://linkedin.com' },
        { label: '', url: '' },
      ],
    };
    const handleSubmit = vi.fn();
    const handleCancel = vi.fn();

    render(<CompanyProfileForm profile={profile} onSubmit={handleSubmit} onCancel={handleCancel} />);

    fireEvent.change(screen.getByLabelText(/company overview/i), { target: { value: ' Updated mission ' } });
    fireEvent.change(screen.getAllByPlaceholderText('https://...')[0], { target: { value: ' https://updated.example ' } });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(handleSubmit).toHaveBeenCalled();
    const submittedProfile = handleSubmit.mock.calls[0][0];
    expect(submittedProfile.description).toBe(' Updated mission ');
    expect(submittedProfile.socialLinks).toEqual([
      { label: 'LinkedIn', url: 'https://updated.example' },
    ]);

    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(handleCancel).toHaveBeenCalled();
    expect(screen.getByLabelText(/company overview/i)).toHaveValue(profile.description);
  });
});

describe('CompanyProfileOverview', () => {
  it('renders empty state when no profile provided', () => {
    render(<CompanyProfileOverview profile={null} metrics={{}} />);
    expect(screen.getByText(/complete your company profile/i)).toBeInTheDocument();
  });

  it('shows profile details and triggers actions', () => {
    const profile = {
      companyName: 'Gigvora',
      tagline: 'Build better hiring',
      description: 'We connect teams and talent.',
      website: 'https://gigvora.example',
      contactEmail: 'hello@gigvora.example',
      contactPhone: '+1 555 1000',
      socialLinks: [{ label: 'LinkedIn', url: 'https://linkedin.com' }],
      locationDetails: { formattedAddress: 'Austin, TX' },
    };
    const metrics = { followersTotal: 10, followersActive: 7, connectionsTotal: 5, connectionsPending: 2 };
    const handleEdit = vi.fn();
    const handleFans = vi.fn();
    const handleNetwork = vi.fn();

    render(
      <CompanyProfileOverview
        profile={profile}
        metrics={metrics}
        onEdit={handleEdit}
        onOpenFans={handleFans}
        onOpenNetwork={handleNetwork}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(handleEdit).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /open fans/i }));
    expect(handleFans).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /open network/i }));
    expect(handleNetwork).toHaveBeenCalled();

    expect(screen.getByText('Austin, TX')).toBeInTheDocument();
  });
});
