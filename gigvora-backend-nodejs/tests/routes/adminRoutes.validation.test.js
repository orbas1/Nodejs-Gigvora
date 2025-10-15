import request from 'supertest';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.JWT_SECRET = 'test-admin-secret';
process.env.LOG_LEVEL = 'silent';

const getAdminDashboardSnapshot = jest.fn().mockResolvedValue({ metrics: [] });
const getPlatformSettings = jest.fn().mockResolvedValue({});
const updatePlatformSettings = jest.fn().mockImplementation(async (payload) => payload);
const getAffiliateSettings = jest.fn().mockResolvedValue({});
const updateAffiliateSettings = jest.fn().mockImplementation(async (payload) => payload);

const adminDashboardModuleUrl = new URL('../../src/services/adminDashboardService.js', import.meta.url);
const platformSettingsModuleUrl = new URL('../../src/services/platformSettingsService.js', import.meta.url);
const affiliateSettingsModuleUrl = new URL('../../src/services/affiliateSettingsService.js', import.meta.url);
const runtimeObservabilityModuleUrl = new URL('../../src/services/runtimeObservabilityService.js', import.meta.url);

jest.unstable_mockModule(adminDashboardModuleUrl.pathname, () => ({
  getAdminDashboardSnapshot,
}));

jest.unstable_mockModule(platformSettingsModuleUrl.pathname, () => ({
  getPlatformSettings,
  updatePlatformSettings,
}));

jest.unstable_mockModule(affiliateSettingsModuleUrl.pathname, () => ({
  getAffiliateSettings,
  updateAffiliateSettings,
}));

jest.unstable_mockModule(runtimeObservabilityModuleUrl.pathname, () => ({
  getRuntimeOperationalSnapshot: jest.fn().mockResolvedValue({ status: 'ok' }),
}));

let app;
let accessTokenSecret;

beforeAll(async () => {
  const expressModule = await import('express');
  const { default: correlationId } = await import('../../src/middleware/correlationId.js');
  const { default: errorHandler } = await import('../../src/middleware/errorHandler.js');
  const { default: adminRoutes } = await import('../../src/routes/adminRoutes.js');
  const express = expressModule.default;
  app = express();
  app.use(express.json());
  app.use(correlationId());
  app.use('/api/admin', adminRoutes);
  app.use(errorHandler);
  ({ resolveAccessTokenSecret: accessTokenSecret } = await import('../../src/utils/jwtSecrets.js'));
});

beforeEach(() => {
  getAdminDashboardSnapshot.mockClear();
  getPlatformSettings.mockClear();
  updatePlatformSettings.mockClear();
  getAffiliateSettings.mockClear();
  updateAffiliateSettings.mockClear();
});

function buildAdminToken() {
  const secret = typeof accessTokenSecret === 'function' ? accessTokenSecret() : 'gigvora-development-access-secret';
  return jwt.sign({ id: 99, type: 'admin' }, secret);
}

describe('GET /api/admin/dashboard', () => {
  it('rejects invalid query parameters', async () => {
    const response = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${buildAdminToken()}`)
      .query({ lookbackDays: 'not-a-number' });

    expect(response.status).toBe(422);
    expect(getAdminDashboardSnapshot).not.toHaveBeenCalled();
  });

  it('coerces numeric filters before querying the dashboard service', async () => {
    const response = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${buildAdminToken()}`)
      .query({ lookbackDays: '14', eventWindowDays: '5' });

    expect(response.status).toBe(200);
    expect(getAdminDashboardSnapshot).toHaveBeenCalledWith({ lookbackDays: 14, eventWindowDays: 5 });
  });
});

describe('PUT /api/admin/platform-settings', () => {
  it('enforces numeric validation on commission fields', async () => {
    const response = await request(app)
      .put('/api/admin/platform-settings')
      .set('Authorization', `Bearer ${buildAdminToken()}`)
      .send({ commissions: { rate: 'abc' } });

    expect(response.status).toBe(422);
    expect(updatePlatformSettings).not.toHaveBeenCalled();
  });

  it('strips and normalises nested provider settings', async () => {
    const payload = {
      commissions: {
        enabled: 'true',
        rate: '12.345',
        minimumFee: '5.5',
        currency: 'usd',
        servicemanPayoutNotes: '  Keep documentation up to date.  ',
      },
      payments: {
        provider: 'stripe',
        stripe: { publishableKey: ' pk_test ', webhookSecret: ' whsec ' },
        escrow_com: { sandbox: 'false' },
      },
      smtp: { port: '2525', secure: '1' },
    };

    const response = await request(app)
      .put('/api/admin/platform-settings')
      .set('Authorization', `Bearer ${buildAdminToken()}`)
      .send(payload);

    expect(response.status).toBe(200);
    expect(updatePlatformSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        commissions: expect.objectContaining({
          enabled: true,
          rate: 12.35,
          minimumFee: 5.5,
          currency: 'USD',
          servicemanPayoutNotes: 'Keep documentation up to date.',
        }),
        payments: expect.objectContaining({
          provider: 'stripe',
          stripe: expect.objectContaining({
            publishableKey: 'pk_test',
            webhookSecret: 'whsec',
          }),
          escrow_com: expect.objectContaining({ sandbox: false }),
        }),
        smtp: expect.objectContaining({ port: 2525, secure: true }),
      }),
    );
  });
});

describe('PUT /api/admin/affiliate-settings', () => {
  it('validates tier definitions', async () => {
    const response = await request(app)
      .put('/api/admin/affiliate-settings')
      .set('Authorization', `Bearer ${buildAdminToken()}`)
      .send({ tiers: [{ name: '  ', rate: '10' }] });

    expect(response.status).toBe(422);
    expect(updateAffiliateSettings).not.toHaveBeenCalled();
  });

  it('coerces recurrence and monetary fields', async () => {
    const response = await request(app)
      .put('/api/admin/affiliate-settings')
      .set('Authorization', `Bearer ${buildAdminToken()}`)
      .send({
        enabled: '1',
        defaultCommissionRate: '15.555',
        referralWindowDays: '45',
        currency: 'gbp',
        payouts: {
          frequency: 'Monthly',
          minimumPayoutThreshold: '99.99',
          autoApprove: 'true',
          recurrence: { type: 'FINITE', limit: '12' },
        },
        compliance: { requiredDocuments: [' taxForm ', 'address'], twoFactorRequired: 'false' },
        tiers: [
          { id: ' starter ', name: ' Starter ', minValue: '0', maxValue: '999', rate: '8.4' },
          { name: 'Growth', minValue: '1000', rate: '11.25' },
        ],
      });

    expect(response.status).toBe(200);
    expect(updateAffiliateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        defaultCommissionRate: 15.56,
        referralWindowDays: 45,
        currency: 'GBP',
        payouts: expect.objectContaining({
          frequency: 'monthly',
          minimumPayoutThreshold: 99.99,
          autoApprove: true,
          recurrence: expect.objectContaining({ type: 'finite', limit: 12 }),
        }),
        compliance: expect.objectContaining({
          requiredDocuments: ['taxForm', 'address'],
          twoFactorRequired: false,
        }),
        tiers: expect.arrayContaining([
          expect.objectContaining({ id: 'starter', name: 'Starter', minValue: 0, maxValue: 999, rate: 8.4 }),
          expect.objectContaining({ name: 'Growth', minValue: 1000, rate: 11.25 }),
        ]),
      }),
    );
  });
});
