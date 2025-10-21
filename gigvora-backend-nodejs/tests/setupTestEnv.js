import { beforeAll, beforeEach, afterAll, jest } from '@jest/globals';
import sequelize from '../src/models/sequelizeClient.js';
import { PlatformSetting } from '../src/models/platformSetting.js';
import { markDependencyHealthy } from '../src/lifecycle/runtimeHealth.js';
import { appCache } from '../src/utils/cache.js';

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

function ensureEnvironmentDefaults() {
  if (typeof process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'undefined') {
    process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';
  }

  Object.entries(REQUIRED_ENV_DEFAULTS).forEach(([key, value]) => {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

function markCoreDependenciesHealthy() {
  ['database', 'paymentsCore', 'complianceProviders', 'paymentsEngine'].forEach((dependency) => {
    try {
      markDependencyHealthy(dependency, { source: 'test-harness', configured: true });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to flag dependency ${dependency} as healthy during test bootstrap`, error);
    }
  });
}

let modelsLoaded = false;
async function loadCoreModels() {
  if (modelsLoaded) {
    return;
  }
  const minimalAdminBootstrap = process.env.ADMIN_MANAGEMENT_MINIMAL_BOOTSTRAP === 'true';
  if (process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'true') {
    if (minimalAdminBootstrap) {
      await import('../src/models/adminManagementModels.js');
      await import('../src/models/rbacPolicyAuditEvent.js');
    } else {
      await import('../src/models/messagingModels.js');
      await import('../src/models/moderationModels.js');
      await import('../src/models/liveServiceTelemetryModels.js');
      await import('../src/models/adminManagementModels.js');
      await import('../src/models/rbacPolicyAuditEvent.js');
    }
    modelsLoaded = true;
    return;
  }
  try {
    await import('../src/models/index.js');
    modelsLoaded = true;
  } catch (error) {
    if (error instanceof SyntaxError) {
      // eslint-disable-next-line no-console
      console.warn('[tests] Falling back to targeted model bootstrap due to syntax error in aggregated model index.');
      if (minimalAdminBootstrap) {
        await import('../src/models/adminManagementModels.js');
        await import('../src/models/rbacPolicyAuditEvent.js');
      } else {
        await Promise.all([
          import('../src/models/messagingModels.js'),
          import('../src/models/moderationModels.js'),
          import('../src/models/liveServiceTelemetryModels.js'),
          import('../src/models/adminManagementModels.js'),
        ]);
        await import('../src/models/rbacPolicyAuditEvent.js');
      }
      modelsLoaded = true;
      return;
    }
    throw error;
  }
}

async function resetDatabaseSchema() {
  await loadCoreModels();
  await sequelize.sync({ force: true });
}

async function seedPlatformDefaults() {
  const defaults = {
    key: 'platform',
    value: {
      payments: {
        provider: 'stripe',
        stripe: {
          publishableKey: 'pk_test_gigvora',
          secretKey: 'sk_test_gigvora',
          webhookSecret: 'whsec_test_gigvora',
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
      maintenance: {
        windows: [],
        statusPageUrl: null,
        supportContact: 'support@gigvora.com',
      },
    },
  };

  await PlatformSetting.findOrCreate({
    where: { key: defaults.key },
    defaults,
  });
}

async function primeTestState() {
  ensureEnvironmentDefaults();
  markCoreDependenciesHealthy();
  await resetDatabaseSchema();
  await seedPlatformDefaults();
  markCoreDependenciesHealthy();
}

jest.setTimeout(30_000);
const skipBootstrap = process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'true';

beforeAll(async () => {
  ensureEnvironmentDefaults();
  if (skipBootstrap) {
    // eslint-disable-next-line no-console
    console.info('[tests] SKIP_SEQUELIZE_BOOTSTRAP enabled – skipping Sequelize sync for realtime-focused suites');
    await resetDatabaseSchema();
    markCoreDependenciesHealthy();
  } else {
    await primeTestState();
  }
});

beforeEach(async () => {
  appCache.store?.clear?.();
  if (skipBootstrap) {
    await resetDatabaseSchema();
    markCoreDependenciesHealthy();
  } else {
    await primeTestState();
  }
});

afterAll(async () => {
  await sequelize.close();
});
