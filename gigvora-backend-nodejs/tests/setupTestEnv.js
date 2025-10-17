import { beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { sequelize } from '../src/models/messagingModels.js';
import { appCache } from '../src/utils/cache.js';
import { markDependencyHealthy } from '../src/lifecycle/runtimeHealth.js';

if (typeof process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'undefined') {
  process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
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

jest.setTimeout(30000);

if (process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'true') {
  beforeAll(() => {
    markCoreDependenciesHealthy();
  });
  beforeEach(() => {
    markCoreDependenciesHealthy();
  });
  afterAll(() => {});
} else {
  beforeAll(async () => {
    await loadCoreModels();
    await sequelize.sync({ force: true });
    markCoreDependenciesHealthy();
  });

  beforeEach(async () => {
    appCache.store?.clear?.();
    await loadCoreModels();
    await sequelize.sync({ force: true });
    markCoreDependenciesHealthy();
  });

  afterAll(async () => {
    await sequelize.close();
  });
}
