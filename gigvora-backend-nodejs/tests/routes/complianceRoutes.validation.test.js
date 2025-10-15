import request from 'supertest';
import { jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const getComplianceLockerOverview = jest.fn();
const createComplianceDocument = jest.fn();
const addComplianceDocumentVersion = jest.fn();
const acknowledgeComplianceReminder = jest.fn();

const complianceServiceModuleUrl = new URL('../../src/services/complianceLockerService.js', import.meta.url);

jest.unstable_mockModule(complianceServiceModuleUrl.pathname, () => ({
  getComplianceLockerOverview,
  createComplianceDocument,
  addComplianceDocumentVersion,
  acknowledgeComplianceReminder,
}));

let app;

beforeAll(async () => {
  const expressModule = await import('express');
  const express = expressModule.default;
  const { default: correlationId } = await import('../../src/middleware/correlationId.js');
  const { default: errorHandler } = await import('../../src/middleware/errorHandler.js');
  const { default: complianceRoutes } = await import('../../src/routes/complianceRoutes.js');

  app = express();
  app.use(express.json());
  app.use(correlationId());
  app.use('/api/compliance', complianceRoutes);
  app.use(errorHandler);
});

beforeEach(() => {
  getComplianceLockerOverview.mockReset();
  createComplianceDocument.mockReset();
  addComplianceDocumentVersion.mockReset();
  acknowledgeComplianceReminder.mockReset();
});

describe('GET /api/compliance/locker', () => {
  it('rejects requests without a userId', async () => {
    const response = await request(app).get('/api/compliance/locker');

    expect(response.status).toBe(422);
    expect(getComplianceLockerOverview).not.toHaveBeenCalled();
  });

  it('normalises filters before querying the compliance locker', async () => {
    getComplianceLockerOverview.mockResolvedValue({ documents: [] });

    const response = await request(app)
      .get('/api/compliance/locker')
      .query({
        userId: '42',
        limit: '25',
        region: '  EU-West  ',
        frameworks: ['iso27001, SOC2', 'GDPR'],
        useCache: 'false',
      });

    expect(response.status).toBe(200);
    expect(getComplianceLockerOverview).toHaveBeenCalledWith(42, {
      limit: 25,
      region: 'EU-West',
      frameworks: ['iso27001', 'SOC2', 'GDPR'],
      useCache: false,
    });
  });
});

describe('POST /api/compliance/documents', () => {
  it('enforces required fields for new documents', async () => {
    const response = await request(app)
      .post('/api/compliance/documents')
      .send({ ownerId: '9', title: '', storagePath: 'contracts/nda.pdf' });

    expect(response.status).toBe(422);
    expect(createComplianceDocument).not.toHaveBeenCalled();
  });

  it('coerces numeric and trimmed fields before creating the document', async () => {
    createComplianceDocument.mockResolvedValue({ id: 99 });

    const payload = {
      actorId: 8,
      ownerId: '11',
      workspaceId: '5',
      title: '  Master Service Agreement ',
      storagePath: '  compliance/contracts/msa.pdf ',
      tags: ['  SOC2  ', 'gdpr'],
      metadata: { priority: 'high' },
    };

    const response = await request(app).post('/api/compliance/documents').send(payload);

    expect(response.status).toBe(201);
    expect(createComplianceDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: 11,
        workspaceId: 5,
        title: 'Master Service Agreement',
        storagePath: 'compliance/contracts/msa.pdf',
        tags: ['SOC2', 'gdpr'],
        metadata: expect.objectContaining({ priority: 'high' }),
      }),
      expect.objectContaining({ actorId: 8 }),
    );
  });
});

describe('POST /api/compliance/documents/:documentId/versions', () => {
  it('requires file identifiers for new versions', async () => {
    const response = await request(app)
      .post('/api/compliance/documents/12/versions')
      .send({ actorId: 3, fileName: 'signed.pdf' });

    expect(response.status).toBe(422);
    expect(addComplianceDocumentVersion).not.toHaveBeenCalled();
  });

  it('coerces payload before delegating to the service', async () => {
    addComplianceDocumentVersion.mockResolvedValue({ version: { id: 1 } });

    const response = await request(app)
      .post('/api/compliance/documents/12/versions')
      .send({
        actorId: 77,
        fileName: 'signed.pdf',
        storageKey: 'compliance/signed.pdf',
        fileSize: '2048',
        status: 'EXECUTED',
      });

    expect(response.status).toBe(201);
    expect(addComplianceDocumentVersion).toHaveBeenCalledWith(
      12,
      expect.objectContaining({
        fileName: 'signed.pdf',
        storageKey: 'compliance/signed.pdf',
        fileSize: 2048,
        status: 'EXECUTED',
      }),
      expect.objectContaining({ actorId: 77 }),
    );
  });
});

describe('PATCH /api/compliance/reminders/:reminderId', () => {
  it('rejects invalid status transitions', async () => {
    const response = await request(app)
      .patch('/api/compliance/reminders/9')
      .send({ actorId: 12, status: 'pending' });

    expect(response.status).toBe(422);
    expect(acknowledgeComplianceReminder).not.toHaveBeenCalled();
  });

  it('normalises status casing and forwards the actor id', async () => {
    acknowledgeComplianceReminder.mockResolvedValue({ id: 9 });

    const response = await request(app)
      .patch('/api/compliance/reminders/9')
      .send({ actorId: 15, status: 'Dismissed' });

    expect(response.status).toBe(200);
    expect(acknowledgeComplianceReminder).toHaveBeenCalledWith(
      9,
      'dismissed',
      expect.objectContaining({ actorId: 15 }),
    );
  });
});
