import { beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { sequelize } from '../src/models/messagingModels.js';
import { appCache } from '../src/utils/cache.js';
import { markDependencyHealthy } from '../src/lifecycle/runtimeHealth.js';

if (typeof process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'undefined') {
  process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
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

async function loadCoreModels() {
  if (coreModelsLoaded) {
    return;
  }

  await import('../src/models/index.js');
  coreModelsLoaded = true;
}

jest.setTimeout(30000);

if (process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'true') {
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
  });

  beforeEach(async () => {
    appCache.store?.clear?.();
    markCoreDependenciesHealthy();
    await loadCoreModels();
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });
}
