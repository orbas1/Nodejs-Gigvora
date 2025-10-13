import { beforeAll, afterAll, beforeEach, jest } from '@jest/globals';

jest.setTimeout(30000);

if (process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'true') {
  beforeAll(() => {});
  beforeEach(() => {});
  afterAll(() => {});
} else {
  const { sequelize } = await import('../src/models/index.js');
  const { appCache } = await import('../src/utils/cache.js');

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
}
