import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import DisputeDashboard from '../DisputeDashboard.jsx';

const disputes = [
  {
    id: 'case-1',
    summary: 'Invoice quality concern',
    status: 'open',
    stage: 'intake',
    priority: 'high',
    transaction: { reference: 'ESC-1', amount: 500, currencyCode: 'USD' },
    reasonCode: 'quality_issue',
    updatedAt: new Date().toISOString(),
    assignedToId: 7,
  },
  {
    id: 'case-2',
    summary: 'Scope disagreement',
    status: 'awaiting_customer',
    stage: 'mediation',
    priority: 'medium',
    transaction: { reference: 'ESC-2', amount: 950, currencyCode: 'USD' },
    reasonCode: 'scope_disagreement',
    updatedAt: new Date().toISOString(),
  },
];

const summary = { openCases: 2 };
const metrics = { byStage: { intake: 1, mediation: 1 }, byStatus: { open: 1, awaiting_customer: 1 }, byPriority: { high: 1, medium: 1 } };
const upcomingDeadlines = [
  {
    disputeId: 'case-2',
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    summary: 'Customer follow-up required',
    stage: 'mediation',
    isPastDue: false,
  },
];

const filters = {
  stage: 'all',
  status: 'all',
  includeClosed: false,
  options: {
    stages: ['intake', 'mediation'],
    statuses: ['open', 'awaiting_customer'],
    priorities: ['high', 'medium'],
  },
};

describe('DisputeDashboard', () => {
  it('renders metrics, cases, and handles interactions', async () => {
    let latestFilters = filters;
    const onFiltersChange = vi.fn((updater) => {
      latestFilters = typeof updater === 'function' ? updater(latestFilters) : updater;
    });
    const onSelectDispute = vi.fn();
    const onCreateDispute = vi.fn();

    render(
      <DisputeDashboard
        summary={summary}
        metrics={metrics}
        disputes={disputes}
        upcomingDeadlines={upcomingDeadlines}
        filters={filters}
        onFiltersChange={onFiltersChange}
        onRefresh={vi.fn()}
        loading={false}
        refreshing={false}
        selectedId={null}
        onSelectDispute={onSelectDispute}
        onClearSelection={vi.fn()}
        detail={{}}
        detailLoading={false}
        detailError={null}
        onLogEvent={vi.fn()}
        onCreateDispute={onCreateDispute}
        permissions={{ canOpen: true }}
        lastRefreshedAt={new Date().toISOString()}
        timelineEvents={[]}
        toast={{ message: 'Update saved' }}
        onDismissToast={vi.fn()}
        error={null}
        currentUserId={7}
      />,
    );

    expect(screen.getByText(/support dispute workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/update saved/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new dispute/i })).toBeEnabled();

    const user = userEvent.setup();
    const stageButtons = screen.getAllByRole('button', { name: /^intake$/i });
    await user.click(stageButtons[0]);

    expect(latestFilters.stage).toBe('intake');

    await user.click(screen.getByRole('button', { name: /closed/i }));
    expect(onFiltersChange).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /my cases/i }));

    const disputeButton = screen.getByText(/invoice quality concern/i).closest('button');
    expect(disputeButton).toBeTruthy();
    await user.click(disputeButton);
    expect(onSelectDispute).toHaveBeenCalledWith(expect.objectContaining({ id: 'case-1' }));

    await user.click(screen.getByRole('button', { name: /new dispute/i }));
    expect(onCreateDispute).toHaveBeenCalled();
  });
});
