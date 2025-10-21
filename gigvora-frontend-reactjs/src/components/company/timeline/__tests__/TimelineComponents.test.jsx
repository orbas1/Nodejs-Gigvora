import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AnalyticsPanel from '../AnalyticsPanel.jsx';
import EventBoard from '../EventBoard.jsx';
import EventDrawer from '../EventDrawer.jsx';
import MetricDrawer from '../MetricDrawer.jsx';
import PostDrawer from '../PostDrawer.jsx';
import PostStudio from '../PostStudio.jsx';
import SlideOverPanel from '../SlideOverPanel.jsx';
import StatusPill from '../StatusPill.jsx';
import TimelineShell from '../TimelineShell.jsx';

describe('StatusPill', () => {
  it('applies tone styling', () => {
    render(<StatusPill tone="green">Live</StatusPill>);
    const pill = screen.getByText('Live');
    expect(pill.className).toContain('bg-emerald-50');
  });
});

describe('SlideOverPanel', () => {
  it('invokes close handlers from controls and backdrop', () => {
    const handleClose = vi.fn();
    render(
      <SlideOverPanel open title="Panel" onClose={handleClose}>
        <p>Body</p>
      </SlideOverPanel>,
    );

    fireEvent.click(screen.getByRole('button', { name: /close panel/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);

    const dialog = screen.getByRole('dialog');
    fireEvent.mouseDown(dialog);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});

describe('AnalyticsPanel', () => {
  it('renders totals and fallback states', () => {
    const analytics = {
      totals: { impressions: 1234, engagements: 321, engagementRate: 12.5 },
      trend: [
        { metricDate: '2024-06-02T00:00:00Z', impressions: 300, engagements: 30, clicks: 15 },
        { metricDate: '2024-06-01T00:00:00Z', impressions: 200, engagements: 20, clicks: 10 },
      ],
      topPosts: [
        { id: 'p-1', title: 'Launch update', engagements: 90, impressions: 1200, engagementRate: 7.5, publishedAt: '2024-06-01' },
      ],
    };

    render(<AnalyticsPanel analytics={analytics} lookbackDays={14} />);

    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText(/Launch update/)).toBeInTheDocument();
  });

  it('shows empty messaging when metrics missing', () => {
    render(<AnalyticsPanel analytics={{}} lookbackDays={7} />);
    expect(screen.getByText(/no metrics yet/i)).toBeInTheDocument();
    expect(screen.getByText(/no posts yet/i)).toBeInTheDocument();
  });
});

describe('EventBoard', () => {
  const events = [
    {
      id: 'e1',
      title: 'Launch kickoff',
      status: 'planned',
      category: 'Milestone',
      startDate: '2024-06-05T12:00:00Z',
      dueDate: '2024-06-10T12:00:00Z',
      owner: { firstName: 'Jordan', lastName: 'Lee' },
    },
  ];

  it('provides quick actions for events', () => {
    const handleNew = vi.fn();
    const handleOpen = vi.fn();
    const handleDelete = vi.fn();

    render(
      <EventBoard
        events={events}
        upcoming={events}
        overdue={[]}
        statusCounts={{ planned: 1 }}
        onNew={handleNew}
        onOpen={handleOpen}
        onDelete={handleDelete}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /new event/i }));
    expect(handleNew).toHaveBeenCalled();

    const eventHeading = screen.getByRole('heading', { level: 3, name: 'Launch kickoff' });
    const eventCard = eventHeading.closest('article');
    fireEvent.click(eventCard);
    expect(handleOpen).toHaveBeenCalledWith(events[0]);

    fireEvent.click(within(eventCard).getByRole('button', { name: /remove/i }));
    expect(handleDelete).toHaveBeenCalledWith(events[0]);
  });
});

describe('EventDrawer', () => {
  it('normalises event payloads before submit', () => {
    const handleSubmit = vi.fn();
    const initialValue = {
      title: 'Launch kickoff',
      status: 'completed',
      category: 'Milestone',
      ownerId: 42,
      startDate: '2024-06-01T09:00:00Z',
      dueDate: '2024-06-02T09:00:00Z',
      description: 'Initial planning',
    };

    render(<EventDrawer open mode="edit" initialValue={initialValue} onClose={vi.fn()} onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Team sync' } });
    fireEvent.click(screen.getByRole('button', { name: /save event/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      title: 'Team sync',
      status: 'completed',
      category: 'Milestone',
      ownerId: 42,
      startDate: '2024-06-01T09:00',
      dueDate: '2024-06-02T09:00',
      description: 'Initial planning',
    });
  });
});

describe('MetricDrawer', () => {
  it('casts numeric fields correctly', async () => {
    const handleSubmit = vi.fn();

    render(<MetricDrawer open mode="create" initialValue={{ metricDate: '2024-06-05' }} onClose={vi.fn()} onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/impressions/i), { target: { value: '1200' } });
    fireEvent.change(screen.getByLabelText(/clicks/i), { target: { value: '45' } });
    fireEvent.change(screen.getByLabelText(/reactions/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /save metrics/i }));
    await waitFor(() => expect(handleSubmit).toHaveBeenCalled());

    expect(handleSubmit).toHaveBeenCalledWith({
      metricDate: '2024-06-05',
      impressions: 1200,
      clicks: 45,
      reactions: null,
      comments: null,
      shares: null,
      saves: null,
      notes: null,
    });
  });
});

describe('PostDrawer', () => {
  it('converts input values to submission payload', async () => {
    const handleSubmit = vi.fn();

    render(
      <PostDrawer
        open
        mode="create"
        initialValue={{ tags: ['growth'] }}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Hiring update' } });
    fireEvent.change(screen.getByLabelText(/summary/i), { target: { value: 'Great quarter' } });
    fireEvent.change(screen.getByLabelText(/tags/i), { target: { value: ' growth, hiring ' } });
    fireEvent.click(screen.getByRole('button', { name: /save post/i }));
    await waitFor(() => expect(handleSubmit).toHaveBeenCalled());

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Hiring update',
        summary: 'Great quarter',
        tags: ['growth', 'hiring'],
        authorId: null,
      }),
    );
  });
});

describe('PostStudio', () => {
  const posts = [
    {
      id: 'post-1',
      title: 'Hiring update',
      status: 'draft',
      visibility: 'workspace',
      summary: 'Building out product',
      tags: ['growth'],
      metricsSummary: { totals: { impressions: 100, engagements: 10, engagementRate: 10 } },
      publishedAt: '2024-05-01T00:00:00Z',
    },
  ];

  it('exposes board interactions', () => {
    const handleNew = vi.fn();
    const handleOpen = vi.fn();
    const handleDelete = vi.fn();
    const handleStatus = vi.fn();
    const handleMetrics = vi.fn();

    render(
      <PostStudio
        posts={posts}
        statusCounts={{ draft: 1 }}
        tagFrequency={{ growth: 4 }}
        onNew={handleNew}
        onOpen={handleOpen}
        onDelete={handleDelete}
        onStatusChange={handleStatus}
        onRecordMetrics={handleMetrics}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /new post/i }));
    expect(handleNew).toHaveBeenCalled();

    const postCard = screen.getByText('Hiring update').closest('article');
    fireEvent.click(within(postCard).getByRole('button', { name: /edit/i }));
    expect(handleOpen).toHaveBeenCalledWith(posts[0]);

    fireEvent.click(within(postCard).getByRole('button', { name: /metrics/i }));
    expect(handleMetrics).toHaveBeenCalledWith(posts[0]);

    const statusSelect = within(postCard).getByDisplayValue('Draft');
    fireEvent.change(statusSelect, { target: { value: 'published' } });
    expect(handleStatus).toHaveBeenCalledWith(posts[0], 'published');

    fireEvent.click(within(postCard).getByRole('button', { name: /remove/i }));
    expect(handleDelete).toHaveBeenCalledWith(posts[0]);

    expect(within(postCard).getByText('#growth')).toBeInTheDocument();
  });
});

describe('TimelineShell', () => {
  it('allows view switching and renders summary', () => {
    const handleViewChange = vi.fn();
    const views = [
      { id: 'posts', label: 'Posts' },
      { id: 'events', label: 'Events' },
    ];
    const summary = [
      { id: 'posts', label: 'Posts', value: '12' },
      { id: 'events', label: 'Events', value: '4' },
    ];

    render(
      <TimelineShell view="posts" onViewChange={handleViewChange} views={views} summary={summary}>
        <div>Content</div>
      </TimelineShell>,
    );

    fireEvent.click(screen.getByRole('button', { name: /events/i }));
    expect(handleViewChange).toHaveBeenCalledWith('events');
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});
