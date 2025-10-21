import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const getFreelancerDisputeDashboard = jest.fn();
const openFreelancerDispute = jest.fn();
const getFreelancerDisputeDetail = jest.fn();
const appendFreelancerDisputeEvent = jest.fn();

const disputeServiceModule = new URL('../src/services/freelancerDisputeService.js', import.meta.url);

jest.unstable_mockModule(disputeServiceModule.pathname, () => ({
  getFreelancerDisputeDashboard,
  openFreelancerDispute,
  getFreelancerDisputeDetail,
  appendFreelancerDisputeEvent,
}));

let listDisputes;
let createDispute;
let showDispute;
let appendEvent;
let ValidationError;

beforeAll(async () => {
  ({ listDisputes, createDispute, showDispute, appendEvent } = await import(
    '../src/controllers/freelancerDisputeController.js'
  ));
  ({ ValidationError } = await import('../src/utils/errors.js'));
});

beforeEach(() => {
  getFreelancerDisputeDashboard.mockReset();
  openFreelancerDispute.mockReset();
  getFreelancerDisputeDetail.mockReset();
  appendFreelancerDisputeEvent.mockReset();
});

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('freelancerDisputeController.listDisputes', () => {
  it('normalises query parameters and actor metadata', async () => {
    const dashboard = { items: [], meta: { total: 0 } };
    getFreelancerDisputeDashboard.mockResolvedValue(dashboard);

    const req = {
      params: { freelancerId: '42' },
      query: { includeClosed: 'true', limit: '25', stage: 'triage' },
      headers: {
        'x-user-id': '7',
        'x-roles': 'Freelancer, TRUST',
      },
    };
    const res = createResponse();

    await listDisputes(req, res);

    expect(getFreelancerDisputeDashboard).toHaveBeenCalledWith(42, {
      stage: 'triage',
      status: undefined,
      includeClosed: true,
      limit: 25,
      actorId: 7,
      actorRoles: ['freelancer', 'trust'],
    });
    expect(res.json).toHaveBeenCalledWith(dashboard);
  });

  it('rejects invalid includeClosed values', async () => {
    const req = {
      params: { freelancerId: '8' },
      query: { includeClosed: 'sometimes' },
    };
    const res = createResponse();

    await expect(listDisputes(req, res)).rejects.toThrow(ValidationError);
    expect(getFreelancerDisputeDashboard).not.toHaveBeenCalled();
  });
});

describe('freelancerDisputeController.createDispute', () => {
  it('defaults actor context to the freelancer when none is provided', async () => {
    const created = { id: 99 };
    openFreelancerDispute.mockResolvedValue(created);
    const req = { params: { freelancerId: '55' }, body: { summary: 'Delayed payment' } };
    const res = createResponse();

    await createDispute(req, res);

    expect(openFreelancerDispute).toHaveBeenCalledWith(55, { summary: 'Delayed payment' }, {
      actorId: 55,
      actorRoles: [],
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });
});

describe('freelancerDisputeController.showDispute', () => {
  it('loads disputes with strict id validation', async () => {
    const detail = { id: 13, status: 'open' };
    getFreelancerDisputeDetail.mockResolvedValue(detail);

    const req = { params: { freelancerId: '21', disputeId: '13' } };
    const res = createResponse();

    await showDispute(req, res);

    expect(getFreelancerDisputeDetail).toHaveBeenCalledWith(21, 13);
    expect(res.json).toHaveBeenCalledWith(detail);
  });
});

describe('freelancerDisputeController.appendEvent', () => {
  it('parses identifiers and forwards event payload', async () => {
    const eventRecord = { id: 4, type: 'note' };
    appendFreelancerDisputeEvent.mockResolvedValue(eventRecord);

    const req = {
      params: { freelancerId: '5', disputeId: '4' },
      body: { body: 'Clarified expectations' },
      headers: { 'x-role': 'mediator' },
    };
    const res = createResponse();

    await appendEvent(req, res);

    expect(appendFreelancerDisputeEvent).toHaveBeenCalledWith(5, 4, { body: 'Clarified expectations' }, {
      actorId: 5,
      actorRoles: ['mediator'],
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(eventRecord);
  });
});
