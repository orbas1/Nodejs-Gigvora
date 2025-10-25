import request from 'supertest';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.AUTH_HEADER_OVERRIDE = 'false';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

function createJsonResponder(label, method) {
  return jest.fn((req, res) => {
    if (!res.headersSent) {
      res.json({ ok: true, handler: `${label}.${String(method)}`, path: req.path });
    }
  });
}

function createControllerProxy(label) {
  const handlers = new Map();
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          return undefined;
        }
        if (!handlers.has(prop)) {
          handlers.set(prop, createJsonResponder(label, prop));
        }
        return handlers.get(prop);
      },
    },
  );
}

function resolveModule(specifier) {
  return new URL(specifier, import.meta.url).pathname;
}

async function stubDefaultController(specifier, label) {
  const proxy = createControllerProxy(label);
  await jest.unstable_mockModule(resolveModule(specifier), () => ({
    __esModule: true,
    default: proxy,
  }));
  return proxy;
}

async function stubNamedController(specifier, methodNames, label) {
  const handlers = {};
  methodNames.forEach((method) => {
    handlers[method] = createJsonResponder(label, method);
  });
  handlers.default = handlers;
  await jest.unstable_mockModule(resolveModule(specifier), () => ({
    __esModule: true,
    ...handlers,
    default: handlers,
  }));
  return handlers;
}

function createSchemaStub() {
  return {
    parse: (value) => value ?? {},
  };
}

async function stubSchemaModule(specifier, exportNames) {
  await jest.unstable_mockModule(resolveModule(specifier), () => {
    const schemas = {};
    exportNames.forEach((name) => {
      schemas[name] = createSchemaStub();
    });
    schemas.default = schemas;
    return {
      __esModule: true,
      ...schemas,
      default: schemas,
    };
  });
}

async function stubRouterModule(specifier) {
  await jest.unstable_mockModule(resolveModule(specifier), async () => {
    const { Router } = await import('express');
    const router = Router();
    router.use((_req, _res, next) => next());
    return {
      __esModule: true,
      default: router,
    };
  });
}

await stubDefaultController('../../src/controllers/agencyController.js', 'agencyController');
await stubDefaultController('../../src/controllers/agencyAdController.js', 'agencyAdController');
await stubDefaultController('../../src/controllers/agencyCalendarController.js', 'agencyCalendarController');
await stubDefaultController('../../src/controllers/agencyMentoringController.js', 'agencyMentoringController');
await stubDefaultController('../../src/controllers/agencyProjectManagementController.js', 'agencyProjectManagementController');
await stubDefaultController('../../src/controllers/agencyEscrowController.js', 'agencyEscrowController');
await stubDefaultController('../../src/controllers/agencyIntegrationController.js', 'agencyIntegrationController');
await stubDefaultController('../../src/controllers/agencyAiController.js', 'agencyAiController');
await stubDefaultController('../../src/controllers/agencyWorkforceController.js', 'agencyWorkforceController');
await stubDefaultController('../../src/controllers/agencyClientKanbanController.js', 'agencyClientKanbanController');
await stubNamedController(
  '../../src/controllers/autoAssignController.js',
  [
    'enqueueProjectAssignments',
    'projectMetrics',
    'streamProjectQueue',
    'listQueue',
    'updateQueueEntryStatus',
    'projectQueue',
  ],
  'autoAssignController',
);
await stubDefaultController('../../src/controllers/blogAdminController.js', 'blogAdminController');
await stubDefaultController('../../src/controllers/clientPortalController.js', 'clientPortalController');
await stubNamedController(
  '../../src/controllers/collaborationController.js',
  ['index', 'show', 'store', 'storeRoom', 'storeAsset', 'storeAnnotation', 'storeRepository', 'storeAiSession'],
  'collaborationController',
);
await stubDefaultController(
  '../../src/controllers/companyIdentityVerificationController.js',
  'companyIdentityVerificationController',
);
await stubDefaultController('../../src/controllers/companyIntegrationController.js', 'companyIntegrationController');
await stubDefaultController('../../src/controllers/companyJobManagementController.js', 'companyJobManagementController');

await stubRouterModule('../../src/routes/agencyNetworkingRoutes.js');
await stubRouterModule('../../src/routes/agencyTimelineRoutes.js');
await stubRouterModule('../../src/routes/agencyCreationRoutes.js');

await stubSchemaModule('../../src/validation/schemas/agencySchemas.js', [
  'agencyProfileQuerySchema',
  'updateAgencyProfileSchema',
  'updateAgencyAvatarSchema',
  'listFollowersQuerySchema',
  'followerParamsSchema',
  'updateFollowerBodySchema',
  'connectionParamsSchema',
  'requestConnectionBodySchema',
  'respondConnectionBodySchema',
  'createAgencyProfileMediaSchema',
  'updateAgencyProfileMediaSchema',
  'createAgencyProfileSkillSchema',
  'updateAgencyProfileSkillSchema',
  'createAgencyProfileCredentialSchema',
  'updateAgencyProfileCredentialSchema',
  'createAgencyProfileExperienceSchema',
  'updateAgencyProfileExperienceSchema',
  'createAgencyProfileWorkforceSegmentSchema',
  'updateAgencyProfileWorkforceSegmentSchema',
]);

await stubSchemaModule('../../src/validation/schemas/agencyProjectManagementSchemas.js', [
  'createProjectBodySchema',
  'updateProjectBodySchema',
  'autoMatchSettingsBodySchema',
  'autoMatchFreelancerBodySchema',
  'autoMatchFreelancerUpdateBodySchema',
  'projectIdParamsSchema',
  'autoMatchFreelancerParamsSchema',
]);

await stubSchemaModule('../../src/validation/schemas/agencyWorkforceSchemas.js', [
  'createMemberBodySchema',
  'updateMemberBodySchema',
  'memberIdParamsSchema',
  'listMembersQuerySchema',
  'createPayDelegationBodySchema',
  'updatePayDelegationBodySchema',
  'payDelegationIdParamsSchema',
  'listPayDelegationsQuerySchema',
  'createProjectDelegationBodySchema',
  'updateProjectDelegationBodySchema',
  'projectDelegationIdParamsSchema',
  'listProjectDelegationsQuerySchema',
  'createGigDelegationBodySchema',
  'updateGigDelegationBodySchema',
  'gigDelegationIdParamsSchema',
  'listGigDelegationsQuerySchema',
  'createCapacitySnapshotBodySchema',
  'updateCapacitySnapshotBodySchema',
  'capacitySnapshotIdParamsSchema',
  'listCapacitySnapshotsQuerySchema',
  'createAvailabilityBodySchema',
  'updateAvailabilityBodySchema',
  'availabilityIdParamsSchema',
  'listAvailabilityQuerySchema',
  'workforceDashboardQuerySchema',
]);

await stubSchemaModule('../../src/validation/schemas/companyIdentityVerificationSchemas.js', [
  'identityVerificationListQuerySchema',
  'identityVerificationParamsSchema',
  'identityVerificationDetailQuerySchema',
  'identityVerificationCreateSchema',
  'identityVerificationUpdateSchema',
]);

await jest.unstable_mockModule(resolveModule('../../src/config/runtimeConfig.js'), () => {
  const listeners = new Set();
  const config = {
    env: 'test',
    serviceName: 'gigvora-backend-test',
    logging: {
      level: 'silent',
      redact: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["set-cookie"]',
        'res.headers["set-cookie"]',
      ],
    },
    observability: {
      correlation: {
        headerName: 'x-request-id',
        acceptIncomingHeader: false,
      },
    },
  };

  return {
    __esModule: true,
    runtimeConfigSchema: { parse: (value) => value },
    buildRuntimeConfigFromEnv: () => config,
    getRuntimeConfig: () => config,
    refreshRuntimeConfig: async () => ({ config }),
    onRuntimeConfigChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    whenRuntimeConfigReady: async () => config,
  };
});

await jest.unstable_mockModule(resolveModule('../../src/middleware/authentication.js'), async () => {
  const jwtModule = await import('jsonwebtoken');
  const jwtLib = jwtModule.default ?? jwtModule;

  const authenticateRequest = ({ optional = false } = {}) => {
    return (req, res, next) => {
      const header = req.headers?.authorization ?? req.headers?.Authorization;
      const token = typeof header === 'string' && header.toLowerCase().startsWith('bearer ')
        ? header.slice('bearer '.length).trim()
        : null;

      if (!token) {
        if (optional) {
          return next();
        }
        return res.status(401).json({ message: 'Authentication required.' });
      }

      try {
        const payload = jwtLib.verify(token, process.env.JWT_SECRET || 'test-secret');
        const roles = Array.isArray(payload.roles)
          ? payload.roles.map((role) => `${role}`.toLowerCase())
          : [];
        const type = payload.type ? `${payload.type}`.toLowerCase() : null;
        if (type && !roles.includes(type)) {
          roles.push(type);
        }
        req.user = {
          id: payload.id ?? null,
          roles,
          userType: type,
        };
        return next();
      } catch (error) {
        if (optional) {
          return next();
        }
        return res.status(401).json({ message: 'Authentication required.' });
      }
    };
  };

  const authenticate = authenticateRequest;

  const requireRoles = (roles) => {
    const required = (Array.isArray(roles) ? roles : [roles])
      .filter(Boolean)
      .map((role) => `${role}`.toLowerCase());

    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required.' });
      }
      if (!required.length) {
        return next();
      }
      const roleSet = new Set(req.user.roles ?? []);
      if (req.user.userType) {
        roleSet.add(req.user.userType);
      }
      const allowed = required.some((role) => roleSet.has(role));
      if (!allowed) {
        return res.status(403).json({ message: 'You do not have permission to access this resource.' });
      }
      return next();
    };
  };

  const extractRoleSet = (user) => new Set((user?.roles ?? []).map((role) => `${role}`.toLowerCase()));

  return {
    __esModule: true,
    authenticateRequest,
    authenticate,
    requireRoles,
    extractRoleSet,
    default: authenticateRequest,
  };
});

function buildToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

async function createTestApp({ mountPath, routeModule }) {
  const expressModule = await import('express');
  const express = expressModule.default;
  const { default: correlationId } = await import('../../src/middleware/correlationId.js');
  const { default: errorHandler } = await import('../../src/middleware/errorHandler.js');
  const { default: routes } = await import(resolveModule(routeModule));

  const app = express();
  app.use(express.json());
  app.use(correlationId());
  app.use(mountPath, routes);
  app.use(errorHandler);
  return app;
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('Agency routes security', () => {
  let app;

  beforeAll(async () => {
    app = await createTestApp({ mountPath: '/api/agency', routeModule: '../../src/routes/agencyRoutes.js' });
  });

  it('rejects unauthenticated access', async () => {
    const response = await request(app).get('/api/agency/dashboard');
    expect(response.status).toBe(401);
  });

  it('rejects users without agency access', async () => {
    const token = buildToken({ id: 101, roles: ['freelancer'] });
    const response = await request(app)
      .get('/api/agency/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it('allows agency members', async () => {
    const token = buildToken({ id: 102, roles: ['agency'] });
    const response = await request(app)
      .get('/api/agency/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ ok: true });
  });
});

describe('Auto assign routes security', () => {
  let app;

  beforeAll(async () => {
    app = await createTestApp({ mountPath: '/api/auto-assign', routeModule: '../../src/routes/autoAssignRoutes.js' });
  });

  it('requires authentication for enqueue', async () => {
    const response = await request(app).post('/api/auto-assign/projects/123/enqueue');
    expect(response.status).toBe(401);
  });

  it('rejects roles without project permissions', async () => {
    const token = buildToken({ id: 103, roles: ['freelancer'] });
    const response = await request(app)
      .post('/api/auto-assign/projects/123/enqueue')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it('allows company users', async () => {
    const token = buildToken({ id: 104, roles: ['company'] });
    const response = await request(app)
      .post('/api/auto-assign/projects/123/enqueue')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ ok: true });
  });
});

describe('Blog admin routes security', () => {
  let app;

  beforeAll(async () => {
    app = await createTestApp({ mountPath: '/api/admin/blog', routeModule: '../../src/routes/blogAdminRoutes.js' });
  });

  it('rejects unauthenticated requests', async () => {
    const response = await request(app).get('/api/admin/blog/posts');
    expect(response.status).toBe(401);
  });

  it('rejects authenticated non-admin users', async () => {
    const token = buildToken({ id: 105, roles: ['agency'] });
    const response = await request(app)
      .get('/api/admin/blog/posts')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it('allows administrators', async () => {
    const token = buildToken({ id: 106, roles: ['admin'] });
    const response = await request(app)
      .get('/api/admin/blog/posts')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ ok: true });
  });
});

describe('Client portal routes security', () => {
  let app;

  beforeAll(async () => {
    app = await createTestApp({ mountPath: '/api/client-portals', routeModule: '../../src/routes/clientPortalRoutes.js' });
  });

  it('requires authentication', async () => {
    const response = await request(app).get('/api/client-portals/42/dashboard');
    expect(response.status).toBe(401);
  });

  it('rejects roles without portal access', async () => {
    const token = buildToken({ id: 107, roles: ['freelancer'] });
    const response = await request(app)
      .get('/api/client-portals/42/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it('allows company collaborators', async () => {
    const token = buildToken({ id: 108, roles: ['company'] });
    const response = await request(app)
      .get('/api/client-portals/42/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ ok: true });
  });
});

describe('Collaboration routes security', () => {
  let app;

  beforeAll(async () => {
    app = await createTestApp({ mountPath: '/api/collaboration', routeModule: '../../src/routes/collaborationRoutes.js' });
  });

  it('requires authenticated users', async () => {
    const response = await request(app).post('/api/collaboration/spaces').send({ name: 'Design Reviews' });
    expect(response.status).toBe(401);
  });

  it('rejects users without collaboration roles', async () => {
    const token = buildToken({ id: 109, roles: ['visitor'] });
    const response = await request(app)
      .post('/api/collaboration/spaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Design Reviews' });
    expect(response.status).toBe(403);
  });

  it('allows agency collaborators', async () => {
    const token = buildToken({ id: 110, roles: ['agency'] });
    const response = await request(app)
      .post('/api/collaboration/spaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Design Reviews' });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ ok: true });
  });
});

describe('Company identity verification routes security', () => {
  let app;

  beforeAll(async () => {
    app = await createTestApp({
      mountPath: '/api/company/id-verifications',
      routeModule: '../../src/routes/companyIdentityVerificationRoutes.js',
    });
  });

  it('requires authentication', async () => {
    const response = await request(app).get('/api/company/id-verifications');
    expect(response.status).toBe(401);
  });

  it('rejects roles outside governance scope', async () => {
    const token = buildToken({ id: 111, roles: ['freelancer'] });
    const response = await request(app)
      .get('/api/company/id-verifications')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it('allows compliance users', async () => {
    const token = buildToken({ id: 112, roles: ['company', 'compliance'] });
    const response = await request(app)
      .get('/api/company/id-verifications')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ ok: true });
  });
});

describe('Company integration routes security', () => {
  let app;

  beforeAll(async () => {
    app = await createTestApp({
      mountPath: '/api/company/integrations',
      routeModule: '../../src/routes/companyIntegrationRoutes.js',
    });
  });

  it('requires authentication', async () => {
    const response = await request(app).get('/api/company/integrations/crm');
    expect(response.status).toBe(401);
  });

  it('rejects roles outside integration management', async () => {
    const token = buildToken({ id: 113, roles: ['freelancer'] });
    const response = await request(app)
      .get('/api/company/integrations/crm')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it('allows integration managers', async () => {
    const token = buildToken({ id: 114, roles: ['company', 'integration_manager'] });
    const response = await request(app)
      .get('/api/company/integrations/crm')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ ok: true });
  });
});

describe('Company job routes security', () => {
  let app;

  beforeAll(async () => {
    app = await createTestApp({ mountPath: '/api/company/jobs', routeModule: '../../src/routes/companyJobRoutes.js' });
  });

  it('requires authentication', async () => {
    const response = await request(app).get('/api/company/jobs/operations');
    expect(response.status).toBe(401);
  });

  it('rejects users without recruiter roles', async () => {
    const token = buildToken({ id: 115, roles: ['freelancer'] });
    const response = await request(app)
      .get('/api/company/jobs/operations')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it('allows company recruiters', async () => {
    const token = buildToken({ id: 116, roles: ['company', 'recruiter'] });
    const response = await request(app)
      .get('/api/company/jobs/operations')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ ok: true });
  });
});
