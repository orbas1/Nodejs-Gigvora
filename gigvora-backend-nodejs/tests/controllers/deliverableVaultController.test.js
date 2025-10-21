import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const serviceModuleUrl = new URL('../../src/services/deliverableVaultService.js', import.meta.url);
const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);

const serviceMock = {
  getVaultOverview: jest.fn(),
  getVaultItem: jest.fn(),
  createVaultItem: jest.fn(),
  updateVaultItem: jest.fn(),
  addDeliverableVersion: jest.fn(),
  generateDeliveryPackage: jest.fn(),
};

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ __esModule: true, default: {} }));
await jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({ __esModule: true, default: serviceMock, ...serviceMock }));

const controllerModule = await import('../../src/controllers/deliverableVaultController.js');
const {
  getOverview,
  getItem,
  createItem,
  updateItem,
  addVersion,
  generatePackage,
} = controllerModule;
const { ValidationError } = await import('../../src/utils/errors.js');

function createResponse() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
}

describe('deliverableVaultController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads overview with parsed freelancer id', async () => {
    const req = { query: { freelancerId: '15' } };
    const res = createResponse();
    const payload = { items: [] };
    const next = jest.fn();
    serviceMock.getVaultOverview.mockResolvedValueOnce(payload);

    await getOverview(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(serviceMock.getVaultOverview).toHaveBeenCalledWith({ freelancerId: 15 });
    expect(res.json).toHaveBeenCalledWith(payload);
  });

  it('rejects non-numeric item id', async () => {
    const req = { query: { freelancerId: '1' }, params: { itemId: 'abc' } };
    const res = createResponse();
    const next = jest.fn();

    await getItem(req, res, next);

    expect(serviceMock.getVaultItem).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it('creates item with actor defaulting to freelancer when missing', async () => {
    const req = { query: { freelancerId: '10' }, body: { title: 'Demo' } };
    const res = createResponse();
    const item = { id: 3 };
    const next = jest.fn();
    serviceMock.createVaultItem.mockResolvedValueOnce(item);

    await createItem(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(serviceMock.createVaultItem).toHaveBeenCalledWith({
      freelancerId: 10,
      actorId: 10,
      payload: { title: 'Demo' },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(item);
  });

  it('updates item with numeric identifiers and payload', async () => {
    const req = {
      query: { freelancerId: '10' },
      params: { itemId: '4' },
      body: { notes: 'Updated' },
      user: { id: 20 },
    };
    const res = createResponse();
    const updated = { id: 4, notes: 'Updated' };
    const next = jest.fn();
    serviceMock.updateVaultItem.mockResolvedValueOnce(updated);

    await updateItem(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(serviceMock.updateVaultItem).toHaveBeenCalledWith({
      itemId: 4,
      freelancerId: 10,
      actorId: 20,
      changes: { notes: 'Updated' },
    });
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('creates versions with parsed identifiers', async () => {
    const req = { query: { freelancerId: '2' }, params: { itemId: '9' }, body: { url: 'http://example.com' }, user: { id: 7 } };
    const res = createResponse();
    const version = { id: 1 };
    const next = jest.fn();
    serviceMock.addDeliverableVersion.mockResolvedValueOnce(version);

    await addVersion(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(serviceMock.addDeliverableVersion).toHaveBeenCalledWith({
      itemId: 9,
      freelancerId: 2,
      actorId: 7,
      version: { url: 'http://example.com' },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(version);
  });

  it('generates delivery package with numeric ids', async () => {
    const req = {
      query: { freelancerId: '3' },
      params: { itemId: '8' },
      body: { summary: 'Ready' },
      user: { id: 3 },
    };
    const res = createResponse();
    const packagePayload = { url: 'download' };
    const next = jest.fn();
    serviceMock.generateDeliveryPackage.mockResolvedValueOnce(packagePayload);

    await generatePackage(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(serviceMock.generateDeliveryPackage).toHaveBeenCalledWith({
      itemId: 8,
      freelancerId: 3,
      actorId: 3,
      summary: 'Ready',
      metrics: undefined,
      expiresInDays: undefined,
      includesWatermark: undefined,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(packagePayload);
  });
});
