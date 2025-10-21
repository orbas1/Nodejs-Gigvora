import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../apiClient.js', () => {
  const client = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    writeCache: vi.fn(),
    removeCache: vi.fn(),
    ApiError: class extends Error {},
    API_BASE_URL: 'https://api.gigvora.test',
  };

  globalThis.__gigvoraApiClientMock = client;

  return {
    apiClient: client,
    default: client,
    ApiError: client.ApiError,
    API_BASE_URL: client.API_BASE_URL,
  };
});

import * as adsService from '../ads.js';
import * as affiliateSettingsService from '../affiliateSettings.js';
import * as agencyService from '../agency.js';
import * as agencyAiService from '../agencyAi.js';
import * as agencyClientKanbanService from '../agencyClientKanban.js';
import * as agencyCreationStudioService from '../agencyCreationStudio.js';
import * as agencyEscrowService from '../agencyEscrow.js';
import * as agencyInboxService from '../agencyInbox.js';
import * as agencyIntegrationsService from '../agencyIntegrations.js';
import * as agencyJobManagementService from '../agencyJobManagement.js';
import * as agencyMentoringService from '../agencyMentoring.js';
import * as agencyNetworkingService from '../agencyNetworking.js';
import * as agencyProjectManagementService from '../agencyProjectManagement.js';
import * as agencyTimelineService from '../agencyTimeline.js';
import * as agencyWalletService from '../agencyWallet.js';
import * as agencyWorkforceService from '../agencyWorkforce.js';
import * as analyticsService from '../analytics.js';
import * as appearanceManagementService from '../appearanceManagement.js';
import * as authService from '../auth.js';

function getMockApiClient() {
  const mock = globalThis.__gigvoraApiClientMock;
  if (!mock) {
    throw new Error('apiClient mock was not initialised');
  }
  return mock;
}

function resetApiClientMock() {
  const mockApiClient = getMockApiClient();
  mockApiClient.get.mockReset();
  mockApiClient.post.mockReset();
  mockApiClient.put.mockReset();
  mockApiClient.patch.mockReset();
  mockApiClient.delete.mockReset();
  mockApiClient.writeCache.mockReset();
  mockApiClient.removeCache.mockReset();
}

let mockApiClient;

beforeAll(() => {
  mockApiClient = getMockApiClient();
});

beforeEach(() => {
  resetApiClientMock();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ads service', () => {
  it('serialises dashboard parameters with admin headers', async () => {
    mockApiClient.get.mockResolvedValueOnce({});

    await adsService.getAdsDashboard({
      surfaces: [' home ', 'hero', null, 'hero'],
      context: { placement: 'banner' },
      bypassCache: true,
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/ads/dashboard', {
      params: {
        surfaces: 'home,hero',
        bypassCache: 'true',
        context: JSON.stringify({ placement: 'banner' }),
      },
      signal: undefined,
      headers: expect.objectContaining({ 'x-user-type': 'admin' }),
    });
  });

  it('normalises placement list responses', async () => {
    mockApiClient.get.mockResolvedValueOnce({ placements: [{ id: 'placement' }] });
    const placements = await adsService.fetchAdPlacements({ surface: 'dashboard' });
    expect(placements).toEqual([{ id: 'placement' }]);
  });
});

describe('affiliate settings service', () => {
  it('requires a userId for dashboard fetches', async () => {
    await expect(affiliateSettingsService.fetchAffiliateDashboard()).rejects.toThrow(/userId/i);
  });

  it('updates settings via PUT', async () => {
    mockApiClient.put.mockResolvedValueOnce({ ok: true });
    await affiliateSettingsService.updateAffiliateSettings({ tier: 'gold' });
    expect(mockApiClient.put).toHaveBeenCalledWith('/admin/affiliate-settings', { tier: 'gold' }, { signal: undefined });
  });
});

describe('agency core service', () => {
  it('filters dashboard params and flags freshness', async () => {
    mockApiClient.get.mockResolvedValueOnce({});
    await agencyService.fetchAgencyDashboard({ workspaceId: '', workspaceSlug: 'studio', lookbackDays: 14, fresh: true });
    expect(mockApiClient.get).toHaveBeenCalledWith('/agency/dashboard', {
      params: { workspaceSlug: 'studio', lookbackDays: 14, fresh: 'true' },
      signal: undefined,
    });
  });

  it('normalises calendar type arrays', async () => {
    mockApiClient.get.mockResolvedValueOnce({});
    await agencyService.fetchAgencyCalendar({ types: ['events', ' reminders '], status: 'active' });
    expect(mockApiClient.get).toHaveBeenCalledWith('/agency/calendar', {
      params: expect.objectContaining({ types: 'events, reminders ' }),
      signal: undefined,
    });
  });

  it('sends connection responses with expected payload', async () => {
    mockApiClient.post.mockResolvedValueOnce({});
    await agencyService.respondToAgencyConnection('connection-1', 'accept');
    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/agency/profile/connections/connection-1/respond',
      { decision: 'accept' },
      { signal: undefined },
    );
  });
});

describe('agency AI service', () => {
  it('applies workspace identifiers as params', async () => {
    mockApiClient.put.mockResolvedValueOnce({});
    await agencyAiService.updateAgencyAiSettings({ workspaceId: '123', strategy: 'assist' });
    expect(mockApiClient.put).toHaveBeenCalledWith(
      '/agency/ai-control',
      { strategy: 'assist' },
      { params: { workspaceId: '123', workspaceSlug: undefined } },
    );
  });
});

describe('agency client kanban service', () => {
  it('unwraps data payloads when fetching board state', async () => {
    mockApiClient.get.mockResolvedValueOnce({ data: { columns: [] } });
    const board = await agencyClientKanbanService.fetchAgencyClientKanban({ workspaceId: 'ws-1' });
    expect(mockApiClient.get).toHaveBeenCalledWith('/agency/client-kanban', { params: { workspaceId: 'ws-1' } });
    expect(board).toEqual({ columns: [] });
  });

  it('passes workspace context when deleting entities', async () => {
    mockApiClient.delete.mockResolvedValueOnce({});
    await agencyClientKanbanService.deleteKanbanCard('card-1', { workspaceId: 'ws-2' });
    expect(mockApiClient.delete).toHaveBeenCalledWith('/agency/client-kanban/cards/card-1', {
      body: { workspaceId: 'ws-2' },
    });
  });
});

describe('agency creation studio service', () => {
  it('throws when itemId missing for detail fetch', async () => {
    await expect(() => agencyCreationStudioService.fetchCreationStudioItem()).toThrow(/itemId/);
  });

  it('sanitises list filters', async () => {
    mockApiClient.get.mockResolvedValueOnce({});
    await agencyCreationStudioService.fetchCreationStudioItems({ page: 1, search: '', status: 'draft' });
    expect(mockApiClient.get).toHaveBeenCalledWith('/agency/creation-studio/items', {
      params: { page: 1, status: 'draft' },
      signal: undefined,
    });
  });
});

describe('agency escrow service', () => {
  it('sends account creation payloads with params', async () => {
    mockApiClient.post.mockResolvedValueOnce({ accountId: 'escrow-1' });
    await agencyEscrowService.createAgencyEscrowAccount({ currency: 'USD' }, { workspaceId: 'ws' });
    expect(mockApiClient.post).toHaveBeenCalledWith('/agency/escrow/accounts', { currency: 'USD' }, {
      params: { workspaceId: 'ws' },
      signal: undefined,
    });
  });
});

describe('agency inbox service', () => {
  it('requires workspaceId for workspace fetches', async () => {
    await expect(() => agencyInboxService.fetchAgencyInboxWorkspace()).toThrow(/workspaceId/);
  });

  it('applies workspace identifiers for deletion', async () => {
    mockApiClient.delete.mockResolvedValueOnce({});
    await agencyInboxService.deleteAgencyInboxRoutingRule('rule-1', { workspaceId: 'ws-9' });
    expect(mockApiClient.delete).toHaveBeenCalledWith('/agency/inbox/routing-rules/rule-1', {
      body: { workspaceId: 'ws-9' },
    });
  });
});

describe('agency integrations service', () => {
  it('validates payload objects when creating integrations', async () => {
    await expect(() => agencyIntegrationsService.createAgencyIntegration(null)).toThrow(/payload/);
  });

  it('rotates credentials for a given integration', async () => {
    mockApiClient.post.mockResolvedValueOnce({});
    await agencyIntegrationsService.rotateAgencyIntegrationSecret('int-1', { rotate: true });
    expect(mockApiClient.post).toHaveBeenCalledWith('/agency/integrations/int-1/secrets', { rotate: true });
  });
});

describe('agency job management service', () => {
  it('fetches jobs with filter params', async () => {
    mockApiClient.get.mockResolvedValueOnce({});
    await agencyJobManagementService.fetchAgencyJobs({ workspaceId: 'ws', status: 'open', page: 2, pageSize: 10 });
    expect(mockApiClient.get).toHaveBeenCalledWith('/agency/job-management/jobs', {
      params: { workspaceId: 'ws', status: 'open', page: 2, pageSize: 10 },
    });
  });

  it('defaults memberId when removing favourites', async () => {
    mockApiClient.delete.mockResolvedValueOnce({});
    await agencyJobManagementService.unfavoriteAgencyJob({ jobId: 'job-1', workspaceId: 'ws' });
    expect(mockApiClient.delete).toHaveBeenCalledWith('/agency/job-management/jobs/job-1/favorites/me', {
      params: { workspaceId: 'ws' },
    });
  });
});

describe('agency mentoring service', () => {
  it('cleans falsy params before requesting data', async () => {
    mockApiClient.get.mockResolvedValueOnce({});
    await agencyMentoringService.listAgencyMentoringSessions({ status: '', limit: 10 });
    expect(mockApiClient.get).toHaveBeenCalledWith('/agency/mentoring/sessions', {
      params: { limit: 10 },
      signal: undefined,
    });
  });
});

describe('agency networking service', () => {
  it('merges workspace identifiers into payloads', async () => {
    mockApiClient.post.mockResolvedValueOnce({ bookingId: 'booking-1' });
    await agencyNetworkingService.createAgencyNetworkingBooking({ topic: 'growth' }, { workspaceId: 'ws-1' });
    expect(mockApiClient.post).toHaveBeenCalledWith('/agency/networking/bookings', { topic: 'growth', workspaceId: 'ws-1' }, {
      signal: undefined,
    });
  });
});

describe('agency project management service', () => {
  it('requires identifiers for destructive actions', async () => {
    await expect(agencyProjectManagementService.deleteAgencyProject()).rejects.toThrow(/projectId/);
  });

  it('updates automatch freelancer entries', async () => {
    mockApiClient.put.mockResolvedValueOnce({});
    await agencyProjectManagementService.updateAgencyProjectAutoMatchFreelancer('proj-1', 'entry-1', { weight: 0.8 });
    expect(mockApiClient.put).toHaveBeenCalledWith(
      '/agency/project-management/projects/proj-1/automatch/freelancers/entry-1',
      { weight: 0.8 },
    );
  });
});

describe('agency timeline service', () => {
  it('builds timeline queries with provided filters', () => {
    const query = agencyTimelineService.buildTimelineQuery({ workspaceId: 'ws', status: 'draft', limit: 20 });
    expect(query).toEqual({ workspaceId: 'ws', status: 'draft', limit: 20 });
  });

  it('requests analytics for posts with lookback filtering', async () => {
    mockApiClient.get.mockResolvedValueOnce({});
    await agencyTimelineService.fetchAgencyTimelinePostAnalytics('post-1', { lookbackDays: 7 });
    expect(mockApiClient.get).toHaveBeenCalledWith('/agency/timeline/posts/post-1/analytics', {
      params: { lookbackDays: 7 },
      signal: undefined,
    });
  });
});

describe('agency wallet service', () => {
  it('produces stable cache keys for overview and ledger queries', () => {
    expect(agencyWalletService.buildWalletOverviewCacheKey('ws')).toBe('agencyWallet:overview:ws');
    expect(agencyWalletService.buildLedgerCacheKey('acct', { page: 1, pageSize: 20, entryType: 'credit' })).toBe(
      'agencyWallet:ledger:acct:credit:1:20',
    );
  });

  it('returns settings payloads from API responses', async () => {
    mockApiClient.get.mockResolvedValueOnce({ settings: { currency: 'USD' } });
    const settings = await agencyWalletService.fetchWalletSettings({ workspaceId: 'ws-5' });
    expect(mockApiClient.get).toHaveBeenCalledWith('/agency/wallet/settings', {
      params: { workspaceId: 'ws-5' },
      signal: undefined,
    });
    expect(settings).toEqual({ currency: 'USD' });
  });

  it('invalidates caches through apiClient', () => {
    agencyWalletService.invalidateWalletOverview('ws');
    expect(mockApiClient.removeCache).toHaveBeenCalledWith('agencyWallet:overview:ws');
  });
});

describe('agency workforce service', () => {
  it('attaches query params when deleting members', async () => {
    mockApiClient.delete.mockResolvedValueOnce({});
    await agencyWorkforceService.deleteWorkforceMember('member-1', { workspaceId: 'ws' });
    expect(mockApiClient.delete).toHaveBeenCalledWith('/agency/workforce/members/member-1', { params: { workspaceId: 'ws' } });
  });
});

describe('analytics service', () => {
  let originalSendBeacon;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    mockApiClient.post.mockReset();
    originalSendBeacon = window.navigator.sendBeacon;
    Object.defineProperty(window.navigator, 'sendBeacon', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue(true),
    });
  });

  afterEach(() => {
    Object.defineProperty(window.navigator, 'sendBeacon', {
      configurable: true,
      writable: true,
      value: originalSendBeacon,
    });
    vi.useRealTimers();
  });

  it('attempts to send events with navigator.sendBeacon first', async () => {
    await analyticsService.analytics.track('event-fired', { scope: 'dashboard' });
    expect(window.navigator.sendBeacon).toHaveBeenCalledTimes(1);
    expect(mockApiClient.post).not.toHaveBeenCalledWith('/analytics/events', expect.anything());
  });

  it('falls back to apiClient.post when sendBeacon fails', async () => {
    window.navigator.sendBeacon.mockReturnValueOnce(false);
    mockApiClient.post.mockResolvedValueOnce({ ok: true });

    await analyticsService.analytics.track('event-fallback', {});

    expect(mockApiClient.post).toHaveBeenCalledWith('/analytics/events', expect.objectContaining({ eventName: 'event-fallback' }));
  });

  it('buffers events when network requests fail and flushes later', async () => {
    window.navigator.sendBeacon.mockReturnValueOnce(false);
    mockApiClient.post
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ok: true });

    await analyticsService.analytics.track('event-buffered', {});
    expect(localStorage.getItem('gigvora:web:analytics:queue')).toBeTruthy();

    await vi.advanceTimersByTimeAsync(10000);
    expect(mockApiClient.post).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('gigvora:web:analytics:queue')).toBeNull();
  });
});

describe('appearance management service', () => {
  it('validates identifiers before destructive operations', async () => {
    await expect(appearanceManagementService.deleteAppearanceTheme()).rejects.toThrow(/themeId/);
  });

  it('publishes layouts through the API', async () => {
    mockApiClient.post.mockResolvedValueOnce({});
    await appearanceManagementService.publishAppearanceLayout('layout-1', { version: 'v2' });
    expect(mockApiClient.post).toHaveBeenCalledWith('/admin/appearance/layouts/layout-1/publish', { version: 'v2' });
  });
});

describe('auth service', () => {
  it('enforces credentials for password logins', async () => {
    await expect(authService.loginWithPassword({ email: '', password: '' })).rejects.toThrow(/Email and password/);
  });

  it('delegates admin login to password helper with scope', async () => {
    mockApiClient.post.mockResolvedValueOnce({ token: 'abc' });
    await authService.adminLogin({ email: 'admin@example.com', password: 'secret' });
    expect(mockApiClient.post).toHaveBeenCalledWith('/auth/admin/login', {
      email: 'admin@example.com',
      password: 'secret',
    });
  });
});
