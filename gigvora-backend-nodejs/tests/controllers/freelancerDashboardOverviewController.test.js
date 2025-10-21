import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);
const serviceModuleUrl = new URL('../../src/services/freelancerDashboardOverviewService.js', import.meta.url);

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ __esModule: true, default: {} }));

const serviceMock = {
  getFreelancerDashboardOverview: jest.fn(),
  updateFreelancerDashboardOverview: jest.fn(),
};

await jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({ __esModule: true, ...serviceMock }));

const controllerModule = await import('../../src/controllers/freelancerDashboardOverviewController.js');
const { showOverview, updateOverview } = controllerModule;
const { ValidationError } = await import('../../src/utils/errors.js');

function createResponse() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('freelancerDashboardOverviewController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the dashboard overview for a freelancer', async () => {
    const req = { params: { freelancerId: '21' } };
    const res = createResponse();
    const overview = { metrics: {} };
    serviceMock.getFreelancerDashboardOverview.mockResolvedValueOnce(overview);

    await showOverview(req, res);

    expect(serviceMock.getFreelancerDashboardOverview).toHaveBeenCalledWith(21);
    expect(res.json).toHaveBeenCalledWith(overview);
  });

  it('updates the dashboard overview with validated ids', async () => {
    const req = { params: { freelancerId: '21' }, body: { goals: [] } };
    const res = createResponse();
    const overview = { goals: [] };
    serviceMock.updateFreelancerDashboardOverview.mockResolvedValueOnce(overview);

    await updateOverview(req, res);

    expect(serviceMock.updateFreelancerDashboardOverview).toHaveBeenCalledWith(21, { goals: [] });
    expect(res.json).toHaveBeenCalledWith(overview);
  });

  it('rejects invalid freelancer identifiers', async () => {
    const req = { params: { freelancerId: 'invalid' } };
    const res = createResponse();

    await expect(showOverview(req, res)).rejects.toThrow(ValidationError);
  });
});
