import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const getInboxWorkspace = jest.fn();
const updateInboxPreferences = jest.fn();
const createSavedReply = jest.fn();
const updateSavedReply = jest.fn();
const deleteSavedReply = jest.fn();
const createRoutingRule = jest.fn();
const updateRoutingRule = jest.fn();
const deleteRoutingRule = jest.fn();

const serviceModule = new URL('../src/services/inboxWorkspaceService.js', import.meta.url);

const serviceExports = {
  getInboxWorkspace,
  updateInboxPreferences,
  createSavedReply,
  updateSavedReply,
  deleteSavedReply,
  createRoutingRule,
  updateRoutingRule,
  deleteRoutingRule,
};

jest.unstable_mockModule(serviceModule.pathname, () => ({ ...serviceExports, default: serviceExports }));

let controller;
let AuthorizationError;
let ValidationError;

beforeAll(async () => {
  controller = await import('../src/controllers/inboxController.js');
  ({ AuthorizationError, ValidationError } = await import('../src/utils/errors.js'));
});

beforeEach(() => {
  jest.resetAllMocks();
});

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  };
}

describe('inboxController.createReply', () => {
  it('prioritises authenticated userId when present', async () => {
    createSavedReply.mockResolvedValue({ id: 10 });
    const res = createResponse();
    const req = {
      body: { userId: 2, title: 'Canned', body: 'Hello' },
      user: { id: 5 },
    };

    await controller.createReply(req, res);

    expect(createSavedReply).toHaveBeenCalledWith(5, expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('creates replies with sanitised payload', async () => {
    const res = createResponse();
    createSavedReply.mockResolvedValue({ id: 7 });

    await controller.createReply(
      {
        body: { userId: 3, title: '  Quick  ', body: 'Hello', shortcuts: ['hi ', ' hey'] },
        user: { id: 3 },
      },
      res,
    );

    expect(createSavedReply).toHaveBeenCalledWith(3, {
      userId: 3,
      title: 'Quick',
      body: 'Hello',
      shortcuts: ['hi', 'hey'],
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 7 });
  });
});

describe('inboxController.createRule', () => {
  it('validates rule structures', async () => {
    const req = {
      body: { userId: 4, name: 'Auto', conditions: 'invalid' },
      user: { id: 4 },
    };
    await expect(controller.createRule(req, createResponse())).rejects.toThrow(ValidationError);
    expect(createRoutingRule).not.toHaveBeenCalled();
  });
});
