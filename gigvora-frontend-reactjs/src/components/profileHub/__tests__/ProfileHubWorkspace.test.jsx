import { vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileHubWorkspace from '../workspace/ProfileHubWorkspace.jsx';

const updateProfileDetails = vi.fn();
const uploadProfileAvatar = vi.fn();
const saveFollower = vi.fn();
const deleteFollower = vi.fn();
const updateConnection = vi.fn();

vi.mock('../../../services/profileHub.js', () => ({
  updateProfileDetails: (...args) => updateProfileDetails(...args),
  uploadProfileAvatar: (...args) => uploadProfileAvatar(...args),
  saveFollower: (...args) => saveFollower(...args),
  deleteFollower: (...args) => deleteFollower(...args),
  updateConnection: (...args) => updateConnection(...args),
}));

const baseProfileOverview = {
  profileId: 'profile-1',
  name: 'Jordan Lee',
  headline: 'Product Lead',
  missionStatement: 'Building digital ventures',
  bio: 'Product leader',
  location: 'Berlin',
  timezone: 'Europe/Berlin',
};

const baseProfileHub = {
  settings: {
    profileVisibility: 'members',
    networkVisibility: 'connections',
    followersVisibility: 'connections',
    socialLinks: [{ id: 'link-1', label: 'Website', url: 'https://example.com', description: 'Site' }],
  },
  followers: {
    items: [],
    pending: [],
  },
  connections: {
    items: [
      {
        id: 'con-1',
        relationshipTag: 'Partner',
        favourite: false,
        visibility: 'connections',
        lastInteractedAt: '2024-01-15T00:00:00Z',
        notes: 'Quarterly syncs',
        counterpart: { name: 'Alex Doe', headline: 'Founder', avatarSeed: 'alex' },
      },
    ],
    pending: [],
  },
  workspace: {
    metrics: {
      followers: 42,
      activeFollowers: 38,
      connections: 12,
      favouriteConnections: 4,
      timelinePublished: 6,
      portfolioPublished: 3,
      engagementRate: '62%',
    },
    highlights: ['42 followers tuning into updates'],
    actions: ['Review and schedule pending timeline drafts.'],
    cadenceGoal: 'Publish twice weekly',
    timezone: 'Europe/Berlin',
    pinnedCampaigns: [{ id: 'camp-1', name: 'Founders Summit' }],
  },
};

describe('ProfileHubWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWorkspace = (override = {}) => {
    const props = {
      userId: 'user-1',
      profileOverview: baseProfileOverview,
      profileHub: baseProfileHub,
      onRefresh: vi.fn(),
      ...override,
    };

    const result = render(<ProfileHubWorkspace {...props} />);
    return { ...result, props };
  };

  it('saves profile changes from the info panel', async () => {
    updateProfileDetails.mockResolvedValue({});
    const user = userEvent.setup();
    const { props } = renderWorkspace();

    const headlineInput = await screen.findByLabelText('Name headline');
    await user.clear(headlineInput);
    await user.type(headlineInput, 'Chief Product Officer');

    const saveButton = await screen.findByRole('button', { name: /^save$/i });
    await act(async () => {
      await user.click(saveButton);
    });

    await waitFor(() => {
      expect(updateProfileDetails).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ headline: 'Chief Product Officer' }),
      );
    });
    expect(props.onRefresh).toHaveBeenCalled();
  });

  it('uploads a new avatar via pasted URL', async () => {
    uploadProfileAvatar.mockResolvedValue({});
    const user = userEvent.setup();
    renderWorkspace();

    const photoTab = await screen.findByRole('button', { name: 'Photo' });
    await act(async () => {
      await user.click(photoTab);
    });

    const urlInput = await screen.findByPlaceholderText('https://');
    await user.type(urlInput, 'https://cdn.example.com/avatar.png');
    const applyButton = await screen.findByRole('button', { name: /apply/i });
    await act(async () => {
      await user.click(applyButton);
    });

    await waitFor(() => {
      expect(uploadProfileAvatar).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ avatarUrl: 'https://cdn.example.com/avatar.png' }),
      );
    });
  });

  it('adds a follower from the followers panel', async () => {
    const followerRecord = {
      followerId: 'fol-2',
      status: 'active',
      displayName: 'Taylor',
      summary: { name: 'Taylor', headline: 'Engineer' },
    };
    saveFollower.mockResolvedValue(followerRecord);
    const user = userEvent.setup();
    renderWorkspace();

    const followersTab = await screen.findByRole('button', { name: 'Followers' });
    await act(async () => {
      await user.click(followersTab);
    });

    await user.type(await screen.findByLabelText('Email or ID'), 'ally@example.com');
    await user.type(screen.getByLabelText('Display name'), 'Ally');
    await user.type(screen.getByLabelText('Tags'), 'alpha, beta');

    const addButton = screen.getByRole('button', { name: /^add$/i });
    await act(async () => {
      await user.click(addButton);
    });

    await waitFor(() => {
      expect(saveFollower).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ followerEmail: 'ally@example.com', displayName: 'Ally' }),
      );
    });
  });

  it('toggles a connection favourite state', async () => {
    updateConnection.mockResolvedValue({ ...baseProfileHub.connections.items[0], favourite: true });
    const user = userEvent.setup();
    renderWorkspace();

    const connectionsTab = await screen.findByRole('button', { name: 'Connections' });
    await act(async () => {
      await user.click(connectionsTab);
    });

    const starButton = await screen.findByRole('button', { name: /^star$/i });
    await act(async () => {
      await user.click(starButton);
    });

    await waitFor(() => {
      expect(updateConnection).toHaveBeenCalledWith(
        'user-1',
        'con-1',
        expect.objectContaining({ favourite: true }),
      );
    });
  });

  it('surfaces workspace summary metrics and actions', async () => {
    renderWorkspace();

    expect(await screen.findByText(/Profile completeness/i)).toBeInTheDocument();
    expect(screen.getByText('Publish twice weekly')).toBeInTheDocument();
    expect(screen.getByText('42 followers tuning into updates')).toBeInTheDocument();
    expect(screen.getByText(/Review and schedule pending timeline drafts\./i)).toBeInTheDocument();
    expect(screen.getByText('Founders Summit')).toBeInTheDocument();
  });

  it('alerts when profile changes diverge from the saved baseline', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    const headlineInput = await screen.findByLabelText('Name headline');
    await user.clear(headlineInput);
    await user.type(headlineInput, 'Chief Product Officer');

    expect(await screen.findByText(/Unsaved changes/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Reset draft/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Name headline')).toHaveValue('Product Lead');
    });
    expect(screen.queryByText(/Unsaved changes/i)).not.toBeInTheDocument();
  });
});
