import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProjectGigManagementSection from '../ProjectGigManagementSection.jsx';

const createActions = () => ({
  updateWorkspace: vi.fn(),
  createProjectBid: vi.fn(),
  updateProjectBid: vi.fn(),
  updateGigBoardLane: vi.fn(),
  saveGigBoardView: vi.fn(),
  deleteGigBoardView: vi.fn(),
  changeGigBoardView: vi.fn(),
  inspectGigBoardCard: vi.fn(),
  refreshGigBoard: vi.fn(),
  sendProjectInvitation: vi.fn(),
  updateProjectInvitation: vi.fn(),
  updateAutoMatchSettings: vi.fn(),
  createAutoMatch: vi.fn(),
  updateAutoMatch: vi.fn(),
  createProjectReview: vi.fn(),
  createEscrowTransaction: vi.fn(),
  updateEscrowSettings: vi.fn(),
  updateProposalDraft: vi.fn(),
  saveProposalDraft: vi.fn(),
  sendProposal: vi.fn(),
  inviteProposalCollaborator: vi.fn(),
  completeContractMilestone: vi.fn(),
  acknowledgeContractRisk: vi.fn(),
  escalateContractRisk: vi.fn(),
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
  managementBoard: {
    currency: 'USD',
    lanes: [
      {
        id: 'sourcing',
        label: 'Sourcing',
        cards: [
          {
            id: 1001,
            title: 'Brand identity refresh',
            client: { name: 'Future Corp' },
            value: 15000,
            currency: 'USD',
            dueAt: '2024-06-12T00:00:00Z',
            tags: ['Brand'],
            metrics: { conversations: 3 },
          },
        ],
      },
      {
        id: 'negotiation',
        label: 'Negotiation',
        cards: [
          {
            id: 1002,
            title: 'Product design sprint',
            client: { name: 'Moon Labs' },
            value: 28000,
            currency: 'USD',
            dueAt: '2024-06-04T00:00:00Z',
            risk: 'medium',
            tags: ['Design', 'Priority'],
          },
        ],
      },
    ],
    views: [{ id: 'priority', name: 'Priority focus', tags: ['Priority'] }],
  },
  proposalWorkspace: {
    activeDraft: {
      title: 'Brand relaunch partnership',
      clientName: 'Future Corp',
      summary: 'Reposition the organisation with a premium identity system.',
      outcomes: 'Launch refreshed brand system across touchpoints.',
      deliverables: 'Brand playbook, digital kit, internal training.',
      timeline: '6 weeks sprint',
      pricing: [
        { description: 'Discovery', amount: 8000, quantity: 1 },
        { description: 'Design system', amount: 12000, quantity: 1 },
      ],
      nextSteps: 'Schedule kickoff and assign squads.',
    },
    templates: [{ id: 'brand', name: 'Brand campaign', summary: 'Narrative-driven brand proposal template.' }],
    collaborators: [{ id: 'col-1', name: 'Alex Morgan' }],
  },
  contractTracker: {
    currency: 'USD',
    summary: { contractValue: 45000, healthScore: 'A' },
    contract: { owner: { name: 'Amelia' } },
    milestones: [
      {
        id: 'm1',
        order: 1,
        title: 'Discovery sprint',
        dueAt: '2024-05-28T00:00:00Z',
        status: 'completed',
        summary: 'Stakeholder interviews and audit.',
        checklist: [
          { id: 'm1-1', label: 'Interview stakeholders', complete: true },
          { id: 'm1-2', label: 'Synthesize insights', complete: true },
        ],
      },
      {
        id: 'm2',
        order: 2,
        title: 'Design system delivery',
        dueAt: '2024-06-10T00:00:00Z',
        status: 'in_progress',
        summary: 'Deliver core system and documentation.',
        checklist: [{ id: 'm2-1', label: 'Visual language' }],
        documents: [{ id: 'doc-1', name: 'Statement of work', url: '#' }],
      },
    ],
    payments: [
      { id: 'p1', amount: 20000, status: 'released' },
      { id: 'p2', amount: 15000, status: 'pending' },
    ],
    risks: [
      {
        id: 'r1',
        title: 'Awaiting brand assets',
        description: 'Client has not uploaded existing assets which may delay design start.',
        level: 'medium',
        owner: { name: 'Alex Morgan' },
      },
    ],
    approvals: [{ id: 'a1', name: 'Client legal', status: 'pending' }],
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

  it('renders gig board analytics and tags when viewing projects', () => {
    renderSection({ activeTab: 'projects' });

    expect(screen.getByText('Board overview')).toBeInTheDocument();
    expect(screen.getByText('Priority focus')).toBeInTheDocument();
    expect(screen.getByText('Brand identity refresh')).toBeInTheDocument();
  });

  it('shows proposal builder preview within bids tab', () => {
    renderSection({ activeTab: 'bids' });

    expect(screen.getByText('Craft premium proposals')).toBeInTheDocument();
    expect(screen.getByText('Brand relaunch partnership')).toBeInTheDocument();
    expect(screen.getByText('Send proposal')).toBeInTheDocument();
  });

  it('includes contract tracker summary metrics', () => {
    renderSection({ activeTab: 'projects' });

    expect(screen.getByText('Track delivery confidence')).toBeInTheDocument();
    expect(screen.getAllByText('Discovery sprint')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Risks')[0]).toBeInTheDocument();
  });
});
