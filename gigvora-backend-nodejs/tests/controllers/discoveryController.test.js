import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);
const serviceModuleUrl = new URL('../../src/services/discoveryService.js', import.meta.url);

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ __esModule: true, default: {} }));

const serviceMock = {
  getDiscoverySnapshot: jest.fn(),
  listJobs: jest.fn(),
  listGigs: jest.fn(),
  listProjects: jest.fn(),
  listLaunchpads: jest.fn(),
  listVolunteering: jest.fn(),
  listMentors: jest.fn(),
};

await jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({ __esModule: true, ...serviceMock }));

const controllerModule = await import('../../src/controllers/discoveryController.js');
const { snapshot, jobs, gigs, projects, launchpads, volunteering, mentors } = controllerModule;
const { ValidationError } = await import('../../src/utils/errors.js');

function createResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('discoveryController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sanitises snapshot limits and delegates to the service', async () => {
    const req = { query: { limit: '500' } };
    const res = createResponse();
    const payload = { items: [] };
    serviceMock.getDiscoverySnapshot.mockResolvedValueOnce(payload);

    await snapshot(req, res);

    expect(serviceMock.getDiscoverySnapshot).toHaveBeenCalledWith({ limit: 50 });
    expect(res.json).toHaveBeenCalledWith(payload);
  });

  it('normalises search options before listing jobs', async () => {
    const filters = { statuses: ['open'] };
    const req = {
      query: {
        page: '0',
        pageSize: '150',
        q: '  product designer  ',
        filters: JSON.stringify(filters),
        sort: 'newest',
        includeFacets: 'true',
        viewport: 'emea',
      },
    };
    const res = createResponse();
    const payload = { items: [], total: 0 };
    serviceMock.listJobs.mockResolvedValueOnce(payload);

    await jobs(req, res);

    expect(serviceMock.listJobs).toHaveBeenCalledWith({
      page: 1,
      pageSize: 50,
      query: 'product designer',
      filters,
      sort: 'newest',
      includeFacets: true,
      viewport: 'emea',
    });
    expect(res.json).toHaveBeenCalledWith(payload);
  });

  it('throws a validation error when filters payload is invalid', async () => {
    const req = { query: { filters: 'not json' } };
    const res = createResponse();

    await expect(jobs(req, res)).rejects.toThrow(ValidationError);
    expect(serviceMock.listJobs).not.toHaveBeenCalled();
  });

  it('delegates to each listing endpoint with shared parsing', async () => {
    const req = { query: { page: '2', pageSize: '10', sort: 'alphabetical' } };
    const res = createResponse();
    const payload = { items: [] };
    serviceMock.listGigs.mockResolvedValueOnce(payload);
    serviceMock.listProjects.mockResolvedValueOnce(payload);
    serviceMock.listLaunchpads.mockResolvedValueOnce(payload);
    serviceMock.listVolunteering.mockResolvedValueOnce(payload);
    serviceMock.listMentors.mockResolvedValueOnce(payload);

    await gigs(req, res);
    await projects(req, res);
    await launchpads(req, res);
    await volunteering(req, res);
    await mentors(req, res);

    expect(serviceMock.listGigs).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, pageSize: 10, sort: 'alphabetical' }),
    );
    expect(serviceMock.listProjects).toHaveBeenCalled();
    expect(serviceMock.listLaunchpads).toHaveBeenCalled();
    expect(serviceMock.listVolunteering).toHaveBeenCalled();
    expect(serviceMock.listMentors).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, pageSize: 10, sort: 'alphabetical' }),
    );
  });
});
