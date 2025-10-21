import { jest } from '@jest/globals';

process.env.LOG_LEVEL = 'silent';
process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

const serviceModuleUrl = new URL('../../src/services/apiManagementService.js', import.meta.url);

const getApiRegistry = jest.fn().mockResolvedValue({ providers: [] });
const createApiProvider = jest.fn().mockResolvedValue({ id: 'provider-1' });
const updateApiProvider = jest.fn().mockResolvedValue({ id: 'provider-2' });
const createApiClient = jest.fn().mockResolvedValue({ id: 'client-1' });
const updateApiClient = jest.fn().mockResolvedValue({ id: 'client-2' });
const createApiClientKey = jest.fn().mockResolvedValue({ id: 'key-1' });
const revokeApiClientKey = jest.fn().mockResolvedValue({ id: 'key-2', status: 'revoked' });
const rotateWebhookSecret = jest.fn().mockResolvedValue({ secret: 'new-secret' });
const getClientAuditEvents = jest.fn().mockResolvedValue([{ id: 'audit-1' }]);
const listWalletAccounts = jest.fn().mockResolvedValue([{ id: 'wallet-1' }]);
const recordClientUsage = jest.fn().mockResolvedValue({ id: 'usage-1' });

jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({
  getApiRegistry,
  createApiProvider,
  updateApiProvider,
  createApiClient,
  updateApiClient,
  createApiClientKey,
  revokeApiClientKey,
  rotateWebhookSecret,
  getClientAuditEvents,
  listWalletAccounts,
  recordClientUsage,
}));

const controllerModuleUrl = new URL('../../src/controllers/adminApiController.js', import.meta.url);
const {
  registry,
  createProviderHandler,
  updateProviderHandler,
  createClientHandler,
  updateClientHandler,
  createClientKeyHandler,
  revokeClientKeyHandler,
  rotateWebhookHandler,
  listAuditEventsHandler,
  listWalletAccountsHandler,
  recordUsageHandler,
} = await import(controllerModuleUrl.pathname);

describe('adminApiController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('registry returns snapshot', async () => {
    const res = { json: jest.fn() };
    await registry({}, res);
    expect(getApiRegistry).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ providers: [] });
  });

  test('createProviderHandler passes actor context', async () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const req = { body: { name: 'Provider' }, user: { id: 'admin-1' } };
    await createProviderHandler(req, res);
    expect(createApiProvider).toHaveBeenCalledWith({ name: 'Provider' }, 'admin-1');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('updateProviderHandler forwards params and actor id', async () => {
    const res = { json: jest.fn() };
    const req = { params: { providerId: 'prov-2' }, body: { status: 'active' }, user: { id: 'admin-2' } };
    await updateProviderHandler(req, res);
    expect(updateApiProvider).toHaveBeenCalledWith('prov-2', { status: 'active' }, 'admin-2');
  });

  test('createClientHandler forwards actor id', async () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const req = { body: { name: 'Client' }, user: { id: 'admin-3' } };
    await createClientHandler(req, res);
    expect(createApiClient).toHaveBeenCalledWith({ name: 'Client' }, 'admin-3');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('updateClientHandler forwards identifiers and payload', async () => {
    const res = { json: jest.fn() };
    const req = { params: { clientId: 'client-9' }, body: { status: 'paused' }, user: { id: 7 } };
    await updateClientHandler(req, res);
    expect(updateApiClient).toHaveBeenCalledWith('client-9', { status: 'paused' }, 7);
  });

  test('createClientKeyHandler passes actor context', async () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const req = { params: { clientId: 'client-1' }, body: { label: 'Primary' }, user: { id: 'admin-1' } };
    await createClientKeyHandler(req, res);
    expect(createApiClientKey).toHaveBeenCalledWith('client-1', { label: 'Primary' }, 'admin-1');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('revokeClientKeyHandler forwards identifiers', async () => {
    const res = { json: jest.fn() };
    const req = { params: { clientId: 'client-2', keyId: 'key-9' }, user: { id: 5 } };
    await revokeClientKeyHandler(req, res);
    expect(revokeApiClientKey).toHaveBeenCalledWith('client-2', 'key-9', 5);
    expect(res.json).toHaveBeenCalledWith({ id: 'key-2', status: 'revoked' });
  });

  test('rotateWebhookHandler returns new secret', async () => {
    const res = { json: jest.fn() };
    const req = { params: { clientId: 'client-3' }, user: { id: 'admin-5' } };
    await rotateWebhookHandler(req, res);
    expect(rotateWebhookSecret).toHaveBeenCalledWith('client-3', 'admin-5');
    expect(res.json).toHaveBeenCalledWith({ secret: 'new-secret' });
  });

  test('listAuditEventsHandler forwards query parameters', async () => {
    const res = { json: jest.fn() };
    const req = { params: { clientId: 'client-4' }, query: { page: '2' } };
    await listAuditEventsHandler(req, res);
    expect(getClientAuditEvents).toHaveBeenCalledWith('client-4', { page: '2' });
    expect(res.json).toHaveBeenCalledWith({ events: [{ id: 'audit-1' }] });
  });

  test('listWalletAccountsHandler wraps service response', async () => {
    const res = { json: jest.fn() };
    const req = { query: { status: 'active' } };
    await listWalletAccountsHandler(req, res);
    expect(listWalletAccounts).toHaveBeenCalledWith({ status: 'active' });
    expect(res.json).toHaveBeenCalledWith({ accounts: [{ id: 'wallet-1' }] });
  });

  test('recordUsageHandler passes actor id and returns created resource', async () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const req = { params: { clientId: 'client-10' }, body: { units: 10 }, user: { id: 41 } };
    await recordUsageHandler(req, res);
    expect(recordClientUsage).toHaveBeenCalledWith('client-10', { units: 10 }, 41);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'usage-1' });
  });
});
