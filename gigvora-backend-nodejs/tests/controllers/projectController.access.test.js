process.env.NODE_ENV = 'test';

import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { AuthorizationError, ValidationError } from '../../src/utils/errors.js';

const serviceModuleUrl = new URL('../../src/services/projectService.js', import.meta.url);
const authorizationModuleUrl = new URL('../../src/middleware/authorization.js', import.meta.url);
const requestContextModuleUrl = new URL('../../src/utils/requestContext.js', import.meta.url);
const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);
const controllerModuleUrl = new URL('../../src/controllers/projectController.js', import.meta.url);

const serviceMocks = {
  createProject: jest.fn(),
  updateProjectAutoAssign: jest.fn(),
  getProjectOverview: jest.fn(),
  listProjectEvents: jest.fn(),
  updateProjectDetails: jest.fn(),
};

const authorizationMocks = {
  hasProjectManagementAccess: jest.fn(),
};

const requestContextMocks = {
  resolveRequestUserId: jest.fn(),
};

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({}));
await jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({ ...serviceMocks }));
await jest.unstable_mockModule(authorizationModuleUrl.pathname, () => ({ ...authorizationMocks }));
await jest.unstable_mockModule(requestContextModuleUrl.pathname, () => ({ ...requestContextMocks }));

const { store, show, update, toggleAutoAssign, events } = await import(controllerModuleUrl.pathname);

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  };
}

describe('projectController RBAC and orchestration', () => {
  beforeEach(() => {
    Object.values(serviceMocks).forEach((mockFn) => mockFn.mockReset?.());
    Object.values(authorizationMocks).forEach((mockFn) => mockFn.mockReset?.());
    Object.values(requestContextMocks).forEach((mockFn) => mockFn.mockReset?.());
  });

  it('rejects project creation without a management role', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(false);
    requestContextMocks.resolveRequestUserId.mockReturnValue(51);

    await expect(store({ body: { title: 'x' } }, createResponse())).rejects.toThrow(AuthorizationError);
    expect(serviceMocks.createProject).not.toHaveBeenCalled();
  });

  it('rejects non-object payloads for project mutations', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(true);
    requestContextMocks.resolveRequestUserId.mockReturnValue(5);

    await expect(store({ body: 'invalid' }, createResponse())).rejects.toThrow(ValidationError);
    expect(serviceMocks.createProject).not.toHaveBeenCalled();
  });

  it('creates projects with sanitised payloads and access metadata', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(true);
    requestContextMocks.resolveRequestUserId.mockReturnValue(42);
    serviceMocks.createProject.mockResolvedValue({ project: { id: 11 }, queueEntries: [] });

    const res = createResponse();
    const req = { body: { title: 'New project', description: 'Detail', actorId: '101' } };

    await store(req, res);

    expect(serviceMocks.createProject).toHaveBeenCalledWith(
      { title: 'New project', description: 'Detail' },
      { actorId: 101 },
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      project: { id: 11 },
      queueEntries: [],
      access: expect.objectContaining({
        actorId: 42,
        performedBy: 101,
        canCreate: true,
        canManage: true,
      }),
    });
  });

  it('validates project identifiers before fetching project data', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(true);
    requestContextMocks.resolveRequestUserId.mockReturnValue(null);

    await expect(show({ params: { projectId: 'foo' } }, createResponse())).rejects.toThrow(ValidationError);
    expect(serviceMocks.getProjectOverview).not.toHaveBeenCalled();
  });

  it('returns project overview data with access metadata for authorised staff', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(true);
    requestContextMocks.resolveRequestUserId.mockReturnValue(78);
    serviceMocks.getProjectOverview.mockResolvedValue({ project: { id: 88 }, queueEntries: [{ id: 1 }] });

    const res = createResponse();
    await show({ params: { projectId: '88' } }, res);

    expect(serviceMocks.getProjectOverview).toHaveBeenCalledWith(88);
    expect(res.json).toHaveBeenCalledWith({
      projectId: 88,
      project: { id: 88 },
      queueEntries: [{ id: 1 }],
      access: expect.objectContaining({ canView: true, canManage: true, actorId: 78 }),
    });
  });

  it('updates projects with actor overrides while exposing access metadata', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(true);
    requestContextMocks.resolveRequestUserId.mockReturnValue(93);
    serviceMocks.updateProjectDetails.mockResolvedValue({ project: { id: 9 }, queueEntries: [] });

    const res = createResponse();
    const req = { params: { projectId: '9' }, body: { status: 'active', actorId: '222' } };

    await update(req, res);

    expect(serviceMocks.updateProjectDetails).toHaveBeenCalledWith(9, { status: 'active' }, { actorId: 222 });
    expect(res.json).toHaveBeenCalledWith({
      projectId: 9,
      project: { id: 9 },
      queueEntries: [],
      access: expect.objectContaining({ actorId: 93, performedBy: 222, canManage: true }),
    });
  });

  it('toggles auto assign queues with validated project identifiers', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(true);
    requestContextMocks.resolveRequestUserId.mockReturnValue(17);
    serviceMocks.updateProjectAutoAssign.mockResolvedValue({ project: { id: 12 }, queueEntries: [{ id: 'a' }] });

    const res = createResponse();
    await toggleAutoAssign(
      { params: { projectId: '12' }, body: { enabled: true, actorId: '300' } },
      res,
    );

    expect(serviceMocks.updateProjectAutoAssign).toHaveBeenCalledWith(
      12,
      { enabled: true },
      { actorId: 300 },
    );
    expect(res.json).toHaveBeenCalledWith({
      projectId: 12,
      project: { id: 12 },
      queueEntries: [{ id: 'a' }],
      access: expect.objectContaining({ performedBy: 300, actorId: 17, canToggleAutoAssign: true }),
    });
  });

  it('lists project events with limit clamping and access metadata', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(true);
    requestContextMocks.resolveRequestUserId.mockReturnValue(55);
    serviceMocks.listProjectEvents.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

    const res = createResponse();
    await events({ params: { projectId: '77' }, query: { limit: '250' } }, res);

    expect(serviceMocks.listProjectEvents).toHaveBeenCalledWith(77, { limit: 100 });
    expect(res.json).toHaveBeenCalledWith({
      projectId: 77,
      events: [{ id: 1 }, { id: 2 }, { id: 3 }],
      filters: { limit: 100 },
      meta: { count: 3 },
      access: expect.objectContaining({ actorId: 55, canView: true }),
    });
  });
});

