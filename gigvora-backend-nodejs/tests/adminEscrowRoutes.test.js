process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import './setupTestEnv.js';
import { User } from '../src/models/index.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const adminToken = jwt.sign({ id: 30, roles: ['admin'], type: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const userToken = jwt.sign({ id: 31, roles: ['user'], type: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('Admin escrow management routes', () => {
  it('guards routes by admin role', async () => {
    const unauthenticated = await request(app).get('/api/admin/finance/escrow/overview');
    expect(unauthenticated.status).toBe(401);

    const forbidden = await request(app)
      .get('/api/admin/finance/escrow/overview')
      .set('Authorization', `Bearer ${userToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('exposes provider, fee tier, policy, and account management', async () => {
    const user = await User.create({ email: 'escrow-user@gigvora.test', firstName: 'Escrow', lastName: 'Owner' });

    const overview = await request(app)
      .get('/api/admin/finance/escrow/overview')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(overview.status).toBe(200);

    const providerUpdate = await request(app)
      .put('/api/admin/finance/escrow/provider')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ provider: 'escrow_com', apiKey: 'test-key', apiSecret: 'test-secret', sandbox: true });
    expect(providerUpdate.status).toBe(200);

    const tierCreate = await request(app)
      .post('/api/admin/finance/escrow/fee-tiers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Starter', minimumAmount: 0, maximumAmount: 5000, percentage: 1.5 });
    expect(tierCreate.status).toBe(201);
    const tierId = tierCreate.body.id || tierCreate.body.tier?.id;

    const tierUpdate = await request(app)
      .put(`/api/admin/finance/escrow/fee-tiers/${tierId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ maximumAmount: 7500 });
    expect(tierUpdate.status).toBe(200);

    const policyCreate = await request(app)
      .post('/api/admin/finance/escrow/release-policies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Default milestone policy',
        policyType: 'milestone',
        status: 'active',
        releaseAfterHours: 24,
      });
    expect(policyCreate.status).toBe(201);
    const policyId = policyCreate.body.id || policyCreate.body.policy?.id;

    const policyUpdate = await request(app)
      .put(`/api/admin/finance/escrow/release-policies/${policyId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ releaseAfterHours: 12 });
    expect(policyUpdate.status).toBe(200);

    const accountCreate = await request(app)
      .post('/api/admin/finance/escrow/accounts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: user.id, provider: 'escrow_com', currencyCode: 'USD' });
    expect(accountCreate.status).toBe(201);
    const accountId = accountCreate.body.id || accountCreate.body.account?.id;

    const accountUpdate = await request(app)
      .put(`/api/admin/finance/escrow/accounts/${accountId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active', pendingReleaseTotal: 2500 });
    expect(accountUpdate.status).toBe(200);

    const policyDelete = await request(app)
      .delete(`/api/admin/finance/escrow/release-policies/${policyId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(policyDelete.status).toBe(204);

    const tierDelete = await request(app)
      .delete(`/api/admin/finance/escrow/fee-tiers/${tierId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(tierDelete.status).toBe(204);
  });
});
