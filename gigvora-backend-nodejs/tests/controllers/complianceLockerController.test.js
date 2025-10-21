import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const serviceModuleUrl = new URL('../../src/services/complianceLockerService.js', import.meta.url);
const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);

const serviceMock = {
  getComplianceLockerOverview: jest.fn(),
  createComplianceDocument: jest.fn(),
  addComplianceDocumentVersion: jest.fn(),
  acknowledgeComplianceReminder: jest.fn(),
};

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ __esModule: true, default: {} }));
await jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({ __esModule: true, default: serviceMock, ...serviceMock }));

const controllerModule = await import('../../src/controllers/complianceLockerController.js');
const { overview, storeDocument, addVersion, acknowledgeReminder } = controllerModule;
const { ValidationError } = await import('../../src/utils/errors.js');

function createResponse() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
}

describe('complianceLockerController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires userId for overview', async () => {
    const req = { query: {} };
    const res = createResponse();

    await expect(overview(req, res)).rejects.toThrow(ValidationError);
    expect(serviceMock.getComplianceLockerOverview).not.toHaveBeenCalled();
  });

  it('parses query params for overview', async () => {
    const req = {
      query: {
        userId: '12',
        limit: '5',
        region: 'eu',
        frameworks: 'iso, soc2',
        useCache: 'true',
      },
    };
    const res = createResponse();
    const payload = { documents: [] };
    serviceMock.getComplianceLockerOverview.mockResolvedValueOnce(payload);

    await overview(req, res);

    expect(serviceMock.getComplianceLockerOverview).toHaveBeenCalledWith(12, {
      limit: 5,
      region: 'eu',
      frameworks: ['iso', 'soc2'],
      useCache: true,
    });
    expect(res.json).toHaveBeenCalledWith(payload);
  });

  it('stores documents with parsed workspace id', async () => {
    const req = { body: { workspaceId: '44', name: 'Policy' } };
    const res = createResponse();
    const document = { id: 1 };
    serviceMock.createComplianceDocument.mockResolvedValueOnce(document);

    await storeDocument(req, res);

    expect(serviceMock.createComplianceDocument).toHaveBeenCalledWith(
      { workspaceId: 44, name: 'Policy' },
      expect.objectContaining({ actorId: undefined }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(document);
  });

  it('validates document id on version creation', async () => {
    const req = { params: { documentId: 'abc' }, body: {} };
    const res = createResponse();

    await expect(addVersion(req, res)).rejects.toThrow(ValidationError);
    expect(serviceMock.addComplianceDocumentVersion).not.toHaveBeenCalled();
  });

  it('acknowledges reminders with parsed identifiers', async () => {
    const req = { params: { reminderId: '99' }, body: { status: 'snoozed', actorId: 3 }, log: {}, id: 'req-1' };
    const res = createResponse();
    const reminder = { id: 99, status: 'snoozed' };
    serviceMock.acknowledgeComplianceReminder.mockResolvedValueOnce(reminder);

    await acknowledgeReminder(req, res);

    expect(serviceMock.acknowledgeComplianceReminder).toHaveBeenCalledWith(99, 'snoozed', {
      actorId: 3,
      logger: {},
      requestId: 'req-1',
    });
    expect(res.json).toHaveBeenCalledWith(reminder);
  });
});
