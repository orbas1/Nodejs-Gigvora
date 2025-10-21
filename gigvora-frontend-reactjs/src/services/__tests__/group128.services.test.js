import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../apiClient.js', () => {
  const mock = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    readCache: vi.fn(),
    writeCache: vi.fn(),
    removeCache: vi.fn(),
  };
  return {
    apiClient: mock,
    default: mock,
  };
});

import { apiClient } from '../apiClient.js';

import * as financeService from '../finance.js';
import * as freelancerService from '../freelancer.js';
import * as freelancerAgencyService from '../freelancerAgency.js';
import * as freelancerAllianceService from '../freelancerAlliance.js';
import * as freelancerAutoMatchService from '../freelancerAutoMatch.js';
import * as freelancerCalendarService from '../freelancerCalendar.js';
import * as freelancerDashboardService from '../freelancerDashboard.js';
import * as freelancerDisputesService from '../freelancerDisputes.js';
import * as freelancerEscrowService from '../freelancerEscrow.js';
import * as freelancerNetworkingService from '../freelancerNetworking.js';
import * as freelancerPortfolioService from '../freelancerPortfolio.js';
import * as freelancerProfileHubService from '../freelancerProfileHub.js';
import * as freelancerProfileOverviewService from '../freelancerProfileOverview.js';
import * as freelancerTimelineService from '../freelancerTimeline.js';
import * as gdprSettingsService from '../gdprSettings.js';
import * as gigBuilderService from '../gigBuilder.js';
import * as gigManagerService from '../gigManager.js';
import * as groupsService from '../groups.js';
import * as headhunterService from '../headhunter.js';
import * as homepageSettingsService from '../homepageSettings.js';

beforeEach(() => {
  vi.clearAllMocks();
});

// Finance service

describe('finance service', () => {
  it('builds cache keys based on the provided user identifier', () => {
    expect(financeService.buildFinanceOverviewCacheKey('user-1')).toBe('finance:controlTower:user-1');
    expect(financeService.buildFinanceOverviewCacheKey()).toBe('finance:controlTower:self');
  });

  it('fetches the control tower overview with optional parameters', async () => {
    apiClient.get.mockResolvedValue({ overview: {} });
    const signal = new AbortController().signal;

    await financeService.fetchControlTowerOverview({ userId: 'user-1', signal, forceRefresh: true });

    expect(apiClient.get).toHaveBeenCalledWith('/finance/control-tower/overview', {
      params: { userId: 'user-1', refresh: 'true' },
      signal,
    });
  });

  it('invalidates cached finance overview data', () => {
    financeService.invalidateFinanceOverviewCache('user-2');

    expect(apiClient.removeCache).toHaveBeenCalledWith('finance:controlTower:user-2');
  });

  it('throws when finance insights are requested without a freelancer id', async () => {
    await expect(financeService.fetchFreelancerFinanceInsights()).rejects.toThrow(/freelancerId is required/i);
  });

  it('requests freelancer finance insights when an id is supplied', async () => {
    apiClient.get.mockResolvedValue({});

    await financeService.fetchFreelancerFinanceInsights('freelancer-9');

    expect(apiClient.get).toHaveBeenCalledWith('/finance/freelancers/freelancer-9/insights', { signal: undefined });
  });
});

// Freelancer core service

describe('freelancer service', () => {
  it('fetches the freelancer dashboard using normalised parameters', async () => {
    apiClient.get.mockResolvedValue({});
    const signal = new AbortController().signal;

    await freelancerService.fetchFreelancerDashboard({ freelancerId: 'abc', limit: 10 }, { signal });

    expect(apiClient.get).toHaveBeenCalledWith('/freelancer/dashboard', {
      params: { freelancerId: 'abc', limit: 10 },
      signal,
    });
  });

  it('requires a freelancer id to fetch the dashboard', async () => {
    await expect(freelancerService.fetchFreelancerDashboard({})).rejects.toThrow(/freelancerId is required/i);
  });

  it('creates, updates, publishes and fetches gigs through api client', async () => {
    apiClient.post.mockResolvedValue({ id: 'gig-1' });
    apiClient.put.mockResolvedValue({ id: 'gig-1' });

    await freelancerService.createFreelancerGig({ title: 'Gig' });
    await freelancerService.updateFreelancerGig('gig-1', { title: 'New' });
    await freelancerService.publishFreelancerGig('gig-1', { publish: true });
    await freelancerService.getFreelancerGig('gig-1');

    expect(apiClient.post).toHaveBeenCalledWith('/freelancer/gigs', { title: 'Gig' }, {});
    expect(apiClient.put).toHaveBeenCalledWith('/freelancer/gigs/gig-1', { title: 'New' }, {});
    expect(apiClient.post).toHaveBeenCalledWith('/freelancer/gigs/gig-1/publish', { publish: true }, {});
    expect(apiClient.get).toHaveBeenCalledWith('/freelancer/gigs/gig-1', {});
  });

  it('rejects gig updates when no gig id is provided', async () => {
    await expect(freelancerService.updateFreelancerGig('', {})).rejects.toThrow(/gigId is required/i);
  });

  it('fetches purchased gig workspace with refresh flag when requested', async () => {
    apiClient.get.mockResolvedValue({});

    await freelancerService.fetchFreelancerPurchasedGigWorkspace('user-1', { fresh: true });

    expect(apiClient.get).toHaveBeenCalledWith('/freelancers/user-1/purchased-gigs', {
      params: { fresh: 'true' },
      signal: undefined,
    });
  });
});

// Freelancer agency service

describe('freelancer agency service', () => {
  it('requires a freelancer id to load collaborations', async () => {
    await expect(freelancerAgencyService.fetchFreelancerAgencyCollaborations()).rejects.toThrow(
      /freelancerId is required/i,
    );
  });

  it('fetches collaborations with optional filters', async () => {
    apiClient.get.mockResolvedValue({});
    const signal = new AbortController().signal;

    await freelancerAgencyService.fetchFreelancerAgencyCollaborations('user-3', {
      lookbackDays: 30,
      includeInactive: true,
      signal,
    });

    expect(apiClient.get).toHaveBeenCalledWith('/freelancers/user-3/agency-collaborations', {
      signal,
      params: { lookbackDays: 30, includeInactive: true },
    });
  });
});

// Freelancer alliance service

describe('freelancer alliance service', () => {
  it('requires a freelancer id to load alliance dashboards', async () => {
    await expect(freelancerAllianceService.fetchFreelancerAllianceDashboard()).rejects.toThrow(
      /freelancerId is required/i,
    );
  });

  it('passes through the force flag as fresh query param', async () => {
    apiClient.get.mockResolvedValue({});

    await freelancerAllianceService.fetchFreelancerAllianceDashboard('freelancer-1', { force: true });

    expect(apiClient.get).toHaveBeenCalledWith('/users/freelancer-1/alliances', {
      params: { fresh: 'true' },
      signal: undefined,
    });
  });
});

// Freelancer auto match service

describe('freelancer auto match service', () => {
  it('throws when the freelancer id is missing', async () => {
    await expect(freelancerAutoMatchService.fetchAutoMatchOverview()).rejects.toThrow(/freelancerId is required/i);
  });

  it('normalises responses when fetching overview data', async () => {
    apiClient.get.mockResolvedValue({ data: { total: 5 } });

    const result = await freelancerAutoMatchService.fetchAutoMatchOverview('user-9');

    expect(result).toEqual({ total: 5 });
    expect(apiClient.get).toHaveBeenCalledWith('/freelancers/user-9/auto-match/overview', { signal: undefined });
  });

  it('prefers the preference property when updating preferences', async () => {
    apiClient.patch.mockResolvedValue({ data: { preference: { active: true } } });

    const result = await freelancerAutoMatchService.updateAutoMatchPreferences('user-2', { active: true });

    expect(result).toEqual({ active: true });
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/freelancers/user-2/auto-match/preferences',
      { active: true },
      { signal: undefined },
    );
  });

  it('requires the entry id to respond to a match', async () => {
    await expect(
      freelancerAutoMatchService.respondToAutoMatch('user-1', '', { decision: 'accept' }),
    ).rejects.toThrow(/freelancerId and entryId are required/i);
  });
});

// Freelancer calendar service

describe('freelancer calendar service', () => {
  it('converts filtering options to api parameters', () => {
    const signal = new AbortController().signal;

    freelancerCalendarService.fetchFreelancerCalendarEvents('user-1', {
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: '2024-01-10T00:00:00Z',
      types: ['call', 'deadline'],
      statuses: 'confirmed',
      limit: 50,
      lookbackDays: 2,
      lookaheadDays: 7,
      signal,
    });

    expect(apiClient.get).toHaveBeenCalledWith('/freelancer/user-1/calendar/events', {
      params: {
        start: new Date('2024-01-01T00:00:00Z').toISOString(),
        end: new Date('2024-01-10T00:00:00Z').toISOString(),
        types: 'call,deadline',
        statuses: 'confirmed',
        limit: 50,
        lookbackDays: 2,
        lookaheadDays: 7,
      },
    });
  });

  it('requires an event identifier for update and delete operations', () => {
    expect(() =>
      freelancerCalendarService.updateFreelancerCalendarEvent('user-1', '', { title: 'Meet' }),
    ).toThrow(/eventId is required/i);
    expect(() => freelancerCalendarService.deleteFreelancerCalendarEvent('user-1')).toThrow(/eventId is required/i);
  });

  it('posts calendar events with normalised payloads', () => {
    const payload = { title: 'Kick-off', startsAt: '2024-04-05', endsAt: new Date('2024-04-05T02:00:00Z') };

    freelancerCalendarService.createFreelancerCalendarEvent('user-1', payload, { actorId: 'actor-9' });

    expect(apiClient.post).toHaveBeenCalledWith('/freelancer/user-1/calendar/events', {
      ...payload,
      startsAt: new Date('2024-04-05').toISOString(),
      endsAt: new Date('2024-04-05T02:00:00Z').toISOString(),
      actorId: 'actor-9',
    });
  });
});

// Freelancer dashboard overview service

describe('freelancer dashboard service', () => {
  it('requires a freelancer id for dashboard operations', () => {
    expect(() => freelancerDashboardService.fetchFreelancerDashboardOverview()).toThrow(/freelancerId is required/i);
    expect(() => freelancerDashboardService.saveFreelancerDashboardOverview()).toThrow(/freelancerId is required/i);
  });

  it('delegates to the api client for read and write operations', () => {
    freelancerDashboardService.fetchFreelancerDashboardOverview('user-7');
    freelancerDashboardService.saveFreelancerDashboardOverview('user-7', { summary: 'Updated' });

    expect(apiClient.get).toHaveBeenCalledWith('/freelancers/user-7/dashboard-overview');
    expect(apiClient.put).toHaveBeenCalledWith('/freelancers/user-7/dashboard-overview', { summary: 'Updated' });
  });
});

// Freelancer disputes service

describe('freelancer disputes service', () => {
  it('requires identifiers for dispute operations', async () => {
    await expect(freelancerDisputesService.fetchDisputeDashboard()).rejects.toThrow(/freelancerId is required/i);
    await expect(freelancerDisputesService.createDispute()).rejects.toThrow(/freelancerId is required/i);
    await expect(freelancerDisputesService.fetchDisputeDetail('user', null)).rejects.toThrow(
      /freelancerId and disputeId are required/i,
    );
  });

  it('fetches and mutates disputes through api client', async () => {
    apiClient.get.mockResolvedValue({});
    apiClient.post.mockResolvedValue({});

    await freelancerDisputesService.fetchDisputeDashboard('user-1', { status: 'open' }, { signal: 'sig' });
    await freelancerDisputesService.createDispute('user-1', { reason: 'late delivery' });
    await freelancerDisputesService.fetchDisputeDetail('user-1', 'disp-9');
    await freelancerDisputesService.appendDisputeEvent('user-1', 'disp-9', { message: 'Update' });

    expect(apiClient.get).toHaveBeenCalledWith('/freelancer/user-1/disputes', {
      params: { status: 'open' },
      signal: 'sig',
    });
    expect(apiClient.post).toHaveBeenCalledWith('/freelancer/user-1/disputes', { reason: 'late delivery' }, {});
    expect(apiClient.get).toHaveBeenCalledWith('/freelancer/user-1/disputes/disp-9', {});
    expect(apiClient.post).toHaveBeenCalledWith(
      '/freelancer/user-1/disputes/disp-9/events',
      { message: 'Update' },
      {},
    );
  });
});

// Freelancer escrow service

describe('freelancer escrow service', () => {
  it('enforces the presence of required identifiers', async () => {
    await expect(freelancerEscrowService.fetchFreelancerEscrowOverview()).rejects.toThrow(/freelancerId is required/i);
    await expect(freelancerEscrowService.createFreelancerEscrowAccount()).rejects.toThrow(/freelancerId is required/i);
    await expect(freelancerEscrowService.updateFreelancerEscrowAccount('user', null, {})).rejects.toThrow(
      /freelancerId and accountId are required/i,
    );
    await expect(freelancerEscrowService.releaseFreelancerEscrowTransaction('user', '', {})).rejects.toThrow(
      /freelancerId and transactionId are required/i,
    );
  });

  it('normalises parameters and returns nested payloads when available', async () => {
    apiClient.get.mockResolvedValue({});
    apiClient.post.mockResolvedValueOnce({ account: { id: 'acc-1' } });
    apiClient.patch.mockResolvedValueOnce({ account: { id: 'acc-1', status: 'verified' } });
    apiClient.post.mockResolvedValueOnce({ transaction: { id: 'txn-1' } });

    await freelancerEscrowService.fetchFreelancerEscrowOverview('user-1', { status: 'pending', limit: 5 });
    const account = await freelancerEscrowService.createFreelancerEscrowAccount('user-1', { bank: 'ACME' });
    const updatedAccount = await freelancerEscrowService.updateFreelancerEscrowAccount('user-1', 'acc-1', { bank: 'ACME' });
    const transaction = await freelancerEscrowService.createFreelancerEscrowTransaction('user-1', { amount: 100 });

    expect(apiClient.get).toHaveBeenCalledWith('/freelancers/user-1/escrow/overview', {
      params: { status: 'pending', limit: 5 },
      signal: undefined,
    });
    expect(apiClient.post).toHaveBeenCalledWith('/freelancers/user-1/escrow/accounts', { bank: 'ACME' }, {});
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/freelancers/user-1/escrow/accounts/acc-1',
      { bank: 'ACME' },
      {},
    );
    expect(apiClient.post).toHaveBeenCalledWith('/freelancers/user-1/escrow/transactions', { amount: 100 }, {});
    expect(account).toEqual({ id: 'acc-1' });
    expect(updatedAccount).toEqual({ id: 'acc-1', status: 'verified' });
    expect(transaction).toEqual({ id: 'txn-1' });
  });
});

// Freelancer networking service

describe('freelancer networking service', () => {
  it('validates identifiers for every operation', () => {
    expect(() => freelancerNetworkingService.getFreelancerNetworkingDashboard()).toThrow(/freelancerId is required/i);
    expect(() => freelancerNetworkingService.bookFreelancerNetworkingSession('user', null)).toThrow(/sessionId is required/i);
    expect(() => freelancerNetworkingService.updateFreelancerNetworkingSignup('user', '')).toThrow(/signupId is required/i);
    expect(() => freelancerNetworkingService.deleteFreelancerNetworkingSignup('user', '')).toThrow(/signupId is required/i);
    expect(() => freelancerNetworkingService.updateFreelancerNetworkingConnection('user', '')).toThrow(/connectionId is required/i);
    expect(() => freelancerNetworkingService.deleteFreelancerNetworkingConnection('user', '')).toThrow(/connectionId is required/i);
    expect(() => freelancerNetworkingService.updateFreelancerNetworkingOrder('user', '')).toThrow(/orderId is required/i);
    expect(() => freelancerNetworkingService.deleteFreelancerNetworkingOrder('user', '')).toThrow(/orderId is required/i);
    expect(() => freelancerNetworkingService.updateFreelancerNetworkingAd('user', '')).toThrow(/campaignId is required/i);
    expect(() => freelancerNetworkingService.deleteFreelancerNetworkingAd('user', '')).toThrow(/campaignId is required/i);
  });

  it('routes dashboard and metrics requests with optional parameters', () => {
    const signal = new AbortController().signal;

    freelancerNetworkingService.getFreelancerNetworkingDashboard('user-1', {
      lookbackDays: 14,
      limitConnections: 8,
      signal,
    });
    freelancerNetworkingService.getFreelancerNetworkingMetrics('user-1', { lookbackDays: 7 });

    expect(apiClient.get).toHaveBeenCalledWith('/freelancers/user-1/networking/dashboard', {
      params: { lookbackDays: 14, limitConnections: 8 },
      signal,
    });
    expect(apiClient.get).toHaveBeenCalledWith('/freelancers/user-1/networking/metrics', {
      params: { lookbackDays: 7 },
      signal: undefined,
    });
  });

  it('manages networking sessions and signups through http verbs', () => {
    freelancerNetworkingService.bookFreelancerNetworkingSession('user-1', 'session-2', { notes: 'Bring deck' });
    freelancerNetworkingService.updateFreelancerNetworkingSignup('user-1', 'signup-3', { status: 'confirmed' });
    freelancerNetworkingService.deleteFreelancerNetworkingSignup('user-1', 'signup-3', { reason: 'conflict' });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/freelancers/user-1/networking/sessions/session-2/book',
      { notes: 'Bring deck' },
    );
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/freelancers/user-1/networking/signups/signup-3',
      { status: 'confirmed' },
    );
    expect(apiClient.delete).toHaveBeenCalledWith(
      '/freelancers/user-1/networking/signups/signup-3',
      { data: { reason: 'conflict' } },
    );
  });

  it('handles networking connections lifecycle', () => {
    freelancerNetworkingService.listFreelancerNetworkingConnections('user-9', { limit: 5 });
    freelancerNetworkingService.createFreelancerNetworkingConnection('user-9', { targetUserId: 'peer' });
    freelancerNetworkingService.updateFreelancerNetworkingConnection('user-9', 'conn-1', { strength: 'ally' });
    freelancerNetworkingService.deleteFreelancerNetworkingConnection('user-9', 'conn-1');

    expect(apiClient.get).toHaveBeenCalledWith('/freelancers/user-9/networking/connections', {
      params: { limit: 5 },
      signal: undefined,
    });
    expect(apiClient.post).toHaveBeenCalledWith('/freelancers/user-9/networking/connections', {
      targetUserId: 'peer',
    });
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/freelancers/user-9/networking/connections/conn-1',
      { strength: 'ally' },
    );
    expect(apiClient.delete).toHaveBeenCalledWith('/freelancers/user-9/networking/connections/conn-1');
  });

  it('handles networking orders lifecycle', () => {
    freelancerNetworkingService.listFreelancerNetworkingOrders('user-3', { limit: 2 });
    freelancerNetworkingService.createFreelancerNetworkingOrder('user-3', { sessionId: 'session-7' });
    freelancerNetworkingService.updateFreelancerNetworkingOrder('user-3', 'order-8', { status: 'paid' });
    freelancerNetworkingService.deleteFreelancerNetworkingOrder('user-3', 'order-8');

    expect(apiClient.get).toHaveBeenCalledWith('/freelancers/user-3/networking/orders', {
      params: { limit: 2 },
      signal: undefined,
    });
    expect(apiClient.post).toHaveBeenCalledWith('/freelancers/user-3/networking/orders', {
      sessionId: 'session-7',
    });
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/freelancers/user-3/networking/orders/order-8',
      { status: 'paid' },
    );
    expect(apiClient.delete).toHaveBeenCalledWith('/freelancers/user-3/networking/orders/order-8');
  });

  it('manages networking settings, preferences and ads', () => {
    freelancerNetworkingService.getFreelancerNetworkingSettings('user-5');
    freelancerNetworkingService.updateFreelancerNetworkingSettings('user-5', { timezone: 'UTC' });
    freelancerNetworkingService.updateFreelancerNetworkingPreferences('user-5', { reminders: true });
    freelancerNetworkingService.listFreelancerNetworkingAds('user-5');
    freelancerNetworkingService.createFreelancerNetworkingAd('user-5', { budget: 250 });
    freelancerNetworkingService.updateFreelancerNetworkingAd('user-5', 'ad-1', { budget: 300 });
    freelancerNetworkingService.deleteFreelancerNetworkingAd('user-5', 'ad-1');

    expect(apiClient.get).toHaveBeenCalledWith('/freelancers/user-5/networking/settings', { signal: undefined });
    expect(apiClient.patch).toHaveBeenCalledWith('/freelancers/user-5/networking/settings', { timezone: 'UTC' });
    expect(apiClient.patch).toHaveBeenCalledWith('/freelancers/user-5/networking/preferences', { reminders: true });
    expect(apiClient.get).toHaveBeenCalledWith('/freelancers/user-5/networking/ads', { signal: undefined });
    expect(apiClient.post).toHaveBeenCalledWith('/freelancers/user-5/networking/ads', { budget: 250 });
    expect(apiClient.patch).toHaveBeenCalledWith('/freelancers/user-5/networking/ads/ad-1', { budget: 300 });
    expect(apiClient.delete).toHaveBeenCalledWith('/freelancers/user-5/networking/ads/ad-1');
  });
});

// Freelancer portfolio service

describe('freelancer portfolio service', () => {
  it('requires an identifier to fetch portfolio data', async () => {
    await expect(freelancerPortfolioService.fetchFreelancerPortfolio()).rejects.toThrow(/freelancer identifier is required/i);
  });

  it('fetches portfolios with optional refresh flag', async () => {
    apiClient.get.mockResolvedValue({ portfolio: [] });

    await freelancerPortfolioService.fetchFreelancerPortfolio('user-10', { fresh: true });

    expect(apiClient.get).toHaveBeenCalledWith('/freelancers/user-10/portfolio', {
      params: { fresh: 'true' },
      signal: undefined,
    });
  });

  it('invalidates caches after write operations', async () => {
    apiClient.post.mockResolvedValue({ item: 1 });
    apiClient.put.mockResolvedValue({ item: 2 });

    await freelancerPortfolioService.createFreelancerPortfolioItem('user-1', { title: 'New' });
    await freelancerPortfolioService.updateFreelancerPortfolioItem('user-1', 'port-1', { title: 'Updated' });
    await freelancerPortfolioService.deleteFreelancerPortfolioItem('user-1', 'port-1');
    await freelancerPortfolioService.createFreelancerPortfolioAsset('user-1', 'port-1', { url: 'asset' });
    await freelancerPortfolioService.updateFreelancerPortfolioAsset('user-1', 'port-1', 'asset-1', { url: 'asset' });
    await freelancerPortfolioService.deleteFreelancerPortfolioAsset('user-1', 'port-1', 'asset-1');
    await freelancerPortfolioService.updateFreelancerPortfolioSettings('user-1', { theme: 'dark' });
    freelancerPortfolioService.invalidateFreelancerPortfolioCache('user-1');

    expect(apiClient.removeCache).toHaveBeenCalledWith('freelancer:portfolio:user-1');
  });
});

// Freelancer profile hub service

describe('freelancer profile hub service', () => {
  it('returns cached data when available and force is not set', async () => {
    apiClient.readCache.mockReturnValue({ data: { cached: true } });

    const result = await freelancerProfileHubService.fetchFreelancerProfileHub('user-4');

    expect(result).toEqual({ cached: true });
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('fetches fresh data when requested and writes to cache', async () => {
    apiClient.readCache.mockReturnValue(null);
    apiClient.get.mockResolvedValue({ profile: 'live' });

    const result = await freelancerProfileHubService.fetchFreelancerProfileHub('user-4', { force: true });

    expect(apiClient.get).toHaveBeenCalledWith('/freelancers/user-4/profile-hub', { signal: undefined });
    expect(apiClient.writeCache).toHaveBeenCalledWith('freelancer:profile-hub:user-4', { profile: 'live' }, expect.any(Number));
    expect(result).toEqual({ profile: 'live' });
  });

  it('refreshes cached data after write operations', async () => {
    apiClient.put.mockResolvedValue({ profile: 'updated' });

    await freelancerProfileHubService.saveFreelancerProfileHub('user-4', { headline: 'Updated' });
    await freelancerProfileHubService.saveFreelancerExpertiseAreas('user-4', ['design']);
    await freelancerProfileHubService.saveFreelancerSuccessMetrics('user-4', ['delivery']);
    await freelancerProfileHubService.saveFreelancerTestimonials('user-4', []);
    await freelancerProfileHubService.saveFreelancerHeroBanners('user-4', []);

    expect(apiClient.writeCache).toHaveBeenCalledWith('freelancer:profile-hub:user-4', { profile: 'updated' }, expect.any(Number));
  });
});

// Freelancer profile overview service

describe('freelancer profile overview service', () => {
  it('throws when user id is missing', async () => {
    await expect(freelancerProfileOverviewService.fetchFreelancerProfileOverview()).rejects.toThrow(
      /userId is required/i,
    );
  });

  it('serves cached profile data when present', async () => {
    apiClient.readCache.mockReturnValue({ data: { cached: true } });

    const result = await freelancerProfileOverviewService.fetchFreelancerProfileOverview('user-2');

    expect(result).toEqual({ cached: true });
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('fetches and caches remote profile data when requested fresh', async () => {
    apiClient.readCache.mockReturnValue(null);
    apiClient.get.mockResolvedValue({ profile: 'latest' });

    const result = await freelancerProfileOverviewService.fetchFreelancerProfileOverview('user-2', { fresh: true });

    expect(apiClient.get).toHaveBeenCalledWith('/freelancers/user-2/profile-overview', {
      params: { fresh: 'true' },
      signal: undefined,
    });
    expect(apiClient.writeCache).toHaveBeenCalledWith('freelancer:profile-overview:user-2', { profile: 'latest' }, expect.any(Number));
    expect(result).toEqual({ profile: 'latest' });
  });

  it('requires a File instance to upload the avatar and caches the response', async () => {
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    apiClient.post.mockResolvedValue({ avatarUrl: '/cdn/avatar.png' });

    const response = await freelancerProfileOverviewService.uploadFreelancerAvatar('user-2', file);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/freelancers/user-2/profile-avatar',
      expect.any(FormData),
    );
    const [[, formData]] = apiClient.post.mock.calls;
    expect(formData.get('avatar')).toBe(file);
    expect(response).toEqual({ avatarUrl: '/cdn/avatar.png' });
  });

  it('updates connections and rewrites caches', async () => {
    apiClient.post.mockResolvedValue({ connections: [] });
    apiClient.patch.mockResolvedValue({ connections: [{ id: 'c1' }] });
    apiClient.delete.mockResolvedValue({});

    await freelancerProfileOverviewService.createFreelancerConnection('user-2', { target: 'ally' });
    await freelancerProfileOverviewService.updateFreelancerConnection('user-2', 'conn-1', { strength: 'ally' });
    await freelancerProfileOverviewService.deleteFreelancerConnection('user-2', 'conn-1');

    expect(apiClient.writeCache).toHaveBeenCalledWith('freelancer:profile-overview:user-2', { connections: [] }, expect.any(Number));
  });
});

// Freelancer timeline service

describe('freelancer timeline service', () => {
  it('builds timeline urls and enforces identifiers', () => {
    expect(() => freelancerTimelineService.buildTimelineUrl()).toThrow(/freelancerId is required/i);
    expect(freelancerTimelineService.buildTimelineUrl('user-8')).toBe('/freelancers/user-8/timeline');
    expect(freelancerTimelineService.buildTimelineUrl('user-8', '/entries')).toBe('/freelancers/user-8/timeline/entries');
  });

  it('routes operations through the api client', async () => {
    await freelancerTimelineService.fetchFreelancerTimelineWorkspace('user-8');
    await freelancerTimelineService.updateFreelancerTimelineSettings('user-8', { visibility: 'public' });
    await freelancerTimelineService.createFreelancerTimelineEntry('user-8', { title: 'Milestone' });
    await expect(freelancerTimelineService.updateFreelancerTimelineEntry('user-8')).rejects.toThrow(/entryId is required/i);
    await expect(freelancerTimelineService.deleteFreelancerTimelineEntry('user-8')).rejects.toThrow(/entryId is required/i);
    await freelancerTimelineService.updateFreelancerTimelinePost('user-8', 'post-1', { title: 'Post' });
    await freelancerTimelineService.deleteFreelancerTimelinePost('user-8', 'post-1');
    await freelancerTimelineService.publishFreelancerTimelinePost('user-8', 'post-1');
    await freelancerTimelineService.recordFreelancerTimelinePostMetrics('user-8', 'post-1', { views: 10 });

    expect(apiClient.get).toHaveBeenCalledWith('/freelancers/user-8/timeline', { signal: undefined });
    expect(apiClient.put).toHaveBeenCalledWith('/freelancers/user-8/timeline/settings', { visibility: 'public' }, {});
    expect(apiClient.post).toHaveBeenCalledWith('/freelancers/user-8/timeline/entries', { title: 'Milestone' }, {});
    expect(apiClient.put).toHaveBeenCalledWith('/freelancers/user-8/timeline/posts/post-1', { title: 'Post' }, {});
    expect(apiClient.delete).toHaveBeenCalledWith('/freelancers/user-8/timeline/posts/post-1', {});
    expect(apiClient.post).toHaveBeenCalledWith('/freelancers/user-8/timeline/posts/post-1/publish', {}, {});
    expect(apiClient.post).toHaveBeenCalledWith('/freelancers/user-8/timeline/posts/post-1/metrics', { views: 10 }, {});
  });
});

// GDPR settings service

describe('gdpr settings service', () => {
  it('forwards read and update calls to the api client', async () => {
    await gdprSettingsService.fetchGdprSettings({ signal: 'sig' });
    await gdprSettingsService.updateGdprSettings({ enabled: true }, { signal: 'sig' });

    expect(apiClient.get).toHaveBeenCalledWith('/admin/gdpr-settings', { signal: 'sig' });
    expect(apiClient.put).toHaveBeenCalledWith('/admin/gdpr-settings', { enabled: true }, { signal: 'sig' });
  });
});

// Gig builder service

describe('gig builder service', () => {
  it('requires a freelancer id and forwards gig id filters', async () => {
    await expect(gigBuilderService.fetchGigBuilderExperience()).rejects.toThrow(/freelancerId is required/i);

    apiClient.get.mockResolvedValue({});
    await gigBuilderService.fetchGigBuilderExperience('user-9', { gigId: 'gig-1' });

    expect(apiClient.get).toHaveBeenCalledWith('/users/user-9/gig-builder', {
      params: { gigId: 'gig-1' },
      signal: undefined,
    });
  });
});

// Gig manager service

describe('gig manager service', () => {
  it('enforces identifier presence and passes refresh flag', () => {
    expect(() => gigManagerService.fetchGigManagerSnapshot()).toThrow(/userId is required/i);

    gigManagerService.fetchGigManagerSnapshot('user-5', { fresh: true });

    expect(apiClient.get).toHaveBeenCalledWith('/users/user-5/gig-manager', {
      params: { fresh: 'true' },
      signal: undefined,
    });
  });
});

// Groups service

describe('groups service', () => {
  it('lists and manages groups via the api client', () => {
    groupsService.listGroups({ query: 'design', focus: 'featured', limit: 5, includeEmpty: false });
    groupsService.getGroupProfile('group-1');
    groupsService.joinGroup('group-1', { message: 'hello' });
    groupsService.leaveGroup('group-1', { reason: 'busy' });
    groupsService.updateGroupMembership('group-1', { role: 'moderator' });
    groupsService.fetchDiscoverGroups({ query: 'remote' });
    groupsService.createGroup({ name: 'New Group' });
    groupsService.updateGroup('group-1', { name: 'Updated' });
    groupsService.addMember('group-1', { userId: 'user-3' });
    groupsService.updateMember('group-1', 'member-2', { role: 'lead' });
    groupsService.removeMember('group-1', 'member-2');
    groupsService.requestMembership('group-1', { message: 'Please' });
    groupsService.listUserGroups('user-1', { limit: 3 });
    groupsService.createUserGroup('user-1', { name: 'Team' });
    groupsService.updateUserGroup('user-1', 'group-1', { name: 'Team Updated' });
    groupsService.listUserGroupInvites('user-1', 'group-1');
    groupsService.createUserGroupInvite('user-1', 'group-1', { email: 'user@example.com' });
    groupsService.deleteUserGroupInvite('user-1', 'group-1', 'invite-3');
    groupsService.listUserGroupPosts('user-1', 'group-1', { limit: 4 });
    groupsService.createUserGroupPost('user-1', 'group-1', { body: 'Hello' });
    groupsService.updateUserGroupPost('user-1', 'group-1', 'post-2', { body: 'Updated' });
    groupsService.deleteUserGroupPost('user-1', 'group-1', 'post-2');

    expect(apiClient.get).toHaveBeenCalledWith('/groups', {
      params: { q: 'design', focus: 'featured', limit: 5, includeEmpty: false },
      signal: undefined,
    });
    expect(apiClient.get).toHaveBeenCalledWith('/groups/group-1', { signal: undefined });
    expect(apiClient.post).toHaveBeenCalledWith('/groups/group-1/join', { message: 'hello' });
    expect(apiClient.delete).toHaveBeenCalledWith('/groups/group-1/leave', { body: { reason: 'busy' } });
    expect(apiClient.patch).toHaveBeenCalledWith('/groups/group-1/membership', { role: 'moderator' });
    expect(apiClient.get).toHaveBeenCalledWith('/groups/discover', { params: { query: 'remote' } });
    expect(apiClient.post).toHaveBeenCalledWith('/groups', { name: 'New Group' });
    expect(apiClient.put).toHaveBeenCalledWith('/groups/group-1', { name: 'Updated' });
    expect(apiClient.post).toHaveBeenCalledWith('/groups/group-1/memberships', { userId: 'user-3' });
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/groups/group-1/memberships/member-2',
      { role: 'lead' },
    );
    expect(apiClient.delete).toHaveBeenCalledWith('/groups/group-1/memberships/member-2');
    expect(apiClient.post).toHaveBeenCalledWith('/groups/group-1/memberships/request', { message: 'Please' });
    expect(apiClient.get).toHaveBeenCalledWith('/users/user-1/groups', { params: { limit: 3 } });
    expect(apiClient.post).toHaveBeenCalledWith('/users/user-1/groups', { name: 'Team' });
    expect(apiClient.put).toHaveBeenCalledWith('/users/user-1/groups/group-1', { name: 'Team Updated' });
    expect(apiClient.get).toHaveBeenCalledWith('/users/user-1/groups/group-1/invites');
    expect(apiClient.post).toHaveBeenCalledWith('/users/user-1/groups/group-1/invites', {
      email: 'user@example.com',
    });
    expect(apiClient.delete).toHaveBeenCalledWith('/users/user-1/groups/group-1/invites/invite-3');
    expect(apiClient.get).toHaveBeenCalledWith('/users/user-1/groups/group-1/posts', { params: { limit: 4 } });
    expect(apiClient.post).toHaveBeenCalledWith('/users/user-1/groups/group-1/posts', { body: 'Hello' });
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/users/user-1/groups/group-1/posts/post-2',
      { body: 'Updated' },
    );
    expect(apiClient.delete).toHaveBeenCalledWith('/users/user-1/groups/group-1/posts/post-2');
  });
});

// Headhunter service

describe('headhunter service', () => {
  it('supports optional workspace filters', () => {
    const signal = new AbortController().signal;
    headhunterService.fetchHeadhunterDashboard({ workspaceId: 'ws-3', lookbackDays: 90, signal });

    expect(apiClient.get).toHaveBeenCalledWith('/headhunter/dashboard', {
      params: { workspaceId: 'ws-3', lookbackDays: 90 },
      signal,
    });
  });
});

// Homepage settings service

describe('homepage settings service', () => {
  it('fetches and updates homepage settings', async () => {
    await homepageSettingsService.fetchHomepageSettings({ signal: 'sig' });
    await homepageSettingsService.updateHomepageSettings({ hero: 'Updated' });

    expect(apiClient.get).toHaveBeenCalledWith('/admin/homepage-settings', { signal: 'sig' });
    expect(apiClient.put).toHaveBeenCalledWith('/admin/homepage-settings', { hero: 'Updated' });
  });
});
