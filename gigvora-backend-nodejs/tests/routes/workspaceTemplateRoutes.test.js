import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

const actualZodPath = fileURLToPath(new URL('../../node_modules/zod/index.js', import.meta.url));
jest.unstable_mockModule('zod', () => import(actualZodPath));

const modelsModulePath = fileURLToPath(new URL('../../src/models/index.js', import.meta.url));
const controllerModulePath = fileURLToPath(new URL('../../src/controllers/workspaceTemplateController.js', import.meta.url));

jest.unstable_mockModule(modelsModulePath, () => ({ __esModule: true }));

const indexHandler = jest.fn((req, res) => res.json({ templates: [] }));
const showHandler = jest.fn((req, res) => res.json({ slug: req.params.slug }));

jest.unstable_mockModule(controllerModulePath, () => ({
  __esModule: true,
  index: indexHandler,
  show: showHandler,
  default: {
    index: indexHandler,
    show: showHandler,
  },
}));

const workspaceTemplateRoutesModule = await import('../../src/routes/workspaceTemplateRoutes.js');
const workspaceTemplateRoutes = workspaceTemplateRoutesModule.default ?? workspaceTemplateRoutesModule;

const buildApp = () => {
  const app = express();
  app.use('/workspace-templates', workspaceTemplateRoutes);
  app.use((err, req, res, next) => {
    if (err?.status) {
      res.status(err.status).json({ message: err.message, details: err.details ?? err.issues });
      return;
    }
    res.status(500).json({ message: err?.message ?? 'Internal error' });
  });
  return app;
};

describe('workspaceTemplateRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows valid slug lookups', async () => {
    const app = buildApp();
    const response = await request(app).get('/workspace-templates/product-launch');
    expect(response.status).toBe(200);
    expect(showHandler).toHaveBeenCalledTimes(1);
    const [req] = showHandler.mock.calls[0];
    expect(req.params.slug).toBe('product-launch');
  });

  it('rejects invalid slugs', async () => {
    const app = buildApp();
    const response = await request(app).get('/workspace-templates/invalid slug');
    expect(response.status).toBe(422);
    expect(response.body.message).toBe('Request validation failed.');
    expect(showHandler).not.toHaveBeenCalled();
  });
});
