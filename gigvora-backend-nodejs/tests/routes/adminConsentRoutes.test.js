process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET = 'consent-test-secret';
process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

const listConsentPolicies = jest.fn();
const createConsentPolicy = jest.fn();
const updateConsentPolicy = jest.fn();
const createPolicyVersion = jest.fn();
const deleteConsentPolicy = jest.fn();
const getConsentPolicyByCode = jest.fn();

const consentServiceModuleUrl = new URL('../../src/services/consentService.js', import.meta.url);
jest.unstable_mockModule(consentServiceModuleUrl.pathname, () => ({
  listConsentPolicies,
  createConsentPolicy,
  updateConsentPolicy,
  createPolicyVersion,
  deleteConsentPolicy,
  getConsentPolicyByCode,
}));

const expressModule = await import('express');
const { default: correlationId } = await import('../../src/middleware/correlationId.js');
const { default: errorHandler } = await import('../../src/middleware/errorHandler.js');
const { requireAdmin } = await import('../../src/middleware/authenticate.js');
const { default: adminConsentRoutes } = await import('../../src/routes/adminConsentRoutes.js');

const express = expressModule.default;
const app = express();
app.use(express.json());
app.use(correlationId());

const router = express.Router();
router.use(requireAdmin);
router.use('/', adminConsentRoutes);

app.use('/api/admin/governance/consents', router);
app.use(errorHandler);

function buildAdminToken(overrides = {}) {
  const payload = {
    id: 9001,
    type: 'admin',
    roles: ['admin'],
    ...overrides,
  };
  return jwt.sign(payload, process.env.JWT_SECRET);
}

describe('admin consent governance routes', () => {
  beforeEach(() => {
    listConsentPolicies.mockReset();
    createConsentPolicy.mockReset();
    updateConsentPolicy.mockReset();
    createPolicyVersion.mockReset();
    deleteConsentPolicy.mockReset();
    getConsentPolicyByCode.mockReset();
  });

  it('lists consent policies filtered by audience and region', async () => {
    listConsentPolicies.mockResolvedValue([
      {
        id: 11,
        code: 'privacy-baseline',
        audience: 'user',
        region: 'global',
        required: true,
        activeVersionId: 42,
        versions: [{ version: 1, summary: 'Initial release.' }],
      },
    ]);

    const response = await request(app)
      .get('/api/admin/governance/consents')
      .set('Authorization', `Bearer ${buildAdminToken()}`)
      .query({ audience: 'user', region: 'global' });

    expect(response.status).toBe(200);
    expect(listConsentPolicies).toHaveBeenCalledWith({ audience: 'user', region: 'global', includeInactive: false });
    expect(response.body.policies).toHaveLength(1);
    expect(response.body.policies[0]).toMatchObject({ code: 'privacy-baseline', activeVersionId: 42 });
  });

  it('returns consent policy detail using the service summary', async () => {
    getConsentPolicyByCode.mockResolvedValue({
      toSummary: () => ({ id: 15, code: 'privacy-baseline', versions: [{ id: 77, version: 2 }] }),
    });

    const response = await request(app)
      .get('/api/admin/governance/consents/privacy-baseline')
      .set('Authorization', `Bearer ${buildAdminToken()}`);

    expect(response.status).toBe(200);
    expect(getConsentPolicyByCode).toHaveBeenCalledWith('privacy-baseline', { includeVersions: true });
    expect(response.body).toMatchObject({ id: 15, code: 'privacy-baseline', versions: [{ id: 77, version: 2 }] });
  });

  it('creates a consent policy and returns the created summary', async () => {
    createConsentPolicy.mockResolvedValue({ id: 99, code: 'cookies-opt-in', versions: [] });

    const payload = {
      code: 'cookies-opt-in',
      title: 'Cookies & Tracking Preferences',
      legalBasis: 'gdpr_consent',
      version: { version: 3, summary: 'Includes advertising partners list.', effectiveAt: '2024-03-01T00:00:00Z' },
    };

    const response = await request(app)
      .post('/api/admin/governance/consents')
      .set('Authorization', `Bearer ${buildAdminToken({ id: 77 })}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(createConsentPolicy).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'cookies-opt-in', title: 'Cookies & Tracking Preferences' }),
      expect.objectContaining({ version: 3 }),
      expect.objectContaining({ actorId: '77', actorType: 'admin' }),
    );
    expect(response.body).toMatchObject({ id: 99, code: 'cookies-opt-in' });
  });

  it('updates consent metadata and returns the updated summary', async () => {
    updateConsentPolicy.mockResolvedValue({ id: 15, title: 'Updated Policy' });

    const response = await request(app)
      .patch('/api/admin/governance/consents/15')
      .set('Authorization', `Bearer ${buildAdminToken({ id: 88 })}`)
      .send({ description: 'Refreshed scope.' });

    expect(response.status).toBe(200);
    expect(updateConsentPolicy).toHaveBeenCalledWith(15, { description: 'Refreshed scope.' }, expect.objectContaining({ actorId: '88' }));
    expect(response.body).toMatchObject({ id: 15, title: 'Updated Policy' });
  });

  it('creates a new policy version', async () => {
    createPolicyVersion.mockResolvedValue({ id: 44, version: 2, effectiveAt: '2024-04-15T12:00:00.000Z' });

    const response = await request(app)
      .post('/api/admin/governance/consents/15/versions')
      .set('Authorization', `Bearer ${buildAdminToken({ id: 66 })}`)
      .send({ summary: 'Adds biometric processing clarification.' });

    expect(response.status).toBe(201);
    expect(createPolicyVersion).toHaveBeenCalledWith(15, { summary: 'Adds biometric processing clarification.' }, expect.objectContaining({ actorId: '66' }));
    expect(response.body).toMatchObject({ id: 44, version: 2 });
  });

  it('deletes a consent policy via the service', async () => {
    deleteConsentPolicy.mockResolvedValue();

    const response = await request(app)
      .delete('/api/admin/governance/consents/15')
      .set('Authorization', `Bearer ${buildAdminToken({ id: 33 })}`);

    expect(response.status).toBe(204);
    expect(deleteConsentPolicy).toHaveBeenCalledWith(15, expect.objectContaining({ actorId: '33' }));
  });
});
