process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';
process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET = 'test-admin-secret';

import jwt from 'jsonwebtoken';
import request from 'supertest';

import '../setupTestEnv.js';

import { RbacPolicyAuditEvent } from '../../src/models/index.js';

let app;

function buildAdminToken(roles = ['admin']) {
  return jwt.sign(
    {
      id: 42,
      type: 'admin',
      roles,
      email: 'ops@gigvora.com',
    },
    process.env.JWT_SECRET,
  );
}

beforeAll(async () => {
  const expressModule = await import('express');
  const { default: correlationId } = await import('../../src/middleware/correlationId.js');
  const { default: errorHandler } = await import('../../src/middleware/errorHandler.js');
  const { adminRoutes } = await import('../../src/routes/adminRoutes.js');

  const express = expressModule.default;
  app = express();
  app.use(express.json());
  app.use(correlationId());
  app.use('/api/admin', adminRoutes);
  app.use(errorHandler);
});

beforeEach(async () => {
  await RbacPolicyAuditEvent.sync();
  await RbacPolicyAuditEvent.destroy({ where: {} });
});

describe('admin RBAC governance routes', () => {
  it('returns the RBAC matrix and records an audit entry', async () => {
    const response = await request(app)
      .get('/api/admin/governance/rbac/matrix')
      .set('Authorization', `Bearer ${buildAdminToken(['admin', 'platform_admin'])}`)
      .set('x-roles', 'admin,platform_admin');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      version: expect.any(String),
      personas: expect.arrayContaining([
        expect.objectContaining({ key: 'platform_admin' }),
      ]),
      guardrails: expect.arrayContaining([
        expect.objectContaining({ key: expect.any(String) }),
      ]),
      resources: expect.any(Array),
    });

    const audits = await RbacPolicyAuditEvent.findAll();
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      persona: 'platform_admin',
      resource: 'governance.rbac',
      action: 'view',
      decision: 'allow',
    });
  });

  it('paginates audit events using RBAC filters', async () => {
    await RbacPolicyAuditEvent.bulkCreate([
      {
        policyKey: 'governance.rbac.matrix',
        persona: 'platform_admin',
        resource: 'governance.rbac',
        action: 'view',
        decision: 'allow',
        reason: 'baseline export',
        occurredAt: new Date('2024-04-20T08:00:00Z'),
        metadata: {},
      },
      {
        policyKey: 'governance.rbac.matrix',
        persona: 'security_officer',
        resource: 'governance.rbac',
        action: 'simulate',
        decision: 'deny',
        reason: 'simulate incident rollback',
        occurredAt: new Date('2024-04-27T10:15:00Z'),
        metadata: {},
      },
    ]);

    const response = await request(app)
      .get('/api/admin/governance/rbac/audit-events')
      .set('Authorization', `Bearer ${buildAdminToken(['admin', 'security'])}`)
      .query({
        persona: 'security_officer',
        decision: 'deny',
        from: '2024-04-25T00:00:00Z',
        search: 'rollback',
        limit: 5,
      });

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.events).toHaveLength(1);
    expect(response.body.events[0]).toMatchObject({
      persona: 'security_officer',
      decision: 'deny',
      reason: 'simulate incident rollback',
    });
  });

  it('denies simulations that fall outside persona grants and audits the decision', async () => {
    const response = await request(app)
      .post('/api/admin/governance/rbac/simulate')
      .set('Authorization', `Bearer ${buildAdminToken(['admin', 'security'])}`)
      .send({
        persona: 'security_officer',
        resource: 'governance.rbac',
        action: 'export',
      });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      decision: 'deny',
      reason: 'no-matching-grant',
      persona: 'security_officer',
    });

    const audit = await RbacPolicyAuditEvent.findOne({
      where: { reason: 'no-matching-grant' },
      order: [['id', 'DESC']],
    });

    expect(audit).toBeTruthy();
    expect(audit).toMatchObject({
      persona: 'security_officer',
      resource: 'governance.rbac',
      action: 'export',
      decision: 'deny',
    });
  });
});
