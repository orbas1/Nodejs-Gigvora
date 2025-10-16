process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET = 'consent-test-secret';
process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

const getUserConsentSnapshot = jest.fn();
const recordUserConsentDecision = jest.fn();

const consentServiceModuleUrl = new URL('../../src/services/consentService.js', import.meta.url);
jest.unstable_mockModule(consentServiceModuleUrl.pathname, () => ({
  getUserConsentSnapshot,
  recordUserConsentDecision,
}));

const expressModule = await import('express');
const { default: errorHandler } = await import('../../src/middleware/errorHandler.js');
const userConsentRoutesModule = await import('../../src/routes/userConsentRoutes.js');
const { ConflictError } = await import('../../src/utils/errors.js');

const express = expressModule.default;
const app = express();
app.use(express.json());

const router = express.Router();
router.use('/:id/consents', userConsentRoutesModule.default);
app.use('/api/users', router);
app.use(errorHandler);

function buildUserToken(userId, overrides = {}) {
  return jwt.sign({ id: userId, type: 'user', roles: ['user'], ...overrides }, process.env.JWT_SECRET);
}

describe('user consent routes', () => {
  beforeEach(() => {
    getUserConsentSnapshot.mockReset();
    recordUserConsentDecision.mockReset();
  });

  it('returns consent snapshots scoped to the authenticated user', async () => {
    getUserConsentSnapshot.mockResolvedValue([
      { policy: { code: 'marketing-updates', required: false }, consent: null },
    ]);

    const response = await request(app)
      .get('/api/users/25/consents')
      .set('Authorization', `Bearer ${buildUserToken(25)}`)
      .query({ audience: 'user', region: 'global' });

    expect(response.status).toBe(200);
    expect(getUserConsentSnapshot).toHaveBeenCalledWith(25, { audience: 'user', region: 'global' });
    expect(response.body.policies[0]).toMatchObject({ policy: { code: 'marketing-updates' }, consent: null });
  });

  it('records consent decisions and emits audit events', async () => {
    recordUserConsentDecision.mockResolvedValue({
      toSnapshot: () => ({ policyId: 11, status: 'granted', source: 'self_service', grantedAt: '2024-05-01T00:00:00.000Z' }),
    });

    const response = await request(app)
      .put('/api/users/31/consents/marketing-updates')
      .set('Authorization', `Bearer ${buildUserToken(31)}`)
      .send({ status: 'granted', source: 'self_service', metadata: { channel: 'web' } });

    expect(response.status).toBe(200);
    expect(recordUserConsentDecision).toHaveBeenCalledWith(
      31,
      'marketing-updates',
      expect.objectContaining({ status: 'granted', source: 'self_service', metadata: { channel: 'web' } }),
    );
    expect(response.body.consent).toMatchObject({ policyId: 11, status: 'granted', source: 'self_service' });
  });

  it('returns 409 when withdrawal is rejected by the service', async () => {
    recordUserConsentDecision.mockRejectedValue(new ConflictError('This consent policy is required and cannot be withdrawn.'));

    const response = await request(app)
      .put('/api/users/44/consents/core-privacy')
      .set('Authorization', `Bearer ${buildUserToken(44)}`)
      .send({ status: 'withdrawn' });

    expect(response.status).toBe(409);
    expect(response.body.message).toContain('cannot be withdrawn');
  });
});
