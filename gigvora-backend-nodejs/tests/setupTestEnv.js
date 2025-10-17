import { beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { sequelize } from '../src/models/messagingModels.js';
import { PlatformSetting } from '../src/models/platformSetting.js';
import { markDependencyHealthy } from '../src/lifecycle/runtimeHealth.js';
import { appCache } from '../src/utils/cache.js';

if (typeof process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'undefined') {
  process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
}

let coreModelsLoaded = false;

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

if (process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'true') {
  beforeAll(async () => {
    await ensureTestSchema();
  });
  beforeEach(async () => {
    appCache.store?.clear?.();
    await ensureTestSchema();
  });
  afterAll(async () => {
    await sequelize.close();
  });
} else {
  beforeAll(async () => {
    await loadCoreModels();
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    appCache.store?.clear?.();
    await loadCoreModels();
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });
}
