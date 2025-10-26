import express from 'express';
import request from 'supertest';
import {
  describePermissionRequirement,
  hasPermission,
  listMembershipsForPermission,
  resolveAuthorizationState,
} from '../config/permissionRegistry.js';
import { requirePermission } from '../middleware/authorization.js';

describe('permission registry', () => {
  it('derives permissions from memberships and explicit grants', () => {
    const state = resolveAuthorizationState({
      memberships: ['workspace_admin', 'mentor'],
      permissions: ['custom:export'],
    });

    expect(state.membershipKeys).toContain('workspace_admin');
    expect(state.permissionKeys).toContain('calendar:manage');
    expect(state.permissionKeys).toContain('calendar:view');
    expect(state.permissionKeys).toContain('notifications:read');
    expect(state.permissionKeys).toContain('custom:export');
    expect(hasPermission(state, 'calendar:view')).toBe(true);
    expect(hasPermission({ memberships: ['mentor'] }, 'projects:manage')).toBe(false);
  });

  it('lists allowed memberships for privileged permissions', () => {
    const allowed = listMembershipsForPermission('rbac:matrix:audit');
    const keys = allowed.map((item) => item.key);

    expect(keys).toContain('platform_admin');
    expect(keys).toContain('security_officer');

    const requirement = describePermissionRequirement('projects:manage');
    expect(requirement.permission.key).toBe('projects:manage');
    expect(requirement.allowedMemberships.length).toBeGreaterThan(0);
    expect(requirement.message).toMatch(/Access to Manage project workspaces/i);
  });
});

describe('requirePermission middleware', () => {
  const buildApp = (membership) => {
    const app = express();
    app.get(
      '/calendar',
      (req, _res, next) => {
        req.user = { memberships: [membership] };
        next();
      },
      requirePermission('calendar:manage'),
      (_req, res) => {
        res.json({ ok: true });
      },
    );
    return app;
  };

  it('allows access when the membership provides the permission', async () => {
    const app = buildApp('workspace_admin');
    const response = await request(app).get('/calendar');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it('denies access with descriptive payload otherwise', async () => {
    const app = buildApp('company');
    const response = await request(app).get('/calendar');
    expect(response.statusCode).toBe(403);
    expect(response.body.permission).toBe('calendar:manage');
    expect(response.body.allowedMemberships).toContain('workspace_admin');
    expect(response.body.message).toMatch(/Access to Manage company calendar is limited/i);
  });
});
