process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import express from 'express';
import request from 'supertest';
import '../setupTestEnv.js';
import asyncHandler from '../../src/utils/asyncHandler.js';
import correlationId from '../../src/middleware/correlationId.js';
import errorHandler from '../../src/middleware/errorHandler.js';
import complianceLockerController from '../../src/controllers/complianceLockerController.js';
import * as userController from '../../src/controllers/userController.js';
import { User, Profile, sequelize } from '../../src/models/index.js';
import { __dangerousResetDependencyGuardCache } from '../../src/services/runtimeDependencyGuard.js';

const originalEnv = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER,
  CLOUDFLARE_R2_ACCOUNT_ID: process.env.CLOUDFLARE_R2_ACCOUNT_ID,
  CLOUDFLARE_R2_ACCESS_KEY_ID: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  CLOUDFLARE_R2_BUCKET: process.env.CLOUDFLARE_R2_BUCKET,
  CLOUDFLARE_R2_ENDPOINT: process.env.CLOUDFLARE_R2_ENDPOINT,
};

const loggerStub = {
  info: () => {},
  warn: () => {},
  error: () => {},
};

function buildTestApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(correlationId());
  app.use((req, res, next) => {
    req.log = loggerStub;
    next();
  });
  app.use(express.json());

  const complianceRouter = express.Router();
  complianceRouter.post('/documents', asyncHandler(complianceLockerController.storeDocument));
  app.use('/api/compliance', complianceRouter);

  const userRouter = express.Router();
  userRouter.get('/:id', asyncHandler(userController.getUserProfile));
  app.use('/api/users', userRouter);

  app.use(errorHandler);
  return app;
}

const app = buildTestApp();

function clearPaymentEnv() {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_PUBLISHABLE_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  process.env.PAYMENT_PROVIDER = 'stripe';
}

function clearComplianceEnv() {
  delete process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  delete process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  delete process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  delete process.env.CLOUDFLARE_R2_BUCKET;
  delete process.env.CLOUDFLARE_R2_ENDPOINT;
}

function restoreOriginalEnv() {
  if (typeof originalEnv.STRIPE_SECRET_KEY === 'string') {
    process.env.STRIPE_SECRET_KEY = originalEnv.STRIPE_SECRET_KEY;
  } else {
    delete process.env.STRIPE_SECRET_KEY;
  }
  if (typeof originalEnv.STRIPE_PUBLISHABLE_KEY === 'string') {
    process.env.STRIPE_PUBLISHABLE_KEY = originalEnv.STRIPE_PUBLISHABLE_KEY;
  } else {
    delete process.env.STRIPE_PUBLISHABLE_KEY;
  }
  if (typeof originalEnv.STRIPE_WEBHOOK_SECRET === 'string') {
    process.env.STRIPE_WEBHOOK_SECRET = originalEnv.STRIPE_WEBHOOK_SECRET;
  } else {
    delete process.env.STRIPE_WEBHOOK_SECRET;
  }
  if (typeof originalEnv.PAYMENT_PROVIDER === 'string') {
    process.env.PAYMENT_PROVIDER = originalEnv.PAYMENT_PROVIDER;
  } else {
    delete process.env.PAYMENT_PROVIDER;
  }
  if (typeof originalEnv.CLOUDFLARE_R2_ACCOUNT_ID === 'string') {
    process.env.CLOUDFLARE_R2_ACCOUNT_ID = originalEnv.CLOUDFLARE_R2_ACCOUNT_ID;
  } else {
    delete process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  }
  if (typeof originalEnv.CLOUDFLARE_R2_ACCESS_KEY_ID === 'string') {
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = originalEnv.CLOUDFLARE_R2_ACCESS_KEY_ID;
  } else {
    delete process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  }
  if (typeof originalEnv.CLOUDFLARE_R2_SECRET_ACCESS_KEY === 'string') {
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = originalEnv.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  } else {
    delete process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  }
  if (typeof originalEnv.CLOUDFLARE_R2_BUCKET === 'string') {
    process.env.CLOUDFLARE_R2_BUCKET = originalEnv.CLOUDFLARE_R2_BUCKET;
  } else {
    delete process.env.CLOUDFLARE_R2_BUCKET;
  }
  if (typeof originalEnv.CLOUDFLARE_R2_ENDPOINT === 'string') {
    process.env.CLOUDFLARE_R2_ENDPOINT = originalEnv.CLOUDFLARE_R2_ENDPOINT;
  } else {
    delete process.env.CLOUDFLARE_R2_ENDPOINT;
  }
}

describe('dependency guard route propagation', () => {
  beforeEach(async () => {
    clearPaymentEnv();
    clearComplianceEnv();
    __dangerousResetDependencyGuardCache();
    await sequelize.sync({ force: true });
  });

  afterAll(() => {
    restoreOriginalEnv();
    __dangerousResetDependencyGuardCache();
  });

  it('returns 503 when compliance locker writes run without storage credentials', async () => {
    const owner = await User.create({
      firstName: 'Compliance',
      lastName: 'Owner',
      email: 'compliance-owner@example.com',
      password: 'hashed-password',
    });

    const response = await request(app)
      .post('/api/compliance/documents')
      .send({
        ownerId: owner.id,
        title: 'Master Services Agreement',
        storagePath: 'compliance/msa.pdf',
      });

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      message: expect.stringContaining('Compliance document storage is unavailable'),
      details: expect.objectContaining({ dependency: 'complianceVault' }),
    });
  });

  it('propagates payments dependency failures through user profile reads', async () => {
    const user = await User.create({
      firstName: 'Wallet',
      lastName: 'Watcher',
      email: 'wallet-watcher@example.com',
      password: 'hashed-password',
    });
    await Profile.create({ userId: user.id, headline: 'Operator' });

    const response = await request(app).get(`/api/users/${user.id}`);

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      message: expect.stringContaining('Payments are currently unavailable'),
      details: expect.objectContaining({ dependency: 'paymentsGateway' }),
    });
  });
});
