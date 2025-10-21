import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const getOverview = jest.fn((req, res) =>
  res.json({ userId: Number.parseInt(req.params.userId, 10), viewerId: req.user?.id ?? null }),
);
const listBookings = jest.fn((req, res) => res.json({ data: [], userId: Number.parseInt(req.params.userId, 10) }));
const createBooking = jest.fn((req, res) => res.status(201).json({ success: true }));
const updateBooking = jest.fn((req, res) => res.json({ bookingId: Number.parseInt(req.params.bookingId, 10) }));
const listPurchases = jest.fn((req, res) => res.json({ data: [] }));
const createPurchase = jest.fn((req, res) => res.status(201).json({ success: true }));
const updatePurchase = jest.fn((req, res) => res.json({ orderId: Number.parseInt(req.params.orderId, 10) }));
const listConnections = jest.fn((req, res) => res.json({ data: [] }));
const createConnection = jest.fn((req, res) => res.status(201).json({ success: true }));
const updateConnection = jest.fn((req, res) => res.json({ connectionId: Number.parseInt(req.params.connectionId, 10) }));

const controllerModule = new URL('../src/controllers/userNetworkingController.js', import.meta.url);

jest.unstable_mockModule(controllerModule.pathname, () => ({
  __esModule: true,
  getOverview,
  listBookings,
  createBooking,
  updateBooking,
  listPurchases,
  createPurchase,
  updatePurchase,
  listConnections,
  createConnection,
  updateConnection,
}));

let app;

beforeAll(async () => {
  const expressModule = await import('express');
  const { default: errorHandler } = await import('../src/middleware/errorHandler.js');
  const { default: userNetworkingRoutes } = await import('../src/routes/userNetworkingRoutes.js');
  const express = expressModule.default;
  app = express();
  app.use(express.json());
  app.use('/api/users/:userId/networking', userNetworkingRoutes);
  app.use(errorHandler);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('userNetworkingRoutes RBAC', () => {
  it('requires authentication', async () => {
    const response = await request(app).get('/api/users/22/networking/overview');

    expect(response.status).toBe(401);
    expect(getOverview).not.toHaveBeenCalled();
  });

  it('rejects users without matching identity when not admin', async () => {
    const token = jwt.sign({ id: 33, roles: ['user'] }, process.env.JWT_SECRET, { expiresIn: '10m' });

    const response = await request(app)
      .get('/api/users/44/networking/overview')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(getOverview).not.toHaveBeenCalled();
  });

  it('allows admins to access other user workspaces', async () => {
    const token = jwt.sign({ id: 77, roles: ['admin'] }, process.env.JWT_SECRET, { expiresIn: '10m' });

    const response = await request(app)
      .get('/api/users/44/networking/overview')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(getOverview).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual({ userId: 44, viewerId: 77 });
  });

  it('allows matching users with permitted roles', async () => {
    const token = jwt.sign({ id: 55, roles: ['mentor'] }, process.env.JWT_SECRET, { expiresIn: '10m' });

    const response = await request(app)
      .get('/api/users/55/networking/overview')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(getOverview).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual({ userId: 55, viewerId: 55 });
  });
});
