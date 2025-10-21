import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);
const storeModuleUrl = new URL('../../src/services/explorerEngagementStore.js', import.meta.url);
const recordStoreModuleUrl = new URL('../../src/services/explorerStore.js', import.meta.url);
const collectionModuleUrl = new URL('../../src/utils/explorerCollections.js', import.meta.url);

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ __esModule: true, default: {} }));

const engagementStoreMock = {
  listInteractions: jest.fn(),
  getInteraction: jest.fn(),
  createInteraction: jest.fn(),
  updateInteraction: jest.fn(),
  deleteInteraction: jest.fn(),
};

const recordStoreMock = {
  getRecord: jest.fn(),
};

const resolveExplorerCollection = jest.fn(() => 'gig-collection');

await jest.unstable_mockModule(storeModuleUrl.pathname, () => ({ __esModule: true, ...engagementStoreMock }));
await jest.unstable_mockModule(recordStoreModuleUrl.pathname, () => ({ __esModule: true, ...recordStoreMock }));
await jest.unstable_mockModule(collectionModuleUrl.pathname, () => ({ __esModule: true, resolveExplorerCollection }));

const controllerModule = await import('../../src/controllers/explorerEngagementController.js');
const {
  listExplorerInteractions,
  getExplorerInteraction,
  createExplorerInteraction,
  updateExplorerInteraction,
  deleteExplorerInteraction,
} = controllerModule;

function createResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('explorerEngagementController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    recordStoreMock.getRecord.mockResolvedValue({ id: '1' });
  });

  it('lists interactions after confirming record existence', async () => {
    const req = { params: { category: 'gig', recordId: '1' } };
    const res = createResponse();
    engagementStoreMock.listInteractions.mockResolvedValue([{ id: 'a' }]);

    await listExplorerInteractions(req, res, jest.fn());

    expect(recordStoreMock.getRecord).toHaveBeenCalledWith('gig-collection', '1');
    expect(engagementStoreMock.listInteractions).toHaveBeenCalledWith('gig-collection', '1');
    expect(res.json).toHaveBeenCalledWith({ items: [{ id: 'a' }] });
  });

  it('returns 404 when interaction is missing', async () => {
    const req = { params: { category: 'gig', recordId: '1', interactionId: 'missing' } };
    const res = createResponse();
    engagementStoreMock.getInteraction.mockResolvedValueOnce(null);

    await getExplorerInteraction(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Interaction not found' });
  });

  it('validates payloads when creating an interaction', async () => {
    const req = {
      params: { category: 'gig', recordId: '1' },
      body: {
        type: 'application',
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'I would love to collaborate',
      },
    };
    const res = createResponse();
    const interaction = { id: 'int-1' };
    engagementStoreMock.createInteraction.mockResolvedValueOnce(interaction);

    await createExplorerInteraction(req, res, jest.fn());

    expect(engagementStoreMock.createInteraction).toHaveBeenCalledWith(
      'gig-collection',
      '1',
      expect.objectContaining({ type: 'application', name: 'Jane Doe' }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(interaction);
  });

  it('returns validation errors with 400 responses on create', async () => {
    const req = { params: { category: 'gig', recordId: '1' }, body: { type: 'application' } };
    const res = createResponse();

    await createExplorerInteraction(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Validation failed' }),
    );
    expect(engagementStoreMock.createInteraction).not.toHaveBeenCalled();
  });

  it('updates and deletes interactions using the store', async () => {
    const req = {
      params: { category: 'gig', recordId: '1', interactionId: '2' },
      body: { status: 'won' },
    };
    const res = createResponse();
    engagementStoreMock.updateInteraction.mockResolvedValueOnce({ id: '2', status: 'won' });

    await updateExplorerInteraction(req, res, jest.fn());
    expect(engagementStoreMock.updateInteraction).toHaveBeenCalledWith(
      'gig-collection',
      '1',
      '2',
      { status: 'won' },
    );

    engagementStoreMock.deleteInteraction.mockResolvedValueOnce(true);
    await deleteExplorerInteraction(req, res, jest.fn());
    expect(engagementStoreMock.deleteInteraction).toHaveBeenCalledWith('gig-collection', '1', '2');
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
