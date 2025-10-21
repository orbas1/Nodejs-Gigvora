import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);
const serviceModuleUrl = new URL('../../src/services/freelancerAgencyService.js', import.meta.url);

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ __esModule: true, default: {} }));

const serviceMock = {
  getCollaborationsOverview: jest.fn(),
};

await jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({ __esModule: true, ...serviceMock }));

const controllerModule = await import('../../src/controllers/freelancerAgencyController.js');
const { collaborationsOverview } = controllerModule;
const { ValidationError } = await import('../../src/utils/errors.js');

function createResponse() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('freelancerAgencyController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads collaborations overview with parsed flags', async () => {
    const req = {
      params: { freelancerId: '45' },
      query: { lookbackDays: '30', includeInactive: 'true' },
    };
    const res = createResponse();
    const overview = { collaborations: [] };
    serviceMock.getCollaborationsOverview.mockResolvedValueOnce(overview);

    await collaborationsOverview(req, res);

    expect(serviceMock.getCollaborationsOverview).toHaveBeenCalledWith({
      freelancerId: 45,
      lookbackDays: 30,
      includeInactive: true,
    });
    expect(res.json).toHaveBeenCalledWith(overview);
  });

  it('throws when freelancer id is invalid', async () => {
    const req = { params: { freelancerId: 'abc' } };
    const res = createResponse();

    await expect(collaborationsOverview(req, res)).rejects.toThrow(ValidationError);
    expect(serviceMock.getCollaborationsOverview).not.toHaveBeenCalled();
  });
});
