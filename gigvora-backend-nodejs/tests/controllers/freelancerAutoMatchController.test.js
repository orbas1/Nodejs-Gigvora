import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);
const serviceModuleUrl = new URL('../../src/services/autoAssignService.js', import.meta.url);

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ __esModule: true, default: {} }));

const serviceMock = {
  getFreelancerAutoMatchOverview: jest.fn(),
  listFreelancerMatches: jest.fn(),
  resolveQueueEntry: jest.fn(),
  updateFreelancerAutoMatchPreferences: jest.fn(),
};

await jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({ __esModule: true, ...serviceMock }));

const controllerModule = await import('../../src/controllers/freelancerAutoMatchController.js');
const { overview, matches, updatePreferences, respond } = controllerModule;
const { AuthorizationError, ValidationError } = await import('../../src/utils/errors.js');

function createResponse() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('freelancerAutoMatchController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the automatch overview for a freelancer', async () => {
    const req = { params: { freelancerId: '9' }, user: { id: 9, type: 'freelancer' } };
    const res = createResponse();
    const payload = { queue: [] };
    serviceMock.getFreelancerAutoMatchOverview.mockResolvedValueOnce(payload);

    await overview(req, res);

    expect(serviceMock.getFreelancerAutoMatchOverview).toHaveBeenCalledWith(9);
    expect(res.json).toHaveBeenCalledWith(payload);
  });

  it('lists matches with parsed pagination and statuses', async () => {
    const req = {
      params: { freelancerId: '12' },
      user: { id: 12, type: 'freelancer' },
      query: { page: '0', pageSize: '120', statuses: 'pending,accepted,ignored', includeHistorical: 'true' },
    };
    const res = createResponse();
    const result = { items: [] };
    serviceMock.listFreelancerMatches.mockResolvedValueOnce(result);

    await matches(req, res);

    expect(serviceMock.listFreelancerMatches).toHaveBeenCalledWith({
      freelancerId: 12,
      page: 1,
      pageSize: 50,
      statuses: ['pending', 'accepted'],
      includeHistorical: true,
    });
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it('updates preferences with actor context', async () => {
    const req = {
      params: { freelancerId: '5' },
      user: { id: 1, type: 'admin' },
      body: { enabled: true },
    };
    const res = createResponse();
    const payload = { enabled: true };
    serviceMock.updateFreelancerAutoMatchPreferences.mockResolvedValueOnce(payload);

    await updatePreferences(req, res);

    expect(serviceMock.updateFreelancerAutoMatchPreferences).toHaveBeenCalledWith(5, { enabled: true }, { actorId: 1 });
    expect(res.json).toHaveBeenCalledWith({ preference: payload });
  });

  it('resolves queue entries with validated status and ids', async () => {
    const req = {
      params: { freelancerId: '9', entryId: '33' },
      user: { id: 9, type: 'freelancer' },
      body: { status: 'ACCEPTED', rating: 5 },
    };
    const res = createResponse();
    const entry = { id: 33, status: 'accepted' };
    serviceMock.resolveQueueEntry.mockResolvedValueOnce(entry);

    await respond(req, res);

    expect(serviceMock.resolveQueueEntry).toHaveBeenCalledWith(33, 'accepted', {
      freelancerId: 9,
      actorId: 9,
      rating: 5,
      completionValue: undefined,
      reasonCode: undefined,
      reasonLabel: undefined,
      responseNotes: undefined,
      metadata: undefined,
    });
    expect(res.json).toHaveBeenCalledWith({ entry });
  });

  it('enforces authentication when responding to matches', async () => {
    const req = { params: { freelancerId: '5', entryId: '10' }, body: { status: 'accepted' } };
    const res = createResponse();

    await expect(respond(req, res)).rejects.toThrow(AuthorizationError);
  });

  it('rejects invalid freelancer identifiers', async () => {
    const req = { params: { freelancerId: 'abc' } };
    const res = createResponse();

    await expect(overview(req, res)).rejects.toThrow(ValidationError);
  });
});
