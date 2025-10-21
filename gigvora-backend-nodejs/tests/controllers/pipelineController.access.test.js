process.env.NODE_ENV = 'test';

import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { AuthorizationError, ValidationError } from '../../src/utils/errors.js';

const pipelineServiceModuleUrl = new URL('../../src/services/pipelineService.js', import.meta.url);
const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);
const controllerModuleUrl = new URL('../../src/controllers/pipelineController.js', import.meta.url);

const serviceMocks = {
  getFreelancerPipelineDashboard: jest.fn(),
  createPipelineDeal: jest.fn(),
  updatePipelineDeal: jest.fn(),
  createPipelineProposal: jest.fn(),
  createPipelineFollowUp: jest.fn(),
  updatePipelineFollowUp: jest.fn(),
  createPipelineCampaign: jest.fn(),
  deletePipelineDeal: jest.fn(),
  deletePipelineFollowUp: jest.fn(),
  deletePipelineProposal: jest.fn(),
  deletePipelineCampaign: jest.fn(),
};

const providerWorkspaceMock = { findOne: jest.fn() };
const providerWorkspaceMemberMock = { count: jest.fn() };

await jest.unstable_mockModule(pipelineServiceModuleUrl.pathname, () => ({ ...serviceMocks }));
await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({
  ProviderWorkspace: providerWorkspaceMock,
  ProviderWorkspaceMember: providerWorkspaceMemberMock,
}));

const { dashboard, storeDeal } = await import(controllerModuleUrl.pathname);

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  };
}

describe('pipelineController RBAC and orchestration', () => {
  beforeEach(() => {
    Object.values(serviceMocks).forEach((mockFn) => mockFn.mockReset?.());
    providerWorkspaceMock.findOne.mockReset();
    providerWorkspaceMemberMock.count.mockReset();
  });

  it('returns the pipeline dashboard for the authenticated freelancer owner', async () => {
    serviceMocks.getFreelancerPipelineDashboard.mockResolvedValue({
      board: { id: 99, ownerId: 44 },
      stages: [],
      summary: { totalDeals: 0 },
      grouping: { type: 'stage', columns: [] },
      campaigns: [],
      proposals: [],
      followUps: [],
      templates: [],
      viewOptions: ['stage'],
      viewDefinitions: [],
      enterprise: { metrics: [] },
      ads: { placements: [] },
    });

    const req = {
      query: { ownerId: '44' },
      user: { id: 44, userType: 'freelancer' },
    };
    const res = createResponse();

    await dashboard(req, res);

    expect(serviceMocks.getFreelancerPipelineDashboard).toHaveBeenCalledWith(44, {
      view: undefined,
      ownerType: 'freelancer',
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ownerType: 'freelancer', board: expect.objectContaining({ ownerId: 44 }) }),
    );
  });

  it('derives agency ownership from workspace membership when creating deals', async () => {
    providerWorkspaceMock.findOne.mockResolvedValue({ id: 88, ownerId: 12, type: 'agency', name: 'Atlas Ops' });
    providerWorkspaceMemberMock.count.mockResolvedValue(1);
    serviceMocks.createPipelineDeal.mockResolvedValue({ id: 501, ownerType: 'agency', boardId: 3001 });

    const req = {
      body: {
        ownerId: '88',
        title: 'Strategic Retainer',
        clientName: 'Northwind Labs',
        pipelineValue: 64000,
      },
      user: {
        id: 12,
        userType: 'agency',
        memberships: [
          {
            workspaceId: 88,
            role: 'agency_admin',
            workspace: { id: 88, type: 'agency' },
          },
        ],
      },
    };
    const res = createResponse();

    await storeDeal(req, res);

    expect(providerWorkspaceMock.findOne).toHaveBeenCalledWith({
      where: { id: 88, type: 'agency' },
      attributes: ['id', 'ownerId', 'name', 'type'],
    });
    expect(serviceMocks.createPipelineDeal).toHaveBeenCalledWith(
      88,
      expect.objectContaining({ title: 'Strategic Retainer', clientName: 'Northwind Labs' }),
      { ownerType: 'agency' },
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 501, ownerType: 'agency', boardId: 3001 });
  });

  it('rejects workspace access when the requester lacks membership privileges', async () => {
    providerWorkspaceMock.findOne.mockResolvedValue({ id: 77, ownerId: 91, type: 'agency', name: 'Growth Ops' });
    providerWorkspaceMemberMock.count.mockResolvedValue(0);

    const req = {
      body: {
        ownerId: '77',
        title: 'RevOps Expansion',
        clientName: 'Contoso',
      },
      user: {
        id: 45,
        userType: 'agency',
        memberships: [],
      },
    };

    await expect(storeDeal(req, createResponse())).rejects.toThrow(AuthorizationError);
    expect(serviceMocks.createPipelineDeal).not.toHaveBeenCalled();
  });

  it('validates provided owner types and surfaces helpful errors', async () => {
    const req = {
      body: {
        ownerId: '12',
        ownerType: 'invalid-owner',
        title: 'Invalid Deal',
        clientName: 'Acme',
      },
      user: { id: 12, userType: 'freelancer' },
    };

    await expect(storeDeal(req, createResponse())).rejects.toThrow(ValidationError);
    expect(serviceMocks.createPipelineDeal).not.toHaveBeenCalled();
  });
});
