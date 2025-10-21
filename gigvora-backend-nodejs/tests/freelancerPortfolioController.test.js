import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const getPortfolio = jest.fn();
const createPortfolioItem = jest.fn();
const updatePortfolioItem = jest.fn();
const deletePortfolioItem = jest.fn();
const createPortfolioAsset = jest.fn();
const updatePortfolioAsset = jest.fn();
const deletePortfolioAsset = jest.fn();
const updatePortfolioSettings = jest.fn();

const serviceModule = new URL('../src/services/freelancerPortfolioService.js', import.meta.url);

const serviceExports = {
  getPortfolio,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  createPortfolioAsset,
  updatePortfolioAsset,
  deletePortfolioAsset,
  updatePortfolioSettings,
};

jest.unstable_mockModule(serviceModule.pathname, () => ({ ...serviceExports, default: serviceExports }));

let controller;
let ValidationError;
let AuthorizationError;

beforeAll(async () => {
  controller = await import('../src/controllers/freelancerPortfolioController.js');
  ({ ValidationError, AuthorizationError } = await import('../src/utils/errors.js'));
});

beforeEach(() => {
  getPortfolio.mockReset();
  createPortfolioItem.mockReset();
  updatePortfolioItem.mockReset();
  deletePortfolioItem.mockReset();
  createPortfolioAsset.mockReset();
  updatePortfolioAsset.mockReset();
  deletePortfolioAsset.mockReset();
  updatePortfolioSettings.mockReset();
});

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  };
}

describe('freelancerPortfolioController.listPortfolio', () => {
  it('enforces authentication and bypass flags', async () => {
    getPortfolio.mockResolvedValue({ items: [] });
    const req = {
      params: { userId: '21' },
      query: { fresh: 'true' },
      user: { id: '21' },
    };
    const res = createResponse();

    await controller.listPortfolio(req, res);

    expect(getPortfolio).toHaveBeenCalledWith(21, { bypassCache: true });
    expect(res.json).toHaveBeenCalledWith({ items: [] });
  });

  it('rejects unauthenticated access', async () => {
    const req = { params: { userId: '21' }, query: {}, user: null };

    await expect(controller.listPortfolio(req, createResponse())).rejects.toThrow(AuthorizationError);
    expect(getPortfolio).not.toHaveBeenCalled();
  });
});

describe('freelancerPortfolioController.createPortfolioItem', () => {
  it('validates identifiers and payloads', async () => {
    createPortfolioItem.mockResolvedValue({ id: 5 });
    const req = {
      params: { userId: '21' },
      body: { title: 'Project', tags: ['node'] },
      user: { id: '21' },
    };
    const res = createResponse();

    await controller.createPortfolioItem(req, res);

    expect(createPortfolioItem).toHaveBeenCalledWith(21, { title: 'Project', tags: ['node'] });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 5 });
  });

  it('throws when payload is not an object', async () => {
    const req = {
      params: { userId: '21' },
      body: ['bad'],
      user: { id: '21' },
    };

    await expect(controller.createPortfolioItem(req, createResponse())).rejects.toThrow(ValidationError);
    expect(createPortfolioItem).not.toHaveBeenCalled();
  });
});

describe('freelancerPortfolioController.updatePortfolioSettings', () => {
  it('rejects empty updates', async () => {
    const req = {
      params: { userId: '21' },
      body: {},
      user: { id: '21' },
    };

    await expect(controller.updatePortfolioSettings(req, createResponse())).rejects.toThrow(ValidationError);
    expect(updatePortfolioSettings).not.toHaveBeenCalled();
  });

  it('persists sanitized settings', async () => {
    updatePortfolioSettings.mockResolvedValue({ theme: 'dark' });
    const req = {
      params: { userId: '21' },
      body: { theme: 'dark', sections: ['work'] },
      user: { id: '21' },
    };
    const res = createResponse();

    await controller.updatePortfolioSettings(req, res);

    expect(updatePortfolioSettings).toHaveBeenCalledWith(21, { theme: 'dark', sections: ['work'] });
    expect(res.json).toHaveBeenCalledWith({ theme: 'dark' });
  });
});
