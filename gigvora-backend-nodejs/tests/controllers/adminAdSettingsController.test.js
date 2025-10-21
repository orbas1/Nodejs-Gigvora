import { jest } from '@jest/globals';

process.env.LOG_LEVEL = 'silent';
process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

const serviceModuleUrl = new URL('../../src/services/adminAdSettingsService.js', import.meta.url);

const getAdsSettingsSnapshot = jest.fn().mockResolvedValue({ surfaces: [] });
const upsertSurfaceSetting = jest.fn().mockResolvedValue({ id: 'surface-1' });
const createCampaign = jest.fn().mockResolvedValue({ id: 'campaign-1' });
const updateCampaign = jest.fn().mockResolvedValue({ id: 'campaign-2' });
const deleteCampaign = jest.fn().mockResolvedValue();
const createCreative = jest.fn().mockResolvedValue({ id: 'creative-1' });
const updateCreative = jest.fn().mockResolvedValue({ id: 'creative-2' });
const deleteCreative = jest.fn().mockResolvedValue();
const createPlacement = jest.fn().mockResolvedValue({ id: 'placement-1' });
const updatePlacement = jest.fn().mockResolvedValue({ id: 'placement-2' });
const deletePlacement = jest.fn().mockResolvedValue();

jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({
  getAdsSettingsSnapshot,
  upsertSurfaceSetting,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  createCreative,
  updateCreative,
  deleteCreative,
  createPlacement,
  updatePlacement,
  deletePlacement,
}));

const controllerModuleUrl = new URL('../../src/controllers/adminAdSettingsController.js', import.meta.url);
const {
  snapshot,
  saveSurface,
  storeCampaign,
  updateCampaignRecord,
  destroyCampaign,
  storeCreative,
  updateCreativeRecord,
  destroyCreative,
  storePlacement,
  updatePlacementRecord,
  destroyPlacement,
} = await import(controllerModuleUrl.pathname);

describe('adminAdSettingsController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot returns latest settings', async () => {
    const res = { json: jest.fn() };
    await snapshot({}, res);
    expect(getAdsSettingsSnapshot).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ surfaces: [] });
  });

  test('saveSurface forwards actor context', async () => {
    const res = { json: jest.fn() };
    const req = { params: { surface: 'global_dashboard' }, body: { name: 'Updated' }, user: { id: 72 } };

    await saveSurface(req, res);

    expect(upsertSurfaceSetting).toHaveBeenCalledWith('global_dashboard', { name: 'Updated' }, { actorId: 72 });
    expect(res.json).toHaveBeenCalledWith({ id: 'surface-1' });
  });

  test('storeCampaign responds with created status', async () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const req = { body: { name: 'Launch Blitz' }, user: { id: 'admin-7' } };

    await storeCampaign(req, res);

    expect(createCampaign).toHaveBeenCalledWith({ name: 'Launch Blitz' }, { actorId: 'admin-7' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'campaign-1' });
  });

  test('updateCampaignRecord delegates to service', async () => {
    const res = { json: jest.fn() };
    const req = { params: { campaignId: 'cmp-123' }, body: { status: 'paused' }, user: { id: 5 } };

    await updateCampaignRecord(req, res);

    expect(updateCampaign).toHaveBeenCalledWith('cmp-123', { status: 'paused' }, { actorId: 5 });
    expect(res.json).toHaveBeenCalledWith({ id: 'campaign-2' });
  });

  test('destroyCampaign responds with 204 and no body', async () => {
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    const req = { params: { campaignId: 'cmp-5' } };

    await destroyCampaign(req, res);

    expect(deleteCampaign).toHaveBeenCalledWith('cmp-5');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledWith();
  });

  test('creative lifecycle methods pass actor context', async () => {
    const reqStore = { body: { name: 'Hero Creative' }, user: { id: 44 } };
    const resStore = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await storeCreative(reqStore, resStore);
    expect(createCreative).toHaveBeenCalledWith({ name: 'Hero Creative' }, { actorId: 44 });

    const reqUpdate = { params: { creativeId: 'cr-2' }, body: { status: 'paused' }, user: { id: 'admin' } };
    const resUpdate = { json: jest.fn() };
    await updateCreativeRecord(reqUpdate, resUpdate);
    expect(updateCreative).toHaveBeenCalledWith('cr-2', { status: 'paused' }, { actorId: 'admin' });

    const reqDestroy = { params: { creativeId: 'cr-9' } };
    const resDestroy = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    await destroyCreative(reqDestroy, resDestroy);
    expect(deleteCreative).toHaveBeenCalledWith('cr-9');
    expect(resDestroy.status).toHaveBeenCalledWith(204);
  });

  test('placement lifecycle mirrors creative behaviour', async () => {
    const resStore = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await storePlacement({ body: { slot: 'hero' }, user: { id: 101 } }, resStore);
    expect(createPlacement).toHaveBeenCalledWith({ slot: 'hero' }, { actorId: 101 });

    const resUpdate = { json: jest.fn() };
    await updatePlacementRecord({ params: { placementId: 'pl-4' }, body: { status: 'archived' }, user: { id: 101 } }, resUpdate);
    expect(updatePlacement).toHaveBeenCalledWith('pl-4', { status: 'archived' }, { actorId: 101 });

    const resDestroy = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    await destroyPlacement({ params: { placementId: 'pl-4' } }, resDestroy);
    expect(deletePlacement).toHaveBeenCalledWith('pl-4');
    expect(resDestroy.status).toHaveBeenCalledWith(204);
  });
});
