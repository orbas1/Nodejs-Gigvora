import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../../../hooks/useSession.js', () => ({
  default: vi.fn(),
}));

vi.mock('../../../../../../hooks/useFreelancerTimeline.js', () => ({
  default: vi.fn(),
}));

import useSession from '../../../../../../hooks/useSession.js';
import useFreelancerTimeline from '../../../../../../hooks/useFreelancerTimeline.js';

import TimelineDrawer from '../TimelineDrawer.jsx';
import TimelineEntryDrawer from '../TimelineEntryDrawer.jsx';
import TimelineManagementSection from '../TimelineManagementSection.jsx';
import TimelineMetricsView from '../TimelineMetricsView.jsx';
import TimelinePlanView from '../TimelinePlanView.jsx';
import TimelinePostDrawer from '../TimelinePostDrawer.jsx';
import TimelinePostsView from '../TimelinePostsView.jsx';
import TimelineSettingsDrawer from '../TimelineSettingsDrawer.jsx';
import TimelineToolbar from '../TimelineToolbar.jsx';

const mockSession = useSession;
const mockTimeline = useFreelancerTimeline;

let timelineState;

describe('freelancer timeline components', () => {
  beforeEach(() => {
    mockSession.mockReturnValue({
      session: {
        role: 'Freelancer',
        memberships: ['freelancer'],
        workspace: { role: 'freelancer', type: 'freelancer' },
        freelancerId: 'freelancer-1',
      },
    });

    timelineState = {
      workspace: {
        timezone: 'UTC',
        defaultVisibility: 'public',
        autoShareToFeed: true,
        reviewBeforePublish: false,
        cadenceGoal: 4,
        distributionChannels: ['Feed'],
        contentThemes: ['Updates'],
        pinnedCampaigns: ['Launch'],
      },
      posts: [
        {
          id: 'post-1',
          title: 'Launch recap',
          summary: 'Highlights from the launch',
          status: 'draft',
          visibility: 'public',
          publishedAt: null,
          scheduledAt: '2024-04-02T10:00:00Z',
          tags: ['Launch'],
        },
      ],
      timelineEntries: [
        {
          id: 'entry-1',
          title: 'Plan launch',
          status: 'planned',
          entryType: 'milestone',
          startAt: '2024-03-30T09:00:00Z',
          endAt: '2024-03-31T17:00:00Z',
          channel: 'LinkedIn',
          owner: 'Taylor',
        },
      ],
      analytics: {
        totals: { posts: 4, published: 2, engagementRate: 0.26, impressions: 1600, reactions: 480 },
        timelineSummary: { planned: 1, in_progress: 0, completed: 2, blocked: 0, upcoming: 1 },
        trend: [
          { capturedAt: '2024-03-30', impressions: 400, reactions: 80 },
          { capturedAt: '2024-03-31', impressions: 600, reactions: 120 },
        ],
        topPosts: [
          {
            id: 'post-2',
            title: 'Weekly recap',
            metrics: { totals: { impressions: 1200, engagementRate: 0.22 } },
          },
        ],
        topTags: [{ tag: 'Launch' }, { tag: 'Growth' }],
      },
      loading: false,
      error: null,
      fromCache: false,
      lastUpdated: '2024-03-31T12:00:00Z',
      savingSettings: false,
      savingPost: false,
      savingEntry: false,
      savingMetrics: false,
      refresh: vi.fn().mockResolvedValue(undefined),
      saveSettings: vi.fn().mockResolvedValue(undefined),
      createPost: vi.fn().mockResolvedValue(undefined),
      updatePost: vi.fn().mockResolvedValue(undefined),
      deletePost: vi.fn().mockResolvedValue(undefined),
      publishPost: vi.fn().mockResolvedValue(undefined),
      recordMetrics: vi.fn().mockResolvedValue(undefined),
      createEntry: vi.fn().mockResolvedValue(undefined),
      updateEntry: vi.fn().mockResolvedValue(undefined),
      deleteEntry: vi.fn().mockResolvedValue(undefined),
      isNetworkEnabled: true,
    };

    mockTimeline.mockReturnValue(timelineState);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the toolbar with view switching and actions', async () => {
    const onChange = vi.fn();
    const onOpenSettings = vi.fn();
    const onRefresh = vi.fn();
    const user = userEvent.setup();

    render(
      <TimelineToolbar
        activeView="plan"
        onChange={onChange}
        onOpenSettings={onOpenSettings}
        onRefresh={onRefresh}
        refreshing={false}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Posts' }));
    expect(onChange).toHaveBeenCalledWith('posts');

    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('groups timeline entries by status and surfaces creation actions', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const onOpen = vi.fn();

    render(
      <TimelinePlanView
        entries={[
          {
            id: 'entry-1',
            title: 'Kick-off',
            status: 'planned',
            entryType: 'milestone',
            startAt: '2024-03-01T09:00:00Z',
            channel: 'Email',
            owner: 'Taylor',
          },
          {
            id: 'entry-2',
            title: 'Launch sprint',
            status: 'in_progress',
            entryType: 'campaign',
            startAt: '2024-03-02T09:00:00Z',
          },
        ]}
        timezone="UTC"
        onCreateEntry={onCreate}
        onOpenEntry={onOpen}
      />,
    );

    expect(screen.getByText('Timeline board')).toBeInTheDocument();
    expect(screen.getByText('Kick-off')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'New entry' }));
    expect(onCreate).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /Kick-off/ }));
    expect(onOpen).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'entry-1', title: 'Kick-off' }),
    );
  });

  it('submits timeline entries with normalised payloads', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onDelete = vi.fn();

    render(
      <TimelineEntryDrawer
        open
        mode="create"
        entry={null}
        posts={[{ id: 'post-1', title: 'Launch' }]}
        onClose={() => {}}
        onSubmit={onSubmit}
        onDelete={onDelete}
        saving={false}
      />,
    );

    await user.type(screen.getByLabelText('Title'), ' Launch plan ');
    await user.selectOptions(screen.getByLabelText('Status'), 'completed');
    await user.selectOptions(screen.getByLabelText('Type'), 'campaign');
    await user.selectOptions(screen.getByLabelText('Linked post'), 'post-1');
    await user.type(screen.getByLabelText('Description'), ' Outline key milestones ');
    await user.type(screen.getByLabelText('Start'), '2024-03-01T09:00');
    await user.type(screen.getByLabelText('End'), '2024-03-02T09:00');
    await user.type(screen.getByLabelText('Channel'), ' Email ');
    await user.type(screen.getByLabelText('Owner'), ' Taylor ');
    await user.type(screen.getByLabelText('Location'), ' Remote ');
    await user.type(screen.getByLabelText('Tags'), ' Launch, Strategy ');

    await user.click(screen.getByRole('button', { name: 'Save entry' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Launch plan',
        status: 'completed',
        entryType: 'campaign',
        channel: 'Email',
        owner: 'Taylor',
        location: 'Remote',
        tags: ['Launch', 'Strategy'],
        startAt: new Date('2024-03-01T09:00').toISOString(),
        endAt: new Date('2024-03-02T09:00').toISOString(),
      }),
      null,
    );

    // Delete should only be available in edit mode
    const { rerender } = render(
      <TimelineEntryDrawer
        open
        mode="edit"
        entry={{ id: 'entry-1', title: 'Existing' }}
        posts={[]}
        onClose={() => {}}
        onSubmit={onSubmit}
        onDelete={onDelete}
        saving={false}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'entry-1' }));
    rerender(<></>);
  });

  it('supports post management flows including metrics updates', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onDelete = vi.fn();
    const onPublish = vi.fn();
    const onRecordMetrics = vi.fn();

    render(
      <TimelinePostDrawer
        open
        mode="edit"
        post={{
          id: 'post-1',
          title: 'Launch recap',
          summary: 'Before update',
          status: 'draft',
          visibility: 'public',
          scheduledAt: '2024-04-02T10:00:00Z',
          timezone: 'UTC',
          allowComments: true,
          tags: ['Launch'],
          targetAudience: [{ label: 'Clients', id: 'clients' }],
          attachments: [{ label: 'Brief', url: 'https://example.com/brief.pdf' }],
        }}
        onClose={() => {}}
        onSubmit={onSubmit}
        onDelete={onDelete}
        onPublish={onPublish}
        onRecordMetrics={onRecordMetrics}
        savingPost={false}
        savingMetrics={false}
      />,
    );

    await user.clear(screen.getByLabelText('Summary'));
    await user.type(screen.getByLabelText('Summary'), ' Updated story ');
    await user.click(screen.getByLabelText('Allow comments'));
    await user.clear(screen.getByLabelText('Tags'));
    await user.type(screen.getByLabelText('Tags'), ' Launch, Growth ');
    await user.clear(screen.getByLabelText('Audience'));
    await user.type(screen.getByLabelText('Audience'), 'Clients, Investors');
    await user.clear(screen.getByLabelText('Assets'));
    await user.type(screen.getByLabelText('Assets'), 'Report|https://example.com/report.pdf');

    await user.click(screen.getByRole('button', { name: 'Publish' }));
    expect(onPublish).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Save post' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: 'Updated story',
        allowComments: false,
        tags: ['Launch', 'Growth'],
        targetAudience: expect.arrayContaining([
          expect.objectContaining({ label: 'Clients' }),
          expect.objectContaining({ label: 'Investors' }),
        ]),
        attachments: [
          { label: 'Report', url: 'https://example.com/report.pdf' },
        ],
      }),
      'post-1',
    );

    await user.click(screen.getAllByRole('button', { name: 'Metrics' })[0]);
    await user.clear(screen.getByLabelText('impressions'));
    await user.type(screen.getByLabelText('impressions'), '1800');
    await user.click(screen.getByRole('button', { name: 'Save metrics' }));
    expect(onRecordMetrics).toHaveBeenCalledWith(
      'post-1',
      expect.objectContaining({ impressions: 1800 }),
    );
  });

  it('parses workspace settings for submissions', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <TimelineSettingsDrawer
        open
        workspace={{
          timezone: 'Europe/London',
          defaultVisibility: 'connections',
          autoShareToFeed: true,
          reviewBeforePublish: true,
          cadenceGoal: 3,
          distributionChannels: ['Feed', 'Newsletter'],
          contentThemes: ['Updates', 'Wins'],
          pinnedCampaigns: ['Launch'],
        }}
        onClose={() => {}}
        onSubmit={onSubmit}
        saving={false}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Timezone'), 'UTC');
    await user.clear(screen.getByLabelText('Cadence goal (per month)'));
    await user.type(screen.getByLabelText('Cadence goal (per month)'), '6');
    await user.clear(screen.getByLabelText('Channels'));
    await user.type(screen.getByLabelText('Channels'), 'Feed, Podcast');
    await user.click(screen.getByLabelText('Auto share to feed'));

    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    expect(onSubmit).toHaveBeenCalledWith({
      timezone: 'UTC',
      defaultVisibility: 'connections',
      autoShareToFeed: false,
      reviewBeforePublish: true,
      cadenceGoal: 6,
      distributionChannels: ['Feed', 'Podcast'],
      contentThemes: ['Updates', 'Wins'],
      pinnedCampaigns: ['Launch'],
    });
  });

  it('summarises analytics with readable formatting', () => {
    render(
      <TimelineMetricsView
        analytics={{
          totals: { posts: 1200, engagementRate: 0.275, impressions: 1550, reactions: 120 },
          timelineSummary: { planned: 1, in_progress: 2, completed: 3, blocked: 0, upcoming: 1 },
          trend: [{ capturedAt: '2024-04-01', impressions: 1500, reactions: 200 }],
          topPosts: [
            {
              id: 'top-1',
              title: 'Product update',
              metrics: { totals: { impressions: 2000, engagement_rate: 0.32 } },
            },
          ],
          topTags: [{ tag: 'Growth' }],
        }}
      />,
    );

    expect(screen.getByText('1.2k')).toBeInTheDocument();
    expect(screen.getByText('0.3%')).toBeInTheDocument();
    expect(screen.getByText('Product update')).toBeInTheDocument();
    expect(screen.getByText('Growth')).toBeInTheDocument();
  });

  it('only renders the drawer when open', () => {
    const { rerender } = render(
      <TimelineDrawer open={false} title="Drawer" subtitle="Details" onClose={() => {}}>
        Hidden content
      </TimelineDrawer>,
    );
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();

    rerender(
      <TimelineDrawer open title="Drawer" subtitle="Details" onClose={() => {}}>
        Visible content
      </TimelineDrawer>,
    );
    expect(screen.getByText('Visible content')).toBeInTheDocument();
  });

  it('renders post cards and triggers relevant actions', async () => {
    const user = userEvent.setup();
    const onCreatePost = vi.fn();
    const onOpenPost = vi.fn();
    const onPublish = vi.fn();
    const onDeletePost = vi.fn();

    render(
      <TimelinePostsView
        posts={[
          {
            id: 'post-1',
            title: 'Launch recap',
            summary: 'Highlights from launch',
            status: 'draft',
            visibility: 'public',
            publishedAt: null,
            scheduledAt: null,
            tags: ['Launch'],
          },
        ]}
        onCreatePost={onCreatePost}
        onOpenPost={onOpenPost}
        onPublish={onPublish}
        onDeletePost={onDeletePost}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'New post' }));
    expect(onCreatePost).toHaveBeenCalledTimes(1);

    const card = screen.getByText('Launch recap').closest('article');
    const utils = within(card);

    await user.click(utils.getByRole('button', { name: 'Edit' }));
    expect(onOpenPost).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'post-1' }),
      'edit',
    );

    await user.click(utils.getByRole('button', { name: 'Metrics' }));
    expect(onOpenPost).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'post-1' }),
      'metrics',
    );

    await user.click(utils.getByRole('button', { name: 'Publish' }));
    expect(onPublish).toHaveBeenCalledTimes(1);

    await user.click(utils.getByRole('button', { name: 'Delete' }));
    expect(onDeletePost).toHaveBeenCalledTimes(1);
  });

  it('integrates the full timeline management section with mocked data', async () => {
    const user = userEvent.setup();

    render(<TimelineManagementSection />);

    expect(screen.getByText('Timeline board')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Posts' }));
    expect(screen.getByText('Post library')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Metrics' })[0]);
    expect(screen.getByText('Highlights')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Plan' }));

    await user.click(screen.getAllByRole('button', { name: 'Refresh' })[0]);
    expect(timelineState.refresh).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const cadenceInput = screen.getByLabelText('Cadence goal (per month)');
    await user.clear(cadenceInput);
    await user.type(cadenceInput, '5');
    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    await waitFor(() => {
      expect(timelineState.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ cadenceGoal: 5 }),
      );
    });
  });
});
