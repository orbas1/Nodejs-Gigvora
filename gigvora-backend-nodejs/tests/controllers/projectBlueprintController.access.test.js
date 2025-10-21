process.env.NODE_ENV = 'test';

import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { AuthorizationError, ValidationError } from '../../src/utils/errors.js';

const serviceModuleUrl = new URL('../../src/services/projectBlueprintService.js', import.meta.url);
const authorizationModuleUrl = new URL('../../src/middleware/authorization.js', import.meta.url);
const requestContextModuleUrl = new URL('../../src/utils/requestContext.js', import.meta.url);
const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);
const controllerModuleUrl = new URL('../../src/controllers/projectBlueprintController.js', import.meta.url);

const serviceMocks = {
  listProjectBlueprints: jest.fn(),
  getProjectBlueprint: jest.fn(),
  upsertProjectBlueprint: jest.fn(),
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

const { index, show, upsert } = await import(controllerModuleUrl.pathname);

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  };
}

describe('projectBlueprintController security and orchestration', () => {
  beforeEach(() => {
    Object.values(serviceMocks).forEach((mockFn) => mockFn.mockReset?.());
    Object.values(authorizationMocks).forEach((mockFn) => mockFn.mockReset?.());
    Object.values(requestContextMocks).forEach((mockFn) => mockFn.mockReset?.());
  });

  it('rejects blueprint listing without a project management role', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(false);
    requestContextMocks.resolveRequestUserId.mockReturnValue(44);

    await expect(index({ query: {} }, createResponse())).rejects.toThrow(AuthorizationError);
    expect(serviceMocks.listProjectBlueprints).not.toHaveBeenCalled();
  });

  it('lists blueprints with pagination and owner filtering for authorised staff', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(true);
    requestContextMocks.resolveRequestUserId.mockReturnValue(88);
    serviceMocks.listProjectBlueprints.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const req = { query: { limit: '20', offset: '5', ownerId: '123' } };
    const res = createResponse();

    await index(req, res);

    expect(serviceMocks.listProjectBlueprints).toHaveBeenCalledWith({ limit: 20, offset: 5, ownerId: 123 });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        blueprints: [{ id: 1 }, { id: 2 }],
        filters: { ownerId: 123, limit: 20, offset: 5 },
        access: expect.objectContaining({
          actorId: 88,
          performedBy: 88,
          hasManagementRole: true,
          canView: true,
          canManage: true,
        }),
        meta: { count: 2 },
      }),
    );
  });

  it('validates project identifiers for blueprint detail access', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(true);

    await expect(show({ params: { projectId: 'abc' } }, createResponse())).rejects.toThrow(ValidationError);
    expect(serviceMocks.getProjectBlueprint).not.toHaveBeenCalled();
  });

  it('returns project blueprint details with access metadata', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(true);
    requestContextMocks.resolveRequestUserId.mockReturnValue(null);
    serviceMocks.getProjectBlueprint.mockResolvedValue({ project: { id: 55 }, blueprint: { summary: 'Ops' } });

    const res = createResponse();
    await show({ params: { projectId: '55' } }, res);

    expect(serviceMocks.getProjectBlueprint).toHaveBeenCalledWith(55);
    expect(res.json).toHaveBeenCalledWith({
      project: { id: 55 },
      blueprint: { summary: 'Ops' },
      access: {
        actorId: null,
        performedBy: null,
        hasManagementRole: true,
        canView: true,
        canManage: true,
      },
    });
  });

  it('upserts blueprints while sanitising payload and tracking actor overrides', async () => {
    authorizationMocks.hasProjectManagementAccess.mockReturnValue(true);
    requestContextMocks.resolveRequestUserId.mockReturnValue(77);
    serviceMocks.upsertProjectBlueprint.mockResolvedValue({
      project: { id: 72 },
      blueprint: { summary: 'Modern delivery' },
    });

    const req = {
      params: { projectId: '72' },
      body: {
        summary: 'Modern delivery',
        methodology: 'agile',
        actorId: '501',
      },
    };
    const res = createResponse();

    await upsert(req, res);

    expect(serviceMocks.upsertProjectBlueprint).toHaveBeenCalledWith(
      72,
      { summary: 'Modern delivery', methodology: 'agile' },
      { actorId: 501 },
    );
    expect(res.json).toHaveBeenCalledWith({
      project: { id: 72 },
      blueprint: { summary: 'Modern delivery' },
      access: {
        actorId: 77,
        performedBy: 501,
        hasManagementRole: true,
        canView: true,
        canManage: true,
      },
    });
  });
});
