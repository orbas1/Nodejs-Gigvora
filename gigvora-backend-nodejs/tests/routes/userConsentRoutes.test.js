process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';
process.env.JWT_SECRET = 'test-user-consent-secret';
process.env.LOG_LEVEL = 'silent';
process.env.WAF_DISABLED = 'true';

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import '../setupTestEnv.js';
import { User, ConsentPolicy, UserConsent } from '../../src/models/index.js';
import { createConsentPolicy, recordUserConsentDecision } from '../../src/services/consentService.js';
import sequelize from '../../src/models/sequelizeClient.js';

describe('user consent routes', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  function buildUserToken(userId, overrides = {}) {
    const payload = {
      id: userId,
      type: overrides.type ?? 'user',
      roles: overrides.roles ?? ['user'],
    };
    return jwt.sign(payload, process.env.JWT_SECRET);
  }

  it('returns personalised consent snapshots scoped by audience and region', async () => {
    const user = await User.create({
      firstName: 'Consent',
      lastName: 'Tester',
      email: 'consent.user@example.com',
      password: 'hashed-password',
      userType: 'user',
    });

    const providerPolicy = await createConsentPolicy(
      {
        code: 'provider_retention',
        title: 'Provider data retention',
        audience: 'provider',
        region: 'global',
        legalBasis: 'legal_obligation',
      },
      {
        version: 1,
        summary: 'Provider retention baseline',
        effectiveAt: '2024-02-01T00:00:00Z',
      },
    );

    await createConsentPolicy(
      {
        code: 'gdpr_marketing',
        title: 'GDPR marketing preferences',
        audience: 'user',
        region: 'eu',
        legalBasis: 'consent',
      },
      {
        version: 1,
        summary: 'GDPR marketing baseline',
        effectiveAt: '2024-03-01T00:00:00Z',
      },
    );

    await recordUserConsentDecision(user.id, 'gdpr_marketing', { status: 'granted', source: 'web_portal' });

    const response = await request(app)
      .get(`/api/users/${user.id}/consents`)
      .set('Authorization', `Bearer ${buildUserToken(user.id)}`)
      .query({ audience: 'user', region: 'eu' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ userId: user.id });
    expect(Array.isArray(response.body.policies)).toBe(true);
    expect(response.body.policies).toHaveLength(1);
    expect(response.body.policies[0]).toMatchObject({
      policy: expect.objectContaining({ code: 'gdpr_marketing', audience: 'user', region: 'eu' }),
      consent: expect.objectContaining({ status: 'granted', source: 'web_portal' }),
    });

    // Ensure provider scoped policy is not included for the user snapshot
    expect(response.body.policies.find((entry) => entry.policy.code === providerPolicy.code)).toBeUndefined();
  });

  it('records consent decisions and prevents duplicate updates for unchanged states', async () => {
    const user = await User.create({
      firstName: 'Regulation',
      lastName: 'Guardian',
      email: 'guardian@example.com',
      password: 'hashed-password',
      userType: 'user',
    });

    const policy = await createConsentPolicy(
      {
        code: 'data_sharing',
        title: 'Data sharing with partners',
        audience: 'user',
        region: 'global',
        legalBasis: 'consent',
        required: false,
      },
      {
        version: 1,
        summary: 'Initial data sharing terms',
        effectiveAt: '2024-01-15T00:00:00Z',
      },
    );

    const firstResponse = await request(app)
      .put(`/api/users/${user.id}/consents/${policy.code}`)
      .set('Authorization', `Bearer ${buildUserToken(user.id)}`)
      .send({ status: 'granted', metadata: { locale: 'en-GB' }, source: 'mobile_app' });

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.body.consent).toMatchObject({
      status: 'granted',
      metadata: { locale: 'en-GB' },
      source: 'mobile_app',
    });

    const stored = await UserConsent.findOne({ where: { userId: user.id, policyId: policy.id } });
    expect(stored).not.toBeNull();
    const grantedAt = stored.grantedAt?.toISOString();

    const repeatResponse = await request(app)
      .put(`/api/users/${user.id}/consents/${policy.code}`)
      .set('Authorization', `Bearer ${buildUserToken(user.id)}`)
      .send({ status: 'granted', metadata: { locale: 'en-GB' }, source: 'mobile_app' });

    expect(repeatResponse.status).toBe(200);
    expect(repeatResponse.body.consent.grantedAt).toBe(grantedAt);

    const withdrawResponse = await request(app)
      .put(`/api/users/${user.id}/consents/${policy.code}`)
      .set('Authorization', `Bearer ${buildUserToken(user.id)}`)
      .send({ status: 'withdrawn', metadata: { locale: 'en-GB' }, source: 'mobile_app' });

    expect(withdrawResponse.status).toBe(200);
    expect(withdrawResponse.body.consent).toMatchObject({ status: 'withdrawn' });
    expect(new Date(withdrawResponse.body.consent.withdrawnAt).getTime()).toBeGreaterThan(new Date(grantedAt).getTime());
  });
});
