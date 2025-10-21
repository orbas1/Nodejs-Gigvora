import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import CalendarAutomationPanel from '../calendar/CalendarAutomationPanel.jsx';
import CalendarEventDetails from '../calendar/CalendarEventDetails.jsx';
import CalendarEventDrawer from '../calendar/CalendarEventDrawer.jsx';
import CalendarEventForm from '../calendar/CalendarEventForm.jsx';
import CalendarEventList from '../calendar/CalendarEventList.jsx';
import CalendarSummary from '../calendar/CalendarSummary.jsx';
import CalendarUpcomingGrid from '../calendar/CalendarUpcomingGrid.jsx';

const sampleEvent = {
  id: 'evt-1',
  title: 'Hiring sync',
  eventType: 'interview',
  status: 'in_progress',
  startsAt: '2030-03-10T14:00:00.000Z',
  endsAt: '2030-03-10T15:00:00.000Z',
  location: 'Zoom',
  metadata: {
    ownerName: 'Alex',
    ownerEmail: 'alex@example.com',
    participants: [
      { name: 'Sam', email: 'sam@example.com', role: 'Candidate' },
      { name: 'Jamie', email: 'jamie@example.com', role: 'Interviewer' },
    ],
    attachments: [{ label: 'Brief', url: 'https://gigvora.com/brief.pdf' }],
    notes: 'Prepare portfolio questions.',
    relatedUrl: 'https://gigvora.com/job/123',
    relatedEntityName: 'Product designer',
  },
};

describe('Company calendar components', () => {
  it('submits calendar event form with structured payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ ok: true });

    render(
      <CalendarEventForm
        initialValues={sampleEvent}
        eventTypeOptions={[
          { value: 'interview', label: 'Interview' },
          { value: 'project', label: 'Project' },
        ]}
        onSubmit={onSubmit}
      />,
    );

    const titleInput = screen.getByLabelText(/^Title$/i);
    const participantNameInput = screen.getAllByPlaceholderText('Name')[0];

    await act(async () => {
      await user.clear(titleInput);
      await user.type(titleInput, 'Hiring sync updated');
      await user.clear(participantNameInput);
      await user.type(participantNameInput, 'Sam Candidate');
      await user.click(screen.getByRole('button', { name: /^add participant$/i }));
    });

    const emailInputs = await screen.findAllByPlaceholderText('Email');

    await act(async () => {
      await user.type(emailInputs[emailInputs.length - 1], 'ops@example.com');
      await user.click(screen.getByRole('button', { name: /^save event$/i }));
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Hiring sync updated',
          eventType: 'interview',
          metadata: expect.objectContaining({
            participants: expect.arrayContaining([
              expect.objectContaining({ email: 'ops@example.com' }),
            ]),
            visibility: 'internal',
          }),
        }),
      );
    });
  });

  it('prevents submission when required data is missing', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<CalendarEventForm initialValues={{}} onSubmit={onSubmit} />);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /^save event$/i }));
    });
    await waitFor(() => {
      expect(screen.getByText('Please provide a descriptive title for this event.')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders event details and triggers callbacks', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<CalendarEventDetails event={sampleEvent} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('Hiring sync')).toBeInTheDocument();
    expect(screen.getByText(/alex@example.com/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /edit/i }));
    await user.click(screen.getByRole('button', { name: /remove/i }));

    expect(onEdit).toHaveBeenCalledWith(sampleEvent);
    expect(onDelete).toHaveBeenCalledWith(sampleEvent);
  });

  it('shows drawer content when open', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <CalendarEventDrawer open title="Event" description="Details" onClose={onClose}>
        <p>Drawer body</p>
      </CalendarEventDrawer>,
    );

    expect(screen.getByText('Event')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('lists events and routes interactions to callbacks', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <CalendarEventList
        events={[sampleEvent]}
        accent="border-emerald-200"
        onSelect={onSelect}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    const card = screen.getByText('Hiring sync').closest('li');
    expect(card).toBeTruthy();
    if (!card) throw new Error('Missing event card');

    await user.click(within(card).getByRole('button', { name: /view/i }));
    await user.click(within(card).getByRole('button', { name: /edit/i }));
    await user.click(within(card).getByRole('button', { name: /remove/i }));

    expect(onSelect).toHaveBeenCalledWith(sampleEvent);
    expect(onEdit).toHaveBeenCalledWith(sampleEvent);
    expect(onDelete).toHaveBeenCalledWith(sampleEvent);
  });

  it('configures automation integrations', async () => {
    const user = userEvent.setup();
    const onConfigure = vi.fn();

    render(
      <CalendarAutomationPanel
        state={{ digest: { enabled: true, frequency: 'Monday' }, slack: { enabled: false } }}
        onConfigure={onConfigure}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: /manage/i })[0]);
    expect(onConfigure).toHaveBeenCalledWith('digest');
  });

  it('summarises calendar metrics and exposes creation CTA', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();

    render(
      <CalendarSummary
        summary={{
          totalEvents: 8,
          nextEvent: { title: 'Interview loop', startsAt: '2030-03-11T12:00:00.000Z' },
          overdueCount: 1,
          totalsByType: { interview: 5 },
        }}
        onCreate={onCreate}
      />,
    );

    expect(screen.getByText('Interview loop')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /new event/i }));
    expect(onCreate).toHaveBeenCalled();
  });

  it('highlights upcoming sessions by category', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onCreate = vi.fn();

    render(
      <CalendarUpcomingGrid
        upcomingByType={{ interview: sampleEvent, project: null }}
        metadataByType={{
          interview: { label: 'Interviews' },
          project: { label: 'Projects' },
        }}
        onSelect={onSelect}
        onCreate={onCreate}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: /^new$/i })[0]);
    expect(onCreate).toHaveBeenCalledWith('interview');

    await user.click(screen.getByText('Hiring sync'));
    expect(onSelect).toHaveBeenCalledWith(sampleEvent);
  });
});
