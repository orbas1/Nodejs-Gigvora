import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../../hooks/useProjectOperations.js', () => ({
  useProjectOperations: vi.fn(),
}));

vi.mock('../../../services/projectOperations.js', () => ({
  __esModule: true,
  default: {
    addProjectTask: vi.fn().mockResolvedValue(),
    updateProjectTask: vi.fn(),
    deleteProjectTask: vi.fn(),
  },
}));

vi.mock('../../../hooks/useProjectWorkspace.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

import ProjectAgencyDelegation from '../ProjectAgencyDelegation.jsx';
import ProjectGanttChart from '../ProjectGanttChart.jsx';
import ProjectPaySplitTable from '../ProjectPaySplitTable.jsx';
import ProjectOperationsSection from '../ProjectOperationsSection.jsx';
import ProjectWorkspaceSection from '../ProjectWorkspaceSection.jsx';
import ReputationEngineShowcase from '../../reputation/ReputationEngineShowcase.jsx';
import SiteDocumentLayout from '../../site/SiteDocumentLayout.jsx';
import { useProjectOperations } from '../../../hooks/useProjectOperations.js';
import projectOperationsService from '../../../services/projectOperations.js';
import useProjectWorkspace from '../../../hooks/useProjectWorkspace.js';

const mockUseProjectOperations = useProjectOperations;
const mockUseProjectWorkspace = useProjectWorkspace;
const { addProjectTask } = projectOperationsService;

const sampleAssignments = [
  {
    id: 1,
    memberName: 'Jamie Rivera',
    role: 'UX Designer',
    status: 'active',
    delegatedAt: '2024-03-02T12:00:00.000Z',
    delegatedBy: 'Avery',
    capacityHours: 30,
    allocatedHours: 18,
    workloadPercent: 60,
  },
];

beforeEach(() => {
  mockUseProjectOperations.mockReset();
  mockUseProjectWorkspace.mockReset();
  addProjectTask.mockReset();
  addProjectTask.mockResolvedValue();
});

class IntersectionObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

global.IntersectionObserver = IntersectionObserverMock;

describe('ProjectAgencyDelegation', () => {
  it('renders assignment summary cards', () => {
    render(<ProjectAgencyDelegation assignments={sampleAssignments} />);
    expect(screen.getByText('Jamie Rivera')).toBeInTheDocument();
    expect(screen.getByText('Allocated 18 hrs')).toBeInTheDocument();
  });
});

describe('ProjectGanttChart', () => {
  it('calculates duration and workload totals', () => {
    render(
      <ProjectGanttChart
        timeline={{ name: 'Delivery plan', startDate: '2024-04-01', endDate: '2024-04-20' }}
        tasks={[
          {
            id: 1,
            title: 'Design',
            ownerName: 'Jamie',
            startDate: '2024-04-01',
            endDate: '2024-04-05',
            workloadHours: 24,
            progressPercent: 50,
            status: 'in_progress',
          },
          {
            id: 2,
            title: 'Development',
            ownerName: 'Avery',
            startDate: '2024-04-06',
            endDate: '2024-04-18',
            workloadHours: 60,
            progressPercent: 25,
            status: 'planned',
          },
        ]}
      />,
    );

    expect(screen.getByText('Delivery plan')).toBeInTheDocument();
    expect(screen.getByText('Planned effort')).toBeInTheDocument();
    expect(screen.getByText('84 hrs')).toBeInTheDocument();
    expect(screen.getByText('Phases tracked')).toBeInTheDocument();
  });
});

describe('ProjectPaySplitTable', () => {
  it('formats allocation amounts and totals', () => {
    render(
      <ProjectPaySplitTable
        splits={[
          { id: 1, contributorName: 'Freelancer', allocationAmountCents: 500000, allocationPercent: 40, currency: 'USD', status: 'active' },
          { id: 2, contributorName: 'Agency', allocationAmountCents: 750000, allocationPercent: 60, currency: 'USD', status: 'active' },
        ]}
      />,
    );

    expect(screen.getByText('Contributor economics')).toBeInTheDocument();
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
    expect(screen.getByText('Total allocation:')).toBeInTheDocument();
    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });
});

describe('ProjectOperationsSection', () => {
  it('submits task drafts through the operations service', async () => {
    const refresh = vi.fn();
    mockUseProjectOperations.mockReturnValue({
      data: {
        project: { id: 404, name: 'Workspace' },
        timeline: { name: 'Delivery plan', startDate: '2024-04-01', endDate: '2024-05-01' },
        tasks: [],
        assignments: sampleAssignments,
        splits: [],
        metrics: { total: 0, completed: 0, blocked: 0, atRisk: 0 },
      },
      loading: false,
      error: null,
      fromCache: false,
      lastUpdated: new Date('2024-04-02T10:00:00Z'),
      refresh,
    });

    render(<ProjectOperationsSection projectId={404} />);

    await act(async () => {
      await userEvent.type(screen.getByLabelText('Title'), 'Launch feature flag');
      await userEvent.type(screen.getByLabelText('Owner'), 'Jordan');
      await userEvent.type(screen.getByLabelText('Progress (%)'), '90');
      await userEvent.type(screen.getByLabelText('Workload (hrs)'), '25');
      await userEvent.click(screen.getByRole('button', { name: 'Add task' }));
    });

    await waitFor(() => expect(addProjectTask).toHaveBeenCalled());
    expect(addProjectTask.mock.calls[0][0]).toBe(404);
    expect(addProjectTask.mock.calls[0][1]).toMatchObject({
      title: 'Launch feature flag',
      ownerName: 'Jordan',
      progressPercent: 90,
      workloadHours: 25,
    });
    expect(refresh).toHaveBeenCalledWith({ force: true });
  });
});

describe('ProjectWorkspaceSection', () => {
  it('renders workspace insights and triggers refresh', async () => {
    const refresh = vi.fn();
    mockUseProjectWorkspace.mockReturnValue({
      data: {
        workspace: {
          progressPercent: 55,
          riskLevel: 'medium',
          nextMilestone: 'Beta launch',
          nextMilestoneDueAt: '2024-04-15T00:00:00Z',
          notes: 'Coordinate with marketing',
          metrics: { deliveryVelocity: 4 },
        },
        project: { name: 'AI Launch', startDate: '2024-03-01', dueDate: '2024-05-01', budgetAllocated: 40000, budgetCurrency: 'USD' },
        metrics: { total: 4, completed: 1, blocked: 1, atRisk: 1 },
        timeline: { name: 'Master plan', startDate: '2024-03-01', endDate: '2024-06-01' },
        assignments: sampleAssignments,
        splits: [],
        brief: {
          clientStakeholders: ['Casey'],
          objectives: [],
          successMetrics: [],
          deliverables: [],
          summary: 'Stakeholder alignment in progress.',
        },
        conversations: [],
        approvals: [],
        whiteboards: [],
        files: [],
        posts: [],
        assets: [],
      },
      loading: false,
      error: null,
      fromCache: true,
      lastUpdated: new Date('2024-04-02T09:00:00Z'),
      refresh,
    });

    render(<ProjectWorkspaceSection projectId={555} />);

    expect(screen.getByText('Showing cached intelligence')).toBeInTheDocument();
    expect(screen.getByText(/Beta launch/)).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Refresh workspace' }));
    });
    expect(refresh).toHaveBeenCalledWith({ force: true });
  });
});

describe('ReputationEngineShowcase', () => {
  it('displays freelancer summary and metrics', () => {
    render(
      <ReputationEngineShowcase
        data={{
          freelancer: { name: 'Taylor', title: 'Brand strategist', location: 'London' },
          metrics: [
            { id: 1, label: 'Win rate', value: '82%', trendDirection: 'up', trendLabel: '▲ 6% vs last quarter' },
            { id: 2, label: 'Review score', value: '4.9', source: 'Gigvora', periodLabel: 'Last 12 months' },
          ],
          summary: {
            lastVerifiedAt: '2024-04-01T00:00:00Z',
            totalReviews: 48,
            reviewAverage: 4.9,
            responseTime: '2h',
            ratings: {
              average: 4.9,
              count: 48,
              verifiedShare: 0.75,
              distribution: [
                { rating: 5, count: 32, share: 0.66 },
                { rating: 4, count: 12, share: 0.25 },
                { rating: 3, count: 3, share: 0.06 },
                { rating: 2, count: 1, share: 0.02 },
                { rating: 1, count: 0, share: 0 },
              ],
            },
            recentActivity: {
              lastReviewAt: '2024-04-05T10:00:00Z',
              recentCount: 6,
              velocityPerMonth: 4.5,
              trend: 'accelerating',
              monthlyBreakdown: [
                { month: '2024-03', count: 5 },
                { month: '2024-04', count: 6 },
              ],
            },
          },
          testimonials: { featured: { clientName: 'Acme Corp', comment: 'Phenomenal delivery.' } },
          successStories: { featured: { title: 'Scaled Series A pipeline', summary: 'Grew inbound SQLs 3x.' }, collection: [] },
          badges: { promoted: [], collection: [{ name: 'Top Strategist', badgeType: 'Verified badge' }] },
          reviewWidgets: [{ id: 'widget-1', name: 'Portfolio badge', widgetType: 'carousel', impressions: 1200, ctaClicks: 80 }],
          automationPlaybooks: ['Publish to Notion wiki'],
          integrationTouchpoints: ['Salesforce opportunities'],
          shareableLinks: [],
        }}
        loading={false}
        error={null}
        fromCache={false}
        lastUpdated={new Date('2024-04-02T10:00:00Z')}
      />,
    );

    expect(screen.getByText('Reputation engine')).toBeInTheDocument();
    expect(screen.getByText('Taylor')).toBeInTheDocument();
    expect(screen.getByText('Win rate')).toBeInTheDocument();
    expect(screen.getByText('▲ 6% vs last quarter')).toBeInTheDocument();
    expect(screen.getByText('Phenomenal delivery.')).toBeInTheDocument();
    expect(screen.getByText('Review sentiment')).toBeInTheDocument();
    expect(screen.getByText('Based on 48 published ratings')).toBeInTheDocument();
  });
});

describe('SiteDocumentLayout', () => {
  it('filters sections using the search control', async () => {
    render(
      <SiteDocumentLayout
        hero={{ title: 'Workspace policy' }}
        sections={[
          { id: 'overview', title: 'Overview', blocks: [{ type: 'text', text: 'Welcome to the workspace.' }] },
          { id: 'security', title: 'Security', blocks: [{ type: 'list', items: ['TLS enforced', 'SAML SSO'] }] },
        ]}
        metadata={{ documentCode: 'DOC-1', summary: 'Policy pack' }}
        loading={false}
        error={null}
        usingFallback={false}
        refresh={vi.fn()}
      />,
    );

    const searchInput = screen.getByLabelText('Search document');
    await act(async () => {
      await userEvent.type(searchInput, 'Security');
    });

    expect(screen.getByRole('heading', { name: 'Security' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Overview' })).not.toBeInTheDocument();
  });
});
