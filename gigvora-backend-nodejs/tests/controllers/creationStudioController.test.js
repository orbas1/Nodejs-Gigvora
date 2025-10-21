import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const serviceModuleUrl = new URL('../../src/services/creationStudioService.js', import.meta.url);

const serviceMock = {
  listCreationStudioItems: jest.fn(),
  getCreationStudioOverview: jest.fn(),
  createCreationStudioItem: jest.fn(),
  updateCreationStudioItem: jest.fn(),
  publishCreationStudioItem: jest.fn(),
  deleteCreationStudioItem: jest.fn(),
  getWorkspace: jest.fn(),
  createItem: jest.fn(),
  updateItem: jest.fn(),
  recordStepProgress: jest.fn(),
  shareItem: jest.fn(),
  archiveItem: jest.fn(),
  CREATION_STUDIO_ITEM_TYPES: ['gig', 'job'],
  CREATION_STUDIO_ITEM_STATUSES: ['draft', 'published'],
};

await jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({ __esModule: true, ...serviceMock }));

const controllerModule = await import('../../src/controllers/creationStudioController.js');
const {
  overview,
  index,
  store,
  update,
  publish,
  destroy,
  getWorkspaceHandler,
  createItemHandler,
  updateItemHandler,
  recordStep,
  shareItemHandler,
  archiveItemHandler,
} = controllerModule;
const { ValidationError, AuthorizationError } = await import('../../src/utils/errors.js');

function createResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
}

describe('creationStudioController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns overview payload with parsed workspace id', async () => {
    const req = { query: { workspaceId: '42' } };
    const res = createResponse();
    const payload = { items: [] };
    serviceMock.getCreationStudioOverview.mockResolvedValueOnce(payload);

    await overview(req, res);

    expect(serviceMock.getCreationStudioOverview).toHaveBeenCalledWith({ workspaceId: 42 });
    expect(res.json).toHaveBeenCalledWith(payload);
  });

  it('lists items with validated filters and pagination defaults', async () => {
    const req = { query: { workspaceId: '10', type: 'gig', status: 'draft', search: 'design', limit: '5', offset: '2' } };
    const res = createResponse();
    serviceMock.listCreationStudioItems.mockResolvedValueOnce([]);

    await index(req, res);

    expect(serviceMock.listCreationStudioItems).toHaveBeenCalledWith({
      workspaceId: 10,
      type: 'gig',
      status: 'draft',
      search: 'design',
      limit: 5,
      offset: 2,
    });
    expect(res.json).toHaveBeenCalledWith({ items: [] });
  });

  it('rejects store requests without an authenticated actor', async () => {
    const req = { body: { workspaceId: 9 } };
    const res = createResponse();

    await expect(store(req, res)).rejects.toThrow(AuthorizationError);
    expect(serviceMock.createCreationStudioItem).not.toHaveBeenCalled();
  });

  it('creates workspace item when actor and workspace id supplied', async () => {
    const req = { user: { id: 7 }, body: { workspaceId: '3', title: 'Launchpad gig' } };
    const res = createResponse();
    const item = { id: 55 };
    serviceMock.createCreationStudioItem.mockResolvedValueOnce(item);

    await store(req, res);

    expect(serviceMock.createCreationStudioItem).toHaveBeenCalledWith({ workspaceId: 3, title: 'Launchpad gig' }, { actorId: 7 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(item);
  });

  it('updates an item with parsed identifier', async () => {
    const req = { params: { itemId: '12' }, body: { title: 'Updated' } };
    const res = createResponse();
    const item = { id: 12, title: 'Updated' };
    serviceMock.updateCreationStudioItem.mockResolvedValueOnce(item);

    await update(req, res);

    expect(serviceMock.updateCreationStudioItem).toHaveBeenCalledWith(12, { title: 'Updated' }, { actorId: null });
    expect(res.json).toHaveBeenCalledWith(item);
  });

  it('publishes an item using actor when provided', async () => {
    const req = { params: { itemId: '15' }, user: { id: 90 }, body: { publishAt: '2025-01-01T00:00:00Z' } };
    const res = createResponse();
    const item = { id: 15, status: 'scheduled' };
    serviceMock.publishCreationStudioItem.mockResolvedValueOnce(item);

    await publish(req, res);

    expect(serviceMock.publishCreationStudioItem).toHaveBeenCalledWith(15, { publishAt: '2025-01-01T00:00:00Z' }, { actorId: 90 });
    expect(res.json).toHaveBeenCalledWith(item);
  });

  it('destroys an item and returns no content', async () => {
    const req = { params: { itemId: '5' } };
    const res = createResponse();

    await destroy(req, res);

    expect(serviceMock.deleteCreationStudioItem).toHaveBeenCalledWith(5);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledWith();
  });

  it('returns workspace dashboard for owner', async () => {
    const req = { params: { id: '4' }, query: { includeArchived: 'true' } };
    const res = createResponse();
    const workspace = { items: [] };
    serviceMock.getWorkspace.mockResolvedValueOnce(workspace);

    await getWorkspaceHandler(req, res);

    expect(serviceMock.getWorkspace).toHaveBeenCalledWith(4, { includeArchived: true });
    expect(res.json).toHaveBeenCalledWith(workspace);
  });

  it('creates personal item using actor fallback', async () => {
    const req = { params: { id: '77' }, body: { type: 'gig' } };
    const res = createResponse();
    const item = { id: 1 };
    serviceMock.createItem.mockResolvedValueOnce(item);

    await createItemHandler(req, res);

    expect(serviceMock.createItem).toHaveBeenCalledWith(77, { type: 'gig' }, { actorId: 77 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(item);
  });

  it('returns 404 when updating missing personal item', async () => {
    const req = { params: { id: '9', itemId: '2' }, body: { title: 'Nope' } };
    const res = createResponse();
    serviceMock.updateItem.mockResolvedValueOnce(null);

    await updateItemHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Creation not found' });
  });

  it('records step progress and relays response', async () => {
    const req = { params: { id: '6', itemId: '12', stepKey: 'details' }, body: { completed: true } };
    const res = createResponse();
    const step = { stepKey: 'details', completed: true };
    serviceMock.recordStepProgress.mockResolvedValueOnce(step);

    await recordStep(req, res);

    expect(serviceMock.recordStepProgress).toHaveBeenCalledWith(6, 12, 'details', { completed: true }, { actorId: 6 });
    expect(res.json).toHaveBeenCalledWith(step);
  });

  it('returns 404 when step recording misses item', async () => {
    const req = { params: { id: '6', itemId: '12', stepKey: 'details' }, body: { completed: true } };
    const res = createResponse();
    serviceMock.recordStepProgress.mockResolvedValueOnce(null);

    await recordStep(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Creation not found' });
  });

  it('shares item with parsed identifiers', async () => {
    const req = { params: { id: '8', itemId: '4' }, user: { id: 11 }, body: { visibility: 'public' } };
    const res = createResponse();
    const item = { id: 4 };
    serviceMock.shareItem.mockResolvedValueOnce(item);

    await shareItemHandler(req, res);

    expect(serviceMock.shareItem).toHaveBeenCalledWith(8, 4, { visibility: 'public' }, { actorId: 11 });
    expect(res.json).toHaveBeenCalledWith(item);
  });

  it('archives item and returns no content', async () => {
    const req = { params: { id: '3', itemId: '1' }, body: {} };
    const res = createResponse();
    serviceMock.archiveItem.mockResolvedValueOnce(true);

    await archiveItemHandler(req, res);

    expect(serviceMock.archiveItem).toHaveBeenCalledWith(3, 1, { actorId: 3 });
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalledWith();
  });
});
