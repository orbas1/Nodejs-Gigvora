import { beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { sequelize } from '../src/models/messagingModels.js';
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
  beforeAll(() => {});
  beforeEach(() => {});
  afterAll(() => {});
} else {
  beforeAll(async () => {
    await loadCoreModels();
    await sequelize.sync({ force: true });
    seedDependencyHealth();
  });

  beforeEach(async () => {
    appCache.store?.clear?.();
    await loadCoreModels();
    await sequelize.sync({ force: true });
    seedDependencyHealth();
  });

  afterAll(async () => {
    await sequelize.close();
  });
}
