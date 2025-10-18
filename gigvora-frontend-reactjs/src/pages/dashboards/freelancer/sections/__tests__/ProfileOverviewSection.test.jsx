import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ProfileOverviewSection from '../ProfileOverviewSection.jsx';

const OVERVIEW_FIXTURE = {
  profile: {
    id: 42,
    firstName: 'Jordan',
    lastName: 'Lee',
    fullName: 'Jordan Lee',
    headline: 'Product Strategist',
    bio: 'I help founders build products people love.',
    missionStatement: 'Deliver strategic clarity for product teams.',
    location: 'Berlin, Germany',
    timezone: 'Europe/Berlin',
    title: 'Principal Strategist',
    hourlyRate: 120,
    skills: ['Strategy'],
    availability: {
      status: 'available',
      hoursPerWeek: 25,
      openToRemote: true,
      notes: 'Balancing two retainers.',
    },
    stats: {
      followerCount: 18,
      connectionCount: 11,
      pendingConnections: 3,
    },
    connections: {
      pendingIncoming: [],
      pendingOutgoing: [],
      accepted: [],
    },
    followers: { preview: [] },
    avatar: { url: null, initials: 'JL' },
  },
};

function setup(overrides = {}) {
  const props = {
    overview: OVERVIEW_FIXTURE,
    loading: false,
    saving: false,
    avatarUploading: false,
    connectionSaving: false,
    error: null,
    onRefresh: vi.fn(),
    onSave: vi.fn().mockResolvedValue({}),
    onUploadAvatar: vi.fn().mockResolvedValue({}),
    onCreateConnection: vi.fn().mockResolvedValue({}),
    onUpdateConnection: vi.fn().mockResolvedValue({}),
    onDeleteConnection: vi.fn().mockResolvedValue({}),
    ...overrides,
  };

  render(<ProfileOverviewSection {...props} />);
  return props;
}

describe('ProfileOverviewSection', () => {
  it('saves profile details from the info drawer', async () => {
    const props = setup();

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    await waitFor(() => expect(screen.getByRole('dialog', { name: /profile/i })).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/^Title$/i), {
      target: { value: 'Fractional Lead' },
    });

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    fireEvent.change(screen.getByLabelText(/^Headline$/i), {
      target: { value: 'Product Lead' },
    });
    fireEvent.change(screen.getByLabelText(/^Bio$/i), {
      target: { value: 'Build products people rely on.' },
    });
    fireEvent.change(screen.getByLabelText(/^Mission$/i), {
      target: { value: 'Empower teams to ship outcomes.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    fireEvent.change(screen.getByLabelText(/^Location$/i), {
      target: { value: 'Lisbon, Portugal' },
    });
    fireEvent.change(screen.getByLabelText(/^Timezone$/i), {
      target: { value: 'Europe/Lisbon' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(props.onSave).toHaveBeenCalledTimes(1));

    expect(props.onSave).toHaveBeenCalledWith({
      firstName: 'Jordan',
      lastName: 'Lee',
      headline: 'Product Lead',
      bio: 'Build products people rely on.',
      missionStatement: 'Empower teams to ship outcomes.',
      location: 'Lisbon, Portugal',
      timezone: 'Europe/Lisbon',
      title: 'Fractional Lead',
      hourlyRate: 120,
      availability: {
        status: 'available',
        hoursPerWeek: 25,
        openToRemote: true,
        notes: 'Balancing two retainers.',
      },
      skillTags: ['Strategy'],
    });
  });

  it('applies availability changes from the drawer', async () => {
    const props = setup();

    fireEvent.click(screen.getByRole('button', { name: /^availability$/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /availability/i })).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/^Status$/i), { target: { value: 'limited' } });
    fireEvent.change(screen.getByLabelText(/Hours per week/i), { target: { value: '30' } });
    fireEvent.click(screen.getByLabelText(/Remote ready/i));
    fireEvent.change(screen.getByLabelText(/Hourly rate/i), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText(/^Notes$/i), {
      target: { value: 'New onboarding timeline.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(props.onSave).toHaveBeenCalledTimes(1));

    expect(props.onSave).toHaveBeenCalledWith({
      firstName: 'Jordan',
      lastName: 'Lee',
      headline: 'Product Strategist',
      bio: 'I help founders build products people love.',
      missionStatement: 'Deliver strategic clarity for product teams.',
      location: 'Berlin, Germany',
      timezone: 'Europe/Berlin',
      title: 'Principal Strategist',
      hourlyRate: 150,
      availability: {
        status: 'limited',
        hoursPerWeek: 30,
        openToRemote: false,
        notes: 'New onboarding timeline.',
      },
      skillTags: ['Strategy'],
    });
  });

  it('sends a connection invite from the network dialog', async () => {
    const props = setup();

    fireEvent.click(screen.getByRole('button', { name: /connections/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /network/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /invite/i }));

    fireEvent.change(screen.getByLabelText(/^Email$/i), {
      target: { value: 'client@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^send$/i }));

    await waitFor(() => expect(props.onCreateConnection).toHaveBeenCalledTimes(1));
    expect(props.onCreateConnection).toHaveBeenCalledWith({ email: 'client@example.com' });
  });
});
