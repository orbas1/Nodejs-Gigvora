process.env.LOG_LEVEL = 'silent';

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

import { AuthenticationError } from '../../src/utils/errors.js';

const adServiceModulePath = new URL('../../src/services/adService.js', import.meta.url).pathname;
const authenticationModulePath = new URL('../../src/middleware/authentication.js', import.meta.url).pathname;
const modelsModulePath = new URL('../../src/models/index.js', import.meta.url).pathname;

let app;
let adServiceMock;
let authenticateOptions;
let requireRolesCalls;
let currentAuthHandler;

beforeAll(async () => {
  jest.resetModules();

  jest.unstable_mockModule(adServiceModulePath, () => ({
    __esModule: true,
    getAdDashboardSnapshot: jest.fn(),
    listPlacements: jest.fn(),
    getPlacementsForSurface: jest.fn(),
  }));

  jest.unstable_mockModule(modelsModulePath, () => ({ __esModule: true }));

  authenticateOptions = [];
  requireRolesCalls = [];
  currentAuthHandler = async (req, _res, next) => {
    req.user = null;
    next(new AuthenticationError('Authentication required.'));
  };

  jest.unstable_mockModule(authenticationModulePath, () => ({
    __esModule: true,
    authenticateRequest: (options = {}) => {
      authenticateOptions.push(options);
      return async (req, res, next) => {
        try {
          await currentAuthHandler(req, res, next, options);
        } catch (error) {
          next(error);
        }
      };
    },
    requireRoles: (...roles) => {
      requireRolesCalls.push(roles);
      return (req, res, next) => {
        const userType = req.user?.userType ?? null;
        if (!userType || !roles.includes(userType)) {
          return res.status(403).json({ message: 'You do not have permission to access this resource.' });
        }
        return next();
      };
    },
  }));

  const [{ default: correlationId }, { default: errorHandler }, { default: adRoutes }] = await Promise.all([
    import('../../src/middleware/correlationId.js'),
    import('../../src/middleware/errorHandler.js'),
    import('../../src/routes/adRoutes.js'),
  ]);

  adServiceMock = await import(adServiceModulePath);

  app = express();
  app.use(express.json());
  app.use(correlationId());
  app.use('/api/ads', adRoutes);
  app.use(errorHandler);
});

afterEach(() => {
  jest.clearAllMocks();
  authenticateOptions.length = 0;
  requireRolesCalls.length = 0;
  currentAuthHandler = async (req, _res, next) => {
    req.user = null;
    next(new AuthenticationError('Authentication required.'));
  };
});

describe('ads route security', () => {
  it('enforces token-based authentication and blocks header spoofing', async () => {
    currentAuthHandler = async (_req, _res, next) => {
      next(new AuthenticationError('Authentication required.'));
    };

    const response = await request(app)
      .get('/api/ads/dashboard')
      .set('x-user-type', 'admin')
      .set('x-roles', 'admin');

    expect(authenticateOptions).toEqual(
      expect.arrayContaining([expect.objectContaining({ allowHeaderOverride: false })]),
    );
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ message: 'Authentication required.' });
  });

  it('denies access when the authenticated user lacks admin role', async () => {
    currentAuthHandler = async (req, _res, next) => {
      req.user = { id: 24, userType: 'user' };
      next();
    };

    const response = await request(app)
      .get('/api/ads/dashboard')
      .set('Authorization', 'Bearer mock-token');

    expect(requireRolesCalls).toContainEqual(['admin']);
    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({ message: 'You do not have permission to access this resource.' });
  });

  it('allows admin access and returns dashboard data', async () => {
    currentAuthHandler = async (req, _res, next) => {
      req.user = { id: 1, userType: 'admin' };
      next();
    };
    adServiceMock.getAdDashboardSnapshot.mockResolvedValue({ metrics: { impressions: 1200 }, surfaces: [] });

    const response = await request(app)
      .get('/api/ads/dashboard')
      .set('Authorization', 'Bearer mock-token');

    expect(response.status).toBe(200);
    expect(adServiceMock.getAdDashboardSnapshot).toHaveBeenCalled();
    expect(response.body).toMatchObject({ metrics: { impressions: 1200 } });
  });

  it('returns placements for admins', async () => {
    currentAuthHandler = async (req, _res, next) => {
      req.user = { id: 7, userType: 'admin' };
      next();
    };
    adServiceMock.listPlacements.mockResolvedValue([
      { id: 3, surface: 'global_dashboard' },
      { id: 4, surface: 'company_dashboard' },
    ]);

    const response = await request(app)
      .get('/api/ads/placements')
      .set('Authorization', 'Bearer mock-token')
      .query({ surfaces: 'global_dashboard,company_dashboard' });

    expect(response.status).toBe(200);
    expect(adServiceMock.listPlacements).toHaveBeenCalledWith({
      surfaces: ['global_dashboard', 'company_dashboard'],
      status: undefined,
      now: expect.any(Date),
    });
    expect(response.body).toEqual({
      placements: [
        { id: 3, surface: 'global_dashboard' },
        { id: 4, surface: 'company_dashboard' },
      ],
    });
  });
});
