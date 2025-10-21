import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import JobLifecycleSection from '../JobLifecycleSection.jsx';
import TimelineManagementSection from '../TimelineManagementSection.jsx';
import {
  createTimelineEvent,
  deleteTimelineEvent,
  deleteTimelinePost,
  changeTimelinePostStatus,
  recordTimelinePostMetrics,
} from '../../../services/companyTimeline.js';

vi.mock('../timeline/EventBoard.jsx', () => ({
  default: ({ onNew, onOpen, onDelete }) => (
    <div>
      <button type="button" onClick={() => onNew?.()}>
        event-new
      </button>
      <button type="button" onClick={() => onOpen?.({ id: 'evt-1' })}>
        event-open
      </button>
      <button type="button" onClick={() => onDelete?.({ id: 'evt-1' })}>
        event-delete
      </button>
    </div>
  ),
}));

vi.mock('../timeline/PostStudio.jsx', () => ({
  default: ({ onNew, onOpen, onDelete, onStatusChange, onRecordMetrics }) => (
    <div>
      <button type="button" onClick={() => onNew?.()}>
        post-new
      </button>
      <button type="button" onClick={() => onOpen?.({ id: 'post-1' })}>
        post-open
      </button>
      <button type="button" onClick={() => onDelete?.({ id: 'post-1' })}>
        post-delete
      </button>
      <button type="button" onClick={() => onStatusChange?.({ id: 'post-1' }, 'published')}>
        post-status
      </button>
      <button type="button" onClick={() => onRecordMetrics?.({ id: 'post-1' })}>
        post-metrics
      </button>
    </div>
  ),
}));

vi.mock('../timeline/AnalyticsPanel.jsx', () => ({
  default: ({ analytics }) => <div>analytics-view: {analytics?.totals?.views ?? 0}</div>,
}));

vi.mock('../timeline/EventDrawer.jsx', () => ({
  default: ({ open, onSubmit, error }) => (
    <div>
      {open ? (
        <>
          <span>event-drawer-open</span>
          {error ? <p>{error}</p> : null}
          <button type="button" onClick={() => onSubmit?.({ title: 'Event', startsAt: new Date().toISOString() })}>
            submit-event
          </button>
        </>
      ) : null}
    </div>
  ),
}));

vi.mock('../timeline/PostDrawer.jsx', () => ({
  default: ({ open, onSubmit, error }) => (
    <div>
      {open ? (
        <>
          <span>post-drawer-open</span>
          {error ? <p>{error}</p> : null}
          <button type="button" onClick={() => onSubmit?.({ title: 'Post', status: 'draft' })}>
            submit-post
          </button>
        </>
      ) : null}
    </div>
  ),
}));

vi.mock('../timeline/MetricDrawer.jsx', () => ({
  default: ({ open, onSubmit, error }) => (
    <div>
      {open ? (
        <>
          <span>metric-drawer-open</span>
          {error ? <p>{error}</p> : null}
          <button type="button" onClick={() => onSubmit?.({ views: 10 })}>
            submit-metric
          </button>
        </>
      ) : null}
    </div>
  ),
}));

vi.mock('../../../services/companyTimeline.js', () => ({
  createTimelineEvent: vi.fn(),
  updateTimelineEvent: vi.fn(),
  deleteTimelineEvent: vi.fn(),
  createTimelinePost: vi.fn(),
  updateTimelinePost: vi.fn(),
  deleteTimelinePost: vi.fn(),
  changeTimelinePostStatus: vi.fn(),
  recordTimelinePostMetrics: vi.fn(),
}));

describe('Job lifecycle section', () => {
  it('renders readiness metrics and insights', () => {
    const jobLifecycleData = {
      enterpriseReadiness: {
        maturityScore: 78,
        maturityTier: 'tier_2',
        scoreConfidence: 82,
        dataFreshnessHours: 12,
        lastUpdatedAt: '2030-03-08T12:00:00Z',
        instrumentation: { measuredSignals: 7, expectedSignals: 9 },
        health: {
          overall: 'watch',
          automation: 'healthy',
          collaboration: 'watch',
          compliance: 'healthy',
          experience: 'at_risk',
        },
        automation: { stageAutomationCoverage: 0.62, totalStages: 5, instrumentedStages: 3 },
        collaboration: { templateCoverage: 0.75, calibrationsScheduled: 2 },
        compliance: { formCompletionRate: 0.9, approvalsPending: 2, ndaCompletionRate: 0.96 },
        scorecard: [
          { id: 'signals', label: 'Signals', status: 'healthy', value: 92, goal: 90 },
        ],
        watchouts: ['No candidate feedback in the last 7 days.'],
        actions: [
          { id: 'action-1', title: 'Enable interview scorecards', description: 'Capture structured interviewer ratings.' },
        ],
      },
      funnel: [
        { status: 'applied', label: 'Applied', count: 120, cumulativeConversion: 100, conversionFromPrevious: 100 },
      ],
      approvalQueue: { items: [{ id: 'appr-1', approverRole: 'Finance', status: 'pending', createdAt: '2030-03-01T10:00:00Z' }] },
      campaigns: {
        totalSpend: 9000,
        averageCostPerApplication: 200,
        topChannels: [{ channel: 'Gigvora', applications: 45, conversionRate: 65, hires: 8, spend: 9000 }],
      },
      stagePerformance: [
        {
          id: 'stage-1',
          name: 'Recruiter screen',
          slaHours: 48,
          slaDeltaHours: 12,
          averageDurationHours: 36,
          medianDecisionHours: 30,
          advanceRate: 55,
          rejectionRate: 35,
          holdRate: 10,
          pendingReviews: 3,
          throughput: 18,
        },
      ],
      atsHealth: {
        activeRequisitions: 14,
        velocity: { averageDaysToDecision: 5 },
        rescheduleCount: 1,
        upcomingInterviews: 3,
      },
      averageStageDurationHours: 32,
      pendingApprovals: 1,
      overdueApprovals: 0,
    };

    render(<JobLifecycleSection jobLifecycle={jobLifecycleData} />);

    expect(screen.getByText(/signal health/i)).toBeInTheDocument();
    expect(screen.getByText(/watchouts/i)).toBeInTheDocument();
    expect(screen.getByText(/next actions/i)).toBeInTheDocument();
    expect(screen.getByText(/pipeline conversion/i)).toBeInTheDocument();
  });
});

describe('Timeline management section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks timeline mutations when workspace is not selected', async () => {
    const user = userEvent.setup();
    const Harness = ({ workspaceId }) => (
      <MemoryRouter>
        <TimelineManagementSection workspaceId={workspaceId} data={{ events: { items: [] } }} />
      </MemoryRouter>
    );

    const { rerender } = render(<Harness workspaceId="55" />);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /^events$/i }));
      await user.click(screen.getByText('event-new'));
    });
    await screen.findByText('event-drawer-open');

    rerender(<Harness workspaceId={null} />);

    await act(async () => {
      await user.click(screen.getByText('submit-event'));
    });
    expect(screen.getByText('Select a workspace before saving.')).toBeInTheDocument();
    expect(createTimelineEvent).not.toHaveBeenCalled();
  });

  it('creates events and refreshes when workspace is provided', async () => {
    const user = userEvent.setup();
    createTimelineEvent.mockResolvedValue({ id: 'evt-1' });
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <TimelineManagementSection
          workspaceId="42"
          data={{ events: { items: [] }, posts: { items: [] }, analytics: { totals: { views: 10 } } }}
          onRefresh={onRefresh}
        />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /^events$/i }));
    });
    await act(async () => {
      await user.click(screen.getByText('event-new'));
    });
    await screen.findByText('event-drawer-open');

    await act(async () => {
      await user.click(screen.getByText('submit-event'));
    });

    await waitFor(() => {
      expect(createTimelineEvent).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: '42' }));
    });
    expect(onRefresh).toHaveBeenCalledWith({ force: true });
  });

  it('updates post status and records metrics', async () => {
    const user = userEvent.setup();
    changeTimelinePostStatus.mockResolvedValue({});
    recordTimelinePostMetrics.mockResolvedValue({});

    render(
      <MemoryRouter>
        <TimelineManagementSection workspaceId="5" data={{ posts: { items: [{ id: 'post-1' }] } }} />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /^posts$/i }));
    });
    await act(async () => {
      await user.click(screen.getByText('post-status'));
    });
    await waitFor(() => {
      expect(changeTimelinePostStatus).toHaveBeenCalledWith('post-1', { workspaceId: '5', status: 'published' });
    });

    await act(async () => {
      await user.click(screen.getByText('post-metrics'));
    });
    await screen.findByText('metric-drawer-open');

    await act(async () => {
      await user.click(screen.getByText('submit-metric'));
    });
    await waitFor(() => {
      expect(recordTimelinePostMetrics).toHaveBeenCalledWith('post-1', expect.objectContaining({ workspaceId: '5' }));
    });
  });

  it('deletes timeline records when confirmed', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    deleteTimelineEvent.mockResolvedValue({});
    deleteTimelinePost.mockResolvedValue({});

    render(
      <MemoryRouter>
        <TimelineManagementSection workspaceId="9" data={{ events: { items: [{ id: 'evt-1' }] }, posts: { items: [{ id: 'post-1' }] } }} />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /^events$/i }));
    });
    await act(async () => {
      await user.click(screen.getByText('event-delete'));
    });
    await waitFor(() => {
      expect(deleteTimelineEvent).toHaveBeenCalledWith('evt-1', { workspaceId: '9' });
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /^posts$/i }));
    });
    await act(async () => {
      await user.click(screen.getByText('post-delete'));
    });
    await waitFor(() => {
      expect(deleteTimelinePost).toHaveBeenCalledWith('post-1', { workspaceId: '9' });
    });
  });
});
