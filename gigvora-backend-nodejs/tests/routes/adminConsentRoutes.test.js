process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';
process.env.JWT_SECRET = 'test-admin-consent-secret';
process.env.LOG_LEVEL = 'silent';
process.env.WAF_DISABLED = 'true';

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import app from '../../src/app.js';
import '../setupTestEnv.js';
import {
  ConsentPolicy,
  ConsentPolicyVersion,
  ConsentAuditEvent,
} from '../../src/models/consentModels.js';
import { createConsentPolicy } from '../../src/services/consentService.js';
import sequelize from '../../src/models/sequelizeClient.js';

describe('admin consent governance routes', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  function buildAdminToken(overrides = {}) {
    const payload = {
      id: overrides.id ?? 901,
      type: 'admin',
      roles: ['admin'],
    };
    return jwt.sign(payload, process.env.JWT_SECRET);
  }

  it('lists active consent policies with filtering support', async () => {
    await createConsentPolicy(
      {
        code: 'gdpr_core',
        title: 'Core GDPR Consent',
        description: 'Required consent for GDPR processing',
        audience: 'user',
        region: 'eu',
        legalBasis: 'consent',
        required: true,
      },
      {
        version: 1,
        summary: 'Initial version',
        effectiveAt: '2024-01-01T00:00:00Z',
      },
      { actorId: '42' },
    );

    await createConsentPolicy(
      {
        code: 'provider_marketing',
        title: 'Provider Marketing',
        audience: 'provider',
        region: 'global',
        legalBasis: 'legitimate_interest',
        required: false,
      },
      {
        version: 1,
        summary: 'Marketing consent',
        effectiveAt: '2024-02-01T00:00:00Z',
      },
      { actorId: '42' },
    );

    const response = await request(app)
      .get('/api/admin/governance/consents')
      .set('Authorization', `Bearer ${buildAdminToken()}`)
      .query({ audience: 'user', region: 'eu' });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.policies)).toBe(true);
    expect(response.body.policies).toHaveLength(1);
    expect(response.body.policies[0]).toMatchObject({
      code: 'gdpr_core',
      audience: 'user',
      region: 'eu',
      versions: expect.arrayContaining([
        expect.objectContaining({ version: 1 }),
      ]),
    });
  });

  it('creates, updates, and deletes consent policies via REST operations', async () => {
    const auditSpy = jest.spyOn(ConsentAuditEvent, 'create');

    const createResponse = await request(app)
      .post('/api/admin/governance/consents')
      .set('Authorization', `Bearer ${buildAdminToken()}`)
      .send({
        code: 'data_export',
        title: 'Data export communications',
        description: 'Permission to share data export notifications.',
        audience: 'user',
        region: 'global',
        legalBasis: 'consent',
        required: false,
        version: {
          version: 3,
          summary: 'Launch-ready policy copy',
          effectiveAt: '2024-04-01T12:00:00Z',
        },
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      code: 'data_export',
      activeVersionId: expect.any(Number),
      versions: expect.arrayContaining([
        expect.objectContaining({ version: 3 }),
      ]),
    });

    const createdPolicy = await ConsentPolicy.findOne({ where: { code: 'data_export' } });
    expect(createdPolicy).not.toBeNull();
    const createdVersion = await ConsentPolicyVersion.findOne({
      where: { policyId: createdPolicy.id, version: 3 },
    });
    expect(createdVersion).not.toBeNull();

    const updateResponse = await request(app)
      .patch(`/api/admin/governance/consents/${createdPolicy.id}`)
      .set('Authorization', `Bearer ${buildAdminToken()}`)
      .send({
        title: 'Data export compliance notices',
        retentionPeriodDays: 365,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toMatchObject({
      title: 'Data export compliance notices',
      retentionPeriodDays: 365,
    });

    const versionResponse = await request(app)
      .post(`/api/admin/governance/consents/${createdPolicy.id}/versions`)
      .set('Authorization', `Bearer ${buildAdminToken()}`)
      .send({
        version: 4,
        summary: 'Updated for retention requirements',
        effectiveAt: '2024-05-01T12:00:00Z',
      });

    expect(versionResponse.status).toBe(201);
    expect(versionResponse.body).toMatchObject({ version: 4, effectiveAt: expect.any(String) });

    const refreshedPolicy = await ConsentPolicy.findByPk(createdPolicy.id);
    expect(refreshedPolicy.activeVersionId).toBeDefined();

    const deleteResponse = await request(app)
      .delete(`/api/admin/governance/consents/${createdPolicy.id}`)
      .set('Authorization', `Bearer ${buildAdminToken()}`);

    expect(deleteResponse.status).toBe(204);
    expect(await ConsentPolicy.findByPk(createdPolicy.id)).toBeNull();

    expect(
      auditSpy.mock.calls.some(([payload]) => payload.action === 'policy_deleted' && payload.policyId === createdPolicy.id),
    ).toBe(true);
    auditSpy.mockRestore();
  });
});
