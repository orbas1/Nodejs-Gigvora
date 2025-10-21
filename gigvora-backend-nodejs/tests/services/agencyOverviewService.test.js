import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fetchCurrentWeather = jest.fn();
const weatherModulePath = path.resolve(__dirname, '../../src/services/weatherService.js');
await jest.unstable_mockModule(weatherModulePath, () => ({ fetchCurrentWeather }));

const appCache = { flushByPrefix: jest.fn() };
const buildCacheKey = jest.fn((prefix, payload) => `${prefix}:${JSON.stringify(payload ?? {})}`);
const cacheModulePath = path.resolve(__dirname, '../../src/utils/cache.js');
await jest.unstable_mockModule(cacheModulePath, () => ({ appCache, buildCacheKey }));

const logger = { warn: jest.fn() };
const loggerModulePath = path.resolve(__dirname, '../../src/utils/logger.js');
await jest.unstable_mockModule(loggerModulePath, () => ({ default: logger }));

const modelsModulePath = path.resolve(__dirname, '../../src/models/index.js');

const sequelize = { transaction: jest.fn(async (callback) => callback({})) };
const AgencyDashboardOverview = { findOne: jest.fn(), findOrCreate: jest.fn() };
const ProviderWorkspace = { findOne: jest.fn(), findAll: jest.fn() };
const ProviderWorkspaceMember = { findOne: jest.fn(), findAll: jest.fn() };

await jest.unstable_mockModule(modelsModulePath, () => ({
  sequelize,
  AgencyDashboardOverview,
  ProviderWorkspace,
  ProviderWorkspaceMember,
}));

const serviceModulePath = path.resolve(__dirname, '../../src/services/agencyOverviewService.js');

const { getAgencyOverview, updateAgencyOverview } = await import(serviceModulePath);

const baseWorkspace = {
  id: 303,
  name: 'Beacon Agency',
  slug: 'beacon-agency',
  type: 'agency',
  ownerId: 11,
  timezone: 'UTC',
};

function createWorkspaceRow(workspace) {
  return {
    ...workspace,
    get: jest.fn(() => ({ ...workspace })),
  };
}

function createOverviewRecord(initial) {
  const state = { ...initial };
  const record = {
    ...initial,
    get: jest.fn(() => ({ ...state, metadata: { ...(state.metadata ?? {}) }, highlights: [...(state.highlights ?? [])] })),
    save: jest.fn(async () => {
      Object.assign(state, {
        greetingName: record.greetingName,
        greetingHeadline: record.greetingHeadline,
        overviewSummary: record.overviewSummary,
        avatarUrl: record.avatarUrl,
        followerCount: record.followerCount,
        trustScore: record.trustScore,
        rating: record.rating,
        highlights: record.highlights,
        weatherLocation: record.weatherLocation,
        weatherLatitude: record.weatherLatitude,
        weatherLongitude: record.weatherLongitude,
        weatherProvider: record.weatherProvider,
        weatherSnapshot: record.weatherSnapshot,
        weatherLastCheckedAt: record.weatherLastCheckedAt,
        metadata: record.metadata,
        updatedAt: record.updatedAt,
        createdAt: record.createdAt,
      });
    }),
    reload: jest.fn(async () => record),
  };
  return record;
}

function resetMocks() {
  fetchCurrentWeather.mockReset();
  appCache.flushByPrefix.mockReset();
  logger.warn.mockReset();
  sequelize.transaction.mockReset().mockImplementation(async (callback) => callback({}));
  AgencyDashboardOverview.findOne.mockReset();
  AgencyDashboardOverview.findOrCreate.mockReset();
  ProviderWorkspace.findOne.mockReset();
  ProviderWorkspace.findAll.mockReset();
  ProviderWorkspaceMember.findOne.mockReset();
  ProviderWorkspaceMember.findAll.mockReset();
}

describe('agencyOverviewService', () => {
  const actor = { actorId: baseWorkspace.ownerId, actorRoles: ['admin'] };

  beforeEach(() => {
    resetMocks();
  });

  it('returns a sanitized overview with available workspaces', async () => {
    ProviderWorkspace.findAll.mockResolvedValue([createWorkspaceRow(baseWorkspace)]);
    ProviderWorkspace.findOne.mockResolvedValue(baseWorkspace);
    AgencyDashboardOverview.findOne.mockResolvedValue(
      createOverviewRecord({
        id: 501,
        workspaceId: baseWorkspace.id,
        greetingName: 'Beacon team',
        greetingHeadline: 'Fueling agency growth',
        overviewSummary: 'We help agencies scale.',
        avatarUrl: 'https://cdn.gigvora.test/avatar.png',
        followerCount: 1250,
        trustScore: 82,
        rating: 4.7,
        highlights: [
          { id: 'hl-1', title: 'Launchpad live', summary: 'New launchpad released', link: 'https://gigvora.test', imageUrl: null },
        ],
        weatherLocation: 'London',
        weatherLatitude: null,
        weatherLongitude: null,
        weatherSnapshot: null,
        weatherProvider: null,
        weatherLastCheckedAt: new Date().toISOString(),
        metadata: { lastUpdatedAt: '2024-04-01T00:00:00.000Z' },
        createdAt: '2024-03-01T00:00:00.000Z',
        updatedAt: '2024-04-01T00:00:00.000Z',
      }),
    );

    const overview = await getAgencyOverview({ workspaceId: baseWorkspace.id }, actor);

    expect(overview.workspace).toMatchObject({ id: baseWorkspace.id, slug: 'beacon-agency' });
    expect(overview.overview.greetingName).toBe('Beacon team');
    expect(overview.overview.highlights).toHaveLength(1);
    expect(overview.meta.availableWorkspaces[0].id).toBe(baseWorkspace.id);
  });

  it('updates overview content, refreshes weather, and flushes caches', async () => {
    ProviderWorkspace.findOne.mockResolvedValue(baseWorkspace);
    ProviderWorkspace.findAll.mockResolvedValue([createWorkspaceRow(baseWorkspace)]);
    ProviderWorkspaceMember.findOne.mockResolvedValue({ role: 'manager' });

    const overviewRecord = createOverviewRecord({
      id: 777,
      workspaceId: baseWorkspace.id,
      greetingName: 'Beacon team',
      greetingHeadline: 'Fueling agency growth',
      overviewSummary: 'Old summary',
      avatarUrl: null,
      followerCount: 900,
      trustScore: 70,
      rating: 4.2,
      highlights: [],
      weatherLocation: null,
      weatherLatitude: null,
      weatherLongitude: null,
      metadata: {},
      createdAt: '2024-02-01T00:00:00.000Z',
      updatedAt: '2024-03-01T00:00:00.000Z',
    });

    AgencyDashboardOverview.findOrCreate.mockResolvedValue([overviewRecord, true]);
    fetchCurrentWeather.mockResolvedValue({ provider: 'test-weather', summary: 'Sunny', temperatureCelsius: 21 });

    const response = await updateAgencyOverview(
      {
        workspaceId: baseWorkspace.id,
        greetingName: 'Beacon crew',
        greetingHeadline: 'Elevating client outcomes',
        overviewSummary: 'We deliver enterprise-grade growth.',
        avatarUrl: 'https://cdn.gigvora.test/new-avatar.png',
        followerCount: 1500,
        trustScore: 88,
        rating: 4.8,
        weatherLocation: 'Berlin',
        weatherLatitude: 52.52,
        weatherLongitude: 13.405,
        highlights: [
          { title: 'Awarded top agency', summary: 'Recognised across EMEA', link: 'https://gigvora.test/awards' },
        ],
      },
      actor,
    );

    expect(sequelize.transaction).toHaveBeenCalled();
    expect(overviewRecord.save).toHaveBeenCalled();
    expect(fetchCurrentWeather).toHaveBeenCalledWith({ latitude: 52.52, longitude: 13.405 });
    expect(appCache.flushByPrefix).toHaveBeenCalledWith('agency:dashboard');
    expect(response.overview.greetingName).toBe('Beacon crew');
    expect(response.overview.highlights[0]).toMatchObject({ title: 'Awarded top agency' });
    expect(response.overview.weather.provider).toBe('test-weather');
  });
});

