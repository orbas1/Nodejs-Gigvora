import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import MentoringActionQueue from '../MentoringActionQueue.jsx';
import MentoringSessionFilters from '../MentoringSessionFilters.jsx';
import MentoringSessionForm from '../MentoringSessionForm.jsx';
import MentoringSessionSchedulerDrawer from '../MentoringSessionSchedulerDrawer.jsx';
import MentoringSessionTable from '../MentoringSessionTable.jsx';
import MentoringSessionDetailPanel from '../MentoringSessionDetailPanel.jsx';
import MentoringStatsCards from '../MentoringStatsCards.jsx';

const SAMPLE_CATALOG = {
  mentors: [
    { id: 1, firstName: 'Alice', lastName: 'Mentor' },
    { id: 2, firstName: 'Brian', lastName: 'Coach' },
  ],
  mentees: [{ id: 10, firstName: 'Maya', lastName: 'Maker' }],
  owners: [{ id: 99, firstName: 'Olivia', lastName: 'Ops' }],
  serviceLines: [{ id: 42, name: 'Leadership' }],
  meetingProviders: ['Zoom', 'Meet'],
  statuses: [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'completed', label: 'Completed' },
  ],
  actionStatuses: [
    { value: 'pending', label: 'Pending' },
    { value: 'done', label: 'Done' },
  ],
  actionPriorities: [
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
  ],
};

describe('MentoringActionQueue', () => {
  it('allows updating action status and opening a session', async () => {
    const onUpdateStatus = vi.fn();
    const onSelectSession = vi.fn();
    const user = userEvent.setup();

    render(
      <MentoringActionQueue
        actionItems={[
          {
            id: 'action-1',
            sessionId: 'session-1',
            title: 'Send recap',
            dueAt: '2024-06-01T00:00:00.000Z',
            status: 'pending',
            assignee: { firstName: 'Alice', lastName: 'Mentor' },
          },
        ]}
        onUpdateStatus={onUpdateStatus}
        onSelectSession={onSelectSession}
      />,
    );

    await user.selectOptions(screen.getByDisplayValue('pending'), 'completed');
    expect(onUpdateStatus).toHaveBeenCalledWith('session-1', 'action-1', 'completed');

    await user.click(screen.getByRole('button', { name: /open/i }));
    expect(onSelectSession).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'action-1' }),
    );
  });
});

describe('MentoringSessionFilters', () => {
  it('toggles status filters and resets', async () => {
    const onChange = vi.fn();
    const onReset = vi.fn();
    const user = userEvent.setup();

    render(
      <MentoringSessionFilters
        filters={{ status: ['scheduled'], mentorId: '' }}
        catalog={SAMPLE_CATALOG}
        onChange={onChange}
        onReset={onReset}
      />,
    );

    await user.click(screen.getByRole('button', { name: /completed/i }));
    expect(onChange).toHaveBeenCalledWith({ status: expect.arrayContaining(['completed']) });

    await user.selectOptions(screen.getByLabelText('Mentor'), ['1']);
    expect(onChange).toHaveBeenCalledWith({ mentorId: '1' });

    await user.click(screen.getByRole('button', { name: /reset/i }));
    expect(onReset).toHaveBeenCalled();
  });
});

describe('MentoringSessionForm', () => {
  it('normalises payload values on submit and resets after success', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    const user = userEvent.setup();

    render(
      <MentoringSessionForm
        catalog={SAMPLE_CATALOG}
        onSubmit={onSubmit}
        submitting={false}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/mentor/i), '1');
    await user.selectOptions(screen.getByLabelText(/mentee/i), '10');
    await user.selectOptions(screen.getByLabelText(/service line/i), '42');
    await user.selectOptions(screen.getByLabelText(/owner/i), '99');
    await user.type(screen.getByLabelText(/topic/i), 'Growth strategy');
    await user.type(screen.getByLabelText(/schedule/i), '2024-06-10T10:00');
    await user.clear(screen.getByLabelText(/duration/i));
    await user.type(screen.getByLabelText(/duration/i), '90');
    await user.type(screen.getByLabelText(/meeting url/i), 'https://zoom.us/j/123');
    await user.type(screen.getByPlaceholderText('Label'), 'Deck');
    await user.type(screen.getByPlaceholderText('https://...'), 'https://cdn.gigvora.com/deck.pdf');
    await user.type(screen.getByPlaceholderText('Type'), 'pdf');
    await user.type(screen.getByLabelText(/add an internal note/i), 'Initial alignment');

    await user.click(screen.getByRole('button', { name: /save session/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        mentorId: 1,
        menteeId: 10,
        serviceLineId: 42,
        adminOwnerId: 99,
        durationMinutes: 90,
        sessionNotes: [expect.objectContaining({ body: 'Initial alignment' })],
        resourceLinks: [
          expect.objectContaining({
            label: 'Deck',
            url: 'https://cdn.gigvora.com/deck.pdf',
            type: 'pdf',
          }),
        ],
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByLabelText(/mentor/i)).toHaveValue('');
  });
});

describe('MentoringSessionSchedulerDrawer', () => {
  it('closes when the close button is pressed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <MentoringSessionSchedulerDrawer
        open
        onClose={onClose}
        catalog={SAMPLE_CATALOG}
        onSubmit={vi.fn()}
        submitting={false}
      />,
    );

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('MentoringSessionTable', () => {
  it('renders sessions and fires callbacks', async () => {
    const onSelect = vi.fn();
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    render(
      <MentoringSessionTable
        loading={false}
        sessions={[
          {
            id: 'session-1',
            topic: 'OKR planning',
            scheduledAt: '2024-06-05T13:00:00.000Z',
            durationMinutes: 75,
            meetingProvider: 'Zoom',
            mentor: SAMPLE_CATALOG.mentors[0],
            mentee: SAMPLE_CATALOG.mentees[0],
            serviceLine: SAMPLE_CATALOG.serviceLines[0],
            adminOwner: SAMPLE_CATALOG.owners[0],
            status: 'scheduled',
            feedbackRating: 4.5,
            followUpAt: '2024-06-12T08:00:00.000Z',
            actionItems: [{ id: 'a1' }],
          },
        ]}
        pagination={{ page: 1, totalPages: 3, total: 10 }}
        onSelect={onSelect}
        onPageChange={onPageChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: /manage/i }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'session-1' }),
    );

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});

describe('MentoringSessionDetailPanel', () => {
  const session = {
    id: 'session-123',
    topic: 'Career mapping',
    agenda: 'Discuss roadmap',
    status: 'scheduled',
    scheduledAt: '2024-06-10T10:00',
    durationMinutes: 60,
    meetingProvider: 'Zoom',
    meetingUrl: 'https://zoom.us/j/456',
    notesSummary: 'Summary',
    followUpAt: '2024-06-20',
    adminOwnerId: 99,
    serviceLineId: 42,
    resourceLinks: [
      { label: 'Plan', url: 'https://cdn.gigvora.com/plan.pdf', type: 'pdf' },
    ],
    sessionNotes: [
      { id: 'note-1', body: 'Initial note', createdAt: '2024-05-01T12:00:00.000Z' },
    ],
    actionItems: [
      {
        id: 'action-1',
        title: 'Send follow-up',
        status: 'pending',
        assignee: { firstName: 'Alice', lastName: 'Mentor' },
      },
    ],
  };

  let onUpdateSession;
  let onCreateNote;

  beforeEach(() => {
    onUpdateSession = vi.fn();
    onCreateNote = vi.fn().mockResolvedValue();
  });

  it('saves updates and creates notes', async () => {
    const user = userEvent.setup();

    render(
      <MentoringSessionDetailPanel
        open
        session={session}
        catalog={SAMPLE_CATALOG}
        onUpdateSession={onUpdateSession}
        onCreateNote={onCreateNote}
        onUpdateNote={vi.fn()}
        onDeleteNote={vi.fn()}
        onCreateAction={vi.fn()}
        onUpdateAction={vi.fn()}
        onDeleteAction={vi.fn()}
        updating={false}
      />,
    );

    await user.clear(screen.getByLabelText(/topic/i));
    await user.type(screen.getByLabelText(/topic/i), 'Career acceleration');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(onUpdateSession).toHaveBeenCalledWith(
      'session-123',
      expect.objectContaining({ topic: 'Career acceleration' }),
    );

    await user.type(screen.getByLabelText(/add an internal note/i), 'Need to follow up');
    await user.click(screen.getByRole('button', { name: /post note/i }));

    expect(onCreateNote).toHaveBeenCalledWith('session-123', {
      body: 'Need to follow up',
      visibility: 'internal',
    });
  });
});

describe('MentoringStatsCards', () => {
  it('renders summary metrics with fallbacks', () => {
    render(
      <MentoringStatsCards
        metrics={{ upcomingCount: 3, followUpsDue: 1, averageFeedback: 4.75, openActionItems: 2 }}
        totalsByStatus={{ scheduled: 4, completed: 7 }}
      />,
    );

    const cards = screen.getAllByText(/Upcoming|Follow-ups|Feedback|Tasks/);
    expect(cards).toHaveLength(4);
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});
