import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CalendarEventMonthView from '../CalendarEventMonthView.jsx';

describe('CalendarEventMonthView', () => {
  it('groups events by day and surfaces quick actions', async () => {
    const user = userEvent.setup();
    const handleCreate = vi.fn();
    const handleSelect = vi.fn();

    const month = new Date('2024-05-01T00:00:00Z');
    const events = [
      { id: 'evt-1', title: 'Client call', startsAt: '2024-05-05T10:00:00Z' },
      { id: 'evt-2', title: 'Sync', startsAt: '2024-05-05T12:00:00Z' },
    ];

    render(
      <CalendarEventMonthView month={month} events={events} onCreateEvent={handleCreate} onSelectEvent={handleSelect} />,
    );

    const dayButton = screen.getAllByRole('button', { name: '5' })[0];
    await user.click(dayButton);
    expect(handleCreate).toHaveBeenCalledTimes(1);

    await user.click(screen.getByText('Client call'));
    expect(handleSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'evt-1' }));
  });

  it('handles non-array inputs gracefully', () => {
    const month = new Date('2024-05-01T00:00:00Z');

    const { container } = render(
      <CalendarEventMonthView month={month} events={null} onCreateEvent={vi.fn()} onSelectEvent={vi.fn()} />,
    );

    expect(container.querySelectorAll('table')).toHaveLength(1);
  });
});
