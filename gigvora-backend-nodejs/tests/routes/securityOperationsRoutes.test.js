import request from 'supertest';
import { jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const telemetry = jest.fn((req, res) => res.json({ query: req.query }));
const acknowledgeAlert = jest.fn((req, res) => res.json({ alertId: req.params.alertId, note: req.body?.note ?? null }));
const suppressAlert = jest.fn((req, res) => res.json({ alertId: req.params.alertId, note: req.body?.note ?? null }));
const triggerThreatSweep = jest.fn((req, res) => res.status(202).json({ body: req.body }));

const controllerModule = new URL('../../src/controllers/securityOperationsController.js', import.meta.url);
const authenticateModule = new URL('../../src/middleware/authenticate.js', import.meta.url);

jest.unstable_mockModule(controllerModule.pathname, () => ({
  telemetry,
  acknowledgeAlert,
  suppressAlert,
  triggerThreatSweep,
  default: { telemetry, acknowledgeAlert, suppressAlert, triggerThreatSweep },
}));

jest.unstable_mockModule(authenticateModule.pathname, () => ({
  authenticate: () => (req, res, next) => {
    req.user = { roles: ['admin'] };
    next();
  },
  requireAdmin: () => (req, res, next) => next(),
  requireRoles: () => (req, res, next) => next(),
  default: () => (req, res, next) => {
    req.user = { roles: ['admin'] };
    next();
  },
}));

let app;

beforeAll(async () => {
  const expressModule = await import('express');
  const { default: correlationId } = await import('../../src/middleware/correlationId.js');
  const { default: errorHandler } = await import('../../src/middleware/errorHandler.js');
  const { default: securityRoutes } = await import('../../src/routes/securityOperationsRoutes.js');
  const express = expressModule.default;
  app = express();
  app.use(express.json());
  app.use(correlationId());
  app.use('/api/security', securityRoutes);
  app.use(errorHandler);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/security/telemetry', () => {
  it('rejects invalid boolean values', async () => {
    const response = await request(app).get('/api/security/telemetry').query({ includeResolved: 'maybe' });

    expect(response.status).toBe(422);
    expect(telemetry).not.toHaveBeenCalled();
  });

  it('coerces boolean flags', async () => {
    const response = await request(app)
      .get('/api/security/telemetry')
      .query({ includeResolvedAlerts: 'true' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ query: { includeResolvedAlerts: true } });
    expect(telemetry).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/security/alerts/:alertId/acknowledge', () => {
  it('validates note length', async () => {
    const response = await request(app)
      .post('/api/security/alerts/alert-1/acknowledge')
      .send({ note: 'x'.repeat(600) });

    expect(response.status).toBe(422);
    expect(acknowledgeAlert).not.toHaveBeenCalled();
  });

  it('passes sanitised body to controller', async () => {
    const response = await request(app)
      .post('/api/security/alerts/alert-1/acknowledge')
      .send({ note: 'Reviewed and queued mitigation.' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ alertId: 'alert-1', note: 'Reviewed and queued mitigation.' });
    expect(acknowledgeAlert).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/security/alerts/:alertId/suppress', () => {
  it('accepts empty body and propagates alert identifier', async () => {
    const response = await request(app).post('/api/security/alerts/alert-9/suppress');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ alertId: 'alert-9', note: null });
    expect(suppressAlert).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/security/threat-sweep', () => {
  it('validates and forwards sweep payload', async () => {
    const response = await request(app)
      .post('/api/security/threat-sweep')
      .send({ sweepType: 'runtime-anomaly', reason: 'Spike in login anomalies', scope: 'critical', metadata: { window: '1h' } });

    expect(response.status).toBe(202);
    expect(response.body).toEqual({
      body: {
        sweepType: 'runtime-anomaly',
        reason: 'Spike in login anomalies',
        scope: 'critical',
        metadata: { window: '1h' },
      },
    });
    expect(triggerThreatSweep).toHaveBeenCalledTimes(1);
  });
});
