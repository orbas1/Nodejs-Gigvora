process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import './setupTestEnv.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const adminToken = jwt.sign({ id: 20, roles: ['admin'], type: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const userToken = jwt.sign({ id: 21, roles: ['user'], type: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('Admin finance routes', () => {
  it('enforces admin guard', async () => {
    const response = await request(app).get('/api/admin/finance/dashboard');
    expect(response.status).toBe(401);

    const forbidden = await request(app)
      .get('/api/admin/finance/dashboard')
      .set('Authorization', `Bearer ${userToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('supports treasury policy, fee rules, payout schedules, and adjustments', async () => {
    const dashboard = await request(app)
      .get('/api/admin/finance/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.summary).toBeDefined();

    const policy = await request(app)
      .put('/api/admin/finance/treasury-policy')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ policyName: 'Automation policy', defaultCurrency: 'EUR', autopayoutEnabled: true });
    expect(policy.status).toBe(200);
    expect(policy.body.policyName || policy.body.treasuryPolicy?.policyName).toBeDefined();

    const feeRuleCreate = await request(app)
      .post('/api/admin/finance/fee-rules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Milestone release', percentageRate: 12, currency: 'USD' });
    expect(feeRuleCreate.status).toBe(201);
    const feeRuleId = feeRuleCreate.body.id || feeRuleCreate.body.rule?.id || feeRuleCreate.body.feeRule?.id;
    expect(feeRuleId).toBeTruthy();

    const feeRuleUpdate = await request(app)
      .put(`/api/admin/finance/fee-rules/${feeRuleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ flatAmount: 5, description: 'Flat processing fee' });
    expect(feeRuleUpdate.status).toBe(200);

    const payoutCreate = await request(app)
      .post('/api/admin/finance/payout-schedules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Weekly ops', scheduleType: 'weekly', cadence: 'weekly', dayOfWeek: 'monday' });
    expect(payoutCreate.status).toBe(201);
    const payoutId = payoutCreate.body.id || payoutCreate.body.schedule?.id;
    expect(payoutId).toBeTruthy();

    const payoutUpdate = await request(app)
      .put(`/api/admin/finance/payout-schedules/${payoutId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ leadTimeDays: 2, status: 'active' });
    expect(payoutUpdate.status).toBe(200);

    const adjustmentCreate = await request(app)
      .post('/api/admin/finance/escrow-adjustments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reference: 'ADJ-1', adjustmentType: 'rebate', amount: 42, currency: 'USD' });
    expect(adjustmentCreate.status).toBe(201);
    const adjustmentId = adjustmentCreate.body.id || adjustmentCreate.body.adjustment?.id;
    expect(adjustmentId).toBeTruthy();

    const adjustmentUpdate = await request(app)
      .put(`/api/admin/finance/escrow-adjustments/${adjustmentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved', notes: 'Reviewed by finance' });
    expect(adjustmentUpdate.status).toBe(200);

    const adjustmentDelete = await request(app)
      .delete(`/api/admin/finance/escrow-adjustments/${adjustmentId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adjustmentDelete.status).toBe(204);

    const payoutDelete = await request(app)
      .delete(`/api/admin/finance/payout-schedules/${payoutId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(payoutDelete.status).toBe(204);

    const feeRuleDelete = await request(app)
      .delete(`/api/admin/finance/fee-rules/${feeRuleId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(feeRuleDelete.status).toBe(204);
  });
});
