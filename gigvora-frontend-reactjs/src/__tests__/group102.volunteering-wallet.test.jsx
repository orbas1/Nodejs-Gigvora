import { act, renderHook, waitFor } from '@testing-library/react';
import useVolunteeringManagement from '../hooks/useVolunteeringManagement.js';
import useWalletTransactions from '../hooks/useWalletTransactions.js';
import useUserTimeline from '../hooks/useUserTimeline.js';

const {
  volunteeringMocks,
  fetchWalletTransactionsMock,
  useCachedResourceMock,
  useFreelancerTimelineMock,
  computeTimelineAnalyticsFromClientMock,
} = vi.hoisted(() => ({
  volunteeringMocks: {
    fetchFreelancerVolunteeringWorkspace: vi.fn(),
    createFreelancerVolunteeringApplication: vi.fn(),
    updateFreelancerVolunteeringApplication: vi.fn(),
    deleteFreelancerVolunteeringApplication: vi.fn(),
    createFreelancerVolunteeringResponse: vi.fn(),
    updateFreelancerVolunteeringResponse: vi.fn(),
    deleteFreelancerVolunteeringResponse: vi.fn(),
    createFreelancerVolunteeringContract: vi.fn(),
    updateFreelancerVolunteeringContract: vi.fn(),
    deleteFreelancerVolunteeringContract: vi.fn(),
    createFreelancerVolunteeringSpend: vi.fn(),
    updateFreelancerVolunteeringSpend: vi.fn(),
    deleteFreelancerVolunteeringSpend: vi.fn(),
  },
  fetchWalletTransactionsMock: vi.fn(),
  useCachedResourceMock: vi.fn(),
  useFreelancerTimelineMock: vi.fn(() => ({ timeline: [], workspace: { id: 'freelancer' } })),
  computeTimelineAnalyticsFromClientMock: vi.fn((posts, entries) => ({ totals: posts.length + entries.length })),
}));

vi.mock('../services/volunteering.js', () => ({
  __esModule: true,
  ...volunteeringMocks,
}));

vi.mock('../services/companyWallets.js', () => ({
  __esModule: true,
  fetchWalletTransactions: fetchWalletTransactionsMock,
}));

vi.mock('../hooks/useCachedResource.js', () => ({
  __esModule: true,
  default: useCachedResourceMock,
}));

vi.mock('../hooks/useFreelancerTimeline.js', () => ({
  __esModule: true,
  useFreelancerTimeline: useFreelancerTimelineMock,
  default: useFreelancerTimelineMock,
  computeTimelineAnalyticsFromClient: computeTimelineAnalyticsFromClientMock,
}));

describe('useVolunteeringManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    volunteeringMocks.fetchFreelancerVolunteeringWorkspace.mockResolvedValue({
      workspace: { id: 42, name: 'Impact Collective' },
      metadata: { roles: ['mentor'] },
    });
  });

  it('loads workspace data and refreshes after mutations', async () => {
    const { result } = renderHook(() => useVolunteeringManagement({ freelancerId: '42' }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.workspace).toEqual({ id: 42, name: 'Impact Collective' });
    expect(result.current.metadata.roles).toContain('mentor');
    expect(result.current.lastLoadedAt).not.toBeNull();

    volunteeringMocks.createFreelancerVolunteeringApplication.mockResolvedValue({ id: 'app-1' });
    volunteeringMocks.fetchFreelancerVolunteeringWorkspace.mockResolvedValueOnce({
      workspace: { id: 42, name: 'Impact Collective' },
      metadata: { roles: ['mentor'], updated: true },
    });

    await act(async () => {
      await result.current.createApplication({ title: 'New opportunity' });
    });

    expect(volunteeringMocks.createFreelancerVolunteeringApplication).toHaveBeenCalledWith(42, {
      title: 'New opportunity',
    });
    expect(volunteeringMocks.fetchFreelancerVolunteeringWorkspace).toHaveBeenCalledTimes(2);
  });
});

describe('useWalletTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCachedResourceMock.mockImplementation(() => ({
      data: { items: [{ id: 'txn-1' }] },
      error: null,
      loading: false,
      fromCache: false,
      lastUpdated: new Date(),
      refresh: vi.fn(),
    }));
  });

  it('builds cache keys and normalized filters for wallet resources', () => {
    const { result } = renderHook(() =>
      useWalletTransactions('wallet-1', {
        workspaceSlug: 'acme',
        filters: { status: 'pending', limit: 10 },
      }),
    );

    expect(useCachedResourceMock).toHaveBeenCalledWith(
      expect.stringContaining('wallet-1'),
      expect.any(Function),
      expect.objectContaining({ enabled: true }),
    );
    expect(result.current.filters.status).toBe('pending');
    expect(result.current.cacheKey).toContain('wallet-1');
  });

  it('returns a stub response when wallet id is missing', () => {
    const { result } = renderHook(() => useWalletTransactions(null, { filters: { limit: 5 } }));

    expect(result.current.data.items).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.filters.limit).toBe(5);
  });
});

describe('useUserTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates to the freelancer timeline hook with user-specific fallbacks', () => {
    const { result } = renderHook(() => useUserTimeline({ userId: 'user-7' }));

    expect(result.current.workspace.id).toBe('freelancer');
    expect(useFreelancerTimelineMock).toHaveBeenCalledWith(
      expect.objectContaining({
        freelancerId: 'user-7',
        resourceKeyPrefix: 'user:timeline',
        demoOwnerId: 'demo-user',
      }),
    );
    const options = useFreelancerTimelineMock.mock.calls[0][0];
    expect(Array.isArray(options.fallbackPosts)).toBe(true);
    expect(Array.isArray(options.fallbackEntries)).toBe(true);
    expect(computeTimelineAnalyticsFromClientMock).toHaveBeenCalled();
  });
});
