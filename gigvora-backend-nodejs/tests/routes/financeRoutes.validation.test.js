import request from 'supertest';
import { jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const controlTowerOverview = jest.fn((req, res) => res.json({ query: req.query }));
const showFreelancerInsights = jest.fn((req, res) => res.json({ freelancerId: req.params.freelancerId }));

const financeControllerModule = new URL('../../src/controllers/financeController.js', import.meta.url);

jest.unstable_mockModule(financeControllerModule.pathname, () => ({
  controlTowerOverview,
  showFreelancerInsights,
  default: { controlTowerOverview, showFreelancerInsights },
}));

let app;

beforeAll(async () => {
  const expressModule = await import('express');
  const { default: correlationId } = await import('../../src/middleware/correlationId.js');
  const { default: errorHandler } = await import('../../src/middleware/errorHandler.js');
  const { default: financeRoutes } = await import('../../src/routes/financeRoutes.js');
  const express = expressModule.default;
  app = express();
  app.use(express.json());
  app.use(correlationId());
  app.use('/api/finance', financeRoutes);
  app.use(errorHandler);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/finance/control-tower/overview', () => {
  it('rejects invalid date filters', async () => {
    const response = await request(app)
      .get('/api/finance/control-tower/overview')
      .query({ userId: '10', dateFrom: 'not-a-date' });

    expect(response.status).toBe(422);
    expect(controlTowerOverview).not.toHaveBeenCalled();
  });

  it('coerces numeric identifiers and boolean refresh flags', async () => {
    const response = await request(app)
      .get('/api/finance/control-tower/overview')
      .query({ userId: '10', dateFrom: '2024-03-01', dateTo: '2024-03-31', refresh: 'true' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      query: {
        userId: 10,
        dateFrom: '2024-03-01T00:00:00.000Z',
        dateTo: '2024-03-31T00:00:00.000Z',
        refresh: true,
      },
    });
  });
});

describe('GET /api/finance/freelancers/:freelancerId/insights', () => {
  it('rejects invalid freelancer identifiers', async () => {
    const response = await request(app).get('/api/finance/freelancers/foo/insights');

    expect(response.status).toBe(422);
    expect(showFreelancerInsights).not.toHaveBeenCalled();
  });

  it('passes sanitised identifiers to the controller', async () => {
    const response = await request(app).get('/api/finance/freelancers/55/insights');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ freelancerId: 55 });
  });
});
