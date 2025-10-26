import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProjectGigManagementSection from '../ProjectGigManagementSection.jsx';

const createActions = () => ({
  updateWorkspace: vi.fn(),
  createProjectBid: vi.fn(),
  updateProjectBid: vi.fn(),
  sendProjectInvitation: vi.fn(),
  updateProjectInvitation: vi.fn(),
  updateAutoMatchSettings: vi.fn(),
  createAutoMatch: vi.fn(),
  updateAutoMatch: vi.fn(),
  createProjectReview: vi.fn(),
  createEscrowTransaction: vi.fn(),
  updateEscrowSettings: vi.fn(),
});

const baseData = {
  summary: {
    activeProjects: 2,
    budgetInPlay: 82000,
    currency: 'USD',
    gigsInDelivery: 3,
    templatesAvailable: 4,
  },
  projectCreation: {
    templates: [
      { id: 1, name: 'Brand Sprint', currency: 'USD', recommendedBudgetMin: 5000, recommendedBudgetMax: 12000 },
    ],
    projects: [
      { id: 201, title: 'Founders Hub' },
    ],
  },
  projectBids: { bids: [], stats: {} },
  projectLifecycle: {
    open: [
      {
        id: 301,
        title: 'Alpha Project',
        status: 'in_progress',
        workspace: { progressPercent: 45, nextMilestone: 'UX review', nextMilestoneDueAt: '2024-06-01T00:00:00Z' },
      },
    ],
    closed: [
      {
        id: 302,
        title: 'Beta Project',
        status: 'completed',
        workspace: { progressPercent: 100, completedAt: '2024-04-01T00:00:00Z' },
      },
    ],
    stats: { openCount: 1, closedCount: 1, budgetInPlay: 82000 },
  },
  autoMatch: {
    settings: { enabled: true, matchingWindowDays: 14 },
    matches: [
      {
        id: 501,
        freelancerName: 'Jamie Rivera',
        freelancerEmail: 'jamie@example.com',
        matchScore: 92,
        status: 'suggested',
        matchedAt: '2024-05-03T10:00:00Z',
      },
    ],
    summary: { total: 1, engaged: 0, averageScore: 92 },
  },
  reviews: {
    entries: [
      {
        id: 701,
        subjectType: 'vendor',
        subjectName: 'Creative Collective',
        ratingOverall: 5,
        ratingQuality: 5,
        ratingCommunication: 4,
        ratingProfessionalism: 5,
        wouldRecommend: true,
        submittedAt: '2024-05-01T09:00:00Z',
        comments: 'Brilliant partner',
      },
    ],
    summary: { total: 1, averageOverall: 5, recommended: 1 },
  },
  purchasedGigs: {
    stats: { active: 1 },
    orders: [
      {
        id: 801,
        orderNumber: 3001,
        serviceName: 'Design Kick-off',
        gig: { title: 'Product Design' },
      },
    ],
  },
  escrow: {
    account: { currency: 'USD', balance: 4200, autoReleaseDays: 7 },
    transactions: [
      {
        id: 901,
        type: 'deposit',
        amount: 2500,
        currency: 'USD',
        direction: 'credit',
        description: 'Initial funding',
        createdAt: '2024-05-02T10:00:00Z',
      },
    ],
  },
  gigBoard: {
    opportunities: [
      {
        id: 301,
        title: 'Alpha Project',
        client: 'Acme Corp',
        stage: 'qualify',
        value: 54000,
        currency: 'USD',
        responseTimeHours: 12,
        healthScore: 72,
        personaFit: ['Operations'],
        blockers: [],
        activityLog: [
          { at: '2024-05-01T10:00:00Z', label: 'Discovery call', actor: 'Operations lead' },
        ],
        nextAction: 'Schedule kickoff',
        summary: 'Build a branded onboarding flow.',
      },
    ],
  },
  contractOperations: {
    contracts: [
      {
        id: 'ct-1',
        title: 'Alpha Retainer',
        counterpart: 'Acme Corp',
        statusKey: 'onTrack',
        statusLabel: 'On track',
        startDate: '2024-01-01T00:00:00Z',
        endDate: null,
        phases: [],
        obligations: [
          {
            id: 'ob-1',
            label: 'Kickoff deck',
            owner: 'Operations lead',
            dueDate: '2024-06-01T00:00:00Z',
            severity: 'medium',
            type: 'workspace',
            completed: false,
            checklistItemId: 'chk-1',
            cardId: 'card-1',
          },
        ],
        deliverables: [],
        risks: [],
        touchpoints: ['Weekly sync'],
        analytics: { renewalProbability: 78, satisfaction: 85, compliance: 70 },
        financials: { currency: 'USD', totalValue: 120000, paidToDate: 45000, upcoming: 30000, burnRate: '45' },
        renewal: { targetDate: '2024-12-31T00:00:00Z', notes: 'Renew 30 days prior' },
        metadata: { workspaceId: 'ws-1', clientAccountId: 'client-1', cardId: 'card-1' },
      },
    ],
  },
};

describe('ProjectGigManagementSection', () => {
  const renderSection = (props = {}) =>
    render(
      <ProjectGigManagementSection
        data={baseData}
        actions={createActions()}
        loading={false}
        canManage
        viewOnlyNote={null}
        allowedRoles={[]}
        onOpenProject={vi.fn()}
        onOpenOrder={vi.fn()}
        onProjectPreview={vi.fn()}
        activeTab="projects"
        onTabChange={vi.fn()}
        {...props}
      />,
    );

  it('exposes lifecycle data to the auto-match panel including project options', () => {
    renderSection({ activeTab: 'match' });

    expect(screen.getByText('Jamie Rivera')).toBeInTheDocument();
    const projectSelect = screen.getByLabelText('Project');
    const options = within(projectSelect).getAllByRole('option').map((option) => option.textContent);
    expect(options).toContain('Alpha Project');
    expect(options).toContain('Beta Project');
  });

  it('passes review data along with order choices to the reviews panel', () => {
    renderSection({ activeTab: 'reviews' });

    expect(screen.getByText('Creative Collective')).toBeInTheDocument();
    const orderSelect = screen.getByLabelText('Order');
    const orderOptionTexts = within(orderSelect).getAllByRole('option').map((option) => option.textContent);
    expect(orderOptionTexts).toContain('Product Design (3001)');
  });

  it('provides escrow account information to the escrow panel', () => {
    renderSection({ activeTab: 'escrow' });

    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByText(/USD 4,200.00/)).toBeInTheDocument();
    expect(screen.getByText('Initial funding')).toBeInTheDocument();
  });

  it('renders proposal builder and bid workspace in the bids tab', () => {
    renderSection({ activeTab: 'bids' });

    expect(screen.getByText('Compose proposal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save proposal to bids/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Opportunity')).toBeInTheDocument();
  });
});
