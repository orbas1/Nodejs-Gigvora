import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Creation Studio mocks
const creationStudioWizardSpy = vi.fn();
const creationStudioListSpy = vi.fn();
vi.mock('../components/creationStudio/CreationStudioWizard.jsx', () => ({
  __esModule: true,
  default: (props) => {
    creationStudioWizardSpy(props);
    return (
      <div data-testid="creation-studio-wizard">
        <button type="button" onClick={() => props.onCreateDraft?.({ title: 'New asset' })}>
          create-draft
        </button>
        <button
          type="button"
          onClick={() => props.onSaveStep?.(props.activeItem?.id ?? null, 'details', { title: 'Asset' })}
        >
          save-step
        </button>
        <button type="button" onClick={() => props.onShare?.(props.activeItem?.id ?? null, { status: 'published' })}>
          share-asset
        </button>
        <button type="button" onClick={() => props.onArchiveItem?.(props.activeItem?.id ?? 'item-1')}>
          archive-item
        </button>
        <button type="button" onClick={() => props.onRefresh?.()}>refresh
        </button>
      </div>
    );
  },
}));

vi.mock('../components/creationStudio/CreationStudioItemList.jsx', () => ({
  __esModule: true,
  default: (props) => {
    creationStudioListSpy(props);
    return (
      <div data-testid="creation-studio-list">
        <button type="button" onClick={() => props.onSelectItem?.({ id: 'item-1' })}>
          select-item
        </button>
        <button type="button" onClick={() => props.onArchiveItem?.('item-1')}>list-archive</button>
        <button type="button" onClick={() => props.onCreateNew?.()}>create-new</button>
      </div>
    );
  },
}));

// Client Kanban mock
const kanbanSpy = vi.fn();
vi.mock('../components/agency/clientKanban/ClientKanbanBoard.jsx', () => ({
  __esModule: true,
  default: (props) => {
    kanbanSpy(props);
    return (
      <div data-testid="client-kanban">
        <button type="button" onClick={() => props.actions?.createColumn?.({ name: 'Discovery' })}>
          create-column
        </button>
      </div>
    );
  },
}));

// Gig workspace mocks
const gigContainerSpy = vi.fn();
const gigComposerSpy = vi.fn();
vi.mock('../components/projectGigManagement/ProjectGigManagementContainer.jsx', () => ({
  __esModule: true,
  default: (props) => {
    gigContainerSpy(props);
    return <div data-testid="gig-management" />;
  },
}));

vi.mock('../components/projectGigManagement/GigOrderComposer.jsx', () => ({
  __esModule: true,
  default: (props) => {
    gigComposerSpy(props);
    if (!props.open) {
      return null;
    }
    return (
      <div data-testid="gig-order-composer">
        <button type="button" onClick={() => props.onSubmit?.({ title: 'Website refresh' })}>
          submit-order
        </button>
        <button type="button" onClick={() => props.onClose?.()}>close-composer</button>
      </div>
    );
  },
}));

// Workforce dashboard mock
const workforceSpy = vi.fn();
vi.mock('../components/agency/workforce/AgencyWorkforceDashboard.jsx', () => ({
  __esModule: true,
  default: (props) => {
    workforceSpy(props);
    return (
      <div data-testid="workforce-dashboard">
        <button type="button" onClick={() => props.actions?.createMember?.({ name: 'Ada' })}>
          create-member
        </button>
      </div>
    );
  },
}));

// Wallet component mocks shared by payments + wallet sections
const walletSummarySpy = vi.fn();
const walletAccountsSpy = vi.fn();
const walletFundingSpy = vi.fn();
const walletPayoutsSpy = vi.fn();
const walletSettingsSpy = vi.fn();
const walletLedgerSpy = vi.fn();

vi.mock('../components/agency/wallet/WalletSummary.jsx', () => ({
  __esModule: true,
  default: (props) => {
    walletSummarySpy(props);
    return <div data-testid="wallet-summary" />;
  },
}));

vi.mock('../components/agency/wallet/WalletAccountsPanel.jsx', () => ({
  __esModule: true,
  default: (props) => {
    walletAccountsSpy(props);
    return (
      <div data-testid="wallet-accounts">
        <button type="button" onClick={() => props.onCreateAccount?.({ name: 'Ops' })}>
          create-account
        </button>
        <button type="button" onClick={() => props.onUpdateAccount?.('acc-1', { status: 'active' })}>
          update-account
        </button>
        <button type="button" onClick={() => props.onSelectAccount?.({ id: 'acc-1', name: 'Ops' })}>
          open-ledger
        </button>
      </div>
    );
  },
}));

vi.mock('../components/agency/wallet/WalletFundingSourcesPanel.jsx', () => ({
  __esModule: true,
  default: (props) => {
    walletFundingSpy(props);
    const createHandler = props.onCreateFundingSource ?? props.onCreate;
    const updateHandler = props.onUpdateFundingSource ?? props.onUpdate;
    return (
      <div data-testid="wallet-funding">
        <button type="button" onClick={() => createHandler?.({ name: 'Stripe' })}>
          create-funding
        </button>
        <button type="button" onClick={() => updateHandler?.('fs-1', { name: 'Stripe US' })}>
          update-funding
        </button>
      </div>
    );
  },
}));

vi.mock('../components/agency/wallet/WalletPayoutsPanel.jsx', () => ({
  __esModule: true,
  default: (props) => {
    walletPayoutsSpy(props);
    const createHandler = props.onCreatePayout ?? props.onCreate;
    const updateHandler = props.onUpdatePayout ?? props.onUpdate;
    return (
      <div data-testid="wallet-payouts">
        <button type="button" onClick={() => createHandler?.({ amount: 500 })}>
          create-payout
        </button>
        <button type="button" onClick={() => updateHandler?.('po-1', { status: 'approved' })}>
          update-payout
        </button>
      </div>
    );
  },
}));

vi.mock('../components/agency/wallet/WalletSettingsForm.jsx', () => ({
  __esModule: true,
  default: (props) => {
    walletSettingsSpy(props);
    const submitHandler = props.onSubmit ?? props.onSave;
    return (
      <div data-testid="wallet-settings">
        <button type="button" onClick={() => submitHandler?.({ autoPayouts: true })}>
          save-settings
        </button>
      </div>
    );
  },
}));

vi.mock('../components/agency/wallet/WalletLedgerDrawer.jsx', () => ({
  __esModule: true,
  default: (props) => {
    walletLedgerSpy(props);
    if (!props.open) {
      return null;
    }
    return (
      <div data-testid="wallet-ledger">
        <button type="button" onClick={() => props.onCreateEntry?.({ amount: 100 })}>
          create-ledger-entry
        </button>
        <button type="button" onClick={() => props.onClose?.()}>close-ledger</button>
      </div>
    );
  },
}));

// Job applications workspace mock
const jobWorkspaceSpy = vi.fn();
vi.mock('../components/jobApplications/JobApplicationWorkspaceContainer.jsx', () => ({
  __esModule: true,
  default: (props) => {
    jobWorkspaceSpy(props);
    return <div data-testid="job-applications-workspace" />;
  },
}));

// Additional UI stubs for smaller sections
const gigChatSpy = vi.fn();
vi.mock('../components/agency/gigChat/GigChatWorkspace.jsx', () => ({
  __esModule: true,
  default: (props) => {
    gigChatSpy(props);
    return <div data-testid="gig-chat-workspace" />;
  },
}));

const gigCreationSpy = vi.fn();
vi.mock('../components/projectGigManagement/GigCreationDashboard.jsx', () => ({
  __esModule: true,
  default: (props) => {
    gigCreationSpy(props);
    return (
      <div data-testid="gig-creation-dashboard">
        <button type="button" onClick={() => props.onCreateDraft?.({ title: 'Campaign' })}>
          create-gig-draft
        </button>
      </div>
    );
  },
}));

const gigManagementSpy = vi.fn();
vi.mock('../components/projectGigManagement/GigDeliveryBoard.jsx', () => ({
  __esModule: true,
  default: (props) => {
    gigManagementSpy(props);
    return <div data-testid="gig-delivery-board" />;
  },
}));

const gigSubmissionSpy = vi.fn();
vi.mock('../components/projectGigManagement/GigSubmissionReview.jsx', () => ({
  __esModule: true,
  default: (props) => {
    gigSubmissionSpy(props);
    return (
      <div data-testid="gig-submission-review">
        <button type="button" onClick={() => props.onApprove?.('submission-1')}>
          approve-submission
        </button>
      </div>
    );
  },
}));

const gigTimelineSpy = vi.fn();
vi.mock('../components/projectGigManagement/GigTimelineBoard.jsx', () => ({
  __esModule: true,
  default: (props) => {
    gigTimelineSpy(props);
    return <div data-testid="gig-timeline-board" />;
  },
}));

// Hooks and services mocks
vi.mock('../hooks/useAgencyCreationStudio.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../services/agencyClientKanban.js', () => ({
  __esModule: true,
  fetchAgencyClientKanban: vi.fn(),
  createKanbanColumn: vi.fn(),
  updateKanbanColumn: vi.fn(),
  deleteKanbanColumn: vi.fn(),
  createKanbanCard: vi.fn(),
  updateKanbanCard: vi.fn(),
  deleteKanbanCard: vi.fn(),
  moveKanbanCard: vi.fn(),
  createChecklistItem: vi.fn(),
  updateChecklistItem: vi.fn(),
  deleteChecklistItem: vi.fn(),
  createClientAccount: vi.fn(),
  updateClientAccount: vi.fn(),
}));

vi.mock('../hooks/useAgencyWorkforceDashboard.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../services/agencyWorkforce.js', () => ({
  __esModule: true,
  createWorkforceMember: vi.fn(),
  updateWorkforceMember: vi.fn(),
  deleteWorkforceMember: vi.fn(),
  createPayDelegation: vi.fn(),
  updatePayDelegation: vi.fn(),
  deletePayDelegation: vi.fn(),
  createProjectDelegation: vi.fn(),
  updateProjectDelegation: vi.fn(),
  deleteProjectDelegation: vi.fn(),
  createGigDelegation: vi.fn(),
  updateGigDelegation: vi.fn(),
  deleteGigDelegation: vi.fn(),
  recordCapacitySnapshot: vi.fn(),
  updateCapacitySnapshot: vi.fn(),
  deleteCapacitySnapshot: vi.fn(),
  createAvailabilityEntry: vi.fn(),
  updateAvailabilityEntry: vi.fn(),
  deleteAvailabilityEntry: vi.fn(),
}));

vi.mock('../hooks/useAgencyWalletManagement.js', () => ({
  __esModule: true,
  useAgencyWalletOverview: vi.fn(),
  useAgencyWalletAccounts: vi.fn(),
  useAgencyWalletFundingSources: vi.fn(),
  useAgencyWalletPayouts: vi.fn(),
  useAgencyWalletSettings: vi.fn(),
  useAgencyWalletLedger: vi.fn(),
}));

vi.mock('../services/agencyWallet.js', () => ({
  __esModule: true,
  createWalletAccount: vi.fn(),
  updateWalletAccount: vi.fn(),
  createWalletLedgerEntry: vi.fn(),
  createFundingSource: vi.fn(),
  updateFundingSource: vi.fn(),
  createPayoutRequest: vi.fn(),
  updatePayoutRequest: vi.fn(),
  updateWalletSettings: vi.fn(),
  invalidateWalletAccounts: vi.fn(),
  invalidateLedgerCache: vi.fn(),
  invalidateFundingSources: vi.fn(),
  invalidatePayoutRequests: vi.fn(),
  invalidateWalletSettings: vi.fn(),
  invalidateWalletOverview: vi.fn(),
}));

vi.mock('../hooks/useAgencyInboxWorkspace.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../hooks/useSession.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../utils/session.js', () => ({
  resolveActorId: vi.fn(() => 'user-1'),
}));

vi.mock('../services/messaging.js', () => ({
  __esModule: true,
  createThread: vi.fn(),
  sendMessage: vi.fn(),
  markThreadRead: vi.fn(),
  updateThreadState: vi.fn(),
  escalateThread: vi.fn(),
  assignSupport: vi.fn(),
}));

import {
  AGENCY_MENU_SECTIONS,
  AGENCY_AVAILABLE_DASHBOARDS,
  AGENCY_DASHBOARD_ALTERNATES,
} from '../pages/dashboards/agency/menuConfig.js';
import useAgencyCreationStudio from '../hooks/useAgencyCreationStudio.js';
import useAgencyWorkforceDashboard from '../hooks/useAgencyWorkforceDashboard.js';
import * as walletHooks from '../hooks/useAgencyWalletManagement.js';
import useAgencyInboxWorkspace from '../hooks/useAgencyInboxWorkspace.js';
import useSession from '../hooks/useSession.js';
import {
  fetchAgencyClientKanban,
  createKanbanColumn,
  updateKanbanColumn,
  deleteKanbanColumn,
  createKanbanCard,
  updateKanbanCard,
  deleteKanbanCard,
  moveKanbanCard,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  createClientAccount,
  updateClientAccount,
} from '../services/agencyClientKanban.js';
import {
  createWorkforceMember,
  updateWorkforceMember,
  deleteWorkforceMember,
  createPayDelegation,
  updatePayDelegation,
  deletePayDelegation,
  createProjectDelegation,
  updateProjectDelegation,
  deleteProjectDelegation,
  createGigDelegation,
  updateGigDelegation,
  deleteGigDelegation,
  recordCapacitySnapshot,
  updateCapacitySnapshot,
  deleteCapacitySnapshot,
  createAvailabilityEntry,
  updateAvailabilityEntry,
  deleteAvailabilityEntry,
} from '../services/agencyWorkforce.js';
import {
  createThread,
  sendMessage,
  markThreadRead,
  updateThreadState,
  escalateThread,
  assignSupport,
} from '../services/messaging.js';
import {
  createWalletAccount,
  updateWalletAccount,
  createWalletLedgerEntry,
  createFundingSource,
  updateFundingSource,
  createPayoutRequest,
  updatePayoutRequest,
  updateWalletSettings,
  invalidateWalletAccounts,
  invalidateLedgerCache,
  invalidateFundingSources,
  invalidatePayoutRequests,
  invalidateWalletSettings,
  invalidateWalletOverview,
} from '../services/agencyWallet.js';
import AgencyCreationStudioWizardSection from '../pages/dashboards/agency/sections/AgencyCreationStudioWizardSection.jsx';
import AgencyCrmLeadPipelineSection from '../pages/dashboards/agency/sections/AgencyCrmLeadPipelineSection.jsx';
import AgencyGigWorkspaceSection from '../pages/dashboards/agency/sections/AgencyGigWorkspaceSection.jsx';
import AgencyHrManagementSection from '../pages/dashboards/agency/sections/AgencyHrManagementSection.jsx';
import AgencyHubSection from '../pages/dashboards/agency/sections/AgencyHubSection.jsx';
import AgencyInboxSection from '../pages/dashboards/agency/sections/AgencyInboxSection.jsx';
import AgencyJobApplicationsSection from '../pages/dashboards/agency/sections/AgencyJobApplicationsSection.jsx';
import AgencyManagementSection from '../pages/dashboards/agency/sections/AgencyManagementSection.jsx';
import AgencyPaymentsManagementSection from '../pages/dashboards/agency/sections/AgencyPaymentsManagementSection.jsx';
import AgencyWalletSection from '../pages/dashboards/agency/sections/AgencyWalletSection.jsx';
import ClosedGigsSection from '../pages/dashboards/agency/sections/ClosedGigsSection.jsx';
import GigChatSection from '../pages/dashboards/agency/sections/GigChatSection.jsx';
import GigCreationSection from '../pages/dashboards/agency/sections/GigCreationSection.jsx';
import GigManagementSection from '../pages/dashboards/agency/sections/GigManagementSection.jsx';
import GigSubmissionsSection from '../pages/dashboards/agency/sections/GigSubmissionsSection.jsx';
import GigTimelineSection from '../pages/dashboards/agency/sections/GigTimelineSection.jsx';

function resolveWalletHooks(overrides = {}) {
  walletHooks.useAgencyWalletOverview.mockReturnValue({
    data: { balance: 125000, currency: 'USD' },
    loading: false,
    error: null,
    refresh: vi.fn().mockResolvedValue(),
    ...overrides.overview,
  });
  walletHooks.useAgencyWalletAccounts.mockReturnValue({
    data: { items: [{ id: 'acc-1', name: 'Ops', status: 'active' }], pagination: { total: 1 } },
    loading: false,
    error: null,
    refresh: vi.fn().mockResolvedValue(),
    ...overrides.accounts,
  });
  walletHooks.useAgencyWalletFundingSources.mockReturnValue({
    data: [{ id: 'fs-1', name: 'Stripe' }],
    loading: false,
    error: null,
    refresh: vi.fn().mockResolvedValue(),
    ...overrides.funding,
  });
  walletHooks.useAgencyWalletPayouts.mockReturnValue({
    data: [{ id: 'po-1', amount: 500, status: 'pending' }],
    loading: false,
    error: null,
    refresh: vi.fn().mockResolvedValue(),
    ...overrides.payouts,
  });
  walletHooks.useAgencyWalletSettings.mockReturnValue({
    data: { autoPayouts: false },
    loading: false,
    error: null,
    refresh: vi.fn().mockResolvedValue(),
    ...overrides.settings,
  });
  walletHooks.useAgencyWalletLedger.mockReturnValue({
    data: { items: [] },
    loading: false,
    error: null,
    refresh: vi.fn().mockResolvedValue(),
    ...overrides.ledger,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Agency dashboard menu config', () => {
  it('exposes consistent navigation groupings', () => {
    const coreIds = AGENCY_MENU_SECTIONS.find((group) => group.id === 'core').items.map((item) => item.id);
    expect(coreIds).toEqual(expect.arrayContaining(['overview', 'calendar', 'alliances', 'networking']));

    const trustIds = AGENCY_MENU_SECTIONS.find((group) => group.id === 'trust').items.map((item) => item.id);
    expect(trustIds).toContain('inbox');
    expect(AGENCY_AVAILABLE_DASHBOARDS.map((entry) => entry.id)).toContain('freelancer');
    expect(AGENCY_DASHBOARD_ALTERNATES).toHaveLength(4);
  });
});


describe('AgencyCreationStudioWizardSection', () => {
  it('normalises configuration and executes studio actions', async () => {
    const reload = vi.fn().mockResolvedValue();
    const actions = {
      create: vi.fn().mockResolvedValue({ id: 'item-1' }),
      update: vi.fn().mockResolvedValue({ id: 'item-1' }),
      share: vi.fn().mockResolvedValue({}),
      remove: vi.fn().mockResolvedValue(),
    };
    useAgencyCreationStudio.mockReturnValue({
      data: {
        summary: { drafts: 2 },
        config: {
          targetTypes: [{ value: 'cv', label: 'CV draft' }],
          autoShareChannels: ['email'],
        },
        metadata: { refreshedAt: '2024-01-01T00:00:00Z', fromCache: false },
      },
      items: [{ id: 'item-1', title: 'Pitch deck' }],
      loading: false,
      error: null,
      reload,
      actions,
    });

    const user = userEvent.setup();
    render(<AgencyCreationStudioWizardSection agencyProfileId="agency-42" />);

    expect(creationStudioWizardSpy).toHaveBeenCalled();
    const wizardProps = creationStudioWizardSpy.mock.calls.at(-1)[0];
    expect(wizardProps.catalog).toEqual([{ type: 'cv', label: 'CV draft', summary: null }]);
    expect(wizardProps.shareDestinations).toEqual([{ id: 'email', label: 'email' }]);

    await user.click(screen.getByText('save-step'));
    expect(actions.create).toHaveBeenCalledWith({ title: 'Asset', stepKey: 'details' });
    expect(reload).toHaveBeenCalled();

    await user.click(screen.getByText('select-item'));
    const nextWizardProps = creationStudioWizardSpy.mock.calls.at(-1)[0];
    expect(nextWizardProps.activeItem).toEqual(expect.objectContaining({ id: 'item-1' }));

    await user.click(screen.getByText('archive-item'));
    expect(actions.remove).toHaveBeenCalledWith('item-1');

    await user.click(screen.getByText('share-asset'));
    expect(actions.create).toHaveBeenLastCalledWith({ status: 'scheduled' });
  });
});

describe('AgencyCrmLeadPipelineSection', () => {
  it('loads pipeline metrics and runs kanban mutations with workspace context', async () => {
    const now = new Date('2024-03-18T10:00:00Z');
    fetchAgencyClientKanban.mockResolvedValue({
      columnSummary: [
        { id: 'col-1', active: 3, weightedValue: 12000 },
        { id: 'col-2', cards: [{ id: 'c' }], totalValue: 8000 },
      ],
      metrics: { activeOpportunities: 5, wonLast30Days: 2, averageCycleDays: 9 },
      currency: 'USD',
      metadata: { refreshedAt: now.toISOString() },
    });
    createKanbanColumn.mockResolvedValue({ id: 'col-new' });

    const user = userEvent.setup();
    render(<AgencyCrmLeadPipelineSection workspaceId="workspace-9" />);

    expect(await screen.findByText('Active opportunities')).toBeInTheDocument();
    expect(fetchAgencyClientKanban).toHaveBeenCalledWith({ workspaceId: 'workspace-9' });

    await user.click(screen.getByText('create-column'));
    expect(createKanbanColumn).toHaveBeenCalledWith({ name: 'Discovery', workspaceId: 'workspace-9' });

    expect(await screen.findByText('Stage created.')).toBeInTheDocument();
  });
});

describe('AgencyGigWorkspaceSection', () => {
  it('surfaces marketplace metrics and orchestrates new gig orders', async () => {
    const createGigOrder = vi.fn().mockResolvedValue({ id: 'order-9' });
    const resource = {
      data: {
        summary: { gigPackagesLive: 4, gigsInDelivery: 2, openGigValue: 15000, gigSatisfaction: 4.6, currency: 'USD' },
        purchasedGigs: { stats: { awaitingReview: 3, averageTurnaroundHours: 48 } },
        catalog: { active: 4 },
        autoMatch: { readyCount: 2 },
        board: { metrics: { atRisk: 1 } },
        summaryUpdatedAt: '2024-02-01T12:00:00Z',
        fromCache: false,
      },
      loading: false,
      error: null,
      reload: vi.fn(),
      actions: { createGigOrder },
    };
    const onRefresh = vi.fn();

    const user = userEvent.setup();
    render(<AgencyGigWorkspaceSection resource={resource} onRefresh={onRefresh} />);

    expect(screen.getByText('Live gig packages')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'New gig order' }));
    await user.click(screen.getByText('submit-order'));

    expect(createGigOrder).toHaveBeenCalledWith({ title: 'Website refresh' });
    expect(onRefresh).toHaveBeenCalled();
    expect(await screen.findByText('Gig order created and queued for delivery.')).toBeInTheDocument();
  });
});

describe('AgencyHrManagementSection', () => {
  it('applies workspace scope to workforce actions and surfaces status feedback', async () => {
    const refresh = vi.fn().mockResolvedValue();
    useAgencyWorkforceDashboard.mockReturnValue({
      data: { members: [] },
      loading: false,
      error: null,
      summaryCards: [],
      refresh,
    });
    createWorkforceMember.mockResolvedValue({ id: 'member-1' });

    const user = userEvent.setup();
    render(<AgencyHrManagementSection workspaceId={99} canEdit />);

    await user.click(screen.getByText('create-member'));

    expect(createWorkforceMember).toHaveBeenCalledWith({ name: 'Ada', workspaceId: 99 });
    expect(await screen.findByText('Team member added to roster.')).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
    expect(workforceSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: { canEdit: true },
      }),
    );
  });
});

describe('AgencyHubSection', () => {
  it('renders hub telemetry and refreshes on demand', async () => {
    const dashboard = {
      summary: {
        members: { active: 12 },
        projects: { active: 5 },
        gigs: { total: 6 },
        jobs: { total: 3 },
        paymentsDistribution: { totalValue: 250000 },
        financials: { currency: 'USD' },
        clients: { nps: 4.8 },
      },
      creationStudio: {
        summary: {
          drafts: 4,
          scheduled: 2,
          published: 9,
          upcomingLaunches: [
            { id: 'launch-1', title: 'Launch AI studio', scheduledAt: '2024-03-20T09:00:00Z' },
          ],
        },
      },
      marketplaceLeadership: {
        studio: { insights: ['Top 3 in creative automation'] },
      },
      talentLifecycle: {
        summary: { headline: 'Talent ready', placementVelocity: 14, favourites: 8 },
      },
      operations: { workspaceOrchestrator: { clientDashboards: [] } },
      agencyProfile: {
        tagline: 'Creators of record',
        sectorFocus: 'Fintech',
        region: 'EMEA',
        websiteUrl: 'https://example.com',
        promoVideoUrl: 'https://example.com/video',
      },
    };
    const onRefresh = vi.fn();

    render(
      <AgencyHubSection
        dashboard={dashboard}
        loading={false}
        error={null}
        lastUpdated="2024-03-18T08:00:00Z"
        fromCache={false}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByText('Profile, community, and talent HQ')).toBeInTheDocument();
    expect(screen.getByText('Active members')).toBeInTheDocument();
    expect(screen.getByText('Creation Studio pipeline')).toBeInTheDocument();
    expect(screen.getByText('Talent ready')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(onRefresh).toHaveBeenCalled();
  });
});

describe('AgencyInboxSection', () => {
  it('manages conversation operations, support, and automations', async () => {
    useSession.mockReturnValue({ session: { userId: 'user-1' } });
    const refresh = vi.fn().mockResolvedValue();
    const updatePreferences = vi.fn().mockResolvedValue();
    const saveAutomations = vi.fn().mockResolvedValue();
    const addRoutingRule = vi.fn().mockResolvedValue();
    const editRoutingRule = vi.fn().mockResolvedValue();
    const removeRoutingRule = vi.fn().mockResolvedValue();
    const addSavedReply = vi.fn().mockResolvedValue();
    const editSavedReply = vi.fn().mockResolvedValue();
    const removeSavedReply = vi.fn().mockResolvedValue();

    const workspace = {
      summary: {
        unreadThreads: 1,
        awaitingReply: 1,
        avgResponseMinutes: 45,
        assignmentsActive: 2,
        openSupportCases: 1,
        escalationsOpen: 0,
        sentimentScore: 4.4,
      },
      activeThreads: [
        {
          id: 'thread-1',
          subject: 'Client onboarding',
          lastMessageAt: '2024-03-18T09:30:00Z',
          lastMessagePreview: 'Can we align deliverables?',
          unread: true,
          state: 'active',
          priority: 'standard',
          participants: [{ participantId: 'client-1', name: 'Client Uno' }],
          channelType: 'direct',
        },
      ],
      savedReplies: [],
      routingRules: [],
      supportCases: [
        { id: 'case-1', subject: 'Escalation', priority: 'high', updatedAt: '2024-03-18T08:00:00Z', summary: 'Client at risk' },
      ],
      participantDirectory: [
        { id: 'agent-1', name: 'Agent One' },
        { id: 'agent-2', name: 'Agent Two' },
      ],
      preferences: {
        notificationsEmail: false,
        notificationsPush: true,
        autoResponderEnabled: true,
        autoResponderMessage: 'Out of office',
      },
      automations: {
        autoEscalateUrgent: false,
        shareDailyDigest: true,
        notifyTalent: false,
      },
      summaryUpdatedAt: '2024-03-18T08:00:00Z',
    };

    useAgencyInboxWorkspace.mockReturnValue({
      workspace,
      loading: false,
      error: null,
      fromCache: false,
      lastUpdated: '2024-03-18T08:05:00Z',
      refresh,
      updatePreferences,
      addSavedReply,
      editSavedReply,
      removeSavedReply,
      addRoutingRule,
      editRoutingRule,
      removeRoutingRule,
      saveAutomations,
    });

    createThread.mockResolvedValue({ id: 'thread-2' });
    sendMessage.mockResolvedValue({});
    markThreadRead.mockResolvedValue({});
    updateThreadState.mockResolvedValue({});
    escalateThread.mockResolvedValue({});
    assignSupport.mockResolvedValue({});

    const user = userEvent.setup();
    render(<AgencyInboxSection workspaceId="workspace-123" statusLabel="Inbox status" initialSummary={{ unreadThreads: 0 }} />);

    const threadButton = await screen.findByRole('button', { name: /client onboarding/i });
    await user.click(threadButton);

    await user.click(screen.getByRole('button', { name: 'Mark read' }));
    expect(markThreadRead).toHaveBeenCalledWith('thread-1', { userId: 'user-1' });

    await user.click(screen.getAllByRole('button', { name: 'Archive' })[0]);
    expect(updateThreadState).toHaveBeenCalledWith('thread-1', { userId: 'user-1', state: 'archived' });

    const composer = screen.getByPlaceholderText('Share an update, drop a saved reply, or coordinate next steps.');
    await user.type(composer, '  Hello team  ');
    await user.click(screen.getByRole('button', { name: 'Send reply' }));
    expect(sendMessage).toHaveBeenCalledWith('thread-1', { userId: 'user-1', body: 'Hello team' });
    expect(refresh).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Escalate' }));
    expect(escalateThread).toHaveBeenCalledWith('thread-1', { userId: 'user-1', reason: 'Client flagged risk', priority: 'high' });

    const assignSelect = screen
      .getAllByRole('combobox')
      .find((element) => Array.from(element.options ?? []).some((option) => option.textContent === 'Select teammate'));
    await user.selectOptions(assignSelect, 'agent-2');
    expect(assignSupport).toHaveBeenCalledWith('thread-1', { userId: 'user-1', agentId: 'agent-2', notifyAgent: true });

    await user.click(screen.getByRole('button', { name: 'Save preferences' }));
    expect(updatePreferences).toHaveBeenCalledWith({
      notificationsEmail: false,
      notificationsPush: true,
      autoResponderEnabled: true,
      autoResponderMessage: 'Out of office',
    });

    await user.click(screen.getByRole('button', { name: 'Update automations' }));
    expect(saveAutomations).toHaveBeenCalledWith({ autoEscalateUrgent: false, shareDailyDigest: true, notifyTalent: false });

    await user.click(screen.getByRole('button', { name: 'New thread' }));
    await user.type(screen.getByPlaceholderText('Subject'), ' Launch update ');
    await user.type(screen.getByPlaceholderText('Participant IDs (comma separated)'), 'agent-1, client-3');
    await user.type(screen.getByPlaceholderText('Kickoff message (optional)'), '  Kickoff soon ');
    await user.click(screen.getByRole('button', { name: 'Create thread' }));

    expect(createThread).toHaveBeenCalledWith({
      userId: 'user-1',
      subject: 'Launch update',
      channelType: 'direct',
      participantIds: ['agent-1', 'client-3'],
    });
    expect(sendMessage).toHaveBeenLastCalledWith('thread-2', { userId: 'user-1', body: 'Kickoff soon' });
    expect(refresh.mock.calls.length).toBeGreaterThanOrEqual(6);
  });
});

describe('AgencyJobApplicationsSection', () => {
  it('renders workspace container for assigned owner and fallback otherwise', () => {
    const { rerender } = render(<AgencyJobApplicationsSection ownerId={42} />);
    expect(jobWorkspaceSpy).toHaveBeenCalledWith(expect.objectContaining({ userId: 42 }));
    expect(screen.queryByText('Assign an agency owner to unlock the job application control centre.')).toBeNull();

    rerender(<AgencyJobApplicationsSection ownerId={null} />);
    expect(screen.getByText('Assign an agency owner to unlock the job application control centre.')).toBeInTheDocument();
  });
});

describe('AgencyManagementSection', () => {
  it('presents management metrics and contact dossier', async () => {
    const overview = {
      metrics: {
        activeClients: 7,
        clientGrowth: 14,
        liveProjects: 5,
        projectDeliveryRate: 96,
        totalTeamMembers: 24,
        utilisationPercent: 82,
        pipelineVelocityDays: 12,
      },
      agencyProfile: {
        teamSize: 24,
        timezone: 'GMT',
        location: 'London',
        website: 'https://agency.test',
        introVideoUrl: 'https://video.test',
      },
      owner: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
      links: { portfolio: 'https://portfolio.test' },
    };
    const onRefresh = vi.fn();

    render(<AgencyManagementSection overview={overview} workspace={{ timezone: 'GMT', location: 'London' }} onRefresh={onRefresh} />);

    expect(screen.getByText('Active clients')).toBeInTheDocument();
    expect(screen.getByText('Team size')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(onRefresh).toHaveBeenCalled();
  });
});

describe('AgencyPaymentsManagementSection', () => {
  it('executes wallet lifecycle operations with cache invalidation', async () => {
    resolveWalletHooks();
    createWalletAccount.mockResolvedValue({ id: 'acc-2' });
    updateWalletAccount.mockResolvedValue({});
    createWalletLedgerEntry.mockResolvedValue({});
    createFundingSource.mockResolvedValue({});
    updateFundingSource.mockResolvedValue({});
    createPayoutRequest.mockResolvedValue({});
    updatePayoutRequest.mockResolvedValue({});
    updateWalletSettings.mockResolvedValue({});

    const user = userEvent.setup();
    render(<AgencyPaymentsManagementSection workspaceId="agency-10" workspaceLabel="Agency 10" />);

    await user.click(screen.getByText('create-account'));
    expect(createWalletAccount).toHaveBeenCalledWith({ name: 'Ops', workspaceId: 'agency-10' });
    expect(invalidateWalletAccounts).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 'agency-10', pageSize: 10 }),
    );
    expect(await screen.findByText('Wallet account created.')).toBeInTheDocument();

    await user.click(screen.getByText('update-account'));
    expect(updateWalletAccount).toHaveBeenCalledWith('acc-1', { status: 'active', workspaceId: 'agency-10' });
    expect(await screen.findByText('Wallet account updated.')).toBeInTheDocument();

    await user.click(screen.getByText('open-ledger'));
    await user.click(screen.getByText('create-ledger-entry'));
    expect(createWalletLedgerEntry).toHaveBeenCalledWith('acc-1', { amount: 100 });
    expect(invalidateLedgerCache).toHaveBeenCalledWith('acc-1', {});

    await user.click(screen.getByText('create-funding'));
    await waitFor(() => expect(createFundingSource).toHaveBeenCalledWith({ name: 'Stripe', workspaceId: 'agency-10' }));
    expect(invalidateFundingSources).toHaveBeenCalledWith('agency-10');

    await user.click(screen.getByText('create-payout'));
    await waitFor(() => expect(createPayoutRequest).toHaveBeenCalledWith({ amount: 500, workspaceId: 'agency-10' }));
    expect(invalidatePayoutRequests).toHaveBeenCalledWith({ workspaceId: 'agency-10', status: undefined });

    await user.click(screen.getByText('save-settings'));
    await waitFor(() => expect(updateWalletSettings).toHaveBeenCalledWith({ autoPayouts: true }));
    expect(invalidateWalletSettings).toHaveBeenCalledWith('agency-10');
  });
});

describe('AgencyWalletSection', () => {
  it('keeps wallet data fresh across account, funding, payout, and ledger updates', async () => {
    resolveWalletHooks();
    createWalletAccount.mockResolvedValue({});
    updateWalletAccount.mockResolvedValue({});
    createFundingSource.mockResolvedValue({});
    updateFundingSource.mockResolvedValue({});
    createPayoutRequest.mockResolvedValue({});
    updatePayoutRequest.mockResolvedValue({});
    updateWalletSettings.mockResolvedValue({});
    createWalletLedgerEntry.mockResolvedValue({});

    const user = userEvent.setup();
    render(<AgencyWalletSection workspaceId="agency-20" statusLabel="Wallet status" />);

    await user.click(screen.getByText('create-account'));
    expect(createWalletAccount).toHaveBeenCalledWith({ name: 'Ops' });
    expect(invalidateWalletOverview).toHaveBeenCalledWith('agency-20');

    await user.click(screen.getByText('update-account'));
    expect(updateWalletAccount).toHaveBeenCalledWith('acc-1', { status: 'active' });

    await user.click(screen.getByText('open-ledger'));
    await user.click(screen.getByText('create-ledger-entry'));
    expect(createWalletLedgerEntry).toHaveBeenCalledWith('acc-1', { amount: 100 });

    await user.click(screen.getByText('create-funding'));
    await waitFor(() => expect(createFundingSource).toHaveBeenCalledWith({ name: 'Stripe' }));
    expect(invalidateFundingSources).toHaveBeenCalledWith('agency-20');

    await user.click(screen.getByText('update-funding'));
    await waitFor(() => expect(updateFundingSource).toHaveBeenCalledWith('fs-1', { name: 'Stripe US' }));

    await user.click(screen.getByText('create-payout'));
    await waitFor(() => expect(createPayoutRequest).toHaveBeenCalledWith({ amount: 500 }));
    expect(invalidatePayoutRequests).toHaveBeenCalledWith({ workspaceId: 'agency-20', status: undefined });

    await user.click(screen.getByText('update-payout'));
    await waitFor(() => expect(updatePayoutRequest).toHaveBeenCalledWith('po-1', { status: 'approved' }));

    await user.click(screen.getByText('save-settings'));
    await waitFor(() => expect(updateWalletSettings).toHaveBeenCalledWith({ autoPayouts: true }));
  });
});

describe('ClosedGigsSection', () => {
  it('summarises completed and cancelled gigs and supports reopening', async () => {
    const onReopen = vi.fn();
    render(
      <ClosedGigsSection
        orders={[
          { id: 1, serviceName: 'Brand sprint', vendorName: 'Studio A', status: 'completed', dueAt: '2024-03-01', amount: 2500, currency: 'USD', progressPercent: 100 },
          { id: 2, serviceName: 'Ads refresh', vendorName: 'Studio B', status: 'cancelled', dueAt: '2024-02-10', amount: 1800, currency: 'USD', progressPercent: 20 },
        ]}
        onReopen={onReopen}
      />,
    );

    expect(screen.getByText('Closed gigs')).toBeInTheDocument();
    expect(screen.getByText('Brand sprint')).toBeInTheDocument();
    expect(screen.getByText('Ads refresh')).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'Reopen' })[0]);
    expect(onReopen).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, serviceName: 'Brand sprint' }),
    );
  });
});

describe('GigChatSection', () => {
  it('sends gig chat messages and acknowledges updates', async () => {
    const onSendMessage = vi.fn().mockResolvedValue({});
    const onAcknowledgeMessage = vi.fn().mockResolvedValue({});
    render(
      <GigChatSection
        orderDetail={{
          id: 'order-1',
          serviceName: 'Brand sprint',
          messages: [
            { id: 'm-1', senderRole: 'client', sentAt: '2024-03-18T10:00:00Z', body: 'Ready to review?', visibility: 'client' },
          ],
        }}
        onSendMessage={onSendMessage}
        onAcknowledgeMessage={onAcknowledgeMessage}
      />,
    );

    await userEvent.type(screen.getByPlaceholderText('Share update'), 'Hi there');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSendMessage).toHaveBeenCalledWith({ body: 'Hi there', visibility: 'internal' });
    expect(await screen.findByText('Sent.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Mark read' }));
    expect(onAcknowledgeMessage).toHaveBeenCalledWith('m-1');
  });
});

describe('GigCreationSection', () => {
  it('validates basics and submits gig drafts with default packages', async () => {
    const onCreate = vi.fn().mockResolvedValue({ id: 'gig-1' });
    const onCreated = vi.fn();
    const user = userEvent.setup();
    render(<GigCreationSection onCreate={onCreate} onCreated={onCreated} defaultCurrency="USD" />);

    await user.type(screen.getByPlaceholderText('Acme Studio'), 'Aurora Collective');
    await user.type(screen.getByPlaceholderText('Launch operations'), 'Growth accelerator');
    const amountInput = screen.getByPlaceholderText('4500');
    await user.clear(amountInput);
    await user.type(amountInput, '3000');
    await user.type(screen.getByLabelText('Kickoff'), '2024-03-20');
    await user.type(screen.getByLabelText('Delivery date'), '2024-03-25');

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await user.click(screen.getByRole('button', { name: 'Create gig' }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        vendorName: 'Aurora Collective',
        serviceName: 'Growth accelerator',
        amount: 3000,
        currency: 'USD',
        classes: expect.arrayContaining([expect.objectContaining({ name: 'Starter' })]),
      }),
    );
    expect(onCreated).toHaveBeenCalled();
    expect(await screen.findByText('Gig created.')).toBeInTheDocument();
  });
});

describe('GigManagementSection', () => {
  it('filters gig orders and opens detail views', async () => {
    const onSelectOrder = vi.fn();
    const onRefresh = vi.fn();
    const orders = [
      {
        id: 'order-1',
        serviceName: 'Brand sprint',
        vendorName: 'Studio A',
        status: 'in_delivery',
        dueAt: '2024-03-30',
        amount: 4500,
        currency: 'USD',
        orderNumber: 'G-001',
        progressPercent: 60,
        tags: ['priority'],
        classes: ['Starter', 'Growth'],
      },
      {
        id: 'order-2',
        serviceName: 'Ads refresh',
        vendorName: 'Studio B',
        status: 'completed',
        dueAt: '2024-03-10',
        amount: 3200,
        currency: 'USD',
        orderNumber: 'G-002',
        progressPercent: 100,
        tags: [],
        classes: ['Starter'],
      },
    ];
    render(
      <GigManagementSection
        summary={{ managedGigs: 12, activeOrders: 4, onTimeRate: 96, averageDeliveryDays: 12, breaches: 1 }}
        orders={orders}
        onSelectOrder={onSelectOrder}
        onRefresh={onRefresh}
        detail={{ id: 'order-1', requirements: ['Brief'], submissions: [], timeline: [], classes: [], addons: [], tags: [] }}
        selectedOrderId="order-1"
      />,
    );

    expect(screen.getByText('Manage gigs')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Active' }));
    expect(screen.queryByText('Ads refresh')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByText('Ads refresh')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('Search orders'), 'Studio B');
    expect(screen.getByText('Ads refresh')).toBeInTheDocument();
    expect(screen.queryByText('Brand sprint')).toBeNull();

    await userEvent.click(screen.getByText('Clear'));
    expect(screen.getByText('Brand sprint')).toBeInTheDocument();

    const brandCardRoot = screen.getByText('Brand sprint').closest('div')?.parentElement?.parentElement?.parentElement;
    await userEvent.click(within(brandCardRoot).getByRole('button', { name: 'Open' }));
    expect(onSelectOrder).toHaveBeenCalledWith('order-1');
  });
});

describe('GigSubmissionsSection', () => {
  it('records submissions and updates statuses', async () => {
    const onCreateSubmission = vi.fn().mockResolvedValue({});
    const onUpdateSubmission = vi.fn().mockResolvedValue({});
    render(
      <GigSubmissionsSection
        orderDetail={{
          serviceName: 'Brand sprint',
          submissions: [
            { id: 'sub-1', title: 'First draft', status: 'submitted', description: 'Initial deck', submittedAt: '2024-03-10' },
          ],
        }}
        onCreateSubmission={onCreateSubmission}
        onUpdateSubmission={onUpdateSubmission}
      />,
    );

    await userEvent.selectOptions(screen.getAllByRole('combobox')[0], 'approved');
    expect(onUpdateSubmission).toHaveBeenCalledWith('sub-1', { status: 'approved' });

    await userEvent.type(screen.getByPlaceholderText('Sprint demo deck'), 'Sprint summary');
    await userEvent.type(screen.getByPlaceholderText('Highlights or review notes'), 'Highlights shared');
    await userEvent.type(screen.getByPlaceholderText('https://...'), 'https://asset.example.com');
    await userEvent.selectOptions(screen.getAllByRole('combobox')[1], 'approved');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onCreateSubmission).toHaveBeenCalledWith({
      title: 'Sprint summary',
      description: 'Highlights shared',
      assetUrl: 'https://asset.example.com',
      status: 'approved',
    });
    expect(await screen.findByText('Logged.')).toBeInTheDocument();
  });
});

describe('GigTimelineSection', () => {
  it('logs timeline events with metadata', async () => {
    const onAddEvent = vi.fn().mockResolvedValue({});
    render(
      <GigTimelineSection
        orderDetail={{
          serviceName: 'Brand sprint',
          timeline: [{ id: 'event-1', eventType: 'kickoff', title: 'Kickoff', occurredAt: '2024-03-01T09:00:00Z' }],
        }}
        onAddEvent={onAddEvent}
      />,
    );

    await userEvent.selectOptions(screen.getAllByRole('combobox')[0], 'milestone');
    await userEvent.selectOptions(screen.getAllByRole('combobox')[1], 'client');
    await userEvent.type(screen.getByPlaceholderText('Kickoff call'), 'Client review');
    await userEvent.type(screen.getByLabelText('When'), '2024-03-21T10:00');
    await userEvent.type(screen.getByPlaceholderText('Next steps'), 'Share highlights');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(onAddEvent).toHaveBeenCalledWith({
      eventType: 'milestone',
      title: 'Client review',
      summary: 'Share highlights',
      occurredAt: '2024-03-21T10:00',
      visibility: 'client',
    });
    expect(await screen.findByText('Logged.')).toBeInTheDocument();
  });
});
