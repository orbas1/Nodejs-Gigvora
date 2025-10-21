import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import TimelinePanel from '../TimelinePanel.jsx';

describe('TimelinePanel', () => {
  it('renders deadlines and events', () => {
    const deadlines = [
      {
        disputeId: 'case-1',
        stage: 'Mediation',
        dueAt: '2024-05-01T12:00:00.000Z',
        summary: 'Awaiting client response',
        priority: 'high',
        isPastDue: false,
      },
    ];
    const events = [
      {
        id: 'evt-1',
        actionType: 'status_update',
        eventAt: '2024-04-30T09:00:00.000Z',
      },
    ];

    render(<TimelinePanel deadlines={deadlines} events={events} />);

    expect(screen.getByText(/mediation/i)).toBeInTheDocument();
    expect(screen.getByText(/awaiting client response/i)).toBeInTheDocument();
    expect(screen.getByText(/status update/i)).toBeInTheDocument();
  });

  it('calls onSelect when a deadline is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <TimelinePanel
        deadlines={[{ disputeId: 'case-9', stage: 'Review', dueAt: '2024-05-02T10:00:00.000Z', summary: 'Provide docs', priority: 'medium', isPastDue: false }]}
        events={[]}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole('button', { name: /provide docs/i }));

    expect(onSelect).toHaveBeenCalledWith('case-9');
  });
});
