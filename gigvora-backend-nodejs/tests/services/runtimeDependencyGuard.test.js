process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import { beforeEach, afterAll, describe, it, expect } from '@jest/globals';
import '../setupTestEnv.js';
import { PlatformSetting } from '../../src/models/platformSetting.js';
import { RuntimeAnnouncement } from '../../src/models/runtimeAnnouncement.js';
import {
  refreshPaymentDependencyHealth,
  refreshComplianceDependencyHealth,
  assertPaymentInfrastructureOperational,
  assertComplianceInfrastructureOperational,
  __dangerousResetDependencyGuardCache,
} from '../../src/services/runtimeDependencyGuard.js';
import { ServiceUnavailableError } from '../../src/utils/errors.js';

const loggerStub = {
  info: () => {},
  warn: () => {},
  error: () => {},
};

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

function clearPaymentEnv() {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_PUBLISHABLE_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  process.env.PAYMENT_PROVIDER = 'stripe';
}

function configureStripeEnv() {
  process.env.STRIPE_SECRET_KEY = 'sk_test_dependency_guard';
  process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_dependency_guard';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_dependency_guard';
  process.env.PAYMENT_PROVIDER = 'stripe';
}

function clearStorageEnv() {
  delete process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  delete process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  delete process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  delete process.env.CLOUDFLARE_R2_BUCKET;
  delete process.env.CLOUDFLARE_R2_ENDPOINT;
}

function configureR2Env() {
  process.env.CLOUDFLARE_R2_ACCOUNT_ID = 'acct_dependency_guard';
  process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = 'key_dependency_guard';
  process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = 'secret_dependency_guard';
  process.env.CLOUDFLARE_R2_BUCKET = 'bucket-dependency-guard';
  process.env.CLOUDFLARE_R2_ENDPOINT = 'https://r2.dependency.guard';
}

beforeEach(async () => {
  clearPaymentEnv();
  clearStorageEnv();
  await PlatformSetting.sync({ force: true });
  await RuntimeAnnouncement.sync({ force: true });
  __dangerousResetDependencyGuardCache();
});

afterAll(() => {
  if (originalEnv.STRIPE_SECRET_KEY) {
    process.env.STRIPE_SECRET_KEY = originalEnv.STRIPE_SECRET_KEY;
  } else {
    delete process.env.STRIPE_SECRET_KEY;
  }
  if (originalEnv.STRIPE_PUBLISHABLE_KEY) {
    process.env.STRIPE_PUBLISHABLE_KEY = originalEnv.STRIPE_PUBLISHABLE_KEY;
  } else {
    delete process.env.STRIPE_PUBLISHABLE_KEY;
  }
  if (originalEnv.STRIPE_WEBHOOK_SECRET) {
    process.env.STRIPE_WEBHOOK_SECRET = originalEnv.STRIPE_WEBHOOK_SECRET;
  } else {
    delete process.env.STRIPE_WEBHOOK_SECRET;
  }
  if (originalEnv.PAYMENT_PROVIDER) {
    process.env.PAYMENT_PROVIDER = originalEnv.PAYMENT_PROVIDER;
  } else {
    delete process.env.PAYMENT_PROVIDER;
  }
  if (originalEnv.CLOUDFLARE_R2_ACCOUNT_ID) {
    process.env.CLOUDFLARE_R2_ACCOUNT_ID = originalEnv.CLOUDFLARE_R2_ACCOUNT_ID;
  } else {
    delete process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  }
  if (originalEnv.CLOUDFLARE_R2_ACCESS_KEY_ID) {
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = originalEnv.CLOUDFLARE_R2_ACCESS_KEY_ID;
  } else {
    delete process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  }
  if (originalEnv.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = originalEnv.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  } else {
    delete process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  }
  if (originalEnv.CLOUDFLARE_R2_BUCKET) {
    process.env.CLOUDFLARE_R2_BUCKET = originalEnv.CLOUDFLARE_R2_BUCKET;
  } else {
    delete process.env.CLOUDFLARE_R2_BUCKET;
  }
  if (originalEnv.CLOUDFLARE_R2_ENDPOINT) {
    process.env.CLOUDFLARE_R2_ENDPOINT = originalEnv.CLOUDFLARE_R2_ENDPOINT;
  } else {
    delete process.env.CLOUDFLARE_R2_ENDPOINT;
  }
});

describe('runtimeDependencyGuard', () => {
  it('reports payment credential gaps', async () => {
    const snapshot = await refreshPaymentDependencyHealth({ forceRefresh: true, logger: loggerStub });
    expect(snapshot.status).toBe('error');
    expect(snapshot.reason).toContain('Missing payment credentials');
    await expect(
      assertPaymentInfrastructureOperational({ forceRefresh: true, logger: loggerStub }),
    ).rejects.toBeInstanceOf(ServiceUnavailableError);
  });

  it('marks payments healthy when provider configured', async () => {
    configureStripeEnv();
    const snapshot = await refreshPaymentDependencyHealth({ forceRefresh: true, logger: loggerStub });
    expect(snapshot.status).toBe('ok');
    expect(snapshot.provider).toBe('stripe');
  });

  it('degrades payments when maintenance blocks finance workflows', async () => {
    configureStripeEnv();
    await RuntimeAnnouncement.sync();
    const announcement = await RuntimeAnnouncement.create({
      slug: 'payments-window',
      title: 'Payments provider maintenance',
      message: 'Stripe is in maintenance mode',
      severity: 'maintenance',
      status: 'active',
      audiences: ['operations'],
      channels: ['api'],
      startsAt: new Date(Date.now() - 5 * 60 * 1000),
      endsAt: new Date(Date.now() + 60 * 60 * 1000),
      metadata: { blocks: ['payments'] },
    });

    const snapshot = await refreshPaymentDependencyHealth({ forceRefresh: true, logger: loggerStub });
    expect(snapshot.status).toBe('degraded');
    expect(snapshot.blockingAnnouncements).toContain(announcement.slug);
    await expect(
      assertPaymentInfrastructureOperational({ forceRefresh: true, logger: loggerStub }),
    ).rejects.toBeInstanceOf(ServiceUnavailableError);
  });

  it('reports compliance storage credential gaps', async () => {
    const snapshot = await refreshComplianceDependencyHealth({ forceRefresh: true, logger: loggerStub });
    expect(snapshot.status).toBe('error');
    expect(snapshot.reason).toContain('Missing compliance storage credentials');
    await expect(
      assertComplianceInfrastructureOperational({ forceRefresh: true, logger: loggerStub }),
    ).rejects.toBeInstanceOf(ServiceUnavailableError);
  });

  it('marks compliance storage healthy when configured', async () => {
    configureR2Env();
    const snapshot = await refreshComplianceDependencyHealth({ forceRefresh: true, logger: loggerStub });
    expect(snapshot.status).toBe('ok');
    expect(snapshot.provider).toBe('cloudflare_r2');
  });

  it('degrades compliance workflows when maintenance blocks documents', async () => {
    configureR2Env();
    await RuntimeAnnouncement.sync();
    const announcement = await RuntimeAnnouncement.create({
      slug: 'compliance-maintenance',
      title: 'Compliance locker maintenance',
      message: 'Compliance vault in read-only mode',
      severity: 'maintenance',
      status: 'active',
      audiences: ['operations'],
      channels: ['api'],
      startsAt: new Date(Date.now() - 10 * 60 * 1000),
      endsAt: new Date(Date.now() + 30 * 60 * 1000),
      metadata: { blocks: ['compliance'] },
    });

    const snapshot = await refreshComplianceDependencyHealth({ forceRefresh: true, logger: loggerStub });
    expect(snapshot.status).toBe('degraded');
    expect(snapshot.blockingAnnouncements).toContain(announcement.slug);
    await expect(
      assertComplianceInfrastructureOperational({ forceRefresh: true, logger: loggerStub }),
    ).rejects.toBeInstanceOf(ServiceUnavailableError);
  });
});
