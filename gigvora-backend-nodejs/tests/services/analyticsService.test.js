import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsModulePath = path.resolve(__dirname, '../../src/models/index.js');

const AnalyticsEvent = {
  create: jest.fn(),
  findAndCountAll: jest.fn(),
};

const AnalyticsDailyRollup = {
  findOrCreate: jest.fn(),
  findAll: jest.fn(),
};

const sequelize = {
  transaction: jest.fn(async (handler) => handler({})),
};

const ACTOR_TYPES = ['user', 'workspace'];

await jest.unstable_mockModule(modelsModulePath, () => ({
  sequelize,
  AnalyticsEvent,
  AnalyticsDailyRollup,
  ANALYTICS_ACTOR_TYPES: ACTOR_TYPES,
}));

const cacheModulePath = path.resolve(__dirname, '../../src/utils/cache.js');

const appCache = {
  remember: jest.fn(async (cacheKey, ttl, resolver) => resolver()),
  flushByPrefix: jest.fn(),
};

const buildCacheKey = jest.fn((prefix, payload) => `${prefix}:${JSON.stringify(payload)}`);

await jest.unstable_mockModule(cacheModulePath, () => ({
  appCache,
  buildCacheKey,
}));

const serviceModulePath = path.resolve(__dirname, '../../src/services/analyticsService.js');

const {
  trackEvent,
  listEvents,
  upsertDailyRollup,
  getDailyRollup,
} = await import(serviceModulePath);

const { ValidationError } = await import('../../src/utils/errors.js');

describe('analyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('persists an analytics event and flushes cache prefixes', async () => {
      const created = { get: jest.fn(() => ({ id: 99, eventName: 'page_view' })) };
      AnalyticsEvent.create.mockResolvedValue(created);

      const result = await trackEvent({
        eventName: 'page_view',
        userId: 7,
        actorType: 'user',
        entityType: 'page',
        entityId: 'landing',
        source: 'web',
        context: { path: '/' },
      });

      expect(AnalyticsEvent.create).toHaveBeenCalledWith(expect.objectContaining({
        eventName: 'page_view',
        userId: 7,
        actorType: 'user',
        entityType: 'page',
        entityId: 'landing',
        source: 'web',
      }));
      expect(created.get).toHaveBeenCalledWith({ plain: true });
      expect(appCache.flushByPrefix).toHaveBeenCalledWith('analytics:events');
      expect(result).toEqual({ id: 99, eventName: 'page_view' });
    });

    it('validates required attributes and actor type', async () => {
      await expect(trackEvent({})).rejects.toThrow(ValidationError);

      await expect(
        trackEvent({ eventName: 'invalid', actorType: 'robot' }),
      ).rejects.toThrow('Unsupported actor type "robot".');
    });
  });

  describe('listEvents', () => {
    it('returns paginated events with caching', async () => {
      const rows = [
        { get: jest.fn(() => ({ id: 1, eventName: 'page_view' })) },
        { get: jest.fn(() => ({ id: 2, eventName: 'cta_click' })) },
      ];
      AnalyticsEvent.findAndCountAll.mockResolvedValue({ rows, count: 2 });

      const result = await listEvents({ eventName: 'page' }, { page: 2, pageSize: 1 });

      expect(buildCacheKey).toHaveBeenCalledWith('analytics:events', expect.any(Object));
      expect(AnalyticsEvent.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        limit: 1,
        offset: 1,
      }));
      expect(result.pagination).toEqual({ page: 2, pageSize: 1, total: 2, totalPages: 2 });
      expect(result.data).toEqual([
        { id: 1, eventName: 'page_view' },
        { id: 2, eventName: 'cta_click' },
      ]);
    });

    it('validates actor type filters when listing events', async () => {
      await expect(listEvents({ actorType: 'unknown' })).rejects.toThrow(
        'Unsupported actor type "unknown".',
      );
    });
  });

  describe('upsertDailyRollup', () => {
    it('creates a new rollup when not present', async () => {
      const record = {
        isNewRecord: true,
        get: jest.fn(() => ({ metricKey: 'visits', value: 10 })),
      };
      AnalyticsDailyRollup.findOrCreate.mockResolvedValue([record, true]);

      const result = await upsertDailyRollup({
        metricKey: 'visits',
        date: '2024-06-01',
        dimensionHash: 'all',
        value: 10,
        dimensions: { channel: 'organic' },
      });

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(AnalyticsDailyRollup.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({
        where: { metricKey: 'visits', date: '2024-06-01', dimensionHash: 'all' },
      }));
      expect(appCache.flushByPrefix).toHaveBeenCalledWith('analytics:rollup:visits');
      expect(result).toEqual({ metricKey: 'visits', value: 10 });
    });

    it('updates existing rollup values when record exists', async () => {
      const save = jest.fn();
      const record = {
        isNewRecord: false,
        value: 5,
        dimensions: {},
        save,
        get: jest.fn(() => ({ metricKey: 'visits', value: 15 })),
      };
      AnalyticsDailyRollup.findOrCreate.mockResolvedValue([record, false]);

      const result = await upsertDailyRollup({
        metricKey: 'visits',
        date: '2024-06-01',
        dimensionHash: 'all',
        value: 15,
        dimensions: { channel: 'organic' },
      });

      expect(save).toHaveBeenCalledWith({ transaction: expect.any(Object) });
      expect(result.value).toBe(15);
    });
  });

  describe('getDailyRollup', () => {
    it('returns cached rollups ordered by date', async () => {
      const rows = [
        { get: jest.fn(() => ({ date: '2024-06-01', value: 10 })) },
        { get: jest.fn(() => ({ date: '2024-06-02', value: 12 })) },
      ];
      AnalyticsDailyRollup.findAll.mockResolvedValue(rows);

      const result = await getDailyRollup('visits', { dateFrom: '2024-06-01', dateTo: '2024-06-02' });

      expect(buildCacheKey).toHaveBeenCalledWith('analytics:rollup:visits', expect.any(Object));
      expect(AnalyticsDailyRollup.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ metricKey: 'visits' }),
      }));
      expect(result).toEqual([
        { date: '2024-06-01', value: 10 },
        { date: '2024-06-02', value: 12 },
      ]);
    });

    it('validates required metric key', async () => {
      await expect(getDailyRollup()).rejects.toThrow(ValidationError);
    });
  });
});
