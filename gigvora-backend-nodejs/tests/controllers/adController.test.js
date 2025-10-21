import { jest } from '@jest/globals';

process.env.LOG_LEVEL = 'silent';
process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

const adServiceModuleUrl = new URL('../../src/services/adService.js', import.meta.url);

const getAdDashboardSnapshot = jest.fn().mockResolvedValue({ summary: [] });
const listPlacements = jest.fn().mockResolvedValue([{ id: 'multi' }]);
const getPlacementsForSurface = jest.fn().mockResolvedValue([{ id: 'single' }]);

jest.unstable_mockModule(adServiceModuleUrl.pathname, () => ({
  getAdDashboardSnapshot,
  listPlacements,
  getPlacementsForSurface,
}));

const controllerModuleUrl = new URL('../../src/controllers/adController.js', import.meta.url);
const { dashboard, placements } = await import(controllerModuleUrl.pathname);

describe('adController', () => {
  beforeEach(() => {
    getAdDashboardSnapshot.mockClear();
    listPlacements.mockClear();
    getPlacementsForSurface.mockClear();
  });

  test('dashboard forwards surfaces, context and bypass flag to service', async () => {
    const res = { json: jest.fn() };
    const req = {
      query: {
        surfaces: ['global_dashboard, agency_dashboard'],
        context: '{"locale":"en-GB","segment":"growth"}',
        bypassCache: 'true',
      },
    };

    await dashboard(req, res);

    expect(getAdDashboardSnapshot).toHaveBeenCalledWith({
      surfaces: ['global_dashboard', 'agency_dashboard'],
      context: { locale: 'en-GB', segment: 'growth' },
      bypassCache: true,
    });
    expect(res.json).toHaveBeenCalledWith({ summary: [] });
  });

  test('dashboard falls back to empty context when invalid json supplied', async () => {
    const res = { json: jest.fn() };
    const req = { query: { surface: 'user_dashboard', context: '{invalid-json}' } };

    await dashboard(req, res);

    expect(getAdDashboardSnapshot).toHaveBeenCalledWith({
      surfaces: ['user_dashboard'],
      context: {},
      bypassCache: false,
    });
  });

  test('dashboard deduplicates surface values while preserving intent', async () => {
    const res = { json: jest.fn() };
    const req = {
      query: {
        surfaces: ['global_dashboard,GLOBAL_DASHBOARD', 'agency_dashboard'],
      },
    };

    await dashboard(req, res);

    expect(getAdDashboardSnapshot).toHaveBeenCalledWith({
      surfaces: ['global_dashboard', 'agency_dashboard'],
      context: {},
      bypassCache: false,
    });
  });

  test('placements optimises single surface requests', async () => {
    const res = { json: jest.fn() };
    const req = { query: { surfaces: ['freelancer_dashboard'], status: 'active', now: '2024-01-10T12:00:00Z' } };

    await placements(req, res);

    expect(getPlacementsForSurface).toHaveBeenCalledWith('freelancer_dashboard', {
      status: 'active',
      now: new Date('2024-01-10T12:00:00Z'),
    });
    expect(res.json).toHaveBeenCalledWith({
      surface: 'freelancer_dashboard',
      placements: [{ id: 'single' }],
    });
    expect(listPlacements).not.toHaveBeenCalled();
  });

  test('placements aggregates when multiple surfaces provided', async () => {
    const res = { json: jest.fn() };
    const req = {
      query: {
        surfaces: ['global_dashboard', 'agency_dashboard'],
        now: 'not-a-date',
      },
    };

    await placements(req, res);

    expect(listPlacements).toHaveBeenCalledWith({
      surfaces: ['global_dashboard', 'agency_dashboard'],
      status: undefined,
      now: expect.any(Date),
    });
    expect(res.json).toHaveBeenCalledWith({ placements: [{ id: 'multi' }] });
  });
});
