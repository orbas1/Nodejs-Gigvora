import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

const { mockUseSession, mockUseVolunteeringManagement } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
  mockUseVolunteeringManagement: vi.fn(),
}));

vi.mock('../../../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: mockUseSession,
}));

vi.mock('../../../../../hooks/useVolunteeringManagement.js', () => ({
  __esModule: true,
  default: mockUseVolunteeringManagement,
}));

const VolunteeringManagementSection = (
  await import('../volunteering/VolunteeringManagementSection.jsx')
).default;

const baseVolunteeringResponse = {
  workspace: {
    applications: [],
    contracts: { open: [], finished: [] },
    spend: { entries: [], totals: { lifetime: 0, yearToDate: 0 } },
  },
  metadata: null,
  loading: false,
  mutating: false,
  error: null,
  createApplication: vi.fn(),
  updateApplication: vi.fn(),
  deleteApplication: vi.fn(),
  createResponse: vi.fn(),
  updateResponse: vi.fn(),
  deleteResponse: vi.fn(),
  createContract: vi.fn(),
  updateContract: vi.fn(),
  deleteContract: vi.fn(),
  createSpend: vi.fn(),
  updateSpend: vi.fn(),
  deleteSpend: vi.fn(),
};

describe('VolunteeringManagementSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({
      session: {
        activeRole: 'freelancer',
        freelancerId: 'freelancer-21',
        memberships: ['freelancer'],
        workspace: { type: 'freelancer' },
      },
      freelancerProfile: { id: 'freelancer-21' },
    });
    mockUseVolunteeringManagement.mockReturnValue({ ...baseVolunteeringResponse });
  });

  it('requires a freelancer profile before showing data', () => {
    mockUseSession.mockReturnValue({ freelancerProfile: null, session: {} });

    render(<VolunteeringManagementSection />);

    expect(screen.getByText(/freelancer context missing/i)).toBeInTheDocument();
  });

  it('switches between overview and applications views', async () => {
    mockUseSession.mockReturnValue({
      session: {
        activeRole: 'freelancer',
        freelancerId: 'freelancer-21',
        memberships: ['freelancer'],
        workspace: { type: 'freelancer' },
      },
      freelancerProfile: { id: 'freelancer-21', name: 'Jordan' },
    });
    mockUseVolunteeringManagement.mockReturnValue({
      ...baseVolunteeringResponse,
      workspace: {
        metrics: { totalApplications: 3, acceptedContracts: 1 },
        applications: [
          {
            id: 'app-1',
            title: 'Community branding sprint',
            organizationName: 'Atlas Collective',
            status: 'submitted',
            appliedAt: '2024-04-12',
            targetStartDate: '2024-05-01',
          },
        ],
        contracts: {
          open: [
            { id: 'contract-1', title: 'Brand identity refresh', hoursCommitted: 18 },
          ],
          finished: [],
        },
        spend: { entries: [], totals: { lifetime: 0, yearToDate: 0 } },
      },
      metadata: { statuses: [], skills: [] },
    });

    render(<VolunteeringManagementSection />);

    expect(screen.getByText(/latest applications/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /apply/i }));

    expect(
      await screen.findByRole('heading', { level: 3, name: /applications/i }),
    ).toBeInTheDocument();
  });
});
