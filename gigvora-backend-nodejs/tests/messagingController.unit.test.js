import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const listThreadsForUser = jest.fn();
const createThread = jest.fn();
const appendMessage = jest.fn();
const listMessages = jest.fn();
const getThread = jest.fn();
const markThreadRead = jest.fn();
const updateThreadState = jest.fn();
const muteThread = jest.fn();
const escalateThreadToSupport = jest.fn();
const assignSupportAgent = jest.fn();
const updateSupportCaseStatus = jest.fn();
const startOrJoinCall = jest.fn();
const updateThreadSettings = jest.fn();
const addParticipantsToThread = jest.fn();
const removeParticipantFromThread = jest.fn();

const serviceModule = new URL('../src/services/messagingService.js', import.meta.url);

const serviceExports = {
  listThreadsForUser,
  createThread,
  appendMessage,
  listMessages,
  getThread,
  markThreadRead,
  updateThreadState,
  muteThread,
  escalateThreadToSupport,
  assignSupportAgent,
  updateSupportCaseStatus,
  startOrJoinCall,
  updateThreadSettings,
  addParticipantsToThread,
  removeParticipantFromThread,
};

jest.unstable_mockModule(serviceModule.pathname, () => ({ ...serviceExports, default: serviceExports }));

let controller;
let AuthorizationError;
let ValidationError;

beforeAll(async () => {
  controller = await import('../src/controllers/messagingController.js');
  ({ AuthorizationError, ValidationError } = await import('../src/utils/errors.js'));
});

beforeEach(() => {
  jest.resetAllMocks();
});

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('messagingController.createConversation', () => {
  it('rejects empty participant lists', async () => {
    const req = { body: { userId: 3, subject: 'Hello' }, user: { id: 3 } };
    await expect(controller.createConversation(req, createResponse())).rejects.toThrow(ValidationError);
    expect(createThread).not.toHaveBeenCalled();
  });
});

describe('messagingController.assignSupport', () => {
  it('requires support permissions', async () => {
    const req = {
      params: { threadId: '5' },
      body: { agentId: 9 },
      user: { id: 2, role: 'user' },
    };
    await expect(controller.assignSupport(req, createResponse())).rejects.toThrow(AuthorizationError);
    expect(assignSupportAgent).not.toHaveBeenCalled();
  });

  it('parses identifiers and forwards metadata', async () => {
    assignSupportAgent.mockResolvedValue({ id: 11 });
    const res = createResponse();

    await controller.assignSupport(
      {
        params: { threadId: '7' },
        body: { agentId: '12', notifyAgent: 'false' },
        user: { id: 1, roles: ['support'] },
      },
      res,
    );

    expect(assignSupportAgent).toHaveBeenCalledWith(7, 12, { assignedBy: 1, notifyAgent: false });
    expect(res.json).toHaveBeenCalledWith({ id: 11 });
  });
});
