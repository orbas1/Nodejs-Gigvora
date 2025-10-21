import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

const actualZodPath = fileURLToPath(new URL('../../node_modules/zod/index.js', import.meta.url));
jest.unstable_mockModule('zod', () => import(actualZodPath));

const modelsModulePath = fileURLToPath(new URL('../../src/models/index.js', import.meta.url));
const controllerModulePath = fileURLToPath(new URL('../../src/controllers/userTimelineController.js', import.meta.url));

jest.unstable_mockModule(modelsModulePath, () => ({ __esModule: true }));

const workspaceHandler = jest.fn((req, res) => res.json({ workspace: true }));
const updateSettingsHandler = jest.fn((req, res) => res.json({ settings: true }));
const createEntryHandler = jest.fn((req, res) => res.status(201).json({ entry: true }));
const updateEntryHandler = jest.fn((req, res) => res.json({ entry: true }));
const deleteEntryHandler = jest.fn((req, res) => res.status(204).send());
const createPostHandler = jest.fn((req, res) => res.status(201).json({ post: true }));
const updatePostHandler = jest.fn((req, res) => res.json({ post: true }));
const deletePostHandler = jest.fn((req, res) => res.status(204).send());
const publishPostHandler = jest.fn((req, res) => res.json({ post: true }));
const metricsHandler = jest.fn((req, res) => res.status(201).json({ metrics: true }));

jest.unstable_mockModule(controllerModulePath, () => ({
  __esModule: true,
  getTimelineWorkspace: workspaceHandler,
  updateTimelineSettings: updateSettingsHandler,
  createTimelineEntryController: createEntryHandler,
  updateTimelineEntryController: updateEntryHandler,
  deleteTimelineEntryController: deleteEntryHandler,
  createTimelinePostController: createPostHandler,
  updateTimelinePostController: updatePostHandler,
  deleteTimelinePostController: deletePostHandler,
  publishTimelinePostController: publishPostHandler,
  recordTimelinePostMetrics: metricsHandler,
}));

const { default: userTimelineRoutes } = await import('../../src/routes/userTimelineRoutes.js');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/users/:id/timeline', userTimelineRoutes);
  app.use((err, req, res, next) => {
    if (err?.status) {
      res.status(err.status).json({ message: err.message, details: err.details ?? err.issues });
      return;
    }
    res.status(500).json({ message: err?.message ?? 'Internal error' });
  });
  return app;
};

describe('userTimelineRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates timeline entry creation', async () => {
    const app = buildApp();
    const response = await request(app)
      .post('/users/5/timeline/entries')
      .send({ title: 'Launch Campaign', entryType: 'event' });
    expect(response.status).toBe(201);
    expect(createEntryHandler).toHaveBeenCalledTimes(1);
    const [req] = createEntryHandler.mock.calls[0];
    expect(req.params.id).toBe(5);
    expect(req.body.entryType).toBe('event');
  });

  it('rejects timeline entry payloads missing title', async () => {
    const app = buildApp();
    const response = await request(app).post('/users/5/timeline/entries').send({ entryType: 'event' });
    expect(response.status).toBe(422);
    expect(createEntryHandler).not.toHaveBeenCalled();
  });

  it('validates timeline post metrics payloads', async () => {
    const app = buildApp();
    const response = await request(app)
      .post('/users/8/timeline/posts/12/metrics')
      .send({ capturedAt: '2024-01-15', impressions: 10, conversionRate: 12.5 });
    expect(response.status).toBe(201);
    expect(metricsHandler).toHaveBeenCalledTimes(1);
    const [req] = metricsHandler.mock.calls[0];
    expect(req.params.postId).toBe(12);
    expect(req.body.capturedAt).toBe('2024-01-15');
  });

  it('rejects invalid timeline post metrics payloads', async () => {
    const app = buildApp();
    const response = await request(app)
      .post('/users/8/timeline/posts/12/metrics')
      .send({ impressions: 10 });
    expect(response.status).toBe(422);
    expect(metricsHandler).not.toHaveBeenCalled();
  });
});
