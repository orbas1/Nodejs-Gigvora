import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatwootWidget from '../ChatwootWidget.jsx';
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

    render(<SupportDeskPanel userId={42} freelancerId={null} initialSnapshot={snapshot} />);

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

    render(<SupportDeskPanel userId={55} initialSnapshot={snapshot} onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /refresh snapshot/i }));

    await waitFor(() => {
      expect(getSupportDeskSnapshot).toHaveBeenCalledWith(55, { forceRefresh: true });
    });
  });

  it('shows a blocking error when the user context is missing', async () => {
    useSession.mockReturnValue({ isAuthenticated: true });

    render(<SupportDeskPanel userId={null} freelancerId={null} />);

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

    render(<SupportDeskPanel userId={77} />);

    expect(
      await screen.findByText(/we couldn’t load your resolution workspace/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/snapshot failed/i)).toBeInTheDocument();
  });

  it('supports sending messages through the launcher with an automated reply', async () => {
    useSession.mockReturnValue({ isAuthenticated: true });
    const user = userEvent.setup();

    render(<SupportLauncher replyDelayMs={50} />);

    await user.click(screen.getByRole('button', { name: /support/i }));

    const input = await screen.findByPlaceholderText(/write a message/i);
    await user.type(input, 'Hello support');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(screen.getByText(/hello support/i)).toBeInTheDocument();

    expect(
      await screen.findByText(/thanks for the ping — we will follow up shortly/i, {}, { timeout: 2000 }),
    ).toBeInTheDocument();
  });
});
