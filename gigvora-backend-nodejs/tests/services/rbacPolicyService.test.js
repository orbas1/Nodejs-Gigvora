process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';
process.env.LOG_LEVEL = 'silent';

import '../setupTestEnv.js';

import { RbacPolicyAuditEvent } from '../../src/models/index.js';
import {
  evaluateAccess,
  recordPolicyEvent,
  listPolicyAuditEvents,
} from '../../src/services/rbacPolicyService.js';

describe('rbacPolicyService', () => {
  beforeEach(async () => {
    await RbacPolicyAuditEvent.sync();
    await RbacPolicyAuditEvent.destroy({ where: {} });
  });

  it('allows platform administrators to view runtime telemetry', () => {
    const result = evaluateAccess({
      personaKey: 'platform_admin',
      resourceKey: 'runtime.telemetry',
      action: 'view',
    });

    expect(result.allowed).toBe(true);
    expect(result.decision).toBe('allow');
    expect(result.policyKey).toBe('platform.runtime.control');
    expect(result.constraints).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Session must be protected'),
      ]),
    );
    expect(result.auditRetentionDays).toBe(365);
  });

  it('denies access when persona or grants do not match', () => {
    const unknownPersona = evaluateAccess({
      personaKey: 'unknown-role',
      resourceKey: 'runtime.telemetry',
      action: 'view',
    });

    expect(unknownPersona.allowed).toBe(false);
    expect(unknownPersona.reason).toBe('unknown-persona');

    const missingGrant = evaluateAccess({
      personaKey: 'security_officer',
      resourceKey: 'security.waf',
      action: 'export',
    });

    expect(missingGrant.allowed).toBe(false);
    expect(missingGrant.reason).toBe('no-matching-grant');
    expect(missingGrant.constraints).toEqual([]);
  });

  it('persists audit events with sanitised metadata', async () => {
    const record = await recordPolicyEvent({
      policyKey: 'governance.rbac.matrix',
      persona: 'Platform_Admin',
      resource: 'Governance.RBAC',
      action: 'View',
      decision: 'Allow',
      reason: 'matrix-inspection',
      constraints: ['requires-mfa'],
      actor: {
        id: 99,
        type: 'admin',
        email: 'OPS@GIGVORA.COM',
      },
      request: {
        id: 'req-123',
        path: '/api/admin/governance/rbac/matrix',
        method: 'GET',
        ip: '127.0.0.1',
        userAgent: 'jest',
        durationMs: 18,
      },
      responseStatus: 200,
      metadata: {
        headers: {
          authorization: 'Bearer secret',
          'x-trace': 'abc123',
        },
        ticket: 'SEC-88',
      },
    });

    expect(record).toBeTruthy();

    const persisted = await RbacPolicyAuditEvent.findByPk(record.id);

    expect(persisted).toMatchObject({
      policyKey: 'governance.rbac.matrix',
      persona: 'platform_admin',
      resource: 'governance.rbac',
      action: 'view',
      decision: 'allow',
      actorId: '99',
      actorType: 'admin',
      actorEmail: 'ops@gigvora.com',
      requestId: 'req-123',
      responseStatus: 200,
    });
    expect(persisted.metadata).toMatchObject({
      ticket: 'SEC-88',
      headers: { 'x-trace': 'abc123' },
      constraints: ['requires-mfa'],
      path: '/api/admin/governance/rbac/matrix',
      method: 'GET',
      durationMs: 18,
    });
    expect(persisted.metadata.headers.authorization).toBeUndefined();
  });

  it('filters audit events by persona, date window, and search term', async () => {
    await RbacPolicyAuditEvent.bulkCreate([
      {
        policyKey: 'governance.rbac.matrix',
        persona: 'platform_admin',
        resource: 'governance.rbac',
        action: 'view',
        decision: 'allow',
        reason: 'matrix export for quarterly review',
        occurredAt: new Date('2024-04-20T12:00:00Z'),
        metadata: {},
      },
      {
        policyKey: 'governance.rbac.matrix',
        persona: 'security_officer',
        resource: 'governance.rbac',
        action: 'simulate',
        decision: 'deny',
        reason: 'simulate escalation path',
        occurredAt: new Date('2024-04-27T08:00:00Z'),
        metadata: {},
      },
    ]);

    const result = await listPolicyAuditEvents({
      persona: 'security_officer',
      decision: 'deny',
      from: '2024-04-25T00:00:00Z',
      search: 'escalation',
      limit: 10,
    });

    expect(result.total).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(0);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({
      persona: 'security_officer',
      decision: 'deny',
      reason: 'simulate escalation path',
    });
  });
});
