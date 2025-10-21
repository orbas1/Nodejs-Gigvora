import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

const { mockUseSession, mockUseFreelancerTimeline } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
  mockUseFreelancerTimeline: vi.fn(),
}));

vi.mock('../../../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: mockUseSession,
}));

vi.mock('../../../../../hooks/useFreelancerTimeline.js', () => ({
  __esModule: true,
  default: mockUseFreelancerTimeline,
}));

const TimelineManagementSection = (await import('../timeline/TimelineManagementSection.jsx')).default;

const baseTimelineResponse = {
  workspace: { timezone: 'UTC' },
  posts: [],
  timelineEntries: [],
  analytics: {
    totals: { posts: 0, published: 0, engagementRate: 0, impressions: 0, reactions: 0 },
    timelineSummary: { planned: 0, in_progress: 0, completed: 0, blocked: 0, upcoming: 0 },
    trend: [],
    topPosts: [],
    topTags: [],
  },
  loading: false,
  error: null,
  fromCache: false,
  lastUpdated: null,
  savingSettings: false,
  savingPost: false,
  savingEntry: false,
  savingMetrics: false,
  refresh: vi.fn(),
  saveSettings: vi.fn(),
  createPost: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
  publishPost: vi.fn(),
  recordMetrics: vi.fn(),
  createEntry: vi.fn(),
  updateEntry: vi.fn(),
  deleteEntry: vi.fn(),
  isNetworkEnabled: true,
};

describe('TimelineManagementSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({
      session: {
        activeRole: 'freelancer',
        freelancerId: 'freelancer-55',
        memberships: ['freelancer'],
        workspace: { type: 'freelancer' },
      },
    });
    mockUseFreelancerTimeline.mockReturnValue({ ...baseTimelineResponse });
  });

  it('limits access when the user is not a freelancer', () => {
    mockUseSession.mockReturnValue({
      session: { activeRole: 'viewer', memberships: [], workspace: { type: 'client' } },
    });

    render(<TimelineManagementSection />);

    expect(screen.getByText(/timeline tools are limited/i)).toBeInTheDocument();
  });

  it('creates new entries from the plan view', async () => {
    const createEntry = vi.fn().mockResolvedValue({ id: 'entry-99' });
    mockUseFreelancerTimeline.mockReturnValue({
      ...baseTimelineResponse,
      workspace: { timezone: 'Europe/London' },
      posts: [
        {
          id: 'post-1',
          title: 'Launch announcement',
          status: 'published',
          visibility: 'public',
          summary: 'Shared launch metrics.',
          publishedAt: '2024-04-01T12:00:00Z',
          tags: ['launch'],
        },
      ],
      timelineEntries: [
        {
          id: 'entry-1',
          title: 'Sprint kickoff',
          status: 'planned',
          entryType: 'milestone',
          startAt: '2024-04-15T09:00:00Z',
          endAt: '2024-04-15T10:00:00Z',
          channel: 'LinkedIn',
          owner: 'Taylor Rivera',
          linkedPost: { id: 'post-1', title: 'Launch announcement', status: 'published' },
        },
      ],
      createEntry,
    });

    render(<TimelineManagementSection />);

    fireEvent.click(screen.getByRole('button', { name: /posts/i }));
    expect(await screen.findByText(/post library/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /plan/i }));

    fireEvent.click(screen.getByRole('button', { name: /new entry/i }));

    const titleInput = await screen.findByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'April update sync' } });

    fireEvent.click(screen.getByRole('button', { name: /save entry/i }));

    await waitFor(() => expect(createEntry).toHaveBeenCalledTimes(1));
    expect(createEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'April update sync',
        entryType: 'milestone',
        status: 'planned',
      }),
    );
  });
});
