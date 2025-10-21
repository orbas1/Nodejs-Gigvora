process.env.NODE_ENV = 'test';

import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { ValidationError } from '../../src/utils/errors.js';

const serviceModuleUrl = new URL('../../src/services/projectGigManagementWorkflowService.js', import.meta.url);
const projectAccessModuleUrl = new URL('../../src/utils/projectAccess.js', import.meta.url);
const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);
const controllerModuleUrl = new URL('../../src/controllers/projectGigManagementController.js', import.meta.url);

const serviceMocks = {
  getProjectGigManagementOverview: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  addProjectAsset: jest.fn(),
  updateProjectAsset: jest.fn(),
  deleteProjectAsset: jest.fn(),
  createProjectMilestone: jest.fn(),
  updateProjectMilestone: jest.fn(),
  deleteProjectMilestone: jest.fn(),
  createProjectCollaborator: jest.fn(),
  updateProjectCollaborator: jest.fn(),
  deleteProjectCollaborator: jest.fn(),
  createGigOrder: jest.fn(),
  updateGigOrder: jest.fn(),
  createProjectBid: jest.fn(),
  updateProjectBid: jest.fn(),
  sendProjectInvitation: jest.fn(),
  updateProjectInvitation: jest.fn(),
  updateAutoMatchSettings: jest.fn(),
  recordAutoMatchCandidate: jest.fn(),
  updateAutoMatchCandidate: jest.fn(),
  createProjectReview: jest.fn(),
  createEscrowTransaction: jest.fn(),
  updateEscrowSettings: jest.fn(),
  createGigTimelineEvent: jest.fn(),
  addGigTimelineEvent: jest.fn(),
  updateGigTimelineEvent: jest.fn(),
  createGigOrderMessage: jest.fn(),
  createGigOrderEscrowCheckpoint: jest.fn(),
  updateGigOrderEscrowCheckpoint: jest.fn(),
  getGigOrderDetail: jest.fn(),
  createGigSubmission: jest.fn(),
  addGigSubmission: jest.fn(),
  updateGigSubmission: jest.fn(),
  postGigChatMessage: jest.fn(),
  acknowledgeGigChatMessage: jest.fn(),
};

const projectAccessMocks = {
  parseOwnerId: jest.fn(),
  ensureManageAccess: jest.fn(),
  ensureViewAccess: jest.fn(),
};

await jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({ ...serviceMocks }));
await jest.unstable_mockModule(projectAccessModuleUrl.pathname, () => ({ ...projectAccessMocks }));
await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({}));

const {
  overview,
  storeProject,
  patchProject,
  destroyAsset,
  storeGigTimelineEvent,
  storeGigSubmission,
  storeGigChatMessage,
  storeGigEscrowCheckpoint,
  acknowledgeGigMessage,
} = await import(controllerModuleUrl.pathname);

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

function setOwnerContext({ ownerId = '7', access = {} } = {}) {
  projectAccessMocks.parseOwnerId.mockReturnValue(ownerId);
  const baseAccess = {
    actorId: 42,
    actorRole: 'project_manager',
    canView: true,
    canManage: true,
    allowedRoles: ['project_manager'],
    ...access,
  };
  projectAccessMocks.ensureManageAccess.mockReturnValue(baseAccess);
  projectAccessMocks.ensureViewAccess.mockReturnValue({ ...baseAccess, canManage: access.canManage ?? baseAccess.canManage });
  return baseAccess;
}

describe('projectGigManagementController access and validation', () => {
  beforeEach(() => {
    Object.values(serviceMocks).forEach((mockFn) => mockFn.mockReset());
    Object.values(projectAccessMocks).forEach((mockFn) => mockFn.mockReset());
  });

  it('returns gig dashboard overview with access metadata', async () => {
    const access = setOwnerContext({ ownerId: '12', access: { actorId: 88, canManage: false } });
    serviceMocks.getProjectGigManagementOverview.mockResolvedValue({ totals: { gigs: 5 } });

    const res = createResponse();
    await overview({ params: { userId: '12' } }, res);

    expect(serviceMocks.getProjectGigManagementOverview).toHaveBeenCalledWith(12);
    expect(res.json).toHaveBeenCalledWith({
      dashboard: {
        totals: { gigs: 5 },
        access: expect.objectContaining({ actorId: 88, canManage: false, canView: true }),
      },
      access: expect.objectContaining({ actorId: 88, canManage: false, canView: true }),
    });
  });

  it('creates projects using managed access with sanitized payloads', async () => {
    const access = setOwnerContext({ ownerId: '9', access: { actorId: 55 } });
    serviceMocks.createProject.mockResolvedValue({ id: 321, name: 'Discovery' });
    serviceMocks.getProjectGigManagementOverview.mockResolvedValue({ totals: { projects: 3 } });

    const res = createResponse();
    await storeProject({ params: { userId: '9' }, body: { name: 'Discovery', actorId: '777' } }, res);

    expect(serviceMocks.createProject).toHaveBeenCalledWith(9, { name: 'Discovery' });
    expect(serviceMocks.getProjectGigManagementOverview).toHaveBeenCalledWith(9);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      project: { id: 321, name: 'Discovery' },
      dashboard: {
        totals: { projects: 3 },
        access: expect.objectContaining({ performedBy: 777 }),
      },
      access: expect.objectContaining({ actorId: 55, performedBy: 777 }),
    });
  });

  it('validates identifiers for update operations', async () => {
    setOwnerContext({ ownerId: '4' });
    await expect(patchProject({ params: { userId: '4', projectId: 'not-a-number' }, body: {} }, createResponse())).rejects.toThrow(
      ValidationError,
    );
    expect(serviceMocks.updateProject).not.toHaveBeenCalled();
  });

  it('deletes assets without forwarding payloads to the service', async () => {
    setOwnerContext({ ownerId: '3' });
    serviceMocks.deleteProjectAsset.mockResolvedValue({ success: true });
    serviceMocks.getProjectGigManagementOverview.mockResolvedValue({ totals: { assets: 1 } });

    const res = createResponse();
    await destroyAsset({ params: { userId: '3', projectId: '11', assetId: '7' }, body: { actorId: '101' } }, res);

    expect(serviceMocks.deleteProjectAsset).toHaveBeenCalledWith(3, 11, 7);
    expect(res.json).toHaveBeenCalledWith({
      asset: { success: true },
      dashboard: expect.objectContaining({ access: expect.objectContaining({ performedBy: 101 }) }),
      access: expect.objectContaining({ performedBy: 101 }),
    });
  });

  it('creates timeline events using extended payloads when provided', async () => {
    setOwnerContext({ ownerId: '6', access: { actorId: 90 } });
    serviceMocks.createGigTimelineEvent.mockResolvedValue({ id: 5, summary: 'Kick-off' });
    serviceMocks.getGigOrderDetail.mockResolvedValue({ id: 17, status: 'active' });

    const res = createResponse();
    await storeGigTimelineEvent(
      { params: { userId: '6', orderId: '17' }, body: { summary: 'Kick-off', actorId: '222', eventType: 'milestone' } },
      res,
    );

    expect(serviceMocks.createGigTimelineEvent).toHaveBeenCalledWith(6, 17, { summary: 'Kick-off', eventType: 'milestone' }, {
      actorId: 222,
    });
    expect(serviceMocks.addGigTimelineEvent).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      event: { id: 5, summary: 'Kick-off' },
      order: {
        id: 17,
        status: 'active',
        access: expect.objectContaining({ performedBy: 222 }),
      },
      access: expect.objectContaining({ performedBy: 222 }),
    });
  });

  it('adds gig submissions using streamlined payloads when no extended fields exist', async () => {
    setOwnerContext({ ownerId: '2', access: { actorId: 33 } });
    serviceMocks.addGigSubmission.mockResolvedValue({ id: 8, notes: 'Uploaded files' });
    serviceMocks.getGigOrderDetail.mockResolvedValue({ id: 91, status: 'review' });

    const res = createResponse();
    await storeGigSubmission(
      { params: { userId: '2', orderId: '91' }, body: { notes: 'Uploaded files', actorId: '33' } },
      res,
    );

    expect(serviceMocks.addGigSubmission).toHaveBeenCalledWith(2, 91, { notes: 'Uploaded files' });
    expect(serviceMocks.createGigSubmission).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      submission: { id: 8, notes: 'Uploaded files' },
      order: expect.objectContaining({ id: 91, access: expect.objectContaining({ actorId: 33 }) }),
      access: expect.objectContaining({ performedBy: 33 }),
    });
  });

  it('posts chat messages with actor context metadata', async () => {
    setOwnerContext({ ownerId: '14', access: { actorId: 70, actorRole: 'operator' } });
    serviceMocks.postGigChatMessage.mockResolvedValue({ id: 4, body: 'Hello' });
    serviceMocks.getGigOrderDetail.mockResolvedValue({ id: 44, status: 'active' });

    const res = createResponse();
    await storeGigChatMessage(
      { params: { userId: '14', orderId: '44' }, body: { body: 'Hello' }, user: { name: 'Jane Manager' } },
      res,
    );

    expect(serviceMocks.postGigChatMessage).toHaveBeenCalledWith(14, 44, { body: 'Hello' }, { actorId: 70, actorRole: 'operator' });
    expect(res.json).toHaveBeenCalledWith({
      message: { id: 4, body: 'Hello' },
      order: expect.objectContaining({ id: 44, access: expect.objectContaining({ actorId: 70 }) }),
      access: expect.objectContaining({ actorId: 70 }),
    });
  });

  it('records escrow checkpoints and refreshes dashboards', async () => {
    setOwnerContext({ ownerId: '18', access: { actorId: 12, actorRole: 'admin' } });
    serviceMocks.createGigOrderEscrowCheckpoint.mockResolvedValue({ id: 6, amount: 500 });
    serviceMocks.getProjectGigManagementOverview.mockResolvedValue({ totals: { checkpoints: 2 } });

    const res = createResponse();
    await storeGigEscrowCheckpoint(
      { params: { userId: '18', orderId: '33' }, body: { amount: 500, actorId: '777' } },
      res,
    );

    expect(serviceMocks.createGigOrderEscrowCheckpoint).toHaveBeenCalledWith(18, 33, { amount: 500 }, {
      actorId: 777,
      actorRole: 'admin',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      checkpoint: { id: 6, amount: 500 },
      dashboard: expect.objectContaining({ access: expect.objectContaining({ performedBy: 777 }) }),
      access: expect.objectContaining({ performedBy: 777 }),
    });
  });

  it('acknowledges gig messages using contextual actor fallback', async () => {
    setOwnerContext({ ownerId: '25', access: { actorId: 61 } });
    serviceMocks.acknowledgeGigChatMessage.mockResolvedValue({ id: 9, acknowledged: true });
    serviceMocks.getGigOrderDetail.mockResolvedValue({ id: 101, status: 'done' });

    const res = createResponse();
    await acknowledgeGigMessage({ params: { userId: '25', orderId: '101', messageId: '9' }, body: {} }, res);

    expect(serviceMocks.acknowledgeGigChatMessage).toHaveBeenCalledWith(25, 101, 9, { actorId: 61 });
    expect(res.json).toHaveBeenCalledWith({
      message: { id: 9, acknowledged: true },
      order: expect.objectContaining({ id: 101, access: expect.objectContaining({ actorId: 61 }) }),
      access: expect.objectContaining({ actorId: 61 }),
    });
  });
});
