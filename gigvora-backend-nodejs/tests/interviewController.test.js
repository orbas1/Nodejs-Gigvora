import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const serviceFunctionNames = [
  'getInterviewRoom',
  'createInterviewRoom',
  'upsertInterviewRoom',
  'addInterviewParticipant',
  'updateChecklistItem',
  'getInterviewWorkflow',
  'updateInterviewWorkflowLane',
  'listInterviewRooms',
  'deleteInterviewRoom',
  'updateInterviewParticipant',
  'removeInterviewParticipant',
  'createChecklistItem',
  'deleteChecklistItem',
  'createInterviewWorkflowLane',
  'deleteInterviewWorkflowLane',
  'createInterviewCard',
  'updateInterviewCard',
  'deleteInterviewCard',
  'listPanelTemplates',
  'createPanelTemplate',
  'updatePanelTemplate',
  'deletePanelTemplate',
  'listCandidatePrepPortals',
  'createCandidatePrepPortal',
  'updateCandidatePrepPortal',
  'deleteCandidatePrepPortal',
  'listInterviewWorkspaces',
  'getWorkspaceOverview',
];

const serviceExports = Object.fromEntries(serviceFunctionNames.map((name) => [name, jest.fn()]));

const { createInterviewRoom, upsertInterviewRoom, getInterviewWorkflow } = serviceExports;

const serviceModule = new URL('../src/services/interviewOrchestrationService.js', import.meta.url);

jest.unstable_mockModule(serviceModule.pathname, () => ({ ...serviceExports, default: serviceExports }));

let controller;
let AuthorizationError;
let ValidationError;

beforeAll(async () => {
  controller = await import('../src/controllers/interviewController.js');
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

describe('interviewController.index', () => {
  it('requires workspace access', async () => {
    await expect(controller.index({ query: {}, user: { id: 1 } }, createResponse())).rejects.toThrow(ValidationError);
    expect(getInterviewWorkflow).not.toHaveBeenCalled();
  });
});

describe('interviewController.store', () => {
  it('rejects unauthorised users', async () => {
    const req = { params: { workspaceId: '4' }, body: { name: 'Room' }, user: { id: 2 } };
    await expect(controller.store(req, createResponse())).rejects.toThrow(AuthorizationError);
    expect(createInterviewRoom).not.toHaveBeenCalled();
  });

  it('sanitises payload before creating a room', async () => {
    const res = createResponse();
    createInterviewRoom.mockResolvedValue({ id: 8 });

    await controller.store(
      {
        params: { workspaceId: '5' },
        body: { name: '  Demo ', hdEnabled: 'true', recordingEnabled: 'false' },
        user: { id: 3, roles: ['admin'] },
      },
      res,
    );

    expect(createInterviewRoom).toHaveBeenCalledWith({
      name: 'Demo',
      workspaceId: 5,
      hdEnabled: true,
      recordingEnabled: false,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 8 });
  });
});

describe('interviewController.update', () => {
  it('enforces payload structure', async () => {
    const req = { params: { roomId: '3' }, body: [], user: { id: 2, roles: ['admin'] } };
    await expect(controller.update(req, createResponse())).rejects.toThrow(ValidationError);
    expect(upsertInterviewRoom).not.toHaveBeenCalled();
  });
});
