import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NetworkingBusinessCardStudio from '../NetworkingBusinessCardStudio.jsx';
import NetworkingDuringSessionConsole from '../NetworkingDuringSessionConsole.jsx';
import NetworkingSessionDesigner from '../NetworkingSessionDesigner.jsx';
import NetworkingSessionShowcase from '../NetworkingSessionShowcase.jsx';
import NetworkingSessionsBoard from '../NetworkingSessionsBoard.jsx';
import SessionConnectionsPanel from '../SessionConnectionsPanel.jsx';
import SessionPlanner from '../SessionPlanner.jsx';
import SessionSpendPanel from '../SessionSpendPanel.jsx';

const noop = () => {};

describe('NetworkingBusinessCardStudio', () => {
  it('creates cards and renders library entries', async () => {
    const createCard = vi.fn(() => Promise.resolve());
    const cards = [
      {
        id: 'card-1',
        title: 'Investor intro',
        headline: 'Founder at Gigvora',
        contactEmail: 'founder@gigvora.com',
        status: 'published',
        shareCount: 12,
      },
    ];

    render(
      <NetworkingBusinessCardStudio
        cards={cards}
        onCreateCard={createCard}
        onRefresh={noop}
      />,
    );

    expect(screen.getByText('Investor intro')).toBeInTheDocument();
    expect(screen.getByText('published')).toBeInTheDocument();

    const emailInput = screen.getByLabelText('Contact email');
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: ' mentor@gigvora.com ' } });
      fireEvent.click(screen.getByRole('button', { name: /save card/i }));
    });

    await waitFor(() => expect(createCard).toHaveBeenCalled());
    expect(createCard).toHaveBeenCalledWith(
      expect.objectContaining({
        contactEmail: 'mentor@gigvora.com',
        status: 'draft',
      }),
    );
  });
});

describe('NetworkingDuringSessionConsole', () => {
  it('displays runtime metrics for rotations and attendees', () => {
    const runtime = {
      runtime: {
        activeRotation: {
          rotationNumber: 1,
          startTime: '2024-06-12T10:00:00Z',
          endTime: '2024-06-12T10:05:00Z',
          durationSeconds: 300,
        },
        nextRotation: {
          rotationNumber: 2,
          startTime: '2024-06-12T10:05:00Z',
        },
        checkedIn: [{ id: '1', participantName: 'Alex', participantEmail: 'alex@example.com' }],
        waitlist: [],
        completed: [],
        noShows: [],
      },
      session: { status: 'in_progress' },
    };

    render(<NetworkingDuringSessionConsole runtime={runtime} />);

    expect(screen.getByText(/Rotation 1/)).toBeInTheDocument();
    expect(screen.getByText(/Rotation 2/)).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
  });
});

describe('NetworkingSessionDesigner', () => {
  it('submits normalized payloads', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(
      <NetworkingSessionDesigner
        onSubmit={onSubmit}
        defaultValues={{ title: 'Demo session', accessType: 'paid', price: 400 }}
      />,
    );

    const form = screen.getByText('Design a networking session').closest('form');
    const scope = within(form);
    await act(async () => {
      fireEvent.change(scope.getByLabelText('Session title'), { target: { value: ' Investor mixer ' } });
      fireEvent.change(scope.getByLabelText(/Session length/i), { target: { value: '45' } });
      fireEvent.change(scope.getByLabelText(/Rotation duration/i), { target: { value: '180' } });
      fireEvent.change(scope.getByLabelText(/Join limit/i), { target: { value: '30' } });
      fireEvent.change(scope.getByLabelText(/Access type/i), { target: { value: 'paid' } });
      fireEvent.change(scope.getByLabelText(/Ticket price \(USD\)/i), { target: { value: '520' } });
      fireEvent.click(scope.getByRole('button', { name: /create session/i }));
    });

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const payload = onSubmit.mock.calls[0][0];
    expect({
      ...payload,
      title: payload.title.trim(),
    }).toMatchObject({
      title: 'Investor mixer',
      sessionLengthMinutes: 45,
      rotationDurationSeconds: 180,
      joinLimit: 30,
      price: 520,
    });
  });
});

describe('NetworkingSessionShowcase', () => {
  it('renders featured session details and host tips', () => {
    const showcase = {
      featured: {
        title: 'Founder speed networking',
        description: 'Pair founders with mentors in five-minute rotations.',
        startTime: '2024-06-20T18:00:00Z',
        showcaseConfig: { hostTips: ['Send a recap afterwards'] },
      },
      librarySize: 6,
      cardsAvailable: 48,
    };

    render(<NetworkingSessionShowcase showcase={showcase} onPreview={noop} />);

    expect(screen.getByText('Founder speed networking')).toBeInTheDocument();
    const librarySummary = screen.getByText(/sessions in your library/i);
    expect(librarySummary).toHaveTextContent('6 sessions in your library');
    expect(screen.getByText('Send a recap afterwards')).toBeInTheDocument();
  });
});

describe('NetworkingSessionsBoard', () => {
  const networking = {
    sessions: {
      list: [
        {
          id: 'session-1',
          title: 'EU Agency Mixer',
          description: 'Connect agencies and brands',
          status: 'scheduled',
          startTime: '2024-06-25T10:00:00Z',
          joinLimit: 40,
          metrics: {
            registered: 25,
            checkedIn: 0,
            waitlisted: 4,
            averageSatisfaction: 92,
          },
        },
      ],
      active: 2,
      upcoming: 3,
      completed: 5,
      averageJoinLimit: 45,
      rotationDurationSeconds: 180,
      revenueCents: 95000,
    },
    scheduling: { preRegistrations: 10, waitlist: 5, remindersSent: 12, searches: 120 },
    monetization: { paid: 4, free: 6, averagePriceCents: 4500 },
    penalties: { noShowRate: 8, activePenalties: 2, restrictedParticipants: 1, cooldownDays: 7 },
    attendeeExperience: { profilesShared: 30, connectionsSaved: 12, averageMessagesPerSession: 14, followUpsScheduled: 9 },
    digitalBusinessCards: { created: 120, updatedThisWeek: 24, sharedInSession: 80, templates: 6 },
    video: { averageQualityScore: 98, browserLoadShare: 65, hostAnnouncements: 5, failoverRate: 0.5 },
  };

  it('displays summary cards and emits selection events', async () => {
    const onSelect = vi.fn();
    render(<NetworkingSessionsBoard networking={networking} onSelectSession={onSelect} />);

    expect(screen.getByText('Active sessions')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /EU Agency Mixer/i }));
    });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'session-1' }));
  });
});

describe('SessionConnectionsPanel', () => {
  it('allows logging follow-ups for a connection', async () => {
    const onSchedule = vi.fn();
    const connections = [
      {
        id: 'conn-1',
        sessionId: 'session-1',
        sessionTitle: 'Investor Mixer',
        participant: { name: 'Jamie Doe', title: 'Founder' },
        followUpsScheduled: 1,
      },
    ];

    render(<SessionConnectionsPanel connections={connections} onScheduleFollowUp={onSchedule} />);

    expect(screen.getByText(/Quality intro prompts/i)).toBeInTheDocument();
    const prompts = screen.getAllByText(
      /Confirm next steps from the “Investor Mixer” session and recap what you already logged with Jamie\./i,
    );
    expect(prompts.length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /log follow-up/i }));
    });
    expect(onSchedule).toHaveBeenCalledWith(expect.objectContaining({ id: 'conn-1' }));
  });
});

describe('SessionPlanner', () => {
  const sessions = [
    {
      id: 'session-1',
      title: 'Launch Mixer',
      description: 'Kickoff networking',
      status: 'scheduled',
      startTime: '2024-06-15T09:00:00Z',
      sessionLengthMinutes: 30,
      rotationDurationSeconds: 180,
      joinLimit: 40,
      waitlistLimit: 20,
      accessType: 'free',
      metrics: {
        registered: 20,
        checkedIn: 0,
        waitlisted: 5,
        completed: 0,
        noShows: 0,
        messagesSent: 25,
        averageSatisfaction: 94,
      },
    },
  ];
  const summary = {
    live: 1,
    upcoming: 2,
    done: 3,
    averageJoinLimit: 40,
    averageRotation: 180,
    averageSatisfaction: 92,
    noShowRate: 4,
    averageMessages: 12,
    totalFollowUps: 6,
    averageFollowUpsPerSession: 3,
    averageFollowUpsPerAttendee: 1.5,
    connectionsCaptured: 9,
    averageConnectionsPerSession: 4.5,
  };

  it('opens designer modal and triggers create flow', async () => {
    const onCreate = vi.fn(() => Promise.resolve());
    const onRefresh = vi.fn(() => Promise.resolve());

    render(
      <SessionPlanner
        sessions={sessions}
        summary={summary}
        onCreate={onCreate}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByText('Plan')).toBeInTheDocument();
    expect(screen.getByText('Follow-ups')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /new session/i }));
    });
    const dialog = await screen.findByRole('dialog', { name: /networking session designer/i });
    const titleInput = within(dialog).getByLabelText('Session title');
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: ' Founder connections ' } });
      fireEvent.click(within(dialog).getByRole('button', { name: /create session/i }));
    });

    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    expect(onCreate.mock.calls[0][0].title.trim()).toBe('Founder connections');
    await waitFor(() => expect(onRefresh).toHaveBeenCalled());
    expect(onRefresh).toHaveBeenCalledWith({ force: true });
  });
});

describe('SessionSpendPanel', () => {
  const sessions = [
    {
      id: 'session-1',
      title: 'Premium networking',
      status: 'completed',
      accessType: 'paid',
      priceCents: 12000,
      currency: 'USD',
      signups: [
        { id: 'signup-1', status: 'completed' },
        { id: 'signup-2', status: 'checked_in' },
      ],
      monetization: {
        actualSpendCents: 1500,
        targetSpendCents: 2000,
      },
    },
  ];

  it('summarises spend and paid session rows', () => {
    const summary = {
      paidSessions: 1,
      freeSessions: 0,
      revenueCents: 24000,
      purchases: 2,
      averagePriceCents: 12000,
      actualSpendCents: 1500,
      targetSpendCents: 2000,
    };

    render(<SessionSpendPanel summary={summary} sessions={sessions} />);

    expect(screen.getByText('Paid sessions')).toBeInTheDocument();
    const row = screen.getByRole('row', { name: /premium networking/i });
    expect(within(row).getByText('Premium networking')).toBeInTheDocument();
    expect(within(row).getByText('$240')).toBeInTheDocument();
  });
});
