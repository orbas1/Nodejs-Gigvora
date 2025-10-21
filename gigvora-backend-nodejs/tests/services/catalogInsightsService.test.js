import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { NotFoundError } from '../../src/utils/errors.js';

describe('catalogInsightsService', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const modelsModulePath = pathToFileURL(path.resolve(__dirname, '../../src/models/index.js')).pathname;
  const cacheModulePath = pathToFileURL(path.resolve(__dirname, '../../src/utils/cache.js')).pathname;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('validates freelancer existence before loading insights', async () => {
    const findByPk = jest.fn().mockResolvedValue(null);

    await jest.unstable_mockModule(modelsModulePath, () => ({
      User: { findByPk },
      FreelancerCatalogBundleMetric: { findAll: jest.fn() },
      FreelancerCatalogBundle: {},
      FreelancerRepeatClient: { count: jest.fn() },
      FreelancerCrossSellOpportunity: { findAll: jest.fn() },
      FreelancerKeywordImpression: { findAll: jest.fn() },
      FreelancerMarginSnapshot: { findAll: jest.fn() },
    }));

    await jest.unstable_mockModule(cacheModulePath, () => ({
      appCache: { get: () => null, set: jest.fn() },
      buildCacheKey: (_namespace, parts) => `catalog:${parts.freelancerId}`,
    }));

    const { getFreelancerCatalogInsights } = await import('../../src/services/catalogInsightsService.js');

    await expect(getFreelancerCatalogInsights(999)).rejects.toThrow('Freelancer not found.');
    expect(findByPk).toHaveBeenCalledWith(999, { attributes: ['id', 'userType'] });
  });

  it('aggregates bundle, keyword, and margin data into a dashboard payload', async () => {
    const cacheStore = new Map();

    const bundleMetricFindAll = jest.fn()
      .mockResolvedValueOnce([{ impressions: 1000, clicks: 200, conversions: 50, revenue: 25000, attachRate: 0.45 }])
      .mockResolvedValueOnce([{ impressions: 800, clicks: 150, conversions: 30, revenue: 18000, attachRate: 0.35 }])
      .mockResolvedValueOnce([
        {
          get: (options) => {
            if (options && options.plain) {
              return {
                bundle: {
                  id: 1,
                  name: 'Growth Launch',
                  description: 'Launch support package',
                  basePrice: 3500,
                  currencyCode: 'USD',
                  metadata: { tier: 'premium' },
                },
                impressions: 400,
                clicks: 120,
                conversions: 20,
                revenue: 18000,
                repeatClients: 4,
                attachRate: 0.55,
              };
            }
            return null;
          },
        },
        {
          get: (options) => {
            if (options && options.plain) {
              return {
                bundle: {
                  id: 2,
                  name: 'Retention Boost',
                  description: 'Retention playbook',
                  basePrice: 2200,
                  currencyCode: 'EUR',
                  metadata: null,
                },
                impressions: 300,
                clicks: 60,
                conversions: 10,
                revenue: 9000,
                repeatClients: 2,
                attachRate: 0.25,
              };
            }
            return null;
          },
        },
      ]);

    const repeatClientCount = jest
      .fn()
      .mockResolvedValueOnce(40)
      .mockResolvedValueOnce(15)
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3);

    const crossSellRecord = {
      _plain: {
        id: 90,
        title: 'Upgrade nurture sequence',
        signal: 'multiple bundle interest',
        recommendedAction: 'Schedule upsell review',
        expectedUpliftPercentage: 12.5,
        expectedRevenue: 4200,
        confidence: 0.7,
        priority: 1,
        sourceBundle: { id: 1, name: 'Growth Launch', toPublicObject: () => ({ id: 1, name: 'Growth Launch' }) },
        targetBundle: { id: 3, name: 'Scale Expansion', toPublicObject: () => ({ id: 3, name: 'Scale Expansion' }) },
      },
      get(argument) {
        if (argument && argument.plain) {
          return { ...this._plain };
        }
        if (argument === 'sourceBundle') {
          return this._plain.sourceBundle;
        }
        if (argument === 'targetBundle') {
          return this._plain.targetBundle;
        }
        return this._plain[argument];
      },
    };

    const keywordEntries = [
      {
        keyword: 'saas marketing',
        impressions: 120,
        clicks: 30,
        conversions: 6,
        trendPercentage: 8,
        region: 'US',
      },
      {
        keyword: 'saas marketing',
        impressions: 60,
        clicks: 10,
        conversions: 2,
        trendPercentage: 6,
        region: 'EU',
      },
      {
        keyword: 'product launch',
        impressions: 80,
        clicks: 18,
        conversions: 5,
        trendPercentage: 4,
        region: 'US',
      },
    ];

    const marginRecords = [
      {
        toPublicObject: () => ({
          month: '2023-12',
          revenue: 21000,
          softwareCosts: 3000,
          subcontractorCosts: 2500,
          fulfillmentCosts: 4000,
          notes: 'Holiday campaigns',
        }),
      },
      {
        toPublicObject: () => ({
          month: '2023-11',
          revenue: 18000,
          softwareCosts: 2800,
          subcontractorCosts: 2300,
          fulfillmentCosts: 3800,
          notes: 'Upsell blitz',
        }),
      },
    ];

    await jest.unstable_mockModule(modelsModulePath, () => ({
      User: { findByPk: jest.fn().mockResolvedValue({ id: 7, userType: 'freelancer' }) },
      FreelancerCatalogBundleMetric: { findAll: bundleMetricFindAll },
      FreelancerCatalogBundle: {},
      FreelancerRepeatClient: { count: repeatClientCount },
      FreelancerCrossSellOpportunity: { findAll: jest.fn().mockResolvedValue([crossSellRecord]) },
      FreelancerKeywordImpression: { findAll: jest.fn().mockResolvedValue(keywordEntries) },
      FreelancerMarginSnapshot: { findAll: jest.fn().mockResolvedValue(marginRecords) },
    }));

    await jest.unstable_mockModule(cacheModulePath, () => ({
      appCache: {
        get: (key) => cacheStore.get(key) ?? null,
        set: (key, value) => cacheStore.set(key, value),
      },
      buildCacheKey: (_namespace, parts) => `catalog:${parts.freelancerId}`,
    }));

    const { getFreelancerCatalogInsights } = await import('../../src/services/catalogInsightsService.js');

    const insights = await getFreelancerCatalogInsights(7, { bypassCache: true });

    expect(bundleMetricFindAll).toHaveBeenCalledTimes(3);
    expect(repeatClientCount).toHaveBeenCalledTimes(5);
    expect(insights.summary.conversionRate.value).toBeGreaterThan(0);
    expect(insights.summary.repeatClientRate.totals.totalClients).toBe(40);
    expect(insights.bundles).toHaveLength(2);
    expect(insights.crossSell[0]).toMatchObject({
      priority: 'High',
      expectedRevenue: 4200,
    });
    expect(insights.keywords[0].keyword).toBe('saas marketing');
    expect(insights.margin.history[0].grossMarginPercent).toBeCloseTo(54.8, 1);
  });
});
