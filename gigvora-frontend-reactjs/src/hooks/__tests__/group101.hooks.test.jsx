import { renderHook, act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useFreelancerReferences from '../useFreelancerReferences.js';
import useFreelancerReviews from '../useFreelancerReviews.js';
import useFreelancerTimeline, { computeTimelineAnalyticsFromClient } from '../useFreelancerTimeline.js';
import useGigOrderDetail from '../useGigOrderDetail.js';
import { useGroupDirectory, useGroupProfile } from '../useGroups.js';
import useHeadhunterDashboard from '../useHeadhunterDashboard.js';
import useHomeExperience from '../useHomeExperience.js';
import useIdentityVerification from '../useIdentityVerification.js';
import useIntegrationControlTower from '../useIntegrationControlTower.js';
import useInterviewRoom from '../useInterviewRoom.js';
import useInterviewWorkflow from '../useInterviewWorkflow.js';
import useLearningHub from '../useLearningHub.js';
import useLiveServiceTelemetry from '../useLiveServiceTelemetry.js';
import useLocalCollection from '../useLocalCollection.js';
import useNetworkingAccess from '../useNetworkingAccess.js';
import useNetworkingSessions, { useNetworkingSessionRuntime } from '../useNetworkingSessions.js';
import useNotificationCenter from '../useNotificationCenter.js';
import useOpportunityListing from '../useOpportunityListing.js';
import usePeopleSearch from '../usePeopleSearch.js';
import useProjectGigManagement from '../useProjectGigManagement.js';

const createResourceState = (overrides = {}) => ({
  data: null,
  error: null,
  loading: false,
  fromCache: false,
  lastUpdated: new Date(),
  refresh: vi.fn(() => Promise.resolve()),
  ...overrides,
});

const mockUseCachedResource = vi.fn((cacheKey, fetcher, options) => {
  const factory = mockUseCachedResource.nextReturn ?? (() => createResourceState());
  const state = factory({ cacheKey, fetcher, options });
  mockUseCachedResource.nextReturn = null;
  return state;
});

mockUseCachedResource.nextReturn = null;

const setNextResourceState = (factory) => {
  mockUseCachedResource.nextReturn = factory;
};

vi.mock('../useCachedResource.js', () => ({
  __esModule: true,
  default: (...args) => mockUseCachedResource(...args),
  useCachedResource: (...args) => mockUseCachedResource(...args),
}));

const reputationMocks = vi.hoisted(() => ({
  fetchFreelancerReputation: vi.fn(async () => ({
    references: [
      {
        id: 'ref-1',
        client: 'Lumina',
        rating: 5,
        verified: true,
        status: 'published',
        lastInteractionAt: '2024-05-10T12:00:00Z',
      },
      {
        id: 'ref-2',
        client: 'Atlas',
        rating: 4,
        verified: false,
        status: 'pending',
        lastInteractionAt: '2024-04-10T12:00:00Z',
      },
    ],
    insights: { invitesSent: 8, responseRate: 0.5 },
    settings: { autoRequest: true, allowPrivate: true },
  })),
  requestReferenceInvite: vi.fn(async () => ({})),
  updateReferenceSettings: vi.fn(async () => ({})),
  verifyReference: vi.fn(async () => ({})),
  fetchFreelancerReviews: vi.fn(async () => ({
    reviews: [
      {
        id: 'review-1',
        reviewerName: 'Priya Desai',
        rating: 5,
        status: 'published',
        capturedAt: '2024-05-01T09:00:00Z',
      },
    ],
    summary: {
      total: 1,
      published: 1,
      draft: 0,
      pending: 0,
      highlighted: 0,
      averageRating: 5,
    },
    ratingDistribution: { 5: 1, 4: 0, 3: 0, 2: 0, 1: 0 },
    insights: { highlightedCount: 0 },
  })),
  createFreelancerReview: vi.fn(async (freelancerId, payload) => ({ id: 'review-created', ...payload })),
  updateFreelancerReview: vi.fn(async () => ({ id: 'review-1' })),
  deleteFreelancerReview: vi.fn(async () => true),
}));

vi.mock('../../services/reputation.js', () => ({
  __esModule: true,
  ...reputationMocks,
}));

const timelineMocks = vi.hoisted(() => ({
  fetchFreelancerTimelineWorkspace: vi.fn(async () => ({
    workspace: { id: 'workspace-1', timezone: 'UTC', defaultVisibility: 'public' },
    timelineEntries: [],
    posts: [],
    analytics: { totals: { posts: 0 }, timelineSummary: {} },
  })),
  updateFreelancerTimelineSettings: vi.fn(async () => ({ id: 'workspace-1' })),
  createFreelancerTimelineEntry: vi.fn(async () => ({ id: 'entry-remote' })),
  updateFreelancerTimelineEntry: vi.fn(async () => ({ id: 'entry-remote' })),
  deleteFreelancerTimelineEntry: vi.fn(async () => true),
  createFreelancerTimelinePost: vi.fn(async () => ({ id: 'post-remote' })),
  updateFreelancerTimelinePost: vi.fn(async () => ({ id: 'post-remote' })),
  deleteFreelancerTimelinePost: vi.fn(async () => true),
  publishFreelancerTimelinePost: vi.fn(async () => ({ id: 'post-remote', status: 'published' })),
  recordFreelancerTimelinePostMetrics: vi.fn(async () => ({ totals: {} })),
}));

vi.mock('../../services/freelancerTimeline.js', () => ({
  __esModule: true,
  ...timelineMocks,
}));

const projectGigMocks = vi.hoisted(() => ({
  fetchProjectGigManagement: vi.fn(async () => ({ access: { canManage: true } })),
  createProject: vi.fn(async () => ({ id: 'project-1' })),
  updateProject: vi.fn(async () => ({ id: 'project-1' })),
  addProjectAsset: vi.fn(async () => ({ id: 'asset-1' })),
  updateProjectAsset: vi.fn(async () => ({ id: 'asset-1' })),
  deleteProjectAsset: vi.fn(async () => true),
  updateWorkspace: vi.fn(async () => ({ id: 'workspace-1' })),
  archiveProject: vi.fn(async () => true),
  restoreProject: vi.fn(async () => true),
  createGigOrder: vi.fn(async () => ({ id: 'order-remote' })),
  updateGigOrder: vi.fn(async () => ({ id: 'order-remote', status: 'updated' })),
  createProjectBid: vi.fn(async () => ({ id: 'bid-1' })),
  updateProjectBid: vi.fn(async () => ({ id: 'bid-1' })),
  sendProjectInvitation: vi.fn(async () => ({ id: 'invite-1' })),
  updateProjectInvitation: vi.fn(async () => ({ id: 'invite-1' })),
  updateAutoMatchSettings: vi.fn(async () => ({ enabled: true })),
  createAutoMatch: vi.fn(async () => ({ id: 'match-1' })),
  updateAutoMatch: vi.fn(async () => ({ id: 'match-1' })),
  createProjectReview: vi.fn(async () => ({ id: 'review-remote' })),
  createEscrowTransaction: vi.fn(async () => ({ id: 'escrow-1' })),
  updateEscrowSettings: vi.fn(async () => ({ id: 'escrow-settings' })),
  addGigTimelineEvent: vi.fn(async () => true),
  postGigOrderMessage: vi.fn(async () => true),
  createGigEscrowCheckpoint: vi.fn(async () => ({ id: 'checkpoint-1' })),
  updateGigEscrowCheckpoint: vi.fn(async () => ({ id: 'checkpoint-1' })),
  createProjectMilestone: vi.fn(async () => ({ id: 'milestone-1' })),
  updateProjectMilestone: vi.fn(async () => ({ id: 'milestone-1' })),
  deleteProjectMilestone: vi.fn(async () => true),
  createProjectCollaborator: vi.fn(async () => ({ id: 'collaborator-1' })),
  updateProjectCollaborator: vi.fn(async () => ({ id: 'collaborator-1' })),
  deleteProjectCollaborator: vi.fn(async () => true),
  createGigTimelineEvent: vi.fn(async () => true),
  updateGigTimelineEvent: vi.fn(async () => true),
  createGigSubmission: vi.fn(async () => true),
  updateGigSubmission: vi.fn(async () => true),
  postGigChatMessage: vi.fn(async () => ({ order: { id: 'order-1', permissions: { canManage: true } }, message: { id: 'msg-1' } })),
  fetchGigOrderDetail: vi.fn(async () => ({ order: { id: 'order-1', permissions: { canManage: true } } })),
  acknowledgeGigChatMessage: vi.fn(async () => ({ order: { id: 'order-1', permissions: { canManage: true } }, message: { id: 'msg-ack' } })),
}));

vi.mock('../../services/projectGigManagement.js', () => ({
  __esModule: true,
  ...projectGigMocks,
}));

const groupsMocks = vi.hoisted(() => ({
  listGroups: vi.fn(async () => ({ items: [{ id: 'group-1' }] })),
  getGroupProfile: vi.fn(async () => ({ id: 'group-1', name: 'Product Leaders' })),
}));

vi.mock('../../services/groups.js', () => ({
  __esModule: true,
  ...groupsMocks,
}));

const headhunterMocks = vi.hoisted(() => ({
  fetchHeadhunterDashboard: vi.fn(async () => ({
    workspaceSummary: { defaultCurrency: 'USD' },
    pipelineSummary: { totals: { active: 4 }, velocityDays: 12 },
    mandatePortfolio: { totals: { activeMandates: 3, pipelineValue: 500000 } },
  })),
}));

vi.mock('../../services/headhunter.js', () => ({
  __esModule: true,
  ...headhunterMocks,
}));

const publicSiteMocks = vi.hoisted(() => ({
  fetchSiteSettings: vi.fn(async () => ({
    heroHeadline: 'Test headline',
    communityStats: [{ label: 'Members', value: '1000+' }],
    operationsSummary: { uptime: { value: '99%' } },
    marketing: {
      announcement: { title: 'Launch', description: 'Now live', cta: { label: 'Read', href: '/launch' } },
      personas: [{ id: 'ops', label: 'Operations', description: 'Keep launches on track' }],
      productTour: { steps: [{ id: 'step-1', title: 'Tour', summary: 'Overview' }] },
      pricing: { plans: [{ id: 'launch', name: 'Launch', pricing: { monthly: 99 } }] },
    },
  })),
  fetchSitePage: vi.fn(async () => ({ id: 'home', blocks: [] })),
}));

vi.mock('../../services/publicSite.js', () => ({
  __esModule: true,
  ...publicSiteMocks,
}));

const creationStudioMocks = vi.hoisted(() => ({
  listCreationStudioItems: vi.fn(async () => ({ items: [{ id: 'creation-1' }] })),
}));

vi.mock('../../services/creationStudio.js', () => ({
  __esModule: true,
  ...creationStudioMocks,
}));

const identityVerificationMocks = vi.hoisted(() => ({
  fetchIdentityVerification: vi.fn(async () => ({
    current: { status: 'pending', documents: {} },
    requirements: { requiredDocuments: ['id'] },
    capabilities: { canUploadDocuments: true, canSubmit: true, canReview: true },
    allowedStatuses: ['pending', 'submitted', 'verified'],
  })),
  saveIdentityVerification: vi.fn(async () => ({ success: true })),
  submitIdentityVerification: vi.fn(async () => ({ status: 'submitted' })),
  reviewIdentityVerification: vi.fn(async () => ({ status: 'verified' })),
  uploadIdentityDocument: vi.fn(async () => ({ id: 'file-1' })),
}));

vi.mock('../../services/identityVerification.js', () => ({
  __esModule: true,
  ...identityVerificationMocks,
}));

const integrationsMocks = vi.hoisted(() => ({
  fetchIntegrationControlTower: vi.fn(async () => ({
    connectors: [
      { id: 'crm-1', providerKey: 'crm', category: 'crm', status: 'connected' },
      { id: 'crm-2', providerKey: 'crm', category: 'crm', status: 'disconnected' },
    ],
    summary: { total: 2, connected: 1 },
    auditLog: [],
    defaults: {},
  })),
  updateCrmIntegration: vi.fn(async () => ({ status: 'connected' })),
  rotateCrmCredential: vi.fn(async () => ({ id: 'credential-1' })),
  updateCrmFieldMappings: vi.fn(async () => ({ success: true })),
  updateCrmRoleAssignments: vi.fn(async () => ({ success: true })),
  triggerCrmManualSync: vi.fn(async () => ({ status: 'queued' })),
  createCrmIncident: vi.fn(async () => ({ id: 'incident-1' })),
  resolveCrmIncident: vi.fn(async () => ({ id: 'incident-1', status: 'resolved' })),
}));

vi.mock('../../services/companyIntegrations.js', () => ({
  __esModule: true,
  ...integrationsMocks,
}));

const interviewsMocks = vi.hoisted(() => ({
  fetchInterviewRoom: vi.fn(async () => ({ id: 'room-1' })),
  fetchInterviewWorkflow: vi.fn(async () => ({ id: 'workflow-1' })),
}));

vi.mock('../../services/interviews.js', () => ({
  __esModule: true,
  ...interviewsMocks,
}));

const learningHubMocks = vi.hoisted(() => ({
  fetchFreelancerLearningHub: vi.fn(async () => ({
    summary: {
      inProgressCourses: 2,
      totalCourses: 6,
      completionRate: 60,
      completedCourses: 3,
      mentoringSessionsScheduled: 1,
      upcomingRenewals: 1,
      nextRenewal: { name: 'AWS Cert', expirationDate: new Date().toISOString() },
    },
    serviceLines: [],
    certifications: [],
    recommendations: [],
  })),
}));

vi.mock('../../services/learningHub.js', () => ({
  __esModule: true,
  ...learningHubMocks,
}));

const telemetryMocks = vi.hoisted(() => ({
  fetchLiveServiceTelemetry: vi.fn(async () => ({ telemetry: { status: 'healthy' } })),
}));

vi.mock('../../services/runtimeTelemetry.js', () => ({
  __esModule: true,
  ...telemetryMocks,
}));

const networkingMocks = vi.hoisted(() => ({
  listNetworkingSessions: vi.fn(async () => ({ sessions: [{ id: 'session-1' }] })),
  getNetworkingSessionRuntime: vi.fn(async () => ({ id: 'runtime-1' })),
}));

vi.mock('../../services/networking.js', () => ({
  __esModule: true,
  ...networkingMocks,
}));

const engagementMocks = vi.hoisted(() => ({
  generateNotificationStream: vi.fn(() => [
    { id: 'notification-1', message: 'Welcome', createdAt: '2024-05-01T10:00:00Z' },
    { id: 'notification-2', message: 'Reminder', createdAt: '2024-05-02T10:00:00Z' },
  ]),
  generateMessageAlerts: vi.fn(() => [
    { id: 'thread-1', subject: 'Project', unread: true },
  ]),
}));

vi.mock('../../services/engagementService.js', () => ({
  __esModule: true,
  ...engagementMocks,
}));

const searchMocks = vi.hoisted(() => ({
  searchPeople: vi.fn(async () => [{ id: 'person-1', name: 'Taylor Rivera' }]),
}));

vi.mock('../../services/search.js', () => ({
  __esModule: true,
  ...searchMocks,
}));

const apiClientMocks = vi.hoisted(() => {
  const apiClientGet = vi.fn(async () => ({ data: { items: [], total: 0 } }));
  const client = { get: apiClientGet };
  return { apiClientGet, client };
});

vi.mock('../../services/apiClient.js', () => ({
  __esModule: true,
  apiClient: apiClientMocks.client,
  default: apiClientMocks.client,
}));

const sessionMocks = vi.hoisted(() => {
  const state = {
    session: {
      id: 'user-1',
      name: 'Taylor Rivera',
      memberships: ['company'],
      permissions: ['projects.manage', 'networking.manage'],
      featureFlags: ['networking:enabled'],
      restrictions: [],
    },
    isAuthenticated: true,
  };

  const reset = () => {
    state.session = {
      id: 'user-1',
      name: 'Taylor Rivera',
      memberships: ['company'],
      permissions: ['projects.manage', 'networking.manage'],
      featureFlags: ['networking:enabled'],
      restrictions: [],
    };
    state.isAuthenticated = true;
  };

  return { state, reset };
});

vi.mock('../useSession.js', () => ({
  __esModule: true,
  default: () => sessionMocks.state,
}));

vi.mock('../useDebounce.js', () => ({
  __esModule: true,
  default: (value) => value,
}));

const { state: sessionState, reset: resetSession } = sessionMocks;

const storageStore = new Map();
const storageMock = {
  getItem: (key) => (storageStore.has(key) ? storageStore.get(key) : null),
  setItem: (key, value) => {
    storageStore.set(key, `${value}`);
    return null;
  },
  removeItem: (key) => {
    storageStore.delete(key);
  },
  clear: () => {
    storageStore.clear();
  },
};

Object.defineProperty(window, 'localStorage', {
  value: storageMock,
  configurable: true,
});

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {},
    configurable: true,
  });
}

globalThis.crypto.randomUUID = vi.fn(() => 'uuid-mock');

beforeEach(() => {
  mockUseCachedResource.mockClear();
  mockUseCachedResource.nextReturn = null;
  storageMock.clear();
  resetSession();
  vi.clearAllMocks();
  globalThis.crypto.randomUUID.mockClear();
});

afterEach(() => {
  mockUseCachedResource.nextReturn = null;
});

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('useFreelancerReferences', () => {
  it('normalises references and supports settings updates', async () => {
    const refresh = vi.fn(() => Promise.resolve());
    const referenceSnapshot = {
      references: [
        {
          id: 'ref-1',
          client: 'Lumina',
          rating: 5,
          verified: true,
          status: 'published',
          lastInteractionAt: '2024-05-10T12:00:00Z',
        },
        {
          id: 'ref-2',
          client: 'Atlas',
          rating: 4,
          verified: false,
          status: 'pending',
          lastInteractionAt: '2024-04-10T12:00:00Z',
        },
      ],
      settings: { autoRequest: true },
      insights: { invitesSent: 8, responseRate: 0.5 },
    };

    setNextResourceState(() =>
      createResourceState({
        data: referenceSnapshot,
        refresh,
      }),
    );

    const { result } = renderHook(() => useFreelancerReferences({ freelancerId: 'freelancer-1' }));
    await waitFor(() => expect(result.current.references.length).toBeGreaterThan(0));
    expect(result.current.summary[0].value).toBeGreaterThanOrEqual(1);

    await act(async () => {
      await result.current.updateSettings({ autoRequest: false });
    });

    expect(reputationMocks.updateReferenceSettings).toHaveBeenCalledWith(
      'freelancer-1',
      expect.objectContaining({ autoRequest: false }),
    );
    expect(refresh).not.toHaveBeenCalled();

    const refreshSpy = result.current.refresh;

    await act(async () => {
      await result.current.requestReference({ clientName: 'Taylor', email: 'taylor@example.com' });
    });

    expect(reputationMocks.requestReferenceInvite).toHaveBeenCalledWith(
      'freelancer-1',
      expect.objectContaining({ clientName: 'Taylor', email: 'taylor@example.com' }),
    );
    expect(refreshSpy).toHaveBeenCalledWith(expect.objectContaining({ force: true }));
  });
});

describe('useFreelancerReviews', () => {
  it('creates reviews and refreshes cache', async () => {
    const refresh = vi.fn(() => Promise.resolve());
    setNextResourceState(() => createResourceState({ data: reputationMocks.fetchFreelancerReviews.mock.results[0]?.value, refresh }));

    const { result } = renderHook(() => useFreelancerReviews({ freelancerId: 'freelancer-1' }));
    await waitFor(() => expect(result.current.reviews.length).toBeGreaterThan(0));

    await act(async () => {
      await result.current.createReview({ title: 'Great partner' });
    });

    expect(reputationMocks.createFreelancerReview).toHaveBeenCalledWith(
      'freelancer-1',
      expect.objectContaining({ title: 'Great partner' }),
    );
    expect(refresh).toHaveBeenCalledWith(expect.objectContaining({ force: true }));
  });
});

describe('computeTimelineAnalyticsFromClient', () => {
  it('aggregates engagement metrics accurately', () => {
    const analytics = computeTimelineAnalyticsFromClient(
      [
        {
          id: 'post-1',
          status: 'published',
          metrics: {
            totals: { impressions: 100, clicks: 10, comments: 2, reactions: 5, shares: 3, saves: 1 },
            trend: [
              { capturedAt: '2024-05-01', impressions: 60, clicks: 6, comments: 1, reactions: 3, shares: 1, saves: 0 },
              { capturedAt: '2024-05-02', impressions: 40, clicks: 4, comments: 1, reactions: 2, shares: 2, saves: 1 },
            ],
          },
        },
      ],
      [
        {
          id: 'entry-1',
          status: 'completed',
          startAt: '2024-04-01T00:00:00Z',
          endAt: '2024-04-02T00:00:00Z',
        },
      ],
    );

    expect(analytics.totals.impressions).toBe(100);
    expect(analytics.trend).toHaveLength(2);
    expect(analytics.topPosts[0].engagement).toBeGreaterThan(0);
  });
});

describe('useFreelancerTimeline', () => {
  it('supports offline post creation when network disabled', async () => {
    setNextResourceState(() => createResourceState({ data: timelineMocks.fetchFreelancerTimelineWorkspace.mock.results[0]?.value }));

    const { result } = renderHook(() =>
      useFreelancerTimeline({ freelancerId: null, fallbackPosts: [], fallbackEntries: [], fallbackWorkspace: { id: 'workspace-1' } }),
    );

    await act(async () => {
      await result.current.createPost({ title: 'Offline update' });
    });

    expect(result.current.posts[0].title).toBe('Offline update');
    expect(result.current.analytics.totals.posts).toBeGreaterThanOrEqual(1);
  });
});

describe('useGigOrderDetail', () => {
  it('enforces permission guard for gig order actions', async () => {
    projectGigMocks.fetchGigOrderDetail.mockResolvedValueOnce({
      order: { id: 'order-secure', permissions: { canManage: true } },
    });

    const { result } = renderHook(() => useGigOrderDetail('user-1', 'order-secure'));
    await waitFor(() => expect(result.current.data?.id).toBe('order-secure'));
    expect(result.current.canManageOrder).toBe(true);

    await act(async () => {
      await result.current.actions.addTimelineEvent({ note: 'Kickoff' });
    });

    expect(projectGigMocks.createGigTimelineEvent).toHaveBeenCalledWith('user-1', 'order-secure', expect.objectContaining({ note: 'Kickoff' }));
  });

  it('blocks actions when permission is not granted', async () => {
    projectGigMocks.fetchGigOrderDetail.mockResolvedValueOnce({
      order: { id: 'order-readonly', permissions: { canManage: false } },
    });

    const { result } = renderHook(() => useGigOrderDetail('user-1', 'order-readonly'));
    await waitFor(() => expect(result.current.data?.id).toBe('order-readonly'));
    expect(result.current.canManageOrder).toBe(false);

    await expect(
      act(async () => {
        await result.current.actions.sendMessage({ body: 'Hello' });
      }),
    ).rejects.toThrow('You do not have permission to manage this gig order.');
  });
});

describe('useGroups', () => {
  it('fetches directory with trimmed query', async () => {
    setNextResourceState(({ fetcher }) => {
      fetcher();
      return createResourceState({ data: { items: [{ id: 'group-1' }] } });
    });

    renderHook(() => useGroupDirectory({ query: '  Product  ', focus: 'community' }));

    await waitFor(() => expect(groupsMocks.listGroups).toHaveBeenCalled());
    expect(groupsMocks.listGroups).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'Product', focus: 'community' }),
    );
  });

  it('avoids fetching profile when identifier is missing', async () => {
    setNextResourceState(() => createResourceState());
    renderHook(() => useGroupProfile(null));
    expect(groupsMocks.getGroupProfile).not.toHaveBeenCalled();
  });
});

describe('useHeadhunterDashboard', () => {
  it('builds summary cards from dashboard payload', async () => {
    setNextResourceState(() =>
      createResourceState({ data: headhunterMocks.fetchHeadhunterDashboard.mock.results[0]?.value ?? { pipelineSummary: {}, mandatePortfolio: {} } }),
    );
    const { result } = renderHook(() => useHeadhunterDashboard({ workspaceId: 'ws-1' }));
    await waitFor(() => expect(result.current.summaryCards.length).toBeGreaterThanOrEqual(3));
    expect(result.current.summaryCards[0].value).toBe(3);
  });
});

describe('useHomeExperience', () => {
  it('hydrates experience data with remote payloads', async () => {
    const { result } = renderHook(() => useHomeExperience({ enabled: true, limit: 2 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.settings.heroHeadline).toBe('Test headline');
    expect(creationStudioMocks.listCreationStudioItems).toHaveBeenCalled();
    expect(result.current.data.marketing.personas[0].id).toBe('ops');
  });
});

describe('useIdentityVerification', () => {
  it('saves verification state with actor roles', async () => {
    const refresh = vi.fn(() => Promise.resolve());
    setNextResourceState(() =>
      createResourceState({ data: identityVerificationMocks.fetchIdentityVerification.mock.results[0]?.value, refresh }),
    );

    const { result } = renderHook(() => useIdentityVerification({ userId: 'user-1', profileId: 'profile-1' }));
    await waitFor(() => expect(result.current.data.current.status).toBe('pending'));

    await act(async () => {
      await result.current.save({ note: 'Updated' });
    });

    expect(identityVerificationMocks.saveIdentityVerification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', profileId: 'profile-1' }),
    );
    expect(refresh).toHaveBeenCalledWith(expect.objectContaining({ force: true }));
  });
});

describe('useIntegrationControlTower', () => {
  it('updates connectors using actor context', async () => {
    const { result } = renderHook(() => useIntegrationControlTower({ workspaceId: 'workspace-1' }));
    await waitFor(() => expect(integrationsMocks.fetchIntegrationControlTower).toHaveBeenCalled());

    await act(async () => {
      await result.current.toggleConnection('crm', 'disconnected');
    });

    expect(integrationsMocks.updateCrmIntegration).toHaveBeenCalledWith(
      'crm',
      expect.objectContaining({ actorId: 'user-1', workspaceId: 'workspace-1', status: 'disconnected' }),
    );
  });
});

describe('useInterview resources', () => {
  it('does not fetch room details without identifier', () => {
    setNextResourceState(() => createResourceState());
    renderHook(() => useInterviewRoom({ roomId: null }));
    expect(interviewsMocks.fetchInterviewRoom).not.toHaveBeenCalled();
  });

  it('hydrates workflow state when enabled', () => {
    setNextResourceState(() => createResourceState({ data: { id: 'workflow-1' } }));
    renderHook(() => useInterviewWorkflow({ workspaceId: 'workspace-1' }));
    expect(mockUseCachedResource).toHaveBeenCalled();
  });
});

describe('useLearningHub', () => {
  it('builds summary cards from learning data', async () => {
    setNextResourceState(() =>
      createResourceState({
        data: {
          summary: {
            inProgressCourses: 2,
            totalCourses: 6,
            completionRate: 60,
            completedCourses: 3,
            mentoringSessionsScheduled: 1,
            upcomingRenewals: 1,
            nextRenewal: { name: 'AWS Cert', expirationDate: new Date().toISOString() },
          },
          serviceLines: [],
          certifications: [],
          recommendations: [],
        },
      }),
    );
    const { result } = renderHook(() => useLearningHub({ freelancerId: 'freelancer-1' }));
    await waitFor(() => expect(result.current.summaryCards.length).toBe(4));
    expect(result.current.summaryCards[0].value).toBe(2);
  });
});

describe('useLiveServiceTelemetry', () => {
  it('refreshes telemetry snapshots on demand', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLiveServiceTelemetry({ refreshIntervalMs: 0 }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refresh();
    });

    expect(telemetryMocks.fetchLiveServiceTelemetry).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});

describe('useLocalCollection', () => {
  it('manages local items with persistence', () => {
    const { result } = renderHook(() => useLocalCollection('tasks', { seed: [{ id: 'seed-1', name: 'Seed task' }] }));
    expect(result.current.items.length).toBe(1);

    act(() => {
      result.current.createItem({ name: 'New task' });
    });

    expect(result.current.items.length).toBe(2);
    expect(window.localStorage.getItem('gigvora:web:collection:tasks')).not.toBeNull();
  });
});

describe('useNetworkingAccess', () => {
  it('provides reason when networking is restricted', () => {
    sessionState.session = {
      id: 'user-2',
      name: 'Guest',
      memberships: ['guest'],
      permissions: [],
      featureFlags: [],
      restrictions: ['networking:suspended'],
    };
    const { result } = renderHook(() => useNetworkingAccess());
    expect(result.current.canManageNetworking).toBe(false);
    expect(result.current.reason).toContain('temporarily suspended');
  });
});

describe('useNetworkingSessions', () => {
  it('requests networking sessions with cache key', async () => {
    setNextResourceState(({ fetcher }) => {
      fetcher();
      return createResourceState({ data: { sessions: [{ id: 'session-1' }] } });
    });

    renderHook(() => useNetworkingSessions({ companyId: 'company-1', lookbackDays: 30 }));
    await waitFor(() => expect(networkingMocks.listNetworkingSessions).toHaveBeenCalled());
  });

  it('skips runtime fetch when session id missing', () => {
    setNextResourceState(() => createResourceState());
    renderHook(() => useNetworkingSessionRuntime(null));
    expect(networkingMocks.getNetworkingSessionRuntime).not.toHaveBeenCalled();
  });
});

describe('useNotificationCenter', () => {
  it('tracks unread notifications and threads', () => {
    const { result } = renderHook(() => useNotificationCenter({ id: 'user-1' }));
    expect(result.current.unreadNotificationCount).toBe(2);
    expect(result.current.unreadMessageCount).toBe(1);

    act(() => {
      result.current.markNotificationAsRead('notification-1');
      result.current.markThreadAsRead('thread-1');
    });

    expect(result.current.unreadNotificationCount).toBe(1);
    expect(result.current.unreadMessageCount).toBe(0);
  });
});

describe('useOpportunityListing', () => {
  it('invokes API client with normalised filters', async () => {
    setNextResourceState(({ fetcher }) => {
      fetcher({ signal: undefined });
      return createResourceState({ data: { items: [] } });
    });

    renderHook(() =>
      useOpportunityListing('gigs', '  design  ', {
        page: 2,
        pageSize: 10,
        filters: { skills: ['react ', '  node'] },
        sort: ['-createdAt'],
        includeFacets: true,
      }),
    );

    await waitFor(() => expect(apiClientMocks.apiClientGet).toHaveBeenCalled());
    expect(apiClientMocks.apiClientGet.mock.calls[0][1]).toMatchObject({
      params: expect.objectContaining({ page: 2, pageSize: 10, includeFacets: 'true' }),
    });
  });
});

describe('usePeopleSearch', () => {
  it('queries people when search term is long enough', async () => {
    const { result } = renderHook(() => usePeopleSearch('Taylor', { minLength: 3 }));
    await waitFor(() => expect(result.current.results.length).toBe(1));
    expect(searchMocks.searchPeople).toHaveBeenCalledWith('Taylor', expect.any(Object));
  });
});

describe('useProjectGigManagement', () => {
  it('allows actions when permissions are granted', async () => {
    const initialData = { access: { canManage: true } };
    const { result } = renderHook(() => useProjectGigManagement('user-1', { initialData }));
    await waitFor(() => expect(projectGigMocks.fetchProjectGigManagement).toHaveBeenCalled());

    await act(async () => {
      await result.current.actions.createProject({ name: 'New project' });
    });

    expect(projectGigMocks.createProject).toHaveBeenCalledWith('user-1', expect.objectContaining({ name: 'New project' }));
  });

  it('blocks actions when canManage flag is false', async () => {
    const initialData = { access: { canManage: false } };
    const { result } = renderHook(() => useProjectGigManagement('user-1', { initialData }));

    await expect(
      act(async () => {
        await result.current.actions.createProject({ name: 'Blocked project' });
      }),
    ).rejects.toThrow('You do not have permission to create project workspaces.');
  });
});
