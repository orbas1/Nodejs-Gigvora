import { render, screen } from '@testing-library/react';
import OperationsHQSection from '../OperationsHQSection.jsx';
import ProfileShowcaseSection from '../ProfileShowcaseSection.jsx';
import ProjectLabSection from '../ProjectLabSection.jsx';
import WorkspaceSettingsSection from '../WorkspaceSettingsSection.jsx';

vi.mock('../../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../../../../hooks/useFreelancerOperationsHQ.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

const useSession = vi.mocked((await import('../../../../hooks/useSession.js')).default);
const useFreelancerOperationsHQ = vi.mocked(
  (await import('../../../../hooks/useFreelancerOperationsHQ.js')).default,
);

beforeEach(() => {
  useSession.mockReturnValue({ session: { freelancerId: 42 } });
  useFreelancerOperationsHQ.mockReturnValue({
    memberships: [
      {
        id: 'ops-core',
        name: 'Operations core',
        status: 'active',
        role: 'Operations lead',
        description: 'Full access to finance, compliance, and delivery orchestration.',
        lastReviewedAt: '2025-01-01T00:00:00.000Z',
      },
    ],
    workflows: [
      {
        id: 'gig-onboarding',
        title: 'Gig onboarding',
        status: 'tracking',
        completion: 72,
        dueAt: '2025-01-02T00:00:00.000Z',
        blockers: [],
      },
    ],
    notices: [
      {
        id: 'notice-kyc',
        tone: 'warning',
        title: 'Verify client KYC',
        message: 'Upload a verified address document to keep payouts uninterrupted.',
        acknowledged: false,
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ],
    metrics: {
      activeWorkflows: 3,
      escalations: 1,
      automationCoverage: 64,
      complianceScore: 92,
      lastSyncedAt: '2025-01-01T00:00:00.000Z',
      currency: 'USD',
    },
    compliance: {
      outstandingTasks: 1,
      recentApprovals: 5,
      nextReviewAt: '2025-01-05T00:00:00.000Z',
    },
    loading: false,
    error: null,
    refresh: vi.fn(),
    syncOperations: vi.fn(),
    requestMembership: vi.fn(),
    acknowledgeNotice: vi.fn(),
    requestState: { status: 'idle', error: null },
    acknowledgingId: null,
    fromCache: false,
    lastUpdated: new Date('2025-01-01T00:00:00.000Z'),
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Freelancer dashboard sections rendering', () => {
  it('surfaces membership actions in Operations HQ', () => {
    render(<OperationsHQSection />);

    expect(screen.getByText(/Operations core/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /request access/i })[0]).toBeInTheDocument();
  });

  it('shows hero showcase narrative with module list', () => {
    render(<ProfileShowcaseSection />);

    expect(screen.getByText(/Bring enterprise clarity/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Spotlight: Lumina Health transformation/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Gallery: Delivery artefacts/i)).toBeInTheDocument();
    expect(screen.getByText(/Operations keynote reel/i)).toBeInTheDocument();
  });

  it('lists project blueprints and creation controls', () => {
    render(<ProjectLabSection />);

    expect(screen.getByText(/Enterprise discovery & handoff/i)).toBeInTheDocument();
    expect(screen.getByText(/Customer experience refresh/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create blueprint/i })).toBeInTheDocument();
  });

  it('renders workspace feature toggles and personalization options', () => {
    render(<WorkspaceSettingsSection />);

    expect(screen.getByText(/Collaboration suite/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Theme/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Notification digest/i)).toBeInTheDocument();
  });
});
