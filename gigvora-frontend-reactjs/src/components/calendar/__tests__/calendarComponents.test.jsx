import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarEventForm from '../CalendarEventForm.jsx';
import CalendarEventList from '../CalendarEventList.jsx';
import CalendarFocusSessionForm from '../CalendarFocusSessionForm.jsx';
import CalendarSettingsForm from '../CalendarSettingsForm.jsx';
import CalendarWeekStrip from '../CalendarWeekStrip.jsx';

describe('CalendarEventForm', () => {
  it('normalizes data before submitting', async () => {
    const handleSubmit = vi.fn().mockResolvedValue();
    const handleCancel = vi.fn();

    render(<CalendarEventForm onSubmit={handleSubmit} onCancel={handleCancel} />);

    const user = userEvent.setup();

    await act(async () => {
      await user.type(screen.getByLabelText(/title/i), '  Interview with panel  ');
      await user.type(screen.getByLabelText(/^start$/i), '2024-05-20T09:30');
      await user.type(screen.getByLabelText(/^end$/i), '2024-05-20T10:30');
      await user.selectOptions(screen.getByLabelText(/visibility/i), 'shared');
      await user.selectOptions(screen.getByLabelText(/Reminder/i), 'custom');
      const customReminderInput = screen.getByPlaceholderText(/Minutes before event/i);
      await user.clear(customReminderInput);
      await user.type(customReminderInput, '20');
      await user.type(screen.getByLabelText(/Linked record type/i), 'project');
      await user.type(screen.getByLabelText(/Linked record ID/i), '42');
      await user.type(screen.getByLabelText(/colour accent/i), '123abc');
      await user.type(screen.getByLabelText(/location/i), 'HQ');
      await user.type(screen.getByLabelText(/notes/i), 'Bring portfolio');
      await user.click(screen.getByLabelText(/Mark as all-day event/i));

      await user.click(screen.getByRole('button', { name: /create event/i }));
    });

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const payload = handleSubmit.mock.calls[0][0];
    expect(payload).toMatchObject({
      title: 'Interview with panel',
      eventType: 'job_interview',
      visibility: 'shared',
      location: 'HQ',
      description: 'Bring portfolio',
      relatedEntityType: 'project',
      relatedEntityId: 42,
      colorHex: '#123abc',
      reminderMinutes: 20,
      isAllDay: true,
    });
    expect(new Date(payload.startsAt).toISOString()).toBe('2024-05-20T09:30:00.000Z');
    expect(new Date(payload.endsAt).toISOString()).toBe('2024-05-20T10:30:00.000Z');
  });

  it('shows validation errors when required fields missing', async () => {
    const handleSubmit = vi.fn();
    render(<CalendarEventForm onSubmit={handleSubmit} onCancel={() => {}} />);

    const user = userEvent.setup();

    await act(async () => {
      await user.type(screen.getByLabelText(/^start$/i), '2024-05-21T10:00');

      await user.click(screen.getByRole('button', { name: /create event/i }));
    });

    expect(await screen.findByText(/provide a title/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});

describe('CalendarEventList', () => {
  const events = [
    {
      id: 2,
      title: 'Project sync',
      eventType: 'project',
      startsAt: '2024-05-22T10:00:00.000Z',
      location: 'Zoom',
    },
    {
      id: 1,
      title: 'Candidate interview',
      eventType: 'job_interview',
      startsAt: '2024-05-20T09:00:00.000Z',
      location: 'HQ',
    },
  ];

  it('sorts events chronologically and triggers callbacks', async () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    const handleSelect = vi.fn();

    render(
      <CalendarEventList
        events={events}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSelect={handleSelect}
      />,
    );

    const user = userEvent.setup();

    const items = screen.getAllByRole('button', { name: /Open$/i });
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText(/candidate interview/i)).toBeInTheDocument();

    await user.click(within(items[0]).getByRole('button', { name: /edit/i }));
    expect(handleEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));

    await user.click(within(items[0]).getByRole('button', { name: /delete/i }));
    expect(handleDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));

    await user.click(items[1]);
    expect(handleSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
  });
});

describe('CalendarFocusSessionForm', () => {
  it('submits focus session details', async () => {
    const handleSubmit = vi.fn().mockResolvedValue();

    render(<CalendarFocusSessionForm onSubmit={handleSubmit} onCancel={() => {}} />);

    const user = userEvent.setup();

    await act(async () => {
      await user.selectOptions(screen.getByLabelText(/session type/i), 'deep_work');
      await user.type(screen.getByLabelText(/^start$/i), '2024-05-21T14:00');
      await user.type(screen.getByLabelText(/end \(optional\)/i), '2024-05-21T16:00');
      const durationInput = screen.getByLabelText(/duration/i);
      await user.clear(durationInput);
      await user.type(durationInput, '120');
      await user.type(screen.getByLabelText(/notes/i), 'Focus on prep');
      await user.click(screen.getByLabelText(/Mark session as completed/i));

      await user.click(screen.getByRole('button', { name: /log session/i }));
    });

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        focusType: 'deep_work',
        durationMinutes: 120,
        completed: true,
        notes: 'Focus on prep',
      }),
    );
  });
});

describe('CalendarSettingsForm', () => {
  it('validates working hours', async () => {
    const handleSubmit = vi.fn();
    render(<CalendarSettingsForm onSubmit={handleSubmit} onCancel={() => {}} />);

    const user = userEvent.setup();

    await act(async () => {
      await user.clear(screen.getByLabelText(/working hours start/i));
      await user.type(screen.getByLabelText(/working hours start/i), '18:00');
      await user.clear(screen.getByLabelText(/working hours end/i));
      await user.type(screen.getByLabelText(/working hours end/i), '17:00');

      await user.click(screen.getByRole('button', { name: /save settings/i }));
    });

    expect(await screen.findByText(/end time must be after the start time/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('submits normalized settings', async () => {
    const handleSubmit = vi.fn();
    render(
      <CalendarSettingsForm
        onSubmit={handleSubmit}
        onCancel={() => {}}
        initialSettings={{
          timezone: 'Europe/London',
          weekStart: 0,
          workStartMinutes: 9 * 60,
          workEndMinutes: 17 * 60,
          defaultReminderMinutes: 45,
          autoFocusBlocks: true,
          shareAvailability: true,
          colorHex: '#123123',
        }}
      />,
    );

    const user = userEvent.setup();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /save settings/i }));
    });

    expect(handleSubmit).toHaveBeenCalledWith({
      timezone: 'Europe/London',
      weekStart: 0,
      workStartMinutes: 540,
      workEndMinutes: 1020,
      defaultView: 'agenda',
      defaultReminderMinutes: 45,
      autoFocusBlocks: true,
      shareAvailability: true,
      colorHex: '#123123',
    });
  });
});

describe('CalendarWeekStrip', () => {
  it('renders events within the week and indicates overflow', () => {
    const referenceDate = new Date('2024-04-01T00:00:00.000Z');
    const events = [
      { id: 1, title: 'Kickoff', startsAt: '2024-04-01T09:00:00.000Z', endsAt: '2024-04-01T10:00:00.000Z' },
      { id: 2, title: 'Review', startsAt: '2024-04-01T11:00:00.000Z' },
      { id: 3, title: 'Standup', startsAt: '2024-04-01T12:00:00.000Z' },
      { id: 4, title: 'Wrap-up', startsAt: '2024-04-01T13:00:00.000Z' },
    ];

    render(<CalendarWeekStrip events={events} referenceDate={referenceDate} onSelect={() => {}} />);

    expect(screen.getByText(/Kickoff/i)).toBeInTheDocument();
    expect(screen.getByText(/\+1 more/i)).toBeInTheDocument();
  });
});
