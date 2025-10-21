import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('adService.getAdDashboardSnapshot', () => {
  const baseNow = new Date('2024-06-15T12:00:00.000Z');
  let getAdDashboardSnapshot;
  let mockModels;
  let cacheStore;

  beforeEach(async () => {
    jest.resetModules();

    cacheStore = new Map();

    const surfaceRecord = {
      get: () => ({
        surface: 'global_dashboard',
        name: 'Global Dashboard',
        isActive: true,
      }),
    };

    const placementPlain = {
      id: 101,
      surface: 'global_dashboard',
      position: 'hero',
      status: 'active',
      weight: 4,
      pacingMode: 'even',
      maxImpressionsPerHour: 1200,
      startAt: '2024-06-10T00:00:00.000Z',
      endAt: '2024-06-25T00:00:00.000Z',
      opportunityType: 'awareness',
      priority: 7,
      metadata: { industries: ['technology'] },
      creative: {
        id: 501,
        campaignId: 301,
        name: 'Hero Banner',
        type: 'display',
        status: 'active',
        headline: 'Gigvora Partner Spotlight',
        callToAction: 'Explore Opportunities',
        ctaUrl: 'https://gigvora.example.com/ads',
        keywordAssignments: [
          {
            weight: 1.25,
            keyword: {
              id: 41,
              keyword: 'ai talent',
              category: 'talent',
              intent: 'discovery',
            },
            taxonomy: {
              id: 91,
              slug: 'ai-ml',
              label: 'AI & Machine Learning',
              type: 'industry',
            },
          },
        ],
        campaign: {
          id: 301,
          name: 'Network Awareness',
          objective: 'brand',
          status: 'active',
        },
      },
      couponLinks: [
        {
          coupon: {
            id: 801,
            code: 'GIGVORA20',
            type: 'percentage',
            discountValue: 20,
            startAt: '2024-06-01T00:00:00.000Z',
            endAt: '2024-06-30T00:00:00.000Z',
          },
        },
      ],
    };

    const placementRecord = {
      get: () => placementPlain,
    };

    await jest.unstable_mockModule('../../src/utils/cache.js', () => ({
      appCache: {
        get: jest.fn((key) => cacheStore.get(key)),
        set: jest.fn((key, value) => cacheStore.set(key, value)),
        remember: jest.fn(async (key, ttlSeconds, resolver) => resolver()),
      },
      buildCacheKey: jest.fn((namespace, parts) => `${namespace}:${JSON.stringify(parts)}`),
    }), { virtual: true });

    await jest.unstable_mockModule('../../src/models/index.js', () => {
      mockModels = {
        AdCampaign: {},
        AdCreative: {},
        AdPlacement: { findAll: jest.fn(async () => [placementRecord]) },
        AdPlacementCoupon: null,
        AdCoupon: null,
        AdKeyword: null,
        AdKeywordAssignment: null,
        OpportunityTaxonomy: null,
        OpportunityTaxonomyAssignment: { findAll: jest.fn(async () => []) },
        AnalyticsDailyRollup: { findAll: jest.fn(async () => []) },
        AdSurfaceSetting: { findAll: jest.fn(async () => [surfaceRecord]) },
      };
      return mockModels;
    }, { virtual: true });

    ({ getAdDashboardSnapshot } = await import('../../src/services/adService.js'));
  });

  it('builds a comprehensive forecast for the active dashboard surfaces', async () => {
    const result = await getAdDashboardSnapshot({
      surfaces: ['global_dashboard'],
      bypassCache: true,
      now: new Date(baseNow),
      context: {
        keywordHints: ['ai talent'],
      },
    });

    expect(result.generatedAt).toBe(baseNow.toISOString());
    expect(result.overview.totalPlacements).toBe(1);
    expect(result.overview.keywordHighlights).toEqual([
      { keyword: 'ai talent', weight: 1.25 },
    ]);

    expect(result.forecast).toBeTruthy();
    expect(result.forecast.summary).toEqual(
      expect.objectContaining({
        expectedImpressions: expect.any(Number),
        expectedClicks: expect.any(Number),
        expectedLeads: expect.any(Number),
        projectedSessions: expect.any(Number),
      }),
    );
    expect(result.forecast.summary.expectedImpressions).toBeGreaterThan(0);
    expect(result.forecast.summary.projectedSessions).toBeGreaterThan(0);

    expect(result.forecast.scenarios).toHaveLength(3);
    expect(result.forecast.scenarios.map((scenario) => scenario.label)).toEqual([
      'Conservative',
      'Expected',
      'Upside',
    ]);
    result.forecast.scenarios.forEach((scenario) => {
      expect(scenario.impressions).toBeGreaterThan(0);
      expect(scenario.clicks).toBeGreaterThan(0);
      expect(scenario.leads).toBeGreaterThanOrEqual(0);
      expect(scenario.confidence).toBeGreaterThan(0);
    });

    expect(result.forecast.assumptions.length).toBeGreaterThanOrEqual(3);
    expect(result.forecast.traffic.sourceBreakdown.length).toBeGreaterThan(0);

    expect(result.recommendations.length).toBeGreaterThan(0);

    const cachedResult = await getAdDashboardSnapshot({
      surfaces: ['global_dashboard'],
      now: new Date('2024-07-01T00:00:00.000Z'),
      context: {
        keywordHints: ['ai talent'],
      },
    });

    expect(cachedResult).toBe(result);
    expect(mockModels.AdPlacement.findAll).toHaveBeenCalledTimes(1);
    expect(mockModels.AdSurfaceSetting.findAll).toHaveBeenCalledTimes(2);
  });
});
