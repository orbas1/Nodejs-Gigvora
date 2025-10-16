process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET = 'test-admin-secret';

import request from 'supertest';
import jwt from 'jsonwebtoken';

import '../setupTestEnv.js';

import {
  ConsentPolicy,
  ConsentPolicyVersion,
  ConsentAuditEvent,
  UserConsent,
  User,
} from '../../src/models/index.js';
import {
  createConsentPolicy,
} from '../../src/services/consentService.js';
import sequelize from '../../src/models/sequelizeClient.js';

let app;

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

function buildAdminToken(overrides = {}) {
  const payload = {
    id: overrides.id ?? 501,
    type: 'admin',
    roles: overrides.roles ?? ['admin', 'platform_admin'],
    email: overrides.email ?? 'compliance@gigvora.test',
  };
  return jwt.sign(payload, process.env.JWT_SECRET);
}

function buildUserToken(userId, overrides = {}) {
  const payload = {
    id: userId,
    type: overrides.type ?? 'user',
    roles: overrides.roles ?? ['user'],
    email: overrides.email ?? 'user@gigvora.test',
  };
  return jwt.sign(payload, process.env.JWT_SECRET);
}

beforeAll(async () => {
  const expressModule = await import('express');
  const { default: correlationId } = await import('../../src/middleware/correlationId.js');
  const { default: errorHandler } = await import('../../src/middleware/errorHandler.js');
  const { default: adminRoutes } = await import('../../src/routes/adminRoutes.js');
  const { default: userRoutes } = await import('../../src/routes/userRoutes.js');

  const express = expressModule.default;
  app = express();
  app.use(express.json());
  app.use(correlationId());
  app.use('/api/admin', adminRoutes);
  app.use('/api/users', userRoutes);
  app.use(errorHandler);
});

describe('consent governance and user routes', () => {
  it('lists consent policies filtered by audience and region with active version metadata', async () => {
    await createConsentPolicy(
      {
        title: 'Data Processing Addendum',
        code: 'data_processing_addendum',
        description: 'Covers GDPR processing guarantees for EU residents.',
        audience: 'user',
        region: 'eu',
        legalBasis: 'gdpr_article_28',
        required: true,
        revocable: false,
        retentionPeriodDays: 365,
        metadata: { department: 'legal' },
      },
      {
        summary: 'GDPR compliant processing with audit logging.',
        documentUrl: 'https://policies.gigvora.test/gdpr-dpa.pdf',
        effectiveAt: '2024-03-01T00:00:00Z',
        metadata: { locale: 'en-GB' },
      },
      { actorId: 'ops-admin-77' },
    );

    await createConsentPolicy(
      {
        title: 'Product Updates Newsletter',
        code: 'product_updates',
        description: 'Optional marketing communications for new features.',
        audience: 'user',
        region: 'global',
        legalBasis: 'consent',
        required: false,
        revocable: true,
        metadata: { channel: 'email' },
      },
      {
        summary: 'Describes cadence for email notifications.',
        effectiveAt: '2024-03-05T00:00:00Z',
      },
      { actorId: 'ops-admin-77' },
    );

    const response = await request(app)
      .get('/api/admin/governance/consents')
      .set('Authorization', `Bearer ${buildAdminToken()}`)
      .query({ audience: 'user', region: 'eu', includeInactive: 'false' });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.policies)).toBe(true);
    expect(response.body.policies).toHaveLength(1);
    expect(response.body.policies[0]).toMatchObject({
      code: 'data_processing_addendum',
      audience: 'user',
      region: 'eu',
      required: true,
      revocable: false,
    });
    expect(response.body.policies[0].versions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          version: 1,
          documentUrl: 'https://policies.gigvora.test/gdpr-dpa.pdf',
          summary: 'GDPR compliant processing with audit logging.',
        }),
      ]),
    );
  });

  it('creates consent policies with initial versions and persists audit events', async () => {
    const payload = {
      title: 'AI Model Training',
      description: 'Details how user data is leveraged for model fine-tuning.',
      audience: 'user',
      region: 'global',
      legalBasis: 'legitimate_interest',
      required: false,
      revocable: true,
      metadata: { businessOwner: 'governance' },
      version: {
        summary: 'Explains safeguards for AI training datasets.',
        documentUrl: 'https://policies.gigvora.test/ai-training.pdf',
        effectiveAt: '2024-05-01T00:00:00Z',
        metadata: { locale: 'en-US' },
      },
    };

    const response = await request(app)
      .post('/api/admin/governance/consents')
      .set('Authorization', `Bearer ${buildAdminToken()}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      code: 'ai-model-training',
      required: false,
      revocable: true,
    });
    expect(response.body.versions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          version: 1,
          documentUrl: 'https://policies.gigvora.test/ai-training.pdf',
        }),
      ]),
    );

    const policy = await ConsentPolicy.findOne({
      where: { code: 'ai-model-training' },
      include: [{ model: ConsentPolicyVersion, as: 'versions' }],
    });

    expect(policy).toBeTruthy();
    expect(policy.activeVersionId).toBeTruthy();
    expect(policy.versions).toHaveLength(1);
    expect(policy.versions[0].version).toBe(1);

    const audits = await ConsentAuditEvent.findAll({
      where: { policyId: policy.id },
      order: [['id', 'ASC']],
    });
    const actions = audits.map((event) => event.action);
    expect(actions).toEqual(
      expect.arrayContaining(['policy_created', 'policy_version_activated']),
    );
  });

  it('publishes additional consent versions and supersedes the prior active version', async () => {
    const summary = await createConsentPolicy(
      {
        title: 'International Data Transfer',
        code: 'intl_data_transfer',
        audience: 'user',
        region: 'global',
        legalBasis: 'gdpr_article_46',
        required: true,
        revocable: true,
        metadata: { transferMechanism: 'sccs' },
      },
      {
        summary: 'Initial SCC controls for cross-border transfers.',
        effectiveAt: '2024-04-01T00:00:00Z',
      },
      { actorId: 'ops-admin-21' },
    );

    const response = await request(app)
      .post(`/api/admin/governance/consents/${summary.id}/versions`)
      .set('Authorization', `Bearer ${buildAdminToken()}`)
      .send({
        summary: 'Updates SCC mappings and DPA references.',
        effectiveAt: '2024-06-01T00:00:00Z',
        metadata: { locale: 'en-US', regulatorTicket: 'ICO-2024-88' },
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      version: 2,
      effectiveAt: expect.any(String),
    });

    const policy = await ConsentPolicy.findByPk(summary.id, {
      include: [{ model: ConsentPolicyVersion, as: 'versions' }],
    });

    expect(policy.activeVersionId).toBeTruthy();
    const activeVersion = policy.versions.find((entry) => entry.id === policy.activeVersionId);
    expect(activeVersion.version).toBe(2);
    const superseded = policy.versions.find((entry) => entry.version === 1);
    expect(superseded.supersededAt).toBeTruthy();

    const versionAudit = await ConsentAuditEvent.findAll({
      where: { policyId: policy.id },
      order: [['id', 'DESC']],
      limit: 3,
    });
    const versionActions = versionAudit.map((event) => event.action);
    expect(versionActions).toEqual(
      expect.arrayContaining([
        'policy_version_created',
        'policy_version_activated',
        'policy_version_superseded',
      ]),
    );
  });

  it('records user consent decisions and emits grant/withdraw audit events', async () => {
    const user = await User.create({
      firstName: 'Jamie',
      lastName: 'Rivera',
      email: 'jamie.rivera@gigvora.test',
      password: '$2b$10$hashedpasswordvalue',
      userType: 'user',
    });

    const policySummary = await createConsentPolicy(
      {
        title: 'Marketing Preferences',
        code: 'marketing_preferences',
        audience: 'user',
        region: 'global',
        legalBasis: 'consent',
        required: false,
        revocable: true,
      },
      {
        summary: 'Optional marketing messages for campaigns.',
        effectiveAt: '2024-04-10T00:00:00Z',
      },
      { actorId: 'ops-admin-45' },
    );

    const grantResponse = await request(app)
      .put(`/api/users/${user.id}/consents/${policySummary.code}`)
      .set('Authorization', `Bearer ${buildUserToken(user.id)}`)
      .send({
        status: 'granted',
        source: 'profile_settings',
        metadata: { language: 'en', ipCountry: 'US' },
      });

    expect(grantResponse.status).toBe(200);
    expect(grantResponse.body.consent).toMatchObject({
      status: 'granted',
      policyId: policySummary.id,
    });

    const storedConsent = await UserConsent.findOne({
      where: { userId: user.id, policyId: policySummary.id },
    });
    expect(storedConsent.status).toBe('granted');
    expect(storedConsent.grantedAt).toBeTruthy();
    const grantAudit = await ConsentAuditEvent.findOne({
      where: { userConsentId: storedConsent.id, action: 'consent_granted' },
    });
    expect(grantAudit).toBeTruthy();

    const withdrawResponse = await request(app)
      .put(`/api/users/${user.id}/consents/${policySummary.code}`)
      .set('Authorization', `Bearer ${buildUserToken(user.id)}`)
      .send({
        status: 'withdrawn',
        source: 'support_case',
        metadata: { ticketId: 'CASE-1045' },
      });

    expect(withdrawResponse.status).toBe(200);
    expect(withdrawResponse.body.consent).toMatchObject({
      status: 'withdrawn',
      withdrawnAt: expect.any(String),
    });

    await storedConsent.reload();
    expect(storedConsent.status).toBe('withdrawn');
    expect(storedConsent.withdrawnAt).toBeTruthy();

    const withdrawAudit = await ConsentAuditEvent.findOne({
      where: { userConsentId: storedConsent.id, action: 'consent_withdrawn' },
    });
    expect(withdrawAudit).toBeTruthy();
  });

  it('prevents withdrawal of non-revocable required policies', async () => {
    const user = await User.create({
      firstName: 'Taylor',
      lastName: 'Khan',
      email: 'taylor.khan@gigvora.test',
      password: '$2b$10$hashedpasswordvalue',
      userType: 'user',
    });

    const policySummary = await createConsentPolicy(
      {
        title: 'Core Platform Terms',
        code: 'core_terms',
        audience: 'user',
        region: 'global',
        legalBasis: 'contract',
        required: true,
        revocable: false,
      },
      {
        summary: 'Mandatory contractual terms for platform access.',
        effectiveAt: '2024-01-01T00:00:00Z',
      },
      { actorId: 'legal-admin-11' },
    );

    const response = await request(app)
      .put(`/api/users/${user.id}/consents/${policySummary.code}`)
      .set('Authorization', `Bearer ${buildUserToken(user.id)}`)
      .send({ status: 'withdrawn' });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      message: 'This consent policy is required and cannot be withdrawn.',
      requestId: expect.any(String),
    });

    const consentRecord = await UserConsent.findOne({
      where: { userId: user.id, policyId: policySummary.id },
    });
    expect(consentRecord).toBeNull();
  });
});
