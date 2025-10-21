import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const getFreelancerReputation = jest.fn((req, res) =>
  res.json({ freelancerId: req.params.freelancerId }),
);
const postTestimonial = jest.fn((req, res) =>
  res.status(201).json({
    freelancerId: Number.parseInt(req.params.freelancerId, 10),
    actorId: req.user?.id ?? null,
  }),
);
const noopCreated = jest.fn((req, res) => res.status(201).json({ ok: true }));
const noopOk = jest.fn((req, res) => res.json({ ok: true }));
const noopNoContent = jest.fn((req, res) => res.status(204).end());

const reputationControllerModule = new URL('../src/controllers/reputationController.js', import.meta.url);

jest.unstable_mockModule(reputationControllerModule.pathname, () => ({
  __esModule: true,
  getFreelancerReputation,
  postTestimonial,
  postSuccessStory: noopCreated,
  postMetric: noopCreated,
  postBadge: noopCreated,
  postReviewWidget: noopCreated,
  getFreelancerReviews: noopOk,
  postFreelancerReview: noopCreated,
  putFreelancerReview: noopOk,
  removeFreelancerReview: noopNoContent,
}));

let app;

beforeAll(async () => {
  const expressModule = await import('express');
  const { default: errorHandler } = await import('../src/middleware/errorHandler.js');
  const { default: reputationRoutes } = await import('../src/routes/reputationRoutes.js');
  const express = expressModule.default;
  app = express();
  app.use(express.json());
  app.use('/api/reputation', reputationRoutes);
  app.use(errorHandler);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('reputationRoutes authentication and validation', () => {
  it('coerces freelancer identifiers to numbers for public lookups', async () => {
    const response = await request(app).get('/api/reputation/freelancers/45');

    expect(response.status).toBe(200);
    expect(getFreelancerReputation).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual({ freelancerId: '45' });
  });

  it('requires authentication for testimonial submissions', async () => {
    const response = await request(app).post('/api/reputation/freelancers/45/testimonials');

    expect(response.status).toBe(401);
    expect(postTestimonial).not.toHaveBeenCalled();
  });

  it('rejects users without permitted roles', async () => {
    const token = jwt.sign({ id: 502, roles: ['guest'] }, process.env.JWT_SECRET, { expiresIn: '10m' });

    const response = await request(app)
      .post('/api/reputation/freelancers/45/testimonials')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(postTestimonial).not.toHaveBeenCalled();
  });

  it('allows permitted actors to create testimonials', async () => {
    const token = jwt.sign({ id: 603, roles: ['mentor'] }, process.env.JWT_SECRET, { expiresIn: '10m' });

    const response = await request(app)
      .post('/api/reputation/freelancers/45/testimonials')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(201);
    expect(postTestimonial).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual({ freelancerId: 45, actorId: 603 });
  });
});
