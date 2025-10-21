import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);
const storeModuleUrl = new URL('../../src/services/explorerStore.js', import.meta.url);
const collectionModuleUrl = new URL('../../src/utils/explorerCollections.js', import.meta.url);

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ __esModule: true, default: {} }));

const storeMock = {
  listRecords: jest.fn(),
  getRecord: jest.fn(),
  createRecord: jest.fn(),
  updateRecord: jest.fn(),
  deleteRecord: jest.fn(),
};

const resolveExplorerCollection = jest.fn((category) => `${category}-collection`);

await jest.unstable_mockModule(storeModuleUrl.pathname, () => ({ __esModule: true, ...storeMock }));
await jest.unstable_mockModule(collectionModuleUrl.pathname, () => ({ __esModule: true, resolveExplorerCollection }));

const controllerModule = await import('../../src/controllers/explorerController.js');
const {
  listExplorer,
  getExplorerRecord,
  createExplorerRecord,
  updateExplorerRecord,
  deleteExplorerRecord,
} = controllerModule;
const { ValidationError } = await import('../../src/utils/errors.js');

function createResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('explorerController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists explorer records with pagination, filters, and facets', async () => {
    const req = {
      params: { category: 'gig' },
      query: {
        q: 'Designer',
        sort: 'alphabetical',
        page: '2',
        pageSize: '30',
        filters: JSON.stringify({ locations: ['London'], statuses: ['active'] }),
      },
    };
    const res = createResponse();
    storeMock.listRecords.mockResolvedValueOnce([
      {
        id: '1',
        title: 'Senior Designer',
        summary: 'Design systems',
        description: 'Long form',
        status: 'active',
        location: 'London',
        skills: ['Figma'],
      },
      {
        id: '2',
        title: 'Junior Engineer',
        summary: 'Frontend',
        description: 'React work',
        status: 'draft',
        location: 'Paris',
        skills: ['React'],
      },
    ]);

    await listExplorer(req, res, jest.fn());

    expect(resolveExplorerCollection).toHaveBeenCalledWith('gig');
    expect(storeMock.listRecords).toHaveBeenCalledWith('gig-collection');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        pageSize: 30,
        total: 1,
        sort: 'alphabetical',
        appliedFilters: { locations: ['London'], statuses: ['active'] },
      }),
    );
  });

  it('throws validation error via next when sort is unsupported', async () => {
    const req = { params: { category: 'gig' }, query: { sort: 'new-hotness' } };
    const res = createResponse();
    const next = jest.fn();

    await listExplorer(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it('creates explorer records after normalising payloads', async () => {
    const req = {
      params: { category: 'job' },
      body: {
        title: 'Lead Developer',
        summary: 'Leading things',
        description: 'Full description',
        status: 'open',
        skills: 'JavaScript, Leadership ,JavaScript',
        price: { amount: '1200', currency: 'usd', unit: 'day' },
        media: { heroImage: 'https://example.com/hero.png' },
      },
    };
    const res = createResponse();
    const record = { id: 'abc', title: 'Lead Developer' };
    storeMock.createRecord.mockResolvedValueOnce(record);

    await createExplorerRecord(req, res, jest.fn());

    const [collection, payload] = storeMock.createRecord.mock.calls[0];
    expect(collection).toBe('job-collection');
    expect(payload).toMatchObject({
      title: 'Lead Developer',
      summary: 'Leading things',
      description: 'Full description',
      status: 'open',
      skills: ['JavaScript', 'Leadership'],
      price: { amount: 1200, currency: 'USD', unit: 'day' },
      heroImage: 'https://example.com/hero.png',
      category: 'job',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(record);
  });

  it('returns 400 when update validation fails', async () => {
    const req = {
      params: { category: 'gig', recordId: 'xyz' },
      body: {},
    };
    const res = createResponse();
    const next = jest.fn();

    await updateExplorerRecord(req, res, next);

    expect(storeMock.updateRecord).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Validation failed' }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('handles record deletion results', async () => {
    const req = { params: { category: 'gig', recordId: '1' } };
    const res = createResponse();
    storeMock.deleteRecord.mockResolvedValueOnce(true);

    await deleteExplorerRecord(req, res, jest.fn());

    expect(storeMock.deleteRecord).toHaveBeenCalledWith('gig-collection', '1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledWith();
  });

  it('returns 404 when explorer record does not exist', async () => {
    const req = { params: { category: 'gig', recordId: 'missing' } };
    const res = createResponse();
    storeMock.getRecord.mockResolvedValueOnce(null);

    await getExplorerRecord(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Explorer record not found' });
  });
});
