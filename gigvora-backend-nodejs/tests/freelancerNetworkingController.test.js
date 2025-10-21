import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const getFreelancerNetworkingDashboard = jest.fn();
const bookNetworkingSessionForFreelancer = jest.fn();
const updateFreelancerNetworkingSignup = jest.fn();
const cancelFreelancerNetworkingSignup = jest.fn();
const listFreelancerNetworkingConnections = jest.fn();
const createFreelancerNetworkingConnection = jest.fn();
const updateFreelancerNetworkingConnection = jest.fn();
const deleteFreelancerNetworkingConnection = jest.fn();
const listFreelancerNetworkingOrders = jest.fn();
const createFreelancerNetworkingOrder = jest.fn();
const updateFreelancerNetworkingOrder = jest.fn();
const deleteFreelancerNetworkingOrder = jest.fn();
const getFreelancerNetworkingSettings = jest.fn();
const updateFreelancerNetworkingSettings = jest.fn();
const updateFreelancerNetworkingPreferences = jest.fn();
const listFreelancerNetworkingCampaigns = jest.fn();
const createFreelancerNetworkingCampaign = jest.fn();
const updateFreelancerNetworkingCampaign = jest.fn();
const deleteFreelancerNetworkingCampaign = jest.fn();
const getFreelancerNetworkingAds = jest.fn();

const serviceModule = new URL('../src/services/freelancerNetworkingService.js', import.meta.url);

const serviceExports = {
  getFreelancerNetworkingDashboard,
  bookNetworkingSessionForFreelancer,
  updateFreelancerNetworkingSignup,
  cancelFreelancerNetworkingSignup,
  listFreelancerNetworkingConnections,
  createFreelancerNetworkingConnection,
  updateFreelancerNetworkingConnection,
  deleteFreelancerNetworkingConnection,
  listFreelancerNetworkingOrders,
  createFreelancerNetworkingOrder,
  updateFreelancerNetworkingOrder,
  deleteFreelancerNetworkingOrder,
  getFreelancerNetworkingSettings,
  updateFreelancerNetworkingSettings,
  updateFreelancerNetworkingPreferences,
  listFreelancerNetworkingCampaigns,
  createFreelancerNetworkingCampaign,
  updateFreelancerNetworkingCampaign,
  deleteFreelancerNetworkingCampaign,
  getFreelancerNetworkingAds,
};

jest.unstable_mockModule(serviceModule.pathname, () => ({ ...serviceExports, default: serviceExports }));

let controller;
let ValidationError;
let AuthorizationError;

beforeAll(async () => {
  controller = await import('../src/controllers/freelancerNetworkingController.js');
  ({ ValidationError, AuthorizationError } = await import('../src/utils/errors.js'));
});

beforeEach(() => {
  getFreelancerNetworkingDashboard.mockReset();
  bookNetworkingSessionForFreelancer.mockReset();
  updateFreelancerNetworkingSignup.mockReset();
  cancelFreelancerNetworkingSignup.mockReset();
  listFreelancerNetworkingConnections.mockReset();
  createFreelancerNetworkingConnection.mockReset();
  updateFreelancerNetworkingConnection.mockReset();
  deleteFreelancerNetworkingConnection.mockReset();
  listFreelancerNetworkingOrders.mockReset();
  createFreelancerNetworkingOrder.mockReset();
  updateFreelancerNetworkingOrder.mockReset();
  deleteFreelancerNetworkingOrder.mockReset();
  getFreelancerNetworkingSettings.mockReset();
  updateFreelancerNetworkingSettings.mockReset();
  updateFreelancerNetworkingPreferences.mockReset();
  listFreelancerNetworkingCampaigns.mockReset();
  createFreelancerNetworkingCampaign.mockReset();
  updateFreelancerNetworkingCampaign.mockReset();
  deleteFreelancerNetworkingCampaign.mockReset();
  getFreelancerNetworkingAds.mockReset();
});

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('freelancerNetworkingController.dashboard', () => {
  it('clamps lookback and limit parameters to sane bounds', async () => {
    getFreelancerNetworkingDashboard.mockResolvedValue({});
    const req = {
      params: { freelancerId: '15' },
      query: { lookbackDays: '999', limitConnections: '500' },
      user: { id: '15' },
    };
    const res = createResponse();

    await controller.dashboard(req, res);

    expect(getFreelancerNetworkingDashboard).toHaveBeenCalledWith(15, {
      lookbackDays: 365,
      limitConnections: 200,
    });
    expect(res.json).toHaveBeenCalledWith({});
  });

  it('rejects negative lookback values', async () => {
    const req = {
      params: { freelancerId: '9' },
      query: { lookbackDays: '-4' },
      user: { id: '9' },
    };
    const res = createResponse();

    await expect(controller.dashboard(req, res)).rejects.toThrow(ValidationError);
    expect(getFreelancerNetworkingDashboard).not.toHaveBeenCalled();
  });

  it('requires authentication when no actor matches the freelancer id', async () => {
    const req = {
      params: { freelancerId: '4' },
      query: {},
      user: null,
    };

    await expect(controller.dashboard(req, createResponse())).rejects.toThrow(AuthorizationError);
  });
});

describe('freelancerNetworkingController.listConnections', () => {
  it('applies limit bounds when listing connections', async () => {
    listFreelancerNetworkingConnections.mockResolvedValue({ items: [] });
    const req = {
      params: { freelancerId: '19' },
      query: { limit: '999' },
      user: { id: '19' },
    };
    const res = createResponse();

    await controller.listConnections(req, res);

    expect(listFreelancerNetworkingConnections).toHaveBeenCalledWith(19, { limit: 200 });
    expect(res.json).toHaveBeenCalledWith({ items: [] });
  });

  it('rejects invalid limit filters', async () => {
    const req = {
      params: { freelancerId: '19' },
      query: { limit: '-3' },
      user: { id: '19' },
    };

    await expect(controller.listConnections(req, createResponse())).rejects.toThrow(ValidationError);
    expect(listFreelancerNetworkingConnections).not.toHaveBeenCalled();
  });
});

describe('freelancerNetworkingController.metrics', () => {
  it('uses defaults when optional params are absent', async () => {
    getFreelancerNetworkingDashboard.mockResolvedValue({ summary: {}, metrics: {}, orders: {}, ads: {} });
    const req = {
      params: { freelancerId: '20' },
      query: {},
      user: { id: '20' },
    };
    const res = createResponse();

    await controller.metrics(req, res);

    expect(getFreelancerNetworkingDashboard).toHaveBeenCalledWith(20, {
      lookbackDays: 180,
      limitConnections: 100,
    });
    expect(res.json).toHaveBeenCalledWith({
      summary: {},
      metrics: {},
      orders: null,
      ads: null,
    });
  });
});

describe('freelancerNetworkingController.listOrders', () => {
  it('clamps pagination filters on orders', async () => {
    listFreelancerNetworkingOrders.mockResolvedValue({ items: [] });
    const req = {
      params: { freelancerId: '13' },
      query: { limit: '5000' },
      user: { id: '13' },
    };
    const res = createResponse();

    await controller.listOrders(req, res);

    expect(listFreelancerNetworkingOrders).toHaveBeenCalledWith(13, { limit: 200 });
    expect(res.json).toHaveBeenCalledWith({ items: [] });
  });
});
