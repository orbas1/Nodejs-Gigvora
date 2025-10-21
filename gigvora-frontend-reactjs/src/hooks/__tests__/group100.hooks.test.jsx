import { renderHook, act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createResourceState = (overrides = {}) => ({
  data: null,
  error: null,
  loading: false,
  fromCache: false,
  lastUpdated: new Date(),
  refresh: vi.fn(() => Promise.resolve({ data: overrides.data ?? null, fromCache: false })),
  ...overrides,
});

const mockUseCachedResource = vi.fn((cacheKey, fetcher, options) => {
  const stateFactory = mockUseCachedResource.nextReturn ?? (() => createResourceState());
  const state = stateFactory({ cacheKey, fetcher, options });
  state.cacheKey = cacheKey;
  state.fetcher = fetcher;
  state.options = options;
  return state;
});

mockUseCachedResource.nextReturn = null;

const setNextResourceState = (factory) => {
  mockUseCachedResource.nextReturn = factory;
};

vi.mock('../useCachedResource.js', () => {
  const wrapper = (...args) => {
    const result = mockUseCachedResource(...args);
    mockUseCachedResource.nextReturn = null;
    return result;
  };
  return {
    __esModule: true,
    default: wrapper,
    useCachedResource: wrapper,
  };
});

const mockFetchCompanySystemPreferences = vi.fn(async () => ({
  preferences: { timezone: 'UTC' },
  automation: { autoInvite: true },
  webhooks: [{ id: 'wh-1' }],
  apiTokens: [{ id: 'token-1' }],
  workspace: { id: 'ws-1' },
  metadata: { workspaceOptions: [{ id: 'ws-1', name: 'Primary' }] },
}));
vi.mock('../../services/companySystemPreferences.js', () => ({
  __esModule: true,
  fetchCompanySystemPreferences: mockFetchCompanySystemPreferences,
}));

const volunteeringMocks = {
  fetchVolunteeringDashboard: vi.fn(async () => ({
    posts: [{ id: 'post-1' }],
    summary: { openPositions: 1 },
    totals: { contracts: 1 },
    permissions: { canEdit: true },
    workspace: { id: 'ws-2' },
  })),
  createVolunteeringPost: vi.fn(async (payload) => ({ id: 'post-created', ...payload })),
  updateVolunteeringPost: vi.fn(async (id, payload) => ({ id, ...payload })),
  deleteVolunteeringPost: vi.fn(async () => true),
  createVolunteeringApplication: vi.fn(async () => ({ id: 'app-1' })),
  updateVolunteeringApplication: vi.fn(async () => ({ id: 'app-1' })),
  deleteVolunteeringApplication: vi.fn(async () => true),
  createVolunteeringResponse: vi.fn(async () => ({ id: 'resp-1' })),
  updateVolunteeringResponse: vi.fn(async () => ({ id: 'resp-1' })),
  deleteVolunteeringResponse: vi.fn(async () => true),
  createVolunteeringInterview: vi.fn(async () => ({ id: 'int-1' })),
  updateVolunteeringInterview: vi.fn(async () => ({ id: 'int-1' })),
  deleteVolunteeringInterview: vi.fn(async () => true),
  createVolunteeringContract: vi.fn(async () => ({ id: 'contract-1' })),
  updateVolunteeringContract: vi.fn(async () => ({ id: 'contract-1' })),
  addVolunteeringSpend: vi.fn(async () => ({ id: 'spend-1' })),
  updateVolunteeringSpend: vi.fn(async () => ({ id: 'spend-1' })),
  deleteVolunteeringSpend: vi.fn(async () => true),
};
vi.mock('../../services/companyVolunteering.js', () => ({
  __esModule: true,
  ...volunteeringMocks,
}));

const mockFetchCompanyWalletDetail = vi.fn(async () => ({ id: 'wallet-1', balance: 5000 }));
const mockFetchCompanyWallets = vi.fn(async () => ({ wallets: [{ id: 'wallet-1' }, { id: 'wallet-2' }] }));
vi.mock('../../services/companyWallets.js', () => ({
  __esModule: true,
  fetchCompanyWalletDetail: mockFetchCompanyWalletDetail,
  fetchCompanyWallets: mockFetchCompanyWallets,
}));

const mockFetchConnectionNetwork = vi.fn(async () => ({ userId: 'user-1', graph: [] }));
vi.mock('../../services/connections.js', () => ({
  __esModule: true,
  fetchConnectionNetwork: mockFetchConnectionNetwork,
}));

const mockFetchCompanyCreationStudioOverview = vi.fn(async () => ({
  templates: 12,
  automations: 3,
}));
vi.mock('../../services/creationStudio.js', () => ({
  __esModule: true,
  fetchCompanyCreationStudioOverview: mockFetchCompanyCreationStudioOverview,
}));

const mockUseIntegrationControlTower = vi.fn(() => ({
  connectors: [
    { id: 'crm-1', isManaged: true },
    { id: 'crm-2', isManaged: false },
  ],
  refresh: vi.fn(),
}));
vi.mock('../useIntegrationControlTower.js', () => ({
  __esModule: true,
  default: mockUseIntegrationControlTower,
}));

const trustMocks = {
  fetchDisputes: vi.fn(async () => ({ disputes: [{ id: 'd-1' }], summary: {}, pagination: {} })),
  fetchDispute: vi.fn(async () => ({ dispute: { id: 'd-1' } })),
  createDispute: vi.fn(async () => ({ id: 'd-2' })),
  updateDispute: vi.fn(async () => ({ id: 'd-1' })),
  appendDisputeEvent: vi.fn(async () => ({ id: 'evt-1' })),
  fetchDisputeSettings: vi.fn(async () => ({ autoEscalate: true })),
  updateDisputeSettings: vi.fn(async () => ({ autoEscalate: false })),
  fetchDisputeTemplates: vi.fn(async () => [{ id: 'tmpl-1' }]),
  createDisputeTemplate: vi.fn(async () => ({ id: 'tmpl-2' })),
  updateDisputeTemplate: vi.fn(async () => ({ id: 'tmpl-1' })),
  deleteDisputeTemplate: vi.fn(async () => true),
};
vi.mock('../../services/trust.js', () => ({
  __esModule: true,
  ...trustMocks,
}));

const mockFetchDomainGovernanceSummaries = vi.fn(async () => ({
  contexts: [{ id: 'context-1' }],
  generatedAt: '2024-05-01T10:00:00Z',
}));
vi.mock('../../services/domainGovernance.js', () => ({
  __esModule: true,
  fetchDomainGovernanceSummaries: mockFetchDomainGovernanceSummaries,
}));

const engagementMocks = {
  resolveUserInterests: vi.fn(() => ['launchpad']),
  generateConnectionSuggestions: vi.fn(() => [{ id: 'conn' }]),
  generateGroupSuggestions: vi.fn(() => [{ id: 'group' }]),
  generateLiveMoments: vi.fn(() => [{ id: 'moment' }]),
};
vi.mock('../../services/engagementService.js', () => ({
  __esModule: true,
  ...engagementMocks,
}));

const financeMocks = {
  buildFinanceOverviewCacheKey: vi.fn(() => 'finance:key'),
  fetchControlTowerOverview: vi.fn(async () => ({ totals: { volume: 1000 } })),
};
vi.mock('../../services/finance.js', () => ({
  __esModule: true,
  ...financeMocks,
}));

const calendarMocks = {
  fetchFreelancerCalendarEvents: vi.fn(async () => ({
    events: [
      {
        id: 'evt-1',
        title: 'Discovery call',
        startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
    ],
    metrics: { total: 1 },
  })),
  createFreelancerCalendarEvent: vi.fn(async () => ({
    id: 'evt-new',
    title: 'New event',
    startsAt: new Date().toISOString(),
  })),
  updateFreelancerCalendarEvent: vi.fn(async (_, __, payload) => ({
    id: payload?.id ?? 'evt-1',
    ...payload,
  })),
  deleteFreelancerCalendarEvent: vi.fn(async () => true),
};
vi.mock('../../services/freelancerCalendar.js', () => ({
  __esModule: true,
  ...calendarMocks,
}));

const escrowMocks = {
  fetchFreelancerEscrowOverview: vi.fn(async () => ({
    metrics: { totalAccounts: 1 },
    accounts: [{ id: 'acc-1' }],
  })),
  createFreelancerEscrowAccount: vi.fn(async () => ({ id: 'acc-2' })),
  updateFreelancerEscrowAccount: vi.fn(async () => ({ id: 'acc-1' })),
  createFreelancerEscrowTransaction: vi.fn(async () => ({ id: 'txn-1' })),
  releaseFreelancerEscrowTransaction: vi.fn(async () => ({ id: 'txn-1', status: 'released' })),
  refundFreelancerEscrowTransaction: vi.fn(async () => ({ id: 'txn-1', status: 'refunded' })),
  openFreelancerEscrowDispute: vi.fn(async () => ({ id: 'disp-1' })),
  appendFreelancerEscrowDisputeEvent: vi.fn(async () => ({ id: 'evt-2' })),
};
vi.mock('../../services/freelancerEscrow.js', () => ({
  __esModule: true,
  ...escrowMocks,
}));

const inboxMocks = {
  fetchInboxWorkspace: vi.fn(async () => ({
    userId: 'user-1',
    preferences: { timezone: 'Europe/London' },
    savedReplies: [],
  })),
  saveInboxPreferences: vi.fn(async () => ({ timezone: 'Europe/London' })),
  createInboxSavedReply: vi.fn(async () => ({ id: 'reply-1' })),
  updateInboxSavedReply: vi.fn(async () => ({ id: 'reply-1', body: 'Updated' })),
  deleteInboxSavedReply: vi.fn(async () => true),
  createInboxRoutingRule: vi.fn(async () => ({ id: 'rule-1' })),
  updateInboxRoutingRule: vi.fn(async () => ({ id: 'rule-1', priority: 1 })),
  deleteInboxRoutingRule: vi.fn(async () => true),
};
vi.mock('../../services/inbox.js', () => ({
  __esModule: true,
  ...inboxMocks,
}));

const mentoringMocks = {
  fetchMentoringDashboard: vi.fn(async () => ({
    summary: { sessions: 2 },
    favourites: [{ mentor: { id: 1, name: 'Ava' } }],
    suggestions: [],
    sessions: { all: [] },
    purchases: { orders: [] },
  })),
  createMentoringSession: vi.fn(async () => ({ id: 'session-1' })),
  updateMentoringSession: vi.fn(async () => ({ id: 'session-1', status: 'updated' })),
  recordMentorshipPurchase: vi.fn(async () => ({ id: 'purchase-1' })),
  updateMentorshipPurchase: vi.fn(async () => ({ id: 'purchase-1', status: 'updated' })),
  addFavouriteMentor: vi.fn(async () => ({ id: 1 })),
  removeFavouriteMentor: vi.fn(async () => true),
};
vi.mock('../../services/userMentoring.js', () => ({
  __esModule: true,
  ...mentoringMocks,
}));

const mockGetFreelancerNetworkingDashboard = vi.fn(async () => ({
  summary: {
    totalBookings: 10,
    upcomingSessions: 3,
    completedSessions: 6,
    cancelledSessions: 1,
    totalSpendCents: 100000,
    paidSessions: 5,
    pendingPayment: 2,
  },
  bookings: [{ id: 'booking-1', purchaseCurrency: 'USD' }],
  availableSessions: [],
  connections: { total: 4, items: [] },
  metrics: {},
  orders: {
    summary: { totals: { total: 3, paid: 2, pending: 1, refunded: 0, cancelled: 0 } },
    items: [{ id: 'order-1', amountCents: 5000, currency: 'USD' }],
  },
  ads: { campaigns: [{ id: 'campaign-1', budgetCents: 10000, currencyCode: 'USD', metrics: { spendCents: 4000 } }] },
  preferences: {},
  settings: {},
  config: {},
}));
vi.mock('../../services/freelancerNetworking.js', () => ({
  __esModule: true,
  getFreelancerNetworkingDashboard: mockGetFreelancerNetworkingDashboard,
}));

const portfolioMocks = {
  fetchFreelancerPortfolio: vi.fn(async () => ({
    items: [{ id: 'portfolio-1' }],
    settings: { heroHeadline: 'Headline' },
    summary: { total: 1 },
  })),
  createFreelancerPortfolioItem: vi.fn(async () => ({ id: 'portfolio-2' })),
  updateFreelancerPortfolioItem: vi.fn(async () => ({ id: 'portfolio-1' })),
  deleteFreelancerPortfolioItem: vi.fn(async () => true),
  createFreelancerPortfolioAsset: vi.fn(async () => ({ id: 'asset-1' })),
  updateFreelancerPortfolioAsset: vi.fn(async () => ({ id: 'asset-1' })),
  deleteFreelancerPortfolioAsset: vi.fn(async () => true),
  updateFreelancerPortfolioSettings: vi.fn(async () => ({ heroHeadline: 'Updated headline' })),
};
vi.mock('../../services/freelancerPortfolio.js', () => ({
  __esModule: true,
  ...portfolioMocks,
}));

const mockApiClient = {
  readCache: vi.fn(() => null),
  writeCache: vi.fn(),
  removeCache: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};
vi.mock('../../services/apiClient.js', () => ({
  __esModule: true,
  apiClient: mockApiClient,
  default: mockApiClient,
}));

const profileMocks = {
  fetchFreelancerProfileOverview: vi.fn(async () => ({
    name: 'Jordan',
    connections: [],
  })),
  saveFreelancerProfileOverview: vi.fn(async () => ({ name: 'Jordan Updated' })),
  uploadFreelancerAvatar: vi.fn(async () => ({ avatarUrl: 'https://cdn.example/avatar.png' })),
  createFreelancerConnection: vi.fn(async () => ({ connections: [{ id: 'conn-1' }] })),
  updateFreelancerConnection: vi.fn(async () => ({ connections: [{ id: 'conn-1', status: 'updated' }] })),
  deleteFreelancerConnection: vi.fn(async () => ({ connections: [] })),
};
vi.mock('../../services/freelancerProfileOverview.js', () => ({
  __esModule: true,
  ...profileMocks,
}));

const mockFetchFreelancerPurchasedGigWorkspace = vi.fn(async () => ({
  summary: {
    activeOrders: 2,
    pipelineValue: 1500,
    requirementsDue: 1,
    revisionCount: 2,
    pendingPayoutValue: 700,
    payoutsDueThisWeek: 1,
  },
  orders: [{ id: 'order-1', currencyCode: 'USD' }],
}));
vi.mock('../../services/freelancer.js', () => ({
  __esModule: true,
  fetchFreelancerPurchasedGigWorkspace: mockFetchFreelancerPurchasedGigWorkspace,
}));

beforeEach(() => {
  mockUseCachedResource.mockClear();
  mockApiClient.removeCache.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Group 100 hooks', () => {
  it('exposes company system preferences with safe defaults', async () => {
    setNextResourceState(() => createResourceState({
      data: {
        preferences: { timezone: 'Europe/Berlin' },
        automation: { autoInvite: false },
        webhooks: null,
        apiTokens: null,
        workspace: { id: 'ws-1' },
        metadata: { workspaceOptions: [{ id: 'ws-1', name: 'Primary' }] },
      },
    }));
    const { useCompanySystemPreferences } = await import('../useCompanySystemPreferences.js');
    const { result } = renderHook(() => useCompanySystemPreferences({ workspaceId: 'ws-1' }));
    const [, fetcher] = mockUseCachedResource.mock.calls[0];
    await fetcher({ signal: 'test' });
    expect(mockFetchCompanySystemPreferences).toHaveBeenCalledWith({ workspaceId: 'ws-1', signal: 'test' });
    expect(result.current.preferences).toEqual({ timezone: 'Europe/Berlin' });
    expect(result.current.automation).toEqual({ autoInvite: false });
    expect(result.current.webhooks).toEqual([]);
    expect(result.current.apiTokens).toEqual([]);
    expect(result.current.workspaceOptions).toEqual([{ id: 'ws-1', name: 'Primary' }]);
  });

  it('provides volunteering management actions that refresh the cache', async () => {
    const refresh = vi.fn(() => Promise.resolve());
    setNextResourceState(() => createResourceState({
      data: {
        posts: [{ id: 'post-1' }],
        summary: { openPositions: 1 },
        totals: { contracts: 1 },
        permissions: { canEdit: true },
        workspace: { id: 'ws-9' },
      },
      refresh,
    }));
    const { useCompanyVolunteeringManagement } = await import('../useCompanyVolunteeringManagement.js');
    const { result } = renderHook(() =>
      useCompanyVolunteeringManagement({ workspaceSlug: 'launchpad', enabled: true }),
    );
    await act(async () => {
      await result.current.createPost({ title: 'New mission' });
    });
    expect(volunteeringMocks.createVolunteeringPost).toHaveBeenCalledWith({
      title: 'New mission',
      workspaceId: 'ws-9',
      workspaceSlug: 'launchpad',
    });
    expect(refresh).toHaveBeenCalled();
  });

  it('returns fallback state when wallet detail is missing', async () => {
    const { default: useCompanyWalletDetail } = await import('../useCompanyWalletDetail.js');
    const { result } = renderHook(() => useCompanyWalletDetail(null));
    expect(result.current).toMatchObject({
      data: null,
      error: null,
      loading: false,
    });
  });

  it('fetches company wallet detail when walletId is provided', async () => {
    setNextResourceState(() => createResourceState());
    const { default: useCompanyWalletDetail } = await import('../useCompanyWalletDetail.js');
    renderHook(() => useCompanyWalletDetail('wallet-42', { workspaceSlug: 'demo' }));
    const [, fetcher] = mockUseCachedResource.mock.calls[0];
    await fetcher({ signal: 'sig' });
    expect(mockFetchCompanyWalletDetail).toHaveBeenCalledWith('wallet-42', {
      workspaceId: undefined,
      workspaceSlug: 'demo',
      signal: 'sig',
    });
  });

  it('loads company wallets with cache awareness', async () => {
    setNextResourceState(() => createResourceState());
    const { default: useCompanyWallets } = await import('../useCompanyWallets.js');
    renderHook(() => useCompanyWallets({ workspaceId: 'ws-1', includeInactive: true }));
    const [cacheKey] = mockUseCachedResource.mock.calls[0];
    expect(cacheKey).toBe('company:wallets:ws-1:all');
    const [, fetcher] = mockUseCachedResource.mock.calls[0];
    await fetcher({ signal: 'sig' });
    expect(mockFetchCompanyWallets).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      workspaceSlug: undefined,
      includeInactive: true,
      signal: 'sig',
    });
  });

  it('only queries connection network when userId is provided', async () => {
    setNextResourceState(() => createResourceState());
    const { default: useConnectionNetwork } = await import('../useConnectionNetwork.js');
    renderHook(() => useConnectionNetwork({ userId: null }));
    expect(mockFetchConnectionNetwork).not.toHaveBeenCalled();
    const { result } = renderHook(() => useConnectionNetwork({ userId: 'user-88', viewerId: 'viewer-1' }));
    const [, fetcher] = mockUseCachedResource.mock.calls[1];
    await fetcher({ signal: 'sig' });
    expect(mockFetchConnectionNetwork).toHaveBeenCalledWith({ userId: 'user-88', viewerId: 'viewer-1', signal: 'sig' });
    expect(result.current).toHaveProperty('loading');
  });

  it('fetches creation studio overview data', async () => {
    setNextResourceState(() => createResourceState());
    const { useCreationStudio } = await import('../useCreationStudio.js');
    renderHook(() => useCreationStudio({ workspaceId: 'ws-1' }));
    const [, fetcher] = mockUseCachedResource.mock.calls[0];
    await fetcher({ signal: 'sig' });
    expect(mockFetchCompanyCreationStudioOverview).toHaveBeenCalledWith({ workspaceId: 'ws-1', signal: 'sig' });
  });

  it('filters managed connectors inside CRM integration manager', async () => {
    const { default: useCrmIntegrationManager } = await import('../useCrmIntegrationManager.js');
    const { result } = renderHook(() => useCrmIntegrationManager({ workspaceId: 'ws-1' }));
    expect(mockUseIntegrationControlTower).toHaveBeenCalled();
    expect(result.current.managedConnectors).toEqual([{ id: 'crm-1', isManaged: true }]);
  });

  it('debounces values over the provided delay', async () => {
    vi.useFakeTimers();
    const { default: useDebounce } = await import('../useDebounce.js');
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'hello', delay: 200 },
    });
    expect(result.current).toBe('hello');
    rerender({ value: 'updated', delay: 200 });
    expect(result.current).toBe('hello');
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('updated');
    vi.useRealTimers();
  });

  it('manages dispute data and exposes mutation helpers', async () => {
    const { default: useDisputeManagement } = await import('../useDisputeManagement.js');
    const { result } = renderHook(() => useDisputeManagement({ workspaceId: 'ws-5' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.createDispute({ title: 'New dispute' });
    });
    expect(trustMocks.createDispute).toHaveBeenCalled();
    await act(async () => {
      await result.current.saveSettings({ autoEscalate: false });
    });
    expect(trustMocks.updateDisputeSettings).toHaveBeenCalled();
  });

  it('refreshes domain governance summaries on demand', async () => {
    const { default: useDomainGovernanceSummaries } = await import('../useDomainGovernanceSummaries.js');
    const { result } = renderHook(() => useDomainGovernanceSummaries({ refreshIntervalMs: null }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetchDomainGovernanceSummaries).toHaveBeenCalledTimes(1);
    expect(result.current.contexts).toEqual([{ id: 'context-1' }]);
    await act(async () => {
      result.current.refresh({ force: true });
      await Promise.resolve();
    });
    await waitFor(() => expect(mockFetchDomainGovernanceSummaries).toHaveBeenCalledTimes(2));
  });

  it('derives engagement signals from helper services', async () => {
    const { default: useEngagementSignals } = await import('../useEngagementSignals.js');
    const { result } = renderHook(() => useEngagementSignals({ session: { id: 'user-1' }, feedPosts: [], limit: 4 }));
    expect(engagementMocks.resolveUserInterests).toHaveBeenCalled();
    expect(result.current).toMatchObject({
      interests: ['launchpad'],
      connectionSuggestions: [{ id: 'conn' }],
      groupSuggestions: [{ id: 'group' }],
      liveMoments: [{ id: 'moment' }],
    });
  });

  it('builds the finance control tower cache key and fetches data', async () => {
    setNextResourceState(() => createResourceState({ data: { totals: { volume: 1000 } } }));
    const { useFinanceControlTower } = await import('../useFinanceControlTower.js');
    renderHook(() => useFinanceControlTower({ userId: 'user-1' }));
    expect(financeMocks.buildFinanceOverviewCacheKey).toHaveBeenCalledWith('user-1');
    const [, fetcher] = mockUseCachedResource.mock.calls[0];
    await fetcher({ signal: 'sig', force: true });
    expect(financeMocks.fetchControlTowerOverview).toHaveBeenCalledWith({
      userId: 'user-1',
      signal: 'sig',
      forceRefresh: true,
    });
  });

  it('loads, creates, updates, and deletes freelancer calendar events', async () => {
    const { default: useFreelancerCalendar } = await import('../useFreelancerCalendar.js');
    const { result } = renderHook(() =>
      useFreelancerCalendar({ freelancerId: 'freelancer-1', enabled: false, lookbackDays: 7, lookaheadDays: 14 }),
    );
    await act(async () => {
      await result.current.createEvent({ title: 'Session' });
    });
    expect(calendarMocks.createFreelancerCalendarEvent).toHaveBeenCalledWith(
      'freelancer-1',
      { title: 'Session' },
      {},
    );
    await act(async () => {
      await result.current.updateEvent('evt-1', { id: 'evt-1', title: 'Updated' });
    });
    expect(calendarMocks.updateFreelancerCalendarEvent).toHaveBeenCalledWith(
      'freelancer-1',
      'evt-1',
      { id: 'evt-1', title: 'Updated' },
      {},
    );
    await act(async () => {
      await result.current.deleteEvent('evt-1');
    });
    expect(calendarMocks.deleteFreelancerCalendarEvent).toHaveBeenCalledWith('freelancer-1', 'evt-1', {});
  });

  it('normalises freelancer escrow overview and exposes actions', async () => {
    const refresh = vi.fn(() => Promise.resolve());
    setNextResourceState(() => createResourceState({
      data: {
        metrics: { totalAccounts: 1 },
        accounts: [{ id: 'acc-1' }],
        disputes: [],
      },
      refresh,
    }));
    const { default: useFreelancerEscrow } = await import('../useFreelancerEscrow.js');
    const { result } = renderHook(() => useFreelancerEscrow({ freelancerId: 'freelancer-1' }));
    await act(async () => {
      await result.current.createAccount({ name: 'Primary' });
    });
    expect(escrowMocks.createFreelancerEscrowAccount).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });

  it('loads inbox workspace data and persists preferences', async () => {
    const refresh = vi.fn(() => Promise.resolve());
    setNextResourceState(() => createResourceState({
      data: {
        userId: 'user-1',
        preferences: { timezone: 'UTC' },
      },
      refresh,
    }));
    const { default: useFreelancerInboxWorkspace } = await import('../useFreelancerInboxWorkspace.js');
    const { result } = renderHook(() => useFreelancerInboxWorkspace({ userId: 'user-1' }));
    await act(async () => {
      await result.current.updatePreferences({ timezone: 'Europe/London' });
    });
    expect(inboxMocks.saveInboxPreferences).toHaveBeenCalledWith({ userId: 'user-1', timezone: 'Europe/London' });
    expect(refresh).toHaveBeenCalled();
  });

  it('fetches mentoring dashboard data and resolves mentor lookup', async () => {
    const { default: useFreelancerMentoring } = await import('../useFreelancerMentoring.js');
    const { result } = renderHook(() => useFreelancerMentoring({ userId: 42 }));
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.summary).toEqual({ sessions: 2 });
    await act(async () => {
      await result.current.addFavourite({ mentorId: 1 });
    });
    expect(mentoringMocks.addFavouriteMentor).toHaveBeenCalled();
  });

  it('derives networking dashboard metrics and formatting', async () => {
    const networkingPayload = {
      summary: {
        totalBookings: 10,
        upcomingSessions: 3,
        completedSessions: 6,
        cancelledSessions: 1,
        totalSpendCents: 100000,
        paidSessions: 5,
        pendingPayment: 2,
      },
      bookings: [{ id: 'booking-1', purchaseCurrency: 'USD' }],
      availableSessions: [],
      connections: { total: 4, items: [] },
      metrics: {},
      orders: {
        summary: { totals: { total: 3, paid: 2, pending: 1, refunded: 0, cancelled: 0 } },
        items: [{ id: 'order-1', amountCents: 5000, currency: 'USD' }],
      },
      ads: { campaigns: [{ id: 'campaign-1', budgetCents: 10000, currencyCode: 'USD', metrics: { spendCents: 4000 } }] },
      preferences: {},
      settings: {},
      config: {},
    };
    setNextResourceState(() => createResourceState({ data: networkingPayload }));
    mockGetFreelancerNetworkingDashboard.mockResolvedValue(networkingPayload);
    const { default: useFreelancerNetworkingDashboard } = await import('../useFreelancerNetworkingDashboard.js');
    const { result } = renderHook(() => useFreelancerNetworkingDashboard({ freelancerId: 'freelancer-1' }));
    expect(result.current.summaryCards[0]).toMatchObject({ label: 'Sessions booked', value: 10 });
    expect(result.current.orders[0]).toHaveProperty('amountFormatted');
  });

  it('interacts with freelancer portfolio services and invalidates cache', async () => {
    const refresh = vi.fn(() => Promise.resolve());
    setNextResourceState(() => createResourceState({
      data: { items: [{ id: 'portfolio-1' }], settings: { heroHeadline: 'Headline' } },
      refresh,
    }));
    const { default: useFreelancerPortfolio } = await import('../useFreelancerPortfolio.js');
    const { result } = renderHook(() => useFreelancerPortfolio({ freelancerId: 'freelancer-1' }));
    await act(async () => {
      await result.current.actions.createItem({ title: 'New case study' });
    });
    expect(portfolioMocks.createFreelancerPortfolioItem).toHaveBeenCalled();
    expect(mockApiClient.removeCache).toHaveBeenCalledWith('freelancer:portfolio:freelancer-1');
  });

  it('manages freelancer profile overview mutations', async () => {
    const { default: useFreelancerProfileOverview } = await import('../useFreelancerProfileOverview.js');
    const { result } = renderHook(() => useFreelancerProfileOverview({ userId: 'user-1' }));
    await act(async () => {
      await result.current.refresh();
    });
    await act(async () => {
      await result.current.saveProfile({ headline: 'Updated' });
    });
    expect(profileMocks.saveFreelancerProfileOverview).toHaveBeenCalledWith('user-1', { headline: 'Updated' });
  });

  it('derives purchased gigs summary cards', async () => {
    const gigsPayload = {
      summary: {
        activeOrders: 2,
        pipelineValue: 1500,
        requirementsDue: 1,
        revisionCount: 2,
        pendingPayoutValue: 700,
        payoutsDueThisWeek: 1,
      },
      orders: [{ id: 'order-1', currencyCode: 'USD' }],
    };
    setNextResourceState(() => createResourceState({ data: gigsPayload }));
    mockFetchFreelancerPurchasedGigWorkspace.mockResolvedValue(gigsPayload);
    const { useFreelancerPurchasedGigsDashboard } = await import('../useFreelancerPurchasedGigsDashboard.js');
    const { result } = renderHook(() => useFreelancerPurchasedGigsDashboard({ freelancerId: 'freelancer-1' }));
    expect(result.current.summaryCards).toHaveLength(4);
    expect(result.current.summaryCards[0]).toMatchObject({ label: 'Active orders', value: 2 });
  });
});
