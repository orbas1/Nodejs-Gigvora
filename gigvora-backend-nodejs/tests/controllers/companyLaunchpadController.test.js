import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const serviceModuleUrl = new URL('../../src/services/companyLaunchpadService.js', import.meta.url);
const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);

const serviceMock = {
  getLaunchpadJobDashboard: jest.fn(),
  linkJobToLaunchpad: jest.fn(),
  updateLaunchpadJobLink: jest.fn(),
  removeLaunchpadJobLink: jest.fn(),
  createLaunchpadPlacement: jest.fn(),
  updateLaunchpadPlacement: jest.fn(),
  removeLaunchpadPlacement: jest.fn(),
};

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ __esModule: true }));
await jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({ __esModule: true, ...serviceMock }));

const controllerModule = await import('../../src/controllers/companyLaunchpadController.js');
const {
  dashboard,
  createLink,
  updateLink,
  removeLink,
  createPlacementEntry,
  updatePlacementEntry,
  removePlacementEntry,
} = controllerModule;
const { ValidationError } = await import('../../src/utils/errors.js');

function createResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('companyLaunchpadController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns launchpad dashboard data with parsed numeric filters and default lookback', async () => {
    const req = { query: { workspaceId: '42', workspaceSlug: 'innovation-lab', launchpadId: '7', lookbackDays: '60' } };
    const res = createResponse();
    const payload = { summary: { totalLinks: 4 } };
    serviceMock.getLaunchpadJobDashboard.mockResolvedValueOnce(payload);

    await dashboard(req, res);

    expect(serviceMock.getLaunchpadJobDashboard).toHaveBeenCalledWith({
      workspaceId: 42,
      workspaceSlug: 'innovation-lab',
      launchpadId: 7,
      lookbackDays: 60,
    });
    expect(res.json).toHaveBeenCalledWith(payload);
  });

  it('defaults lookback window when no override supplied', async () => {
    const req = { query: {} };
    const res = createResponse();
    serviceMock.getLaunchpadJobDashboard.mockResolvedValueOnce({ links: [] });

    await dashboard(req, res);

    expect(serviceMock.getLaunchpadJobDashboard).toHaveBeenCalledWith({
      workspaceId: undefined,
      workspaceSlug: undefined,
      launchpadId: undefined,
      lookbackDays: 90,
    });
  });

  it('enforces actor context when linking jobs to launchpad', async () => {
    const req = { body: { launchpadId: 5, jobId: 9 } };
    const res = createResponse();

    await expect(createLink(req, res)).rejects.toThrow(ValidationError);
    expect(serviceMock.linkJobToLaunchpad).not.toHaveBeenCalled();
  });

  it('creates launchpad link with authenticated actor id', async () => {
    const req = { body: { launchpadId: 5, jobId: 9 }, user: { id: 88 } };
    const res = createResponse();
    const link = { id: 123, launchpadId: 5, jobId: 9 };
    serviceMock.linkJobToLaunchpad.mockResolvedValueOnce(link);

    await createLink(req, res);

    expect(serviceMock.linkJobToLaunchpad).toHaveBeenCalledWith({ launchpadId: 5, jobId: 9, createdById: 88 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(link);
  });

  it('updates an existing launchpad link using parsed identifier', async () => {
    const req = { params: { linkId: '321' }, body: { notes: 'Updated context' } };
    const res = createResponse();
    const updated = { id: 321, notes: 'Updated context' };
    serviceMock.updateLaunchpadJobLink.mockResolvedValueOnce(updated);

    await updateLink(req, res);

    expect(serviceMock.updateLaunchpadJobLink).toHaveBeenCalledWith(321, { notes: 'Updated context' });
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('removes a launchpad link and returns no content', async () => {
    const req = { params: { linkId: '222' } };
    const res = createResponse();
    serviceMock.removeLaunchpadJobLink.mockResolvedValueOnce(undefined);

    await removeLink(req, res);

    expect(serviceMock.removeLaunchpadJobLink).toHaveBeenCalledWith(222);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledWith();
  });

  it('creates a placement entry with numeric identifiers', async () => {
    const req = { params: { linkId: '11' }, body: { candidateId: 45 } };
    const res = createResponse();
    const placement = { id: 9, candidateId: 45 };
    serviceMock.createLaunchpadPlacement.mockResolvedValueOnce(placement);

    await createPlacementEntry(req, res);

    expect(serviceMock.createLaunchpadPlacement).toHaveBeenCalledWith(11, { candidateId: 45 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(placement);
  });

  it('updates a placement entry with validated identifier', async () => {
    const req = { params: { placementId: '77' }, body: { status: 'active' } };
    const res = createResponse();
    const placement = { id: 77, status: 'active' };
    serviceMock.updateLaunchpadPlacement.mockResolvedValueOnce(placement);

    await updatePlacementEntry(req, res);

    expect(serviceMock.updateLaunchpadPlacement).toHaveBeenCalledWith(77, { status: 'active' });
    expect(res.json).toHaveBeenCalledWith(placement);
  });

  it('deletes a placement entry and responds with no content', async () => {
    const req = { params: { placementId: '44' } };
    const res = createResponse();
    serviceMock.removeLaunchpadPlacement.mockResolvedValueOnce(undefined);

    await removePlacementEntry(req, res);

    expect(serviceMock.removeLaunchpadPlacement).toHaveBeenCalledWith(44);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledWith();
  });
});
