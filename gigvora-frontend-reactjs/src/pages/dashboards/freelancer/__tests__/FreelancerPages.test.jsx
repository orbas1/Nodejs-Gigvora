import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

vi.mock('../../../../layouts/DashboardLayout.jsx', () => ({
  __esModule: true,
  default: ({ children, title, subtitle }) => (
    <div data-testid="dashboard-layout">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {children}
    </div>
  ),
}));

const sessionMock = vi.fn(() => ({ session: { id: 77, freelancerId: 77 } }));

vi.mock('../../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: () => sessionMock(),
}));

const cachedResourceMock = vi.fn();

vi.mock('../../../../hooks/useCachedResource.js', () => ({
  __esModule: true,
  default: (key, fetcher, options) => cachedResourceMock(key, fetcher, options),
}));

vi.mock('../../../../services/cvDocuments.js', () => ({
  __esModule: true,
  fetchCvWorkspace: vi.fn(),
}));

vi.mock('../../../../services/coverLetters.js', () => ({
  __esModule: true,
  fetchCoverLetterWorkspace: vi.fn(),
}));

vi.mock('../../../../components/documentStudio/CvCreationFlow.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="cv-creation-flow">CV Flow</div>,
}));

vi.mock('../../../../components/documentStudio/CoverLetterComposer.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="cover-letter-composer">Cover Letters</div>,
}));

vi.mock('../../../../components/documentStudio/StoryBlockWorkshop.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="story-block-workshop">Story Blocks</div>,
}));

const disputesHookMock = vi.fn();

vi.mock('../disputes/useDisputesData.js', () => ({
  __esModule: true,
  default: (freelancerId) => disputesHookMock(freelancerId),
}));

vi.mock('../disputes/components/DisputeBoard.jsx', () => ({
  __esModule: true,
  default: ({ onSelect }) => (
    <div data-testid="freelancer-dispute-board">
      <button type="button" onClick={() => onSelect?.('case-1')}>
        Open detail
      </button>
    </div>
  ),
}));

vi.mock('../disputes/components/DisputeDrawer.jsx', () => ({
  __esModule: true,
  default: ({ open, detail }) => (open ? <div data-testid="freelancer-dispute-drawer">{detail?.id}</div> : null),
}));

vi.mock('../disputes/components/DisputeWizard.jsx', () => ({
  __esModule: true,
  default: ({ open, onCreate }) =>
    open ? (
      <div data-testid="freelancer-dispute-wizard">
        <button type="button" onClick={() => onCreate?.({ title: 'New dispute' })}>
          Submit dispute
        </button>
      </div>
    ) : null,
}));

vi.mock('../disputes/components/TimelinePanel.jsx', () => ({
  __esModule: true,
  default: ({ events }) => <div data-testid="freelancer-dispute-timeline">{events.length} events</div>,
}));

vi.mock('../disputes/components/MetricsBar.jsx', () => ({
  __esModule: true,
  default: ({ summary }) => <div data-testid="freelancer-dispute-metrics">{summary?.openCases ?? 0}</div>,
}));

async function renderFreelancerRoute(initialEntry) {
  const { default: FreelancerDocumentsPage } = await import('../FreelancerDocumentsPage.jsx');
  const { default: FreelancerDisputesPage } = await import('../FreelancerDisputesPage.jsx');

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/dashboard/freelancer/documents" element={<FreelancerDocumentsPage />} />
        <Route path="/dashboard/freelancer/disputes" element={<FreelancerDisputesPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Freelancer documents page', () => {
  beforeEach(() => {
    cachedResourceMock.mockReset();
    cachedResourceMock.mockImplementation((key) => {
      if (key.includes('cv-workspace')) {
        return {
          data: {
            baseline: {
              id: 'cv-1',
              title: 'Product Designer CV',
              roleTag: 'Product',
              geographyTag: 'Remote',
              tags: ['Leadership', 'Growth'],
              latestVersion: { approvalStatus: 'approved', metrics: { aiCopyScore: 0.82 } },
              updatedAt: '2024-05-01T09:00:00Z',
            },
            summary: { totalDocuments: 3, totalVersions: 6, aiAssistedCount: 2, lastUpdatedAt: '2024-05-01T09:00:00Z' },
            variants: [],
            documents: [],
          },
        };
      }
      return {
        data: {
          summary: { totalTemplates: 4, totalStoryBlocks: 9, aiAssistedCount: 1, lastUpdatedAt: '2024-05-02T12:00:00Z' },
          templates: [{ id: 'tpl-1' }],
          storyBlocks: [{ id: 'story-1' }],
        },
      };
    });
  });

  it('displays computed document summary and baseline metadata', async () => {
    await act(async () => {
      await renderFreelancerRoute('/dashboard/freelancer/documents');
    });

    expect(screen.getByText(/career document mission control/i)).toBeInTheDocument();
    expect(screen.getByText(/product designer cv/i)).toBeInTheDocument();
    expect(screen.getByText(/leadership/i)).toBeInTheDocument();
    expect(screen.getByText(/approved/i)).toBeInTheDocument();
    expect(screen.getAllByText(/story blocks/i).length).toBeGreaterThan(0);
  });
});

describe('Freelancer disputes page', () => {
  let disputesState;

  beforeEach(() => {
    disputesState = {
      dashboard: {
        disputes: [
          { id: 'case-1', status: 'open', latestEvent: { id: 'evt-1', eventAt: '2024-05-01T08:00:00Z' } },
        ],
        summary: { openCases: 2 },
        filters: { stages: ['open', 'review'], statuses: ['open', 'closed'] },
        upcomingDeadlines: [],
        eligibleTransactions: [],
      },
      loading: false,
      refreshing: false,
      error: null,
      filters: { stage: 'all', status: 'all', includeClosed: false },
      setFilters: vi.fn(),
      reload: vi.fn().mockResolvedValue(undefined),
      selectedId: null,
      selectDispute: vi.fn().mockResolvedValue(undefined),
      clearSelection: vi.fn(),
      selectedDetail: { id: 'case-1', status: 'open' },
      detailLoading: false,
      detailError: null,
      openDispute: vi.fn().mockResolvedValue({ id: 'case-2' }),
      logEvent: vi.fn(),
      toast: { message: 'Saved dispute' },
      dismissToast: vi.fn(),
    };

    disputesHookMock.mockReset();
    disputesHookMock.mockImplementation(() => disputesState);
  });

  it('surfaces metrics, filters, and dispute interactions', async () => {
    await act(async () => {
      await renderFreelancerRoute('/dashboard/freelancer/disputes');
    });

    const user = userEvent.setup();

    expect(screen.getByRole('heading', { name: /^disputes$/i })).toBeInTheDocument();
    expect(screen.getByTestId('freelancer-dispute-metrics')).toHaveTextContent('2');

    const stageButton = screen.getAllByRole('button', { name: /^open$/i })[0];
    await user.click(stageButton);

    await user.click(screen.getByRole('button', { name: /open detail/i }));
    expect(disputesState.selectDispute).toHaveBeenCalledWith('case-1');

    await user.click(screen.getByRole('button', { name: /new dispute/i }));
    expect(screen.getByTestId('freelancer-dispute-wizard')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /submit dispute/i }));

    expect(screen.getByText(/saved dispute/i)).toBeInTheDocument();
  });
});
