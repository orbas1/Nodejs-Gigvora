import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import JobsPage from '../JobsPage.jsx';

vi.mock('../../components/PageHeader.jsx', () => ({
  __esModule: true,
  default: ({ title, description, meta }) => (
    <header data-testid="page-header">
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      {meta}
    </header>
  ),
}));

vi.mock('../../components/DataStatus.jsx', () => ({
  __esModule: true,
  default: ({ loading, fromCache }) => (
    <div data-testid="data-status" data-loading={loading} data-cache={fromCache} />
  ),
}));

vi.mock('../../components/ui/Modal.jsx', () => ({
  __esModule: true,
  default: ({ open, title, children, actions }) => (
    open ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        <div>{children}</div>
        {actions}
      </div>
    ) : null
  ),
}));

vi.mock('../../components/opportunity/OpportunityFilterPill.jsx', () => ({
  __esModule: true,
  default: ({ label, onRemove }) => (
    <button type="button" onClick={onRemove}>
      {label}
    </button>
  ),
}));

vi.mock('../../components/explorer/SavedSearchList.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="saved-search-list" />,
}));

vi.mock('../../components/jobs/JobManagementWorkspace.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="job-management-workspace" />,
}));

vi.mock('../../services/analytics.js', () => ({
  __esModule: true,
  default: { track: vi.fn() },
}));

const mockUseSession = vi.fn();
vi.mock('../../hooks/useSession.js', () => ({
  __esModule: true,
  default: (...args) => mockUseSession(...args),
}));

const mockUseOpportunityListing = vi.fn();
vi.mock('../../hooks/useOpportunityListing.js', () => ({
  __esModule: true,
  default: (...args) => mockUseOpportunityListing(...args),
}));

const mockUseCachedResource = vi.fn();
vi.mock('../../hooks/useCachedResource.js', () => ({
  __esModule: true,
  default: (...args) => mockUseCachedResource(...args),
}));

const mockUseSavedSearches = vi.fn();
vi.mock('../../hooks/useSavedSearches.js', () => ({
  __esModule: true,
  default: (...args) => mockUseSavedSearches(...args),
}));

function createBaseDashboardData(overrides = {}) {
  return {
    summary: {
      totalApplications: 0,
      activeApplications: 0,
      pendingResponses: 0,
      averageResponseTurnaroundHours: null,
      lastUpdatedAt: null,
      ...overrides.summary,
    },
    pipeline: {
      statuses: [],
      ...overrides.pipeline,
    },
    applications: {
      recent: [],
      ...overrides.applications,
    },
    interviews: overrides.interviews ?? [],
    jobApplicationsWorkspace: {
      summary: {
        totalApplications: overrides.summary?.totalApplications ?? 0,
        activeApplications: overrides.summary?.activeApplications ?? 0,
        pendingResponses: overrides.summary?.pendingResponses ?? 0,
        averageResponseTurnaroundHours:
          overrides.summary?.averageResponseTurnaroundHours ?? null,
        lastUpdatedAt: overrides.summary?.lastUpdatedAt ?? null,
        ...overrides.jobApplicationsWorkspace?.summary,
      },
      statusBreakdown: overrides.jobApplicationsWorkspace?.statusBreakdown ?? [],
      stageVocabulary: overrides.jobApplicationsWorkspace?.stageVocabulary ?? [],
      recommendedActions: overrides.jobApplicationsWorkspace?.recommendedActions ?? [],
    },
    careerPipelineAutomation: {
      kanban: {
        stages: [],
        metrics: { totalOpportunities: 0 },
        ...overrides.careerPipelineAutomation?.kanban,
      },
      bulkOperations: {
        reminders: [],
        ...overrides.careerPipelineAutomation?.bulkOperations,
      },
      autoApply: {
        rules: [],
        guardrails: {},
        ...overrides.careerPipelineAutomation?.autoApply,
      },
      interviewCommandCenter: {
        readiness: {},
        summary: {},
        ...overrides.careerPipelineAutomation?.interviewCommandCenter,
      },
    },
    topSearch: overrides.topSearch ?? null,
    documentStudio: overrides.documentStudio ?? null,
  };
}

function setupCommonMocks() {
  mockUseSession.mockReturnValue({
    session: { memberships: ['freelancer'], id: 'user-123' },
    isAuthenticated: true,
  });

  mockUseOpportunityListing.mockReturnValue({
    data: {
      items: [
        {
          id: 'job-1',
          title: 'Strategic Operations Lead',
          isRemote: true,
          employmentType: 'Full-time',
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 1,
      facets: {
        isRemote: { true: 1 },
        updatedAtDate: { '7d': 1 },
        employmentType: { 'Full-time': 1 },
      },
    },
    error: null,
    loading: false,
    fromCache: false,
    lastUpdated: new Date().toISOString(),
    refresh: vi.fn(),
    debouncedQuery: '',
  });

  mockUseSavedSearches.mockReturnValue({
    items: [],
    loading: false,
    createSavedSearch: vi.fn(),
    deleteSavedSearch: vi.fn(),
    runSavedSearch: vi.fn(),
    canUseServer: true,
  });
}

async function openApplicationsTab() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /applications/i }));
}

describe('JobsPage stage analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupCommonMocks();
  });

  it('renders placeholder messaging when no stage data is available', async () => {
    mockUseCachedResource.mockReturnValue({
      data: createBaseDashboardData({
        jobApplicationsWorkspace: {
          statusBreakdown: [],
          stageVocabulary: [],
          recommendedActions: [],
        },
      }),
      error: null,
      loading: false,
      fromCache: false,
      lastUpdated: new Date().toISOString(),
      refresh: vi.fn(),
    });

    render(
      <MemoryRouter>
        <JobsPage />
      </MemoryRouter>,
    );

    await openApplicationsTab();

    expect(
      await screen.findByText('Submit applications to unlock stage analytics.'),
    ).toBeInTheDocument();
  });

  it('displays stage distribution metrics and severity badges when data is provided', async () => {
    const dashboardData = createBaseDashboardData({
      summary: {
        totalApplications: 1500000,
        activeApplications: 8,
        pendingResponses: 3,
        averageResponseTurnaroundHours: 36,
        lastUpdatedAt: new Date('2024-03-01T12:00:00Z').toISOString(),
      },
      jobApplicationsWorkspace: {
        statusBreakdown: [
          { status: 'applied', count: 1000000 },
          { status: 'interview', count: 400000 },
          { status: 'pipeline-only', count: 100000 },
        ],
        stageVocabulary: [
          {
            status: 'applied',
            label: 'Submitted to employers',
            description: 'Your resume has been received and queued for review.',
          },
          {
            status: 'interview',
            label: 'Interviews in motion',
            description: 'You are coordinating live conversations with hiring teams.',
          },
        ],
        recommendedActions: [
          {
            title: 'Follow up with Fintech Labs recruiter',
            severity: 'high',
            description: '48 hours since the last touchpoint. Send a progress recap.',
          },
          {
            title: 'Share portfolio deck with Horizon Ops',
            severity: 'medium',
            description: 'They requested examples ahead of the technical screen.',
          },
          {
            title: 'Celebrate offer won at Atlas Studios',
            severity: 'low',
            description: 'Update your network and sync onboarding checklist.',
          },
        ],
      },
    });

    mockUseCachedResource.mockReturnValue({
      data: dashboardData,
      error: null,
      loading: false,
      fromCache: false,
      lastUpdated: new Date().toISOString(),
      refresh: vi.fn(),
    });

    render(
      <MemoryRouter>
        <JobsPage />
      </MemoryRouter>,
    );

    await openApplicationsTab();

    expect(
      await screen.findByText('Stage distribution'),
    ).toBeInTheDocument();

    expect(screen.getByText('Total 1,500,000 records')).toBeInTheDocument();

    const appliedRow = screen.getByText('Submitted to employers').closest('li');
    expect(appliedRow).not.toBeNull();
    if (appliedRow) {
      expect(within(appliedRow).getByText('1,000,000')).toBeInTheDocument();
      const progress = appliedRow.querySelector('div.bg-accent');
      expect(progress?.getAttribute('style')).toContain('67%');
    }

    expect(screen.getByText('Interviews in motion')).toBeInTheDocument();
    expect(screen.getByText('Pipeline Only')).toBeInTheDocument();

    expect(screen.getByText('High priority')).toHaveClass('bg-rose-100', 'text-rose-700');
    expect(screen.getByText('Medium priority')).toHaveClass('bg-amber-100', 'text-amber-700');
    expect(screen.getByText('Low priority')).toHaveClass('bg-emerald-100', 'text-emerald-700');
  });
});
