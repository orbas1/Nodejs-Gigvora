import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const serviceModuleUrl = new URL('../../src/services/connectionService.js', import.meta.url);
const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);

const serviceMock = {
  buildConnectionNetwork: jest.fn(),
  requestConnection: jest.fn(),
  respondToConnection: jest.fn(),
};

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ __esModule: true, default: {} }));
await jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({ __esModule: true, default: serviceMock, ...serviceMock }));

const controllerModule = await import('../../src/controllers/connectionController.js');
const { getNetwork, createConnection, respondToConnection } = controllerModule;
const { ValidationError } = await import('../../src/utils/errors.js');

function createResponse() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
}

describe('connectionController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires a valid user id to fetch network', async () => {
    const req = { query: {} };
    const res = createResponse();

    await expect(getNetwork(req, res)).rejects.toThrow(ValidationError);
    expect(serviceMock.buildConnectionNetwork).not.toHaveBeenCalled();
  });

  it('builds network with parsed identifiers and flags', async () => {
    const req = {
      query: { userId: '1', viewerId: '2', includePending: 'true' },
    };
    const res = createResponse();
    const payload = { nodes: [] };
    serviceMock.buildConnectionNetwork.mockResolvedValueOnce(payload);

    await getNetwork(req, res);

    expect(serviceMock.buildConnectionNetwork).toHaveBeenCalledWith({
      userId: 1,
      viewerId: 2,
      includePending: true,
    });
    expect(res.json).toHaveBeenCalledWith(payload);
  });

  it('creates a connection enforcing actor and target ids', async () => {
    const req = { body: { actorId: '5', targetId: '6' } };
    const res = createResponse();
    const connection = { id: 10 };
    serviceMock.requestConnection.mockResolvedValueOnce(connection);

    await createConnection(req, res);

    expect(serviceMock.requestConnection).toHaveBeenCalledWith(5, 6);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(connection);
  });

  it('throws when decision is invalid', async () => {
    const req = { params: { connectionId: '9' }, body: { actorId: 1, decision: 'maybe' } };
    const res = createResponse();

    await expect(respondToConnection(req, res)).rejects.toThrow(ValidationError);
    expect(serviceMock.respondToConnection).not.toHaveBeenCalled();
  });

  it('responds to connection with normalized status', async () => {
    const req = { params: { connectionId: '9' }, body: { actorId: '2', decision: 'ACCEPTED' } };
    const res = createResponse();
    const result = { id: 9, status: 'accepted', updatedAt: 'now' };
    serviceMock.respondToConnection.mockResolvedValueOnce(result);

    await respondToConnection(req, res);

    expect(serviceMock.respondToConnection).toHaveBeenCalledWith({
      connectionId: 9,
      actorId: 2,
      decision: 'accepted',
    });
    expect(res.json).toHaveBeenCalledWith({ id: 9, status: 'accepted', updatedAt: 'now' });
  });
});
