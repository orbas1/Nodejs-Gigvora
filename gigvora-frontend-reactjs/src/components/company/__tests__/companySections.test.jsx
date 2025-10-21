import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompanyDashboardOverviewSection from '../CompanyDashboardOverviewSection.jsx';
import CompanyOperationalControlPanel from '../CompanyOperationalControlPanel.jsx';
import CompanyPagesManagementSection from '../CompanyPagesManagementSection.jsx';

const updateCompanyDashboardOverviewMock = vi.hoisted(() => vi.fn());

vi.mock('../../../services/company.js', () => ({
  updateCompanyDashboardOverview: updateCompanyDashboardOverviewMock,
  default: {
    updateCompanyDashboardOverview: updateCompanyDashboardOverviewMock,
  },
}));

vi.mock('../overview/OverviewSnapshot.jsx', () => ({
  default: ({ name, greeting, onEdit, onWeatherClick }) => (
    <div>
      <span>Snapshot for {name}</span>
      <button type="button" onClick={onEdit}>
        Open drawer
      </button>
      <button type="button" onClick={onWeatherClick}>
        View stat
      </button>
      <p>{greeting}</p>
    </div>
  ),
}));

vi.mock('../overview/OverviewStats.jsx', () => ({
  default: ({ onSelect, cards }) => (
    <div>
      <p>Stats count: {cards.length}</p>
      <button type="button" onClick={() => onSelect(cards[0])}>
        Select stat
      </button>
    </div>
  ),
}));

vi.mock('../overview/OverviewSettingsDrawer.jsx', () => ({
  default: ({ open, onSubmit }) =>
    open ? (
      <form onSubmit={(event) => { event.preventDefault(); onSubmit(event); }}>
        <button type="submit">Submit settings</button>
      </form>
    ) : null,
}));

vi.mock('../overview/OverviewStatModal.jsx', () => ({
  default: ({ open, stat, onClose }) =>
    open ? (
      <div>
        <p>Stat modal {stat?.label}</p>
        <button type="button" onClick={onClose}>
          Close stat
        </button>
      </div>
    ) : null,
}));

vi.mock('../../../hooks/useCompanyWallets.js', () => ({ default: vi.fn() }));
vi.mock('../../../hooks/useCompanyWalletDetail.js', () => ({ default: vi.fn() }));
vi.mock('../../../hooks/useCompanyJobOperations.js', () => ({ default: vi.fn() }));

vi.mock('../wallet/WalletListPanel.jsx', () => ({
  default: ({ onSelect }) => (
    <div>
      <p>Wallet list</p>
      <button type="button" onClick={() => onSelect({ id: 'wallet-1' })}>
        Select wallet
      </button>
    </div>
  ),
}));

vi.mock('../wallet/CompanyWalletDetailPanel.jsx', () => ({
  default: ({ wallet }) => <div>{wallet ? `Wallet detail ${wallet.id}` : 'No wallet selected'}</div>,
}));

vi.mock('../dashboard/DashboardCalendarPanel.jsx', () => ({ default: () => <div>Calendar panel</div> }));
vi.mock('../dashboard/DashboardSupportPanel.jsx', () => ({ default: () => <div>Support panel</div> }));
vi.mock('../dashboard/DashboardInboxPanel.jsx', () => ({ default: () => <div>Inbox panel</div> }));
vi.mock('../jobManagement/JobAdvertList.jsx', () => ({ default: () => <div>Job advert list</div> }));
vi.mock('../jobManagement/JobAdvertForm.jsx', () => ({ default: () => <div>Job advert form</div> }));
vi.mock('../jobManagement/CandidateList.jsx', () => ({ default: () => <div>Candidate list</div> }));
vi.mock('../jobManagement/CandidateResponsesPanel.jsx', () => ({ default: () => <div>Candidate responses</div> }));
vi.mock('../jobManagement/CandidateNotesPanel.jsx', () => ({ default: () => <div>Candidate notes</div> }));
vi.mock('../jobManagement/InterviewManager.jsx', () => ({ default: () => <div>Interview manager</div> }));
vi.mock('../jobManagement/ApplicantKanbanBoard.jsx', () => ({ default: () => <div>Applicant kanban</div> }));
vi.mock('../jobManagement/KeywordMatcher.jsx', () => ({ default: () => <div>Keyword matcher</div> }));
vi.mock('../jobManagement/JobHistoryTimeline.jsx', () => ({ default: () => <div>Job history timeline</div> }));
vi.mock('../UserAvatar.jsx', () => ({ default: ({ name }) => <span>Avatar {name}</span> }));

vi.mock('../../../services/companyWallets.js', () => ({
  createCompanyWallet: vi.fn(),
  updateCompanyWallet: vi.fn(),
  createWalletTransaction: vi.fn(),
  createWalletFundingSource: vi.fn(),
  updateWalletFundingSource: vi.fn(),
  createWalletPayoutMethod: vi.fn(),
  updateWalletPayoutMethod: vi.fn(),
  createWalletSpendingPolicy: vi.fn(),
  updateWalletSpendingPolicy: vi.fn(),
  retireWalletSpendingPolicy: vi.fn(),
  addWalletMember: vi.fn(),
  updateWalletMember: vi.fn(),
  removeWalletMember: vi.fn(),
}));

vi.mock('../../../services/companyJobOperations.js', () => ({
  createJobAdvert: vi.fn(),
  updateJobAdvert: vi.fn(),
  updateJobKeywords: vi.fn(),
  createJobApplication: vi.fn(),
  updateJobApplication: vi.fn(),
  scheduleInterview: vi.fn(),
  updateInterview: vi.fn(),
  recordCandidateResponse: vi.fn(),
  addCandidateNote: vi.fn(),
  createJobFavorite: vi.fn(),
}));

vi.mock('../pages/CompanyPageQuickCreateCard.jsx', () => ({
  default: ({ onCreate }) => (
    <button type="button" onClick={() => onCreate({ title: 'New page' })}>
      Quick create
    </button>
  ),
}));

vi.mock('../pages/CompanyPageList.jsx', () => ({
  default: ({ pages, onSelect }) => (
    <div>
      <p>Pages listed: {pages.length}</p>
      {pages.map((page) => (
        <button key={page.id} type="button" onClick={() => onSelect(page)}>
          Open {page.title}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../pages/CompanyPageEditorDrawer.jsx', () => ({
  default: ({ open, page, onClose, onSaveBasics }) =>
    open ? (
      <div>
        <p>Editing {page?.title}</p>
        <button type="button" onClick={() => onSaveBasics({ title: 'Updated title' })}>
          Save basics
        </button>
        <button type="button" onClick={onClose}>
          Close editor
        </button>
      </div>
    ) : null,
}));

vi.mock('../../../hooks/useCompanyPagesManagement.js', () => ({ default: vi.fn() }));

import companyService from '../../../services/company.js';
import useCompanyWallets from '../../../hooks/useCompanyWallets.js';
import useCompanyWalletDetail from '../../../hooks/useCompanyWalletDetail.js';
import useCompanyJobOperations from '../../../hooks/useCompanyJobOperations.js';
import useCompanyPagesManagement from '../../../hooks/useCompanyPagesManagement.js';

describe('CompanyDashboardOverviewSection', () => {
  beforeEach(() => {
    updateCompanyDashboardOverviewMock.mockReset();
    updateCompanyDashboardOverviewMock.mockResolvedValue({});
  });

  it('submits overview updates through the service', async () => {
    const user = userEvent.setup();
    const refreshSpy = vi.fn();
    render(
      <CompanyDashboardOverviewSection
        overview={{
          displayName: 'Gigvora',
          summary: 'Empowering hiring teams.',
          avatarUrl: 'https://example.com/avatar.png',
          weather: { icon: 'sunny' },
          date: { formatted: 'May 20' },
          followerCount: 4200,
        }}
        profile={{ companyName: 'Gigvora HQ' }}
        workspace={{ id: 'workspace-1', name: 'HQ workspace' }}
        onOverviewUpdated={refreshSpy}
      />,
    );

    await act(async () => {
      await user.click(screen.getByText(/Open drawer/));
    });
    await act(async () => {
      await user.click(screen.getByText(/Submit settings/));
    });

    await waitFor(() => {
      expect(companyService.updateCompanyDashboardOverview).toHaveBeenCalled();
    });
    expect(refreshSpy).toHaveBeenCalled();
  });
});

describe('CompanyOperationalControlPanel', () => {
  beforeEach(() => {
    useCompanyWallets.mockReturnValue({
      walletList: [{ id: 'wallet-1', name: 'Primary' }],
      status: 'ready',
      refresh: vi.fn(),
      summaryCards: [
        { label: 'Cash', value: '$120k', helper: 'Main account' },
      ],
    });
    useCompanyWalletDetail.mockReturnValue({
      wallet: null,
      loadWallet: vi.fn(),
      reset: vi.fn(),
      status: 'idle',
    });
    useCompanyJobOperations.mockReturnValue({
      jobAdverts: [],
      candidates: [],
      boards: [],
      summaryCards: [
        { label: 'Active jobs', value: 4, helper: 'Hiring now' },
      ],
      refresh: vi.fn(),
    });
  });

  it('renders control panel tabs and allows switching sections', async () => {
    const user = userEvent.setup();
    render(<CompanyOperationalControlPanel />);

    expect(screen.getByText(/Home/)).toBeInTheDocument();
    expect(screen.getByText(/Wallet & treasury/)).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Wallet & treasury/i }));
    });
    expect(screen.getByText(/Wallet list/)).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Job process/i }));
    });
    expect(screen.getByText(/Job advert list/)).toBeInTheDocument();
  });
});

describe('CompanyPagesManagementSection', () => {
  beforeEach(() => {
    useCompanyPagesManagement.mockReturnValue({
      data: { workspaceName: 'HQ' },
      pages: [{ id: 'page-1', title: 'Careers page' }],
      stats: { metrics: { live: 2, totalFollowers: 5600, averageConversionRate: 3.4 } },
      governance: {},
      blueprints: [],
      sectionLibrary: [],
      collaboratorRoles: [],
      visibilityOptions: [],
      statusOptions: [],
      loading: false,
      error: null,
      refresh: vi.fn(),
      createPage: vi.fn(),
      updatePage: vi.fn(),
      updateSections: vi.fn(),
      updateCollaborators: vi.fn(),
      publishPage: vi.fn(),
      archivePage: vi.fn(),
      deletePage: vi.fn(),
      loadPage: vi.fn().mockResolvedValue({ id: 'page-1', title: 'Careers page full' }),
    });
  });

  it('creates pages from quick create action and opens editor', async () => {
    const user = userEvent.setup();
    const hook = useCompanyPagesManagement();

    render(<CompanyPagesManagementSection workspaceId="workspace-1" />);

    expect(screen.getByText(/Live pages/)).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByText(/Quick create/));
    });
    await waitFor(() => {
      expect(hook.createPage).toHaveBeenCalledWith({ workspaceId: 'workspace-1', title: 'New page' });
    });

    await act(async () => {
      await user.click(screen.getByText(/Open Careers page/));
    });
    await waitFor(() => {
      expect(hook.loadPage).toHaveBeenCalledWith('page-1');
    });
    expect(screen.getByText(/Editing Careers page full/)).toBeInTheDocument();
  });
});
