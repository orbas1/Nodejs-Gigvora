import { act, render } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';

const quickCreateFabSpy = vi.fn();
let latestQuickFabProps = null;

vi.mock('../../../layouts/DashboardLayout.jsx', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock('../../../components/security/DashboardAccessGuard.jsx', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>,
}));

vi.mock('../../../components/navigation/QuickCreateFab.jsx', () => ({
  __esModule: true,
  default: (props) => {
    latestQuickFabProps = props;
    quickCreateFabSpy(props);
    return <div data-testid="quick-create-fab" />;
  },
}));

const sessionHookMock = vi.fn();

vi.mock('../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: () => sessionHookMock(),
}));

const overviewResourceMock = vi.fn();

vi.mock('../../../hooks/useDashboardOverviewResource.js', () => ({
  __esModule: true,
  default: (...args) => overviewResourceMock(...args),
}));

const useCachedResourceMock = vi.fn();

vi.mock('../../../hooks/useCachedResource.js', () => ({
  __esModule: true,
  default: (key, fetcher, options) => useCachedResourceMock(key, fetcher, options),
}));

const profileOverviewMock = vi.fn();

vi.mock('../../../hooks/useFreelancerProfileOverview.js', () => ({
  __esModule: true,
  default: (...args) => profileOverviewMock(...args),
}));

const operationsHqMock = vi.fn();

vi.mock('../../../hooks/useFreelancerOperationsHQ.js', () => ({
  __esModule: true,
  default: (...args) => operationsHqMock(...args),
}));

const projectManagementMock = vi.fn();

vi.mock('../../../hooks/useProjectGigManagement.js', () => ({
  __esModule: true,
  default: (...args) => projectManagementMock(...args),
}));

vi.mock('../../../features/identityVerification/index.js', () => ({
  __esModule: true,
  IdentityVerificationSection: () => <div data-testid="identity-section" />,
}));

const fetchFreelancerDashboardOverviewMock = vi.fn();
const saveFreelancerDashboardOverviewMock = vi.fn();

vi.mock('../../../services/freelancerDashboard.js', () => ({
  __esModule: true,
  fetchFreelancerDashboardOverview: (...args) => fetchFreelancerDashboardOverviewMock(...args),
  saveFreelancerDashboardOverview: (...args) => saveFreelancerDashboardOverviewMock(...args),
}));

const fetchUserQuickActionsMock = vi.fn();

vi.mock('../../../services/userQuickActions.js', () => ({
  __esModule: true,
  fetchUserQuickActions: (...args) => fetchUserQuickActionsMock(...args),
}));

const resolveActorIdMock = vi.fn();

vi.mock('../../../utils/session.js', () => ({
  __esModule: true,
  resolveActorId: (...args) => resolveActorIdMock(...args),
}));

const trackDashboardEventMock = vi.fn();

vi.mock('../../../utils/analytics.js', () => ({
  __esModule: true,
  trackDashboardEvent: (...args) => trackDashboardEventMock(...args),
}));

const buildFreelancerInsightCardsMock = vi.fn();
const computeFreelancerHealthBannerMock = vi.fn();
const resolveFreelancerIdFromSessionMock = vi.fn();

vi.mock('../../../utils/dashboard/freelancer.js', () => ({
  __esModule: true,
  buildFreelancerInsightCards: (...args) => buildFreelancerInsightCardsMock(...args),
  computeFreelancerHealthBanner: (...args) => computeFreelancerHealthBannerMock(...args),
  resolveFreelancerIdFromSession: (...args) => resolveFreelancerIdFromSessionMock(...args),
}));

vi.mock('../freelancer/sections/OverviewSection.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="overview-section" />,
}));

vi.mock('../freelancer/sections/ProfileOverviewSection.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="profile-overview-section" />,
}));

vi.mock('../freelancer/sections/PlanningSection.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="planning-section" />,
}));

vi.mock('../freelancer/sections/project-management/ProjectManagementSection.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="project-management-section" />,
}));

vi.mock('../freelancer/sections/GigMarketplaceOperationsSection.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="gig-operations-section" />,
}));

vi.mock('../freelancer/sections/EscrowManagementSection.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="escrow-section" />,
}));

vi.mock('../freelancer/sections/InboxSection.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="inbox-section" />,
}));

vi.mock('../freelancer/sections/SupportSection.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="support-section" />,
}));

vi.mock('../../../components/freelancer/FreelancerWalletSection.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="wallet-section" />,
}));

let FreelancerDashboardPage;

beforeEach(async () => {
  latestQuickFabProps = null;
  quickCreateFabSpy.mockClear();
  trackDashboardEventMock.mockClear();
  useCachedResourceMock.mockReset();
  overviewResourceMock.mockReset();
  profileOverviewMock.mockReset();
  operationsHqMock.mockReset();
  projectManagementMock.mockReset();
  sessionHookMock.mockReset();
  resolveActorIdMock.mockReset();
  fetchUserQuickActionsMock.mockReset();
  buildFreelancerInsightCardsMock.mockReset();
  computeFreelancerHealthBannerMock.mockReset();
  resolveFreelancerIdFromSessionMock.mockReset();
  fetchFreelancerDashboardOverviewMock.mockReset();
  saveFreelancerDashboardOverviewMock.mockReset();

  const module = await import('../FreelancerDashboardPage.jsx');
  FreelancerDashboardPage = module.default;
});

describe('FreelancerDashboardPage quick actions integration', () => {
  function setupQuickActions({ fromCache = false, loading = false } = {}) {
    const quickActionsPayload = {
      recommendedActionId: 'launch-gig',
      generatedAt: '2024-05-01T12:00:00.000Z',
      actions: [
        {
          id: 'launch-gig',
          label: 'Launch a gig',
          description: 'Craft an elite gig brief.',
          icon: 'briefcase',
          tone: 'violet',
          href: '/gigs/create',
          badge: 'Prime',
          recommended: false,
        },
        {
          id: 'open-support',
          label: 'Open support desk',
          description: 'Resolve 3 active cases awaiting you.',
          icon: 'lifebuoy',
          tone: 'slate',
          href: '/dashboards/freelancer#support',
          badge: '3 active',
          recommended: true,
        },
      ],
    };

    const refreshQuickActionsMock = vi.fn();
    let quickActionsFetcher;

    sessionHookMock.mockReturnValue({
      session: { id: 77, actorId: 11, freelancerId: 77 },
    });

    resolveActorIdMock.mockImplementation((session) => session?.actorId ?? null);
    resolveFreelancerIdFromSessionMock.mockImplementation((session) => session?.freelancerId ?? null);

    overviewResourceMock.mockReturnValue({
      data: { overview: { currency: 'USD' } },
      loading: false,
      error: null,
      refresh: vi.fn(),
    });

    profileOverviewMock.mockReturnValue({
      overview: null,
      loading: false,
      saving: false,
      avatarUploading: false,
      connectionSaving: false,
      error: null,
      refresh: vi.fn(),
      saveProfile: vi.fn(),
      uploadAvatar: vi.fn(),
      createConnection: vi.fn(),
      updateConnection: vi.fn(),
      deleteConnection: vi.fn(),
    });

    operationsHqMock.mockReturnValue({ metrics: {} });
    projectManagementMock.mockReturnValue({ data: { projectLifecycle: { stats: {} } } });
    buildFreelancerInsightCardsMock.mockReturnValue([]);
    computeFreelancerHealthBannerMock.mockReturnValue(null);

    fetchUserQuickActionsMock.mockResolvedValue({ data: quickActionsPayload });

    useCachedResourceMock.mockImplementation((key, fetcher, options) => {
      if (String(key).includes('quick-actions')) {
        quickActionsFetcher = fetcher;
        return {
          data: quickActionsPayload,
          loading,
          error: null,
          refresh: refreshQuickActionsMock,
          fromCache,
        };
      }

      return {
        data: null,
        loading: false,
        error: null,
        refresh: vi.fn(),
        fromCache: false,
      };
    });

    return { quickActionsPayload, refreshQuickActionsMock, getFetcher: () => quickActionsFetcher };
  }

  it('maps personalised quick actions and wires analytics + refresh flows', async () => {
    const { refreshQuickActionsMock } = setupQuickActions();

    await act(async () => {
      render(<FreelancerDashboardPage />);
    });

    expect(quickCreateFabSpy).toHaveBeenCalled();
    expect(latestQuickFabProps).toBeTruthy();
    expect(latestQuickFabProps.defaultActionId).toBe('launch-gig');
    expect(latestQuickFabProps.actions).toEqual([
      expect.objectContaining({
        id: 'launch-gig',
        label: 'Launch a gig',
        description: 'Craft an elite gig brief.',
        icon: 'briefcase',
        tone: 'violet',
        badge: 'Prime',
        recommended: false,
      }),
      expect.objectContaining({
        id: 'open-support',
        label: 'Open support desk',
        description: 'Resolve 3 active cases awaiting you.',
        icon: 'lifebuoy',
        tone: 'slate',
        badge: '3 active',
        recommended: true,
      }),
    ]);

    trackDashboardEventMock.mockClear();
    refreshQuickActionsMock.mockClear();

    const recommendedAction = latestQuickFabProps.actions.find((action) => action.id === 'launch-gig');
    latestQuickFabProps.onAction?.(recommendedAction);

    expect(trackDashboardEventMock).toHaveBeenCalledWith(
      'freelancer.dashboard.quick-action.select',
      expect.objectContaining({
        freelancerId: 77,
        actionId: 'launch-gig',
        recommended: true,
        fromCache: false,
      }),
    );

    trackDashboardEventMock.mockClear();
    latestQuickFabProps.onOpenChange?.(true);

    expect(trackDashboardEventMock).toHaveBeenCalledWith(
      'freelancer.dashboard.quick-action.toggle',
      expect.objectContaining({ freelancerId: 77, open: true, cached: false }),
    );
    expect(refreshQuickActionsMock).toHaveBeenCalledWith({ force: false });
  });

  it('requests refreshed quick actions with the fresh flag when forced', async () => {
    const { getFetcher } = setupQuickActions();

    await act(async () => {
      render(<FreelancerDashboardPage />);
    });

    const fetcher = getFetcher();
    expect(fetcher).toBeInstanceOf(Function);

    await fetcher({ signal: 'controller', force: true });

    expect(fetchUserQuickActionsMock).toHaveBeenCalledWith(77, {
      signal: 'controller',
      fresh: true,
    });
  });
});
