import request from 'supertest';
import { jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const globalSearch = jest.fn((req, res) => res.json({ limit: req.query.limit ?? null, q: req.query.q ?? null }));
const searchOpportunities = jest.fn((req, res) =>
  res.json({
    category: req.query.category,
    includeFacets: req.query.includeFacets,
    filters: req.query.filters,
    sort: req.query.sort,
    viewport: req.query.viewport,
    page: req.query.page,
    pageSize: req.query.pageSize,
  }),
);
const searchJobs = jest.fn((req, res) => res.json({ page: req.query.page, pageSize: req.query.pageSize }));
const createSubscription = jest.fn((req, res) => res.status(201).json(req.body));
const updateSubscription = jest.fn((req, res) => res.json({ id: req.params.id, payload: req.body }));
const deleteSubscription = jest.fn((req, res) => res.json({ id: req.params.id, deleted: true }));

const searchControllerModule = new URL('../../src/controllers/searchController.js', import.meta.url);
const searchSubscriptionControllerModule = new URL(
  '../../src/controllers/searchSubscriptionController.js',
  import.meta.url,
);

jest.unstable_mockModule(searchControllerModule.pathname, () => ({
  globalSearch,
  searchOpportunities,
  searchJobs,
  searchGigs: searchJobs,
  searchProjects: searchJobs,
  searchVolunteering: searchJobs,
  searchLaunchpad: searchJobs,
}));

jest.unstable_mockModule(searchSubscriptionControllerModule.pathname, () => ({
  listSubscriptions: jest.fn((req, res) => res.json({ items: [] })),
  createSubscription,
  updateSubscription,
  deleteSubscription,
}));

let app;

beforeAll(async () => {
  const expressModule = await import('express');
  const { default: correlationId } = await import('../../src/middleware/correlationId.js');
  const { default: errorHandler } = await import('../../src/middleware/errorHandler.js');
  const { default: searchRoutes } = await import('../../src/routes/searchRoutes.js');
  const express = expressModule.default;
  app = express();
  app.use(express.json());
  app.use(correlationId());
  app.use('/api/search', searchRoutes);
  app.use(errorHandler);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/search', () => {
  it('rejects malformed limits', async () => {
    const response = await request(app).get('/api/search').query({ limit: 'not-a-number' });

    expect(response.status).toBe(422);
    expect(globalSearch).not.toHaveBeenCalled();
  });

  it('coerces numeric limit values', async () => {
    const response = await request(app).get('/api/search').query({ limit: '25', q: ' remote ' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ limit: 25, q: 'remote' });
  });
});

describe('GET /api/search/opportunities', () => {
  it('rejects invalid filter JSON', async () => {
    const response = await request(app)
      .get('/api/search/opportunities')
      .query({ filters: '{bad-json}', category: 'jobs' });

    expect(response.status).toBe(422);
    expect(searchOpportunities).not.toHaveBeenCalled();
  });

  it('normalises category, filters, and sort configuration', async () => {
    const response = await request(app)
      .get('/api/search/opportunities')
      .query({
        category: 'PROJECTS',
        page: '2',
        pageSize: '15',
        includeFacets: 'false',
        filters: JSON.stringify({ employmentTypes: [' full-time ', 'contract', 'contract'], isRemote: '1' }),
        sort: [' title:asc ', ''],
        viewport: JSON.stringify({ boundingBox: { north: 50, south: 40, east: -70, west: -90 } }),
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      category: 'project',
      includeFacets: false,
      filters: { employmentTypes: ['full-time', 'contract'], isRemote: true },
      sort: ['title:asc'],
      viewport: { boundingBox: { north: 50, south: 40, east: -70, west: -90 } },
      page: 2,
      pageSize: 15,
    });
  });
});

describe('POST /api/search/subscriptions', () => {
  it('rejects empty payloads', async () => {
    const response = await request(app).post('/api/search/subscriptions').send({});

    expect(response.status).toBe(422);
    expect(createSubscription).not.toHaveBeenCalled();
  });

  it('sanitises subscription payloads before controller execution', async () => {
    const response = await request(app)
      .post('/api/search/subscriptions')
      .send({
        name: '  Growth Jobs  ',
        category: 'GIGS',
        query: '  design ',
        frequency: 'Weekly',
        filters: { locations: ['  new york  ', 'london'] },
        sort: ' freshness:desc ',
        notifyByEmail: 'false',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      name: 'Growth Jobs',
      category: 'gig',
      query: 'design',
      filters: { locations: ['new york', 'london'] },
      sort: 'freshness:desc',
      frequency: 'weekly',
      notifyByEmail: false,
      notifyInApp: true,
    });
  });
});

describe('PATCH /api/search/subscriptions/:id', () => {
  it('rejects non-numeric identifiers', async () => {
    const response = await request(app).patch('/api/search/subscriptions/not-a-number').send({ name: 'Valid' });

    expect(response.status).toBe(422);
    expect(updateSubscription).not.toHaveBeenCalled();
  });

  it('coerces nested updates before invoking the controller', async () => {
    const response = await request(app)
      .patch('/api/search/subscriptions/42')
      .send({
        name: '  Updated ',
        frequency: 'IMMEDIATE',
        notifyByEmail: '1',
        notifyInApp: '0',
        filters: JSON.stringify({ statuses: [' active ', 'paused'] }),
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 42,
      payload: {
        name: 'Updated',
        frequency: 'immediate',
        notifyByEmail: true,
        notifyInApp: false,
        filters: { statuses: ['active', 'paused'] },
      },
    });
  });
});

describe('DELETE /api/search/subscriptions/:id', () => {
  it('validates identifiers before deletion', async () => {
    const response = await request(app).delete('/api/search/subscriptions/abc');

    expect(response.status).toBe(422);
    expect(deleteSubscription).not.toHaveBeenCalled();
  });

  it('passes sanitised identifiers to the controller', async () => {
    const response = await request(app).delete('/api/search/subscriptions/7');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 7, deleted: true });
  });
});
