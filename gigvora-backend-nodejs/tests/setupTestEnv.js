import { beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { sequelize } from '../src/models/messagingModels.js';
import { PlatformSetting } from '../src/models/platformSetting.js';
import { markDependencyHealthy } from '../src/lifecycle/runtimeHealth.js';
import { appCache } from '../src/utils/cache.js';
import { markDependencyHealthy } from '../src/lifecycle/runtimeHealth.js';

if (typeof process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'undefined') {
  process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';
}

process.env.STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_dashboard';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dashboard';
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dashboard';
process.env.CLOUDFLARE_R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID || 'r2-account';
process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || 'r2-access';
process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY =
  process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || 'r2-secret';
process.env.CLOUDFLARE_R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET || 'r2-bucket';
process.env.CLOUDFLARE_R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT || 'https://r2.local';

function seedDependencyHealth() {
  markDependencyHealthy('database', { vendor: 'sqlite', configured: true });
  markDependencyHealthy('paymentsCore', { provider: 'test', configured: true });
  markDependencyHealthy('complianceProviders', { vendor: 'test', configured: true });
}

const REQUIRED_ENV_DEFAULTS = {
  STRIPE_PUBLISHABLE_KEY: 'pk_test_mocked',
  STRIPE_SECRET_KEY: 'sk_test_mocked',
  STRIPE_WEBHOOK_SECRET: 'whsec_mocked',
  CLOUDFLARE_R2_ACCOUNT_ID: 'mock-account',
  CLOUDFLARE_R2_ACCESS_KEY_ID: 'mock-access',
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: 'mock-secret',
  CLOUDFLARE_R2_BUCKET: 'mock-bucket',
  CLOUDFLARE_R2_ENDPOINT: 'https://r2.mocked.example.com',
};

Object.entries(REQUIRED_ENV_DEFAULTS).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value;
  }
});

function markCoreDependenciesHealthy() {
  markDependencyHealthy('database', { vendor: 'sqlite', configured: true });
  markDependencyHealthy('paymentsCore', { provider: 'stripe', configured: true });
  markDependencyHealthy('complianceProviders', { custodyProvider: 'stripe', escrowEnabled: false });
}

let coreModelsLoaded = false;

function markCoreDependenciesHealthy() {
  ['database', 'paymentsCore', 'complianceProviders', 'paymentsEngine'].forEach((name) => {
    try {
      markDependencyHealthy(name);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to mark dependency ${name} as healthy in test setup:`, error);
    }
  });
}

async function loadCoreModels() {
  if (coreModelsLoaded) {
    return;
  }

  await import('../src/models/index.js');
  coreModelsLoaded = true;
}

async function ensureTestSchema() {
  await loadCoreModels();
  const queryInterface = sequelize.getQueryInterface();
  await sequelize.sync({ force: true });

  await PlatformSetting.upsert({
    key: 'platform',
    value: {
      commissions: {
        enabled: true,
        rate: 2.5,
        currency: 'USD',
        minimumFee: 0,
        providerControlsServicemanPay: true,
        servicemanMinimumRate: 0,
        servicemanPayoutNotes:
          'Providers remain responsible for compensating their servicemen directly. GigVora captures a 2.5% platform service fee.',
      },
      subscriptions: {
        enabled: true,
        restrictedFeatures: [],
        plans: [],
      },
      payments: {
        provider: 'stripe',
        stripe: {
          publishableKey: 'pk_test_gigvora',
          secretKey: 'sk_test_gigvora',
          webhookSecret: 'whsec_test_gigvora',
          accountId: 'acct_test_gigvora',
        },
        escrow_com: {
          apiKey: 'escrow_test_key',
          apiSecret: 'escrow_test_secret',
          sandbox: true,
        },
      },
      storage: {
        provider: 'cloudflare_r2',
        cloudflare_r2: {
          accountId: 'r2_test_account',
          accessKeyId: 'r2_test_access',
          secretAccessKey: 'r2_test_secret',
          bucket: 'gigvora-test-bucket',
          endpoint: 'https://r2.example.test',
          publicBaseUrl: 'https://cdn.gigvora.test',
        },
      },
      app: {
        name: 'GigVora',
        environment: 'test',
        clientUrl: 'http://localhost:3000',
        apiUrl: 'http://localhost:3001',
      },
      database: {
        url: null,
        host: 'localhost',
        port: 3306,
        name: 'gigvora_test',
        username: 'gigvora',
        password: 'gigvora',
      },
      featureToggles: {
        escrow: true,
        subscriptions: true,
        commissions: true,
      },
      maintenance: {
        windows: [],
        statusPageUrl: null,
        supportContact: 'support@gigvora.com',
      },
    },
  });

  markDependencyHealthy('database', { vendor: sequelize.getDialect(), configured: true });
  markDependencyHealthy('paymentsCore', { provider: 'stripe', configured: true });
  markDependencyHealthy('complianceProviders', { custodyProvider: 'stripe', escrowEnabled: true });
}

jest.setTimeout(30000);
const DEFAULT_TEST_DEPENDENCIES = ['database', 'paymentsCore', 'complianceProviders'];

async function primeDependencyHealth() {
  DEFAULT_TEST_DEPENDENCIES.forEach((dependency) => {
    markDependencyHealthy(dependency, { source: 'test_harness' });
  });

  const PlatformSettingModel = sequelize.models?.PlatformSetting;
  if (!PlatformSettingModel) {
    return;
  }

  const defaults = {
    key: 'platform',
    value: {
      payments: {
        provider: 'stripe',
        stripe: {
          publishableKey: 'pk_test_dummy',
          secretKey: 'sk_test_dummy',
          webhookSecret: 'whsec_dummy',
        },
        escrow_com: {
          apiKey: 'escrow_test_key',
          apiSecret: 'escrow_test_secret',
          sandbox: true,
        },
      },
      storage: {
        provider: 'cloudflare_r2',
        cloudflare_r2: {
          accountId: 'r2_test_account',
          accessKeyId: 'r2_access',
          secretAccessKey: 'r2_secret',
          bucket: 'r2-bucket',
          endpoint: 'https://r2.example.com',
          publicBaseUrl: 'https://cdn.example.com',
        },
      },
    },
  };
if (process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'true') {
  beforeAll(async () => {
    await ensureTestSchema();
  });
  beforeEach(async () => {
    appCache.store?.clear?.();
    await ensureTestSchema();
  beforeAll(() => {
    markCoreDependenciesHealthy();
  });
  beforeEach(() => {
    markCoreDependenciesHealthy();
  });
  afterAll(() => {});
  beforeAll(async () => {
    markCoreDependenciesHealthy();
    await loadCoreModels();
    await sequelize.sync({ force: true });
  });
  beforeEach(async () => {
    markCoreDependenciesHealthy();
    appCache.store?.clear?.();
    await loadCoreModels();
    await sequelize.sync({ force: true });
  });
  afterAll(async () => {
    await sequelize.close();
  });
} else {
  beforeAll(async () => {
    markCoreDependenciesHealthy();
    await loadCoreModels();
    await sequelize.sync({ force: true });
    markCoreDependenciesHealthy();
    seedDependencyHealth();
  });

  beforeEach(async () => {
    appCache.store?.clear?.();
    markCoreDependenciesHealthy();
    await loadCoreModels();
    await sequelize.sync({ force: true });
    markCoreDependenciesHealthy();
    seedDependencyHealth();
  });

  const [setting] = await PlatformSettingModel.findOrCreate({
    where: { key: defaults.key },
    defaults,
  });

  const currentValue = setting.value ?? {};
  const mergedValue = {
    ...currentValue,
    payments: {
      ...defaults.value.payments,
      ...(currentValue.payments ?? {}),
      stripe: {
        ...defaults.value.payments.stripe,
        ...(currentValue.payments?.stripe ?? {}),
      },
      escrow_com: {
        ...defaults.value.payments.escrow_com,
        ...(currentValue.payments?.escrow_com ?? {}),
      },
    },
    storage: {
      ...defaults.value.storage,
      ...(currentValue.storage ?? {}),
      cloudflare_r2: {
        ...defaults.value.storage.cloudflare_r2,
        ...(currentValue.storage?.cloudflare_r2 ?? {}),
      },
    },
  };

  await setting.update({ value: mergedValue });
}

jest.setTimeout(30000);

beforeAll(async () => {
  if (process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'true') {
    await primeDependencyHealth();
    return;
  }

  await loadCoreModels();
  await sequelize.sync({ force: true });
  await primeDependencyHealth();
});

beforeEach(async () => {
  appCache.store?.clear?.();

  if (process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'true') {
    await primeDependencyHealth();
    return;
  }

  await loadCoreModels();
  await sequelize.sync({ force: true });
  await primeDependencyHealth();
});

afterAll(async () => {
  if (process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'true') {
    return;
  }

  await sequelize.close();
});
