import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminOperationsHubSection from '../AdminOperationsHubSection.jsx';
import { fetchAdminHubOverview, triggerAdminHubSync } from '../../../../services/adminHub.js';

vi.mock('../../../../services/adminHub.js', () => ({
  fetchAdminHubOverview: vi.fn(),
  triggerAdminHubSync: vi.fn(),
}));

const overviewResponse = {
  metrics: {
    activeMembers: 4200,
    netRevenue: 120000,
    uptimePercentage: 99.95,
    automationRuns: 380,
    slaThresholdHours: 48,
    averageReviewSeconds: 3600,
  },
  pipelines: {
    signups: { value: 320, target: 500 },
    freelancers: { value: 88, target: 120 },
    companies: { value: 54, target: 80 },
    mentors: { value: 12, target: 30 },
  },
  maintenance: {
    nextWindow: {
      start: '2024-02-01T10:00:00Z',
      scope: 'Database upgrades across the EU region.',
    },
  },
  incidents: [
    {
      id: 'inc-1',
      title: 'Realtime delivery delays',
      status: 'investigating',
      lastUpdate: 'Teams engaged across messaging and infra.',
    },
  ],
  automations: [
    {
      id: 'auto-1',
      name: 'CRM sync',
      description: 'Syncing HubSpot companies to Gigvora.',
      completedAt: '2024-01-20T08:00:00Z',
    },
  ],
  totals: {
    total: 1200,
    backlog: 12,
    openQueue: 6,
    autoApproved: 18,
  },
  reviewerBreakdown: [],
  recentActivity: [],
  openQueue: [],
};

async function runInAct(callback) {
  await act(async () => {
    await callback();
  });
}

describe('AdminOperationsHubSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAdminHubOverview.mockResolvedValue(overviewResponse);
    triggerAdminHubSync.mockResolvedValue({});
  });

  it('renders the operations overview metrics', async () => {
    render(<AdminOperationsHubSection />);

    await waitFor(() => expect(fetchAdminHubOverview).toHaveBeenCalled());

    expect(await screen.findByText(/operations control tower/i)).toBeInTheDocument();
    expect(screen.getByText(/active members/i).closest('div')).toHaveTextContent('4200');
    expect(screen.getByText(/net revenue/i).closest('div')).toHaveTextContent('$120,000');
    expect(screen.getByText(/service health/i).closest('div')).toHaveTextContent('99.95%');
    expect(screen.getByText(/maintenance window/i)).toBeInTheDocument();
    expect(screen.getByText(/Realtime delivery delays/i)).toBeInTheDocument();
    expect(screen.getByText(/crm sync/i)).toBeInTheDocument();
  });

  it('triggers a sync and displays feedback', async () => {
    const user = userEvent.setup();
    const refreshedOverview = {
      ...overviewResponse,
      metrics: { ...overviewResponse.metrics, activeMembers: 4250 },
    };

    fetchAdminHubOverview
      .mockResolvedValueOnce(overviewResponse)
      .mockResolvedValueOnce(refreshedOverview);

    render(<AdminOperationsHubSection />);

    await waitFor(() => expect(fetchAdminHubOverview).toHaveBeenCalledTimes(1));

    await runInAct(() => user.click(screen.getByRole('button', { name: /refresh data/i })));

    await waitFor(() => expect(triggerAdminHubSync).toHaveBeenCalled());
    await waitFor(() => expect(fetchAdminHubOverview).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/hub data refresh queued/i)).toBeInTheDocument();
    expect(screen.getByText(/4250/)).toBeInTheDocument();
  });
});
