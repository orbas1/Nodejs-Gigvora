import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MeetingsCalendarTab from '../MeetingsCalendarTab.jsx';

const manager = {
  createMeeting: vi.fn(),
  updateMeeting: vi.fn(),
  deleteMeeting: vi.fn(),
  createCalendarEntry: vi.fn(),
  updateCalendarEntry: vi.fn(),
  deleteCalendarEntry: vi.fn(),
};

describe('MeetingsCalendarTab', () => {
  it('switches between meetings and calendar views', async () => {
    const user = userEvent.setup();
    render(
      <MeetingsCalendarTab
        meetings={[]}
        calendarEntries={[]}
        manager={manager}
      />,
    );

    expect(screen.getByRole('button', { name: /schedule meeting/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /calendar/i }));
    expect(screen.getByRole('button', { name: /add calendar entry/i })).toBeInTheDocument();
  });

  it('shows a read only message when disabled due to permissions', () => {
    render(
      <MeetingsCalendarTab
        meetings={[]}
        calendarEntries={[]}
        manager={manager}
        disabled
        readOnlyReason="Only project coordinators can modify the schedule."
      />,
    );

    expect(screen.getByText(/project coordinators/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /schedule meeting/i })).toBeDisabled();
  });
});
