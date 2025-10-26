import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const constantsModule = new URL('../src/models/constants/index.js', import.meta.url);
const controllerModule = new URL('../src/controllers/launchpadController.js', import.meta.url);

const listApplications = jest.fn((req, res) => res.json({ ok: true }));

jest.unstable_mockModule(controllerModule.pathname, () => ({
  __esModule: true,
  default: {
    listApplications,
    createApplication: jest.fn((req, res) => res.status(201).json({ ok: true })),
    updateApplication: jest.fn((req, res) => res.json({ ok: true })),
    createEmployerRequest: jest.fn((req, res) => res.status(201).json({ ok: true })),
    createPlacement: jest.fn((req, res) => res.status(201).json({ ok: true })),
    createOpportunityLink: jest.fn((req, res) => res.status(201).json({ ok: true })),
    dashboard: jest.fn((req, res) => res.json({ ok: true })),
    workflow: jest.fn((req, res) => res.json({ ok: true })),
  },
  listApplications,
  createApplication: jest.fn((req, res) => res.status(201).json({ ok: true })),
  updateApplication: jest.fn((req, res) => res.json({ ok: true })),
  createEmployerRequest: jest.fn((req, res) => res.status(201).json({ ok: true })),
  createPlacement: jest.fn((req, res) => res.status(201).json({ ok: true })),
  createOpportunityLink: jest.fn((req, res) => res.status(201).json({ ok: true })),
  dashboard: jest.fn((req, res) => res.json({ ok: true })),
  workflow: jest.fn((req, res) => res.json({ ok: true })),
}));

jest.unstable_mockModule(constantsModule.pathname, () => ({
  __esModule: true,
  LAUNCHPAD_APPLICATION_STATUSES: ['new', 'review'],
  LAUNCHPAD_PLACEMENT_STATUSES: ['scheduled', 'completed'],
  LAUNCHPAD_TARGET_TYPES: ['project', 'gig', 'volunteering'],
  LAUNCHPAD_OPPORTUNITY_SOURCES: ['manual', 'import'],
}));

let app;

beforeAll(async () => {
  const { default: launchpadRoutes } = await import('../src/routes/launchpadRoutes.js');
  const expressApp = express();
  expressApp.use(express.json());
  expressApp.use('/api/launchpad', launchpadRoutes);
  expressApp.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    const status = err.status ?? err.statusCode ?? 500;
    res.status(status).json({ message: err.message ?? 'Internal server error' });
  });
  app = expressApp;
});

describe('Launchpad routes authentication', () => {
  it('rejects unauthenticated requests', async () => {
    const response = await request(app).get('/api/launchpad/applications');
    expect(response.status).toBe(401);
  });

  it('rejects users without launchpad roles', async () => {
    const token = jwt.sign({ id: 101, roles: ['user'] }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const response = await request(app)
      .get('/api/launchpad/applications')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
  });
});
