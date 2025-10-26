import request from 'supertest';
import { jest } from '@jest/globals';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const settings = jest.fn((req, res) => res.json({ theme: 'light', locale: 'en' }));
const navigation = jest.fn((req, res) => res.json({ items: [] }));
const navigationChrome = jest.fn((req, res) => res.json({ chrome: { locales: [] } }));
const index = jest.fn((req, res) =>
  res.json({ data: [{ slug: 'about', title: 'About' }], limit: Number(req.query.limit ?? 0) || null }),
);
const show = jest.fn((req, res) => res.json({ slug: req.params.slug }));

const controllerModule = new URL('../src/controllers/siteController.js', import.meta.url);

jest.unstable_mockModule(controllerModule.pathname, () => ({
  __esModule: true,
  settings,
  navigation,
  navigationChrome,
  index,
  show,
}));

let app;

beforeAll(async () => {
  const expressModule = await import('express');
  const { default: errorHandler } = await import('../src/middleware/errorHandler.js');
  const { default: siteRoutes } = await import('../src/routes/siteRoutes.js');
  const express = expressModule.default;
  app = express();
  app.use(express.json());
  app.use('/api/site', siteRoutes);
  app.use(errorHandler);
});

beforeEach(() => {
  jest.clearAllMocks();
});

const primitivesPath = fileURLToPath(new URL('../src/validation/primitives.js', import.meta.url));
const normalizedPrimitivesPath = primitivesPath.replace(/\\/g, '\\\\');

function runSchemaCheck(script) {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'Schema check failed');
  }
}

describe('siteRoutes validation', () => {
  it('rejects page listings with excessive limit', () => {
    runSchemaCheck(`
      import { z } from 'zod';
      import { optionalNumber } from '${normalizedPrimitivesPath}';
      const schema = z
        .object({ limit: optionalNumber({ min: 1, max: 50, integer: true }).transform((value) => value ?? undefined) })
        .strip();
      const result = schema.safeParse({ limit: 200 });
      if (result.success) {
        console.error('Schema accepted invalid limit');
        process.exit(1);
      }
    `);
  });

  it('rejects empty slugs for page lookups', () => {
    runSchemaCheck(`
      import { z } from 'zod';
      import { optionalTrimmedString } from '${normalizedPrimitivesPath}';
      const base = z
        .object({
          slug: optionalTrimmedString({ max: 180 })
            .refine((value) => value != null, { message: 'slug is required.' })
            .transform((value) => value ?? undefined),
        })
        .strip();
      const schema = base.transform((value) => ({ slug: value.slug }));
      const result = schema.safeParse({ slug: '   ' });
      if (result.success) {
        console.error('Schema accepted blank slug');
        process.exit(1);
      }
    `);
  });

  it('allows valid requests to proceed', async () => {
    const response = await request(app).get('/api/site/pages').query({ limit: 25 });

    expect(response.status).toBe(200);
    expect(index).toHaveBeenCalledTimes(1);
    expect(Number(index.mock.calls[0][0].query.limit)).toBe(25);
    expect(response.body).toEqual({ data: [{ slug: 'about', title: 'About' }], limit: 25 });
  });

  it('invokes navigationChrome with sanitised flags', async () => {
    const response = await request(app).get('/api/site/navigation/chrome').query({ includeFooter: 'false' });

    expect(response.status).toBe(200);
    expect(navigationChrome).toHaveBeenCalledTimes(1);
    expect(navigationChrome.mock.calls[0][0].query.includeFooter).toBe('false');
    expect(response.body).toEqual({ chrome: { locales: [] } });
  });
});
