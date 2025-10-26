import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ChatwootWidget from '../ChatwootWidget.jsx';
import SupportBubble from '../SupportBubble.jsx';
import SupportDeskPanel from '../SupportDeskPanel.jsx';
import SupportLauncher from '../SupportLauncher.jsx';

vi.mock('../../../hooks/useChatwoot.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../../../services/supportDesk.js', () => ({
  __esModule: true,
  getSupportDeskSnapshot: vi.fn(),
  createKnowledgeBaseArticle: vi.fn(),
  createSupportPlaybook: vi.fn(),
}));

const useChatwoot = (await import('../../../hooks/useChatwoot.js')).default;
const useSession = (await import('../../../hooks/useSession.js')).default;
const { getSupportDeskSnapshot } = await import('../../../services/supportDesk.js');

function buildSnapshot() {
  return {
    data: {
      refreshedAt: new Date().toISOString(),
      metrics: {
        openSupportCases: 2,
        openDisputes: 1,
        averageFirstResponseMinutes: 45,
        averageResolutionMinutes: 180,
        csatScore: 4.6,
        csatResponses: 24,
        csatResponseRate: 86,
        csatTrailing30DayScore: 4.8,
      },
      supportCases: [
        {
          id: 101,
          status: 'open',
          priority: 'high',
          reason: 'Payment delayed',
          escalatedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
          firstResponseAt: new Date(Date.now() - 1800 * 1000).toISOString(),
          assignedAgent: { name: 'Jordan' },
          transcript: [
            {
              id: 'm-1',
              sender: { name: 'Jordan' },
              createdAt: new Date(Date.now() - 1600 * 1000).toISOString(),
              body: 'Thanks for flagging this – reviewing your payout now.',
            },
          ],
          surveys: [
            {
              id: 'survey-1',
              response: 'Happy',
              score: 5,
              comment: 'Quick follow-up!',
            },
          ],
          playbooks: [
            {
              id: 'pb-1',
              status: 'in_progress',
              playbook: {
                title: 'Escalated payout',
                summary: 'Coordinate with finance to expedite payout release.',
                steps: [
                  { id: 'st-1', stepNumber: 1, title: 'Review escrow', instructions: 'Confirm order status.' },
                ],
              },
            },
          ],
          linkedOrder: {
            reference: '#GV-3321',
            amount: 18000,
            currencyCode: 'USD',
          },
        },
      ],
      disputes: [{ id: 'd-1', status: 'open' }],
      playbooks: [
        {
          id: 'pb-2',
          stage: 'live',
          persona: 'freelancer',
          title: 'Quality assurance reset',
          summary: 'Reassure clients after a quality complaint.',
          csatImpact: '+12 CSAT',
          steps: [
            { id: 'qa-1', stepNumber: 1, title: 'Acknowledge issue', instructions: 'Confirm you are reviewing the ticket.' },
          ],
        },
      ],
      knowledgeBase: [
        {
          id: 'kb-1',
          category: 'policy',
          audience: 'freelancer',
          title: 'Payout timing & dispute windows',
          summary: 'Understand how payouts sync with escrow and dispute periods.',
          tags: ['payouts', 'escrow'],
          resourceLinks: [{ label: 'Escrow runbooks', url: 'https://example.com' }],
          lastReviewedAt: new Date().toISOString(),
        },
      ],
    },
  };
}

describe('Support suite components', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    getSupportDeskSnapshot.mockResolvedValue({ data: { contacts: [] } });
  });

  it('enables Chatwoot when the user is authenticated', () => {
    useSession.mockReturnValue({ isAuthenticated: true });

    render(<ChatwootWidget />);

    expect(useChatwoot).toHaveBeenCalledWith({ enabled: true });
  });

  it('disables Chatwoot when the user is signed out', () => {
    useSession.mockReturnValue({ isAuthenticated: false });

    render(<ChatwootWidget />);

    expect(useChatwoot).toHaveBeenCalledWith({ enabled: false });
  });

  it('renders support insights from the initial snapshot', async () => {
    useSession.mockReturnValue({ isAuthenticated: true });
    const snapshot = buildSnapshot();

    await act(async () => {
      render(<SupportDeskPanel userId={42} freelancerId={null} initialSnapshot={snapshot} />);
    });

    expect(
      await screen.findByRole('heading', { name: /resolution control centre/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/open support cases/i)).toBeInTheDocument();
    expect(screen.getByText(/case #101/i)).toBeInTheDocument();
    expect(screen.getByText(/payout timing & dispute windows/i)).toBeInTheDocument();
  });

  it('requests a fresh snapshot when refreshing', async () => {
    useSession.mockReturnValue({ isAuthenticated: true });
    const snapshot = buildSnapshot();
    getSupportDeskSnapshot.mockResolvedValue({ ...snapshot, cachedAt: new Date() });

    const user = userEvent.setup();

    await act(async () => {
      render(<SupportDeskPanel userId={55} initialSnapshot={snapshot} onClose={vi.fn()} />);
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /refresh snapshot/i }));
    });

    await waitFor(() => {
      expect(getSupportDeskSnapshot).toHaveBeenCalledWith(55, { forceRefresh: true });
    });
  });

  it('shows a blocking error when the user context is missing', async () => {
    useSession.mockReturnValue({ isAuthenticated: true });

    await act(async () => {
      render(<SupportDeskPanel userId={null} freelancerId={null} />);
    });

    expect(
      await screen.findByText(/we couldn’t load your resolution workspace/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/user context is missing for the support desk module/i),
    ).toBeInTheDocument();
  });

  it('surfaces errors that occur while loading the snapshot', async () => {
    useSession.mockReturnValue({ isAuthenticated: true });
    getSupportDeskSnapshot.mockRejectedValueOnce(new Error('Snapshot failed'));

    await act(async () => {
      render(<SupportDeskPanel userId={77} />);
    });

    expect(
      await screen.findByText(/we couldn’t load your resolution workspace/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/snapshot failed/i)).toBeInTheDocument();
  });

  it('renders concierge metrics inside the support bubble', async () => {
    const onOpen = vi.fn();
    const snapshot = {
      data: {
        metrics: {
          openSupportCases: 2,
          openDisputes: 1,
          csatScore: 4.8,
          averageFirstResponseMinutes: 22,
          averageResolutionMinutes: 180,
          publishedPlaybooks: 6,
        },
        contacts: [
          {
            id: 'concierge-1',
            name: 'Noah Patel',
            role: 'Customer success lead',
            status: 'online',
            lastActiveAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          },
        ],
        disputes: [{ id: 'd-10', status: 'open' }],
        playbooks: [{ id: 'pb-10' }, { id: 'pb-11' }, { id: 'pb-12' }, { id: 'pb-13' }, { id: 'pb-14' }, { id: 'pb-15' }],
        refreshedAt: new Date().toISOString(),
      },
    };

    getSupportDeskSnapshot.mockResolvedValue({ data: snapshot.data });

    const user = userEvent.setup();
    await act(async () => {
      render(<SupportBubble userId={42} initialSnapshot={snapshot} onOpen={onOpen} />);
    });

    expect(screen.getByText(/need a fast assist/i)).toBeInTheDocument();
    expect(screen.getByText(/2 active cases/i)).toBeInTheDocument();
    expect(screen.getByText(/4\.8\/5/i)).toBeInTheDocument();
    expect(screen.getByText(/180 mins/i)).toBeInTheDocument();
    expect(screen.getByText(/1 dispute is currently under review/i)).toBeInTheDocument();
    expect(screen.getByText('Noah Patel')).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /talk to support/i }));
    });
    expect(onOpen).toHaveBeenCalledWith({
      source: 'support-bubble',
      snapshot: snapshot.data,
    });
    await waitFor(() => {
      expect(getSupportDeskSnapshot).toHaveBeenCalledWith(
        42,
        expect.objectContaining({ forceRefresh: true }),
      );
    });
  });

  it('loads live data when no snapshot is provided', async () => {
    getSupportDeskSnapshot.mockResolvedValueOnce({
      data: {
        metrics: { openSupportCases: 1, csatScore: 4.5, averageFirstResponseMinutes: 30 },
        contacts: [],
      },
    });

    await act(async () => {
      render(<SupportBubble userId={91} />);
    });

    expect(await screen.findByText(/1 active case/i)).toBeInTheDocument();
    expect(getSupportDeskSnapshot).toHaveBeenCalledWith(
      91,
      expect.objectContaining({ forceRefresh: false }),
    );
  });

  it('forces a live refresh when syncing insights', async () => {
    getSupportDeskSnapshot.mockResolvedValueOnce({
      data: { metrics: { openSupportCases: 3 }, contacts: [] },
    });

    const user = userEvent.setup();
    await act(async () => {
      render(<SupportBubble userId={33} />);
    });

    expect(await screen.findByText(/3 active cases/i)).toBeInTheDocument();

    getSupportDeskSnapshot.mockResolvedValueOnce({
      data: { metrics: { openSupportCases: 4 }, contacts: [] },
    });

    const syncButton = screen.getByRole('button', { name: /sync insights/i });
    await act(async () => {
      await user.click(syncButton);
    });

    await waitFor(() => {
      expect(getSupportDeskSnapshot).toHaveBeenLastCalledWith(
        33,
        expect.objectContaining({ forceRefresh: true }),
      );
    });
  });

  it('gracefully handles missing user context in the bubble', async () => {
    await act(async () => {
      render(<SupportBubble />);
    });

    expect(
      await screen.findByText(/complete your profile to unlock live concierge support/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /talk to support/i })).toBeDisabled();
  });

  it('supports sending messages through the launcher with an automated reply', async () => {
    useSession.mockReturnValue({ isAuthenticated: true });
    const user = userEvent.setup();

    await act(async () => {
      render(<SupportLauncher replyDelayMs={50} />);
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /toggle support inbox/i }));
    });
    await act(async () => {
      await user.click(await screen.findByRole('button', { name: /helena morris/i }));
    });

    const input = await screen.findByPlaceholderText(/write a message/i);
    await act(async () => {
      await user.type(input, 'Hello support');
      await user.click(screen.getByRole('button', { name: /send message/i }));
    });

    expect(screen.getByText(/hello support/i)).toBeInTheDocument();

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 75);
      });
    });

    expect(screen.getByText(/thanks for the ping — we will follow up shortly/i)).toBeInTheDocument();
  });

  it('renders knowledge base spotlights from the support snapshot', async () => {
    useSession.mockReturnValue({ isAuthenticated: true, session: { id: 77 } });
    getSupportDeskSnapshot.mockResolvedValueOnce({
      data: {
        contacts: [
          { id: 'agent-1', name: 'Nova', role: 'Support lead', status: 'online' },
        ],
        knowledgeBase: [
          { id: 'kb-10', title: 'Escalation playbook', summary: 'Steps to activate enterprise escalations.' },
        ],
      },
      cachedAt: new Date(),
    });

    const user = userEvent.setup();
    await act(async () => {
      render(<SupportLauncher />);
    });

    await screen.findByRole('button', { name: /toggle support inbox/i });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /toggle support inbox/i }));
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /help centre/i }));
    });

    expect(await screen.findByText(/escalation playbook/i)).toBeInTheDocument();
    expect(screen.getByText(/steps to activate enterprise escalations/i)).toBeInTheDocument();
  });

  it('hydrates remote support cases with transcripts and metadata', async () => {
    useSession.mockReturnValue({ isAuthenticated: true, session: { id: 200 } });
    const now = new Date();
    getSupportDeskSnapshot.mockResolvedValueOnce({
      data: {
        supportCases: [
          {
            id: 201,
            status: 'in_progress',
            priority: 'high',
            reason: 'Floating assistance escalation',
            threadId: 'case-201',
            transcript: [
              {
                id: 'msg-1',
                sender: { id: 200, isFreelancer: true, name: 'Member' },
                body: 'Need help reviewing my workspace automations.',
                createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
              },
              {
                id: 'msg-2',
                sender: { id: 502, name: 'Nova Hunt' },
                body: 'On it — pushing the concierge playbook live now.',
                createdAt: new Date(now.getTime() - 4 * 60 * 1000).toISOString(),
              },
            ],
          },
        ],
      },
      cachedAt: now.toISOString(),
    });

    const user = userEvent.setup();
    await act(async () => {
      render(<SupportLauncher />);
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /toggle support inbox/i }));
    });

    const remoteConversationButton = await screen.findByRole('button', {
      name: /floating assistance escalation/i,
    });
    await act(async () => {
      await user.click(remoteConversationButton);
    });

    expect(await screen.findByText(/pushing the concierge playbook live/i)).toBeInTheDocument();
    expect(screen.getByText(/case #201/i)).toBeInTheDocument();
    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });
});
