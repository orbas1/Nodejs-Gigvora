import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CalendarEventTimeline from '../CalendarEventTimeline.jsx';

function createEvent(overrides = {}) {
  return {
    id: `evt-${Math.random().toString(36).slice(2, 7)}`,
    title: 'Strategy session',
    eventType: 'project',
    status: 'confirmed',
    startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

describe('CalendarEventTimeline', () => {
  it('highlights the next milestone and surfaces management actions', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    const handleEdit = vi.fn();
    const handleStatus = vi.fn();

    const events = [
      createEvent({ id: 'evt-1', title: 'Retro', startsAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() }),
      createEvent({ id: 'evt-2', title: 'Client kickoff' }),
    ];

    render(
      <CalendarEventTimeline
        events={events}
        canManage
        onSelectEvent={handleSelect}
        onEditEvent={handleEdit}
        onStatusChange={handleStatus}
      />,
    );

    expect(screen.getByText(/next milestone/i)).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /view briefing/i })[0]);
    expect(handleSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'evt-2' }));

    await user.click(screen.getAllByRole('button', { name: /update details/i })[0]);
    expect(handleEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'evt-2' }));

    await user.click(screen.getAllByRole('button', { name: /mark done/i })[0]);
    expect(handleStatus).toHaveBeenCalledWith(expect.objectContaining({ id: 'evt-2' }), 'completed');
  });

  it('renders a default empty state when no events are available', () => {
    render(<CalendarEventTimeline events={[]} loading={false} />);

    expect(screen.getByText(/No events scheduled yet/i)).toBeInTheDocument();
  });

  it('respects the management guard when the viewer cannot manage events', async () => {
    const user = userEvent.setup();
    const handleStatus = vi.fn();

    const events = [createEvent({ id: 'evt-3', title: 'Read only' })];

    render(<CalendarEventTimeline events={events} canManage={false} onStatusChange={handleStatus} />);

    const markDoneButtons = screen.queryAllByRole('button', { name: /mark done/i });
    expect(markDoneButtons.length).toBe(0);

    if (screen.queryByRole('button', { name: /view briefing/i })) {
      await user.click(screen.getByRole('button', { name: /view briefing/i }));
    }
    expect(handleStatus).not.toHaveBeenCalled();
  });
});
