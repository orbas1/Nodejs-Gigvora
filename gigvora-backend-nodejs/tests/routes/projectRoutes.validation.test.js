import request from 'supertest';
import { jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const store = jest.fn((req, res) => res.status(201).json(req.body));
const toggleAutoAssign = jest.fn((req, res) => res.json({ projectId: req.params.projectId, payload: req.body }));
const update = jest.fn((req, res) => res.json({ projectId: req.params.projectId, payload: req.body }));
const show = jest.fn((req, res) => res.json({ projectId: req.params.projectId }));
const events = jest.fn((req, res) => res.json({ projectId: req.params.projectId, limit: req.query.limit }));

const projectControllerModule = new URL('../../src/controllers/projectController.js', import.meta.url);
const authorizationModule = new URL('../../src/middleware/authorization.js', import.meta.url);
const authenticationModule = new URL('../../src/middleware/authentication.js', import.meta.url);

jest.unstable_mockModule(projectControllerModule.pathname, () => ({
  __esModule: true,
  default: { store, toggleAutoAssign, update, show, events },
  store,
  toggleAutoAssign,
  update,
  show,
  events,
}));

jest.unstable_mockModule(authorizationModule.pathname, () => ({
  requireProjectManagementRole: jest.fn((req, res, next) => {
    req.user = { roles: ['project_manager'] };
    next();
  }),
}));

jest.unstable_mockModule(authenticationModule.pathname, () => ({
  authenticateRequest: () => (req, _res, next) => {
    req.user = { id: 1, memberships: [], roles: ['project_manager'] };
    next();
  },
  authenticate: () => (req, _res, next) => {
    req.user = { id: 1, roles: ['project_manager'] };
    next();
  },
  requireRoles: () => (_req, _res, next) => next(),
}));

let app;

beforeAll(async () => {
  const expressModule = await import('express');
  const { default: correlationId } = await import('../../src/middleware/correlationId.js');
  const { default: errorHandler } = await import('../../src/middleware/errorHandler.js');
  const { default: projectRoutes } = await import('../../src/routes/projectRoutes.js');
  const express = expressModule.default;
  app = express();
  app.use(express.json());
  app.use(correlationId());
  app.use('/api/projects', projectRoutes);
  app.use(errorHandler);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/projects', () => {
  it('rejects payloads missing title and description', async () => {
    const response = await request(app).post('/api/projects').send({ status: 'draft' });

    expect(response.status).toBe(422);
    expect(store).not.toHaveBeenCalled();
  });

  it('sanitises project creation payloads', async () => {
    const response = await request(app)
      .post('/api/projects')
      .send({
        actorId: '88',
        title: '  Platform Expansion  ',
        description: '  Launch the enterprise analytics workstream.  ',
        status: 'IN_PROGRESS',
        location: '  New York  ',
        geoLocation: { city: ' New York ', latitude: '40.7', longitude: '-73.9' },
        budgetAmount: '125000.456',
        budgetCurrency: 'usd',
        autoAssign: {
          enabled: '1',
          limit: '25',
          expiresInMinutes: '180',
          fairness: { ensureNewcomer: 'false', maxAssignments: '5' },
          weights: { response_rate: '0.75', rating: '0.25' },
        },
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      actorId: 88,
      title: 'Platform Expansion',
      description: 'Launch the enterprise analytics workstream.',
      status: 'in_progress',
      location: 'New York',
      geoLocation: { city: 'New York', latitude: 40.7, longitude: -73.9 },
      budgetAmount: 125000.46,
      budgetCurrency: 'USD',
      autoAssign: {
        enabled: true,
        limit: 25,
        expiresInMinutes: 180,
        fairness: { ensureNewcomer: false, maxAssignments: 5 },
        weights: { response_rate: 0.75, rating: 0.25 },
      },
    });
  });
});

describe('PATCH /api/projects/:projectId/auto-assign', () => {
  it('validates the project identifier', async () => {
    const response = await request(app).patch('/api/projects/abc/auto-assign').send({ enabled: true });

    expect(response.status).toBe(422);
    expect(toggleAutoAssign).not.toHaveBeenCalled();
  });

  it('normalises auto-assign updates', async () => {
    const response = await request(app)
      .patch('/api/projects/15/auto-assign')
      .send({
        actorId: '42',
        enabled: 'false',
        budgetAmount: '5000',
        limit: '40',
        expiresInMinutes: '240',
        weights: { seniority: '0.6', quality: '0.4' },
        regenerateQueue: 'true',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      projectId: 15,
      payload: {
        actorId: 42,
        enabled: false,
        budgetAmount: 5000,
        settings: { limit: 40, expiresInMinutes: 240, weights: { seniority: 0.6, quality: 0.4 } },
        regenerateQueue: true,
      },
    });
  });
});

describe('PATCH /api/projects/:projectId', () => {
  it('rejects updates for invalid identifiers', async () => {
    const response = await request(app).patch('/api/projects/zero').send({ title: 'Update' });

    expect(response.status).toBe(422);
    expect(update).not.toHaveBeenCalled();
  });

  it('sanitises partial updates', async () => {
    const response = await request(app)
      .patch('/api/projects/22')
      .send({
        title: '  Updated Title ',
        status: 'ON_HOLD',
        budgetCurrency: 'eur',
        autoAssign: { enabled: 'true', settings: { limit: '50', fairness: { ensureNewcomer: '1' } } },
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      projectId: 22,
      payload: {
        title: 'Updated Title',
        status: 'on_hold',
        budgetCurrency: 'EUR',
        autoAssign: {
          enabled: true,
          settings: { limit: 50, fairness: { ensureNewcomer: true } },
        },
      },
    });
  });
});

describe('GET /api/projects/:projectId/events', () => {
  it('rejects non-numeric limits', async () => {
    const response = await request(app).get('/api/projects/33/events').query({ limit: '-1' });

    expect(response.status).toBe(422);
    expect(events).not.toHaveBeenCalled();
  });

  it('coerces identifiers and limits before hitting the controller', async () => {
    const response = await request(app).get('/api/projects/33/events').query({ limit: '10' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ projectId: 33, limit: 10 });
  });
});
