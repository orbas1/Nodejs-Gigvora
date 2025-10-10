import { beforeAll, afterAll, beforeEach } from '@jest/globals';
import { sequelize } from '../src/models/index.js';
import { appCache } from '../src/utils/cache.js';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  appCache.store?.clear?.();
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});
