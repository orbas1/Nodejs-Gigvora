import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { NotFoundError } from '../../src/utils/errors.js';

describe('companyDashboardOverviewService', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const modelsModulePath = pathToFileURL(path.resolve(__dirname, '../../src/models/index.js')).pathname;
  const cacheModulePath = pathToFileURL(path.resolve(__dirname, '../../src/utils/cache.js')).pathname;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('sanitises fetched dashboard overview records', async () => {
    const overviewRecord = {
      get: () => ({
        id: 1,
        workspaceId: 55,
        displayName: 'Acme Labs',
        summary: 'Building robotics',
        avatarUrl: null,
        followerCount: 23,
        trustScore: 78.5,
        rating: 4.8,
        preferences: { theme: 'dark' },
        createdAt: '2023-12-01T00:00:00Z',
        updatedAt: '2023-12-20T12:00:00Z',
      }),
      lastEditedBy: {
        get: () => ({ id: 9, firstName: 'Lena', lastName: 'Gray', email: 'lena@gigvora.com' }),
      },
    };

    await jest.unstable_mockModule(modelsModulePath, () => ({
      CompanyDashboardOverview: { findOne: jest.fn().mockResolvedValue(overviewRecord) },
      ProviderWorkspace: {},
      User: {},
    }));

    await jest.unstable_mockModule(cacheModulePath, () => ({
      appCache: { flushByPrefix: jest.fn() },
    }));

    const { getCompanyDashboardOverview } = await import('../../src/services/companyDashboardOverviewService.js');

    const overview = await getCompanyDashboardOverview({ workspaceId: 55 });
    expect(overview).toMatchObject({
      id: 1,
      workspaceId: 55,
      trustScore: 78.5,
      rating: 4.8,
      lastEditedBy: { email: 'lena@gigvora.com' },
    });
  });

  it('creates or updates an overview and flushes cache', async () => {
    const flushSpy = jest.fn();

    const record = {
      displayName: 'Placeholder',
      summary: null,
      avatarUrl: null,
      followerCount: 0,
      trustScore: 40,
      rating: 3.5,
      preferences: { theme: 'light' },
      save: jest.fn().mockResolvedValue(),
      reload: jest.fn().mockResolvedValue(),
      get: () => ({
        id: 2,
        workspaceId: 55,
        displayName: 'Acme Studios',
        summary: 'Talent marketplace',
        avatarUrl: 'https://cdn.gigvora.com/acme.png',
        followerCount: 120,
        trustScore: 82,
        rating: 4.5,
        preferences: { theme: 'dark', timezone: 'UTC' },
        createdAt: '2024-01-01T12:00:00Z',
        updatedAt: '2024-01-01T12:00:00Z',
      }),
    };

    await jest.unstable_mockModule(modelsModulePath, () => ({
      CompanyDashboardOverview: {
        findOrCreate: jest.fn().mockResolvedValue([record, true]),
      },
      ProviderWorkspace: {
        findByPk: jest.fn().mockResolvedValue({ id: 55, name: 'Acme Studios' }),
      },
      User: {},
    }));

    await jest.unstable_mockModule(cacheModulePath, () => ({
      appCache: { flushByPrefix: flushSpy },
    }));

    const { upsertCompanyDashboardOverview } = await import('../../src/services/companyDashboardOverviewService.js');

    const overview = await upsertCompanyDashboardOverview({
      workspaceId: 55,
      displayName: 'Acme Studios',
      summary: 'Talent marketplace',
      avatarUrl: 'https://cdn.gigvora.com/acme.png',
      followerCount: 120,
      trustScore: 82,
      rating: 4.5,
      preferences: { timezone: 'UTC' },
      actorId: 9,
    });

    expect(record.save).toHaveBeenCalled();
    expect(flushSpy).toHaveBeenCalledWith('dashboard:company');
    expect(overview.displayName).toBe('Acme Studios');
    expect(overview.preferences.timezone).toBe('UTC');
  });

  it('throws when workspace is missing', async () => {
    await jest.unstable_mockModule(modelsModulePath, () => ({
      CompanyDashboardOverview: { findOrCreate: jest.fn() },
      ProviderWorkspace: { findByPk: jest.fn().mockResolvedValue(null) },
      User: {},
    }));

    await jest.unstable_mockModule(cacheModulePath, () => ({
      appCache: { flushByPrefix: jest.fn() },
    }));

    const { upsertCompanyDashboardOverview } = await import('../../src/services/companyDashboardOverviewService.js');

    await expect(upsertCompanyDashboardOverview({ workspaceId: 999 })).rejects.toThrow('Workspace not found.');
  });
});
