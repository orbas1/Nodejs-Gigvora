import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ResolutionTimeline from '../ResolutionTimeline.jsx';

const deadlines = [
  {
    disputeId: 'case-1',
    dueAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    summary: 'Provide additional contract evidence',
    stage: 'mediation',
    isPastDue: false,
  },
  {
    disputeId: 'case-2',
    dueAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    summary: 'Awaiting customer reply',
    stage: 'intake',
    isPastDue: true,
  },
];

const events = [
  { id: 'evt-1', actionType: 'status_change', eventAt: new Date().toISOString(), notes: 'Moved to review' },
  { id: 'evt-2', actionType: 'comment', eventAt: new Date().toISOString(), notes: 'Shared transcript' },
];

describe('ResolutionTimeline', () => {
  it('renders upcoming deadlines and events, triggering selection', async () => {
    const onSelect = vi.fn();
    render(
      <ResolutionTimeline
        deadlines={deadlines}
        events={events}
        onSelectDeadline={onSelect}
        refreshing={false}
      />,
    );

    expect(screen.getByText(/sla pulse/i)).toBeInTheDocument();
    expect(screen.getByText(/upcoming checkpoints/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /provide additional contract evidence/i })).toHaveLength(1);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /provide additional contract evidence/i }));

    expect(onSelect).toHaveBeenCalledWith('case-1');
    expect(screen.getByText(/activity stream/i)).toBeInTheDocument();
    expect(screen.getByText(/moved to review/i)).toBeInTheDocument();
  });
});
