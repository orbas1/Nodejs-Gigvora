import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MentorAvailabilityPlanner from '../MentorAvailabilityPlanner.jsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getDayLabels() {
  return screen
    .getAllByText((content, element) => {
      const text = content.trim();
      return element?.tagName === 'P' && DAYS.includes(text);
    })
    .map((element) => element.textContent);
}

describe('MentorAvailabilityPlanner', () => {
  it('orders availability slots by day and start time', () => {
    render(
      <MentorAvailabilityPlanner
        availability={[
          {
            id: 'b',
            day: 'Wednesday',
            start: '2024-06-05T10:00:00.000Z',
            end: '2024-06-05T11:00:00.000Z',
            format: 'Office hours',
            capacity: 8,
          },
          {
            id: 'a',
            day: 'Monday',
            start: '2024-06-03T09:00:00.000Z',
            end: '2024-06-03T09:30:00.000Z',
            format: '1:1 session',
            capacity: 1,
          },
        ]}
      />, 
    );

    expect(getDayLabels()).toEqual(['Monday', 'Wednesday']);
  });

  it('rejects overlapping slots and shows an alert', async () => {
    const user = userEvent.setup();

    render(
      <MentorAvailabilityPlanner
        availability={[
          {
            id: 'existing',
            day: 'Monday',
            start: '2024-06-03T09:00:00.000Z',
            end: '2024-06-03T10:00:00.000Z',
            format: '1:1 session',
            capacity: 1,
          },
        ]}
      />, 
    );

    await user.type(screen.getByLabelText('Start'), '2024-06-03T09:30');
    await user.type(screen.getByLabelText('End'), '2024-06-03T10:30');
    await user.click(screen.getByRole('button', { name: /add slot/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('overlaps with an existing availability window');
    expect(getDayLabels()).toEqual(['Monday']);
  });

  it('submits available slots and tracks analytics', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue();
    const analytics = { track: vi.fn() };

    render(
      <MentorAvailabilityPlanner availability={[]} onSave={onSave} analytics={analytics} />,
    );

    await user.type(screen.getByLabelText('Start'), '2024-06-06T09:00');
    await user.type(screen.getByLabelText('End'), '2024-06-06T10:30');
    await user.clear(screen.getByLabelText('Seats per slot'));
    await user.type(screen.getByLabelText('Seats per slot'), '5');
    await user.click(screen.getByRole('button', { name: /add slot/i }));

    await user.click(screen.getByRole('button', { name: /save availability/i }));

    await screen.findByRole('status');
    expect(onSave).toHaveBeenCalledTimes(1);
    const payload = onSave.mock.calls[0][0];
    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({
      day: 'Monday',
      format: '1:1 session',
      capacity: 5,
    });
    expect(new Date(payload[0].start).toISOString()).toBe(payload[0].start);
    expect(analytics.track).toHaveBeenCalledWith('web_mentor_availability_saved', {
      slots: 1,
      totalCapacity: 5,
    });
  });

  it('syncs with new availability passed from the parent', () => {
    const { rerender } = render(
      <MentorAvailabilityPlanner
        availability={[
          {
            id: 'initial',
            day: 'Tuesday',
            start: '2024-06-04T09:00:00.000Z',
            end: '2024-06-04T10:00:00.000Z',
            format: '1:1 session',
            capacity: 1,
          },
        ]}
      />, 
    );

    expect(getDayLabels()).toEqual(['Tuesday']);

    rerender(
      <MentorAvailabilityPlanner
        availability={[
          {
            id: 'updated',
            day: 'Friday',
            start: '2024-06-07T09:00:00.000Z',
            end: '2024-06-07T10:00:00.000Z',
            format: 'Office hours',
            capacity: 12,
          },
        ]}
      />, 
    );

    expect(getDayLabels()).toEqual(['Friday']);
  });
});
