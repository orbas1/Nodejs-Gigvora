import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const serviceModuleUrl = new URL('../../src/services/consentService.js', import.meta.url);
const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);

const serviceMock = {
  listConsentPolicies: jest.fn(),
  getConsentPolicyByCode: jest.fn(),
  createConsentPolicy: jest.fn(),
  updateConsentPolicy: jest.fn(),
  createPolicyVersion: jest.fn(),
  deleteConsentPolicy: jest.fn(),
};

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ __esModule: true, default: {} }));
await jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({ __esModule: true, default: serviceMock, ...serviceMock }));

const controllerModule = await import('../../src/controllers/consentController.js');
const { index, show, store, update, createVersion, destroy } = controllerModule;
const { ValidationError } = await import('../../src/utils/errors.js');

function createResponse() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('consentController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists policies using query filters', async () => {
    const req = { query: { region: 'us', includeInactive: 'true' } };
    const res = createResponse();
    const policies = [{ id: 1 }];
    serviceMock.listConsentPolicies.mockResolvedValueOnce(policies);

    await index(req, res);

    expect(serviceMock.listConsentPolicies).toHaveBeenCalledWith({
      audience: undefined,
      region: 'us',
      includeInactive: true,
    });
    expect(res.json).toHaveBeenCalledWith({ policies });
  });

  it('throws when policyId is invalid for update', async () => {
    const req = { params: { policyId: 'NaN' }, body: {} };
    const res = createResponse();

    await expect(update(req, res)).rejects.toThrow(ValidationError);
    expect(serviceMock.updateConsentPolicy).not.toHaveBeenCalled();
  });

  it('creates policy version with parsed identifiers', async () => {
    const req = { params: { policyId: '5' }, body: { changes: {} }, user: { id: 2 } };
    const res = createResponse();
    const version = { id: 1, version: '1.1', effectiveAt: 'now' };
    serviceMock.createPolicyVersion.mockResolvedValueOnce(version);

    await createVersion(req, res);

    expect(serviceMock.createPolicyVersion).toHaveBeenCalledWith(5, { changes: {} }, { actorId: '2' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 1, version: '1.1', effectiveAt: 'now' });
  });

  it('deletes a policy with numeric identifier', async () => {
    const req = { params: { policyId: '7' }, user: { id: 3 } };
    const res = createResponse();

    await destroy(req, res);

    expect(serviceMock.deleteConsentPolicy).toHaveBeenCalledWith(7, { actorId: '3' });
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledWith();
  });
});
