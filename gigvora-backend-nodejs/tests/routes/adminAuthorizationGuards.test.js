process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

import errorHandler from '../../src/middleware/errorHandler.js';

const createDefaultProxyModule = () => ({
  __esModule: true,
  default: new Proxy(
    {},
    {
      get: (target, prop) => {
        if (!target[prop]) {
          target[prop] = jest.fn(() => undefined);
        }
        return target[prop];
      },
    },
  ),
});

const createNamedProxyModule = () =>
  new Proxy(
    { __esModule: true },
    {
      get: (target, prop) => {
        if (prop === '__esModule') {
          return true;
        }
        if (!target[prop]) {
          target[prop] = jest.fn(() => undefined);
        }
        return target[prop];
      },
    },
  );

const controllerMocks = [
  { url: new URL('../../src/controllers/adminMentoringController.js', import.meta.url), factory: createDefaultProxyModule },
  { url: new URL('../../src/controllers/adminMessagingController.js', import.meta.url), factory: createNamedProxyModule },
  { url: new URL('../../src/controllers/adminModerationController.js', import.meta.url), factory: createNamedProxyModule },
  { url: new URL('../../src/controllers/adminController.js', import.meta.url), factory: createNamedProxyModule },
  { url: new URL('../../src/controllers/legalPolicyController.js', import.meta.url), factory: createDefaultProxyModule },
  { url: new URL('../../src/controllers/adminProfileController.js', import.meta.url), factory: createNamedProxyModule },
  { url: new URL('../../src/controllers/adminProjectManagementController.js', import.meta.url), factory: createNamedProxyModule },
  { url: new URL('../../src/controllers/rbacPolicyController.js', import.meta.url), factory: createNamedProxyModule },
  { url: new URL('../../src/controllers/adminRuntimeController.js', import.meta.url), factory: createNamedProxyModule },
  { url: new URL('../../src/controllers/liveServiceTelemetryController.js', import.meta.url), factory: createNamedProxyModule },
  { url: new URL('../../src/controllers/adminSiteManagementController.js', import.meta.url), factory: createNamedProxyModule },
  { url: new URL('../../src/controllers/adminSpeedNetworkingController.js', import.meta.url), factory: createDefaultProxyModule },
  { url: new URL('../../src/controllers/adminStorageController.js', import.meta.url), factory: createNamedProxyModule },
  { url: new URL('../../src/controllers/adminTimelineController.js', import.meta.url), factory: createNamedProxyModule },
  { url: new URL('../../src/controllers/adminTwoFactorController.js', import.meta.url), factory: createNamedProxyModule },
  { url: new URL('../../src/controllers/adminUserController.js', import.meta.url), factory: createNamedProxyModule },
  { url: new URL('../../src/controllers/adminVolunteeringController.js', import.meta.url), factory: createNamedProxyModule },
  { url: new URL('../../src/controllers/adminWalletController.js', import.meta.url), factory: createNamedProxyModule },
  { url: new URL('../../src/controllers/adminJobPostController.js', import.meta.url), factory: createDefaultProxyModule },
  { url: new URL('../../src/controllers/agencyBlogController.js', import.meta.url), factory: createDefaultProxyModule },
];

await Promise.all(
  controllerMocks.map(({ url, factory }) => jest.unstable_mockModule(url.pathname, () => factory())),
);

const routesUnderTest = [
  {
    name: 'adminJobPostRoutes',
    mountPath: '/admin/jobs',
    modulePath: '../../src/routes/adminJobPostRoutes.js',
    endpoint: '/posts',
    adminOnly: true,
  },
  {
    name: 'adminMentoringRoutes',
    mountPath: '/admin/mentoring',
    modulePath: '../../src/routes/adminMentoringRoutes.js',
    endpoint: '/sessions',
    adminOnly: true,
  },
  {
    name: 'adminMessagingRoutes',
    mountPath: '/admin/messaging',
    modulePath: '../../src/routes/adminMessagingRoutes.js',
    endpoint: '/threads',
    adminOnly: true,
  },
  {
    name: 'adminModerationRoutes',
    mountPath: '/admin/moderation',
    modulePath: '../../src/routes/adminModerationRoutes.js',
    endpoint: '/overview',
    adminOnly: true,
  },
  {
    name: 'adminPageSettingsRoutes',
    mountPath: '/admin/page-settings',
    modulePath: '../../src/routes/adminPageSettingsRoutes.js',
    endpoint: '',
    adminOnly: true,
  },
  {
    name: 'adminPolicyRoutes',
    mountPath: '/admin/governance/policies',
    modulePath: '../../src/routes/adminPolicyRoutes.js',
    endpoint: '',
    adminOnly: true,
  },
  {
    name: 'adminProfileRoutes',
    mountPath: '/admin/profiles',
    modulePath: '../../src/routes/adminProfileRoutes.js',
    endpoint: '',
    adminOnly: true,
  },
  {
    name: 'adminProjectManagementRoutes',
    mountPath: '/admin/project-management',
    modulePath: '../../src/routes/adminProjectManagementRoutes.js',
    endpoint: '',
    adminOnly: true,
  },
  {
    name: 'adminRbacRoutes',
    mountPath: '/admin/governance/rbac',
    modulePath: '../../src/routes/adminRbacRoutes.js',
    endpoint: '/matrix',
    adminOnly: true,
  },
  {
    name: 'adminRuntimeRoutes',
    mountPath: '/admin/runtime',
    modulePath: '../../src/routes/adminRuntimeRoutes.js',
    endpoint: '/maintenance',
    adminOnly: true,
  },
  {
    name: 'adminSiteManagementRoutes',
    mountPath: '/admin/site-management',
    modulePath: '../../src/routes/adminSiteManagementRoutes.js',
    endpoint: '',
    adminOnly: true,
  },
  {
    name: 'adminSpeedNetworkingRoutes',
    mountPath: '/admin/speed-networking',
    modulePath: '../../src/routes/adminSpeedNetworkingRoutes.js',
    endpoint: '/sessions',
    adminOnly: true,
  },
  {
    name: 'adminStorageRoutes',
    mountPath: '/admin/storage',
    modulePath: '../../src/routes/adminStorageRoutes.js',
    endpoint: '/overview',
    adminOnly: true,
  },
  {
    name: 'adminTimelineRoutes',
    mountPath: '/admin/timelines',
    modulePath: '../../src/routes/adminTimelineRoutes.js',
    endpoint: '',
    adminOnly: true,
  },
  {
    name: 'adminTwoFactorRoutes',
    mountPath: '/admin/security/two-factor',
    modulePath: '../../src/routes/adminTwoFactorRoutes.js',
    endpoint: '',
    adminOnly: true,
  },
  {
    name: 'adminUserRoutes',
    mountPath: '/admin/users',
    modulePath: '../../src/routes/adminUserRoutes.js',
    endpoint: '',
    adminOnly: true,
  },
  {
    name: 'adminVolunteeringRoutes',
    mountPath: '/admin/volunteering',
    modulePath: '../../src/routes/adminVolunteeringRoutes.js',
    endpoint: '/insights',
    adminOnly: true,
  },
  {
    name: 'adminWalletRoutes',
    mountPath: '/admin/wallets',
    modulePath: '../../src/routes/adminWalletRoutes.js',
    endpoint: '/accounts',
    adminOnly: true,
  },
  {
    name: 'agencyBlogRoutes',
    mountPath: '/agency/blog',
    modulePath: '../../src/routes/agencyBlogRoutes.js',
    endpoint: '/posts',
    adminOnly: false,
  },
];

const buildApp = async (modulePath, mountPath) => {
  const { default: router } = await import(modulePath);
  const app = express();
  app.use(mountPath, router);
  app.use(errorHandler);
  return app;
};

const signToken = (roles) =>
  jwt.sign(
    {
      id: 123,
      type: roles.includes('admin') ? 'admin' : roles[0] ?? 'user',
      roles,
    },
    process.env.JWT_SECRET,
    { expiresIn: '10m' },
  );

describe('admin and agency router authorization guards', () => {
  routesUnderTest.forEach(({ name, mountPath, modulePath, endpoint, adminOnly }) => {
    describe(name, () => {
      let app;

      beforeAll(async () => {
        app = await buildApp(modulePath, mountPath);
      });

      it('rejects unauthenticated requests', async () => {
        const response = await request(app).get(`${mountPath}${endpoint || ''}`);
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
      });

      if (adminOnly) {
        it('rejects non-admin tokens', async () => {
          const token = signToken(['user']);
          const response = await request(app)
            .get(`${mountPath}${endpoint || ''}`)
            .set('Authorization', `Bearer ${token}`);
          expect(response.status).toBe(403);
          expect(response.body).toHaveProperty('message');
        });
      } else {
        it('rejects users without agency roles', async () => {
          const token = signToken(['user']);
          const response = await request(app)
            .get(`${mountPath}${endpoint || ''}`)
            .set('Authorization', `Bearer ${token}`);
          expect(response.status).toBe(403);
          expect(response.body).toHaveProperty('message');
        });

        it('allows agency roles through', async () => {
          const token = signToken(['agency']);
          const response = await request(app)
            .get(`${mountPath}${endpoint || ''}`)
            .set('Authorization', `Bearer ${token}`);
          expect([200, 204]).toContain(response.status);
        });
      }
    });
  });
});

