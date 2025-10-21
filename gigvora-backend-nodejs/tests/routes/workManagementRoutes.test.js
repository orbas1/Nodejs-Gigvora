import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

const actualZodPath = fileURLToPath(new URL('../../node_modules/zod/index.js', import.meta.url));
jest.unstable_mockModule('zod', () => import(actualZodPath));

const constantsModulePath = fileURLToPath(new URL('../../src/models/constants/index.js', import.meta.url));
const modelsModulePath = fileURLToPath(new URL('../../src/models/index.js', import.meta.url));
const authenticateModulePath = fileURLToPath(new URL('../../src/middleware/authenticate.js', import.meta.url));
const authorizationModulePath = fileURLToPath(new URL('../../src/middleware/authorization.js', import.meta.url));
const controllerModulePath = fileURLToPath(new URL('../../src/controllers/workManagementController.js', import.meta.url));

jest.unstable_mockModule(constantsModulePath, () => ({
  __esModule: true,
  SPRINT_STATUSES: ['planning', 'active', 'completed'],
  SPRINT_TASK_STATUSES: ['backlog', 'in_progress', 'done'],
  SPRINT_TASK_PRIORITIES: ['low', 'medium', 'high'],
  SPRINT_RISK_STATUSES: ['open', 'mitigating', 'closed'],
  SPRINT_RISK_IMPACTS: ['low', 'medium', 'high'],
  CHANGE_REQUEST_STATUSES: ['pending_approval', 'approved', 'rejected'],
}));

jest.unstable_mockModule(modelsModulePath, () => ({ __esModule: true }));

const authenticateMock = jest.fn(() => (req, res, next) => {
  req.user = { id: 1, roles: ['project_manager'] };
  next();
});
const requireProjectManagementRoleMock = jest.fn((req, res, next) => next());

const overviewHandler = jest.fn((req, res) => res.json({ ok: true }));
const storeSprintHandler = jest.fn((req, res) => res.status(201).json({ sprint: true }));
const storeTaskHandler = jest.fn((req, res) => res.status(201).json({ task: true }));
const updateTaskHandler = jest.fn((req, res) => res.json({ task: true }));
const logTimeHandler = jest.fn((req, res) => res.status(201).json({ entry: true }));
const storeRiskHandler = jest.fn((req, res) => res.status(201).json({ risk: true }));
const modifyRiskHandler = jest.fn((req, res) => res.json({ risk: true }));
const storeChangeRequestHandler = jest.fn((req, res) => res.status(201).json({ change: true }));
const approveChangeHandler = jest.fn((req, res) => res.json({ change: true }));

jest.unstable_mockModule(authenticateModulePath, () => ({
  __esModule: true,
  default: authenticateMock,
  authenticate: authenticateMock,
}));

jest.unstable_mockModule(authorizationModulePath, () => ({
  __esModule: true,
  requireProjectManagementRole: requireProjectManagementRoleMock,
}));

jest.unstable_mockModule(controllerModulePath, () => ({
  __esModule: true,
  overview: overviewHandler,
  storeSprint: storeSprintHandler,
  storeTask: storeTaskHandler,
  updateTask: updateTaskHandler,
  logTime: logTimeHandler,
  storeRisk: storeRiskHandler,
  modifyRisk: modifyRiskHandler,
  storeChangeRequest: storeChangeRequestHandler,
  approveChange: approveChangeHandler,
  default: {
    overview: overviewHandler,
    storeSprint: storeSprintHandler,
    storeTask: storeTaskHandler,
    updateTask: updateTaskHandler,
    logTime: logTimeHandler,
    storeRisk: storeRiskHandler,
    modifyRisk: modifyRiskHandler,
    storeChangeRequest: storeChangeRequestHandler,
    approveChange: approveChangeHandler,
  },
}));

const workManagementRoutesModule = await import('../../src/routes/workManagementRoutes.js');
const workManagementRoutes = workManagementRoutesModule.default ?? workManagementRoutesModule;

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/projects/:projectId/work-management', workManagementRoutes);
  app.use((err, req, res, next) => {
    if (err?.status) {
      res.status(err.status).json({ message: err.message, details: err.details ?? err.issues });
      return;
    }
    res.status(500).json({ message: err?.message ?? 'Internal error' });
  });
  return app;
};

describe('workManagementRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires valid project id for overview requests', async () => {
    const app = buildApp();
    const response = await request(app).get('/projects/invalid/work-management');
    expect(response.status).toBe(422);
    expect(response.body.message).toBe('Request validation failed.');
    expect(overviewHandler).not.toHaveBeenCalled();
  });

  it('validates sprint creation requests', async () => {
    const app = buildApp();
    const response = await request(app)
      .post('/projects/11/work-management/sprints')
      .send({ name: 'Sprint Alpha', status: 'planning' });
    expect(response.status).toBe(201);
    expect(storeSprintHandler).toHaveBeenCalledTimes(1);
    const [req] = storeSprintHandler.mock.calls[0];
    expect(req.params.projectId).toBe(11);
    expect(req.user).toEqual({ id: 1, roles: ['project_manager'] });
    expect(requireProjectManagementRoleMock).toHaveBeenCalled();
  });

  it('rejects change request approval without actor information', async () => {
    const app = buildApp();
    const response = await request(app)
      .patch('/projects/4/work-management/change-requests/9/approve')
      .send({ status: 'approved' });
    expect(response.status).toBe(422);
    expect(approveChangeHandler).not.toHaveBeenCalled();
  });
});
