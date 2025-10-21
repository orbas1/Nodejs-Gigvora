import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const getFreelancerEscrowOverview = jest.fn();
const ensureFreelancerEscrowAccount = jest.fn();
const updateFreelancerEscrowAccount = jest.fn();
const createFreelancerEscrowTransaction = jest.fn();
const releaseFreelancerEscrowTransaction = jest.fn();
const refundFreelancerEscrowTransaction = jest.fn();
const openFreelancerEscrowDispute = jest.fn();
const appendFreelancerEscrowDisputeEvent = jest.fn();

const serviceModule = new URL('../src/services/freelancerEscrowService.js', import.meta.url);

jest.unstable_mockModule(serviceModule.pathname, () => ({
  getFreelancerEscrowOverview,
  ensureFreelancerEscrowAccount,
  updateFreelancerEscrowAccount,
  createFreelancerEscrowTransaction,
  releaseFreelancerEscrowTransaction,
  refundFreelancerEscrowTransaction,
  openFreelancerEscrowDispute,
  appendFreelancerEscrowDisputeEvent,
}));

let overview;
let createAccount;
let updateAccount;
let releaseTransaction;
let appendDisputeEvent;
let ValidationError;

beforeAll(async () => {
  ({
    overview,
    createAccount,
    updateAccount,
    releaseTransaction,
    appendDisputeEvent,
  } = await import('../src/controllers/freelancerEscrowController.js'));
  ({ ValidationError } = await import('../src/utils/errors.js'));
});

beforeEach(() => {
  getFreelancerEscrowOverview.mockReset();
  ensureFreelancerEscrowAccount.mockReset();
  updateFreelancerEscrowAccount.mockReset();
  createFreelancerEscrowTransaction.mockReset();
  releaseFreelancerEscrowTransaction.mockReset();
  refundFreelancerEscrowTransaction.mockReset();
  openFreelancerEscrowDispute.mockReset();
  appendFreelancerEscrowDisputeEvent.mockReset();
});

function runHandler(handler, req) {
  return new Promise((resolve, reject) => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn((payload) => resolve({ response, payload })),
    };
    handler(req, response, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve({ response, payload: undefined });
      }
    });
  });
}

describe('freelancerEscrowController.overview', () => {
  it('validates ids and normalises filters', async () => {
    const snapshot = { accounts: [], summary: {} };
    getFreelancerEscrowOverview.mockResolvedValue(snapshot);

    const req = { params: { freelancerId: '18' }, query: { status: 'open', limit: '20' } };

    const { response, payload } = await runHandler(overview, req);

    expect(getFreelancerEscrowOverview).toHaveBeenCalledWith(18, {
      status: 'open',
      limit: 20,
    });
    expect(response.status).not.toHaveBeenCalled();
    expect(payload).toEqual(snapshot);
  });

  it('raises validation errors for invalid ids', async () => {
    const req = { params: { freelancerId: 'zero' } };
    await expect(runHandler(overview, req)).rejects.toThrow(ValidationError);
    expect(getFreelancerEscrowOverview).not.toHaveBeenCalled();
  });
});

describe('freelancerEscrowController.createAccount', () => {
  it('ensures the freelancer id is numeric', async () => {
    ensureFreelancerEscrowAccount.mockResolvedValue({ id: 3 });
    const req = { params: { freelancerId: '7' }, body: { currency: 'USD' } };

    const { response, payload } = await runHandler(createAccount, req);

    expect(ensureFreelancerEscrowAccount).toHaveBeenCalledWith(7, { currency: 'USD' });
    expect(response.status).toHaveBeenCalledWith(201);
    expect(payload).toEqual({ account: { id: 3 } });
  });
});

describe('freelancerEscrowController.updateAccount', () => {
  it('parses both freelancer and account identifiers', async () => {
    updateFreelancerEscrowAccount.mockResolvedValue({ id: 11, status: 'active' });
    const req = {
      params: { freelancerId: '22', accountId: '11' },
      body: { status: 'active' },
    };

    const { payload } = await runHandler(updateAccount, req);

    expect(updateFreelancerEscrowAccount).toHaveBeenCalledWith(22, 11, { status: 'active' });
    expect(payload).toEqual({ account: { id: 11, status: 'active' } });
  });
});

describe('freelancerEscrowController.releaseTransaction', () => {
  it('sanitises identifiers before delegating to the service layer', async () => {
    releaseFreelancerEscrowTransaction.mockResolvedValue({ id: 4, status: 'released' });
    const req = {
      params: { freelancerId: '9', transactionId: '4' },
      body: { actorId: 9 },
    };

    const { payload } = await runHandler(releaseTransaction, req);

    expect(releaseFreelancerEscrowTransaction).toHaveBeenCalledWith(9, 4, { actorId: 9 });
    expect(payload).toEqual({ transaction: { id: 4, status: 'released' } });
  });
});

describe('freelancerEscrowController.appendDisputeEvent', () => {
  it('validates dispute identifiers', async () => {
    appendFreelancerEscrowDisputeEvent.mockResolvedValue({ id: 5, state: 'acknowledged' });
    const req = {
      params: { freelancerId: '9', disputeId: '5' },
      body: { note: 'Resolved amicably' },
    };

    const { response, payload } = await runHandler(appendDisputeEvent, req);

    expect(appendFreelancerEscrowDisputeEvent).toHaveBeenCalledWith(9, 5, { note: 'Resolved amicably' });
    expect(response.status).toHaveBeenCalledWith(201);
    expect(payload).toEqual({ id: 5, state: 'acknowledged' });
  });
});
