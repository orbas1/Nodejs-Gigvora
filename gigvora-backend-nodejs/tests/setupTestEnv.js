import { beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { sequelize } from '../src/models/messagingModels.js';
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

jest.setTimeout(30000);

if (process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'true') {
  beforeAll(() => {});
  beforeEach(() => {});
  afterAll(() => {});
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
