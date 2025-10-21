process.env.NODE_ENV = 'test';

import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { AuthorizationError, ValidationError } from '../../src/utils/errors.js';

const serviceModuleUrl = new URL('../../src/services/projectOperationsService.js', import.meta.url);
const authorizationModuleUrl = new URL('../../src/middleware/authorization.js', import.meta.url);
const requestContextModuleUrl = new URL('../../src/utils/requestContext.js', import.meta.url);
const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);
const controllerModuleUrl = new URL('../../src/controllers/projectOperationsController.js', import.meta.url);

const serviceMockNames = [
  'getProjectOperations',
  'updateProjectOperations',
  'addProjectTask',
  'updateProjectTask',
  'removeProjectTask',
  'createProjectBudget',
  'updateProjectBudget',
  'deleteProjectBudget',
  'createProjectObject',
  'updateProjectObject',
  'deleteProjectObject',
  'createProjectTimelineEvent',
  'updateProjectTimelineEvent',
  'deleteProjectTimelineEvent',
  'createProjectMeeting',
  'updateProjectMeeting',
  'deleteProjectMeeting',
  'createProjectCalendarEntry',
  'updateProjectCalendarEntry',
  'deleteProjectCalendarEntry',
  'createProjectRole',
  'updateProjectRole',
  'deleteProjectRole',
  'createProjectSubmission',
  'updateProjectSubmission',
  'deleteProjectSubmission',
  'createProjectInvite',
  'updateProjectInvite',
  'deleteProjectInvite',
  'createProjectHrRecord',
  'updateProjectHrRecord',
  'deleteProjectHrRecord',
  'createProjectTimeLog',
  'updateProjectTimeLog',
  'deleteProjectTimeLog',
  'createProjectTarget',
  'updateProjectTarget',
  'deleteProjectTarget',
  'createProjectObjective',
  'updateProjectObjective',
  'deleteProjectObjective',
  'createConversationMessage',
  'createProjectFile',
  'updateProjectFile',
  'deleteProjectFile',
];

const serviceMocks = serviceMockNames.reduce((acc, name) => {
  acc[name] = jest.fn();
  return acc;
}, {});

const authorizationMocks = {
  hasProjectManagementAccess: jest.fn(),
};

const requestContextMocks = {
  resolveRequestUserId: jest.fn(),
};

await jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({ ...serviceMocks }));
await jest.unstable_mockModule(authorizationModuleUrl.pathname, () => ({ ...authorizationMocks }));
await jest.unstable_mockModule(requestContextModuleUrl.pathname, () => ({ ...requestContextMocks }));
await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({}));

const {
  show,
  upsert,
  addTask,
  updateTask,
  removeTask,
  createBudget,
} = await import(controllerModuleUrl.pathname);

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('projectOperationsController access and validation', () => {
  beforeEach(() => {
    Object.values(serviceMocks).forEach((mockFn) => mockFn.mockReset?.());
    Object.values(authorizationMocks).forEach((mockFn) => mockFn.mockReset?.());
    Object.values(requestContextMocks).forEach((mockFn) => mockFn.mockReset?.());
  });

  it('rejects requests from users without management access', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(false);
    requestContextMocks.resolveRequestUserId.mockReturnValue(12);

    await expect(show({ params: { projectId: '5' } }, createResponse())).rejects.toThrow(AuthorizationError);
    expect(serviceMocks.getProjectOperations).not.toHaveBeenCalled();
  });

  it('validates project identifiers for read operations', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(true);
    requestContextMocks.resolveRequestUserId.mockReturnValue(10);

    await expect(show({ params: { projectId: 'abc' } }, createResponse())).rejects.toThrow(ValidationError);
    expect(serviceMocks.getProjectOperations).not.toHaveBeenCalled();
  });

  it('returns workspace operations with access metadata', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(true);
    requestContextMocks.resolveRequestUserId.mockReturnValue(33);
    serviceMocks.getProjectOperations.mockResolvedValue({ summary: { tasks: 4 } });

    const res = createResponse();
    await show({ params: { projectId: '42' } }, res);

    expect(serviceMocks.getProjectOperations).toHaveBeenCalledWith(42);
    expect(res.json).toHaveBeenCalledWith({
      projectId: 42,
      operations: { summary: { tasks: 4 } },
      access: expect.objectContaining({ actorId: 33, canManage: true }),
    });
  });

  it('updates workspace operations with actor overrides', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(true);
    requestContextMocks.resolveRequestUserId.mockReturnValue(91);
    serviceMocks.updateProjectOperations.mockResolvedValue({ summary: { notes: 2 } });

    const res = createResponse();
    await upsert({ params: { projectId: '7' }, body: { status: 'updated', actorId: '55' } }, res);

    expect(serviceMocks.updateProjectOperations).toHaveBeenCalledWith(7, { status: 'updated' }, { actorId: 55 });
    expect(res.json).toHaveBeenCalledWith({
      projectId: 7,
      operations: { summary: { notes: 2 } },
      access: expect.objectContaining({ actorId: 91, performedBy: 55 }),
    });
  });

  it('creates tasks using management access with sanitised payloads', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(true);
    requestContextMocks.resolveRequestUserId.mockReturnValue(78);
    serviceMocks.addProjectTask.mockResolvedValue({ id: 9, title: 'Kick-off' });

    const res = createResponse();
    await addTask({ params: { projectId: '11' }, body: { title: ' Kick-off ', actorId: '999' } }, res);

    expect(serviceMocks.addProjectTask).toHaveBeenCalledWith(11, { title: ' Kick-off ' }, { actorId: 999 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      projectId: 11,
      task: { id: 9, title: 'Kick-off' },
      access: expect.objectContaining({ actorId: 78, performedBy: 999 }),
    });
  });

  it('updates tasks using contextual actor fallback', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(true);
    requestContextMocks.resolveRequestUserId.mockReturnValue(64);
    serviceMocks.updateProjectTask.mockResolvedValue({ id: 4, status: 'done' });

    const res = createResponse();
    await updateTask({ params: { projectId: '3', taskId: '4' }, body: { status: 'done' } }, res);

    expect(serviceMocks.updateProjectTask).toHaveBeenCalledWith(3, 4, { status: 'done' }, { actorId: 64 });
    expect(res.json).toHaveBeenCalledWith({
      projectId: 3,
      taskId: 4,
      task: { id: 4, status: 'done' },
      access: expect.objectContaining({ actorId: 64, performedBy: 64 }),
    });
  });

  it('removes tasks with validated identifiers', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(true);
    requestContextMocks.resolveRequestUserId.mockReturnValue(41);
    serviceMocks.removeProjectTask.mockResolvedValue({ success: true });

    const res = createResponse();
    await removeTask({ params: { projectId: '5', taskId: '77' } }, res);

    expect(serviceMocks.removeProjectTask).toHaveBeenCalledWith(5, 77, { actorId: 41 });
    expect(res.json).toHaveBeenCalledWith({
      projectId: 5,
      taskId: 77,
      result: { success: true },
      access: expect.objectContaining({ actorId: 41 }),
    });
  });

  it('creates budgets with access context metadata', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(true);
    requestContextMocks.resolveRequestUserId.mockReturnValue(21);
    serviceMocks.createProjectBudget.mockResolvedValue({ id: 6, label: 'Design' });

    const res = createResponse();
    await createBudget({ params: { projectId: '6' }, body: { label: 'Design', amount: 5000 } }, res);

    expect(serviceMocks.createProjectBudget).toHaveBeenCalledWith(6, { label: 'Design', amount: 5000 }, { actorId: 21 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      projectId: 6,
      budget: { id: 6, label: 'Design' },
      access: expect.objectContaining({ actorId: 21, performedBy: 21 }),
    });
  });
});
