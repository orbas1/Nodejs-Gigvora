import { jest } from '@jest/globals';

process.env.LOG_LEVEL = 'silent';
process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

const serviceModuleUrl = new URL('../../src/services/adminAgencyManagementService.js', import.meta.url);

const listAgencies = jest.fn().mockResolvedValue({ items: [], pagination: { total: 0 } });
const getAgency = jest.fn().mockResolvedValue({ id: 'ag-1' });
const createAgency = jest.fn().mockResolvedValue({ id: 'ag-2' });
const updateAgency = jest.fn().mockResolvedValue({ id: 'ag-3' });
const archiveAgency = jest.fn().mockResolvedValue({ id: 'ag-4', status: 'archived' });

jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({
  listAgencies,
  getAgency,
  createAgency,
  updateAgency,
  archiveAgency,
}));

const controllerModuleUrl = new URL('../../src/controllers/adminAgencyManagementController.js', import.meta.url);
const { index, show, store, update, destroy } = await import(controllerModuleUrl.pathname);

describe('adminAgencyManagementController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('index passes through query parameters', async () => {
    const res = { json: jest.fn() };
    const req = { query: { search: 'atlas', status: 'active' } };

    await index(req, res);

    expect(listAgencies).toHaveBeenCalledWith({ search: 'atlas', status: 'active' });
    expect(res.json).toHaveBeenCalledWith({ items: [], pagination: { total: 0 } });
  });

  test('show loads agency by id', async () => {
    const res = { json: jest.fn() };
    const req = { params: { agencyId: 'ag-1' } };

    await show(req, res);

    expect(getAgency).toHaveBeenCalledWith('ag-1');
    expect(res.json).toHaveBeenCalledWith({ id: 'ag-1' });
  });

  test('store resolves actorId from request user', async () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const req = { body: { agencyName: 'Atlas' }, user: { id: 88 } };

    await store(req, res);

    expect(createAgency).toHaveBeenCalledWith({ agencyName: 'Atlas' }, { actorId: 88 });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('store falls back to auth context when user missing', async () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const req = { body: { agencyName: 'Nova' }, auth: { userId: 'admin-5' } };

    await store(req, res);

    expect(createAgency).toHaveBeenLastCalledWith({ agencyName: 'Nova' }, { actorId: 'admin-5' });
  });

  test('update delegates to service without actor context', async () => {
    const res = { json: jest.fn() };
    const req = { params: { agencyId: 'ag-3' }, body: { status: 'suspended' } };

    await update(req, res);

    expect(updateAgency).toHaveBeenCalledWith('ag-3', { status: 'suspended' });
    expect(res.json).toHaveBeenCalledWith({ id: 'ag-3' });
  });

  test('destroy resolves actorId from user or auth data', async () => {
    const res = { json: jest.fn() };
    const req = { params: { agencyId: 'ag-4' }, user: { id: 101 }, auth: { userId: 'fallback' } };

    await destroy(req, res);

    expect(archiveAgency).toHaveBeenCalledWith('ag-4', { actorId: 101 });
    expect(res.json).toHaveBeenCalledWith({ id: 'ag-4', status: 'archived' });
  });
});
