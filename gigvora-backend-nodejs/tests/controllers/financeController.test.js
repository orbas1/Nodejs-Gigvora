import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);
const financeServiceUrl = new URL('../../src/services/financeService.js', import.meta.url);
const insightsServiceUrl = new URL('../../src/services/financeInsightsService.js', import.meta.url);

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ __esModule: true, default: {} }));

const financeServiceMock = {
  getFinanceControlTowerOverview: jest.fn(),
};

const financeInsightsMock = {
  getFreelancerFinanceInsights: jest.fn(),
};

await jest.unstable_mockModule(financeServiceUrl.pathname, () => ({ __esModule: true, ...financeServiceMock }));
await jest.unstable_mockModule(insightsServiceUrl.pathname, () => ({ __esModule: true, ...financeInsightsMock }));

const controllerModule = await import('../../src/controllers/financeController.js');
const { controlTowerOverview, showFreelancerInsights } = controllerModule;
const { ValidationError } = await import('../../src/utils/errors.js');

function createResponse() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('financeController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves the control tower overview with date validation', async () => {
    const req = {
      user: { id: 12 },
      query: { dateFrom: '2024-01-01', dateTo: '2024-02-01', refresh: 'true' },
    };
    const res = createResponse();
    const overview = { totals: {} };
    financeServiceMock.getFinanceControlTowerOverview.mockResolvedValueOnce(overview);

    await controlTowerOverview(req, res);

    expect(financeServiceMock.getFinanceControlTowerOverview).toHaveBeenCalledWith(12, {
      dateFrom: '2024-01-01T00:00:00.000Z',
      dateTo: '2024-02-01T00:00:00.000Z',
      forceRefresh: true,
    });
    expect(res.json).toHaveBeenCalledWith(overview);
  });

  it('throws when user id is missing for control tower', async () => {
    const req = { query: {} };
    const res = createResponse();

    await expect(controlTowerOverview(req, res)).rejects.toThrow(ValidationError);
    expect(financeServiceMock.getFinanceControlTowerOverview).not.toHaveBeenCalled();
  });

  it('loads freelancer insights with a validated id', async () => {
    const req = { params: { freelancerId: '25' } };
    const res = createResponse();
    const insights = { ledger: [] };
    financeInsightsMock.getFreelancerFinanceInsights.mockResolvedValueOnce(insights);

    await showFreelancerInsights(req, res);

    expect(financeInsightsMock.getFreelancerFinanceInsights).toHaveBeenCalledWith(25);
    expect(res.json).toHaveBeenCalledWith(insights);
  });

  it('rejects invalid freelancer ids for insights', async () => {
    const req = { params: { freelancerId: 'abc' } };
    const res = createResponse();

    await expect(showFreelancerInsights(req, res)).rejects.toThrow(ValidationError);
    expect(financeInsightsMock.getFreelancerFinanceInsights).not.toHaveBeenCalled();
  });
});
