import { beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { sequelize } from '../src/models/index.js';
import { appCache } from '../src/utils/cache.js';

jest.setTimeout(30000);

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
